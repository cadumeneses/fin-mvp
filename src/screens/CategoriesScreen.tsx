import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useCallback, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { CategoryRow } from "../components/CategoryRow";
import { Fab } from "../components/Fab";
import { Screen } from "../components/Screen";
import { SectionHeader } from "../components/SectionHeader";
import {
  Category,
  deleteCategory,
  listCategories,
} from "../repositories/categories";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { typography } from "../theme/typography";

export function CategoriesScreen() {
  const navigation = useNavigation();
  const [categories, setCategories] = useState<Category[]>([]);

  const loadData = useCallback(async () => {
    const items = await listCategories();
    setCategories(items);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const startEdit = useCallback((category: Category) => {
    navigation.navigate("CategoryForm" as never, { id: category.id } as never);
  }, [navigation]);

  const openInsights = useCallback((category: Category) => {
    navigation.navigate("CategoryInsights" as never, { id: category.id } as never);
  }, [navigation]);

  const onDelete = useCallback(
    (id: number) => {
      Alert.alert("Excluir categoria?", "Essa acao nao pode ser desfeita.", [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            await deleteCategory(id);
            if (editingId === id) {
              resetForm();
            }
            loadData();
          },
        },
      ]);
    },
    [loadData]
  );

  return (
    <Screen withTopInset={false}>
      <ScrollView contentContainerStyle={styles.container}>
        <SectionHeader title="Categorias" />
        <Text style={styles.listTitle}>Lista de categorias</Text>
        {categories.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>Sem categorias</Text>
            <Text style={styles.emptySubtitle}>
              Crie a primeira categoria.
            </Text>
          </View>
        ) : (
          categories.map((category) => (
            <CategoryRow
              key={category.id}
              name={category.name}
              icon={category.icon}
              type={category.type}
              onView={() => openInsights(category)}
              onEdit={() => startEdit(category)}
              onDelete={() => onDelete(category.id)}
            />
          ))
        )}
      </ScrollView>
      <Fab onPress={() => navigation.navigate("CategoryForm" as never)} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
  },
  listTitle: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.md,
    fontWeight: "600",
    color: colors.text,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  empty: {
    paddingVertical: spacing.xl,
    alignItems: "center",
  },
  emptyTitle: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.md,
    fontWeight: "600",
    color: colors.text,
  },
  emptySubtitle: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.sm,
    color: colors.muted,
    marginTop: spacing.xs,
    textAlign: "center",
  },
});
