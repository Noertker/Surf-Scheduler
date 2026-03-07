import { Tabs } from 'expo-router';
import React from 'react';
import { Text } from 'react-native';

import { DashboardHeader } from '@/components/calendar/DashboardHeader';
import { useColors } from '@/hooks/useColors';

export default function TabLayout() {
  const colors = useColors();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textDim,
        tabBarStyle: {
          backgroundColor: colors.bg,
          borderTopColor: colors.border,
          borderTopWidth: 1,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          letterSpacing: 0.5,
          fontWeight: '600',
        },
        headerStyle: {
          backgroundColor: colors.bg,
          borderBottomWidth: 0,
          shadowOpacity: 0,
          elevation: 0,
        },
        headerTintColor: colors.text,
        headerShown: true,
      }}>
      <Tabs.Screen
        name="calendar"
        options={{
          headerTitle: () => <DashboardHeader />,
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 22, color }}>📅</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="spots"
        options={{
          title: 'Spots',
          headerTitleStyle: { color: colors.text, fontWeight: '700', letterSpacing: 1 },
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 22, color }}>🏄</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="schedule"
        options={{
          title: 'Schedule',
          headerTitleStyle: { color: colors.text, fontWeight: '700', letterSpacing: 1 },
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 22, color }}>📋</Text>
          ),
        }}
      />
    </Tabs>
  );
}
