import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TextInput,
  TouchableOpacity, KeyboardAvoidingView, Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from '../../src/components/Icon';
import { colors, fonts, radii } from '../../src/theme';
import { askGemini, ChatMessage } from '../../src/lib/gemini';
import { supabase } from '../../src/lib/supabase';

type Message = { id: number; role: 'ai' | 'user'; text: string };

const WELCOME: Message = {
  id: 1,
  role: 'ai',
  text: 'Hi! I\'m your LIFECODE AI assistant. Ask me anything about your nutrition, supplements, or training.',
};

function Bubble({ msg }: { msg: Message }) {
  if (msg.role === 'ai') {
    return (
      <View style={b.aiBubble}>
        <Text style={b.aiText}>{msg.text}</Text>
      </View>
    );
  }
  return (
    <View style={b.meWrap}>
      <View style={b.meBubble}>
        <Text style={b.meText}>{msg.text}</Text>
      </View>
    </View>
  );
}

const b = StyleSheet.create({
  aiBubble: {
    backgroundColor: colors.surf,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 14,
    maxWidth: '82%',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  aiText: { fontFamily: fonts.sans, fontSize: 15, color: colors.ink, lineHeight: 22 },
  meWrap: { alignItems: 'flex-end', marginBottom: 10 },
  meBubble: {
    backgroundColor: 'rgba(13,13,15,0.07)',
    borderRadius: radii.card,
    padding: 14,
    maxWidth: '82%',
  },
  meText: { fontFamily: fonts.sans, fontSize: 15, color: colors.ink, lineHeight: 22 },
});

export default function AskScreen() {
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [val, setVal] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const [userName, setUserName] = useState('');
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const name = data.user?.user_metadata?.name ?? data.user?.email?.split('@')[0] ?? '';
      setUserName(name);
      setMessages([{
        id: 1,
        role: 'ai',
        text: `Hi${name ? ' ' + name : ''}! I\'m your LIFECODE AI assistant. Ask me anything about nutrition, supplements, or training.`,
      }]);
    });
  }, []);

  const send = async () => {
    const text = val.trim();
    if (!text || loading) return;

    const userMsg: Message = { id: Date.now(), role: 'user', text };
    setMessages(prev => [...prev, userMsg]);
    setVal('');
    setLoading(true);

    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);

    // Build chat history for Gemini
    const history: ChatMessage[] = messages
      .filter(m => m.id !== 1)
      .map(m => ({ role: m.role === 'ai' ? 'model' : 'user', content: m.text }));
    history.push({ role: 'user', content: text });

    const aiText = await askGemini(history);

    const aiMsg: Message = { id: Date.now() + 1, role: 'ai', text: aiText };
    setMessages(prev => [...prev, aiMsg]);
    setLoading(false);

    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>

        <View style={s.greet}>
          <Text style={s.day}>AI Assistant</Text>
          <Text style={s.h1}>Ask <Text style={s.h1Italic}>anything.</Text></Text>
        </View>

        <ScrollView
          ref={scrollRef}
          style={{ flex: 1 }}
          contentContainerStyle={s.stream}
          showsVerticalScrollIndicator={false}
        >
          {messages.map(msg => <Bubble key={msg.id} msg={msg} />)}
          {loading && (
            <View style={b.aiBubble}>
              <ActivityIndicator size="small" color={colors.ink3} />
            </View>
          )}
        </ScrollView>

        <View style={s.composer}>
          <Icon name="mic" size={18} color={colors.ink3} />
          <TextInput
            style={s.composerInput}
            placeholder="Ask or dictate…"
            placeholderTextColor={colors.ink3}
            value={val}
            onChangeText={setVal}
            onSubmitEditing={send}
            returnKeyType="send"
            multiline
            editable={!loading}
          />
          <TouchableOpacity
            style={[s.sendBtn, { backgroundColor: val.trim() && !loading ? colors.ink : colors.ink4 }]}
            onPress={send}
            disabled={!val.trim() || loading}
          >
            <Icon name="send" size={15} color="#fff" />
          </TouchableOpacity>
        </View>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  greet: { paddingHorizontal: 22, paddingTop: 16, paddingBottom: 16 },
  day: { fontFamily: fonts.sansSemiBold, fontSize: 12, letterSpacing: 1, color: colors.ink3, textTransform: 'uppercase', marginBottom: 4 },
  h1: { fontFamily: fonts.serif, fontSize: 40, color: colors.ink },
  h1Italic: { fontFamily: fonts.serifItalic },
  stream: { paddingHorizontal: 22, paddingBottom: 16 },
  composer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    backgroundColor: colors.bg,
  },
  composerInput: {
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: 15,
    color: colors.ink,
    maxHeight: 100,
    paddingTop: 0,
  },
  sendBtn: { width: 36, height: 36, borderRadius: radii.pill, alignItems: 'center', justifyContent: 'center' },
});
