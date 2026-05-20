import React, {useEffect, useRef} from 'react';
import {View, Text, StyleSheet, Animated, Image} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {colors, gradients} from '../theme';
import {useApp} from '../context/AppContext';

const MASK_IMG = require('../assets/fsociety-mask.png');

export default function SplashScreen({navigation}) {
  const {connect} = useApp();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.85)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {toValue: 1, duration: 900, useNativeDriver: true}),
      Animated.spring(scaleAnim, {toValue: 1, tension: 40, friction: 8, useNativeDriver: true}),
    ]).start();

    setTimeout(async () => {
      try { await connect(); } catch (_) {}
      setTimeout(() => navigation.replace('Main'), 400);
    }, 2400);
  }, []);

  return (
    <LinearGradient colors={gradients.splash} style={styles.container}>
      <Animated.View style={[styles.content, {opacity: fadeAnim, transform: [{scale: scaleAnim}]}]}>
        <Image source={MASK_IMG} style={styles.mask} resizeMode="contain" />
        <Text style={styles.hello}>Hello Friend.</Text>
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, alignItems: 'center', justifyContent: 'center'},
  content: {alignItems: 'center'},
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
