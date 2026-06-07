import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, SafeAreaView, ScrollView } from 'react-native';
import { GraduationCap, ArrowRight, Loader2 } from 'lucide-react-native';
import { supabase } from '../lib/supabase';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
        // 1. Check if the user is a teacher
        const { data: teacher } = await supabase
          .from('teachers')
          .select('role')
          .eq('auth_user_id', data.user.id)
          .maybeSingle();

        const isTeacher = !!teacher; // If they have a teacher record, they are a teacher

        // 2. Check if the user is an admin
        // Admins won't have a record in 'teachers' where auth_user_id matches, 
        // but they will have records in 'school_settings' where user_id matches.
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

        // App.js handles the routing based on auth state
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.topSection}>
          <View style={styles.iconCircle}>
            <GraduationCap size={32} color="#fff" />
          </View>
          <Text style={styles.schoolName}>Ayushman Educational Academy</Text>
          <Text style={styles.portalSub}>Teacher Portal Login</Text>
        </View>
        
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Welcome Back</Text>
          <Text style={styles.cardDesc}>Sign in to mark your daily attendance</Text>

          <View style={styles.form}>
            <Text style={styles.label}>Email Address</Text>
            <TextInput
              style={styles.input}
              placeholder="teacher@school.com"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholderTextColor="#a1a1aa"
            />

            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholderTextColor="#a1a1aa"
            />

            {error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <TouchableOpacity 
              style={[styles.button, loading && styles.buttonDisabled]} 
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <View style={styles.buttonInner}>
                  <Text style={styles.buttonText}>Sign In Now</Text>
                  <ArrowRight size={18} color="#fff" />
                </View>
              )}
            </TouchableOpacity>

            <View style={styles.helpTextContainer}>
              <Text style={styles.helpText}>
                Don't have an account?{' '}
                <Text style={styles.helpTextBold}>Ask Admin for Invite</Text>
              </Text>
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
