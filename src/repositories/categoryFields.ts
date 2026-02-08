import { getDb } from "../db/client";

export type FieldType = "text" | "number" | "date";

export type CategoryField = {
  id: number;
  categoryId: number;
  name: string;
  type: FieldType;
  required: number;
};

export async function listFieldsByCategory(categoryId: number): Promise<CategoryField[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<CategoryField>(
    `SELECT id, category_id as categoryId, name, type, required
     FROM category_fields
     WHERE category_id = ?
     ORDER BY id ASC;`,
    [categoryId]
  );
  return rows;
}

export async function insertCategoryField(input: {
  categoryId: number;
  name: string;
  type: FieldType;
  required?: boolean;
}) {
  const db = await getDb();
  const result = await db.runAsync(
    "INSERT INTO category_fields (category_id, name, type, required) VALUES (?, ?, ?, ?);",
    [input.categoryId, input.name, input.type, input.required ? 1 : 0]
  );
  return result.lastInsertRowId;
}

export async function deleteCategoryField(id: number) {
  const db = await getDb();
  await db.runAsync("DELETE FROM category_fields WHERE id = ?;", [id]);
}
