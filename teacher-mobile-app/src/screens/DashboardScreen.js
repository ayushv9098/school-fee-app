import React, { useEffect, useState, useRef } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, Alert, 
  ScrollView, ActivityIndicator, Image, Modal, 
  TextInput, Dimensions, SafeAreaView, Platform
} from 'react-native';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { 
  Home, History as HistoryIcon, User, 
  MapPin, Camera, LogOut, CheckCircle, 
  AlertTriangle, Clock, Calendar as CalendarIcon,
  X, Plus, Sparkles, Navigation, ChevronRight, Loader2, GraduationCap
} from 'lucide-react-native';
import dayjs from 'dayjs';
import { supabase } from '../lib/supabase';

const { width } = Dimensions.get('window');
const LOCATION_TASK_NAME = 'background-location-task';

// --- Background Task ---
TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
  if (error) return;
  if (data) {
    const { locations } = data;
    const currentLocation = locations[0].coords;
    
    // Get user session
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    // Fetch teacher record
    const { data: teacher } = await supabase
      .from('teachers')
      .select('*')
      .eq('auth_user_id', session.user.id)
      .single();
    
    if (!teacher) return;

    // Fetch school settings
    const { data: schoolSettings } = await supabase
      .from('school_settings')
      .select('*')
      .eq('user_id', teacher.user_id)
      .single();

    if (!schoolSettings) return;

    // Check if shift is active today
    const today = dayjs().format('YYYY-MM-DD');
    const { data: todayRecord } = await supabase
      .from('attendance')
      .select('*')
      .eq('teacher_id', teacher.id)
      .eq('date', today)
      .maybeSingle();

    if (todayRecord && !todayRecord.check_out_time) {
      // 1. Update live location
      await supabase.from('attendance').update({
        last_lat: currentLocation.latitude,
        last_lng: currentLocation.longitude
      }).eq('id', todayRecord.id);

      // 2. Geofence logic
      const calculateDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371e3;
        const phi1 = lat1 * Math.PI/180;
        const phi2 = lat2 * Math.PI/180;
        const dPhi = (lat2-lat1) * Math.PI/180;
        const dLambda = (lon2-lon1) * Math.PI/180;
        const a = Math.sin(dPhi/2) * Math.sin(dPhi/2) +
                Math.cos(phi1) * Math.cos(phi2) *
                Math.sin(dLambda/2) * Math.sin(dLambda/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
      };

      const dist = calculateDistance(
        currentLocation.latitude, currentLocation.longitude,
        schoolSettings.lat, schoolSettings.lng
      );
      const radius = schoolSettings.radius || 100;
      const isOutside = dist > radius;

      // Detect Movement
      const { data: movement } = await supabase
        .from('staff_movements')
        .select('*')
        .eq('attendance_id', todayRecord.id)
        .is('return_time', null)
        .maybeSingle();

      if (isOutside && !movement) {
        // Mark as Exit
        await supabase.from('staff_movements').insert({
          attendance_id: todayRecord.id,
          teacher_id: teacher.id,
          exit_lat: currentLocation.latitude,
          exit_lng: currentLocation.longitude,
          is_outside: true
        });

        await supabase.from('notifications').insert({
          user_id: teacher.user_id,
          type: 'temporary_exit',
          title: 'Staff Outside School',
          message: `${teacher.name} has moved outside school boundaries at ${dayjs().format('hh:mm A')}.`
        });
      } else if (!isOutside && movement) {
        // Mark as Return
        await supabase.from('staff_movements').update({
          return_time: new Date().toISOString(),
          return_lat: currentLocation.latitude,
          return_lng: currentLocation.longitude,
          is_outside: false
        }).eq('id', movement.id);

        await supabase.from('notifications').insert({
          user_id: teacher.user_id,
          type: 'staff_returned',
          title: 'Staff Returned',
          message: `${teacher.name} returned to school at ${dayjs().format('hh:mm A')}.`
        });
      }
    }
  }
});

