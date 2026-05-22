import React, {useState} from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, StatusBar, SafeAreaView, Image,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {colors, fontSizes, spacing, radius, gradients} from '../theme';
import {useApp} from '../context/AppContext';
import ConnectionBadge from '../components/ConnectionBadge';
import CategoryCard from '../components/CategoryCard';
import {CATEGORIES, searchAllTools} from '../data';

export default function DashboardScreen({navigation}) {
  const {isConnected, history, connect, disconnect} = useApp();
  const [search, setSearch] = useState('');

  const filteredCategories = search.trim()
    ? null
    : CATEGORIES;

  const searchResults = search.trim() ? searchAllTools(search) : [];

  const handleConnectionToggle = async () => {
    if (isConnected) {
      await disconnect();
    } else {
      await connect();
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      <LinearGradient colors={gradients.header} style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerLeft}>
            <Image source={require('../assets/fsociety-mask.png')} style={styles.maskIcon} resizeMode="contain" />
            <Text style={styles.headerTitle}>Kali GUI.</Text>
          </View>
          <ConnectionBadge onPress={handleConnectionToggle} />
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
        keyboardShouldPersistTaps="handled">

        {!isConnected && (
          <TouchableOpacity style={styles.warnBanner} onPress={handleConnectionToggle} activeOpacity={0.8}>
            <Text style={styles.warnIcon}>⚠️</Text>
            <View>
              <Text style={styles.warnTitle}>SSH Disconnected</Text>
              <Text style={styles.warnText}>Tap to connect to your Kali host</Text>
            </View>
            <Text style={styles.warnArrow}>›</Text>
          </TouchableOpacity>
        )}

        {isConnected && (
          <>
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{history.length}</Text>
                <Text style={styles.statLabel}>Executed</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={[styles.statValue, {color: colors.primary}]}>●</Text>
                <Text style={styles.statLabel}>Connected</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>130+</Text>
                <Text style={styles.statLabel}>Tools</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.scannerBtn}
              onPress={() => navigation.navigate('ToolScanner')}
              activeOpacity={0.8}>
              <Text style={styles.scannerBtnIcon}>🔍</Text>
              <View style={styles.scannerBtnTextWrap}>
                <Text style={styles.scannerBtnTitle}>Tool Scanner</Text>
                <Text style={styles.scannerBtnSub}>Detect installed tools · Install missing</Text>
              </View>
              <Text style={styles.scannerBtnArrow}>›</Text>
            </TouchableOpacity>
          </>
        )}

        {search.trim() ? (
          <View style={styles.searchResults}>
            <Text style={styles.sectionTitle}>
              {`Results for "${search}" (${searchResults.length})`}
            </Text>
            {searchResults.length === 0 ? (
              <View style={styles.emptySearch}>
                <Text style={styles.emptyIcon}>🔍</Text>
                <Text style={styles.emptyText}>No tools found</Text>
              </View>
            ) : (
              searchResults.map(tool => (
                <TouchableOpacity
                  key={`${tool.categoryId}-${tool.id}`}
                  style={styles.searchItem}
                  onPress={() => navigation.navigate('Tool', {tool, categoryId: tool.categoryId})}
                  activeOpacity={0.7}>
                  <Text style={styles.searchItemIcon}>{tool.icon}</Text>
                  <View style={styles.searchItemContent}>
                    <Text style={styles.searchItemName}>{tool.name}</Text>
                    <Text style={styles.searchItemDesc} numberOfLines={1}>{tool.description}</Text>
                    <View style={styles.searchItemBadge}>
                      <Text style={styles.searchItemCmd}>{tool.command}</Text>
                    </View>
                  </View>
                  <Text style={styles.searchItemArrow}>›</Text>
                </TouchableOpacity>
              ))
            )}
          </View>
        ) : (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>TOOL CATEGORIES</Text>
              <Text style={styles.sectionCount}>{CATEGORIES.length} categories</Text>
            </View>
            {CATEGORIES.map(category => (
              <CategoryCard
                key={category.id}
                category={category}
                onPress={() => navigation.navigate('Category', {category})}
              />
            ))}
          </>
        )}

        <View style={{height: 32}} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  maskIcon: {
    width: 36,
    height: 36,
    tintColor: colors.primary,
  },
  headerTitle: {
    color: colors.primary,
    fontSize: fontSizes.xxl,
    fontWeight: '900',
    letterSpacing: 4,
    fontFamily: 'monospace',
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
  searchIcon: {
    fontSize: 16,
  },
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
  aiButton: {
    marginTop: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary + '20',
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.primary + '55',
    gap: spacing.sm,
  },
  aiButtonIcon: {
    fontSize: 20,
  },
  aiButtonText: {
    color: colors.primary,
    fontSize: fontSizes.md,
    fontWeight: '700',
  },
  scroll: {
    flex: 1,
  },
  warnBanner: {
    margin: spacing.lg,
    backgroundColor: colors.warning + '15',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.warning + '44',
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  warnIcon: {
    fontSize: 24,
  },
  warnTitle: {
    color: colors.warning,
    fontSize: fontSizes.md,
    fontWeight: '700',
  },
  warnText: {
    color: colors.textDim,
    fontSize: fontSizes.xs,
    marginTop: 2,
  },
  warnArrow: {
    color: colors.warning,
    fontSize: 24,
    marginLeft: 'auto',
  },
  statsRow: {
    flexDirection: 'row',
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  scannerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
  },
  scannerBtnIcon: { fontSize: 24 },
  scannerBtnTextWrap: { flex: 1 },
  scannerBtnTitle: { color: colors.text, fontSize: fontSizes.md, fontWeight: '700' },
  scannerBtnSub: { color: colors.textDim, fontSize: fontSizes.xs, marginTop: 2 },
  scannerBtnArrow: { color: colors.primary, fontSize: 24, marginLeft: 'auto' },
  statCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    alignItems: 'center',
  },
  statValue: {
    color: colors.secondary,
    fontSize: fontSizes.xl,
    fontWeight: '800',
  },
  statLabel: {
    color: colors.textDim,
    fontSize: fontSizes.xs,
    marginTop: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    color: colors.textDim,
    fontSize: fontSizes.xs,
    fontWeight: '700',
    letterSpacing: 2,
  },
  sectionCount: {
    color: colors.primary,
    fontSize: fontSizes.xs,
    fontWeight: '600',
  },
  searchResults: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  emptySearch: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: spacing.md,
  },
  emptyText: {
    color: colors.textDim,
    fontSize: fontSizes.md,
  },
  searchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  searchItemIcon: {
    fontSize: 24,
  },
  searchItemContent: {
    flex: 1,
  },
  searchItemName: {
    color: colors.text,
    fontSize: fontSizes.md,
    fontWeight: '700',
  },
  searchItemDesc: {
    color: colors.textDim,
    fontSize: fontSizes.xs,
    marginTop: 2,
  },
  searchItemBadge: {
    marginTop: 4,
    alignSelf: 'flex-start',
    backgroundColor: colors.primary + '15',
    borderRadius: radius.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: colors.primary + '40',
  },
  searchItemCmd: {
    color: colors.primary,
    fontSize: fontSizes.xs,
    fontFamily: 'monospace',
    fontWeight: '700',
  },
  searchItemArrow: {
    color: colors.textDim,
    fontSize: 20,
  },
});
