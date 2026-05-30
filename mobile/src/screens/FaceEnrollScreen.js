import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { Camera } from 'expo-camera';
import { uploadToCloudinary } from '../utils/cloudinary';
import { supabase } from '../lib/supabase';

export default function FaceEnrollScreen({ user, onClose, onSuccess }) {
  const [hasPermission, setHasPermission] = useState(null);
  const [status, setStatus] = useState('Initializing camera...');
  const [capturing, setCapturing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [photos, setPhotos] = useState([]);
  const cameraRef = useRef(null);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
      setStatus('Ready');
    })();
    return () => {};
  }, []);

  const beginEnrollment = async () => {
    if (!hasPermission) return;
    setCapturing(true);
    setPhotos([]);
    setProgress(0);
    setStatus('Get ready: facing camera');

    try {
      for (let i = 1; i <= 3; i++) {
        setStatus(`Capturing ${i} of 3`);
        const photo = await cameraRef.current.takePictureAsync({ quality: 0.6, base64: true });
        setPhotos(prev => [...prev, photo.uri]);
        setProgress(i / 3);
        await new Promise(r => setTimeout(r, 700));
      }

      setStatus('Uploading photos...');
      let lastUrl = null;
      for (const uri of photos.concat()) {
        // ensure we include the last captured - camera takePictureAsync returns uri but we stored earlier
      }
      // upload the last captured photo (if none uploaded yet use cameraRef snapshot)
      const last = photos[photos.length - 1] || null;
      if (last) {
        lastUrl = await uploadToCloudinary(last);
      }

      // Save profile photo and flag face_id_enabled
      await supabase.from('users').update({ photo_url: lastUrl, face_id_enabled: true }).eq('uid', user.uid);

      setStatus('Enrollment complete');
      setCapturing(false);
      onSuccess && onSuccess();
    } catch (err) {
      console.warn('Enrollment error', err);
      setStatus('Enrollment failed: ' + err.message);
      setCapturing(false);
    }
  };

  if (hasPermission === null) return (
    <View style={styles.loading}><ActivityIndicator color="#E8C547" /></View>
  );
  if (hasPermission === false) return (
    <View style={styles.loading}><Text style={{ color: '#fff' }}>Camera permission required</Text></View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Register Face</Text>
        <TouchableOpacity onPress={onClose}><Text style={styles.close}>✕</Text></TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Camera ref={cameraRef} style={styles.camera} type={Camera.Constants.Type.front}>
          <View style={styles.overlay}>
            <View style={styles.viewfinder} />
          </View>
        </Camera>

        <View style={{ padding: 12 }}>
          <Text style={{ color: '#fff', marginBottom: 8 }}>{status}</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity onPress={beginEnrollment} disabled={capturing} style={[styles.btn, { backgroundColor: capturing ? 'rgba(255,255,255,0.04)' : 'rgba(232,197,71,0.08)' }]}>
              {capturing ? <ActivityIndicator color="#E8C547" /> : <Text style={{ color: 'var(--yellow)' }}>BEGIN REGISTRATION</Text>}
            </TouchableOpacity>
            <TouchableOpacity onPress={onClose} style={[styles.btn, { backgroundColor: 'transparent' }]}>
              <Text style={{ color: '#fff' }}>CANCEL</Text>
            </TouchableOpacity>
          </View>
          <View style={{ marginTop: 12, flexDirection: 'row', gap: 8 }}>
            {photos.map((p, i) => (
              <Image key={i} source={{ uri: p }} style={{ width: 48, height: 48, borderRadius: 8 }} />
            ))}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121210', paddingTop: 48 },
  header: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, alignItems: 'center' },
  title: { color: '#fff', fontSize: 18, fontWeight: '800' },
  close: { color: '#fff', fontSize: 22 },
  card: { margin: 20, backgroundColor: 'rgba(30,30,28,0.7)', borderRadius: 12, overflow: 'hidden' },
  camera: { height: 360 },
  overlay: { flex: 1, backgroundColor: 'transparent', alignItems: 'center', justifyContent: 'center' },
  viewfinder: { width: 220, height: 220, borderWidth: 2, borderColor: '#E8C547', borderRadius: 16 },
  loading: { flex: 1, backgroundColor: '#121210', alignItems: 'center', justifyContent: 'center' },
  btn: { padding: 10, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center' }
});
