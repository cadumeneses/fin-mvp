import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useCallback, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { BalanceCard } from "../components/BalanceCard";
import { Fab } from "../components/Fab";
import { Screen } from "../components/Screen";
import { SectionHeader } from "../components/SectionHeader";
import { StatCard } from "../components/StatCard";
import { TopCategoryRow } from "../components/TopCategoryRow";
import { getMonthlyStats } from "../repositories/stats";
import { loadProfileData } from "../storage/profile";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { typography } from "../theme/typography";
import { formatCurrency, formatMonthLabel } from "../utils/format";

type HomeStats = {
  income: number;
  expense: number;
  balance: number;
  topCategories: { name: string; icon: string; total: number }[];
};

export function HomeScreen() {
  const navigation = useNavigation();
  const [monthOffset, setMonthOffset] = useState(0);
  const [userName, setUserName] = useState("Camila");
  const [stats, setStats] = useState<HomeStats>({
    income: 0,
    expense: 0,
    balance: 0,
    topCategories: [],
  });

  const monthDate = useMemo(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
  }, [monthOffset]);

  const canGoNext = monthOffset < 0;

  const loadData = useCallback(async () => {
    const monthlyStats = await getMonthlyStats(monthDate);
    setStats({
      income: monthlyStats.income,
      expense: monthlyStats.expense,
      balance: monthlyStats.balance,
      topCategories: monthlyStats.topCategories,
    });
  }, [monthDate]);

  const loadProfile = useCallback(async () => {
    try {
      const data = await loadProfileData();
      if (data?.name) setUserName(data.name);
    } catch {
      setUserName("Camila");
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
      loadProfile();
    }, [loadData, loadProfile])
  );

  return (
    <Screen withTopInset={false}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.greeting}>Ola, {userName}</Text>
        <Text style={styles.subtitle}>Visao geral do mes</Text>

        <View style={styles.monthRow}>
          <Pressable
            style={styles.monthButton}
            onPress={() => setMonthOffset((prev) => prev - 1)}
          >
            <Text style={styles.monthAction}>{"<"}</Text>
          </Pressable>
          <View style={styles.monthCenter}>
            <Text style={styles.monthLabel}>{formatMonthLabel(monthDate)}</Text>
            {monthOffset !== 0 ? (
              <Pressable
                onPress={() => setMonthOffset(0)}
                style={styles.monthReset}
              >
                <Text style={styles.monthResetText}>Hoje</Text>
              </Pressable>
            ) : null}
          </View>
          <Pressable
            style={[styles.monthButton, !canGoNext && styles.monthButtonDisabled]}
            onPress={() =>
              setMonthOffset((prev) => (canGoNext ? prev + 1 : prev))
            }
          >
            <Text style={[styles.monthAction, !canGoNext && styles.monthActionDisabled]}>
              {">"}
            </Text>
          </Pressable>
        </View>

        <View style={styles.section}>
          <BalanceCard
            title="Saldo do mês"
            value={formatCurrency(stats.balance)}
            subtitle="Total de receitas menos despesas"
          />
        </View>

        <View style={styles.statsRow}>
          <StatCard
            label="Receitas"
            value={formatCurrency(stats.income)}
            tone="income"
          />
          <View style={styles.statsGap} />
          <StatCard
            label="Despesas"
            value={formatCurrency(stats.expense)}
            tone="expense"
          />
        </View>

        <View style={styles.listHeader}>
          <SectionHeader title="Top categorias" />
        </View>
        {stats.topCategories.length === 0 ? (
          <Text style={styles.emptySubtitle}>Sem dados no mes.</Text>
        ) : (
          stats.topCategories.map((category) => (
            <TopCategoryRow
              key={category.name}
              icon={category.icon}
              name={category.name}
              total={formatCurrency(category.total)}
            />
          ))
        )}
      </ScrollView>
      <Fab onPress={() => navigation.navigate("NewTransaction" as never)} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xxl,
  },
  greeting: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.xl,
    fontWeight: "700",
    color: colors.text,
    marginTop: spacing.md,
  },
  subtitle: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.sm,
    color: colors.muted,
    marginTop: spacing.xs,
  },
  monthRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing.md,
  },
  monthButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  monthButtonDisabled: {
    opacity: 0.4,
  },
  monthCenter: {
    alignItems: "center",
  },
  monthLabel: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.md,
    color: colors.text,
    fontWeight: "600",
  },
  monthAction: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.lg,
    color: colors.primary,
  },
  monthActionDisabled: {
    color: colors.muted,
  },
  monthReset: {
    marginTop: 2,
  },
  monthResetText: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.sm,
    color: colors.muted,
  },
  section: {
    marginTop: spacing.lg,
  },
  statsRow: {
    flexDirection: "row",
    marginTop: spacing.md,
  },
  statsGap: {
    width: spacing.md,
  },
  emptySubtitle: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.sm,
    color: colors.muted,
    marginTop: spacing.xs,
  },
  listHeader: {
    marginTop: spacing.lg,
  },
});
