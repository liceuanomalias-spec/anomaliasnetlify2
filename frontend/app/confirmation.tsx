import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, radius } from "@/src/theme";

export default function ConfirmationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ emailSent?: string }>();
  const emailSent = params.emailSent === "1";

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.container}>
        <View style={styles.iconCircle} testID="confirmation-success-icon">
          <Ionicons name="checkmark" size={56} color="#fff" />
        </View>

        <Text style={styles.title}>Relato Submetido</Text>
        <Text style={styles.subtitle}>
          O seu relato foi registado com sucesso.
        </Text>

        {emailSent ? (
          <View style={[styles.infoBadge, { backgroundColor: colors.primaryLight }]}>
            <Ionicons name="mail" size={14} color={colors.primary} />
            <Text style={[styles.infoBadgeText, { color: colors.primary }]}>
              Email enviado para os responsáveis
            </Text>
          </View>
        ) : (
          <View style={[styles.infoBadge, { backgroundColor: "#FEF3C7" }]}>
            <Ionicons name="time-outline" size={14} color="#92400E" />
            <Text style={[styles.infoBadgeText, { color: "#92400E" }]}>
              Relato guardado. O email será reenviado mais tarde.
            </Text>
          </View>
        )}

        <TouchableOpacity
          testID="confirmation-home-button"
          style={styles.primaryButton}
          onPress={() => router.replace("/home")}
          activeOpacity={0.85}
        >
          <Text style={styles.primaryButtonText}>Voltar ao Início</Text>
        </TouchableOpacity>

        <TouchableOpacity
          testID="confirmation-new-report-button"
          style={styles.secondaryButton}
          onPress={() => router.replace("/report")}
        >
          <Text style={styles.secondaryButtonText}>Submeter outro relato</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },
  iconCircle: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    textAlign: "center",
    lineHeight: 20,
    maxWidth: 320,
  },
  infoBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    marginTop: spacing.lg,
  },
  infoBadgeText: { fontSize: 12, fontWeight: "600" },
  primaryButton: {
    marginTop: spacing.xl,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 14,
    paddingHorizontal: spacing.xl,
    minWidth: 240,
    alignItems: "center",
  },
  primaryButtonText: { color: "#fff", fontWeight: "600", fontSize: 15 },
  secondaryButton: {
    marginTop: spacing.md,
    paddingVertical: 10,
  },
  secondaryButtonText: {
    color: colors.textSecondary,
    fontSize: 13,
  },
});
