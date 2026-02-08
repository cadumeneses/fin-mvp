import { useNavigation, useRoute } from "@react-navigation/native";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Screen } from "../components/Screen";
import { TransactionForm } from "../components/TransactionForm";
import { getTransactionById, updateTransaction } from "../repositories/transactions";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { typography } from "../theme/typography";

type RouteParams = {
  id: number;
};

export function EditTransactionScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { id } = route.params as RouteParams;
  const [initial, setInitial] = useState<{
    id: number;
    title: string;
    amount: number;
    type: "income" | "expense";
    date: string;
    categoryId: number | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    getTransactionById(id).then((data) => {
      if (!mounted) {
        return;
      }
      if (!data) {
        navigation.goBack();
        return;
      }
      setInitial({
        id: data.id,
        title: data.title,
        amount: data.amount,
        type: data.type,
        date: data.date,
        categoryId: data.categoryId,
      });
      setLoading(false);
    });
    return () => {
      mounted = false;
    };
  }, [id, navigation]);

  const onSave = useCallback(
    async (values: {
      title: string;
      amount: number;
      type: "income" | "expense";
      date: string;
      categoryId: number | null;
      fieldValues: { fieldId: number; value: string }[];
    }) => {
      await updateTransaction(id, values);
      navigation.goBack();
    },
    [id, navigation]
  );

  return (
    <Screen withTopInset={false}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.container}>
          <Text style={styles.title}>Editar transacao</Text>
          <Text style={styles.subtitle}>Atualize os dados abaixo.</Text>
        </View>
        {loading ? (
          <View style={styles.loading}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : (
          <TransactionForm
            submitLabel="Salvar alteracoes"
            onSubmit={onSave}
            initial={initial}
          />
        )}
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    paddingHorizontal: spacing.lg,
  },
  title: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.lg,
    fontWeight: "600",
    color: colors.text,
  },
  subtitle: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.sm,
    color: colors.muted,
    marginTop: spacing.xs,
  },
  loading: {
    paddingTop: spacing.xxl,
    alignItems: "center",
  },
});
