import { Tabs } from "expo-router";
import {
  GearSix,
  House,
  MagnifyingGlass,
  MusicNotes,
  Playlist,
} from "phosphor-react-native";
import { View } from "react-native";

import { MiniPlayer } from "@/src/components/MiniPlayer";
import { TAB_BAR_HEIGHT } from "@/src/constants";
import { useTheme } from "@/src/theme/ThemeProvider";

export default function TabsLayout() {
  const { colors } = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.brand,
          tabBarInactiveTintColor: colors.onSurfaceTertiary,
          tabBarStyle: {
            backgroundColor: colors.surface,
            borderTopColor: colors.divider,
            height: TAB_BAR_HEIGHT,
            paddingTop: 6,
          },
          tabBarLabelStyle: { fontFamily: "Manrope", fontSize: 11, fontWeight: "600" },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            tabBarIcon: ({ color, focused }) => (
              <House size={24} color={color} weight={focused ? "fill" : "regular"} />
            ),
          }}
        />
        <Tabs.Screen
          name="library"
          options={{
            title: "Library",
            tabBarIcon: ({ color, focused }) => (
              <MusicNotes size={24} color={color} weight={focused ? "fill" : "regular"} />
            ),
          }}
        />
        <Tabs.Screen
          name="playlists"
          options={{
            title: "Playlists",
            tabBarIcon: ({ color, focused }) => (
              <Playlist size={24} color={color} weight={focused ? "fill" : "regular"} />
            ),
          }}
        />
        <Tabs.Screen
          name="search"
          options={{
            title: "Search",
            tabBarIcon: ({ color, focused }) => (
              <MagnifyingGlass size={24} color={color} weight={focused ? "bold" : "regular"} />
            ),
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: "Settings",
            tabBarIcon: ({ color, focused }) => (
              <GearSix size={24} color={color} weight={focused ? "fill" : "regular"} />
            ),
          }}
        />
      </Tabs>
      <MiniPlayer tabBarHeight={TAB_BAR_HEIGHT} />
    </View>
  );
}
