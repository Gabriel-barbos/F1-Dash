import React from 'react';
import { View, StyleSheet } from 'react-native';
import { MomentaryOverlayContainer } from './MomentaryOverlayContainer';
import { PitLaneBanner } from '../PitLaneBanner';

interface PitLaneMomentaryOverlayProps {
  onDismiss: () => void;
  speedLimit?: number;
  currentSpeed?: number;
  timeInLaneMS?: number;
}

export const PitLaneMomentaryOverlay: React.FC<PitLaneMomentaryOverlayProps> = ({
  onDismiss,
  speedLimit = 80,
  currentSpeed = 78,
  timeInLaneMS = 3200
}) => {
  return (
    <MomentaryOverlayContainer
      durationSeconds={6}
      onDismiss={onDismiss}
      title="PIT LANE ENTRY - SPEED LIMITER ACTIVE"
      badge="PIT LIMITER"
      badgeColor="#3b82f6"
    >
      <View style={styles.bannerWrapper}>
        <PitLaneBanner
          speedLimit={speedLimit}
          currentSpeed={currentSpeed}
          timeInLaneMS={timeInLaneMS}
        />
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
