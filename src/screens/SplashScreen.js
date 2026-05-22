import React, {useEffect, useRef, useState} from 'react';
import {View, Text, StyleSheet, Animated, Image} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {colors, gradients} from '../theme';
import {useApp} from '../context/AppContext';
import {getTotalToolsCount} from '../data';

const MASK_IMG = require('../assets/fsociety-mask.png');
const APP_VERSION = '1.3.0';

export default function SplashScreen({navigation}) {
  const {connect} = useApp();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const [toolCount, setToolCount] = useState(null);
  const [statusText, setStatusText] = useState('Initializing...');

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {toValue: 1, duration: 900, useNativeDriver: true}),
      Animated.spring(scaleAnim, {toValue: 1, tension: 40, friction: 8, useNativeDriver: true}),
    ]).start();

    setTimeout(async () => {
      setStatusText('Loading tools...');
      const count = getTotalToolsCount();
      setToolCount(count);
      setStatusText(`${count} tools loaded`);

      setTimeout(async () => {
        setStatusText('Connecting...');
        try { await connect(); } catch (_) {}
        setTimeout(() => navigation.replace('Main'), 300);
      }, 600);
    }, 800);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <LinearGradient colors={gradients.splash} style={styles.container}>
      <Animated.View style={[styles.content, {opacity: fadeAnim, transform: [{scale: scaleAnim}]}]}>
        <Image source={MASK_IMG} style={styles.mask} resizeMode="contain" />
        <Text style={styles.hello}>Hello Friend.</Text>
        <Text style={styles.version}>v{APP_VERSION}</Text>
      </Animated.View>
      <View style={styles.footer}>
        <Text style={styles.statusText}>{statusText}</Text>
        {toolCount !== null && (
          <Text style={styles.toolCountText}>{toolCount} tools ready</Text>
        )}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, alignItems: 'center', justifyContent: 'center'},
  content: {alignItems: 'center'},
  footer: {
    position: 'absolute',
    bottom: 48,
    alignItems: 'center',
    gap: 6,
  },
  statusText: {
    color: colors.textDim,
    fontSize: 12,
    fontFamily: 'monospace',
    letterSpacing: 1,
  },
  toolCountText: {
    color: colors.primary,
    fontSize: 11,
    fontFamily: 'monospace',
    fontWeight: '700',
    letterSpacing: 1,
  },
  version: {
    color: colors.textDim,
    fontSize: 12,
    fontFamily: 'monospace',
    marginTop: 8,
    letterSpacing: 2,
  },
  mask: {
    width: 160,
    height: 160,
    marginBottom: 28,
    tintColor: colors.primary,
  },
  hello: {
    color: colors.text,
    fontSize: 28,
    fontFamily: 'monospace',
    fontWeight: '300',
    letterSpacing: 4,
  },
});
