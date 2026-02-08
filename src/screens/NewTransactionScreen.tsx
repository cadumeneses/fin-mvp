import { useNavigation } from "@react-navigation/native";
import { useCallback } from "react";
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from "react-native";
import { Screen } from "../components/Screen";
import { TransactionForm } from "../components/TransactionForm";
import { insertTransaction } from "../repositories/transactions";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { typography } from "../theme/typography";

export function NewTransactionScreen() {
  const navigation = useNavigation();
  const onSave = useCallback(
    async (values: {
      title: string;
      amount: number;
      type: "income" | "expense";
      date: string;
      categoryId: number | null;
      fieldValues: { fieldId: number; value: string }[];
    }) => {
      await insertTransaction(values);
      navigation.goBack();
    },
    [navigation]
  );

  return (
    <Screen withTopInset={false}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.container}>
          <Text style={styles.title}>Nova transacao</Text>
          <Text style={styles.subtitle}>Preencha os dados abaixo.</Text>
        </View>
        <TransactionForm submitLabel="Salvar transacao" onSubmit={onSave} />
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
});
