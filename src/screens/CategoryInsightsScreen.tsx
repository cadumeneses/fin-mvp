import { useFocusEffect, useNavigation, useRoute } from "@react-navigation/native";
import { useCallback, useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { CategoryIcon } from "../components/CategoryIcon";
import { Screen } from "../components/Screen";
import { SectionHeader } from "../components/SectionHeader";
import { StatCard } from "../components/StatCard";
import { TransactionRow } from "../components/TransactionRow";
import { CategoryMetric, listCategoryMetrics } from "../repositories/categoryMetrics";
import { CategoryField, listFieldsByCategory } from "../repositories/categoryFields";
import { getCategoryById } from "../repositories/categories";
import {
  listTransactionsWithFieldsByCategory,
  TransactionWithFields,
} from "../repositories/transactions";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { typography } from "../theme/typography";
import { formatCurrency, formatShortDate } from "../utils/format";

type RouteParams = {
  id: number;
};

type SummaryMetrics = {
  totalAmount: number;
  averageAmount: number | null;
  transactionCount: number;
  totalKm: number;
  totalLiters: number;
  fuelAmount: number;
  avgConsumption: number | null;
  avgCostPerKm: number | null;
  avgPricePerLiter: number | null;
};

const FIELD_ALIASES = {
  kmCurrent: ["kmatual", "kmfinal", "kmfim", "kmdepois"],
  kmPrevious: ["kmanterior", "kminicial", "kminicio", "kmantes"],
  liters: ["litros", "litro", "lt", "l"],
  price: ["precolitro", "preco", "valorlitro", "valorgasolina", "gasolina"],
};

export function CategoryInsightsScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { id } = route.params as RouteParams;

  const [categoryName, setCategoryName] = useState("");
  const [categoryIcon, setCategoryIcon] = useState("");
  const [categoryType, setCategoryType] = useState<"income" | "expense">("expense");
  const [transactions, setTransactions] = useState<TransactionWithFields[]>([]);
  const [metrics, setMetrics] = useState<CategoryMetric[]>([]);
  const [fields, setFields] = useState<CategoryField[]>([]);

  const loadData = useCallback(async () => {
    const category = await getCategoryById(id);
    if (!category) {
      navigation.goBack();
      return;
    }
    const [items, categoryMetrics, categoryFields] = await Promise.all([
      listTransactionsWithFieldsByCategory(id),
      listCategoryMetrics(id),
      listFieldsByCategory(id),
    ]);
    setCategoryName(category.name);
    setCategoryIcon(category.icon);
    setCategoryType(category.type);
    setTransactions(items);
    setMetrics(categoryMetrics);
    setFields(categoryFields);
  }, [id, navigation]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const summary = useMemo(() => {
    let totalAmount = 0;
    let totalKm = 0;
    let totalLiters = 0;
    let fuelAmount = 0;
    const transactionCount = transactions.length;

    for (const item of transactions) {
      totalAmount += item.amount;

      const kmCurrent = getFieldNumber(item.fieldValues, FIELD_ALIASES.kmCurrent);
      const kmPrevious = getFieldNumber(item.fieldValues, FIELD_ALIASES.kmPrevious);
      const liters = getFieldNumber(item.fieldValues, FIELD_ALIASES.liters);

      if (liters && liters > 0) {
        fuelAmount += item.amount;
        totalLiters += liters;
      }

      if (
        kmCurrent !== null &&
        kmPrevious !== null &&
        kmCurrent > kmPrevious &&
        liters !== null &&
        liters > 0
      ) {
        totalKm += kmCurrent - kmPrevious;
      }
    }

    const avgConsumption = totalKm > 0 && totalLiters > 0
      ? totalKm / totalLiters
      : null;
    const avgCostPerKm = totalKm > 0 ? totalAmount / totalKm : null;
    const avgPricePerLiter = totalLiters > 0 ? fuelAmount / totalLiters : null;
    const averageAmount = transactionCount > 0 ? totalAmount / transactionCount : null;

    return {
      totalAmount,
      averageAmount,
      transactionCount,
      totalKm,
      totalLiters,
      fuelAmount,
      avgConsumption,
      avgCostPerKm,
      avgPricePerLiter,
    } as SummaryMetrics;
  }, [transactions]);

  const fieldNames = useMemo(
    () => fields.map((field) => field.name),
    [fields]
  );

  const numericFieldStats = useMemo(() => {
    const stats = new Map<string, number[]>();
    for (const item of transactions) {
      for (const field of item.fieldValues) {
        const value = parseFieldNumber(field.value);
        if (value === null) {
          continue;
        }
        const list = stats.get(field.name) ?? [];
        list.push(value);
        stats.set(field.name, list);
      }
    }

    return Array.from(stats.entries())
      .map(([name, values]) => {
        const total = values.reduce((acc, val) => acc + val, 0);
        const average = values.length > 0 ? total / values.length : 0;
        const max = Math.max(...values);
        const min = Math.min(...values);
        return { name, total, average, max, min, count: values.length };
      })
      .sort((a, b) => b.count - a.count);
  }, [transactions]);

  const showCarInsights =
    summary.totalKm > 0 || summary.totalLiters > 0 || summary.avgConsumption !== null;

  const customMetricCards = useMemo(() => {
    if (metrics.length === 0) {
      return [];
    }
    return metrics.map((metric) => {
      const values: number[] = [];
      for (const item of transactions) {
        const computed = evaluateMetric(metric.formula, item);
        if (computed === null) {
          continue;
        }
        values.push(computed);
      }
      const lastValue = values.length > 0 ? values[0] : null;
      const average = values.length > 0
        ? values.reduce((acc, val) => acc + val, 0) / values.length
        : null;
      const total = values.length > 0
        ? values.reduce((acc, val) => acc + val, 0)
        : null;
      return {
        id: metric.id,
        name: metric.name,
        unit: metric.unit,
        aggregate: metric.aggregate,
        lastValue,
        average,
        total,
      };
    });
  }, [metrics, transactions]);

  return (
    <Screen withTopInset={false}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            {categoryIcon ? (
              <CategoryIcon name={categoryIcon} size={22} color={colors.text} />
            ) : null}
          </View>
          <View>
            <Text style={styles.title}>{categoryName || "Resumo da categoria"}</Text>
            <Text style={styles.subtitle}>Insights com base nos seus lancamentos.</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <StatCard
            label={categoryType === "income" ? "Total recebido" : "Total"}
            value={formatCurrency(summary.totalAmount)}
          />
          <View style={styles.statsGap} />
          <StatCard
            label={categoryType === "income" ? "Receita media" : "Ticket medio"}
            value={
              summary.averageAmount !== null
                ? formatCurrency(summary.averageAmount)
                : "--"
            }
          />
        </View>
        <View style={styles.statsRow}>
          <StatCard label="Lancamentos" value={String(summary.transactionCount)} />
          <View style={styles.statsGap} />
          <StatCard
            label={categoryType === "income" ? "Ultimo recebimento" : "Ultima compra"}
            value={
              transactions.length > 0
                ? formatShortDate(transactions[0].date)
                : "--"
            }
          />
        </View>

        {showCarInsights ? (
          <View style={styles.section}>
            <SectionHeader title="Consumo e custos" />
            <View style={styles.statsRow}>
              <StatCard
                label="Consumo medio"
                value={
                  summary.avgConsumption !== null
                    ? `${formatDecimal(summary.avgConsumption)} km/L`
                    : "--"
                }
              />
              <View style={styles.statsGap} />
              <StatCard
                label="Custo por km"
                value={
                  summary.avgCostPerKm !== null
                    ? `${formatCurrency(summary.avgCostPerKm)} / km`
                    : "--"
                }
              />
            </View>
            <View style={styles.statsRow}>
              <StatCard
                label="Preco medio/L"
                value={
                  summary.avgPricePerLiter !== null
                    ? formatCurrency(summary.avgPricePerLiter)
                    : "--"
                }
              />
              <View style={styles.statsGap} />
              <StatCard
                label="Km no periodo"
                value={summary.totalKm > 0 ? formatDecimal(summary.totalKm) : "--"}
              />
            </View>
          </View>
        ) : null}

        <View style={styles.section}>
          <SectionHeader title="Metricas personalizadas" />
          {customMetricCards.length === 0 ? (
            <Text style={styles.emptySubtitle}>Nenhuma metrica configurada.</Text>
          ) : (
            <View style={styles.fieldGrid}>
              {customMetricCards.map((metric) => (
                <View key={metric.id} style={styles.fieldCard}>
                  <Text style={styles.fieldTitle}>{metric.name}</Text>
                  <Text style={styles.fieldValue}>
                    {formatMetricValue(metric.aggregate, metric)}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.section}>
          <SectionHeader title="Campos personalizados" />
          {fieldNames.length === 0 ? (
            <Text style={styles.emptySubtitle}>Nenhum campo registrado ainda.</Text>
          ) : (
            <View style={styles.tagRow}>
              {fieldNames.map((name) => (
                <View key={name} style={styles.tag}>
                  <Text style={styles.tagText}>{name}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.section}>
          <SectionHeader title="Metricas dos campos" />
          {numericFieldStats.length === 0 ? (
            <Text style={styles.emptySubtitle}>Sem valores numericos ainda.</Text>
          ) : (
            <View style={styles.fieldGrid}>
              {numericFieldStats.map((stat) => (
                <View key={stat.name} style={styles.fieldCard}>
                  <Text style={styles.fieldTitle}>{stat.name}</Text>
                  <Text style={styles.fieldValue}>
                    Media: {formatDecimal(stat.average)}
                  </Text>
                  <Text style={styles.fieldValue}>
                    Total: {formatDecimal(stat.total)}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.section}>
          <SectionHeader title="Ultimos lancamentos" />
          {transactions.length === 0 ? (
            <Text style={styles.emptySubtitle}>Sem lancamentos nesta categoria.</Text>
          ) : (
            transactions.map((item) => (
              <TransactionRow
                key={item.id}
                title={item.title}
                category={categoryName || "Categoria"}
                icon={categoryIcon || "help-circle-outline"}
                date={formatShortDate(item.date)}
                amount={`${item.type === "income" ? "+" : "-"} ${formatCurrency(
                  item.amount
                )}`}
                type={item.type}
                onPress={() =>
                  navigation.navigate("EditTransaction" as never, { id: item.id } as never)
                }
              />
            ))
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}

function normalizeFieldName(name: string) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

function parseFieldNumber(value: string) {
  const sanitized = value.replace(/\s/g, "").replace(/\./g, "").replace(",", ".");
  const parsed = Number(sanitized.replace(/[^0-9.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function getFieldNumber(
  fields: { name: string; value: string }[],
  aliases: string[]
) {
  const normalized = new Map<string, string>();
  for (const field of fields) {
    normalized.set(normalizeFieldName(field.name), field.value);
  }
  for (const alias of aliases) {
    const value = normalized.get(alias);
    if (value !== undefined) {
      return parseFieldNumber(value);
    }
  }
  return null;
}

function formatDecimal(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value);
}

function evaluateMetric(formula: string, transaction: TransactionWithFields) {
  const variables: Record<string, number> = {};
  for (const field of transaction.fieldValues) {
    const key = normalizeFieldName(field.name);
    const parsed = parseFieldNumber(field.value);
    if (parsed !== null) {
      variables[key] = parsed;
    }
  }
  variables[normalizeFieldName("valor")] = transaction.amount;
  variables[normalizeFieldName("amount")] = transaction.amount;

  const normalizedFormula = formula.replace(/,/g, ".");
  const tokenRegex = /[A-Za-z_][A-Za-z0-9_]*/g;
  const substituted = normalizedFormula.replace(tokenRegex, (token) => {
    const key = normalizeFieldName(token);
    const value = variables[key];
    return value !== undefined ? String(value) : "NaN";
  });

  if (!/^[0-9+\-*/().\sNaN]+$/.test(substituted)) {
    return null;
  }

  try {
    const result = Function(`"use strict"; return (${substituted});`)();
    return Number.isFinite(result) ? result : null;
  } catch {
    return null;
  }
}

function formatMetricValue(
  aggregate: "avg" | "sum" | "last",
  metric: { lastValue: number | null; average: number | null; total: number | null; unit: string | null }
) {
  const value =
    aggregate === "sum"
      ? metric.total
      : aggregate === "last"
      ? metric.lastValue
      : metric.average;
  if (value === null) {
    return "--";
  }
  const formatted = formatDecimal(value);
  return metric.unit ? `${formatted} ${metric.unit}` : formatted;
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  title: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.lg,
    fontWeight: "700",
    color: colors.text,
  },
  subtitle: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.sm,
    color: colors.muted,
    marginTop: spacing.xs,
  },
  statsRow: {
    flexDirection: "row",
    marginTop: spacing.md,
  },
  statsGap: {
    width: spacing.md,
  },
  section: {
    marginTop: spacing.lg,
  },
  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  tag: {
    backgroundColor: colors.card,
    borderRadius: 12,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  tagText: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.sm,
    color: colors.text,
  },
  fieldGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  fieldCard: {
    width: "48%",
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: "4%",
    marginBottom: spacing.md,
  },
  fieldTitle: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.sm,
    color: colors.muted,
  },
  fieldValue: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.md,
    color: colors.text,
    marginTop: spacing.xs,
  },
  emptySubtitle: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.sm,
    color: colors.muted,
    marginTop: spacing.xs,
  },
});
