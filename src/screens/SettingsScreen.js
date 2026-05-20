import React, {useState, useEffect} from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, SafeAreaView, StatusBar, Alert, ActivityIndicator,
} from 'react-native';
import {colors, fontSizes, spacing, radius} from '../theme';
import {useApp} from '../context/AppContext';
import SSHManager from '../utils/SSHManager';

export default function SettingsScreen() {
  const {connect, disconnect, saveConfig, isConnected, isConnecting, connectionError, sshConfig} = useApp();
  const [host, setHost] = useState('');
  const [port, setPort] = useState('22');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [testResult, setTestResult] = useState(null);

  useEffect(() => {
    if (sshConfig) {
      setHost(sshConfig.host || '');
      setPort(String(sshConfig.port || 22));
      setUsername(sshConfig.username || '');
      setPassword(sshConfig.password || '');
    }
  }, [sshConfig]);

  const buildConfig = () => ({
    host: host.trim(),
    port: parseInt(port, 10) || 22,
    wsPort: 8765,
    username: username.trim(),
    password,
  });

  const handleSave = async () => {
    if (!host.trim()) {
      Alert.alert('Error', 'Host / IP address is required.');
      return;
    }
    await saveConfig(buildConfig());
    Alert.alert('Saved', 'SSH configuration saved.', [{text: 'OK'}]);
  };

  const handleConnect = async () => {
    if (!host.trim()) {
      Alert.alert('Error', 'Enter a host / IP address first.');
      return;
    }
    const config = buildConfig();
    await saveConfig(config);
    const ok = await connect(config);
    if (ok) {
      Alert.alert('Connected!', `Connected to ${config.host}:${config.port} as ${config.username}`);
    }
  };

  const handleDisconnect = async () => {
    await disconnect();
  };

  const handleTest = async () => {
    if (!host.trim()) {
      setTestResult({status: 'error', message: '✗ Enter a host / IP address first.'});
      return;
    }
    setTestResult({status: 'testing', message: 'Testing connection...'});
    try {
      await SSHManager.connect(buildConfig());
      const output = await SSHManager.execute('echo "OK:$(uname -n):$(whoami)"');
      setTestResult({status: 'ok', message: `✓ Connected! ${output.trim()}`});
    } catch (e) {
      setTestResult({status: 'error', message: `✗ ${e.message}`});
    }
  };

  const InfoRow = ({label, value, valueColor}) => (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, {color: valueColor || colors.text}]}>{value}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>⚙️ SETTINGS</Text>
        <Text style={styles.headerSub}>SSH Connection Configuration</Text>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        <View style={styles.statusCard}>
          <View style={[styles.statusDot, {backgroundColor: isConnected ? colors.primary : isConnecting ? colors.warning : colors.error}]} />
          <View style={styles.statusContent}>
            <Text style={styles.statusTitle}>
              {isConnecting ? 'Connecting...' : isConnected ? 'Connected' : 'Disconnected'}
            </Text>
            {isConnected && (
              <Text style={styles.statusSub}>{`${sshConfig?.host}:${sshConfig?.port} @ ${sshConfig?.username}`}</Text>
            )}
            {connectionError && !isConnected && (
              <Text style={styles.statusError}>{connectionError}</Text>
            )}
          </View>
          {isConnecting && <ActivityIndicator size="small" color={colors.warning} />}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔌 SSH CONNECTION</Text>

          <View style={styles.fieldGroup}>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Host / IP Address</Text>
              <TextInput
                style={styles.input}
                value={host}
                onChangeText={setHost}
                placeholder="192.168.x.x"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="numeric"
              />
            </View>

            <View style={[styles.field, {flex: 0.4}]}>
              <Text style={styles.fieldLabel}>Port</Text>
              <TextInput
                style={styles.input}
                value={port}
                onChangeText={setPort}
                placeholder="22"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Username</Text>
            <TextInput
              style={styles.input}
              value={username}
              onChangeText={setUsername}
              placeholder="kali"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Password</Text>
            <View style={styles.passwordRow}>
              <TextInput
                style={[styles.input, {flex: 1}]}
                value={password}
                onChangeText={setPassword}
                placeholder="SSH Password"
                placeholderTextColor={colors.textMuted}
                secureTextEntry={!showPass}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPass(!showPass)}>
                <Text style={styles.eyeIcon}>{showPass ? '🙈' : '👁️'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {testResult && (
          <View style={[styles.testResult, {
            backgroundColor: testResult.status === 'ok' ? colors.primary + '15' : testResult.status === 'testing' ? colors.warning + '15' : colors.error + '15',
            borderColor: testResult.status === 'ok' ? colors.primary + '55' : testResult.status === 'testing' ? colors.warning + '55' : colors.error + '55',
          }]}>
            <Text style={[styles.testResultText, {
              color: testResult.status === 'ok' ? colors.primary : testResult.status === 'testing' ? colors.warning : colors.error,
            }]}>
              {testResult.message}
            </Text>
          </View>
        )}

        <View style={styles.buttonGroup}>
          <TouchableOpacity style={styles.testBtn} onPress={handleTest}>
            <Text style={styles.testBtnText}>🧪 Test Connection</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
            <Text style={styles.saveBtnText}>💾 Save Configuration</Text>
          </TouchableOpacity>

          {!isConnected ? (
            <TouchableOpacity
              style={styles.connectBtn}
              onPress={handleConnect}
              disabled={isConnecting}>
              {isConnecting ? (
                <ActivityIndicator size="small" color={colors.background} />
              ) : null}
              <Text style={styles.connectBtnText}>
                {isConnecting ? 'Connecting...' : '► Connect SSH'}
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.disconnectBtn} onPress={handleDisconnect}>
              <Text style={styles.disconnectBtnText}>■ Disconnect</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ℹ️ ABOUT</Text>
          <View style={styles.infoCard}>
            <InfoRow label="Version" value="1.0.0" />
            <InfoRow label="Platform" value="Android" />
            <InfoRow label="Tools" value="130+" valueColor={colors.primary} />
            <InfoRow label="Categories" value="12" valueColor={colors.secondary} />
            <InfoRow label="Status" value={isConnected ? 'Connected' : 'Disconnected'} valueColor={isConnected ? colors.primary : colors.error} />
          </View>
        </View>


        <View style={{height: 48}} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: colors.background},
  header: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {color: colors.primary, fontSize: fontSizes.xl, fontWeight: '800', letterSpacing: 1},
  headerSub: {color: colors.textDim, fontSize: fontSizes.xs, marginTop: 2},
  scroll: {flex: 1},
  statusCard: {
    margin: spacing.lg,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  statusDot: {width: 14, height: 14, borderRadius: 7},
  statusContent: {flex: 1},
  statusTitle: {color: colors.text, fontSize: fontSizes.md, fontWeight: '700'},
  statusSub: {color: colors.textDim, fontSize: fontSizes.xs, fontFamily: 'monospace', marginTop: 2},
  statusError: {color: colors.error, fontSize: fontSizes.xs, marginTop: 2},
  section: {marginHorizontal: spacing.lg, marginTop: spacing.xl},
  sectionTitle: {color: colors.textDim, fontSize: fontSizes.xs, fontWeight: '700', letterSpacing: 2, marginBottom: spacing.md},
  fieldGroup: {flexDirection: 'row', gap: spacing.md},
  field: {flex: 1, marginBottom: spacing.md},
  fieldLabel: {color: colors.textDim, fontSize: fontSizes.xs, fontWeight: '600', marginBottom: spacing.xs, letterSpacing: 0.5},
  fieldHint: {color: colors.textMuted, fontSize: fontSizes.xs, marginTop: spacing.xs},
  input: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    color: colors.text,
    fontSize: fontSizes.md,
    fontFamily: 'monospace',
  },
  passwordRow: {flexDirection: 'row', alignItems: 'center', gap: spacing.sm},
  eyeBtn: {padding: spacing.sm},
  eyeIcon: {fontSize: 20},
  testResult: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
  },
  testResultText: {fontSize: fontSizes.sm, fontFamily: 'monospace'},
  buttonGroup: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.xl,
    gap: spacing.md,
  },
  testBtn: {
    backgroundColor: colors.secondary + '20',
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.secondary + '55',
  },
  testBtnText: {color: colors.secondary, fontSize: fontSizes.md, fontWeight: '700'},
  saveBtn: {
    backgroundColor: colors.warning + '20',
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.warning + '55',
  },
  saveBtnText: {color: colors.warning, fontSize: fontSizes.md, fontWeight: '700'},
  connectBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    shadowColor: colors.primary,
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  connectBtnText: {color: colors.background, fontSize: fontSizes.lg, fontWeight: '800', letterSpacing: 1},
  disconnectBtn: {
    backgroundColor: colors.error + '20',
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.error + '55',
  },
  disconnectBtnText: {color: colors.error, fontSize: fontSizes.lg, fontWeight: '700'},
  infoCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  infoLabel: {color: colors.textDim, fontSize: fontSizes.sm},
  infoValue: {fontSize: fontSizes.sm, fontWeight: '600', fontFamily: 'monospace'},
  warningCard: {
    backgroundColor: colors.warning + '10',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.warning + '44',
    padding: spacing.lg,
  },
  warningText: {color: colors.textDim, fontSize: fontSizes.xs, lineHeight: 18},
});
