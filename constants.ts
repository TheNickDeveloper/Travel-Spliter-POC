
import { Category } from './types';

export const SUPPORTED_CURRENCIES = ['TWD', 'USD', 'JPY', 'EUR', 'KRW', 'HKD', 'THB'];

export const CATEGORY_ICONS: Record<Category, string> = {
  [Category.FOOD]: '🍴',
  [Category.TRANSPORT]: '🚗',
  [Category.ACCOMMODATION]: '🏨',
  [Category.SHOPPING]: '🛍️',
  [Category.ENTERTAINMENT]: '🎢',
  [Category.OTHER]: '📦'
};

export const MOCK_RATES: Record<string, number> = {
  'TWD': 1,
  'USD': 32.5,
  'JPY': 0.21,
  'EUR': 35.2,
  'KRW': 0.024,
  'HKD': 4.15,
  'THB': 0.89
};
