import { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';

export function HomeScreen() {
  const [recording, setRecording] = useState<Audio.Recording | null>(null)
  const [status, setStatus] = useState('Idle')

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
    setStatus('Analyzing with Gemini...');

    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();

    if (uri) {
      // 1. Native File Read -> Base64
      const base64Audio = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      })

      // 2. Fetch API
      try {
        const response = await fetch('http://localhost:3000/api/brain', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json'},
          body: JSON.stringify({ audioBase64: base64Audio }),
        })
        const data = await response.json();
        console.log('Gemini Structure Result:', data);
        setStatus('Success! Check Web Dashboard.')
      } catch (error) {
        console.error('API Error. Is Next.js running?', error);
      }
    }
    setRecording(null);
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