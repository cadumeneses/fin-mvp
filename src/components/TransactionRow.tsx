import { Pressable, StyleSheet, Text, View } from "react-native";
import { CategoryIcon } from "./CategoryIcon";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { typography } from "../theme/typography";

type TransactionRowProps = {
  title: string;
  category: string;
  icon: string;
  date: string;
  amount: string;
  type: "income" | "expense";
  onPress?: () => void;
  onLongPress?: () => void;
};

export function TransactionRow({
  title,
  category,
  icon,
  date,
  amount,
  type,
  onPress,
  onLongPress,
}: TransactionRowProps) {
  const amountColor = type === "income" ? colors.income : colors.expense;

  return (
    <Pressable style={styles.row} onPress={onPress} onLongPress={onLongPress}>
      <View style={styles.icon}>
        <CategoryIcon name={icon} size={20} color={colors.text} />
      </View>
      <View style={styles.info}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.meta}>
          {category} - {date}
        </Text>
      </View>
      <Text style={[styles.amount, { color: amountColor }]}>{amount}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  icon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  info: {
    flex: 1,
  },
  title: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.md,
    color: colors.text,
    fontWeight: "600",
  },
  meta: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.sm,
    color: colors.muted,
    marginTop: 2,
  },
  amount: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.md,
    fontWeight: "600",
  },
});
