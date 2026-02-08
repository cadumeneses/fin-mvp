import { StyleSheet, Text, View } from "react-native";
import { CategoryIcon } from "./CategoryIcon";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { typography } from "../theme/typography";

type TopCategoryRowProps = {
  icon: string;
  name: string;
  total: string;
};

export function TopCategoryRow({ icon, name, total }: TopCategoryRowProps) {
  return (
    <View style={styles.row}>
      <View style={styles.icon}>
        <CategoryIcon name={icon} size={16} color={colors.text} />
      </View>
      <Text style={styles.name}>{name}</Text>
      <Text style={styles.total}>{total}</Text>
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
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  name: {
    flex: 1,
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.md,
    color: colors.text,
    fontWeight: "600",
  },
  total: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.sm,
    color: colors.muted,
  },
});
