import React, {useState, useCallback, useRef} from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, SafeAreaView, StatusBar, ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {colors, fontSizes, spacing, radius} from '../theme';
import {useApp} from '../context/AppContext';
import FlagItem from '../components/FlagItem';
import TerminalView from '../components/TerminalView';
import {buildCommand, getDefaultFlagValues} from '../data';
import SSHManager from '../utils/SSHManager';

export default function ToolScreen({route, navigation}) {
  const {tool, category} = route.params;
  const {isConnected, executeCommand, activeCommand} = useApp();
  const [flagValues, setFlagValues] = useState(getDefaultFlagValues(tool));
  const [target, setTarget] = useState('');
  const [outputLines, setOutputLines] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [showFlags, setShowFlags] = useState(true);
  const scrollRef = useRef(null);

  const catColor = category?.color || colors.primary;

  const command = buildCommand(tool, flagValues, target);

  const handleFlagChange = useCallback((flagId, value) => {
    setFlagValues(prev => ({...prev, [flagId]: value}));
  }, []);

  const addLine = (text, type = 'output') => {
    setOutputLines(prev => [...prev, {text, type, ts: Date.now()}]);
  };

  const handleRun = async () => {
    if (!isConnected) {
      Alert.alert('No Connection', 'Connect to the SSH server before running a tool.', [
        {text: 'OK'},
      ]);
      return;
    }

    if (tool.hasTarget && !target.trim()) {
      Alert.alert('Target Required', `Enter ${tool.targetPlaceholder || 'target address'}.`);
      return;
    }

    setIsRunning(true);

    try {
      await executeCommand(command, tool.name);
      navigation.navigate('Terminal', {clear: true});
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setIsRunning(false);
    }
  };

  const handleStop = async () => {
    try {
      await executeCommand('C-c', tool.name);
    } catch {}
    setIsRunning(false);
    addLine('[Stopped by user]', 'system');
  };

  const handleCopyCommand = () => {
    addLine(`[Copied to terminal: ${command}]`, 'system');
  };

  const handleReset = () => {
    setFlagValues(getDefaultFlagValues(tool));
    setTarget('');
    setOutputLines([]);
  };

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
        <Text style={styles.toolDesc}>{tool.longDescription || tool.description}</Text>
        <TouchableOpacity
          style={{
            marginTop: spacing.md,
            alignSelf: 'flex-start',
            backgroundColor: catColor + '20',
            borderRadius: radius.md,
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.sm,
            borderWidth: 1,
            borderColor: catColor + '40',
          }}
          onPress={() => navigation.navigate('ToolDetail', {tool, category})}
          activeOpacity={0.7}>
          <Text style={{color: catColor, fontSize: fontSizes.sm, fontWeight: '700'}}>ℹ️ Details</Text>
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">

        {tool.hasTarget && (
          <View style={styles.section}>
            <View style={styles.sectionTitleRow}>
              <Text style={styles.sectionLabel}>🎯 TARGET</Text>
            </View>
            <View style={[styles.targetBox, {borderColor: catColor + '55'}]}>
              <Text style={styles.targetPrefix}>TARGET →</Text>
              <TextInput
                style={styles.targetInput}
                value={target}
                onChangeText={setTarget}
                placeholder={tool.targetPlaceholder || 'Enter IP / URL'}
                placeholderTextColor={colors.textMuted}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="default"
              />
            </View>
          </View>
        )}

        <View style={styles.section}>
          <TouchableOpacity
            style={styles.sectionTitleRow}
            onPress={() => setShowFlags(!showFlags)}>
            <Text style={styles.sectionLabel}>⚙️ FLAGS & OPTIONS ({tool.flags.length})</Text>
            <Text style={styles.toggleBtn}>{showFlags ? '▼' : '▶'}</Text>
          </TouchableOpacity>

          {showFlags && tool.flags.length > 0 && (
            <View>
              {tool.flags.map(flag => (
                <FlagItem
                  key={flag.id}
                  flag={flag}
                  value={flagValues[flag.id]}
                  onChange={handleFlagChange}
                />
              ))}
            </View>
          )}

          {tool.flags.length === 0 && (
            <View style={styles.noFlags}>
              <Text style={styles.noFlagsText}>This tool has no configurable flags.</Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>📋 COMMAND PREVIEW</Text>
          <TouchableOpacity
            style={[styles.commandPreview, {borderColor: catColor + '44'}]}
            onLongPress={handleCopyCommand}
            activeOpacity={0.8}>
            <Text style={styles.commandPrompt}>$</Text>
            <Text style={styles.commandText} selectable>{command}</Text>
          </TouchableOpacity>
          <Text style={styles.commandHint}>Long press = send to terminal</Text>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.resetBtn}
            onPress={handleReset}
            activeOpacity={0.7}>
            <Text style={styles.resetBtnText}>↺ Reset</Text>
          </TouchableOpacity>

          {isRunning ? (
            <TouchableOpacity
              style={[styles.runBtn, styles.stopBtn]}
              onPress={handleStop}
              activeOpacity={0.8}>
              <ActivityIndicator size="small" color={colors.error} />
              <Text style={styles.stopBtnText}>■ STOP</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.runBtn, {backgroundColor: catColor, borderColor: catColor}]}
              onPress={handleRun}
              activeOpacity={0.8}>
              <Text style={styles.runBtnText}>▶ RUN</Text>
            </TouchableOpacity>
          )}
        </View>

        {outputLines.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionTitleRow}>
              <Text style={styles.sectionLabel}>📡 OUTPUT</Text>
              <TouchableOpacity onPress={() => setOutputLines([])}>
                <Text style={styles.clearBtn}>Clear</Text>
              </TouchableOpacity>
            </View>
            <TerminalView lines={outputLines} maxHeight={400} />
          </View>
        )}

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
  toolHeader: {flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.sm},
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
  toolDesc: {color: colors.textDim, fontSize: fontSizes.sm, lineHeight: 20},
  scroll: {flex: 1},
  section: {marginHorizontal: spacing.lg, marginTop: spacing.xl},
  sectionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionLabel: {color: colors.textDim, fontSize: fontSizes.xs, fontWeight: '700', letterSpacing: 2},
  toggleBtn: {color: colors.primary, fontSize: fontSizes.md},
  targetBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1.5,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  targetPrefix: {color: colors.accent, fontSize: fontSizes.xs, fontWeight: '700', fontFamily: 'monospace'},
  targetInput: {
    flex: 1,
    color: colors.text,
    fontSize: fontSizes.md,
    paddingVertical: spacing.lg,
    fontFamily: 'monospace',
  },
  noFlags: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  noFlagsText: {color: colors.textDim, fontSize: fontSizes.sm},
  commandPreview: {
    backgroundColor: '#020508',
    borderRadius: radius.md,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    borderWidth: 1,
  },
  commandPrompt: {color: colors.primary, fontFamily: 'monospace', fontSize: fontSizes.md, fontWeight: '700'},
  commandText: {color: colors.text, fontFamily: 'monospace', fontSize: fontSizes.sm, flex: 1, lineHeight: 20},
  commandHint: {color: colors.textMuted, fontSize: fontSizes.xs, marginTop: spacing.xs, textAlign: 'center'},
  actionRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginHorizontal: spacing.lg,
    marginTop: spacing.xl,
  },
  runBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  runBtnText: {color: colors.background, fontSize: fontSizes.lg, fontWeight: '800', letterSpacing: 1},
  stopBtn: {
    backgroundColor: colors.error + '20',
    borderColor: colors.error + '80',
  },
  stopBtnText: {color: colors.error, fontSize: fontSizes.lg, fontWeight: '800', letterSpacing: 1},
  resetBtn: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  resetBtnText: {color: colors.textDim, fontSize: fontSizes.md, fontWeight: '600'},
  clearBtn: {color: colors.error, fontSize: fontSizes.sm},
});
