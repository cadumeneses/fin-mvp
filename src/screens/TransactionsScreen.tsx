import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useCallback, useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Screen } from "../components/Screen";
import { SectionHeader } from "../components/SectionHeader";
import { StatCard } from "../components/StatCard";
import { TransactionRow } from "../components/TransactionRow";
import { Fab } from "../components/Fab";
import { CategoryIcon } from "../components/CategoryIcon";
import { listCategories, Category } from "../repositories/categories";
import {
  deleteTransaction,
  insertTransaction,
  listTransactionsFiltered,
  TransactionListItem,
} from "../repositories/transactions";
import { getMonthRange, getMonthlyStats } from "../repositories/stats";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { typography } from "../theme/typography";
import { formatCurrency, formatMonthLabel, formatShortDate } from "../utils/format";

export function TransactionsScreen() {
  const navigation = useNavigation();
  const [transactions, setTransactions] = useState<TransactionListItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [monthOffset, setMonthOffset] = useState(0);
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [typeFilter, setTypeFilter] = useState<"all" | "income" | "expense">(
    "all"
  );
  const [stats, setStats] = useState({ income: 0, expense: 0 });

  const monthDate = useMemo(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
  }, [monthOffset]);

  const canGoNext = monthOffset < 0;

  const dateRange = useMemo(() => {
    const { start, end } = getMonthRange(monthDate);
    return { start: start.toISOString(), end: end.toISOString() };
  }, [monthDate]);

  const loadData = useCallback(async () => {
    const [items, cats, monthlyStats] = await Promise.all([
      listTransactionsFiltered({
        startDate: dateRange.start,
        endDate: dateRange.end,
        categoryId,
        type: typeFilter === "all" ? null : typeFilter,
      }),
      listCategories(),
      getMonthlyStats(monthDate),
    ]);
    setTransactions(items);
    setCategories(cats);
    setStats({ income: monthlyStats.income, expense: monthlyStats.expense });
  }, [categoryId, dateRange.end, dateRange.start, monthDate, typeFilter]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleRowLongPress = useCallback(
    (item: TransactionListItem) => {
      Alert.alert(
        "Transacao",
        "O que voce deseja fazer?",
        [
          {
            text: "Editar",
            onPress: () =>
              navigation.navigate("EditTransaction" as never, { id: item.id } as never),
          },
          {
            text: "Duplicar",
            onPress: async () => {
              await insertTransaction({
                title: item.title,
                amount: item.amount,
                type: item.type,
                date: new Date().toISOString(),
                categoryId: item.categoryId,
              });
              loadData();
            },
          },
          {
            text: "Excluir",
            style: "destructive",
            onPress: async () => {
              await deleteTransaction(item.id);
              loadData();
            },
          },
          { text: "Cancelar", style: "cancel" },
        ]
      );
    },
    [loadData, navigation]
  );

  return (
    <Screen withTopInset={false}>
      <FlatList
        data={transactions}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.container}
        ListHeaderComponent={
          <View>
            <SectionHeader title="Transacoes" />
            <View style={styles.filters}>
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
                  <Text
                    style={[styles.monthAction, !canGoNext && styles.monthActionDisabled]}
                  >
                    {">"}
                  </Text>
                </Pressable>
              </View>
              <View style={styles.typeRow}>
                {[
                  { key: "all", label: "Tudo" },
                  { key: "income", label: "Receitas" },
                  { key: "expense", label: "Despesas" },
                ].map((option) => {
                  const selected = option.key === typeFilter;
                  return (
                    <Pressable
                      key={option.key}
                      style={[styles.typeChip, selected && styles.typeChipSelected]}
                      onPress={() =>
                        setTypeFilter(option.key as "all" | "income" | "expense")
                      }
                    >
                      <Text
                        style={[
                          styles.typeChipText,
                          selected && styles.typeChipTextSelected,
                        ]}
                      >
                        {option.label}
                      </Text>
                    </Pressable>
                  );
                })}
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
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.categoryRow}>
                  <Pressable
                    style={[
                      styles.categoryChip,
                      categoryId === null && styles.categoryChipSelected,
                    ]}
                    onPress={() => setCategoryId(null)}
                  >
                    <Text
                      style={[
                        styles.categoryChipText,
                        categoryId === null && styles.categoryChipTextSelected,
                      ]}
                    >
                      Todas
                    </Text>
                  </Pressable>
                  {categories.map((category) => {
                    const selected = category.id === categoryId;
                    return (
                      <Pressable
                        key={category.id}
                        style={[
                          styles.categoryChip,
                          selected && styles.categoryChipSelected,
                        ]}
                        onPress={() => setCategoryId(category.id)}
                      >
                        <View style={styles.categoryChipContent}>
                          <View style={styles.categoryChipIcon}>
                            <CategoryIcon
                              name={category.icon}
                              size={16}
                              color={selected ? colors.card : colors.text}
                            />
                          </View>
                          <Text
                            style={[
                              styles.categoryChipText,
                              selected && styles.categoryChipTextSelected,
                            ]}
                          >
                            {category.name}
                          </Text>
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              </ScrollView>
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <TransactionRow
            title={item.title}
            category={item.category ?? "Sem categoria"}
            icon={item.icon ?? "help-circle-outline"}
            date={formatShortDate(item.date)}
            amount={`${item.type === "income" ? "+" : "-"} ${formatCurrency(
              item.amount
            )}`}
            type={item.type}
            onPress={() =>
              navigation.navigate("EditTransaction" as never, { id: item.id } as never)
            }
            onLongPress={() => handleRowLongPress(item)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>Sem transacoes ainda</Text>
            <Text style={styles.emptySubtitle}>
              Adicione uma transacao para ver o historico.
            </Text>
          </View>
        }
      />
      <Fab onPress={() => navigation.navigate("NewTransaction" as never)} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  filters: {
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  monthRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
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
  typeRow: {
    flexDirection: "row",
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  typeChip: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: spacing.xs,
    alignItems: "center",
    backgroundColor: colors.card,
  },
  typeChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  typeChipText: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.sm,
    color: colors.text,
  },
  typeChipTextSelected: {
    color: colors.card,
  },
  statsRow: {
    flexDirection: "row",
    marginBottom: spacing.sm,
  },
  statsGap: {
    width: spacing.sm,
  },
  categoryRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  categoryChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.card,
    marginRight: spacing.sm,
  },
  categoryChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryChipText: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.sm,
    color: colors.text,
  },
  categoryChipTextSelected: {
    color: colors.card,
  },
  categoryChipContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  categoryChipIcon: {
    marginRight: spacing.xs,
  },
  empty: {
    paddingTop: spacing.xxl,
    alignItems: "center",
  },
  emptyTitle: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.lg,
    fontWeight: "600",
    color: colors.text,
  },
  emptySubtitle: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.sm,
    color: colors.muted,
    marginTop: spacing.xs,
  },
});
