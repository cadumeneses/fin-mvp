import { getDb } from "../db/client";

export type Category = {
  id: number;
  name: string;
  icon: string;
  type: "income" | "expense";
};

export async function listCategories(): Promise<Category[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<Category>(
    "SELECT id, name, icon, type FROM categories ORDER BY name ASC;"
  );
  return rows;
}

export async function getCategoryById(id: number): Promise<Category | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<Category>(
    "SELECT id, name, icon, type FROM categories WHERE id = ?;",
    [id]
  );
  return row ?? null;
}

export async function insertCategory(input: Omit<Category, "id">) {
  const db = await getDb();
  const result = await db.runAsync(
    "INSERT INTO categories (name, icon, type) VALUES (?, ?, ?);",
    [input.name, input.icon, input.type]
  );
  return result.lastInsertRowId;
}

export async function updateCategory(
  id: number,
  input: Omit<Category, "id">
) {
  const db = await getDb();
  await db.runAsync(
    "UPDATE categories SET name = ?, icon = ?, type = ? WHERE id = ?;",
    [input.name, input.icon, input.type, id]
  );
}

export async function deleteCategory(id: number) {
  const db = await getDb();
  await db.runAsync("DELETE FROM categories WHERE id = ?;", [id]);
}
