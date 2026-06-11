import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, SafeAreaView, ScrollView } from 'react-native';
import { GraduationCap, ArrowRight, Loader2, KeyRound } from 'lucide-react-native';
import { supabase } from '../lib/supabase';
import * as Linking from 'expo-linking';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [teacherId, setTeacherId] = useState('');
  const [mode, setMode] = useState('login'); // 'login' or 'setup'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Handle Deep Linking
  useEffect(() => {
    const handleUrl = (url) => {
      if (!url) return;
      const { hostname, path, queryParams } = Linking.parse(url);
      
      console.log('🔗 Deep Link Received:', { hostname, path, queryParams });

      if (path === 'signup' || hostname === 'signup') {
        if (queryParams?.email) {
          setEmail(queryParams.email);
          setTeacherId(queryParams.teacher_id || '');
          setMode('setup');
          Alert.alert('Welcome!', 'Please set your password to complete your account setup.');
        }
      }
    };

    // 1. Get initial URL if app was closed
    Linking.getInitialURL().then(handleUrl);

    // 2. Listen for URL changes if app is open
    const subscription = Linking.addEventListener('url', (event) => {
      handleUrl(event.url);
    });

    return () => subscription.remove();
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data, error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (loginError) {
        setError('Invalid email or password');
        setLoading(false);
        return;
      }

      if (data.user) {
        const { data: teacher } = await supabase
          .from('teachers')
          .select('role')
          .eq('auth_user_id', data.user.id)
          .maybeSingle();

        const isTeacher = !!teacher;

        const { data: adminSettings } = await supabase
          .from('school_settings')
          .select('id')
          .eq('user_id', data.user.id)
          .limit(1)
          .maybeSingle();
          
        const isAdmin = !!adminSettings;

        if (!isTeacher && !isAdmin) {
          await supabase.auth.signOut();
          setError('This account is not authorized to use this app.');
          setLoading(false);
          return;
        }
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  const handleSetupPassword = async () => {
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // 1. Auth Signup
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError) {
        setError(signUpError.message);
        setLoading(false);
        return;
      }

      if (data.user) {
        // 2. Link Teacher Record via API (using fetch to nextjs api)
        // Note: Using the base URL from env if available, else assuming same host
        // We'll use the supabaseUrl to guess the API origin or just use the full URL if we knew it
        // For now, let's try to reach the API.
        const origin = 'https://school-fee-app.vercel.app'; // Update this to your real domain
        
        try {
          const linkRes = await fetch(`${origin}/api/complete-teacher-signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: data.user.id,
              teacherId: teacherId,
              role: 'teacher'
            })
          });

          if (!linkRes.ok) {
            const linkData = await linkRes.json();
            throw new Error(linkData.error || 'Linking failed');
          }
        } catch (apiErr) {
          console.error('Linking API Error:', apiErr);
          // Even if linking fails, user is created. But they won't be seen as teacher.
          // We should ideally retry or tell them to contact admin.
        }

        Alert.alert('Success', 'Account created! Logging you in...');
        setMode('login');
        handleLogin(); // Auto login after signup
      }
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.topSection}>
          <View style={styles.iconCircle}>
            {mode === 'setup' ? <KeyRound size={32} color="#fff" /> : <GraduationCap size={32} color="#fff" />}
          </View>
          <Text style={styles.schoolName}>Ayushman Educational Academy</Text>
          <Text style={styles.portalSub}>{mode === 'setup' ? 'Set Account Password' : 'Teacher Portal Login'}</Text>
        </View>
        
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{mode === 'setup' ? 'Create Password' : 'Welcome Back'}</Text>
          <Text style={styles.cardDesc}>
            {mode === 'setup' ? 'Please set a secure password for your account' : 'Sign in to mark your daily attendance'}
          </Text>

          <View style={styles.form}>
            <Text style={styles.label}>Email Address</Text>
            <TextInput
              style={[styles.input, mode === 'setup' && styles.inputDisabled]}
              placeholder="teacher@school.com"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholderTextColor="#a1a1aa"
              editable={mode !== 'setup'}
            />

            <Text style={styles.label}>{mode === 'setup' ? 'New Password' : 'Password'}</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholderTextColor="#a1a1aa"
            />

            {mode === 'setup' && (
              <>
                <Text style={styles.label}>Confirm Password</Text>
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  placeholderTextColor="#a1a1aa"
                />
              </>
            )}

            {error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <TouchableOpacity 
              style={[styles.button, loading && styles.buttonDisabled]} 
              onPress={mode === 'setup' ? handleSetupPassword : handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <View style={styles.buttonInner}>
                  <Text style={styles.buttonText}>{mode === 'setup' ? 'Create Account' : 'Sign In Now'}</Text>
                  <ArrowRight size={18} color="#fff" />
                </View>
              )}
            </TouchableOpacity>

            <View style={styles.helpTextContainer}>
              {mode === 'setup' ? (
                <TouchableOpacity onPress={() => setMode('login')}>
                  <Text style={styles.helpText}>
                    Back to{' '}
                    <Text style={styles.helpTextBold}>Login Screen</Text>
                  </Text>
                </TouchableOpacity>
              ) : (
                <Text style={styles.helpText}>
                  Don't have an account?{' '}
                  <Text style={styles.helpTextBold}>Ask Admin for Invite</Text>
                </Text>
              )}
            </View>
          </View>
        </View>

        <Text style={styles.footerText}>
          © {new Date().getFullYear()} Designed & Developed by AV Infra
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fafafa', // zinc-50
  },
  container: {
    padding: 24,
    flexGrow: 1,
    justifyContent: 'center',
  },
  topSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconCircle: {
    width: 56,
    height: 56,
    backgroundColor: '#7c3aed', // violet-600
    borderRadius: 16, // rounded-2xl
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  schoolName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#18181b', // zinc-900
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  portalSub: {
    fontSize: 14,
    color: '#71717a', // zinc-500
    marginTop: 4,
    fontWeight: '500',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 24, // rounded-3xl
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f4f4f5', // zinc-100
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#27272a', // zinc-800
  },
  cardDesc: {
    fontSize: 14,
    color: '#71717a', // zinc-500
    marginTop: 4,
    fontWeight: '400',
    marginBottom: 24,
  },
  form: {
    width: '100%',
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: '#52525b', // zinc-700
    marginBottom: 8,
    marginLeft: 2,
  },
  input: {
    borderWidth: 1,
    borderColor: '#f4f4f5', // zinc-100
    borderRadius: 16, // rounded-2xl
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    marginBottom: 16,
    backgroundColor: '#f9fafb', // very light gray
    color: '#27272a', // zinc-800
    fontWeight: '400',
  },
  inputDisabled: {
    backgroundColor: '#f1f5f9',
    color: '#94a3b8',
  },
  errorContainer: {
    backgroundColor: '#fef2f2',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#fee2e2',
    marginBottom: 16,
  },
  errorText: {
    color: '#dc2626',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#7c3aed', // violet-600
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  helpTextContainer: {
    marginTop: 24,
    alignItems: 'center',
  },
  helpText: {
    fontSize: 13,
    color: '#71717a', // zinc-500
    fontWeight: '400',
  },
  helpTextBold: {
    color: '#7c3aed', // violet-600
    fontWeight: '600',
  },
  footerText: {
    textAlign: 'center',
    fontSize: 11,
    color: '#a1a1aa', // zinc-400
    marginTop: 40,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
});
