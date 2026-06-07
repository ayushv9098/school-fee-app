import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ActivityIndicator, Alert, Platform } from 'react-native';
import { LogOut, BellRing, Users, MapPin } from 'lucide-react-native';
import { supabase } from '../lib/supabase';
import * as Notifications from 'expo-notifications';

// Ensure notifications show up even when the app is open
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export default function AdminDashboardScreen({ navigation }) {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdminData();
    registerForPushNotificationsAsync();
  }, []);

  const fetchAdminData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return navigation.replace('Login');

      // Fetch user profile (Assuming admin data is in a users or admins table. For now, using auth data)
      setAdmin(session.user);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  async function registerForPushNotificationsAsync() {
    let token;
    
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return;
    }
    
    try {
      token = (await Notifications.getExpoPushTokenAsync({
         projectId: "2313ca16-32fc-4045-bba9-f0e7bf95f8f3" // Hardcoded from previous EAS link
      })).data;
      
      console.log("Admin Push Token:", token);
      
      // Save token to database
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
         // We update the school_settings table with this token since there is no users table
         await supabase.from('school_settings').update({ push_token: token }).eq('user_id', session.user.id);
      }

    } catch (e) {
      console.log(e);
    }
  }

  const handleTestNotification = async () => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "🚨 Test Alert Working!",
        body: "Aapke phone par push notifications bilkul sahi kaam kar rahi hain.",
        sound: true,
      },
      trigger: null, // Send immediately
    });
  };

  const handleLogout = async () => {
    const executeLogout = async () => {
      await supabase.auth.signOut();
    };

    if (Platform.OS === 'web') {
      if (window.confirm("Are you sure you want to sign out?")) {
        await executeLogout();
      }
      return;
    }

    Alert.alert("Sign Out", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: executeLogout }
    ]);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7c3aed" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Admin Portal</Text>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
            <LogOut size={20} color="#ef4444" />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={styles.alertCard}>
            <BellRing size={32} color="#7c3aed" style={{marginBottom: 16}} />
            <Text style={styles.alertTitle}>Push Notifications Active</Text>
            <Text style={styles.alertDesc}>
              You will receive alerts here when a teacher leaves the geofence or checks in late.
            </Text>
            
            <TouchableOpacity 
              style={styles.testBtn} 
              onPress={handleTestNotification}
            >
              <Text style={styles.testBtnText}>Test Notification Sound</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.placeholderBox}>
             <Users size={24} color="#a1a1aa" />
             <Text style={styles.placeholderText}>Teacher Overview Coming Soon</Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1, backgroundColor: '#fafafa' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fafafa' },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f4f4f5'
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#18181b' },
  logoutBtn: { padding: 8, backgroundColor: '#fef2f2', borderRadius: 12 },
  content: { padding: 20, flex: 1 },
  alertCard: {
    backgroundColor: '#f5f3ff',
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#ede9fe',
    marginBottom: 20
  },
  alertTitle: { fontSize: 18, fontWeight: '700', color: '#5b21b6', marginBottom: 8 },
  alertDesc: { fontSize: 14, color: '#7c3aed', fontWeight: '500', lineHeight: 20 },
  testBtn: {
    marginTop: 20,
    backgroundColor: '#7c3aed',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  testBtnText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  placeholderBox: {
     padding: 40,
     borderWidth: 2,
     borderStyle: 'dashed',
     borderColor: '#e4e4e7',
     borderRadius: 24,
     alignItems: 'center',
     justifyContent: 'center'
  },
  placeholderText: { marginTop: 12, color: '#a1a1aa', fontWeight: '600', fontSize: 14 }
});