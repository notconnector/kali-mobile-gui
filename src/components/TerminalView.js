import React, {useRef, useEffect} from 'react';
import {View, Text, ScrollView, StyleSheet} from 'react-native';
import {colors, fontSizes, spacing, radius} from '../theme';

const LINE_COLORS = {
  input: colors.primary,
  output: colors.text,
  error: colors.error,
  info: colors.secondary,
  system: colors.textDim,
};

export default function TerminalView({lines = [], style, maxHeight = 300}) {
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current && lines.length > 0) {
      scrollRef.current.scrollToEnd({animated: true});
    }
  }, [lines]);

  return (
    <View style={[styles.container, style, {maxHeight}]}>
      <View style={styles.header}>
        <View style={styles.dot} />
        <View style={[styles.dot, {backgroundColor: colors.warning}]} />
        <View style={[styles.dot, {backgroundColor: colors.primary}]} />
        <Text style={styles.headerTitle}>TERMINAL</Text>
      </View>
      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        {lines.length === 0 ? (
          <Text style={styles.empty}>{'> Brak wyjścia. Uruchom narzędzie aby zobaczyć wyniki.'}</Text>
        ) : (
          lines.map((line, idx) => (
            <Text
              key={idx}
              style={[styles.line, {color: LINE_COLORS[line.type] || colors.text}]}
              selectable>
              {line.text}
            </Text>
          ))
        )}
        <View style={{height: 8}} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#020508',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0A0F1A',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 6,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.error,
  },
  headerTitle: {
    color: colors.textDim,
    fontSize: fontSizes.xs,
    fontWeight: '700',
    letterSpacing: 2,
    marginLeft: 8,
  },
  scroll: {
    padding: spacing.md,
  },
  empty: {
    color: colors.textMuted,
    fontSize: fontSizes.sm,
    fontFamily: 'monospace',
    fontStyle: 'italic',
  },
  line: {
    fontSize: fontSizes.sm,
    fontFamily: 'monospace',
    lineHeight: 20,
  },
});
