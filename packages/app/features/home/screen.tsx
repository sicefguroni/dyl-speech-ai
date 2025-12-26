import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';
import { LoginScreen } from '../auth/login-screen';
import { supabase } from '../../utils/supabase';

export function HomeScreen() {
  const [recording, setRecording] = useState<Audio.Recording | null>(null)
  const [status, setStatus] = useState('Idle')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
      setCheckingAuth(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (checkingAuth) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading...</Text>
      </View>
    );
  }

  if (!isAuthenticated) {
    return <LoginScreen onLoginSuccess={() => setIsAuthenticated(true)} />;
  }

  async function startRecording() {
    try {
      // 1. Request permission
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== 'granted') return

      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.LOW_QUALITY // Optimized for LLM transcription
      )
      setRecording(recording);
      setStatus('Recording...');
    } catch (error) {
      console.error('Failed to start recording', error);
    }
  }
  
  async function stopAndProcess() {
    if (!recording) return;
    setStatus('Preparing audio...');
    
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI(); 

      if (!uri) throw new Error('No audio URI found');

      // 1. Convert to Base64
      const base64Audio = await FileSystem.readAsStringAsync(uri, {
        encoding: 'base64' as any,
      });

      setStatus('Sending to Brain...');
      
      // REPLACE '192.168.X.X' WITH YOUR ACTUAL IP ADDRESS
      // REPLACE '3000' WITH YOUR NEXT.JS PORT
      const API_URL = 'http://192.168.1.11:3000/api/brain'; 

      console.log(`Attempting fetch to: ${API_URL}`);

      // Get auth token from Supabase session
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      if (!token) {
        throw new Error('Not authenticated. Please log in first.');
      }

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ audioBase64: base64Audio }),
      });

      if (!response.ok) {
        throw new Error(`Server Error: ${response.status}`);
      }

      const data = await response.json();
      console.log('Gemini Success:', data);
      setStatus('Success! Check Web Dashboard.');

    } catch (e: any) {
      console.error('Upload Failed:', e);
      // Show the actual error on the screen so we know what's wrong
      setStatus(`Error: ${e.message}`); 
    } finally {
      setRecording(null);
    }
  }

  return (
    <View className="flex-1 items-center justify-center bg-white p-4">
      <Text className="text-xl font-bold mb-4">Synapse Audio Capture</Text>
      <Text className="text-gray-500 mb-8">{status}</Text>
      
      <TouchableOpacity 
        onPress={recording ? stopAndProcess : startRecording}
        className={`w-32 h-32 rounded-full items-center justify-center ${recording ? 'bg-red-500' : 'bg-blue-600'}`}
      >
        <Text className="text-white font-bold">{recording ? 'STOP' : 'REC'}</Text>
      </TouchableOpacity>
    </View>
  )
}