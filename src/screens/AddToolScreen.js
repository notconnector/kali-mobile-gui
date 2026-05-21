import React, {useState} from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, SafeAreaView, StatusBar, Alert,
  ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import {colors, fontSizes, spacing, radius} from '../theme';
import {useApp} from '../context/AppContext';

// ─────────────────────────────────────────────
// Heuristic --help output parser
// Tries to detect common flag patterns like:
//   -x, --flag <VAL>   Description text
//       --flag=VAL     Description
// ─────────────────────────────────────────────
function parseHelpFlags(helpText) {
  const lines = helpText.split('\n');
  const flags = [];
  const seen = new Set();

  // Patterns: " -x, --long <VAL>   desc" or "  --long VAL   desc"
  const re = /^\s{1,6}(-[a-zA-Z](?:,\s*)?)?(\s*--[\w-]+=?)([\s<\[]\w[\w-]*[\s>\]])?\s{2,}(.+)/;

  lines.forEach(line => {
    const m = line.match(re);
    if (!m) return;

    const shortFlag = (m[1] || '').replace(/[,\s]/g, '').trim();
    const longFlag  = (m[2] || '').replace(/[=\s]/g, '').trim();
    const placeholder = (m[3] || '').replace(/[<>\[\]\s]/g, '').trim().toLowerCase();
    const description = (m[4] || '').trim();

    const key = longFlag || shortFlag;
    if (!key || seen.has(key)) return;
    seen.add(key);

    flags.push({
      id: key.replace(/^-+/, ''),
      name: longFlag || shortFlag,
      description: description.slice(0, 80),
      placeholder,
      default: '',
      required: false,
    });
  });

  return flags.slice(0, 24); // cap at 24 flags
}

// ─────────────────────────────────────────────
// STEP components
// ─────────────────────────────────────────────
const ICONS = ['🔧','💥','🔍','🌐','📡','🔑','💣','🕵️','🧪','⚙️','🛡️','🦆','📶','🖥️','🗺️','🔒','🔓','🧨','🎯','💀'];

function Step1({command, setCommand, onRunHelp, loading}) {
  return (
    <View style={styles.stepCard}>
      <Text style={styles.stepTitle}>① Enter command name</Text>
      <Text style={styles.stepSub}>The app will run <Text style={styles.mono}>[command] --help</Text> to discover flags automatically.</Text>
      <TextInput
        style={styles.input}
        value={command}
        onChangeText={setCommand}
        placeholder="e.g.  nmap  /  sqlmap  /  ffuf"
        placeholderTextColor={colors.textMuted}
        autoCapitalize="none"
        autoCorrect={false}
      />
      <TouchableOpacity
        style={[styles.primaryBtn, (!command.trim() || loading) && styles.btnDisabled]}
        onPress={onRunHelp}
        disabled={!command.trim() || loading}
        activeOpacity={0.8}>
        {loading
          ? <ActivityIndicator color={colors.background} />
          : <Text style={styles.primaryBtnText}>▶ Run --help</Text>}
      </TouchableOpacity>
    </View>
  );
}

