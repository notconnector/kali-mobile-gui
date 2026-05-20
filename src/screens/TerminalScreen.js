import React, {useState, useRef, useEffect} from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, SafeAreaView, StatusBar, KeyboardAvoidingView, Platform,
} from 'react-native';
import {colors, fontSizes, spacing, radius} from '../theme';
import {useApp} from '../context/AppContext';
import SSHManager from '../utils/SSHManager';

export default function TerminalScreen() {
  const {isConnected, terminalLines, dispatch} = useApp();
  const [input, setInput] = useState('');
  const [history, setHistory] = useState([]);
  const [histIdx, setHistIdx] = useState(-1);
  const [isShellOpen, setIsShellOpen] = useState(false);
  const [isOpening, setIsOpening] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (terminalLines.length > 0 && scrollRef.current) {
      scrollRef.current.scrollToEnd({animated: true});
    }
  }, [terminalLines]);

  const addLine = (text, type = 'system') => {
    dispatch({type: 'ADD_TERMINAL_LINE', payload: {text, type, ts: Date.now()}});
  };

  const openShell = async () => {
    if (!isConnected) {
      addLine('[ERROR] No SSH connection. Configure SSH in Settings.', 'error');
      return;
    }
    setIsOpening(true);
    try {
      await SSHManager.startShell();
      setIsShellOpen(true);
      addLine('[✓] Shell opened. You can now type commands.', 'system');
      addLine('$ ', 'input');
    } catch (e) {
      addLine(`[SHELL ERROR] ${e.message}`, 'error');
    } finally {
      setIsOpening(false);
    }
  };

  const closeShell = async () => {
    try {
      await SSHManager.closeShell();
      setIsShellOpen(false);
      addLine('[Shell closed]', 'system');
    } catch {}
  };

  const sendCommand = async () => {
    const cmd = input.trim();
    if (!cmd) return;

    setHistory(h => [cmd, ...h.slice(0, 49)]);
    setHistIdx(-1);
    setInput('');

    if (!isShellOpen) {
      if (!isConnected) {
        addLine('[ERROR] No SSH connection', 'error');
        return;
      }
      addLine(`$ ${cmd}`, 'input');
      try {
        const output = await SSHManager.execute(cmd);
        if (output) {
          output.split('\n').forEach(l => addLine(l, 'output'));
        }
      } catch (e) {
        addLine(`[ERROR] ${e.message}`, 'error');
      }
    } else {
      addLine(`$ ${cmd}`, 'input');
      try {
        await SSHManager.writeToShell(cmd);
      } catch (e) {
        addLine(`[ERROR] ${e.message}`, 'error');
      }
    }

    setTimeout(() => scrollRef.current?.scrollToEnd({animated: true}), 100);
  };

  const navigateHistory = dir => {
    const newIdx = Math.max(-1, Math.min(history.length - 1, histIdx + dir));
    setHistIdx(newIdx);
    setInput(newIdx === -1 ? '' : history[newIdx]);
  };

  const getLineColor = type => {
    switch (type) {
      case 'input': return colors.primary;
      case 'error': return colors.error;
      case 'system': return colors.secondary;
      default: return colors.text;
    }
  };

  const clearTerminal = () => dispatch({type: 'CLEAR_TERMINAL'});

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.dots}>
            <View style={[styles.dot, {backgroundColor: colors.error}]} />
            <View style={[styles.dot, {backgroundColor: colors.warning}]} />
            <View style={[styles.dot, {backgroundColor: colors.primary}]} />
          </View>
          <Text style={styles.headerTitle}>SSH TERMINAL</Text>
          <View style={[styles.badge, {backgroundColor: isConnected ? colors.primary + '22' : colors.error + '22', borderColor: isConnected ? colors.primary + '66' : colors.error + '66'}]}>
            <Text style={[styles.badgeText, {color: isConnected ? colors.primary : colors.error}]}>
              {isConnected ? '● ONLINE' : '○ OFFLINE'}
            </Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          {!isShellOpen ? (
            <TouchableOpacity
              style={[styles.shellBtn, {borderColor: colors.primary + '66', backgroundColor: colors.primary + '15'}]}
              onPress={openShell}
              disabled={isOpening || !isConnected}>
              <Text style={[styles.shellBtnText, {color: colors.primary}]}>
                {isOpening ? 'Opening...' : '► Shell'}
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.shellBtn, {borderColor: colors.error + '66', backgroundColor: colors.error + '15'}]}
              onPress={closeShell}>
              <Text style={[styles.shellBtnText, {color: colors.error}]}>■ Close</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.clearBtn} onPress={clearTerminal}>
            <Text style={styles.clearBtnText}>🗑</Text>
          </TouchableOpacity>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={80}>

        <ScrollView
          ref={scrollRef}
          style={styles.terminal}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          {terminalLines.length === 0 && (
            <View style={styles.welcome}>
              <Text style={styles.welcomeIcon}>💀</Text>
              <Text style={styles.welcomeTitle}>KALI SSH TERMINAL</Text>
              <Text style={styles.welcomeText}>
                {isConnected
                  ? 'Connected. Type a command or open an interactive shell.'
                  : 'Not connected. Go to Settings to configure SSH.'}
              </Text>
              <Text style={styles.welcomeSub}>Configure your Kali host in Settings.</Text>
            </View>
          )}
          {terminalLines.map((line, i) => (
            <Text
              key={i}
              style={[styles.line, {color: getLineColor(line.type)}]}
              selectable>
              {line.text}
            </Text>
          ))}
          <View style={{height: 8}} />
        </ScrollView>

        <View style={styles.inputArea}>
          <View style={styles.historyBtns}>
            <TouchableOpacity style={styles.histBtn} onPress={() => navigateHistory(1)}>
              <Text style={styles.histBtnText}>▲</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.histBtn} onPress={() => navigateHistory(-1)}>
              <Text style={styles.histBtnText}>▼</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.inputRow}>
            <Text style={styles.prompt}>$</Text>
            <TextInput
              style={styles.input}
              value={input}
              onChangeText={setInput}
              placeholder="Enter command..."
              placeholderTextColor={colors.textMuted}
              onSubmitEditing={sendCommand}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="send"
              blurOnSubmit={false}
            />
            <TouchableOpacity style={styles.sendBtn} onPress={sendCommand}>
              <Text style={styles.sendBtnText}>↵</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          horizontal
          style={styles.quickBar}
          showsHorizontalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          {['ls -la', 'id', 'whoami', 'pwd', 'ifconfig', 'ip a', 'netstat -an', 'ps aux', 'uname -a', 'cat /etc/passwd', 'history', 'clear'].map(cmd => (
            <TouchableOpacity
              key={cmd}
              style={styles.quickBtn}
              onPress={() => {
                setInput(cmd);
              }}>
              <Text style={styles.quickBtnText}>{cmd}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: '#020508'},
  flex: {flex: 1},
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: '#0A0F1A',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerLeft: {flexDirection: 'row', alignItems: 'center', gap: spacing.sm},
  dots: {flexDirection: 'row', gap: 5},
  dot: {width: 10, height: 10, borderRadius: 5},
  headerTitle: {color: colors.textDim, fontSize: fontSizes.xs, fontWeight: '700', letterSpacing: 2, marginLeft: spacing.sm},
  badge: {borderRadius: radius.full, paddingHorizontal: spacing.sm, paddingVertical: 2, borderWidth: 1},
  badgeText: {fontSize: fontSizes.xs, fontWeight: '700', letterSpacing: 1},
  headerRight: {flexDirection: 'row', gap: spacing.sm, alignItems: 'center'},
  shellBtn: {borderRadius: radius.full, paddingHorizontal: spacing.md, paddingVertical: 5, borderWidth: 1},
  shellBtnText: {fontSize: fontSizes.xs, fontWeight: '700'},
  clearBtn: {padding: 4},
  clearBtnText: {fontSize: 18},
  terminal: {flex: 1, padding: spacing.md},
  welcome: {alignItems: 'center', paddingVertical: 40},
  welcomeIcon: {fontSize: 40, marginBottom: spacing.md},
  welcomeTitle: {color: colors.primary, fontSize: fontSizes.xl, fontWeight: '800', letterSpacing: 3, marginBottom: spacing.sm},
  welcomeText: {color: colors.textDim, fontSize: fontSizes.sm, textAlign: 'center', marginBottom: spacing.sm},
  welcomeSub: {color: colors.textMuted, fontSize: fontSizes.xs, fontFamily: 'monospace'},
  line: {fontSize: fontSizes.sm, fontFamily: 'monospace', lineHeight: 20},
  inputArea: {
    backgroundColor: '#0A0F1A',
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  historyBtns: {flexDirection: 'row', paddingHorizontal: spacing.md, paddingTop: spacing.xs, gap: 4},
  histBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    backgroundColor: colors.card,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  histBtnText: {color: colors.textDim, fontSize: fontSizes.xs},
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  prompt: {color: colors.primary, fontSize: fontSizes.lg, fontFamily: 'monospace', fontWeight: '700'},
  input: {
    flex: 1,
    color: colors.text,
    fontSize: fontSizes.md,
    fontFamily: 'monospace',
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.primary + '44',
  },
  sendBtn: {
    backgroundColor: colors.primary,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnText: {color: colors.background, fontSize: fontSizes.lg, fontWeight: '800'},
  quickBar: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  quickBtn: {
    backgroundColor: colors.card,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    marginRight: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  quickBtnText: {color: colors.textDim, fontSize: fontSizes.xs, fontFamily: 'monospace'},
});
