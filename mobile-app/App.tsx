import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Platform, AppState } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as NavigationBar from 'expo-navigation-bar';
import { MenuScreen } from './src/screens/MenuScreen';
import { CockpitScreen } from './src/screens/CockpitScreen';
import { MomentaryEventType } from './src/services/telemetry-service';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<'MENU' | 'COCKPIT'>('MENU');
  const [initialOverlay, setInitialOverlay] = useState<MomentaryEventType | null>(null);

  useEffect(() => {
    // Configura o Android em modo "Cinema" (Sticky-Immersive)
    if (Platform.OS === 'android') {
      const applyCinemaMode = async () => {
        try {
          await NavigationBar.setPositionAsync('absolute');
          await NavigationBar.setVisibilityAsync('hidden');
          await NavigationBar.setBehaviorAsync('overlay-swipe');
        } catch (err) {
          console.warn('[CinemaMode] Erro ao configurar barra imersiva do Android:', err);
        }
      };

      applyCinemaMode();

      // Mantém o modo imersivo mesmo se o usuário alternar de app ou receber notificação
      const subscription = AppState.addEventListener('change', (nextAppState) => {
        if (nextAppState === 'active') {
          applyCinemaMode();
        }
      });

      return () => subscription.remove();
    }
  }, []);

  const handleLaunchCockpit = (overlay?: MomentaryEventType) => {
    setInitialOverlay(overlay ?? null);
    setCurrentScreen('COCKPIT');
  };

  const handleNavigateToMenu = () => {
    setInitialOverlay(null);
    setCurrentScreen('MENU');
  };

  return (
    <SafeAreaProvider>
      <View style={styles.container}>
        <StatusBar hidden />
        {currentScreen === 'MENU' ? (
          <MenuScreen onLaunchCockpit={(overlay) => handleLaunchCockpit(overlay)} />
        ) : (
          <CockpitScreen
            onNavigateToMenu={handleNavigateToMenu}
            initialMomentaryOverlay={initialOverlay}
          />
        )}
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#07090e'
  }
});
