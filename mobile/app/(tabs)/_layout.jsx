import { Tabs } from "expo-router";
import { Text } from "react-native";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#4B6CD9",
        tabBarStyle: { backgroundColor: "#fff" },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          tabBarLabel: "Home",
          tabBarIcon: ({ color, size }) => <Text style={{ color, fontSize: size }}>🏠</Text>,
        }}
      />
      <Tabs.Screen
        name="jadwal"
        options={{
          tabBarLabel: "Jadwal",
          tabBarIcon: ({ color, size }) => <Text style={{ color, fontSize: size }}>📅</Text>,
        }}
      />
      <Tabs.Screen
        name="hasil"
        options={{
          tabBarLabel: "Hasil",
          tabBarIcon: ({ color, size }) => <Text style={{ color, fontSize: size }}>📄</Text>,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarLabel: "Profile",
          tabBarIcon: ({ color, size }) => <Text style={{ color, fontSize: size }}>👤</Text>,
        }}
      />
    </Tabs>
  );
}