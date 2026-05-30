import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/src/auth/AuthContext";
import { colors, spacing, radius } from "@/src/theme";

type Choice = "aluno" | "professor" | null;

export default function UserTypeScreen() {
  const router = useRouter();
  const { setUserType, logout } = useAuth();
  const [choice, setChoice] = useState<Choice>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleContinue = async () => {
    if (!choice) {
      setError("Selecione uma opção para continuar");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await setUserType(choice);
      router.replace("/home");
    } catch (e: any) {
      setError(e?.message || "Erro ao guardar perfil");
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.replace("/");
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.container}>
        <TouchableOpacity
          testID="user-type-logout"
          style={styles.logoutTop}
          onPress={handleLogout}
        >
          <Text style={styles.logoutText}>Sair</Text>
        </TouchableOpacity>

        <View style={styles.headBlock}>
          <Text style={styles.title}>Qual é o seu perfil?</Text>
          <Text style={styles.subtitle}>
            Esta informação será incluída nos reportes que submeter.
          </Text>
        </View>

        <View style={styles.cardsRow}>
          <TouchableOpacity
            testID="user-type-aluno-card"
            style={[
              styles.card,
              choice === "aluno" && styles.cardActive,
            ]}
            activeOpacity={0.85}
            onPress={() => setChoice("aluno")}
          >
            <View
              style={[
                styles.cardIcon,
                choice === "aluno" && styles.cardIconActive,
              ]}
            >
              <Ionicons
                name="school-outline"
                size={28}
                color={choice === "aluno" ? "#fff" : colors.primary}
              />
            </View>
            <Text style={styles.cardLabel}>Aluno</Text>
          </TouchableOpacity>

          <TouchableOpacity
            testID="user-type-professor-card"
            style={[
              styles.card,
              choice === "professor" && styles.cardActive,
            ]}
            activeOpacity={0.85}
            onPress={() => setChoice("professor")}
          >
            <View
              style={[
                styles.cardIcon,
                choice === "professor" && styles.cardIconActive,
              ]}
            >
              <Ionicons
                name="briefcase-outline"
                size={28}
                color={choice === "professor" ? "#fff" : colors.primary}
              />
            </View>
            <Text style={styles.cardLabel}>Professor</Text>
          </TouchableOpacity>
        </View>

        {error ? (
          <Text style={styles.errorText} testID="user-type-error">
            {error}
          </Text>
        ) : null}

        <TouchableOpacity
          testID="user-type-continue-button"
          style={[
            styles.primaryButton,
            (!choice || submitting) && { opacity: 0.6 },
          ]}
          onPress={handleContinue}
          disabled={!choice || submitting}
          activeOpacity={0.8}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryButtonText}>Continuar</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  logoutTop: { alignSelf: "flex-end", padding: spacing.sm },
  logoutText: { color: colors.textSecondary, fontSize: 13 },
  headBlock: { marginTop: spacing.xl },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
    lineHeight: 20,
  },
  cardsRow: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  card: {
    flex: 1,
    aspectRatio: 1,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radius.xl,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.md,
    gap: spacing.md,
  },
  cardActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  cardIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  cardIconActive: { backgroundColor: colors.primary },
  cardLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  errorText: {
    color: colors.error,
    fontSize: 13,
    marginTop: spacing.md,
    textAlign: "center",
  },
  primaryButton: {
    marginTop: "auto",
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
});
