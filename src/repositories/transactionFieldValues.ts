import { getDb } from "../db/client";

export type FieldValue = {
  fieldId: number;
  value: string;
};

export async function listFieldValuesByTransaction(transactionId: number) {
  const db = await getDb();
  const rows = await db.getAllAsync<FieldValue>(
    `SELECT field_id as fieldId, value_text as value
     FROM transaction_field_values
     WHERE transaction_id = ?;`,
    [transactionId]
  );
  return rows;
}

export async function replaceFieldValues(params: {
  transactionId: number;
  values: FieldValue[];
}) {
  const db = await getDb();
  await db.withTransactionAsync(async () => {
    await db.runAsync("DELETE FROM transaction_field_values WHERE transaction_id = ?;", [
      params.transactionId,
    ]);
    for (const value of params.values) {
      await db.runAsync(
        "INSERT INTO transaction_field_values (transaction_id, field_id, value_text) VALUES (?, ?, ?);",
        [params.transactionId, value.fieldId, value.value]
      );
    }
  });
}