function Step2({command, helpOutput, name, setName, desc, setDesc, icon, setIcon, onNext, onBack}) {
  return (
    <View style={styles.stepCard}>
      <Text style={styles.stepTitle}>② Name & description</Text>

      <Text style={styles.fieldLabel}>--help output preview</Text>
      <ScrollView style={styles.helpBox} nestedScrollEnabled>
        <Text style={styles.helpText}>{helpOutput || '(empty)'}</Text>
      </ScrollView>

      <Text style={styles.fieldLabel}>Tool name *</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName}
        placeholder={command} placeholderTextColor={colors.textMuted} />

      <Text style={styles.fieldLabel}>Short description *</Text>
      <TextInput style={styles.input} value={desc} onChangeText={setDesc}
        placeholder="What does this tool do?" placeholderTextColor={colors.textMuted} />

      <Text style={styles.fieldLabel}>Icon</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginBottom: spacing.md}}>
        {ICONS.map(ic => (
          <TouchableOpacity
            key={ic}
            style={[styles.iconBtn, icon === ic && styles.iconBtnActive]}
            onPress={() => setIcon(ic)}>
            <Text style={styles.iconBtnText}>{ic}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.row}>
        <TouchableOpacity style={styles.secondaryBtn} onPress={onBack} activeOpacity={0.8}>
          <Text style={styles.secondaryBtnText}>← Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.primaryBtn, {flex: 1}, (!name.trim() || !desc.trim()) && styles.btnDisabled]}
          onPress={onNext}
          disabled={!name.trim() || !desc.trim()}
          activeOpacity={0.8}>
          <Text style={styles.primaryBtnText}>Next: Flags →</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function FlagEditor({flag, onChange, onDelete}) {
  return (
    <View style={styles.flagCard}>
      <View style={styles.flagHeader}>
        <Text style={styles.flagName}>{flag.name || '(unnamed)'}</Text>
        <TouchableOpacity onPress={onDelete} hitSlop={{top:8,bottom:8,left:8,right:8}}>
          <Text style={styles.deleteBtn}>✕</Text>
        </TouchableOpacity>
      </View>
      <TextInput style={styles.inputSm} value={flag.name} onChangeText={v => onChange({...flag, name: v})}
        placeholder="flag  e.g. --port" placeholderTextColor={colors.textMuted} autoCapitalize="none" />
      <TextInput style={styles.inputSm} value={flag.description} onChangeText={v => onChange({...flag, description: v})}
        placeholder="description" placeholderTextColor={colors.textMuted} />
      <TextInput style={styles.inputSm} value={flag.placeholder} onChangeText={v => onChange({...flag, placeholder: v})}
        placeholder="placeholder  e.g. 8080" placeholderTextColor={colors.textMuted} autoCapitalize="none" />
    </View>
  );
}

