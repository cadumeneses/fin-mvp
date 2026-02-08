import { Pressable, StyleSheet, Text, View } from "react-native";
import { CategoryIcon } from "./CategoryIcon";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { typography } from "../theme/typography";

type IconPickerProps = {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
};

export function IconPicker({ label, value, options, onChange }: IconPickerProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.grid}>
        {options.map((option) => {
          const selected = option === value;
          return (
            <Pressable
              key={option}
              style={[styles.item, selected && styles.itemSelected]}
              onPress={() => onChange(option)}
            >
              <CategoryIcon
                name={option}
                size={20}
                color={selected ? colors.card : colors.text}
              />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.sm,
    color: colors.muted,
    marginBottom: spacing.xs,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  item: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  itemSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
});
