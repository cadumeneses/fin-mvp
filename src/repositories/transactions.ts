import { getDb } from "../db/client";

export type TransactionType = "income" | "expense";

export type TransactionInput = {
  title: string;
  amount: number;
  type: TransactionType;
  date: string;
  categoryId?: number | null;
  notes?: string | null;
  fieldValues?: { fieldId: number; value: string }[];
};

export type TransactionListItem = {
  id: number;
  title: string;
  amount: number;
  type: TransactionType;
  date: string;
  categoryId: number | null;
  category: string | null;
  icon: string | null;
};

export type TransactionDetail = {
  id: number;
  title: string;
  amount: number;
  type: TransactionType;
  date: string;
  categoryId: number | null;
};

export type TransactionFieldValue = {
  fieldId: number;
  name: string;
  value: string;
};

export type TransactionWithFields = {
  id: number;
  title: string;
  amount: number;
  type: TransactionType;
  date: string;
  fieldValues: TransactionFieldValue[];
};

export async function insertTransaction(input: TransactionInput) {
  const db = await getDb();
  const result = await db.runAsync(
    `INSERT INTO transactions (title, amount, type, date, category_id, notes)
     VALUES (?, ?, ?, ?, ?, ?);`,
    [
      input.title,
      input.amount,
      input.type,
      input.date,
      input.categoryId ?? null,
      input.notes ?? null,
    ]
  );

  const transactionId = Number(result.lastInsertRowId);
  if (input.fieldValues && input.fieldValues.length > 0) {
    await db.withTransactionAsync(async () => {
      for (const value of input.fieldValues ?? []) {
        await db.runAsync(
          "INSERT INTO transaction_field_values (transaction_id, field_id, value_text) VALUES (?, ?, ?);",
          [transactionId, value.fieldId, value.value]
        );
      }
    });
  }

  return transactionId;
}

export async function listTransactions(limit = 50): Promise<TransactionListItem[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<TransactionListItem>(
    `SELECT
        t.id,
        t.title,
        t.amount,
        t.type,
        t.date,
        t.category_id as categoryId,
        c.name as category,
        c.icon as icon
     FROM transactions t
     LEFT JOIN categories c ON c.id = t.category_id
     ORDER BY t.date DESC
     LIMIT ?;`,
    [limit]
  );

  return rows;
}

export async function listTransactionsFiltered(params: {
  startDate: string;
  endDate: string;
  categoryId?: number | null;
  type?: TransactionType | null;
}): Promise<TransactionListItem[]> {
  const db = await getDb();
  const hasCategory = params.categoryId !== undefined && params.categoryId !== null;
  const hasType = params.type !== undefined && params.type !== null;
  const rows = await db.getAllAsync<TransactionListItem>(
    `SELECT
        t.id,
        t.title,
        t.amount,
        t.type,
        t.date,
        t.category_id as categoryId,
        c.name as category,
        c.icon as icon
     FROM transactions t
     LEFT JOIN categories c ON c.id = t.category_id
     WHERE t.date >= ? AND t.date < ?
       AND (${hasCategory ? "t.category_id = ?" : "1 = 1"})
       AND (${hasType ? "t.type = ?" : "1 = 1"})
     ORDER BY t.date DESC;`,
    hasCategory && hasType
      ? [params.startDate, params.endDate, params.categoryId, params.type]
      : hasCategory
      ? [params.startDate, params.endDate, params.categoryId]
      : hasType
      ? [params.startDate, params.endDate, params.type]
      : [params.startDate, params.endDate]
  );

  return rows;
}

export async function getTransactionById(id: number) {
  const db = await getDb();
  const row = await db.getFirstAsync<TransactionDetail>(
    `SELECT
        id,
        title,
        amount,
        type,
        date,
        category_id as categoryId
     FROM transactions
     WHERE id = ?;`,
    [id]
  );
  if (!row) {
    return null;
  }
  return {
    ...row,
    categoryId: row.categoryId === null ? null : Number(row.categoryId),
  };
}

export async function updateTransaction(id: number, input: TransactionInput) {
  const db = await getDb();
  await db.runAsync(
    `UPDATE transactions
     SET title = ?, amount = ?, type = ?, date = ?, category_id = ?, notes = ?
     WHERE id = ?;`,
    [
      input.title,
      input.amount,
      input.type,
      input.date,
      input.categoryId ?? null,
      input.notes ?? null,
      id,
    ]
  );

  if (input.fieldValues) {
    await db.withTransactionAsync(async () => {
      await db.runAsync(
        "DELETE FROM transaction_field_values WHERE transaction_id = ?;",
        [id]
      );
      for (const value of input.fieldValues ?? []) {
        await db.runAsync(
          "INSERT INTO transaction_field_values (transaction_id, field_id, value_text) VALUES (?, ?, ?);",
          [id, value.fieldId, value.value]
        );
      }
    });
  }
}

export async function deleteTransaction(id: number) {
  const db = await getDb();
  await db.runAsync("DELETE FROM transactions WHERE id = ?;", [id]);
}

export async function listTransactionsWithFieldsByCategory(
  categoryId: number
): Promise<TransactionWithFields[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<{
    id: number;
    title: string;
    amount: number;
    type: TransactionType;
    date: string;
    fieldId: number | null;
    fieldName: string | null;
    fieldValue: string | null;
  }>(
    `SELECT
        t.id,
        t.title,
        t.amount,
        t.type,
        t.date,
        tfv.field_id as fieldId,
        cf.name as fieldName,
        tfv.value_text as fieldValue
     FROM transactions t
     LEFT JOIN transaction_field_values tfv ON tfv.transaction_id = t.id
     LEFT JOIN category_fields cf ON cf.id = tfv.field_id
     WHERE t.category_id = ?
     ORDER BY t.date DESC;`,
    [categoryId]
  );

  const map = new Map<number, TransactionWithFields>();
  for (const row of rows) {
    const existing = map.get(row.id);
    if (existing) {
      if (row.fieldId && row.fieldName && row.fieldValue !== null) {
        existing.fieldValues.push({
          fieldId: row.fieldId,
          name: row.fieldName,
          value: row.fieldValue,
        });
      }
      continue;
    }
    const entry: TransactionWithFields = {
      id: row.id,
      title: row.title,
      amount: row.amount,
      type: row.type,
      date: row.date,
      fieldValues: [],
    };
    if (row.fieldId && row.fieldName && row.fieldValue !== null) {
      entry.fieldValues.push({
        fieldId: row.fieldId,
        name: row.fieldName,
        value: row.fieldValue,
      });
    }
    map.set(row.id, entry);
  }

  return Array.from(map.values());
}
