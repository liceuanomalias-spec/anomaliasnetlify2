import React, { useState } from "react";
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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/src/auth/AuthContext";
import { apiFetch } from "@/src/utils/api";
import { colors, spacing, radius } from "@/src/theme";

type Tipo = "aluno" | "professor";

export default function ReportScreen() {
  const router = useRouter();
  const { token, user } = useAuth();
  const [nome, setNome] = useState("");
  const [tipo, setTipo] = useState<Tipo | null>(
    (user?.user_type as Tipo) || null
  );
  const [local, setLocal] = useState("");
  const [sala, setSala] = useState("");
  const [descricao, setDescricao] = useState("");
  const [infoAdicional, setInfoAdicional] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);
    if (!nome.trim()) {
      setError("Por favor indique o seu nome");
      return;
    }
    if (!tipo) {
      setError("Selecione se é Aluno ou Professor");
      return;
    }
    if (!local.trim()) {
      setError("Por favor indique o local da anomalia");
      return;
    }
    if (!descricao.trim()) {
      setError("Por favor descreva o problema");
      return;
    }
    setSubmitting(true);
    try {
      const result = await apiFetch<{ report: any; email_sent: boolean }>(
        "/api/reports",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            nome: nome.trim(),
            tipo,
            local: local.trim(),
            sala: sala.trim() || null,
            descricao: descricao.trim(),
            info_adicional: infoAdicional.trim() || null,
          }),
        },
      );
      if (!result.ok) throw new Error(result.error);
      router.replace({
        pathname: "/confirmation",
        params: { emailSent: result.data.email_sent ? "1" : "0" },
      });
    } catch (e: any) {
      setError(e?.message || "Erro ao submeter");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <View style={styles.headerBar}>
          <TouchableOpacity
            testID="report-back-button"
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Novo Relato</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.intro}>
            Indique os detalhes da anomalia. O relato será enviado por email para
            a equipa responsável.
          </Text>

          <View style={styles.field}>
            <Text style={styles.label}>
              Nome <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              testID="report-nome-input"
              style={styles.input}
              placeholder="O seu nome completo"
              placeholderTextColor={colors.textSecondary}
              value={nome}
              onChangeText={setNome}
              editable={!submitting}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>
              Perfil <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.segmentRow}>
              <TouchableOpacity
                testID="report-tipo-aluno"
                style={[
                  styles.segment,
                  tipo === "aluno" && styles.segmentActive,
                ]}
                onPress={() => setTipo("aluno")}
                disabled={submitting}
                activeOpacity={0.85}
              >
                <Ionicons
                  name="school-outline"
                  size={18}
                  color={tipo === "aluno" ? "#fff" : colors.textPrimary}
                />
                <Text
                  style={[
                    styles.segmentText,
                    tipo === "aluno" && styles.segmentTextActive,
                  ]}
                >
                  Aluno
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                testID="report-tipo-professor"
                style={[
                  styles.segment,
                  tipo === "professor" && styles.segmentActive,
                ]}
                onPress={() => setTipo("professor")}
                disabled={submitting}
                activeOpacity={0.85}
              >
                <Ionicons
                  name="briefcase-outline"
                  size={18}
                  color={tipo === "professor" ? "#fff" : colors.textPrimary}
                />
                <Text
                  style={[
                    styles.segmentText,
                    tipo === "professor" && styles.segmentTextActive,
                  ]}
                >
                  Professor
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>
              Local da Anomalia <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              testID="report-local-input"
              style={styles.input}
              placeholder="Ex: Biblioteca, Corredor B, Sala"
              placeholderTextColor={colors.textSecondary}
              value={local}
              onChangeText={setLocal}
              editable={!submitting}
            />
            <Text style={styles.helper}>
              Indique o espaço onde se encontra a anomalia
            </Text>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Número da Sala (opcional)</Text>
            <TextInput
              testID="report-sala-input"
              style={styles.input}
              placeholder="Ex: 12, A3, B-204"
              placeholderTextColor={colors.textSecondary}
              value={sala}
              onChangeText={setSala}
              editable={!submitting}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>
              Descrição do Problema <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              testID="report-descricao-input"
              style={[styles.input, styles.textarea]}
              placeholder="Descreva o instrumento danificado e o problema observado"
              placeholderTextColor={colors.textSecondary}
              value={descricao}
              onChangeText={setDescricao}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
              editable={!submitting}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Informações Adicionais (opcional)</Text>
            <TextInput
              testID="report-info-input"
              style={[styles.input, styles.textarea]}
              placeholder="Detalhes adicionais que considere úteis"
              placeholderTextColor={colors.textSecondary}
              value={infoAdicional}
              onChangeText={setInfoAdicional}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              editable={!submitting}
            />
          </View>

          {error ? (
            <Text style={styles.errorText} testID="report-error">
              {error}
            </Text>
          ) : null}

          <TouchableOpacity
            testID="report-submit-button"
            style={[styles.primaryButton, submitting && { opacity: 0.6 }]}
            onPress={handleSubmit}
            disabled={submitting}
            activeOpacity={0.85}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryButtonText}>Submeter Relato</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  scroll: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
  },
  intro: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: spacing.md,
  },
  field: { marginBottom: spacing.md },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: 6,
  },
  required: { color: colors.error },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.textPrimary,
    backgroundColor: colors.background,
  },
  textarea: { minHeight: 100, paddingTop: 12 },
  helper: { fontSize: 11, color: colors.textSecondary, marginTop: 4 },
  segmentRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  segment: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.background,
  },
  segmentActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  segmentText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  segmentTextActive: {
    color: "#fff",
  },
  errorText: {
    color: colors.error,
    fontSize: 13,
    marginBottom: spacing.sm,
  },
  primaryButton: {
    marginTop: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: { color: "#fff", fontSize: 15, fontWeight: "600" },
});
