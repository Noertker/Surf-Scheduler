import React from 'react';
import { Tabs } from 'expo-router';
import { Text } from 'react-native';

import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme].tint,
        headerShown: true,
      }}>
      <Tabs.Screen
        name="spots"
        options={{
          title: 'Spots',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 22, color }}>🏄</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 22, color }}>📊</Text>
          ),
        }}
      />
    </Tabs>
  );
}
