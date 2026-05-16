import React from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';
import { useAuthStore } from '../store/authStore';

export { LoginScreen } from './auth/LoginScreen';

export { DashboardScreen } from './main/DashboardScreen';

export { TransactionsScreen } from './main/TransactionsScreen';

export { AiScreen } from './main/AiScreen';
export { ProfileScreen } from './main/ProfileScreen';

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a' },
  title: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 20 }
});
