import React from 'react';
import { View, StyleSheet } from 'react-native';
import { MomentaryOverlayContainer } from './MomentaryOverlayContainer';
import { RedFlagBanner } from '../RedFlagBanner';

interface RedFlagMomentaryOverlayProps {
  onDismiss: () => void;
}

export const RedFlagMomentaryOverlay: React.FC<RedFlagMomentaryOverlayProps> = ({ onDismiss }) => {
  return (
    <MomentaryOverlayContainer
      durationSeconds={6}
      onDismiss={onDismiss}
      title="RED FLAG - SESSION SUSPENDED"
      badge="RED FLAG"
      badgeColor="#ef4444"
    >
      <View style={styles.bannerWrapper}>
        <RedFlagBanner />
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
