import React from 'react';
import { StyleSheet } from 'react-native';
import { Text, View } from '@/components/Themed';

export default function DashboardScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Dashboard</Text>
      <Text style={styles.subtitle}>
        Tide window calendar coming in the next milestone.
      </Text>
      <Text style={styles.hint}>
        Head to the Spots tab to see live tide and conditions data.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.7,
    marginBottom: 8,
  },
  hint: {
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.5,
  },
});
