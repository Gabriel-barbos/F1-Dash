import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { VehicleFiaFlag } from '../core/models/car-status';
import { Formatters } from '../core/utils/formatters';

interface FlagsBannerProps {
  flag: VehicleFiaFlag;
}

export const FlagsBanner: React.FC<FlagsBannerProps> = ({ flag }) => {
  const flagInfo = Formatters.getFiaFlagInfo(flag);
  if (!flagInfo.active) {
    return null;
  }

  const isDarkText = flag === VehicleFiaFlag.Yellow || flag === VehicleFiaFlag.Green;

  return (
    <View style={[styles.container, { backgroundColor: flagInfo.color }]}>
      <Text style={[styles.text, { color: isDarkText ? '#000000' : '#ffffff' }]}>
        🚩 {flagInfo.label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4
  },
  text: {
    fontWeight: '800',
    fontSize: 14,
    letterSpacing: 1
  }
});
