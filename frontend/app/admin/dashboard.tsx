import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth, API_BASE } from "@/src/auth/AuthContext";
import { colors, spacing, radius } from "@/src/theme";

type Recipient = {
  id: string;
  email: string;
  active: boolean;
};

type Report = {
  id: string;
  user_email: string;
  user_type: string;
  nome?: string | null;
  tipo?: string | null;
  local: string;
  sala?: string | null;
  descricao: string;
  info_adicional?: string | null;
  created_at: string;
  email_sent?: boolean;
};

type Tab = "recipients" | "reports";

export default function AdminDashboard() {
  const router = useRouter();
  const { adminToken, adminLogout } = useAuth();
  const [tab, setTab] = useState<Tab>("recipients");
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const authHeaders = adminToken
    ? { Authorization: `Bearer ${adminToken}` }
    : undefined;

  useEffect(() => {
    if (!adminToken) {
      router.replace("/admin/login");
    }
  }, [adminToken, router]);

  const fetchRecipients = useCallback(async () => {
    if (!adminToken) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/recipients`, {
        headers: authHeaders,
      });
      const data = await res.json();
      if (res.ok) setRecipients(data.recipients || []);
    } finally {
      setLoading(false);
    }
  }, [adminToken]);

  const fetchReports = useCallback(async () => {
    if (!adminToken) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/reports`, {
        headers: authHeaders,
      });
      const data = await res.json();
      if (res.ok) setReports(data.reports || []);
    } finally {
      setLoading(false);
    }
  }, [adminToken]);

  useEffect(() => {
    if (tab === "recipients") fetchRecipients();
    else fetchReports();
  }, [tab, fetchRecipients, fetchReports]);

  const handleAddRecipient = async () => {
    setError(null);
    const email = newEmail.trim().toLowerCase();
    if (!email) {
      setError("Indique um email");
      return;
    }
    setAdding(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/recipients`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(authHeaders || {}),
        },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        const detail = Array.isArray(data.detail) ? data.detail[0]?.msg : data.detail;
        throw new Error(detail || "Erro ao adicionar");
      }
      setNewEmail("");
      fetchRecipients();
    } catch (e: any) {
      setError(e?.message || "Erro ao adicionar email");
    } finally {
      setAdding(false);
    }
  };

  const handleToggle = async (id: string) => {
    try {
      await fetch(`${API_BASE}/api/admin/recipients/${id}/toggle`, {
        method: "PATCH",
        headers: authHeaders,
      });
      fetchRecipients();
    } catch {}
  };

  const handleDelete = async (id: string, email: string) => {
    const proceed = async () => {
      try {
        await fetch(`${API_BASE}/api/admin/recipients/${id}`, {
          method: "DELETE",
          headers: authHeaders,
        });
        fetchRecipients();
      } catch {}
    };
    Alert.alert(
      "Remover destinatário",
      `Remover ${email} da lista de envio?`,
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Remover", style: "destructive", onPress: proceed },
      ]
    );
  };

  const handleLogout = async () => {
    await adminLogout();
    router.replace("/");
  };

  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleString("pt-PT", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return iso;
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerLabel}>Painel</Text>
          <Text style={styles.headerTitle}>Administração</Text>
        </View>
        <TouchableOpacity
          testID="admin-logout-button"
          style={styles.iconButton}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity
          testID="admin-tab-recipients"
          style={[styles.tab, tab === "recipients" && styles.tabActive]}
          onPress={() => setTab("recipients")}
        >
          <Text
            style={[
              styles.tabText,
              tab === "recipients" && styles.tabTextActive,
            ]}
          >
            Destinatários
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          testID="admin-tab-reports"
          style={[styles.tab, tab === "reports" && styles.tabActive]}
          onPress={() => setTab("reports")}
        >
          <Text
            style={[
              styles.tabText,
              tab === "reports" && styles.tabTextActive,
            ]}
          >
            Reportes
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.body}
        keyboardShouldPersistTaps="handled"
      >
        {tab === "recipients" ? (
          <>
            <Text style={styles.sectionDesc}>
              Emails que receberão notificações de novos reportes.
            </Text>
            <View style={styles.addBlock}>
              <TextInput
                testID="admin-new-email-input"
                style={styles.input}
                placeholder="email@exemplo.pt"
                placeholderTextColor={colors.textSecondary}
                value={newEmail}
                onChangeText={setNewEmail}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                editable={!adding}
              />
              <TouchableOpacity
                testID="admin-add-email-button"
                style={[styles.addButton, adding && { opacity: 0.6 }]}
                onPress={handleAddRecipient}
                disabled={adding}
              >
                {adding ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Ionicons name="add" size={22} color="#fff" />
                )}
              </TouchableOpacity>
            </View>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            {loading ? (
              <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.md }} />
            ) : (
              recipients.map((r) => (
                <View
                  key={r.id}
                  style={styles.recipientCard}
                  testID={`recipient-card-${r.id}`}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.recipientEmail} numberOfLines={1}>
                      {r.email}
                    </Text>
                    <Text
                      style={[
                        styles.recipientStatus,
                        { color: r.active ? colors.primary : colors.textSecondary },
                      ]}
                    >
                      {r.active ? "Ativo" : "Inativo"}
                    </Text>
                  </View>
                  <TouchableOpacity
                    testID={`recipient-toggle-${r.id}`}
                    onPress={() => handleToggle(r.id)}
                    style={styles.miniButton}
                  >
                    <Ionicons
                      name={r.active ? "pause-circle-outline" : "play-circle-outline"}
                      size={20}
                      color={colors.textPrimary}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    testID={`recipient-delete-${r.id}`}
                    onPress={() => handleDelete(r.id, r.email)}
                    style={styles.miniButton}
                  >
                    <Ionicons name="trash-outline" size={18} color={colors.error} />
                  </TouchableOpacity>
                </View>
              ))
            )}
            {!loading && recipients.length === 0 ? (
              <Text style={styles.emptyText}>Sem destinatários configurados.</Text>
            ) : null}
          </>
        ) : (
          <>
            <Text style={styles.sectionDesc}>
              Todos os reportes submetidos por utilizadores.
            </Text>
            {loading ? (
              <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.md }} />
            ) : (
              reports.map((r) => (
                <View
                  key={r.id}
                  style={styles.reportCard}
                  testID={`admin-report-card-${r.id}`}
                >
                  <View style={styles.reportTop}>
                    <Text style={styles.reportLocal} numberOfLines={1}>
                      {r.local}
                      {r.sala ? ` • Sala ${r.sala}` : ""}
                    </Text>
                    <Text style={styles.reportDate}>{formatDate(r.created_at)}</Text>
                  </View>
                  <Text style={styles.reportMeta}>
                    {(r.nome || r.user_email)} •{" "}
                    {(r.tipo || r.user_type) === "professor" ? "Professor" : "Aluno"}
                    {r.nome ? `  ·  ${r.user_email}` : ""}
                  </Text>
                  <Text style={styles.reportDesc}>{r.descricao}</Text>
                  {r.info_adicional ? (
                    <Text style={styles.reportExtra}>{r.info_adicional}</Text>
                  ) : null}
                  <View style={styles.reportFooter}>
                    {r.email_sent ? (
                      <View style={styles.badgeSent}>
                        <Text style={styles.badgeSentText}>Email enviado</Text>
                      </View>
                    ) : (
                      <View style={styles.badgePending}>
                        <Text style={styles.badgePendingText}>Email pendente</Text>
                      </View>
                    )}
                  </View>
                </View>
              ))
            )}
            {!loading && reports.length === 0 ? (
              <Text style={styles.emptyText}>Sem reportes submetidos.</Text>
            ) : null}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLabel: { fontSize: 12, color: colors.textSecondary, letterSpacing: 0.5 },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.textPrimary,
    marginTop: 2,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  tabs: {
    flexDirection: "row",
    marginHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: radius.sm,
  },
  tabActive: { backgroundColor: colors.background },
  tabText: { fontSize: 13, fontWeight: "600", color: colors.textSecondary },
  tabTextActive: { color: colors.primary },
  body: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
  },
  sectionDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    lineHeight: 18,
  },
  addBlock: { flexDirection: "row", gap: spacing.sm, alignItems: "center" },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: 14,
    color: colors.textPrimary,
  },
  addButton: {
    width: 46,
    height: 46,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  errorText: { color: colors.error, fontSize: 12, marginTop: 6 },
  recipientCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    marginTop: spacing.sm,
    gap: 4,
  },
  recipientEmail: { fontSize: 14, color: colors.textPrimary, fontWeight: "500" },
  recipientStatus: { fontSize: 11, marginTop: 2, fontWeight: "600" },
  miniButton: { padding: 6 },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 13,
    textAlign: "center",
    marginTop: spacing.lg,
  },
  reportCard: {
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    marginTop: spacing.sm,
  },
  reportTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  reportLocal: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.textPrimary,
    flex: 1,
    marginRight: 8,
  },
  reportDate: { fontSize: 10, color: colors.textSecondary },
  reportMeta: {
    fontSize: 11,
    color: colors.primary,
    marginTop: 4,
    fontWeight: "600",
  },
  reportDesc: {
    fontSize: 13,
    color: colors.textPrimary,
    marginTop: spacing.sm,
    lineHeight: 18,
  },
  reportExtra: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
    fontStyle: "italic",
  },
  reportFooter: {
    flexDirection: "row",
    marginTop: spacing.sm,
  },
  badgeSent: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: colors.primaryLight,
  },
  badgeSentText: { fontSize: 10, color: colors.primary, fontWeight: "700" },
  badgePending: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: "#FEF3C7",
  },
  badgePendingText: { fontSize: 10, color: "#92400E", fontWeight: "700" },
});
