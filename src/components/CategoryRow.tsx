import { Pressable, StyleSheet, Text, View } from "react-native";
import { CategoryIcon } from "./CategoryIcon";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { typography } from "../theme/typography";

type CategoryRowProps = {
  name: string;
  icon: string;
  type: "income" | "expense";
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

export function CategoryRow({
  name,
  icon,
  type,
  onView,
  onEdit,
  onDelete,
}: CategoryRowProps) {
  return (
    <View style={styles.row}>
      <View style={styles.icon}>
        <CategoryIcon name={icon} size={18} color={colors.text} />
      </View>
      <View style={styles.info}>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.type}>
          {type === "income" ? "Receita" : "Despesa"}
        </Text>
      </View>
      <Pressable onPress={onView} style={styles.action}>
        <Text style={styles.actionText}>Ver</Text>
      </Pressable>
      <Pressable onPress={onEdit} style={styles.action}>
        <Text style={styles.actionText}>Editar</Text>
      </Pressable>
      <Pressable onPress={onDelete} style={styles.action}>
        <Text style={[styles.actionText, styles.deleteText]}>Excluir</Text>
      </Pressable>
    </View>
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
    width: 40,
    height: 40,
    borderRadius: 10,
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
  name: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.md,
    color: colors.text,
    fontWeight: "600",
  },
  type: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.sm,
    color: colors.muted,
    marginTop: 2,
  },
  action: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  actionText: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.sm,
    color: colors.primary,
  },
  deleteText: {
    color: colors.expense,
  },
});
