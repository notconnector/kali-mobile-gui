import React, {useState} from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, SafeAreaView, StatusBar,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {colors, fontSizes, spacing, radius} from '../theme';
import {getToolsByCategory} from '../data';

export default function CategoryScreen({route, navigation}) {
  const {category} = route.params;

  // Special handling for library category
  if (category.id === 'library') {
    navigation.replace('ToolsLibrary', {category});
    return null;
  }

  const [search, setSearch] = useState('');
  const allTools = getToolsByCategory(category.id);
  const tools = search.trim()
    ? allTools.filter(t =>
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.description.toLowerCase().includes(search.toLowerCase()) ||
        t.command.toLowerCase().includes(search.toLowerCase()),
      )
    : allTools;

  const renderTool = ({item: tool}) => (
    <TouchableOpacity
      style={styles.toolCard}
      onPress={() => navigation.navigate('Tool', {tool, categoryId: category.id, category})}
      activeOpacity={0.75}>
      <View style={[styles.toolIconContainer, {borderColor: category.color + '44'}]}>
        <Text style={styles.toolIcon}>{tool.icon}</Text>
      </View>
      <View style={styles.toolContent}>
        <View style={styles.toolHeader}>
          <Text style={styles.toolName}>{tool.name}</Text>
          <View style={[styles.cmdBadge, {borderColor: category.color + '44', backgroundColor: category.color + '11'}]}>
            <Text style={[styles.cmdText, {color: category.color}]}>{tool.command.split(' ')[0]}</Text>
          </View>
        </View>
        <Text style={styles.toolDesc} numberOfLines={2}>{tool.description}</Text>
        <View style={styles.toolFooter}>
          <Text style={styles.flagCount}>{tool.flags.length} flag</Text>
          {tool.hasTarget && (
            <View style={styles.targetBadge}>
              <Text style={styles.targetBadgeText}>🎯 requires target</Text>
            </View>
          )}
        </View>
      </View>
      <Text style={[styles.arrow, {color: category.color}]}>›</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      <LinearGradient
        colors={[category.gradientStart, category.gradientEnd]}
        style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>‹</Text>
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.categoryIcon}>{category.icon}</Text>
          <View>
            <Text style={[styles.categoryName, {color: category.color}]}>{category.name}</Text>
            <Text style={styles.categoryDesc} numberOfLines={2}>{category.description}</Text>
          </View>
        </View>
        <View style={[styles.statsBar, {borderColor: category.color + '33'}]}>
          <Text style={[styles.statsText, {color: category.color}]}>{tools.length} tools</Text>
          <View style={[styles.statsDot, {backgroundColor: category.color}]} />
          <Text style={styles.statsTextDim}>{category.nameEn}</Text>
        </View>
      </LinearGradient>

      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔎</Text>
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Filter tools..."
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
      </View>

      <FlatList
        data={tools}
        renderItem={renderTool}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🔍</Text>
            <Text style={styles.emptyText}>No tools found</Text>
          </View>
        }
      />
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
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: 4,
  },
  backIcon: {color: colors.textDim, fontSize: 22},
  backText: {color: colors.textDim, fontSize: fontSizes.md},
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  categoryIcon: {fontSize: 36},
  categoryName: {fontSize: fontSizes.xxl, fontWeight: '800', letterSpacing: 0.5},
  categoryDesc: {color: colors.textDim, fontSize: fontSizes.xs, marginTop: 3, maxWidth: 260},
  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderTopWidth: 1,
    paddingTop: spacing.sm,
  },
  statsText: {fontSize: fontSizes.xs, fontWeight: '700'},
  statsDot: {width: 4, height: 4, borderRadius: 2},
  statsTextDim: {color: colors.textDim, fontSize: fontSizes.xs},
  searchRow: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  searchBox: {
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
  clearBtn: {color: colors.textDim, fontSize: fontSizes.md, padding: 4},
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 32,
  },
  toolCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  toolIconContainer: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  toolIcon: {fontSize: 22},
  toolContent: {flex: 1},
  toolHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  toolName: {color: colors.text, fontSize: fontSizes.lg, fontWeight: '700', flex: 1},
  cmdBadge: {
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderWidth: 1,
  },
  cmdText: {fontSize: fontSizes.xs, fontFamily: 'monospace', fontWeight: '700'},
  toolDesc: {color: colors.textDim, fontSize: fontSizes.xs, lineHeight: 16, marginBottom: spacing.sm},
  toolFooter: {flexDirection: 'row', alignItems: 'center', gap: spacing.sm},
  flagCount: {color: colors.textMuted, fontSize: fontSizes.xs},
  targetBadge: {
    backgroundColor: colors.accent + '20',
    borderRadius: radius.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: colors.accent + '44',
  },
  targetBadgeText: {color: colors.accent, fontSize: fontSizes.xs},
  arrow: {fontSize: 24},
  empty: {alignItems: 'center', paddingVertical: 60},
  emptyIcon: {fontSize: 40, marginBottom: spacing.md},
  emptyText: {color: colors.textDim, fontSize: fontSizes.md},
});
