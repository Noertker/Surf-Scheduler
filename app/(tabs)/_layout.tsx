import { Tabs } from 'expo-router';
import React from 'react';
import { Text } from 'react-native';

import { DashboardHeader } from '@/components/DashboardHeader';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme].tint,
        headerShown: true,
      }}>
      <Tabs.Screen
        name="calendar"
        options={{
          headerTitle: () => <DashboardHeader />,
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 22, color }}> 📅 </Text>
          ),
        }}
      />
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
        name="schedule"
        options={{
          title: 'Schedule',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 22, color }}>📋</Text>
          ),
        }}
      />
    </Tabs>
  );
}
