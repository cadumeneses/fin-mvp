import { useNavigation, useRoute } from "@react-navigation/native";
import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { IconPicker } from "../components/IconPicker";
import { PrimaryButton } from "../components/PrimaryButton";
import { Screen } from "../components/Screen";
import { SegmentedControl } from "../components/SegmentedControl";
import { TextField } from "../components/TextField";
import { categoryIcons } from "../constants/categoryIcons";
import { insertCategory, listCategories, updateCategory } from "../repositories/categories";
import {
  CategoryField,
  deleteCategoryField,
  insertCategoryField,
  listFieldsByCategory,
} from "../repositories/categoryFields";
import {
  CategoryMetric,
  deleteCategoryMetric,
  insertCategoryMetric,
  listCategoryMetrics,
} from "../repositories/categoryMetrics";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";
import { typography } from "../theme/typography";

type RouteParams = {
  id?: number;
};

export function CategoryFormScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { id } = (route.params as RouteParams) ?? {};
  const editingId = typeof id === "number" ? id : null;

  const [name, setName] = useState("");
  const [icon, setIcon] = useState("");
  const [type, setType] = useState<"income" | "expense">("expense");
  const [fields, setFields] = useState<CategoryField[]>([]);
  const [pendingFields, setPendingFields] = useState<CategoryField[]>([]);
  const [metrics, setMetrics] = useState<CategoryMetric[]>([]);
  const [pendingMetrics, setPendingMetrics] = useState<CategoryMetric[]>([]);
  const [fieldName, setFieldName] = useState("");
  const [fieldType, setFieldType] = useState<"text" | "number" | "date">("text");
  const [showFields, setShowFields] = useState(false);
  const [metricName, setMetricName] = useState("");
  const [metricFormula, setMetricFormula] = useState("");
  const [metricUnit, setMetricUnit] = useState("");
  const [metricAggregate, setMetricAggregate] = useState<"avg" | "sum" | "last">(
    "avg"
  );
  const [showMetrics, setShowMetrics] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: editingId ? "Editar categoria" : "Nova categoria",
    });
  }, [editingId, navigation]);

  useEffect(() => {
    if (!editingId) {
      return;
    }
    let mounted = true;
    listCategories().then((items) => {
      if (!mounted) {
        return;
      }
      const category = items.find((item) => item.id === editingId);
      if (!category) {
        navigation.goBack();
        return;
      }
      setName(category.name);
      setIcon(category.icon);
      setType(category.type);
    });
    listFieldsByCategory(editingId).then((items) => {
      if (mounted) {
        setFields(items);
        if (items.length > 0) {
          setShowFields(true);
        }
      }
    });
    listCategoryMetrics(editingId).then((items) => {
      if (mounted) {
        setMetrics(items);
        if (items.length > 0) {
          setShowMetrics(true);
        }
      }
    });
    return () => {
      mounted = false;
    };
  }, [editingId, navigation]);

  const onSubmit = useCallback(async () => {
    setError(null);
    if (!name.trim()) {
      setError("Informe um nome.");
      return;
    }
    if (!icon.trim()) {
      setError("Selecione um icone.");
      return;
    }

    const payload = { name: name.trim(), icon: icon.trim(), type };
    if (editingId) {
      await updateCategory(editingId, payload);
      navigation.goBack();
      return;
    }

    const newId = Number(await insertCategory(payload));
    for (const field of pendingFields) {
      await insertCategoryField({
        categoryId: newId,
        name: field.name,
        type: field.type as "text" | "number" | "date",
      });
    }
    for (const metric of pendingMetrics) {
      await insertCategoryMetric({
        categoryId: newId,
        name: metric.name,
        formula: metric.formula,
        unit: metric.unit,
        aggregate: metric.aggregate,
      });
    }
    navigation.goBack();
  }, [editingId, icon, name, navigation, pendingFields, pendingMetrics, type]);

  const onAddField = useCallback(async () => {
    setError(null);
    if (!fieldName.trim()) {
      setError("Informe o nome do campo.");
      return;
    }
    if (!editingId) {
      setPendingFields((prev) => [
        ...prev,
        {
          id: Date.now(),
          categoryId: 0,
          name: fieldName.trim(),
          type: fieldType,
          required: 0,
        },
      ]);
      setFieldName("");
      setShowFields(true);
      return;
    }

    await insertCategoryField({
      categoryId: editingId,
      name: fieldName.trim(),
      type: fieldType,
    });
    setFieldName("");
    const categoryFields = await listFieldsByCategory(editingId);
    setFields(categoryFields);
    setShowFields(true);
  }, [editingId, fieldName, fieldType]);

  const onDeleteField = useCallback(
    async (fieldId: number) => {
      if (!editingId) {
        setPendingFields((prev) => prev.filter((field) => field.id !== fieldId));
        return;
      }
      await deleteCategoryField(fieldId);
      const categoryFields = await listFieldsByCategory(editingId);
      setFields(categoryFields);
    },
    [editingId]
  );

  const onAddMetric = useCallback(async () => {
    setError(null);
    if (!metricName.trim()) {
      setError("Informe o nome da metrica.");
      return;
    }
    if (!metricFormula.trim()) {
      setError("Informe a formula da metrica.");
      return;
    }
    if (!editingId) {
      setPendingMetrics((prev) => [
        ...prev,
        {
          id: Date.now(),
          categoryId: 0,
          name: metricName.trim(),
          formula: metricFormula.trim(),
          unit: metricUnit.trim() || null,
          aggregate: metricAggregate,
        },
      ]);
      setMetricName("");
      setMetricFormula("");
      setMetricUnit("");
      setMetricAggregate("avg");
      setShowMetrics(true);
      return;
    }

    await insertCategoryMetric({
      categoryId: editingId,
      name: metricName.trim(),
      formula: metricFormula.trim(),
      unit: metricUnit.trim() || null,
      aggregate: metricAggregate,
    });
    setMetricName("");
    setMetricFormula("");
    setMetricUnit("");
    setMetricAggregate("avg");
    const items = await listCategoryMetrics(editingId);
    setMetrics(items);
    setShowMetrics(true);
  }, [editingId, metricAggregate, metricFormula, metricName, metricUnit]);

  const onDeleteMetric = useCallback(
    async (metricId: number) => {
      if (!editingId) {
        setPendingMetrics((prev) => prev.filter((metric) => metric.id !== metricId));
        return;
      }
      await deleteCategoryMetric(metricId);
      const items = await listCategoryMetrics(editingId);
      setMetrics(items);
    },
    [editingId]
  );

  const displayFields = editingId ? fields : pendingFields;
  const displayMetrics = editingId ? metrics : pendingMetrics;

  return (
    <Screen withTopInset={false}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
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
          <TextField label="Nome" value={name} onChangeText={setName} />
          <IconPicker
            label="Icone"
            value={icon}
            options={categoryIcons}
            onChange={setIcon}
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}
          <PrimaryButton
            label={editingId ? "Salvar alteracoes" : "Salvar categoria"}
            onPress={onSubmit}
          />

          <View style={styles.fieldsSection}>
            <View style={styles.fieldsHeader}>
              <Text style={styles.sectionTitle}>Campos personalizados</Text>
              <Text style={styles.subtitle}>
                Ex: Km antes, Km depois, litros, posto.
              </Text>
            </View>

            {!showFields ? (
              <PrimaryButton label="Adicionar campo" onPress={() => setShowFields(true)} />
            ) : (
              <>
                <SegmentedControl
                  label="Tipo do campo"
                  value={fieldType}
                  options={[
                    { key: "text", label: "Texto" },
                    { key: "number", label: "Numero" },
                    { key: "date", label: "Data" },
                  ]}
                  onChange={(value) =>
                    setFieldType(value as "text" | "number" | "date")
                  }
                />
                <TextField
                  label="Nome do campo"
                  value={fieldName}
                  onChangeText={setFieldName}
                />
                <PrimaryButton label="Adicionar campo" onPress={onAddField} />
                {displayFields.length === 0 ? (
                  <Text style={styles.emptySubtitle}>Nenhum campo ainda.</Text>
                ) : (
                  displayFields.map((field) => (
                    <View key={field.id} style={styles.fieldRow}>
                      <Text style={styles.fieldName}>
                        {field.name} ({field.type})
                      </Text>
                      <Text
                        style={styles.fieldRemove}
                        onPress={() => onDeleteField(field.id)}
                      >
                        Remover
                      </Text>
                    </View>
                  ))
                )}
              </>
            )}
          </View>

          <View style={styles.fieldsSection}>
            <View style={styles.fieldsHeader}>
              <Text style={styles.sectionTitle}>Metricas personalizadas</Text>
              <Text style={styles.subtitle}>
                Ex: consumo = (km_atual - km_anterior) / litros. Use "valor".
              </Text>
            </View>

            {!showMetrics ? (
              <PrimaryButton label="Adicionar metrica" onPress={() => setShowMetrics(true)} />
            ) : (
              <>
                <TextField
                  label="Nome da metrica"
                  value={metricName}
                  onChangeText={setMetricName}
                />
                <TextField
                  label="Formula"
                  value={metricFormula}
                  onChangeText={setMetricFormula}
                  placeholder="(km_atual - km_anterior) / litros"
                />
                <SegmentedControl
                  label="Agregacao"
                  value={metricAggregate}
                  options={[
                    { key: "avg", label: "Media" },
                    { key: "sum", label: "Total" },
                    { key: "last", label: "Ultimo" },
                  ]}
                  onChange={(value) =>
                    setMetricAggregate(value as "avg" | "sum" | "last")
                  }
                />
                <TextField
                  label="Unidade (opcional)"
                  value={metricUnit}
                  onChangeText={setMetricUnit}
                  placeholder="km/L"
                />
                <PrimaryButton label="Adicionar metrica" onPress={onAddMetric} />
                {displayMetrics.length === 0 ? (
                  <Text style={styles.emptySubtitle}>Nenhuma metrica ainda.</Text>
                ) : (
                  displayMetrics.map((metric) => (
                    <View key={metric.id} style={styles.fieldRow}>
                      <Text style={styles.fieldName}>
                        {metric.name} ({metric.formula})
                      </Text>
                      <Text
                        style={styles.fieldRemove}
                        onPress={() => onDeleteMetric(metric.id)}
                      >
                        Remover
                      </Text>
                    </View>
                  ))
                )}
              </>
            )}
          </View>
        </ScrollView>
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
    paddingBottom: spacing.xxl,
  },
  subtitle: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.sm,
    color: colors.muted,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  error: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.sm,
    color: colors.expense,
    marginBottom: spacing.md,
  },
  fieldsSection: {
    marginTop: spacing.lg,
  },
  sectionTitle: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.md,
    fontWeight: "600",
    color: colors.text,
    marginBottom: spacing.xs,
  },
  fieldRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  fieldName: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.sm,
    color: colors.text,
  },
  fieldRemove: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.sm,
    color: colors.expense,
  },
  emptySubtitle: {
    fontFamily: typography.fontFamily,
    fontSize: typography.sizes.sm,
    color: colors.muted,
    marginTop: spacing.xs,
  },
});
