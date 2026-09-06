import React from 'react';
import { View, StyleSheet } from 'react-native';
import { MomentaryOverlayContainer } from './MomentaryOverlayContainer';
import { SafetyCarBanner } from '../SafetyCarBanner';
import { SafetyCarStatus } from '@f1-dash/telemetry-core';

interface SafetyCarMomentaryOverlayProps {
  onDismiss: () => void;
  status: SafetyCarStatus;
  delta?: number;
  speedLimit?: number;
}

export const SafetyCarMomentaryOverlay: React.FC<SafetyCarMomentaryOverlayProps> = ({
  onDismiss,
  status,
  delta = 0,
  speedLimit = 80
}) => {
  const isVSC = status === SafetyCarStatus.Virtual;

  return (
    <MomentaryOverlayContainer
      durationSeconds={6}
      onDismiss={onDismiss}
      title={isVSC ? 'VIRTUAL SAFETY CAR DEPLOYED' : 'SAFETY CAR DEPLOYED'}
      badge={isVSC ? 'VSC' : 'SC'}
      badgeColor="#eab308"
    >
      <View style={styles.bannerWrapper}>
        <SafetyCarBanner status={status} delta={delta} speedLimit={speedLimit} />
      </View>
    </MomentaryOverlayContainer>
  );
};

const styles = StyleSheet.create({
  bannerWrapper: {
    width: '90%',
    maxWidth: 650
  }
});
