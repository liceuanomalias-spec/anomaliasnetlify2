import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth, API_BASE } from "@/src/auth/AuthContext";
import { colors, spacing, radius } from "@/src/theme";

type Report = {
  id: string;
  local: string;
  sala?: string | null;
  descricao: string;
  info_adicional?: string | null;
  user_type: string;
  nome?: string | null;
  tipo?: string | null;
  created_at: string;
  email_sent?: boolean;
};

export default function HomeScreen() {
  const router = useRouter();
  const { user, token, logout } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchReports = useCallback(async (showSpinner = true) => {
    if (!token) return;
    if (showSpinner) setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/reports/mine`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setReports(data.reports || []);
      }
    } catch (e) {
      // ignore
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      fetchReports();
    }, [fetchReports])
  );

  const handleLogout = () => {
    const doLogout = async () => {
      await logout();
      router.replace("/");
    };
    if (Platform.OS === "web") {
      // eslint-disable-next-line no-alert
      if (typeof window !== "undefined" && window.confirm("Terminar sessão?")) {
        doLogout();
      }
    } else {
      Alert.alert("Terminar sessão", "Tem a certeza que deseja sair?", [
        { text: "Cancelar", style: "cancel" },
        { text: "Sair", style: "destructive", onPress: doLogout },
      ]);
    }
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

  const renderItem = ({ item }: { item: Report }) => (
    <View style={styles.reportCard} testID={`report-item-${item.id}`}>
      <View style={styles.reportHeader}>
        <View style={styles.reportIcon}>
          <Ionicons name="alert-circle-outline" size={18} color={colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.reportLocal} numberOfLines={1}>
            {item.local}
            {item.sala ? ` • Sala ${item.sala}` : ""}
          </Text>
          <Text style={styles.reportDate}>{formatDate(item.created_at)}</Text>
        </View>
        {item.email_sent ? (
          <View style={styles.badgeSent}>
            <Text style={styles.badgeSentText}>Enviado</Text>
          </View>
        ) : (
          <View style={styles.badgePending}>
            <Text style={styles.badgePendingText}>Pendente</Text>
          </View>
        )}
      </View>
      <Text style={styles.reportDesc} numberOfLines={2}>
        {item.descricao}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.greeting}>Olá,</Text>
          <Text style={styles.userEmail} numberOfLines={1} testID="home-user-email">
            {user?.email}
          </Text>
          <Text style={styles.userTypeLabel}>
            {user?.user_type === "professor" ? "Professor" : "Aluno"}
          </Text>
        </View>
      </View>
      <TouchableOpacity
        testID="home-logout-button"
        style={styles.logoutButton}
        onPress={handleLogout}
        activeOpacity={0.7}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons name="log-out-outline" size={16} color={colors.error} />
        <Text style={styles.logoutText}>Sair</Text>
      </TouchableOpacity>

      <View style={styles.statBlock}>
        <Text style={styles.statValue}>{reports.length}</Text>
        <Text style={styles.statLabel}>
          Relato{reports.length === 1 ? "" : "s"} submetido{reports.length === 1 ? "" : "s"}
        </Text>
      </View>

      <TouchableOpacity
        testID="home-new-report-button"
        style={styles.newButton}
        onPress={() => router.push("/report")}
        activeOpacity={0.85}
      >
        <Ionicons name="add-circle" size={20} color="#fff" />
        <Text style={styles.newButtonText}>Novo Relato</Text>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Histórico</Text>

      {loading && reports.length === 0 ? (
        <View style={styles.emptyBlock}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : reports.length === 0 ? (
        <View style={styles.emptyBlock}>
          <Ionicons
            name="document-text-outline"
            size={36}
            color={colors.textSecondary}
          />
          <Text style={styles.emptyText}>Ainda não submeteu relatos</Text>
        </View>
      ) : (
        <FlatList
          data={reports}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: spacing.xl }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchReports(false);
              }}
              tintColor={colors.primary}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "flex-start",
    marginTop: spacing.md,
    paddingRight: 80,
  },
  headerLeft: {
    flex: 1,
    minWidth: 0,
  },
  greeting: { color: colors.textSecondary, fontSize: 13 },
  userEmail: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.textPrimary,
    marginTop: 2,
  },
  userTypeLabel: {
    fontSize: 12,
    color: colors.primary,
    marginTop: 2,
    fontWeight: "600",
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  logoutButton: {
    position: "absolute",
    top: spacing.md + 8,
    right: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.error,
    backgroundColor: "#FEF2F2",
    zIndex: 10,
  },
  logoutText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.error,
  },
  statBlock: {
    marginTop: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
  },
  statValue: {
    fontSize: 32,
    fontWeight: "700",
    color: colors.textPrimary,
    letterSpacing: -1,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  newButton: {
    marginTop: spacing.lg,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  newButtonText: { color: "#fff", fontSize: 15, fontWeight: "600" },
  sectionTitle: {
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    fontSize: 13,
    fontWeight: "700",
    color: colors.textSecondary,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  reportCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    backgroundColor: colors.background,
  },
  reportHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  reportIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  reportLocal: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  reportDate: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  reportDesc: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    lineHeight: 18,
  },
  badgeSent: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: colors.primaryLight,
  },
  badgeSentText: {
    fontSize: 10,
    color: colors.primary,
    fontWeight: "700",
  },
  badgePending: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: "#FEF3C7",
  },
  badgePendingText: { fontSize: 10, color: "#92400E", fontWeight: "700" },
  emptyBlock: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: spacing.xl,
  },
  emptyText: { color: colors.textSecondary, fontSize: 13 },
});
