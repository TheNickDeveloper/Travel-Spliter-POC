
export enum Category {
  FOOD = '餐飲',
  TRANSPORT = '交通',
  ACCOMMODATION = '住宿',
  SHOPPING = '購物',
  ENTERTAINMENT = '娛樂',
  OTHER = '其他'
}

export interface Member {
  id: string;
  name: string;
  avatar: string;
}

export interface Expense {
  id: string;
  title: string;
  amount: number;
  currency: string;
  category: Category;
  date: string;
  location: string;
  payerId: string;
  participants: string[]; // List of member IDs
  convertedAmount?: number; // In base currency
}

export interface Trip {
  id: string;
  name: string;
  members: Member[];
  expenses: Expense[];
  baseCurrency: string;
  createdAt: string;
  completedSettlementKeys?: string[]; // 追蹤已完成的結算項 (格式: "from-to-amount")
  isFullySettled?: boolean; // 專案是否已全部結算完成
}

export interface ExchangeRate {
  [key: string]: number;
}

export interface Settlement {
  from: string;
  to: string;
  amount: number;
  currency: string;
  key: string; // 唯一識別碼
}
