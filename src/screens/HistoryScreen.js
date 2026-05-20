import React, {useState} from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  SafeAreaView, StatusBar, Alert,
} from 'react-native';
import {colors, fontSizes, spacing, radius} from '../theme';
import {useApp} from '../context/AppContext';

const STATUS_COLORS = {
  done: colors.primary,
  error: colors.error,
  running: colors.warning,
};

const STATUS_LABELS = {
  done: '✓',
  error: '✗',
  running: '⟳',
};

export default function HistoryScreen() {
  const {history, dispatch, executeCommand, isConnected} = useApp();
  const [expanded, setExpanded] = useState(null);

  const clearHistory = () => {
    Alert.alert('Clear History', 'Are you sure you want to delete all command history?', [
      {text: 'Cancel', style: 'cancel'},
      {text: 'Clear', style: 'destructive', onPress: () => dispatch({type: 'CLEAR_HISTORY'})},
    ]);
  };

  const rerun = async cmd => {
    if (!isConnected) {
      Alert.alert('Not Connected', 'Connect to SSH server first.');
      return;
    }
    try {
      await executeCommand(cmd, 'History');
    } catch {}
  };

  const formatTime = iso => {
    try {
      const d = new Date(iso);
      return d.toLocaleString('en-GB', {day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit'});
    } catch {
      return iso;
    }
  };

  const renderItem = ({item}) => {
    const isExp = expanded === item.id;
    const statusColor = STATUS_COLORS[item.status] || colors.textDim;

    return (
      <TouchableOpacity
        style={styles.item}
        onPress={() => setExpanded(isExp ? null : item.id)}
        activeOpacity={0.75}>
        <View style={styles.itemHeader}>
          <View style={[styles.statusBadge, {backgroundColor: statusColor + '20', borderColor: statusColor + '55'}]}>
            <Text style={[styles.statusIcon, {color: statusColor}]}>{STATUS_LABELS[item.status]}</Text>
          </View>
          <View style={styles.itemMain}>
            <Text style={styles.toolName} numberOfLines={1}>
              {item.toolName || 'Command'}
            </Text>
            <Text style={styles.timestamp}>{formatTime(item.timestamp)}</Text>
          </View>
          <Text style={styles.expandArrow}>{isExp ? '▲' : '▼'}</Text>
        </View>

        <View style={styles.cmdBox}>
          <Text style={styles.cmdPrompt}>$</Text>
          <Text style={styles.cmdText} numberOfLines={isExp ? undefined : 2} selectable>
            {item.command}
          </Text>
        </View>

        {isExp && (
          <View style={styles.expandedContent}>
            {item.output ? (
              <View style={styles.outputBox}>
                <Text style={styles.outputLabel}>OUTPUT</Text>
                <Text style={styles.outputText} selectable numberOfLines={20}>
                  {item.output}
                </Text>
              </View>
            ) : null}
            <TouchableOpacity
              style={styles.rerunBtn}
              onPress={() => rerun(item.command)}
              activeOpacity={0.7}>
              <Text style={styles.rerunBtnText}>► Run Again</Text>
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>📜 HISTORY</Text>
          <Text style={styles.headerSub}>Executed commands</Text>
        </View>
        {history.length > 0 && (
          <TouchableOpacity style={styles.clearBtn} onPress={clearHistory}>
            <Text style={styles.clearBtnText}>🗑 Clear</Text>
          </TouchableOpacity>
        )}
      </View>

      {history.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>📜</Text>
          <Text style={styles.emptyTitle}>No History</Text>
          <Text style={styles.emptyText}>Executed tools and commands will appear here.</Text>
        </View>
      ) : (
        <FlatList
          data={history}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: colors.background},
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {color: colors.primary, fontSize: fontSizes.xl, fontWeight: '800', letterSpacing: 1},
  headerSub: {color: colors.textDim, fontSize: fontSizes.xs, marginTop: 2},
  clearBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.error + '55',
    backgroundColor: colors.error + '15',
  },
  clearBtnText: {color: colors.error, fontSize: fontSizes.sm, fontWeight: '600'},
  list: {padding: spacing.lg, paddingBottom: 32},
  item: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.sm,
  },
  statusBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  statusIcon: {fontSize: fontSizes.md, fontWeight: '700'},
  itemMain: {flex: 1},
  toolName: {color: colors.text, fontSize: fontSizes.md, fontWeight: '700'},
  timestamp: {color: colors.textMuted, fontSize: fontSizes.xs, marginTop: 2, fontFamily: 'monospace'},
  expandArrow: {color: colors.textDim, fontSize: fontSizes.sm},
  cmdBox: {
    flexDirection: 'row',
    gap: spacing.sm,
    backgroundColor: '#020508',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    alignItems: 'flex-start',
  },
  cmdPrompt: {color: colors.primary, fontFamily: 'monospace', fontSize: fontSizes.sm, fontWeight: '700', marginTop: 1},
  cmdText: {color: colors.text, fontFamily: 'monospace', fontSize: fontSizes.xs, flex: 1, lineHeight: 18},
  expandedContent: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    padding: spacing.md,
  },
  outputBox: {
    backgroundColor: '#020508',
    borderRadius: radius.sm,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  outputLabel: {color: colors.textMuted, fontSize: fontSizes.xs, fontWeight: '700', letterSpacing: 2, marginBottom: spacing.xs},
  outputText: {color: colors.textDim, fontFamily: 'monospace', fontSize: fontSizes.xs, lineHeight: 18},
  rerunBtn: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primary + '20',
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.primary + '55',
  },
  rerunBtnText: {color: colors.primary, fontSize: fontSizes.sm, fontWeight: '700'},
  empty: {flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40},
  emptyIcon: {fontSize: 56, marginBottom: spacing.xl},
  emptyTitle: {color: colors.text, fontSize: fontSizes.xl, fontWeight: '700', marginBottom: spacing.sm},
  emptyText: {color: colors.textDim, fontSize: fontSizes.sm, textAlign: 'center', lineHeight: 22},
});
