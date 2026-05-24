import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TextInput,
  TouchableOpacity, KeyboardAvoidingView, Platform, Pressable,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Avatar from '../../src/components/Avatar';
import Icon from '../../src/components/Icon';
import { colors, fonts, radii, shadows } from '../../src/theme';
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
  aiBubble: { backgroundColor: colors.surf, borderRadius: radii.card, borderWidth: 1, borderColor: colors.line, padding: 14, maxWidth: '85%', marginBottom: 10, ...shadows.card },
  aiText: { fontFamily: fonts.sans, fontSize: 15, color: colors.ink, lineHeight: 22 },
  meWrap: { alignItems: 'flex-end', marginBottom: 10 },
  meBubble: { backgroundColor: colors.ink, borderRadius: radii.card, padding: 14, maxWidth: '85%' },
  meText: { fontFamily: fonts.sans, fontSize: 15, color: '#fafaf7', lineHeight: 22 },
});

const SUGGESTIONS = [
  'What should I eat post-workout?',
  'Am I getting enough magnesium?',
  'How can I sleep better?',
];

export default function AskScreen() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [val, setVal] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const [profile, setProfile] = useState<{ name: string; avatarLetter: string; sport: string; age: number; weight_kg: number; height_cm: number; gender: string; goal: string } | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      setUserId(data.user.id);

      const { data: p } = await supabase
        .from('profiles')
        .select('display_name, full_name, sport, age, weight_kg, height_cm, gender, goal, avatar_letter')
        .eq('id', data.user.id)
        .maybeSingle();

      const name = p?.display_name || p?.full_name || data.user.email?.split('@')[0] || 'Athlete';
      const prof = {
        name,
        avatarLetter: (p?.avatar_letter || name.charAt(0) || 'A').toUpperCase(),
        sport: p?.sport || '',
        age: p?.age || 0,
        weight_kg: p?.weight_kg || 0,
        height_cm: p?.height_cm || 0,
        gender: p?.gender || '',
        goal: p?.goal || '',
      };
      setProfile(prof);

      setMessages([{
        id: 1,
        role: 'ai',
        text: `Hi ${name}. Ask anything about your nutrition, supplements, recovery, or training. I'll keep answers short and science-based.`,
      }]);
    });
  }, []);

  const buildSystemPrompt = (p: typeof profile) => {
    if (!p) return `You are the LIFECODE AI — a precision performance nutrition coach for serious athletes. Keep answers short, confident, and science-based.`;
    return `You are the LIFECODE AI — the personal coach of ${p.name}, a ${p.age}yo ${p.gender} ${p.sport} athlete weighing ${p.weight_kg}kg at ${p.height_cm}cm. Their goal: ${p.goal}.

LIFECODE supplements they take:
- Morning Pack: 11 vitamins & minerals (Vit A, C, D3, E, K2, B12, B-Complex, Zinc, Copper, Magnesium, Selenium)
- Recovery Pack: Maltodextrin, EAA 7g, Creatine 5g, Glutamine 3g, HMB 1.5g, Tart Cherry, Himalayan Salt, Magnesium, L-Theanine, AstraGin

Essentials (Iron, Calcium, Omega-3, Potassium, Iodine, CoQ10, Choline, B6, Folate) come from food only — not a supplement pack.

Give short, personalised, data-driven coaching. Reference their sport and goal in every answer. 2-3 sentences max unless detail is asked.`;
  };

  const sendText = async (textArg?: string) => {
    const text = (textArg ?? val).trim();
    if (!text || loading) return;

    const userMsg: Message = { id: Date.now(), role: 'user', text };
    setMessages(prev => [...prev, userMsg]);
    setVal('');
    setLoading(true);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      const history = [...messages.filter(m => m.id !== 1), userMsg]
        .map(m => ({ role: m.role === 'ai' ? 'model' : 'user', parts: [{ text: m.text }] }));

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

      if (userId) {
        await supabase.from('conversations').insert([
          { user_id: userId, role: 'user',      content: text },
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

        <View style={s.head}>
          <View style={{ flex: 1 }}>
            <Text style={s.date}>AI COACH</Text>
            <Text style={s.h1}>Ask <Text style={{ fontFamily: fonts.serifItalic }}>anything.</Text></Text>
          </View>
          <Pressable onPress={() => router.push('/profile')} hitSlop={10}>
            <Avatar name={profile?.avatarLetter || 'A'} size={38} gradient={['#e26a1f', '#4a3aa8']} border={2} borderColor="#fff" />
          </Pressable>
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
          {messages.length <= 1 && !loading && (
            <View style={s.suggestions}>
              {SUGGESTIONS.map(q => (
                <TouchableOpacity key={q} style={s.suggestBtn} onPress={() => sendText(q)}>
                  <Text style={s.suggestText}>{q}</Text>
                </TouchableOpacity>
              ))}
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
            onSubmitEditing={() => sendText()}
            returnKeyType="send"
            multiline
            editable={!loading}
          />
          <TouchableOpacity
            style={[s.sendBtn, { backgroundColor: val.trim() && !loading ? colors.ink : colors.ink4 }]}
            onPress={() => sendText()}
            disabled={!val.trim() || loading}
          >
            <Icon name="arrow-up" size={16} color="#fff" strokeWidth={2.2} />
          </TouchableOpacity>
        </View>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  head: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', paddingHorizontal: 22, paddingTop: 10, paddingBottom: 14 },
  date: { fontFamily: fonts.sansSemiBold, fontSize: 11, letterSpacing: 2.4, color: colors.ink3 },
  h1: { fontFamily: fonts.serif, fontSize: 34, color: colors.ink, marginTop: 4 },
  stream: { paddingHorizontal: 22, paddingBottom: 16 },
  suggestions: { gap: 8, marginTop: 12 },
  suggestBtn: { borderWidth: 1, borderColor: colors.line2, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 10, alignSelf: 'flex-start' },
  suggestText: { fontFamily: fonts.sans, fontSize: 13, color: colors.ink2 },
  composer: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 22, paddingVertical: 12, paddingBottom: 100, borderTopWidth: 1, borderTopColor: colors.line, backgroundColor: colors.bg },
  composerInput: { flex: 1, fontFamily: fonts.sans, fontSize: 15, color: colors.ink, maxHeight: 100, paddingTop: 0 },
  sendBtn: { width: 36, height: 36, borderRadius: radii.pill, alignItems: 'center', justifyContent: 'center' },
});
