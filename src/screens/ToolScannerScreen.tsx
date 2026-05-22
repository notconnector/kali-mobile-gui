import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Alert,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, fontSizes, spacing, radius } from '../theme';
import { useApp } from '../context/AppContext';
import { KNOWN_TOOLS, type KnownTool } from '../data/known-tools';

type RootStackParamList = {
  ToolScanner: undefined;
};

type Props = NativeStackScreenProps<RootStackParamList, 'ToolScanner'>;

const FILTERS = ['All', 'Installed', 'Missing'] as const;
type FilterType = (typeof FILTERS)[number];

interface ScanResult {
  installed: Set<string>;
  missing: Set<string>;
}

function parseWhichOutput(raw: string): ScanResult {
  const installed = new Set<string>();
  const missing = new Set<string>();
  raw.split('\n').forEach((line: string) => {
    const l = line.trim();
    if (l.startsWith('OK:')) installed.add(l.slice(3).trim());
    if (l.startsWith('MISS:')) missing.add(l.slice(5).trim());
  });
  return { installed, missing };
}

export default function ToolScannerScreen({ navigation }: Props) {
  const { executeCommand, addCustomTool, isConnected, customTools } = useApp();
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [scanning, setScanning] = useState(false);
  const [installing, setInstalling] = useState<Record<string, boolean>>({});
  const [filter, setFilter] = useState<FilterType>('All');

  const existingCommands = useMemo(
    () => new Set(customTools.map((t) => t.command)),
    [customTools]
  );

  const buildScanCmd = (): string => {
    const cmds = [...new Set(KNOWN_TOOLS.map((t) => t.command))];
    return cmds
      .map((c) => `which "${c}" > /dev/null 2>&1 && echo "OK:${c}" || echo "MISS:${c}"`)
      .join('; ');
  };

  const runScan = async () => {
    if (!isConnected) {
      Alert.alert('Not connected', 'Connect to the bridge first (Settings → Connect).');
      return;
    }
    setScanning(true);
    setScanResult(null);
    try {
      const out = await executeCommand(buildScanCmd());
      setScanResult(parseWhichOutput(out || ''));
    } catch (e: any) {
      Alert.alert('Scan failed', e.message);
    } finally {
      setScanning(false);
    }
  };

  const installTool = async (tool: KnownTool) => {
    setInstalling((prev) => ({ ...prev, [tool.package]: true }));
    try {
      await executeCommand(`apt-get install -y ${tool.package} 2>&1`);
      setScanResult((prev) => {
        if (!prev) return null;
        const newInstalled = new Set(prev.installed);
        newInstalled.add(tool.command);
        const newMissing = new Set(prev.missing);
        newMissing.delete(tool.command);
        return { installed: newInstalled, missing: newMissing };
      });
      Alert.alert('Installed', `${tool.name} installed successfully.`);
    } catch (e: any) {
      Alert.alert('Install failed', e.message);
    } finally {
      setInstalling((prev) => ({ ...prev, [tool.package]: false }));
    }
  };

  const addToApp = async (tool: KnownTool) => {
    await addCustomTool({
      name: tool.name,
      command: tool.command,
      description: tool.description,
      category: tool.category,
    });
    Alert.alert('Added', `"${tool.name}" added to Custom Tools.`);
  };

  const listData = useMemo(() => {
    const deduped = KNOWN_TOOLS.filter((tool, idx, arr) => {
      return arr.findIndex((t) => t.command === tool.command) === idx;
    });
    return deduped.filter((tool) => {
      if (!scanResult) return true;
      if (filter === 'Installed') return scanResult.installed.has(tool.command);
      if (filter === 'Missing') return scanResult.missing.has(tool.command) || !scanResult.installed.has(tool.command);
      return true;
    });
  }, [filter, scanResult]);

  const stats = useMemo(() => {
    if (!scanResult) return null;
    const total = KNOWN_TOOLS.length;
    const installed = scanResult.installed.size;
    return { total, installed, missing: total - installed };
  }, [scanResult]);

  const renderItem = ({ item: tool }: { item: KnownTool }) => {
    const isInstalled = scanResult?.installed.has(tool.command);
    const isMissing = scanResult ? !isInstalled : null;
    const isInApp = existingCommands.has(tool.command);
    const isPkg = installing[tool.package];

    return (
      <View style={styles.row}>
        <View style={styles.rowLeft}>
          <Text style={styles.toolIcon}>{tool.icon}</Text>
          <View style={styles.rowInfo}>
            <View style={styles.rowTitleLine}>
              <Text style={styles.toolName}>{tool.name}</Text>
              {scanResult && (
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: isInstalled ? colors.primary + '22' : colors.error + '18' },
                  ]}>
                  <Text style={[styles.statusText, { color: isInstalled ? colors.primary : colors.error }]}>
                    {isInstalled ? '✓' : '✗'}
                  </Text>
                </View>
              )}
            </View>
            <Text style={styles.toolCmd} numberOfLines={1}>
              {tool.command} · apt: {tool.package}
            </Text>
            <Text style={styles.toolDesc} numberOfLines={1}>
              {tool.description}
            </Text>
          </View>
        </View>
        <View style={styles.rowActions}>
          {scanResult && isMissing && (
            <TouchableOpacity
              style={[styles.actionBtn, styles.installBtn]}
              onPress={() => installTool(tool)}
              disabled={isPkg}
              activeOpacity={0.8}>
              {isPkg ? (
                <ActivityIndicator size="small" color={colors.background} />
              ) : (
                <Text style={styles.installBtnText}>Install</Text>
              )}
            </TouchableOpacity>
          )}
          {scanResult && isInstalled && !isInApp && (
            <TouchableOpacity
              style={[styles.actionBtn, styles.addBtn]}
              onPress={() => addToApp(tool)}
              activeOpacity={0.8}>
              <Text style={styles.addBtnText}>+ Add</Text>
            </TouchableOpacity>
          )}
          {isInApp && (
            <View style={styles.inAppBadge}>
              <Text style={styles.inAppText}>In app</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={styles.backBtn}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tool Scanner</Text>
        <Text style={styles.headerSub}>Detect installed tools · Install missing · Add to app</Text>
      </View>

      <View style={styles.actionBar}>
        <TouchableOpacity
          style={[styles.scanBtn, scanning && styles.scanBtnDisabled]}
          onPress={runScan}
          disabled={scanning}
          activeOpacity={0.8}>
          {scanning ? (
            <>
              <ActivityIndicator size="small" color={colors.background} style={{ marginRight: 8 }} />
              <Text style={styles.scanBtnText}>Scanning...</Text>
            </>
          ) : (
            <Text style={styles.scanBtnText}>{scanResult ? 'Rescan' : 'Scan installed tools'}</Text>
          )}
        </TouchableOpacity>
        {stats && (
          <View style={styles.statsRow}>
            <Text style={[styles.statChip, { color: colors.primary }]}>{stats.installed}</Text>
            <Text style={[styles.statChip, { color: colors.error }]}>{stats.missing}</Text>
            <Text style={[styles.statChip, { color: colors.textDim }]}>/ {stats.total}</Text>
          </View>
        )}
      </View>

      <View style={styles.filterBar}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterTab, filter === f && styles.filterTabActive]}
            onPress={() => setFilter(f)}
            activeOpacity={0.8}>
            <Text style={[styles.filterTabText, filter === f && styles.filterTabTextActive]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={listData}
        renderItem={renderItem}
        keyExtractor={(item) => item.command + item.category}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🔍</Text>
            <Text style={styles.emptyText}>
              {filter === 'Installed'
                ? 'No installed tools found'
                : filter === 'Missing'
                  ? 'All tools installed!'
                  : 'Tap Scan to check installed tools'}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 2,
  },
  backBtn: { color: colors.primary, fontSize: fontSizes.sm, marginBottom: spacing.xs },
  headerTitle: { color: colors.text, fontSize: fontSizes.lg, fontWeight: '800' },
  headerSub: { color: colors.textDim, fontSize: fontSizes.xs },
  actionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  scanBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  scanBtnDisabled: { opacity: 0.6 },
  scanBtnText: { color: colors.background, fontSize: fontSizes.sm, fontWeight: '700' },
  statsRow: { flexDirection: 'row', gap: spacing.sm, flex: 1, justifyContent: 'flex-end' },
  statChip: { fontSize: fontSizes.sm, fontWeight: '700', fontFamily: 'monospace' },
  filterBar: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  filterTab: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  filterTabActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterTabText: { color: colors.textDim, fontSize: fontSizes.xs, fontWeight: '600' },
  filterTabTextActive: { color: colors.background },
  list: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: 48 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  rowLeft: { flexDirection: 'row', alignItems: 'flex-start', flex: 1, gap: spacing.sm },
  toolIcon: { fontSize: 22, marginTop: 2 },
  rowInfo: { flex: 1, gap: 2 },
  rowTitleLine: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  toolName: { color: colors.text, fontSize: fontSizes.sm, fontWeight: '700', flex: 1 },
  statusBadge: {
    borderRadius: radius.sm,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  statusText: { fontSize: fontSizes.xs, fontWeight: '800' },
  toolCmd: { color: colors.primary, fontSize: 10, fontFamily: 'monospace' },
  toolDesc: { color: colors.textDim, fontSize: fontSizes.xs, lineHeight: 15 },
  rowActions: { flexDirection: 'column', gap: 4, alignItems: 'flex-end' },
  actionBtn: {
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    minWidth: 64,
    alignItems: 'center',
  },
  installBtn: { backgroundColor: colors.error + '25', borderWidth: 1, borderColor: colors.error + '55' },
  installBtnText: { color: colors.error, fontSize: fontSizes.xs, fontWeight: '700' },
  addBtn: { backgroundColor: colors.primary + '22', borderWidth: 1, borderColor: colors.primary + '55' },
  addBtnText: { color: colors.primary, fontSize: fontSizes.xs, fontWeight: '700' },
  inAppBadge: {
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    backgroundColor: (colors as any).secondary + '15',
    borderWidth: 1,
    borderColor: (colors as any).secondary + '40',
  },
  inAppText: { color: (colors as any).secondary, fontSize: fontSizes.xs },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyIcon: { fontSize: 40, marginBottom: spacing.md },
  emptyText: { color: colors.textDim, fontSize: fontSizes.sm, textAlign: 'center' },
});
