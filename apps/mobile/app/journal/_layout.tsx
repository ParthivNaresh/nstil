import { Stack } from "expo-router";

export default function JournalLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "transparent" } }}>
      <Stack.Screen name="list" />
      <Stack.Screen name="[id]" />
      <Stack.Screen
        name="create"
        options={{
          presentation: "modal",
          animation: "slide_from_bottom",
        }}
      />
    </Stack>
  );
}
