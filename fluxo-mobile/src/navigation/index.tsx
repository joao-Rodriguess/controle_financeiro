import React from 'react';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, List, Bot, User } from 'lucide-react-native';

import { LoginScreen, DashboardScreen, TransactionsScreen, AiScreen, ProfileScreen } from '../screens';
import { useAuthStore } from '../store/authStore';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const MainTabs = () => (
  <Tab.Navigator
    screenOptions={{
      headerShown: false,
      tabBarStyle: { backgroundColor: '#1e293b', borderTopColor: '#334155' },
      tabBarActiveTintColor: '#8b5cf6',
      tabBarInactiveTintColor: '#94a3b8',
    }}
  >
    <Tab.Screen 
      name="Dashboard" 
      component={DashboardScreen} 
      options={{ tabBarIcon: ({ color, size }) => <Home color={color} size={size} /> }}
    />
    <Tab.Screen 
      name="Transações" 
      component={TransactionsScreen} 
      options={{ tabBarIcon: ({ color, size }) => <List color={color} size={size} /> }}
    />
    <Tab.Screen 
      name="IA" 
      component={AiScreen} 
      options={{ tabBarIcon: ({ color, size }) => <Bot color={color} size={size} /> }}
    />
    <Tab.Screen 
      name="Perfil" 
      component={ProfileScreen} 
      options={{ tabBarIcon: ({ color, size }) => <User color={color} size={size} /> }}
    />
  </Tab.Navigator>
);

export const RootNavigator = () => {
  const { token, isLoading } = useAuthStore();

  if (isLoading) return null; // We can return a splash screen here later

  return (
    <NavigationContainer theme={DarkTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {token ? (
          <Stack.Screen name="Main" component={MainTabs} />
        ) : (
          <Stack.Screen name="Auth" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
