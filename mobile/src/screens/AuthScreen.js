import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { supabase } from '../lib/supabase';

export default function AuthScreen({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError('');
    setLoading(true);
    try {
      if (isLogin) {
        // Sign-in logic mapping
        const emailKey = email.replace(/[.@]/g, '_');
        const { data: emailRow } = await supabase.from('user_emails').select('uid').eq('email_key', emailKey).single();
        if (!emailRow) throw new Error('No account found');
        const { data: userData } = await supabase.from('users').select('*').eq('uid', emailRow.uid).single();
        if (!userData || userData.password !== password) throw new Error('Incorrect password');
        onLogin(userData);
      } else {
        // Sign-up logic
        const uid = 'user_' + Date.now();
        const profileData = {
          uid, name, email, password, phone,
          eco_coins: 0, total_scans: 0, level: 1
        };
        const { error } = await supabase.from('users').insert(profileData);
        if (error) throw error;
        await supabase.from('user_emails').insert({ email_key: email.replace(/[.@]/g, '_'), uid, email });
        onLogin(profileData);
      }
    } catch (err) {
      setError(err.message || 'Authentication error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>SMART<Text style={styles.titleHighlight}>BIN</Text></Text>
        <Text style={styles.subtitle}>MOBILE ECO SYSTEM</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>{isLogin ? 'SIGN IN' : 'CREATE ACCOUNT'}</Text>

        {!isLogin && (
          <>
            <Text style={styles.label}>FULL NAME</Text>
            <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="John Doe" placeholderTextColor="#555" />
            <Text style={styles.label}>PHONE NUMBER</Text>
            <TextInput style={styles.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="9876543210" placeholderTextColor="#555" />
          </>
        )}

        <Text style={styles.label}>EMAIL ADDRESS</Text>
        <TextInput style={styles.input} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholder="example@email.com" placeholderTextColor="#555" />

        <Text style={styles.label}>PASSWORD</Text>
        <TextInput style={styles.input} value={password} onChangeText={setPassword} secureTextEntry placeholder="••••••••" placeholderTextColor="#555" />

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <TouchableOpacity style={styles.btn} onPress={handleSubmit} disabled={loading}>
          {loading ? <ActivityIndicator color="#121210" /> : <Text style={styles.btnText}>{isLogin ? 'SIGN IN' : 'SIGN UP'}</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={styles.switchLink} onPress={() => setIsLogin(!isLogin)}>
          <Text style={styles.switchLinkText}>
            {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#121210',
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 36,
    color: '#fff',
    fontWeight: '900',
    letterSpacing: 4,
  },
  titleHighlight: {
    backgroundColor: '#E8C547',
    color: '#121210',
  },
  subtitle: {
    color: '#8E8E8A',
    fontSize: 9,
    fontFamily: 'monospace',
    letterSpacing: 2,
    marginTop: 6,
  },
  card: {
    backgroundColor: 'rgba(30,30,28,0.7)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    padding: 20,
  },
  cardTitle: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
    letterSpacing: 2,
    marginBottom: 20,
  },
  label: {
    color: '#8E8E8A',
    fontSize: 8,
    fontFamily: 'monospace',
    letterSpacing: 1,
    marginBottom: 4,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#2A2A28',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#444',
    padding: 12,
    color: '#fff',
    fontSize: 14,
  },
  btn: {
    backgroundColor: '#E8C547',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  btnText: {
    color: '#121210',
    fontWeight: 'bold',
    fontSize: 14,
    letterSpacing: 1,
  },
  switchLink: {
    alignItems: 'center',
    marginTop: 16,
  },
  switchLinkText: {
    color: '#E8C547',
    fontSize: 11,
    fontFamily: 'monospace',
  },
  errorText: {
    color: '#E85454',
    fontSize: 11,
    fontFamily: 'monospace',
    textAlign: 'center',
    marginTop: 12,
  },
});
