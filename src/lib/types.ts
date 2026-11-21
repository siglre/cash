export type TxType = 'expense' | 'income' | 'to_goal' | 'from_goal' | 'transfer';

export interface Transaction {
  id: string;
  type: TxType;
  amount: number; // рубли, целое, > 0
  categoryId?: string;   // expense / income
  goalId?: string;       // to_goal / from_goal
  accountId?: string;    // expense / income / transfer (откуда)
  toAccountId?: string;  // transfer (куда)
  recurringId?: string;  // если это оплата регулярного платежа
  note?: string;
  date: string; // ISO
  createdAt: string;
  updatedAt: string;
  deleted?: boolean;
}

export interface Account {
  id: string;
  name: string;
  kind: 'debit' | 'credit';
  emoji: string;
  color: string;
  /** Остаток «до всех операций». Текущий = initialBalance + движения. Долг — отрицательный. */
  initialBalance: number;
  order: number;
  archived?: boolean;
}

export interface Category {
  id: string;
  name: string;
  emoji: string;
  color: string;
  kind: 'expense' | 'income';
  order: number;
  archived?: boolean;
}

/** Регулярный платёж: квартира, подписки, кредит. Раз в месяц, в указанное число. */
export interface Recurring {
  id: string;
  name: string;
  amount: number;
  day: number;            // 1–31; если в месяце меньше дней — последний день
  categoryId?: string;
  accountId?: string;
  order: number;
  archived?: boolean;
}

export interface Goal {
  id: string;
  name: string;
  target: number;
  deadline: string; // ISO
  emoji: string;
  gradient: [string, string];
  archived?: boolean;
}

export interface Settings {
  id: 'main';
  currency: 'RUB';
  monthlyIncome: number;
  /** @deprecated с v3 — заменено таблицей регулярных платежей */
  fixedCosts: { name: string; amount: number }[];
  monthStartDay: number;
}
