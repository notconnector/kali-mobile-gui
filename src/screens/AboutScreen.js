import React from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, SafeAreaView, StatusBar,
} from 'react-native';
import {colors, fontSizes, spacing, radius} from '../theme';
import {useApp} from '../context/AppContext';
import {getTotalToolsCount, getToolsCountByCategory, CATEGORIES} from '../data';

const APP_VERSION = '1.3.0';

export default function AboutScreen({navigation}) {
  const {customTools} = useApp();
  const builtinCount = getTotalToolsCount();
  const totalCount = builtinCount + customTools.length;
  const countByCategory = getToolsCountByCategory();

  const StatCard = ({icon, value, label, color}) => (
    <View style={[styles.statCard, {borderColor: (color || colors.primary) + '44'}]}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={[styles.statValue, {color: color || colors.primary}]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
          <Text style={styles.backBtn}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>About</Text>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Hero */}
        <View style={styles.hero}>
          <Text style={styles.heroMask}>💀</Text>
          <Text style={styles.heroName}>Kali Remote GUI</Text>
          <View style={styles.versionBadge}>
            <Text style={styles.versionText}>v{APP_VERSION}</Text>
          </View>
          <Text style={styles.heroDesc}>Professional mobile interface for Kali Linux penetration testing</Text>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <StatCard icon="🛠️" value={builtinCount} label="Built-in tools" color={colors.primary} />
          <StatCard icon="⚙️" value={customTools.length} label="Custom tools" color={colors.secondary || colors.warning} />
          <StatCard icon="📦" value={totalCount} label="Total tools" color={colors.text} />
        </View>

        {/* Tools by category */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>TOOLS BY CATEGORY</Text>
          {CATEGORIES.filter(c => c.id !== 'custom' && c.id !== 'library').map(cat => {
            const count = countByCategory[cat.id] || 0;
            if (!count) return null;
            return (
              <View key={cat.id} style={styles.catRow}>
                <Text style={styles.catIcon}>{cat.icon}</Text>
                <Text style={styles.catName}>{cat.name}</Text>
                <View style={[styles.catBadge, {backgroundColor: cat.color + '22', borderColor: cat.color + '55'}]}>
                  <Text style={[styles.catCount, {color: cat.color}]}>{count}</Text>
                </View>
              </View>
            );
          })}
          {customTools.length > 0 && (
            <View style={styles.catRow}>
              <Text style={styles.catIcon}>⚙️</Text>
              <Text style={styles.catName}>Custom</Text>
              <View style={[styles.catBadge, {backgroundColor: colors.primary + '22', borderColor: colors.primary + '55'}]}>
                <Text style={[styles.catCount, {color: colors.primary}]}>{customTools.length}</Text>
              </View>
            </View>
          )}
        </View>

        {/* App info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>APPLICATION INFO</Text>
          <InfoRow label="Version" value={`v${APP_VERSION}`} />
          <InfoRow label="Platform" value="Android" />
          <InfoRow label="React Native" value="0.73.6" />
          <InfoRow label="Bridge Protocol" value="WebSocket (ws://)" />
          <InfoRow label="License" value="MIT" />
        </View>

        {/* Features */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>FEATURES</Text>
          {[
            ['🔌', 'WebSocket bridge communication'],
            ['💻', 'Live interactive terminal (PTY)'],
            ['📡', 'Tool Scanner — detect & install tools'],
            ['📜', 'Command history & search'],
            ['⚙️', 'Custom tool profiles'],
            ['🔒', 'Auth token + rate limiting bridge'],
            ['🐳', 'Docker bridge deployment support'],
          ].map(([icon, text]) => (
            <View key={text} style={styles.featureRow}>
              <Text style={styles.featureIcon}>{icon}</Text>
              <Text style={styles.featureText}>{text}</Text>
            </View>
          ))}
        </View>

        <View style={{height: 48}} />
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({label, value}) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: colors.background},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.md,
  },
  backBtn: {color: colors.primary, fontSize: fontSizes.md, fontWeight: '600'},
  headerTitle: {color: colors.text, fontSize: fontSizes.lg, fontWeight: '800'},
  scroll: {flex: 1},
  hero: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  heroMask: {fontSize: 56, marginBottom: spacing.sm},
  heroName: {
    color: colors.primary,
    fontSize: fontSizes.xl,
    fontWeight: '900',
    letterSpacing: 2,
    fontFamily: 'monospace',
  },
  versionBadge: {
    marginTop: spacing.sm,
    backgroundColor: colors.primary + '22',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.primary + '55',
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
  },
  versionText: {color: colors.primary, fontSize: fontSizes.sm, fontWeight: '700', fontFamily: 'monospace'},
  heroDesc: {
    color: colors.textDim,
    fontSize: fontSizes.sm,
    textAlign: 'center',
    marginTop: spacing.md,
    lineHeight: 20,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.md,
    alignItems: 'center',
    gap: 4,
  },
  statIcon: {fontSize: 20},
  statValue: {fontSize: fontSizes.xl, fontWeight: '900', fontFamily: 'monospace'},
  statLabel: {color: colors.textDim, fontSize: 10, textAlign: 'center'},
  section: {
    marginTop: spacing.lg,
    marginHorizontal: spacing.lg,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  sectionTitle: {
    color: colors.textDim,
    fontSize: fontSizes.xs,
    fontWeight: '800',
    letterSpacing: 2,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  catRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border + '66',
    gap: spacing.sm,
  },
  catIcon: {fontSize: 16, width: 24, textAlign: 'center'},
  catName: {flex: 1, color: colors.text, fontSize: fontSizes.sm},
  catBadge: {
    borderRadius: radius.sm,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    minWidth: 32,
    alignItems: 'center',
  },
  catCount: {fontSize: fontSizes.sm, fontWeight: '800', fontFamily: 'monospace'},
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border + '66',
  },
  infoLabel: {color: colors.textDim, fontSize: fontSizes.sm},
  infoValue: {color: colors.text, fontSize: fontSizes.sm, fontWeight: '600', fontFamily: 'monospace'},
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border + '66',
    gap: spacing.md,
  },
  featureIcon: {fontSize: 16, width: 24, textAlign: 'center'},
  featureText: {color: colors.text, fontSize: fontSizes.sm, flex: 1},
});
