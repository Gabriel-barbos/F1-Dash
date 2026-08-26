import React from 'react';
import { View, StyleSheet } from 'react-native';

interface RevLightsProps {
  rpmPercentage: number; // 0 a 100
  revLightsPercent: number; // 0 a 100
}

export const RevLights: React.FC<RevLightsProps> = ({ rpmPercentage, revLightsPercent }) => {
  const activePercent = Math.max(rpmPercentage, revLightsPercent);
  const totalLeds = 15;
  const activeLeds = Math.round((activePercent / 100) * totalLeds);
  const isBlinking = activePercent >= 96;

  return (
    <View style={[styles.container, isBlinking && styles.blinkingContainer]}>
      {Array.from({ length: totalLeds }).map((_, index) => {
        const isActive = index < activeLeds;
        let color = '#22c55e'; // 0-4: Verde

        if (index >= 5 && index < 10) {
          color = '#ef4444'; // 5-9: Vermelho
        } else if (index >= 10) {
          color = '#a855f7'; // 10-14: Roxo / Azul
        }

        return (
          <View
            key={index}
            style={[
              styles.led,
              {
                backgroundColor: isActive ? color : '#27272a',
                shadowColor: isActive ? color : 'transparent',
                shadowOpacity: isActive ? 0.9 : 0,
                shadowRadius: 6,
                elevation: isActive ? 4 : 0
              }
            ]}
          />
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#09090b',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#27272a'
  },
  blinkingContainer: {
    borderColor: '#a855f7'
  },
  led: {
    width: 14,
    height: 24,
    borderRadius: 4
  }
});
