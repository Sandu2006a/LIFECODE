import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TextInput,
  TouchableOpacity, KeyboardAvoidingView, Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from '../../src/components/Icon';
import { colors, fonts, radii } from '../../src/theme';
import { supabase } from '../../src/lib/supabase';

type Message = { id: number; role: 'ai' | 'user'; text: string };

const GEMINI_KEY = process.env.EXPO_PUBLIC_GEMINI_KEY!;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY}`;

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
  aiBubble: { backgroundColor: colors.surf, borderRadius: radii.card, borderWidth: 1, borderColor: colors.line, padding: 14, maxWidth: '82%', marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 1 },
  aiText: { fontFamily: fonts.sans, fontSize: 15, color: colors.ink, lineHeight: 22 },
  meWrap: { alignItems: 'flex-end', marginBottom: 10 },
  meBubble: { backgroundColor: 'rgba(13,13,15,0.07)', borderRadius: radii.card, padding: 14, maxWidth: '82%' },
  meText: { fontFamily: fonts.sans, fontSize: 15, color: colors.ink, lineHeight: 22 },
});

export default function AskScreen() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [val, setVal] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const [profile, setProfile] = useState<{ name: string; sport: string; age: number; weight_kg: number; height_cm: number; gender: string; goal: string } | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      setUserId(data.user.id);

      const { data: p } = await supabase
        .from('profiles')
        .select('display_name, full_name, sport, age, weight_kg, height_cm, gender, goal')
        .eq('id', data.user.id)
        .maybeSingle();

      const name = p?.display_name || p?.full_name || data.user.email?.split('@')[0] || 'Athlete';
      const prof = { name, sport: p?.sport || '', age: p?.age || 0, weight_kg: p?.weight_kg || 0, height_cm: p?.height_cm || 0, gender: p?.gender || '', goal: p?.goal || '' };
      setProfile(prof);

      setMessages([{
        id: 1,
        role: 'ai',
        text: `Hi ${name}! I'm your LIFECODE AI — your personal performance coach. Ask me anything about your nutrition, supplements, recovery, or training.`,
      }]);
    });
  }, []);

  const buildSystemPrompt = (p: typeof profile) => {
    if (!p) return `You are the LIFECODE AI — a precision performance nutrition coach for serious athletes. Keep answers short, confident, and science-based.`;
    return `You are the LIFECODE AI — the personal coach of ${p.name}, a ${p.age}yo ${p.gender} ${p.sport} athlete weighing ${p.weight_kg}kg at ${p.height_cm}cm. Their goal: ${p.goal}.

LIFECODE supplements they take:
- Morning Pack: 11 vitamins & minerals (Vit A, C, D3, E, K2, B12, B-Complex, Zinc, Copper, Magnesium, Selenium)
- Recovery Pack: Maltodextrin, EAA 7g, Creatine 5g, Glutamine 3g, HMB 1.5g, Tart Cherry, Himalayan Salt, Magnesium, L-Theanine, AstraGin

Give short, personalised, data-driven coaching. Reference their sport and goal in every answer. 2-3 sentences max unless detail is asked.`;
  };

  const send = async () => {
    const text = val.trim();
    if (!text || loading) return;

    const userMsg: Message = { id: Date.now(), role: 'user', text };
    setMessages(prev => [...prev, userMsg]);
    setVal('');
    setLoading(true);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      // Build contents for Gemini
      const history = [...messages.filter(m => m.id !== 1), userMsg]
        .map(m => ({
          role: m.role === 'ai' ? 'model' : 'user',
          parts: [{ text: m.text }],
        }));

      const res = await fetch(GEMINI_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: buildSystemPrompt(profile) }] },
          contents: history,
          generationConfig: { temperature: 0.7, maxOutputTokens: 512 },
        }),
      });

      const data = await res.json();
      const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text ?? 'Unable to respond right now.';

      // Save to conversations table
      if (userId) {
        await supabase.from('conversations').insert([
          { user_id: userId, role: 'user', content: text },
          { user_id: userId, role: 'assistant', content: aiText },
        ]);
      }

      setMessages(prev => [...prev, { id: Date.now() + 1, role: 'ai', text: aiText }]);
    } catch {
      setMessages(prev => [...prev, { id: Date.now() + 1, role: 'ai', text: 'Connection error — please try again.' }]);
    } finally {
      setLoading(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>

        <View style={s.greet}>
          <Text style={s.day}>AI Coach</Text>
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
          <TextInput
            style={s.composerInput}
            placeholder="Ask your coach…"
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
  composer: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 22, paddingVertical: 12, borderTopWidth: 1, borderTopColor: colors.line, backgroundColor: colors.bg },
  composerInput: { flex: 1, fontFamily: fonts.sans, fontSize: 15, color: colors.ink, maxHeight: 100, paddingTop: 0 },
  sendBtn: { width: 36, height: 36, borderRadius: radii.pill, alignItems: 'center', justifyContent: 'center' },
});
