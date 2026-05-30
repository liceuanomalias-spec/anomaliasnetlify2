import { useEffect } from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/src/auth/AuthContext";
import { colors } from "@/src/theme";

export default function LogoutPage() {
  const router = useRouter();
  const { logout, adminLogout } = useAuth();

  useEffect(() => {
    (async () => {
      await logout();
      await adminLogout();
      router.replace("/");
    })();
  }, [logout, adminLogout, router]);

  return (
    <View style={styles.container}>
      <ActivityIndicator color={colors.primary} />
      <Text style={styles.text}>A terminar sessão...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
    gap: 12,
  },
  text: { color: colors.textSecondary, fontSize: 13 },
});
