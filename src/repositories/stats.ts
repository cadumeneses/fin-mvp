import { getDb } from "../db/client";

type TopCategory = {
  id: number;
  name: string;
  icon: string;
  total: number;
};

export type MonthlyStats = {
  income: number;
  expense: number;
  balance: number;
  topCategories: TopCategory[];
};

export function getMonthRange(referenceDate = new Date()) {
  const year = referenceDate.getUTCFullYear();
  const month = referenceDate.getUTCMonth();
  const start = new Date(Date.UTC(year, month, 1, 0, 0, 0));
  const end = new Date(Date.UTC(year, month + 1, 1, 0, 0, 0));
  return { start, end };
}

export async function getMonthlyStats(referenceDate = new Date()): Promise<MonthlyStats> {
  const { start, end } = getMonthRange(referenceDate);
  const startIso = start.toISOString();
  const endIso = end.toISOString();
  const db = await getDb();

  const incomeRow = await db.getFirstAsync<{ total: number }>(
    `SELECT COALESCE(SUM(amount), 0) as total
     FROM transactions
     WHERE type = 'income' AND date >= ? AND date < ?;`,
    [startIso, endIso]
  );
  const expenseRow = await db.getFirstAsync<{ total: number }>(
    `SELECT COALESCE(SUM(amount), 0) as total
     FROM transactions
     WHERE type = 'expense' AND date >= ? AND date < ?;`,
    [startIso, endIso]
  );

  const topCategories = await db.getAllAsync<TopCategory>(
    `SELECT c.id, c.name, c.icon, COALESCE(SUM(t.amount), 0) as total
     FROM transactions t
     JOIN categories c ON c.id = t.category_id
     WHERE t.type = 'expense' AND t.date >= ? AND t.date < ?
     GROUP BY c.id
     ORDER BY total DESC
     LIMIT 3;`,
    [startIso, endIso]
  );

  const income = incomeRow?.total ?? 0;
  const expense = expenseRow?.total ?? 0;

  return {
    income,
    expense,
    balance: income - expense,
    topCategories,
  };
}
