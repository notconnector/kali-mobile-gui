import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity, ActivityIndicator} from 'react-native';
import {colors, fontSizes, radius, spacing} from '../theme';
import {useApp} from '../context/AppContext';

export default function ConnectionBadge({onPress}) {
  const {isConnected, isConnecting, connectionError} = useApp();

  const getStatus = () => {
    if (isConnecting) return {label: 'ŁĄCZENIE...', color: colors.warning, pulse: true};
    if (isConnected) return {label: 'POŁĄCZONO', color: colors.primary, pulse: false};
    return {label: 'ROZŁĄCZONO', color: colors.error, pulse: false};
  };

  const status = getStatus();

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.dot, {backgroundColor: status.color}]} />
      {isConnecting ? (
        <ActivityIndicator size="small" color={status.color} style={styles.spinner} />
      ) : null}
      <Text style={[styles.label, {color: status.color}]}>{status.label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  spinner: {
    marginLeft: -2,
  },
  label: {
    fontSize: fontSizes.xs,
    fontWeight: '700',
    letterSpacing: 1,
  },
});
