import { Tabs } from 'expo-router';
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from '../../src/components/Icon';
import { colors, fonts, shadows } from '../../src/theme';

const TABS = [
  { name: 'index',   label: 'Summary', icon: 'home'  },
  { name: 'sharing', label: 'Sharing', icon: 'users' },
  { name: 'ask',     label: 'Ask',     icon: 'chat'  },
];

function TabBar({ state, navigation }: { state: any; navigation: any }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[bar.wrap, { bottom: 14 + (insets.bottom > 0 ? insets.bottom - 8 : 0) }]} pointerEvents="box-none">
      <View style={bar.pill}>
        {state.routes.map((route: any, index: number) => {
          const meta = TABS.find(t => t.name === route.name);
          if (!meta) return null;
          const isFocused = state.index === index;
          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name);
          };
          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              onPress={onPress}
              activeOpacity={0.7}
              style={bar.btn}
            >
              <View style={[bar.iconWrap, isFocused && bar.iconWrapActive]}>
                <Icon name={meta.icon} size={22} color={isFocused ? colors.ink : colors.ink3} strokeWidth={1.8} />
              </View>
              <Text style={[bar.label, { color: isFocused ? colors.ink : colors.ink3 }]}>
                {meta.label.toUpperCase()}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false, tabBarStyle: { display: 'none' } }}
      tabBar={(props) => <TabBar {...props} />}
    >
      <Tabs.Screen name="index"   options={{ title: 'Summary' }} />
      <Tabs.Screen name="sharing" options={{ title: 'Sharing' }} />
      <Tabs.Screen name="ask"     options={{ title: 'Ask'     }} />
    </Tabs>
  );
}

const bar = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 14,
    right: 14,
    alignItems: 'center',
  },
  pill: {
    flexDirection: 'row',
    height: 66,
    borderRadius: 28,
    paddingHorizontal: 8,
    backgroundColor: Platform.OS === 'ios' ? 'rgba(255,255,255,0.78)' : 'rgba(255,255,255,0.96)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.7)',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    width: '100%',
    ...shadows.tabBar,
  },
  btn: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3, paddingVertical: 8 },
  iconWrap: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  iconWrapActive: { backgroundColor: 'rgba(13,13,15,0.06)' },
  label: { fontFamily: fonts.sansMedium, fontSize: 10, letterSpacing: 1.6 },
});
