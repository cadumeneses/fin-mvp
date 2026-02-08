import { StyleSheet, Text, View } from "react-native";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { typography } from "../theme/typography";

type StatCardProps = {
  label: string;
  value: string;
  tone?: "neutral" | "income" | "expense";
};

const toneColor = {
  neutral: colors.text,
  income: colors.income,
  expense: colors.expense,
};

export function StatCard({ label, value, tone = "neutral" }: StatCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, { color: toneColor[tone] }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  label: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.sm,
    color: colors.muted,
  },
  value: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.lg,
    fontWeight: "600",
    marginTop: spacing.xs,
  },
});
