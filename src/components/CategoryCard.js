import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {colors, fontSizes, spacing, radius, shadows} from '../theme';

export default function CategoryCard({category, onPress}) {
  return (
    <TouchableOpacity
      style={styles.wrapper}
      onPress={onPress}
      activeOpacity={0.75}>
      <LinearGradient
        colors={[category.gradientStart, category.gradientEnd]}
        style={styles.container}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}>
        <View style={[styles.iconContainer, {borderColor: category.color + '44'}]}>
          <Text style={styles.icon}>{category.icon}</Text>
        </View>
        <View style={styles.content}>
          <Text style={[styles.name, {color: category.color}]} numberOfLines={1}>
            {category.name}
          </Text>
          <Text style={styles.description} numberOfLines={2}>
            {category.description}
          </Text>
          <View style={styles.footer}>
            <View style={[styles.badge, {backgroundColor: category.color + '22', borderColor: category.color + '55'}]}>
              <Text style={[styles.badgeText, {color: category.color}]}>
                {category.toolCount} narzędzi
              </Text>
            </View>
          </View>
        </View>
        <View style={[styles.glow, {backgroundColor: category.color + '08'}]} />
        <Text style={styles.arrow}>›</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    borderRadius: radius.lg,
    ...shadows.card,
  },
  container: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
    overflow: 'hidden',
    minHeight: 90,
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  icon: {
    fontSize: 26,
  },
  content: {
    flex: 1,
  },
  name: {
    fontSize: fontSizes.lg,
    fontWeight: '700',
    marginBottom: 3,
  },
  description: {
    color: colors.textDim,
    fontSize: fontSizes.xs,
    lineHeight: 16,
    marginBottom: spacing.sm,
  },
  footer: {
    flexDirection: 'row',
  },
  badge: {
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: fontSizes.xs,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  arrow: {
    color: colors.textDim,
    fontSize: 24,
    fontWeight: '300',
  },
  glow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: radius.lg,
  },
});