function Step3({flags, setFlags, onSave, onBack, saving}) {
  const addFlag = () => setFlags(prev => [...prev, {id: `f_${Date.now()}`, name: '', description: '', placeholder: '', default: '', required: false}]);
  const updateFlag = (idx, updated) => setFlags(prev => prev.map((f, i) => i === idx ? updated : f));
  const deleteFlag = idx => setFlags(prev => prev.filter((_, i) => i !== idx));

  return (
    <View style={styles.stepCard}>
      <Text style={styles.stepTitle}>③ Flags <Text style={styles.dim}>(optional)</Text></Text>
      <Text style={styles.stepSub}>Auto-detected from --help. Edit, add or remove flags.</Text>

      {flags.map((flag, idx) => (
        <FlagEditor key={flag.id || idx} flag={flag} onChange={u => updateFlag(idx, u)} onDelete={() => deleteFlag(idx)} />
      ))}

      <TouchableOpacity style={styles.addFlagBtn} onPress={addFlag} activeOpacity={0.8}>
        <Text style={styles.addFlagBtnText}>+ Add flag manually</Text>
      </TouchableOpacity>

      <View style={styles.row}>
        <TouchableOpacity style={styles.secondaryBtn} onPress={onBack} activeOpacity={0.8}>
          <Text style={styles.secondaryBtnText}>← Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.primaryBtn, {flex: 1}]}
          onPress={onSave}
          disabled={saving}
          activeOpacity={0.8}>
          {saving
            ? <ActivityIndicator color={colors.background} />
            : <Text style={styles.primaryBtnText}>💾 Save tool</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────
// Main screen
// ─────────────────────────────────────────────
export default function AddToolScreen({navigation}) {
  const {executeCommand, addCustomTool, isConnected} = useApp();
  const [step, setStep]           = useState(1);
  const [command, setCommand]     = useState('');
  const [helpOutput, setHelpOutput] = useState('');
  const [name, setName]           = useState('');
  const [desc, setDesc]           = useState('');
  const [icon, setIcon]           = useState('🔧');
  const [flags, setFlags]         = useState([]);
  const [loading, setLoading]     = useState(false);
  const [saving, setSaving]       = useState(false);

  const runHelp = async () => {
    if (!isConnected) {
      Alert.alert('Not connected', 'Connect to the server/bridge first (Settings → Connect).');
      return;
    }
    setLoading(true);
    try {
      const out = await executeCommand(`${command.trim()} --help 2>&1 | head -80`);
      setHelpOutput(out || '(no output — try a different command)');
      setFlags(parseHelpFlags(out || ''));
      setName(command.trim().charAt(0).toUpperCase() + command.trim().slice(1));
      setStep(2);
    } catch (e) {
      setHelpOutput(`Error: ${e.message}`);
      setFlags([]);
      setStep(2);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const tool = {
        name: name.trim(),
        command: command.trim(),
        description: desc.trim(),
        longDescription: desc.trim(),
        icon,
        flags: flags.filter(f => f.name.trim()),
        hasTarget: true,
        targetPlaceholder: 'target',
      };
      const saved = await addCustomTool(tool);
      Alert.alert('✓ Tool saved!', `"${tool.name}" added to Custom Tools.`, [
        {text: 'View', onPress: () => navigation.replace('Tool', {tool: saved, categoryId: 'custom'})},
        {text: 'Add another', onPress: () => { setStep(1); setCommand(''); setName(''); setDesc(''); setFlags([]); }},
        {text: 'Done', onPress: () => navigation.goBack()},
      ]);
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{top:8,bottom:8,left:8,right:8}}>
          <Text style={styles.backBtn}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>🔧 Add Custom Tool</Text>
        <View style={styles.steps}>
          {[1,2,3].map(s => (
            <View key={s} style={[styles.stepDot, step >= s && styles.stepDotActive]}>
              <Text style={[styles.stepDotText, step >= s && styles.stepDotTextActive]}>{s}</Text>
            </View>
          ))}
        </View>
      </View>

      <KeyboardAvoidingView style={{flex:1}} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView style={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={{padding: spacing.lg}}>
            {step === 1 && (
              <Step1 command={command} setCommand={setCommand} onRunHelp={runHelp} loading={loading} />
            )}
            {step === 2 && (
              <Step2
                command={command} helpOutput={helpOutput}
                name={name} setName={setName}
                desc={desc} setDesc={setDesc}
                icon={icon} setIcon={setIcon}
                onNext={() => setStep(3)} onBack={() => setStep(1)} />
            )}
            {step === 3 && (
              <Step3 flags={flags} setFlags={setFlags} onSave={handleSave} onBack={() => setStep(2)} saving={saving} />
            )}
          </View>
          <View style={{height: 48}} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: colors.background},
  header: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.xs,
  },
  backBtn: {color: colors.primary, fontSize: fontSizes.sm},
  headerTitle: {color: colors.text, fontSize: fontSizes.lg, fontWeight: '800'},
  steps: {flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs},
  stepDot: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: colors.card,
    borderWidth: 1, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  stepDotActive: {backgroundColor: colors.primary, borderColor: colors.primary},
  stepDotText: {color: colors.textDim, fontSize: fontSizes.xs, fontWeight: '700'},
  stepDotTextActive: {color: colors.background},
  scroll: {flex: 1},
  stepCard: {gap: spacing.md},
  stepTitle: {color: colors.text, fontSize: fontSizes.lg, fontWeight: '800'},
  stepSub: {color: colors.textDim, fontSize: fontSizes.xs, lineHeight: 18},
  mono: {fontFamily: 'monospace', color: colors.primary},
  dim: {color: colors.textDim, fontWeight: '400'},
  fieldLabel: {color: colors.textDim, fontSize: fontSizes.xs, fontWeight: '600', letterSpacing: 0.5},
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
  inputSm: {
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm - 2,
    color: colors.text,
    fontSize: fontSizes.xs,
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  helpBox: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
    maxHeight: 160,
  },
  helpText: {color: colors.primary, fontSize: 11, fontFamily: 'monospace', lineHeight: 16},
  primaryBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {color: colors.background, fontSize: fontSizes.md, fontWeight: '800'},
  secondaryBtn: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.sm,
    minWidth: 90,
  },
  secondaryBtnText: {color: colors.text, fontSize: fontSizes.sm, fontWeight: '600'},
  btnDisabled: {opacity: 0.4},
  row: {flexDirection: 'row', alignItems: 'center'},
  iconBtn: {
    width: 44, height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
    marginRight: spacing.xs,
  },
  iconBtnActive: {borderColor: colors.primary, backgroundColor: colors.primary + '20'},
  iconBtnText: {fontSize: 22},
  flagCard: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: 4,
  },
  flagHeader: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4},
  flagName: {color: colors.primary, fontSize: fontSizes.sm, fontWeight: '700', fontFamily: 'monospace'},
  deleteBtn: {color: colors.error, fontSize: fontSizes.md, fontWeight: '700'},
  addFlagBtn: {
    backgroundColor: colors.secondary + '15',
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.secondary + '40',
  },
  addFlagBtnText: {color: colors.secondary, fontSize: fontSizes.sm, fontWeight: '700'},
});
