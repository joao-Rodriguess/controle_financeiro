import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootNavigator } from './src/navigation';
import { useAuthStore } from './src/store/authStore';

export default function App() {
  const initialize = useAuthStore(s => s.initialize);

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <RootNavigator />
    </SafeAreaProvider>
  );
}
