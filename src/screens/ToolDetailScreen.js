import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, StatusBar,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {colors, fontSizes, spacing, radius} from '../theme';
import FlagItem from '../components/FlagItem';

export default function ToolDetailScreen({route, navigation}) {
  const {tool, category} = route.params;

  const catColor = category?.color || colors.primary;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      <LinearGradient
        colors={[category?.gradientStart || colors.surface, colors.background]}
        style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>‹</Text>
          <Text style={styles.backText}>{category?.name || 'Back'}</Text>
        </TouchableOpacity>
        <View style={styles.toolHeader}>
          <Text style={styles.toolIcon}>{tool.icon}</Text>
          <View style={styles.toolTitleBlock}>
            <Text style={[styles.toolName, {color: catColor}]}>{tool.name}</Text>
            <View style={[styles.cmdPill, {borderColor: catColor + '55', backgroundColor: catColor + '15'}]}>
              <Text style={[styles.cmdText, {color: catColor}]}>{tool.command}</Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📖 TOOL DESCRIPTION</Text>
          <Text style={styles.description}>{tool.longDescription || tool.description}</Text>
        </View>

        {tool.hasTarget && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🎯 TARGET</Text>
            <View style={[styles.infoBox, {borderColor: catColor + '44'}]}>
              <Text style={styles.infoLabel}>Required:</Text>
              <Text style={styles.infoValue}>{tool.targetPlaceholder || 'IP Address / URL'}</Text>
            </View>
          </View>
        )}

        {tool.flags.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>⚙️ FLAGS & OPTIONS ({tool.flags.length})</Text>
            <Text style={styles.sectionDesc}>
              Each flag changes the tool's behaviour. Select the appropriate options before running.
            </Text>
            {tool.flags.map(flag => (
              <View key={flag.id} style={[styles.flagDetail, {borderColor: colors.border}]}>
                <View style={styles.flagHeader}>
                  <Text style={styles.flagName}>{flag.name}</Text>
                  {flag.flag && <Text style={styles.flagFlag}>{flag.flag}</Text>}
                </View>
                <Text style={styles.flagDesc}>{flag.description}</Text>
                {flag.type === 'select' && flag.options && (
                  <View style={styles.optionsBox}>
                    <Text style={styles.optionsLabel}>Available options:</Text>
                    {flag.options.map((opt, idx) => (
                      <View key={idx} style={styles.optionItem}>
                        <Text style={styles.optionValue}>{opt.value}</Text>
                        <Text style={styles.optionLabel}>{opt.label}</Text>
                      </View>
                    ))}
                  </View>
                )}
                {flag.placeholder && (
                  <View style={styles.placeholderBox}>
                    <Text style={styles.placeholderLabel}>Example:</Text>
                    <Text style={styles.placeholderValue}>{flag.placeholder}</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💡 TIPS</Text>
          <View style={styles.tipBox}>
            <Text style={styles.tipText}>• Start with default settings</Text>
            <Text style={styles.tipText}>• Use verbose mode (-v) for debugging</Text>
            <Text style={styles.tipText}>• Save results to files for analysis</Text>
            <Text style={styles.tipText}>• Test on your own networks</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.useBtn, {backgroundColor: catColor}]}
          onPress={() => navigation.navigate('Tool', {tool, category})}
          activeOpacity={0.8}>
          <Text style={styles.useBtnText}>▶ USE TOOL</Text>
        </TouchableOpacity>

        <View style={{height: 48}} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: colors.background},
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md, gap: 4},
  backIcon: {color: colors.textDim, fontSize: 22},
  backText: {color: colors.textDim, fontSize: fontSizes.md},
  toolHeader: {flexDirection: 'row', alignItems: 'center', gap: spacing.md},
  toolIcon: {fontSize: 36},
  toolTitleBlock: {flex: 1},
  toolName: {fontSize: fontSizes.xxl, fontWeight: '800'},
  cmdPill: {
    alignSelf: 'flex-start',
    borderRadius: radius.full,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderWidth: 1,
    marginTop: 4,
  },
  cmdText: {fontSize: fontSizes.xs, fontFamily: 'monospace', fontWeight: '700'},
  scroll: {flex: 1},
  scrollContent: {paddingBottom: spacing.xl},
  section: {marginHorizontal: spacing.lg, marginTop: spacing.xl},
  sectionTitle: {
    color: colors.textDim,
    fontSize: fontSizes.xs,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: spacing.md,
  },
  sectionDesc: {
    color: colors.textDim,
    fontSize: fontSizes.sm,
    marginBottom: spacing.md,
    lineHeight: 20,
  },
  description: {
    color: colors.text,
    fontSize: fontSizes.md,
    lineHeight: 24,
  },
  infoBox: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.lg,
  },
  infoLabel: {
    color: colors.textDim,
    fontSize: fontSizes.xs,
    fontWeight: '600',
    marginBottom: 4,
  },
  infoValue: {
    color: colors.text,
    fontSize: fontSizes.md,
    fontFamily: 'monospace',
  },
  flagDetail: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  flagHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  flagName: {
    color: colors.text,
    fontSize: fontSizes.md,
    fontWeight: '700',
  },
  flagFlag: {
    color: colors.primary,
    fontSize: fontSizes.sm,
    fontFamily: 'monospace',
    fontWeight: '700',
  },
  flagDesc: {
    color: colors.textDim,
    fontSize: fontSizes.sm,
    lineHeight: 18,
  },
  optionsBox: {
    marginTop: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    padding: spacing.sm,
  },
  optionsLabel: {
    color: colors.textDim,
    fontSize: fontSizes.xs,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  optionItem: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: 4,
  },
  optionValue: {
    color: colors.primary,
    fontSize: fontSizes.xs,
    fontFamily: 'monospace',
    fontWeight: '700',
  },
  optionLabel: {
    color: colors.text,
    fontSize: fontSizes.xs,
    flex: 1,
  },
  placeholderBox: {
    marginTop: spacing.sm,
  },
  placeholderLabel: {
    color: colors.textDim,
    fontSize: fontSizes.xs,
    fontWeight: '600',
  },
  placeholderValue: {
    color: colors.text,
    fontSize: fontSizes.xs,
    fontFamily: 'monospace',
    marginTop: 2,
  },
  tipBox: {
    backgroundColor: colors.primary + '10',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.primary + '30',
    padding: spacing.lg,
  },
  tipText: {
    color: colors.text,
    fontSize: fontSizes.sm,
    lineHeight: 22,
  },
  useBtn: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.xl,
    paddingVertical: spacing.lg,
    borderRadius: radius.lg,
    alignItems: 'center',
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  useBtnText: {
    color: colors.background,
    fontSize: fontSizes.lg,
    fontWeight: '800',
    letterSpacing: 1,
  },
});
