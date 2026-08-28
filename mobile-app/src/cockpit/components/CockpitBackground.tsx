import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { CockpitTheme } from '../theme/types';

interface Props {
  theme: CockpitTheme;
  children: React.ReactNode;
}

export const CockpitBackground: React.FC<Props> = ({ theme, children }) => {
  const fade = useRef(new Animated.Value(1)).current;
  const prevGradient = useRef(theme.background.gradient);
  const [currentGradient, setCurrentGradient] = useState(theme.background.gradient);

  useEffect(() => {
    const next = theme.background.gradient;
    if (next === currentGradient) return;

    fade.setValue(0);
    prevGradient.current = currentGradient; // fica "por baixo" enquanto o novo aparece
    setCurrentGradient(next);

    Animated.timing(fade, {
      toValue: 1,
      duration: 700,
      useNativeDriver: true,
    }).start();
  }, [theme.key]);

  return (
    <>
      {/* camada antiga, sempre opaca por baixo */}
      <LinearGradient
        colors={prevGradient.current}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
      />
      {/* camada nova, aparece por cima com fade */}
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: fade }]}>
        <LinearGradient
          colors={currentGradient}
          style={StyleSheet.absoluteFill}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 1 }}
        />
      </Animated.View>
      {children}
    </>
  );
};
