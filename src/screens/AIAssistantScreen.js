import React, {useState, useRef, useEffect} from 'react';
import {
  View, Text, StyleSheet, TextInput, ScrollView,
  TouchableOpacity, SafeAreaView, KeyboardAvoidingView, Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LinearGradient from 'react-native-linear-gradient';
import {colors, fontSizes, spacing, radius} from '../theme';
import AIService from '../utils/AIService';
import {useApp} from '../context/AppContext';

export default function AIAssistantScreen({navigation}) {
  const {isConnected} = useApp();
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Cześć! Jestem Twoim asystentem pentestowym. Powiedz mi co chcesz zrobić, a ja dobiorę narzędzia i wykonam komendy.',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [modelStatus, setModelStatus] = useState({available: null, message: 'Ładowanie...'});
  const scrollViewRef = useRef(null);

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({animated: true});
  }, [messages]);

  useEffect(() => {
    initializeAI();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let interval;
    if (modelStatus.available === false && modelStatus.message.includes('ładuje')) {
      interval = setInterval(() => {
        checkModelStatus();
      }, 5000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [modelStatus]);

  const initializeAI = async () => {
    console.log('[KALI_AI] initializeAI - start');
    try {
      const token = await AsyncStorage.getItem('openrouter_api_key');
      console.log('[KALI_AI] Token from storage:', token ? `exists (${token.length} chars)` : 'null');
      if (token) {
        AIService.setApiKey(token);
        console.log('[KALI_AI] Token set to AIService');
      }
      await checkModelStatus();
    } catch (e) {
      console.log('[KALI_AI] Initialize error:', e);
      setModelStatus({available: false, message: 'Błąd ładowania'});
    }
  };

  const checkModelStatus = async () => {
    console.log('[KALI_AI] checkModelStatus - start');
    setModelStatus(prev => ({...prev, message: 'Sprawdzanie...'}));
    const status = await AIService.checkModelAvailability();
    console.log('[KALI_AI] Status result:', status);
    setModelStatus(status);
  };

  const handleSend = async () => {
    if (!input.trim() || loading || executing) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, {role: 'user', content: userMessage}]);
    setLoading(true);

    try {
      const response = await AIService.chat([{role: 'user', content: userMessage}]);
      setMessages(prev => [...prev, {role: 'assistant', content: response}]);
    } catch (error) {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: `❌ Błąd: ${error.message}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleExecute = async () => {
    if (!isConnected) {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: '❌ Najpierw połącz się z Kali Linux.',
        },
      ]);
      return;
    }

    if (!AIService.getHfToken()) {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: '❌ Najpierw ustaw HuggingFace token w Ustawieniach.',
        },
      ]);
      return;
    }

    const lastUserMessage = messages.filter(m => m.role === 'user').pop();
    if (!lastUserMessage) return;

    setExecuting(true);
    const executionMessages = [];

    try {
      await AIService.executeWithAI(
        lastUserMessage.content,
        (progress) => {
          executionMessages.push({role: 'system', content: progress});
          setMessages(prev => [...prev, {role: 'assistant', content: progress}]);
        },
        (command) => {
          executionMessages.push({role: 'system', content: `CMD: ${command}`});
          setMessages(prev => [...prev, {role: 'system', content: `💻 ${command}`}]);
        },
        (output) => {
          executionMessages.push({role: 'system', content: `Output: ${output}`});
          setMessages(prev => [...prev, {role: 'system', content: `📤 ${output}`}]);
        },
      );
    } catch (error) {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: `❌ Błąd wykonania: ${error.message}`,
        },
      ]);
    } finally {
      setExecuting(false);
    }
  };

  const renderMessage = (msg, index) => {
    const isUser = msg.role === 'user';
    const isSystem = msg.role === 'system';
    return (
      <View
        key={index}
        style={[
          styles.messageContainer,
          isUser ? styles.userMessage : isSystem ? styles.systemMessage : styles.assistantMessage,
        ]}>
        <Text
          style={[
            styles.messageText,
            isUser ? styles.userText : isSystem ? styles.systemText : styles.assistantText,
          ]}>
          {msg.content}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <LinearGradient
        colors={['#1a0a2e', '#0a0a1a']}
        style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>‹</Text>
          <Text style={styles.backText}>Powrót</Text>
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerIcon}>🤖</Text>
          <View>
            <Text style={styles.headerTitle}>AI Asystent</Text>
            <Text style={styles.headerSub}>Pentest Command Assistant</Text>
          </View>
        </View>
        <TouchableOpacity onPress={checkModelStatus} style={styles.statusBtn}>
          <View style={[
            styles.statusDot,
            {backgroundColor: modelStatus.available === true ? colors.primary : modelStatus.available === false ? colors.error : colors.warning}
          ]} />
          <Text style={styles.statusText}>{modelStatus.message}</Text>
        </TouchableOpacity>
      </LinearGradient>

      <KeyboardAvoidingView
        behavior="padding"
        style={styles.keyboardView}
        keyboardVerticalOffset={0}>
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesScroll}
          contentContainerStyle={styles.messagesContent}
          keyboardShouldPersistTaps="handled">
          {messages.map((msg, index) => renderMessage(msg, index))}
          {(loading || executing) && (
            <View style={[styles.messageContainer, styles.assistantMessage]}>
              <Text style={styles.assistantText}>{executing ? '⚙️ Wykonuję...' : '🤔 Myślę...'}</Text>
            </View>
          )}
          <View style={{height: 20}} />
        </ScrollView>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Opisz co chcesz zrobić..."
            placeholderTextColor={colors.textMuted}
            multiline
            numberOfLines={3}
            maxLength={500}
            textAlignVertical="top"
          />
          <TouchableOpacity
            style={[styles.executeBtn, (loading || executing) && styles.sendBtnDisabled]}
            onPress={handleExecute}
            disabled={loading || executing}>
            <Text style={styles.sendBtnText}>⚡</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sendBtn, (loading || executing) && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={loading || executing}>
            <Text style={styles.sendBtnText}>{loading ? '⏳' : '🚀'}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: colors.background},
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: 4,
  },
  backIcon: {color: colors.textDim, fontSize: 22},
  backText: {color: colors.textDim, fontSize: fontSizes.md},
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  headerIcon: {fontSize: 32},
  headerTitle: {
    color: colors.text,
    fontSize: fontSizes.xxl,
    fontWeight: '800',
  },
  headerSub: {
    color: colors.textDim,
    fontSize: fontSizes.sm,
    marginTop: 2,
  },
  statusBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    color: colors.textDim,
    fontSize: fontSizes.xs,
  },
  keyboardView: {flex: 1},
  messagesScroll: {flex: 1},
  messagesContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  messageContainer: {
    maxWidth: '90%',
    padding: spacing.md,
    borderRadius: radius.lg,
    marginBottom: spacing.md,
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
  },
  assistantMessage: {
    alignSelf: 'flex-start',
    backgroundColor: colors.card,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  systemMessage: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surface,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  messageText: {
    fontSize: fontSizes.sm,
    lineHeight: 20,
  },
  userText: {
    color: colors.background,
  },
  assistantText: {
    color: colors.text,
  },
  systemText: {
    color: colors.text,
    fontFamily: 'monospace',
    fontSize: fontSizes.xs,
  },
  inputContainer: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.text,
    fontSize: fontSizes.md,
    maxHeight: 120,
    minHeight: 44,
  },
  executeBtn: {
    width: 50,
    height: 50,
    borderRadius: radius.md,
    backgroundColor: colors.warning,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtn: {
    width: 50,
    height: 50,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    opacity: 0.5,
  },
  sendBtnText: {
    fontSize: 20,
  },
});
