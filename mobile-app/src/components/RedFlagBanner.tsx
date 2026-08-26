import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export const RedFlagBanner: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>🚩</Text>
      <Text style={styles.title}>RED FLAG</Text>
      <Text style={styles.subtitle}>SESSION STOPPED</Text>
      <Text style={styles.instruction}>RETURN TO PIT LANE IMMEDIATELY</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#450a0a',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ef4444',
    paddingVertical: 18,
    paddingHorizontal: 24,
    alignItems: 'center',
    width: '100%'
  },
  icon: {
    fontSize: 28,
    marginBottom: 4
  },
  title: {
    color: '#ef4444',
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: 2
  },
  subtitle: {
    color: '#fca5a5',
    fontSize: 16,
    fontWeight: '800',
    marginVertical: 4
  },
  instruction: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1
  }
});
