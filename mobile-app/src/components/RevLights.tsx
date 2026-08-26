import React from 'react';
import { View, StyleSheet } from 'react-native';

interface RevLightsProps {
  revPercent: number; // 0 a 100
  totalLeds?: number;
}

export const RevLights: React.FC<RevLightsProps> = ({ revPercent, totalLeds = 15 }) => {
  const activeCount = Math.round((Math.max(0, Math.min(100, revPercent)) / 100) * totalLeds);
  const isShiftPoint = revPercent >= 96;

  return (
    <View style={[styles.container, isShiftPoint && styles.shiftContainer]}>
      {Array.from({ length: totalLeds }).map((_, idx) => {
        const isActive = idx < activeCount;
        // 5 Verdes, 5 Vermelhos, 5 Roxos/Azuis
        let activeColor = '#22c55e';
        if (idx >= 5 && idx < 10) {
          activeColor = '#ef4444';
        } else if (idx >= 10) {
          activeColor = '#a855f7';
        }

        return (
          <View
            key={idx}
            style={[
              styles.led,
              {
                backgroundColor: isActive ? activeColor : '#1e2029',
                shadowColor: isActive ? activeColor : 'transparent',
                shadowOpacity: isActive ? 0.9 : 0,
                shadowRadius: 6,
                elevation: isActive ? 5 : 0
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
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#0c0d12',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#232634',
    gap: 5
  },
  shiftContainer: {
    borderColor: '#a855f7',
    backgroundColor: '#1f132e'
  },
  led: {
    width: 14,
    height: 14,
    borderRadius: 7
  }
});
