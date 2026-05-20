import React, {useState} from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, SafeAreaView,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {colors, fontSizes, spacing, radius} from '../theme';
import {ALL_TOOLS, CATEGORIES} from '../data';

export default function ToolsLibraryScreen({route, navigation}) {
  const {category} = route.params;
  const [search, setSearch] = useState('');

  const allTools = [];
  Object.entries(ALL_TOOLS).forEach(([categoryId, tools]) => {
    const cat = CATEGORIES.find(c => c.id === categoryId);
    tools.forEach(tool => {
      allTools.push({...tool, categoryId, category: cat});
    });
  });

  const filteredTools = search.trim()
    ? allTools.filter(t =>
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.description.toLowerCase().includes(search.toLowerCase()) ||
        t.command.toLowerCase().includes(search.toLowerCase())
      )
    : allTools;

  return (
    <SafeAreaView style={styles.safe}>
      <LinearGradient
        colors={[category?.gradientStart || colors.surface, colors.background]}
        style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>‹</Text>
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerIcon}>{category?.icon || '📚'}</Text>
          <View style={styles.headerTextBlock}>
            <Text style={styles.headerTitle}>{category?.name || 'Tools Library'}</Text>
            <Text style={styles.headerSub}>{allTools.length} Kali Linux tools</Text>
          </View>
        </View>

        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔎</Text>
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Search tools..."
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Text style={styles.clearBtn}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>

        {filteredTools.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🔍</Text>
            <Text style={styles.emptyText}>No tools found</Text>
          </View>
        ) : (
          filteredTools.map(tool => (
            <TouchableOpacity
              key={`${tool.categoryId}-${tool.id}`}
              style={styles.toolCard}
              onPress={() => navigation.navigate('ToolDetail', {tool, category: tool.category})}
              activeOpacity={0.7}>
              <View style={styles.toolHeader}>
                <Text style={styles.toolIcon}>{tool.icon}</Text>
                <View style={styles.toolInfo}>
                  <Text style={styles.toolName}>{tool.name}</Text>
                  <Text style={styles.toolCmd}>{tool.command}</Text>
                </View>
                <View style={[styles.catBadge, {backgroundColor: tool.category?.color + '20'}]}>
                  <Text style={[styles.catBadgeText, {color: tool.category?.color}]}>{tool.category?.icon}</Text>
                </View>
              </View>
              <Text style={styles.toolDesc} numberOfLines={2}>{tool.description}</Text>
              <View style={styles.toolFooter}>
                <Text style={styles.detailLabel}>ℹ️ Details</Text>
                <Text style={styles.arrow}>›</Text>
              </View>
            </TouchableOpacity>
          ))
        )}

        <View style={{height: 32}} />
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
  headerContent: {flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.md},
  headerIcon: {fontSize: 36},
  headerTextBlock: {flex: 1},
  headerTitle: {
    color: colors.text,
    fontSize: fontSizes.xxl,
    fontWeight: '800',
  },
  headerSub: {
    color: colors.textDim,
    fontSize: fontSizes.sm,
    marginTop: 2,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  searchIcon: {fontSize: 16},
  searchInput: {
    flex: 1,
    color: colors.text,
    fontSize: fontSizes.md,
    paddingVertical: spacing.md,
  },
  clearBtn: {
    color: colors.textDim,
    fontSize: fontSizes.md,
    padding: 4,
  },
  scroll: {flex: 1},
  scrollContent: {paddingTop: spacing.lg},
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {fontSize: 48, marginBottom: spacing.md},
  emptyText: {
    color: colors.textDim,
    fontSize: fontSizes.md,
  },
  toolCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.lg,
  },
  toolHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  toolIcon: {fontSize: 28},
  toolInfo: {flex: 1},
  toolName: {
    color: colors.text,
    fontSize: fontSizes.lg,
    fontWeight: '700',
  },
  toolCmd: {
    color: colors.primary,
    fontSize: fontSizes.xs,
    fontFamily: 'monospace',
    fontWeight: '700',
  },
  catBadge: {
    borderRadius: radius.full,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  catBadgeText: {fontSize: 12},
  toolDesc: {
    color: colors.textDim,
    fontSize: fontSizes.sm,
    lineHeight: 18,
    marginBottom: spacing.md,
  },
  toolFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  detailLabel: {
    color: colors.primary,
    fontSize: fontSizes.sm,
    fontWeight: '600',
  },
  arrow: {
    color: colors.textDim,
    fontSize: 20,
  },
});
