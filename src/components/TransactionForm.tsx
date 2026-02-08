import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { listCategories, Category } from "../repositories/categories";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { typography } from "../theme/typography";
import {
  formatCurrencyInput,
  formatDateInput,
  formatNumberInput,
  parseCurrencyInput,
} from "../utils/format";
import { CategoryIcon } from "./CategoryIcon";
import { PrimaryButton } from "./PrimaryButton";
import { SegmentedControl } from "./SegmentedControl";
import { TextField } from "./TextField";
import { listFieldsByCategory, CategoryField } from "../repositories/categoryFields";
import { listFieldValuesByTransaction } from "../repositories/transactionFieldValues";

type TransactionFormValues = {
  title: string;
  amount: number;
  type: "income" | "expense";
  date: string;
  categoryId: number | null;
  fieldValues: { fieldId: number; value: string }[];
};

type TransactionFormInitial = {
  id?: number;
  title: string;
  amount: number;
  type: "income" | "expense";
  date: string;
  categoryId: number | null;
};

type TransactionFormProps = {
  submitLabel: string;
  onSubmit: (values: TransactionFormValues) => Promise<void>;
  initial?: TransactionFormInitial | null;
};

export function TransactionForm({ submitLabel, onSubmit, initial }: TransactionFormProps) {
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [type, setType] = useState<"income" | "expense">("expense");
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoaded, setCategoriesLoaded] = useState(false);
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [fields, setFields] = useState<CategoryField[]>([]);
  const [fieldValues, setFieldValues] = useState<Record<number, string>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!initial) {
      return;
    }
    setTitle(initial.title);
    setAmount(formatNumberInput(initial.amount));
    setDate(initial.date.slice(0, 10));
    setType(initial.type);
    setCategoryId(initial.categoryId ?? null);
  }, [initial]);

  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      listCategories().then((items) => {
        if (mounted) {
          setCategories(items);
          setCategoriesLoaded(true);
        }
      });
      return () => {
        mounted = false;
      };
    }, [])
  );

  const filteredCategories = useMemo(
    () => categories.filter((category) => category.type === type),
    [categories, type]
  );

  useEffect(() => {
    if (!categoryId) {
      setFields([]);
      setFieldValues({});
      return;
    }
    let mounted = true;
    listFieldsByCategory(categoryId).then((items) => {
      if (!mounted) {
        return;
      }
      setFields(items);
      setFieldValues((prev) => {
        const next = { ...prev };
        for (const field of items) {
          if (next[field.id] === undefined) {
            next[field.id] = "";
          }
        }
        return next;
      });
    });
    return () => {
      mounted = false;
    };
  }, [categoryId]);

  useEffect(() => {
    if (!initial?.id) {
      return;
    }
    listFieldValuesByTransaction(initial.id).then((values) => {
      setFieldValues((prev) => {
        const next = { ...prev };
        for (const value of values) {
          next[value.fieldId] = value.value;
        }
        return next;
      });
    });
  }, [initial?.id]);

  useEffect(() => {
    if (!categoryId || !categoriesLoaded) {
      return;
    }
    const exists = filteredCategories.some((category) => category.id === categoryId);
    if (!exists) {
      setCategoryId(null);
    }
  }, [categoryId, categoriesLoaded, filteredCategories]);

  const handleSubmit = useCallback(async () => {
    setError(null);
    if (!title.trim()) {
      setError("Preencha titulo e valor.");
      return;
    }

    const numericAmount = parseCurrencyInput(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setError("Informe um valor valido.");
      return;
    }

    const parsedDate = new Date(date);
    if (Number.isNaN(parsedDate.getTime())) {
      setError("Informe uma data valida.");
      return;
    }

    const requiredMissing = fields.some(
      (field) => field.required && !fieldValues[field.id]?.trim()
    );
    if (requiredMissing) {
      setError("Preencha os campos obrigatorios.");
      return;
    }

    await onSubmit({
      title: title.trim(),
      amount: numericAmount,
      type,
      date: parsedDate.toISOString(),
      categoryId,
      fieldValues: Object.entries(fieldValues)
        .filter(([, value]) => value.trim().length > 0)
        .map(([fieldId, value]) => ({
          fieldId: Number(fieldId),
          value,
        })),
    });
  }, [amount, categoryId, date, fields, fieldValues, onSubmit, title, type]);

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <SegmentedControl
        label="Tipo"
        value={type}
        options={[
          { key: "expense", label: "Despesa" },
          { key: "income", label: "Receita" },
        ]}
        onChange={(value) => setType(value as "income" | "expense")}
      />

      <TextField label="Titulo" value={title} onChangeText={setTitle} />
      <TextField
        label="Valor"
        value={amount}
        onChangeText={(value) => setAmount(formatCurrencyInput(value))}
        keyboardType="numeric"
        placeholder="Ex: 120,50"
      />
      <TextField
        label="Data"
        value={date}
        onChangeText={(value) => setDate(formatDateInput(value))}
        placeholder="YYYY-MM-DD"
        keyboardType="numeric"
      />

      <View style={styles.categoryBlock}>
        <Text style={styles.categoryLabel}>Categoria</Text>
        <View style={styles.categoryGrid}>
          <View style={styles.categoryRow}>
            <Pressable
              style={[
                styles.categoryItem,
                categoryId === null && styles.categoryItemSelected,
              ]}
              onPress={() => setCategoryId(null)}
            >
              <Text
                style={[
                  styles.categoryText,
                  categoryId === null && styles.categoryTextSelected,
                ]}
              >
                Sem categoria
              </Text>
            </Pressable>
            {filteredCategories.map((category) => {
              const selected = category.id === categoryId;
              return (
                <Pressable
                  key={category.id}
                  style={[styles.categoryItem, selected && styles.categoryItemSelected]}
                  onPress={() => setCategoryId(category.id)}
                >
                  <View style={styles.categoryItemContent}>
                    <View style={styles.categoryItemIcon}>
                      <CategoryIcon
                        name={category.icon}
                        size={16}
                        color={selected ? colors.card : colors.text}
                      />
                    </View>
                    <Text
                      style={[
                        styles.categoryText,
                        selected && styles.categoryTextSelected,
                      ]}
                    >
                      {category.name}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>

      {fields.length > 0 ? (
        <View style={styles.fieldsBlock}>
          <Text style={styles.categoryLabel}>Campos personalizados</Text>
          {fields.map((field) => (
            <TextField
              key={field.id}
              label={field.name}
              value={fieldValues[field.id] ?? ""}
              onChangeText={(value) =>
                setFieldValues((prev) => ({ ...prev, [field.id]: value }))
              }
              keyboardType={field.type === "number" ? "numeric" : "default"}
            />
          ))}
        </View>
      ) : null}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <PrimaryButton label={submitLabel} onPress={handleSubmit} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  categoryBlock: {
    marginBottom: spacing.lg,
  },
  categoryLabel: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.sm,
    color: colors.muted,
    marginBottom: spacing.xs,
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  categoryRow: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  categoryItem: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.card,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  categoryItemSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryText: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.sm,
    color: colors.text,
  },
  categoryTextSelected: {
    color: colors.card,
  },
  categoryItemContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  categoryItemIcon: {
    marginRight: spacing.xs,
  },
  fieldsBlock: {
    marginBottom: spacing.md,
  },
  error: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.sm,
    color: colors.expense,
    marginBottom: spacing.md,
  },
});
