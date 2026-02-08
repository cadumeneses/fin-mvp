export function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function formatShortDate(iso: string) {
  const date = new Date(iso);
  const label = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
  }).format(date);

  return label.replace(".", "");
}

export function formatMonthLabel(date: Date) {
  const label = new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
  }).format(date);
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function formatNumberInput(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatCurrencyInput(raw: string) {
  const digits = raw.replace(/\D/g, "");
  if (!digits) {
    return "";
  }
  const numberValue = Number(digits) / 100;
  const formatted = new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
  }).format(numberValue);
  return formatted;
}

export function parseCurrencyInput(raw: string) {
  const digits = raw.replace(/\D/g, "");
  if (!digits) {
    return 0;
  }
  return Number(digits) / 100;
}

export function formatDateInput(raw: string) {
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  const year = digits.slice(0, 4);
  const month = digits.slice(4, 6);
  const day = digits.slice(6, 8);
  let output = year;
  if (month) {
    output += `-${month}`;
  }
  if (day) {
    output += `-${day}`;
  }
  return output;
}
