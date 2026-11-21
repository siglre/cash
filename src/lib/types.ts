export type TxType = 'expense' | 'income' | 'to_goal' | 'from_goal' | 'transfer';

export interface Transaction {
  id: string;
  type: TxType;
  amount: number; // рубли, целое, > 0
  categoryId?: string;   // expense / income
  goalId?: string;       // to_goal / from_goal
  accountId?: string;    // expense / income / transfer (откуда)
  toAccountId?: string;  // transfer (куда)
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
  fixedCosts: { name: string; amount: number }[];
  monthStartDay: number;
}
