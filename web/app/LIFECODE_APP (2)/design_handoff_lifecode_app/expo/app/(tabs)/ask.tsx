import React, { useState, useRef } from 'react';
import { View, Text, ScrollView, TextInput, Pressable, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fonts } from '../../theme';
import Eyebrow from '../../components/Eyebrow';
import { ask, ChatMsg } from '../../lib/ai';

const SYSTEM_PRIMER: ChatMsg = {
  role: 'assistant',
  content: 'Good morning, Mark. Morning Pack taken ✓ How are you feeling?',
};

export default function Ask() {
  const [msgs, setMsgs] = useState<ChatMsg[]>([SYSTEM_PRIMER]);
  const [val, setVal] = useState('');
  const [busy, setBusy] = useState(false);
  const scroll = useRef<ScrollView>(null);

  const send = async () => {
    const t = val.trim();
    if (!t || busy) return;
    const next = [...msgs, { role: 'user', content: t } as ChatMsg];
    setMsgs(next);
    setVal('');
    setBusy(true);
    try {
      const reply = await ask([
        { role: 'assistant', content: 'You are LIFECODE, a friendly nutrition assistant. The user (Mark) takes Morning Pack at 7:30 and Recovery Pack at 20:00. Reply concisely (1–3 sentences). Mention concrete macros/micros when relevant.' },
        ...next,
      ]);
      setMsgs([...next, { role: 'assistant', content: reply }]);
    } catch (e: any) {
      setMsgs([...next, { role: 'assistant', content: '(connection error — try again)' }]);
    } finally {
      setBusy(false);
      requestAnimationFrame(() => scroll.current?.scrollToEnd({ animated: true }));
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }} keyboardVerticalOffset={80}>
        <View style={{ paddingHorizontal: 24, paddingTop: 8 }}>
          <Eyebrow>Assistant</Eyebrow>
          <Text style={s.h1}>Ask <Text style={{ fontFamily: fonts.serifItalic }}>anything.</Text></Text>
        </View>
        <ScrollView ref={scroll} contentContainerStyle={{ padding: 24, paddingBottom: 40 }}>
          {msgs.map((m, i) => (
            <View key={i} style={[s.bubble, m.role === 'user' ? s.me : s.ai]}>
              <Text style={[s.bubbleText, m.role === 'user' && { color: '#fff' }]}>{m.content}</Text>
            </View>
          ))}
          {busy && <View style={[s.bubble, s.ai]}><Text style={s.bubbleText}>…</Text></View>}
        </ScrollView>
        <View style={s.composer}>
          <TextInput value={val} onChangeText={setVal} onSubmitEditing={send} placeholder="Ask about nutrition…" placeholderTextColor={colors.ink3} style={s.input} />
          <Pressable onPress={send} style={s.send}><Text style={{ color: '#fff', fontSize: 18 }}>↑</Text></Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  h1: { fontFamily: fonts.serif, fontSize: 38, color: colors.ink, marginTop: 4, letterSpacing: -0.6 },
  bubble: { padding: 14, borderRadius: 18, marginTop: 10, maxWidth: '85%' },
  ai: { backgroundColor: colors.surf, borderWidth: 1, borderColor: colors.line, alignSelf: 'flex-start' },
  me: { backgroundColor: colors.ink, alignSelf: 'flex-end' },
  bubbleText: { fontFamily: fonts.sans, fontSize: 14, color: colors.ink, lineHeight: 20 },
  composer: { flexDirection: 'row', alignItems: 'center', margin: 16, backgroundColor: colors.surf, borderRadius: 999, paddingLeft: 16, paddingRight: 6, paddingVertical: 6, borderWidth: 1, borderColor: colors.line2 },
  input: { flex: 1, fontFamily: fonts.sans, fontSize: 14, color: colors.ink, paddingVertical: 8 },
  send: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center' },
});
