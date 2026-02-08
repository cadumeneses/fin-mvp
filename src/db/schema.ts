import { getDb } from "./client";
import type { SQLiteDatabase } from "expo-sqlite";

type CategorySeed = {
  name: string;
  icon: string;
  type: "income" | "expense";
};

const CATEGORY_SEED: CategorySeed[] = [
  { name: "Alimentacao", icon: "food-fork-drink", type: "expense" },
  { name: "Carro", icon: "car-sports", type: "expense" },
  { name: "Transporte", icon: "bus", type: "expense" },
  { name: "Casa", icon: "home-outline", type: "expense" },
  { name: "Saude", icon: "heart-pulse", type: "expense" },
  { name: "Lazer", icon: "movie-open-outline", type: "expense" },
  { name: "Salario", icon: "briefcase-outline", type: "income" },
  { name: "Freela", icon: "laptop", type: "income" },
  { name: "Investimentos", icon: "chart-line", type: "income" },
];

export async function initializeDatabase() {
  const db = await getDb();
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS app_meta (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      icon TEXT NOT NULL,
      type TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      amount REAL NOT NULL,
      type TEXT NOT NULL,
      date TEXT NOT NULL,
      category_id INTEGER,
      notes TEXT,
      FOREIGN KEY(category_id) REFERENCES categories(id)
    );
    CREATE TABLE IF NOT EXISTS category_fields (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      required INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY(category_id) REFERENCES categories(id)
    );
    CREATE TABLE IF NOT EXISTS category_metrics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      formula TEXT NOT NULL,
      unit TEXT,
      aggregate TEXT NOT NULL DEFAULT 'avg',
      FOREIGN KEY(category_id) REFERENCES categories(id)
    );
    CREATE TABLE IF NOT EXISTS transaction_field_values (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      transaction_id INTEGER NOT NULL,
      field_id INTEGER NOT NULL,
      value_text TEXT NOT NULL,
      FOREIGN KEY(transaction_id) REFERENCES transactions(id),
      FOREIGN KEY(field_id) REFERENCES category_fields(id)
    );
  `);

  await seedCategories(db);
  await runTemplateMigrations(db);
}

async function seedCategories(db: SQLiteDatabase) {
  const row = await db.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) as count FROM categories;"
  );
  if (row && row.count > 0) {
    return;
  }

  await db.withTransactionAsync(async () => {
    for (const category of CATEGORY_SEED) {
      await db.runAsync(
        "INSERT INTO categories (name, icon, type) VALUES (?, ?, ?);",
        [category.name, category.icon, category.type]
      );
    }
  });
}

const TEMPLATE_VERSION = 2;

async function runTemplateMigrations(db: SQLiteDatabase) {
  const storedVersion = await db.getFirstAsync<{ value: string }>(
    "SELECT value FROM app_meta WHERE key = ?;",
    ["category_template_version"]
  );
  const version = storedVersion ? Number(storedVersion.value) : 0;
  if (Number.isNaN(version) || version < TEMPLATE_VERSION) {
    await ensureCategoryTemplates(db);
    await db.runAsync(
      "INSERT OR REPLACE INTO app_meta (key, value) VALUES (?, ?);",
      ["category_template_version", String(TEMPLATE_VERSION)]
    );
  }
}

async function ensureCategoryTemplates(db: SQLiteDatabase) {
  const existingCategories = await db.getAllAsync<CategorySeed & { id: number }>(
    "SELECT id, name, icon, type FROM categories;"
  );
  const existingByName = new Map(
    existingCategories.map((category) => [normalizeName(category.name), category])
  );

  const templates = [
    {
      name: "Carro",
      icon: "car-sports",
      type: "expense",
      fields: [
        { name: "Km atual", type: "number" },
        { name: "Km anterior", type: "number" },
        { name: "Litros", type: "number" },
        { name: "Preco litro", type: "number" },
        { name: "Posto", type: "text" },
        { name: "Peca/Servico", type: "text" },
      ],
      metrics: [
        {
          name: "Consumo medio",
          formula: "(km_atual - km_anterior) / litros",
          unit: "km/L",
          aggregate: "avg",
        },
        {
          name: "Custo por km",
          formula: "valor / (km_atual - km_anterior)",
          unit: "R$/km",
          aggregate: "avg",
        },
        {
          name: "Preco medio/L",
          formula: "valor / litros",
          unit: "R$/L",
          aggregate: "avg",
        },
        {
          name: "Gasto total",
          formula: "valor",
          unit: "R$",
          aggregate: "sum",
        },
      ],
    },
    {
      name: "Alimentacao",
      icon: "food-fork-drink",
      type: "expense",
      fields: [
        { name: "Local", type: "text" },
        { name: "Pessoas", type: "number" },
      ],
      metrics: [
        { name: "Ticket medio", formula: "valor", unit: "R$", aggregate: "avg" },
        { name: "Gasto por pessoa", formula: "valor / pessoas", unit: "R$", aggregate: "avg" },
        { name: "Gasto total", formula: "valor", unit: "R$", aggregate: "sum" },
      ],
    },
    {
      name: "Transporte",
      icon: "bus",
      type: "expense",
      fields: [
        { name: "Distancia km", type: "number" },
        { name: "Origem", type: "text" },
        { name: "Destino", type: "text" },
        { name: "Tipo", type: "text" },
      ],
      metrics: [
        { name: "Custo por km", formula: "valor / distancia_km", unit: "R$/km", aggregate: "avg" },
        { name: "Gasto total", formula: "valor", unit: "R$", aggregate: "sum" },
      ],
    },
    {
      name: "Casa",
      icon: "home-outline",
      type: "expense",
      fields: [
        { name: "Servico", type: "text" },
        { name: "Recorrente", type: "text" },
      ],
      metrics: [
        { name: "Gasto medio", formula: "valor", unit: "R$", aggregate: "avg" },
        { name: "Gasto total", formula: "valor", unit: "R$", aggregate: "sum" },
      ],
    },
    {
      name: "Saude",
      icon: "heart-pulse",
      type: "expense",
      fields: [
        { name: "Profissional", type: "text" },
        { name: "Sessao", type: "number" },
      ],
      metrics: [
        { name: "Custo por sessao", formula: "valor / sessao", unit: "R$", aggregate: "avg" },
        { name: "Gasto total", formula: "valor", unit: "R$", aggregate: "sum" },
      ],
    },
    {
      name: "Lazer",
      icon: "movie-open-outline",
      type: "expense",
      fields: [
        { name: "Tipo", type: "text" },
        { name: "Pessoas", type: "number" },
      ],
      metrics: [
        { name: "Ticket medio", formula: "valor", unit: "R$", aggregate: "avg" },
        { name: "Gasto por pessoa", formula: "valor / pessoas", unit: "R$", aggregate: "avg" },
        { name: "Gasto total", formula: "valor", unit: "R$", aggregate: "sum" },
      ],
    },
  ];

  for (const template of templates) {
    const existing = existingByName.get(normalizeName(template.name));
    let categoryId = existing?.id;
    if (!categoryId) {
      const result = await db.runAsync(
        "INSERT INTO categories (name, icon, type) VALUES (?, ?, ?);",
        [template.name, template.icon, template.type]
      );
      categoryId = Number(result.lastInsertRowId);
      existingByName.set(normalizeName(template.name), {
        id: categoryId,
        name: template.name,
        icon: template.icon,
        type: template.type,
      });
    }

    for (const field of template.fields) {
      const fieldExisting = await db.getFirstAsync<{ id: number }>(
        "SELECT id FROM category_fields WHERE category_id = ? AND name = ? LIMIT 1;",
        [categoryId, field.name]
      );
      if (!fieldExisting) {
        await db.runAsync(
          "INSERT INTO category_fields (category_id, name, type) VALUES (?, ?, ?);",
          [categoryId, field.name, field.type]
        );
      }
    }

    for (const metric of template.metrics) {
      const metricExisting = await db.getFirstAsync<{ id: number }>(
        "SELECT id FROM category_metrics WHERE category_id = ? AND name = ? LIMIT 1;",
        [categoryId, metric.name]
      );
      if (!metricExisting) {
        await db.runAsync(
          "INSERT INTO category_metrics (category_id, name, formula, unit, aggregate) VALUES (?, ?, ?, ?, ?);",
          [categoryId, metric.name, metric.formula, metric.unit, metric.aggregate]
        );
      }
    }
  }
}

function normalizeName(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
}
