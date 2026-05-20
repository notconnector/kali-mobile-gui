import React, {useState} from 'react';
import {View, Text, Switch, TextInput, StyleSheet, TouchableOpacity} from 'react-native';
import {colors, fontSizes, spacing, radius} from '../theme';

export default function FlagItem({flag, value, onChange}) {
  const [expanded, setExpanded] = useState(false);

  const renderControl = () => {
    switch (flag.type) {
      case 'toggle':
        return (
          <Switch
            value={!!value}
            onValueChange={v => onChange(flag.id, v)}
            trackColor={{false: colors.border, true: colors.primaryDim}}
            thumbColor={value ? colors.primary : colors.textDim}
          />
        );
      case 'text':
      case 'number':
        return (
          <TextInput
            style={styles.input}
            value={String(value || '')}
            onChangeText={v => onChange(flag.id, v)}
            placeholder={flag.placeholder || flag.flag || ''}
            placeholderTextColor={colors.textMuted}
            keyboardType={flag.type === 'number' ? 'numeric' : 'default'}
            autoCapitalize="none"
            autoCorrect={false}
          />
        );
      case 'select':
        return (
          <TouchableOpacity
            style={styles.selectButton}
            onPress={() => setExpanded(!expanded)}>
            <Text style={styles.selectText} numberOfLines={1}>
              {flag.options?.find(o => o.value === value)?.label || value || 'Wybierz...'}
            </Text>
            <Text style={styles.selectArrow}>{expanded ? '▲' : '▼'}</Text>
          </TouchableOpacity>
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <View style={styles.info}>
          <View style={styles.nameRow}>
            {flag.flag ? (
              <View style={styles.flagBadge}>
                <Text style={styles.flagCode}>{flag.flag}</Text>
              </View>
            ) : null}
            <Text style={styles.name}>{flag.name}</Text>
          </View>
          <Text style={styles.description}>{flag.description}</Text>
        </View>
        <View style={styles.control}>{renderControl()}</View>
      </View>

      {flag.type === 'select' && expanded && (
        <View style={styles.dropdown}>
          {flag.options?.map(option => (
            <TouchableOpacity
              key={option.value}
              style={[styles.option, value === option.value && styles.optionActive]}
              onPress={() => {
                onChange(flag.id, option.value);
                setExpanded(false);
              }}>
              <Text style={[styles.optionText, value === option.value && styles.optionTextActive]}>
                {option.label}
              </Text>
              {value === option.value && <Text style={styles.checkmark}>✓</Text>}
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.sm,
  },
  info: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: 3,
    flexWrap: 'wrap',
  },
  flagBadge: {
    backgroundColor: colors.background,
    borderRadius: radius.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: colors.primary + '66',
  },
  flagCode: {
    color: colors.primary,
    fontSize: fontSizes.xs,
    fontFamily: 'monospace',
    fontWeight: '700',
  },
  name: {
    color: colors.text,
    fontSize: fontSizes.sm,
    fontWeight: '600',
    flex: 1,
  },
  description: {
    color: colors.textDim,
    fontSize: fontSizes.xs,
    lineHeight: 16,
  },
  control: {
    alignItems: 'flex-end',
    minWidth: 120,
  },
  input: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    color: colors.text,
    fontSize: fontSizes.sm,
    fontFamily: 'monospace',
    minWidth: 120,
    maxWidth: 160,
  },
  selectButton: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    maxWidth: 160,
  },
  selectText: {
    color: colors.text,
    fontSize: fontSizes.xs,
    flex: 1,
  },
  selectArrow: {
    color: colors.textDim,
    fontSize: fontSizes.xs,
  },
  dropdown: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border + '66',
  },
  optionActive: {
    backgroundColor: colors.primary + '15',
  },
  optionText: {
    color: colors.textDim,
    fontSize: fontSizes.sm,
    flex: 1,
  },
  optionTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  checkmark: {
    color: colors.primary,
    fontSize: fontSizes.sm,
    fontWeight: '700',
  },
});
