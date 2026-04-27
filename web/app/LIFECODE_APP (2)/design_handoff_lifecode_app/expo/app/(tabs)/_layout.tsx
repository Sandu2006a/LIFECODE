import React from 'react';
import { Tabs } from 'expo-router';
import { Text, View, StyleSheet } from 'react-native';
import { colors, fonts } from '../../theme';

const Label = ({ focused, children }: any) => (
  <Text style={{ fontFamily: fonts.sans, fontSize: 11, color: focused ? colors.ink : colors.ink3, marginTop: 2 }}>{children}</Text>
);

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: colors.bg2, borderTopColor: colors.line, height: 70, paddingTop: 10 },
        tabBarShowLabel: true,
      }}>
      <Tabs.Screen name="index" options={{ title: 'Today', tabBarLabel: ({ focused }) => <Label focused={focused}>Today</Label> }} />
      <Tabs.Screen name="track" options={{ title: 'Track', tabBarLabel: ({ focused }) => <Label focused={focused}>Track</Label> }} />
      <Tabs.Screen name="ask" options={{ title: 'Ask', tabBarLabel: ({ focused }) => <Label focused={focused}>Ask</Label> }} />
      <Tabs.Screen name="you" options={{ title: 'You', tabBarLabel: ({ focused }) => <Label focused={focused}>You</Label> }} />
    </Tabs>
  );
}
