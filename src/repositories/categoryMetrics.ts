import { getDb } from "../db/client";

export type CategoryMetric = {
  id: number;
  categoryId: number;
  name: string;
  formula: string;
  unit: string | null;
  aggregate: "avg" | "sum" | "last";
};

export async function listCategoryMetrics(categoryId: number): Promise<CategoryMetric[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<CategoryMetric>(
    `SELECT
        id,
        category_id as categoryId,
        name,
        formula,
        unit,
        aggregate
     FROM category_metrics
     WHERE category_id = ?
     ORDER BY id ASC;`,
    [categoryId]
  );
  return rows;
}

export async function insertCategoryMetric(input: {
  categoryId: number;
  name: string;
  formula: string;
  unit?: string | null;
  aggregate?: "avg" | "sum" | "last";
}) {
  const db = await getDb();
  const result = await db.runAsync(
    "INSERT INTO category_metrics (category_id, name, formula, unit, aggregate) VALUES (?, ?, ?, ?, ?);",
    [
      input.categoryId,
      input.name,
      input.formula,
      input.unit ?? null,
      input.aggregate ?? "avg",
    ]
  );
  return result.lastInsertRowId;
}

export async function deleteCategoryMetric(id: number) {
  const db = await getDb();
  await db.runAsync("DELETE FROM category_metrics WHERE id = ?;", [id]);
}
