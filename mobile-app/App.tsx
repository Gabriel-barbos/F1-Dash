import React from 'react';
import { StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { CockpitScreen } from './src/screens/CockpitScreen';

export default function App() {
  return (
    <View style={styles.container}>
      <StatusBar hidden />
      <CockpitScreen />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090a0f'
  }
});