export default function DashboardScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState('attendance');
  const [teacher, setTeacher] = useState(null);
  const [schoolSettings, setSchoolSettings] = useState(null);
  const [todayRecord, setTodayRecord] = useState(null);
  const [monthlyAttendance, setMonthlyAttendance] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Camera & Step State
  const [step, setStep] = useState('init'); // init, camera, preview, done
  const [selfie, setSelfie] = useState(null);
  const [coords, setCoords] = useState(null);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const cameraRef = useRef(null);

  // Leave Modal State
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [leaveData, setLeaveData] = useState({
    type: 'full',
    startDate: dayjs().format('YYYY-MM-DD'),
    endDate: dayjs().format('YYYY-MM-DD'),
    reason: ''
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigation.replace('Login');
        return;
      }

      // 1. Teacher
      const { data: teacherData } = await supabase
        .from('teachers')
        .select('*')
        .eq('auth_user_id', session.user.id)
        .single();
      
      if (!teacherData) throw new Error('Teacher record not found');
      setTeacher(teacherData);

      // 2. School Settings
      const { data: settings } = await supabase
        .from('school_settings')
        .select('*')
        .eq('user_id', teacherData.user_id)
        .single();
      setSchoolSettings(settings);

      // 3. Today's Record
      const today = dayjs().format('YYYY-MM-DD');
      const { data: todayRec } = await supabase
        .from('attendance')
        .select('*')
        .eq('teacher_id', teacherData.id)
        .eq('date', today)
        .maybeSingle();
      setTodayRecord(todayRec);
      if (todayRec) setStep('done');

      // 4. Monthly Stats & History
      const startOfMonth = dayjs().startOf('month').format('YYYY-MM-DD');
      const { data: monthlyData } = await supabase
        .from('attendance')
        .select('*')
        .eq('teacher_id', teacherData.id)
        .gte('date', startOfMonth)
        .order('date', { ascending: false });
      setMonthlyAttendance(monthlyData || []);

      // 5. Leaves
      const { data: leavesData } = await supabase
        .from('leaves')
        .select('*')
        .eq('teacher_id', teacherData.id)
        .order('created_at', { ascending: false });
      setLeaves(leavesData || []);

      // Start background tracking if shift active
      if (todayRec && !todayRec.check_out_time) {
        startBackgroundTracking();
      }

    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const startBackgroundTracking = async () => {
    const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
    if (foregroundStatus !== 'granted') return;
    
    const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
    if (backgroundStatus !== 'granted') return;

    const isStarted = await TaskManager.isTaskRegisteredAsync(LOCATION_TASK_NAME);
    if (!isStarted) {
      await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 60000,
        distanceInterval: 50,
        showsBackgroundLocationIndicator: true,
      });
    }
  };

  const stopBackgroundTracking = async () => {
    const isStarted = await TaskManager.isTaskRegisteredAsync(LOCATION_TASK_NAME);
    if (isStarted) {
      await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
    }
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3;
    const phi1 = lat1 * Math.PI/180;
    const phi2 = lat2 * Math.PI/180;
    const dPhi = (lat2-lat1) * Math.PI/180;
    const dLambda = (lon2-lon1) * Math.PI/180;
    const a = Math.sin(dPhi/2) * Math.sin(dPhi/2) +
            Math.cos(phi1) * Math.cos(phi2) *
            Math.sin(dLambda/2) * Math.sin(dLambda/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const handleMarkAttendance = async () => {
    setActionLoading(true);
    setError('');
    
    try {
      // 1. Check if location services are enabled
      const enabled = await Location.hasServicesEnabledAsync();
      if (!enabled) {
        setError('Please enable GPS/Location in settings');
        setActionLoading(false);
        return;
      }

      // 2. Request permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Location permission denied. Please allow in settings.');
        setActionLoading(false);
        return;
      }

      // 3. Get current position with [V4] Retry Logic
      let position;
      const getLocation = async (retryCount = 0) => {
        try {
          console.log(`Attempting to get location [v4] (Try: ${retryCount + 1})...`);
          
          // Try last known first (if very fresh < 2 mins)
          if (retryCount === 0) {
            const lastKnown = await Location.getLastKnownPositionAsync({ maxAge: 120000 });
            if (lastKnown) return lastKnown;
          }

          // Fresh fetch with timeout
          return await Promise.race([
            Location.getCurrentPositionAsync({ 
              accuracy: Location.Accuracy.Balanced,
              mayShowUserSettingsDialog: true 
            }),
            new Promise((_, reject) => setTimeout(() => reject(new Error('GPS Timeout')), 15000))
          ]);
        } catch (err) {
          if (retryCount < 1) { // Retry once
            console.log('Retry 1 starting...');
            await new Promise(r => setTimeout(r, 2000));
            return getLocation(retryCount + 1);
          }
          throw err;
        }
      };

      try {
        position = await getLocation();
      } catch (finalErr) {
        console.log('Final location fetch failed:', finalErr);
        const providerStatus = await Location.getProviderStatusAsync();
        const msg = `GPS ERROR [V4]: ${finalErr.message}\n\n` +
                    `Status: GPS(${providerStatus.gpsEnabled ? 'ON' : 'OFF'}) ` +
                    `Net(${providerStatus.networkEnabled ? 'ON' : 'OFF'})\n\n` +
                    `FIX: 1. Set Location to 'PRECISE' in Phone Settings.\n` +
                    `2. Turn OFF Power Saver.\n` +
                    `3. Open Google Maps for 5 sec, then try here.`;
        setError(msg);
        Alert.alert('Location Signal Weak', msg);
        setActionLoading(false);
        return;
      }

      const { latitude, longitude } = position.coords;

      if (!schoolSettings?.lat || !schoolSettings?.lng) {
        const msg = 'School location missing in database. Please ask admin to set school location.';
        setError(msg);
        Alert.alert('Settings Error', msg);
        setActionLoading(false);
        return;
      }

      const dist = calculateDistance(latitude, longitude, schoolSettings.lat, schoolSettings.lng);
      const radius = schoolSettings.radius || 100;

      if (dist > radius) {
        const msg = `Too far from school (${Math.round(dist)}m). You must be within ${radius}m.`;
        setError(msg);
        Alert.alert('Geofence Error', msg);
        setActionLoading(false);
        return;
      }

      setCoords({ latitude, longitude });
      setStep('camera');
    } catch (err) {
      console.error(err);
      setError('GPS Error. Please restart the app.');
    } finally {
      setActionLoading(false);
    }
  };

  const takeSelfie = async () => {
    if (!cameraPermission?.granted) {
      const { granted } = await requestCameraPermission();
      if (!granted) return;
    }

    if (cameraRef.current) {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.5 });
      setSelfie(photo.uri);
      setStep('preview');
    }
  };

  const handleSubmitAttendance = async () => {
    setActionLoading(true);
    setError('');
    console.log('--- Starting Attendance Submission [V5] ---');
    
    try {
      if (!selfie) {
        Alert.alert('Error [V5]', 'Selfie not found. Please retake.');
        return;
      }
      
      // 1. Prepare File for Upload (Native RN Way)
      console.log('Step 1: Preparing file object...');
      const fileName = `${teacher.id}_${dayjs().format('YYYY-MM-DD_HH-mm-ss')}.jpg`;
      const filePath = `selfies/${fileName}`;
      
      // In React Native, we don't need a real Blob, we use this object structure
      const fileBody = {
        uri: selfie,
        name: fileName,
        type: 'image/jpeg',
      };
      
      // 2. Upload to Storage
      console.log('Step 2: Uploading to Supabase Storage [V5]...');
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('attendance-selfies')
        .upload(filePath, fileBody, { 
          contentType: 'image/jpeg',
          upsert: true 
        });
      
      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        throw new Error(`Upload Failed [V5]: ${uploadError.message}`);
      }
      console.log('Upload successful:', uploadData);

      // 3. Database Insert
      console.log('Step 3: Inserting attendance record...');
      const now = dayjs();
      const startTimeStr = schoolSettings?.school_start_time || '09:30:00';
      const startTime = dayjs(`${now.format('YYYY-MM-DD')} ${startTimeStr}`);
      const isLate = now.isAfter(startTime);

      const attendanceData = {
        teacher_id: teacher.id,
        admin_id: teacher.user_id,
        admin_user_id: teacher.user_id,
        date: now.format('YYYY-MM-DD'),
        check_in_time: now.toISOString(),
        check_in_lat: coords.latitude,
        check_in_lng: coords.longitude,
        selfie_url: filePath,
        status: isLate ? 'late' : 'present',
        late_entry: isLate
      };

      const { data: record, error: dbError } = await supabase
        .from('attendance')
        .insert(attendanceData)
        .select()
        .maybeSingle();

      if (dbError) {
        console.error('Database insert error:', dbError);
        throw new Error(`Database Fail [V5]: ${dbError.message}`);
      }
      console.log('Attendance record created:', record);

      // 4. Notification (Optional)
      try {
        if (isLate) {
          await supabase.from('notifications').insert({
            user_id: teacher.user_id,
            type: 'late_attendance',
            title: 'Late Attendance',
            message: `${teacher.name} checked in late at ${now.format('hh:mm A')}.`
          });
        }
      } catch (notifErr) {
        console.warn('Notification failed but attendance was marked:', notifErr);
      }

      setTodayRecord(record);
      setStep('done');
      startBackgroundTracking();
      fetchInitialData(); 
      Alert.alert('Success [V5]', 'Attendance marked successfully!');

    } catch (err) {
      console.error('Submission Catch-All [V5]:', err);
      const errorMsg = err.message || 'Unknown network error';
      setError(errorMsg);
      Alert.alert('Submission Error [V5]', errorMsg);
    } finally {
      setActionLoading(false);
      console.log('--- Submission Process Finished [V5] ---');
    }
  };

  const handleCheckOut = async () => {
    setActionLoading(true);
    try {
      let position;
      try {
        position = await Promise.race([
          Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
          new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 10000))
        ]);
      } catch (locErr) {
        position = await Location.getLastKnownPositionAsync({ maxAge: 600000 });
        if (!position) {
          Alert.alert('GPS Error', 'Could not get location for check-out. Try moving to an open area.');
          return;
        }
      }

      const { latitude, longitude } = position.coords;
      const dist = calculateDistance(latitude, longitude, schoolSettings.lat, schoolSettings.lng);
      const radius = schoolSettings.radius || 100;

      if (dist > radius) {
        Alert.alert('Too Far', `You are ${Math.round(dist)}m away from school. Must be within ${radius}m.`);
        return;
      }

      const now = dayjs();
      const endTimeStr = schoolSettings?.school_end_time || '15:40:00';
      const endTime = dayjs(`${now.format('YYYY-MM-DD')} ${endTimeStr}`);
      const isEarlyExit = now.isBefore(endTime);

      const { error: dbError } = await supabase
        .from('attendance')
        .update({
          check_out_time: now.toISOString(),
          check_out_lat: latitude,
          check_out_lng: longitude,
          early_exit: isEarlyExit
        })
        .eq('id', todayRecord.id);

      if (dbError) throw dbError;

      if (isEarlyExit) {
        await supabase.from('notifications').insert({
          user_id: teacher.user_id,
          type: 'early_exit',
          title: 'Early Exit',
          message: `${teacher.name} checked out early at ${now.format('hh:mm A')}.`
        });
      }

      stopBackgroundTracking();
      fetchInitialData();
    } catch (err) {
      Alert.alert('Check-out Error', err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleApplyLeave = async () => {
    if (!leaveData.reason) {
      Alert.alert('Missing Reason', 'Please provide a reason for your leave.');
      return;
    }
    setActionLoading(true);
    try {
      const { error: dbError } = await supabase.from('leaves').insert({
        teacher_id: teacher.id,
        admin_id: teacher.user_id,
        type: leaveData.type,
        start_date: leaveData.startDate,
        end_date: leaveData.type === 'half' ? leaveData.startDate : leaveData.endDate,
        reason: leaveData.reason,
        status: 'pending'
      });

      if (dbError) throw dbError;

      await supabase.from('notifications').insert({
        user_id: teacher.user_id,
        type: 'leave_request',
        title: 'New Leave Request',
        message: `${teacher.name} requested a ${leaveData.type} day leave for ${leaveData.startDate}.`
      });

      setShowLeaveModal(false);
      Alert.alert('Success', 'Leave application submitted.');
      fetchInitialData();
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const executeLogout = async () => {
    console.log('User confirmed logout alert');
    try {
      // 1. Try to stop background tracking
      try {
        console.log('Attempting to stop background tracking...');
        if (Platform.OS !== 'web') {
          await stopBackgroundTracking();
          console.log('Background tracking stopped');
        } else {
           console.log('Background tracking not applicable on web, skipping.');
        }
      } catch (bgError) {
        console.error('Error stopping background tracking:', bgError);
      }

      // 2. Perform Supabase SignOut
      console.log('Calling Supabase signOut...');
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Supabase signOut error:', error);
        Alert.alert('Sign Out Error', error.message);
      } else {
        console.log('Supabase signOut successful');
      }
    } catch (err) {
      console.error('Unexpected logout failure:', err);
      Alert.alert('Error', 'An unexpected error occurred during sign out.');
    } finally {
      console.log('--- Logout Process Completed ---');
    }
  };

  const handleLogout = async () => {
    console.log('--- Logout Process Started ---');
    
    if (Platform.OS === 'web') {
      if (window.confirm("Are you sure you want to sign out?")) {
        await executeLogout();
      } else {
        console.log('Logout cancelled');
      }
      return;
    }

    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out?",
      [
        { text: "Cancel", style: "cancel", onPress: () => console.log('Logout cancelled') },
        { 
          text: "Sign Out", 
          style: "destructive",
          onPress: executeLogout
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7c3aed" />
        <Text style={styles.loadingText}>Fetching your portal...</Text>
      </View>
    );
  }

  const presentCount = monthlyAttendance.filter(a => ['present', 'late', 'half_day'].includes(a.status)).length;
  const lateCount = monthlyAttendance.filter(a => a.status === 'late').length;
  const leaveCount = leaves.filter(l => l.status === 'approved').length;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        
        {/* --- Header --- */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.headerIconBox}>
              <GraduationCap size={20} color="#fff" />
            </View>
            <Text style={styles.headerTitle} numberOfLines={1}>Ayushman Educational Academy</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          {/* --- HOME TAB --- */}
          {activeTab === 'attendance' && (
            <View style={styles.tabView}>
              
              {/* Stats Grid */}
              <View style={styles.statsGrid}>
                <View style={[styles.statCard, { backgroundColor: '#f0fdf4', borderColor: '#dcfce7' }]}>
                  <Text style={[styles.statLabel, { color: '#16a34a' }]}>Present</Text>
                  <Text style={[styles.statValue, { color: '#166534' }]}>{presentCount}</Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: '#fffbeb', borderColor: '#fef3c7' }]}>
                  <Text style={[styles.statLabel, { color: '#d97706' }]}>Late</Text>
                  <Text style={[styles.statValue, { color: '#92400e' }]}>{lateCount}</Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: '#f5f3ff', borderColor: '#ede9fe' }]}>
                  <Text style={[styles.statLabel, { color: '#7c3aed' }]}>Leaves</Text>
                  <Text style={[styles.statValue, { color: '#5b21b6' }]}>{leaveCount}</Text>
                </View>
              </View>

              {/* Time Card */}
              <View style={styles.timeCard}>
                <View style={styles.timeHeader}>
                  <View style={styles.flexRow}>
                    <CalendarIcon size={14} color="#ddd6fe" />
                    <Text style={styles.timeDate}>{dayjs().format('ddd, DD MMM')}</Text>
                  </View>
                  <View style={styles.liveBadge}><Text style={styles.liveBadgeText}>LIVE TIME</Text></View>
                </View>
                <Text style={styles.timeLarge}>
                  {dayjs().format('hh:mm')}
                  <Text style={styles.timeAmPm}> {dayjs().format('A')}</Text>
                </Text>
              </View>

              {/* Attendance Card */}
              <View style={styles.mainCard}>
                {step === 'init' && (
                  <View style={styles.centerContent}>
                    <View style={styles.iconCircle}><MapPin size={32} color="#7c3aed" /></View>
                    <Text style={styles.cardTitle}>Daily Check-in</Text>
                    <Text style={styles.cardDesc}>Verify location and snap a selfie to mark attendance.</Text>
                    <TouchableOpacity 
                      style={styles.primaryButton} 
                      onPress={handleMarkAttendance}
                      disabled={actionLoading}
                    >
                      {actionLoading ? <ActivityIndicator color="#fff" /> : <><Navigation size={18} color="#fff" /><Text style={styles.primaryButtonText}>Check-in Now</Text></>}
                    </TouchableOpacity>
                    {error ? <Text style={styles.errorText}>{error}</Text> : null}
                  </View>
                )}

                {step === 'camera' && (
                  <View style={styles.cameraContainer}>
                    <CameraView style={styles.camera} facing="front" ref={cameraRef}>
                      <View style={styles.cameraOverlay}>
                        <View style={styles.faceGuide} />
                      </View>
                    </CameraView>
                    <TouchableOpacity style={styles.captureButton} onPress={takeSelfie}>
                      <Camera size={28} color="#7c3aed" />
                    </TouchableOpacity>
                  </View>
                )}

                {step === 'preview' && (
                  <View style={styles.previewContainer}>
                    <Image source={{ uri: selfie }} style={styles.previewImage} />
                    <View style={styles.flexRowGap}>
                      <TouchableOpacity style={styles.secondaryButton} onPress={() => setStep('camera')}>
                        <Text style={styles.secondaryButtonText}>Retake</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[styles.primaryButton, { flex: 2 }]} 
                        onPress={handleSubmitAttendance}
                        disabled={actionLoading}
                      >
                        {actionLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Submit</Text>}
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {step === 'done' && (
                  <View style={styles.doneContainer}>
                    <View style={[styles.statusBanner, { backgroundColor: todayRecord?.status === 'late' ? '#f59e0b' : '#10b981' }]}>
                      {todayRecord?.status === 'late' ? <AlertTriangle size={16} color="#fff" /> : <CheckCircle size={16} color="#fff" />}
                      <Text style={styles.statusBannerText}>{todayRecord?.status === 'late' ? 'Late Check-in' : 'Attendance Verified'}</Text>
                    </View>
                    
                    <View style={styles.donePadded}>
                      {!todayRecord?.check_out_time && (
                        <View style={styles.trackingBadge}>
                          <MapPin size={12} color="#7c3aed" />
                          <Text style={styles.trackingBadgeText}>LIVE TRACKING ACTIVE</Text>
                        </View>
                      )}

                      <View style={styles.timeRow}>
                        <View style={styles.timeInfo}>
                          <Text style={styles.timeInfoLabel}>Checked In</Text>
                          <Text style={styles.timeInfoValue}>{dayjs(todayRecord?.check_in_time).format('hh:mm A')}</Text>
                        </View>
                        {todayRecord?.check_out_time && (
                          <View style={styles.timeInfo}>
                            <Text style={styles.timeInfoLabel}>Checked Out</Text>
                            <Text style={styles.timeInfoValue}>{dayjs(todayRecord?.check_out_time).format('hh:mm A')}</Text>
                          </View>
                        )}
                      </View>

                      {todayRecord?.selfie_url && (
                        <View style={styles.selfieWrapper}>
                          <Image 
                            source={{ uri: supabase.storage.from('attendance-selfies').getPublicUrl(todayRecord.selfie_url).data.publicUrl }} 
                            style={styles.smallSelfie}
                          />
                        </View>
                      )}

                      {!todayRecord?.check_out_time ? (
                        <TouchableOpacity 
                          style={styles.checkoutButton} 
                          onPress={handleCheckOut}
                          disabled={actionLoading}
                        >
                          {actionLoading ? <ActivityIndicator color="#fff" /> : <><LogOut size={18} color="#fff" /><Text style={styles.primaryButtonText}>Check-out Now</Text></>}
                        </TouchableOpacity>
                      ) : (
                        <View style={styles.shiftDoneCard}>
                          <Text style={styles.shiftDoneText}>Shift Completed</Text>
                          {todayRecord.early_exit && <Text style={styles.earlyExitText}>Flagged: Early Exit</Text>}
                        </View>
                      )}
                    </View>
                  </View>
                )}
              </View>

              {/* Quick Actions */}
              <View style={styles.actionsCard}>
                <View style={styles.actionsHeader}>
                  <View style={styles.iconBox}><Sparkles size={20} color="#7c3aed" /></View>
                  <View>
                    <Text style={styles.actionsTitle}>Quick Actions</Text>
                    <Text style={styles.actionsSubtitle}>Need a leave or half-day?</Text>
                  </View>
                </View>
                <View style={styles.actionsGrid}>
                  <TouchableOpacity style={styles.actionBtn} onPress={() => { setLeaveData({...leaveData, type: 'full'}); setShowLeaveModal(true); }}>
                    <View style={styles.actionIconCircle}><CalendarIcon size={22} color="#a1a1aa" /></View>
                    <Text style={styles.actionBtnLabel}>Full Leave</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionBtn} onPress={() => { setLeaveData({...leaveData, type: 'half'}); setShowLeaveModal(true); }}>
                    <View style={styles.actionIconCircle}><Clock size={22} color="#a1a1aa" /></View>
                    <Text style={styles.actionBtnLabel}>Half Day</Text>
                  </TouchableOpacity>
                </View>
              </View>

            </View>
          )}

          {/* --- HISTORY TAB --- */}
          {activeTab === 'history' && (
            <View style={styles.tabView}>
              <Text style={styles.sectionTitle}>Leave Applications</Text>
              {leaves.length === 0 ? (
                <View style={styles.emptyCard}><Text style={styles.emptyText}>No leave history</Text></View>
              ) : (
                leaves.map(l => (
                  <View key={l.id} style={styles.logCard}>
                    <View style={styles.logRow}>
                      <View>
                        <Text style={styles.logMain}>{dayjs(l.start_date).format('DD MMM')} {l.type === 'full' ? `- ${dayjs(l.end_date).format('DD MMM')}` : ''}</Text>
                        <Text style={styles.logSub}>{l.type.charAt(0).toUpperCase() + l.type.slice(1)} Day Leave</Text>
                      </View>
                      <View style={[styles.badge, { backgroundColor: l.status === 'approved' ? '#dcfce7' : l.status === 'pending' ? '#fef3c7' : '#fee2e2' }]}>
                        <Text style={[styles.badgeText, { color: l.status === 'approved' ? '#15803d' : l.status === 'pending' ? '#b45309' : '#b91c1c' }]}>{l.status.toUpperCase()}</Text>
                      </View>
                    </View>
                    <View style={styles.logReason}><Text style={styles.reasonText} numberOfLines={2}>"{l.reason}"</Text></View>
                  </View>
                ))
              )}

              <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Attendance Activity</Text>
              {monthlyAttendance.length === 0 ? (
                <View style={styles.emptyCard}><Text style={styles.emptyText}>No records found</Text></View>
              ) : (
                monthlyAttendance.map(item => (
                  <View key={item.id} style={styles.activityCard}>
                    <View style={styles.activityLeft}>
                      <View style={styles.miniAvatar}>
                        {item.selfie_url ? (
                          <Image source={{ uri: supabase.storage.from('attendance-selfies').getPublicUrl(item.selfie_url).data.publicUrl }} style={styles.fullImage} />
                        ) : <User size={16} color="#ccc" />}
                      </View>
                      <View>
                        <Text style={styles.activityDate}>{dayjs(item.date).format('DD MMM YYYY')}</Text>
                        <View style={styles.flexRow}>
                          <Text style={styles.activityTime}>{dayjs(item.check_in_time).format('hh:mm A')}</Text>
                          <View style={[styles.miniBadge, { backgroundColor: item.status === 'present' ? '#f0fdf4' : item.status === 'late' ? '#fffbeb' : '#f5f3ff' }]}>
                            <Text style={[styles.miniBadgeText, { color: item.status === 'present' ? '#16a34a' : item.status === 'late' ? '#d97706' : '#7c3aed' }]}>{item.status}</Text>
                          </View>
                        </View>
                      </View>
                    </View>
                    <Text style={styles.verifiedText}>Verified</Text>
                  </View>
                ))
              )}
            </View>
          )}

          {/* --- PROFILE TAB --- */}
          {activeTab === 'profile' && (
            <View style={styles.tabView}>
              <View style={styles.profileCard}>
                <View style={styles.profileBanner} />
                <View style={styles.profileInfo}>
                  <View style={styles.profileAvatar}>
                    <User size={40} color="#7c3aed" />
                  </View>
                  <Text style={styles.profileName}>{teacher?.name}</Text>
                  <Text style={styles.profileSub}>{teacher?.subject} Specialist</Text>
                  
                  <View style={styles.profileRows}>
                    <View style={styles.profileRow}>
                      <Text style={styles.rowLabel}>Salary</Text>
                      <Text style={styles.rowValue}>₹{teacher?.monthly_salary?.toLocaleString('en-IN')}</Text>
                    </View>
                    <View style={styles.profileRow}>
                      <Text style={styles.rowLabel}>Joined</Text>
                      <Text style={styles.rowValue}>{dayjs(teacher?.created_at).format('MMM YYYY')}</Text>
                    </View>
                    <View style={styles.profileRow}>
                      <Text style={styles.rowLabel}>Email</Text>
                      <Text style={styles.rowValue} numberOfLines={1}>{teacher?.email}</Text>
                    </View>
                  </View>

                  <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                    <LogOut size={18} color="#dc2626" />
                    <Text style={styles.logoutBtnText}>Sign Out Account</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <Text style={[styles.profileFooterText, { marginTop: 60 }]}>
                Designed & Developed by AV Infra
              </Text>
            </View>
          )}

        </ScrollView>

        {/* --- Bottom Nav --- */}
        <View style={styles.bottomNav}>
          {[
            { id: 'history', label: 'Log', icon: HistoryIcon },
            { id: 'attendance', label: 'Home', icon: Home },
            { id: 'profile', label: 'Me', icon: User },
          ].map(tab => (
            <TouchableOpacity 
              key={tab.id} 
              onPress={() => setActiveTab(tab.id)}
              style={styles.navItem}
            >
              <View style={[styles.navIconBox, activeTab === tab.id && styles.navIconBoxActive]}>
                <tab.icon size={22} color={activeTab === tab.id ? '#7c3aed' : '#cbd5e1'} strokeWidth={activeTab === tab.id ? 3 : 2} />
              </View>
              <Text style={[styles.navLabel, activeTab === tab.id && styles.navLabelActive]}>{tab.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* --- Leave Modal --- */}
        <Modal visible={showLeaveModal} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Apply for Leave</Text>
                <TouchableOpacity onPress={() => setShowLeaveModal(false)}><X size={24} color="#a1a1aa" /></TouchableOpacity>
              </View>

              <View style={styles.leaveTypeToggle}>
                <TouchableOpacity 
                  style={[styles.toggleBtn, leaveData.type === 'full' && styles.toggleBtnActive]}
                  onPress={() => setLeaveData({...leaveData, type: 'full'})}
                >
                  <Text style={[styles.toggleText, leaveData.type === 'full' && styles.toggleTextActive]}>Full Day</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.toggleBtn, leaveData.type === 'half' && styles.toggleBtnActive]}
                  onPress={() => setLeaveData({...leaveData, type: 'half'})}
                >
                  <Text style={[styles.toggleText, leaveData.type === 'half' && styles.toggleTextActive]}>Half Day</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{leaveData.type === 'half' ? 'Date' : 'Start Date'}</Text>
                <TextInput 
                  style={styles.input} 
                  value={leaveData.startDate} 
                  onChangeText={(t) => setLeaveData({...leaveData, startDate: t})}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#a1a1aa"
                />
              </View>

              {leaveData.type === 'full' && (
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>End Date</Text>
                  <TextInput 
                    style={styles.input} 
                    value={leaveData.endDate} 
                    onChangeText={(t) => setLeaveData({...leaveData, endDate: t})}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor="#a1a1aa"
                  />
                </View>
              )}

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Reason</Text>
                <TextInput 
                  style={[styles.input, { height: 100, textAlignVertical: 'top' }]} 
                  multiline 
                  value={leaveData.reason} 
                  onChangeText={(t) => setLeaveData({...leaveData, reason: t})}
                  placeholder="Explain your reason..."
                  placeholderTextColor="#a1a1aa"
                />
              </View>

              <TouchableOpacity 
                style={styles.submitBtn} 
                onPress={handleApplyLeave}
                disabled={actionLoading}
              >
                {actionLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Submit Application</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1, backgroundColor: '#fafafa' }, // zinc-50
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fafafa' },
  loadingText: { marginTop: 12, color: '#7c3aed', fontWeight: 'bold' }, // violet-600
  
  header: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e4e4e7' // zinc-200
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  headerIconBox: { width: 32, height: 32, backgroundColor: '#7c3aed', borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '600', color: '#18181b', flex: 1 }, // zinc-900
  headerSubtitle: { fontSize: 12, color: '#71717a', fontWeight: '500' }, // zinc-500
  avatar: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#f5f3ff', justifyContent: 'center', alignItems: 'center' },

  scrollContent: { paddingBottom: 100 },
  tabView: { padding: 16 },

  statsGrid: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  statCard: { flex: 1, padding: 12, borderRadius: 20, borderWidth: 1, alignItems: 'center' },
  statLabel: { fontSize: 10, fontWeight: '600', marginBottom: 4 },
  statValue: { fontSize: 20, fontWeight: '700' },

  timeCard: {
    backgroundColor: '#7c3aed', // violet-600
    padding: 24,
    borderRadius: 24,
    marginBottom: 16,
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5
  },
  timeHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  flexRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  timeDate: { fontSize: 11, color: '#ddd6fe', fontWeight: '600', textTransform: 'uppercase' },
  liveBadge: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  liveBadgeText: { color: '#fff', fontSize: 9, fontWeight: 'bold' },
  timeLarge: { fontSize: 36, color: '#fff', fontWeight: '700' },
  timeAmPm: { fontSize: 18, opacity: 0.8 },

  mainCard: {
    backgroundColor: '#fff',
    borderRadius: 32,
    borderWidth: 1,
    borderColor: '#e4e4e7', // zinc-200
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 2
  },
  centerContent: { padding: 32, alignItems: 'center' },
  iconCircle: { width: 64, height: 64, backgroundColor: '#f5f3ff', borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  cardTitle: { fontSize: 18, fontWeight: '600', color: '#27272a', marginBottom: 4 }, // zinc-800
  cardDesc: { fontSize: 13, color: '#a1a1aa', textAlign: 'center', marginBottom: 24, paddingHorizontal: 10, fontWeight: '400' }, // zinc-400
  primaryButton: { 
    width: '100%', 
    height: 48, 
    backgroundColor: '#18181b', // zinc-900
    borderRadius: 12, 
    flexDirection: 'row', 
    justifyContent: 'center', 
    alignItems: 'center', 
    gap: 8 
  },
  primaryButtonText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  errorText: { color: '#ef4444', fontSize: 12, fontWeight: '600', marginTop: 12 },

  cameraContainer: { padding: 16, alignItems: 'center', width: '100%' },
  camera: { width: '100%', aspectRatio: 1, borderRadius: 32, overflow: 'hidden', minHeight: 300 },
  cameraOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'transparent' },
  faceGuide: { width: '80%', height: '80%', borderWidth: 2, borderColor: '#fff', borderStyle: 'dashed', borderRadius: 1000, opacity: 0.3 },
  captureButton: { width: 64, height: 64, backgroundColor: '#fff', borderRadius: 32, borderWidth: 6, borderColor: '#7c3aed', marginTop: 16, justifyContent: 'center', alignItems: 'center' },

  previewContainer: { padding: 16 },
  previewImage: { width: width - 64, height: width - 64, borderRadius: 32, marginBottom: 16 },
  flexRowGap: { flexDirection: 'row', gap: 12 },
  secondaryButton: { flex: 1, height: 48, backgroundColor: '#f1f5f9', borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  secondaryButtonText: { color: '#71717a', fontSize: 14, fontWeight: '600' }, // zinc-500

  doneContainer: {},
  statusBanner: { padding: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  statusBannerText: { color: '#fff', fontSize: 11, fontWeight: '600', textTransform: 'uppercase' },
  donePadded: { padding: 24, alignItems: 'center' },
  trackingBadge: { backgroundColor: '#f5f3ff', padding: 10, borderRadius: 12, flexDirection: 'row', gap: 6, marginBottom: 16 },
  trackingBadgeText: { color: '#7c3aed', fontSize: 11, fontWeight: '700' },
  timeRow: { flexDirection: 'row', width: '100%', justifyContent: 'space-around', marginBottom: 20 },
  timeInfo: { alignItems: 'center' },
  timeInfoLabel: { fontSize: 11, color: '#a1a1aa', fontWeight: '500', marginBottom: 2 }, // zinc-400
  timeInfoValue: { fontSize: 20, color: '#27272a', fontWeight: '700' }, // zinc-800
  selfieWrapper: { width: 140, height: 140, padding: 4, backgroundColor: '#fff', borderRadius: 32, borderWidth: 1, borderColor: '#e4e4e7', marginBottom: 20 },
  smallSelfie: { width: '100%', height: '100%', borderRadius: 28 },
  checkoutButton: { width: '100%', height: 48, backgroundColor: '#18181b', borderRadius: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  shiftDoneCard: { padding: 16, backgroundColor: '#f4f4f5', borderRadius: 16, width: '100%', alignItems: 'center' }, // zinc-100
  shiftDoneText: { fontSize: 12, fontWeight: '500', color: '#a1a1aa' }, // zinc-400
  earlyExitText: { fontSize: 12, fontWeight: '500', color: '#d97706', marginTop: 4 },

  actionsCard: { backgroundColor: '#fff', padding: 24, borderRadius: 32, borderWidth: 1, borderColor: '#e4e4e7' },
  actionsHeader: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  iconBox: { width: 44, height: 44, backgroundColor: '#f5f3ff', borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  actionsTitle: { fontSize: 16, fontWeight: '600', color: '#27272a' }, // zinc-800
  actionsSubtitle: { fontSize: 12, color: '#a1a1aa', fontWeight: '400' }, // zinc-400
  actionsGrid: { flexDirection: 'row', gap: 12 },
  actionBtn: { flex: 1, padding: 16, backgroundColor: '#f4f4f5', borderRadius: 24, alignItems: 'center' },
  actionIconCircle: { width: 44, height: 44, backgroundColor: '#fff', borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  actionBtnLabel: { fontSize: 13, fontWeight: '600', color: '#3f3f46' }, // zinc-700

  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#a1a1aa', letterSpacing: 0.5, marginLeft: 4, marginBottom: 12 }, // zinc-400
  emptyCard: { padding: 40, alignItems: 'center', backgroundColor: '#fff', borderRadius: 24, borderStyle: 'dashed', borderWidth: 1, borderColor: '#d4d4d8' }, // zinc-300
  emptyText: { color: '#a1a1aa', fontSize: 13, fontWeight: '500' },
  logCard: { backgroundColor: '#fff', padding: 20, borderRadius: 24, borderWidth: 1, borderColor: '#e4e4e7', marginBottom: 10 },
  logRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  logMain: { fontSize: 15, fontWeight: '600', color: '#27272a' },
  logSub: { fontSize: 12, color: '#a1a1aa', fontWeight: '500', marginTop: 2 },
  badge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  badgeText: { fontSize: 10, fontWeight: 'bold' },
  logReason: { backgroundColor: '#f4f4f5', padding: 12, borderRadius: 12, marginTop: 12 },
  reasonText: { fontSize: 12, color: '#71717a', fontStyle: 'italic', fontWeight: '400' },

  activityCard: { backgroundColor: '#fff', padding: 16, borderRadius: 24, borderWidth: 1, borderColor: '#e4e4e7', marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  activityLeft: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  miniAvatar: { width: 48, height: 48, borderRadius: 14, backgroundColor: '#f4f4f5', overflow: 'hidden', justifyContent: 'center', alignItems: 'center' },
  fullImage: { width: '100%', height: '100%' },
  activityDate: { fontSize: 14, fontWeight: '600', color: '#27272a' },
  activityTime: { fontSize: 11, color: '#a1a1aa', fontWeight: '500', textTransform: 'uppercase' },
  miniBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  miniBadgeText: { fontSize: 10, fontWeight: 'bold' },
  verifiedText: { fontSize: 10, color: '#16a34a', backgroundColor: '#f0fdf4', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, fontWeight: '600' },

  profileCard: { backgroundColor: '#fff', borderRadius: 32, overflow: 'hidden' },
  profileBanner: { height: 100, backgroundColor: '#7c3aed' },
  profileInfo: { marginTop: -50, padding: 24, alignItems: 'center' },
  profileAvatar: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#fff', padding: 4, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 15, elevation: 5, justifyContent: 'center', alignItems: 'center' },
  profileName: { fontSize: 20, fontWeight: '700', color: '#27272a', marginTop: 16 },
  profileSub: { fontSize: 12, color: '#7c3aed', fontWeight: '600', textTransform: 'uppercase', marginTop: 4, letterSpacing: 1 },
  profileRows: { width: '100%', marginTop: 24, gap: 10 },
  profileRow: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, backgroundColor: '#f4f4f5', borderRadius: 16 },
  rowLabel: { fontSize: 11, color: '#a1a1aa', fontWeight: '600', textTransform: 'uppercase' },
  rowValue: { fontSize: 14, color: '#27272a', fontWeight: '600' },
  logoutBtn: { flexDirection: 'row', gap: 10, marginTop: 32, padding: 18, backgroundColor: '#fef2f2', borderRadius: 16, width: '100%', justifyContent: 'center', alignItems: 'center' },
  logoutBtnText: { color: '#dc2626', fontSize: 14, fontWeight: '700' },

  profileFooterText: {
    textAlign: 'center',
    fontSize: 11,
    color: '#a1a1aa',
    marginTop: 40,
    marginBottom: 40,
    fontWeight: '600',
    letterSpacing: 1,
  },

  bottomNav: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 80, backgroundColor: 'rgba(255,255,255,0.95)', borderTopWidth: 1, borderTopColor: '#e4e4e7', flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', paddingBottom: Platform.OS === 'ios' ? 20 : 0 },
  navItem: { alignItems: 'center', justifyContent: 'center' },
  navIconBox: { padding: 10, borderRadius: 16 },
  navIconBoxActive: { backgroundColor: '#f5f3ff' },
  navLabel: { fontSize: 10, fontWeight: '700', color: '#d4d4d8', marginTop: 4 }, // zinc-300
  navLabelActive: { color: '#7c3aed' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingBottom: 48 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 18, fontWeight: '600', color: '#27272a' },
  leaveTypeToggle: { flexDirection: 'row', backgroundColor: '#f4f4f5', padding: 6, borderRadius: 18, marginBottom: 24 },
  toggleBtn: { flex: 1, paddingVertical: 12, borderRadius: 14, alignItems: 'center' },
  toggleBtnActive: { backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  toggleText: { fontSize: 12, fontWeight: '600', color: '#a1a1aa' },
  toggleTextActive: { color: '#7c3aed' },
  inputGroup: { marginBottom: 20 },
  inputLabel: { fontSize: 14, fontWeight: '500', color: '#52525b', marginBottom: 8, marginLeft: 2 },
  input: { backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#f4f4f5', borderRadius: 16, padding: 16, fontSize: 15, fontWeight: '500', color: '#27272a' },
  submitBtn: { backgroundColor: '#7c3aed', height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 12, shadowColor: '#7c3aed', shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
