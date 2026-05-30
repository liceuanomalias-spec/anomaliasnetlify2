import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/src/auth/AuthContext";
import { colors, spacing, radius } from "@/src/theme";

export default function LoginScreen() {
  const router = useRouter();
  const { login, token, user, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;
    if (token && user) {
      if (!user.user_type) {
        router.replace("/user-type");
      } else {
        router.replace("/home");
      }
    }
  }, [loading, token, user, router]);

  const handleSubmit = async () => {
    setError(null);
    if (!email || !password) {
      setError("Preencha o email e a palavra-passe");
      return;
    }
    setSubmitting(true);
    try {
      await login(email.trim(), password);
    } catch (e: any) {
      setError(e?.message || "Erro ao iniciar sessão");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.brandBlock}>
            <View style={styles.logoWrapper} testID="app-logo">
              <Image
                source={require("../assets/images/school-logo.png")}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.brandTitle}>Escola Secundária de Latino Coelho</Text>
            <Text style={styles.brandSubtitle}>Relato de Anomalias</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.label}>Email institucional</Text>
            <TextInput
              testID="login-email-input"
              style={styles.input}
              placeholder="nome@aelc-lamego.pt"
              placeholderTextColor={colors.textSecondary}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              editable={!submitting}
            />

            <Text style={[styles.label, { marginTop: spacing.md }]}>
              Palavra-passe
            </Text>
            <TextInput
              testID="login-password-input"
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor={colors.textSecondary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              editable={!submitting}
            />

            {error ? (
              <Text style={styles.errorText} testID="login-error">
                {error}
              </Text>
            ) : null}

            <TouchableOpacity
              testID="login-submit-button"
              style={[styles.primaryButton, submitting && styles.buttonDisabled]}
              onPress={handleSubmit}
              disabled={submitting}
              activeOpacity={0.8}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryButtonText}>Iniciar Sessão</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              testID="go-to-register-link"
              style={styles.linkButton}
              onPress={() => router.push("/register")}
            >
              <Text style={styles.linkText}>
                Ainda não tem conta?{" "}
                <Text style={styles.linkTextBold}>Registar</Text>
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            testID="go-to-admin-link"
            style={styles.adminLink}
            onPress={() => router.push("/admin/login")}
          >
            <Ionicons name="lock-closed-outline" size={14} color={colors.textSecondary} />
            <Text style={styles.adminLinkText}>Acesso Administrador</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  loadingScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
    justifyContent: "center",
  },
  brandBlock: {
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  logoWrapper: {
    width: 280,
    height: 80,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
  logoImage: {
    width: "100%",
    height: "100%",
  },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  brandTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.textPrimary,
    letterSpacing: -0.3,
    textAlign: "center",
    paddingHorizontal: spacing.md,
  },
  brandSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  card: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    padding: spacing.lg,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    fontSize: 15,
    color: colors.textPrimary,
    backgroundColor: colors.background,
  },
  errorText: {
    color: colors.error,
    fontSize: 13,
    marginTop: spacing.md,
  },
  primaryButton: {
    marginTop: spacing.lg,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonDisabled: { opacity: 0.6 },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
  linkButton: { marginTop: spacing.md, alignItems: "center" },
  linkText: { fontSize: 13, color: colors.textSecondary },
  linkTextBold: { color: colors.primary, fontWeight: "600" },
  adminLink: {
    marginTop: spacing.xl,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  adminLinkText: {
    fontSize: 12,
    color: colors.textSecondary,
    letterSpacing: 0.3,
  },
});
