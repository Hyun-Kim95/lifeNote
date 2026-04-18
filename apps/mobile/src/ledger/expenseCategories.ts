import type { ComponentProps } from 'react';
import type MaterialIcons from '@expo/vector-icons/MaterialIcons';

export const EXPENSE_CATEGORY_IDS = [
  'meal',
  'grocery',
  'cafe',
  'transit',
  'medical',
  'culture',
  'other',
] as const;

export type ExpenseCategoryId = (typeof EXPENSE_CATEGORY_IDS)[number];

type IconName = ComponentProps<typeof MaterialIcons>['name'];

export const EXPENSE_CATEGORIES: Array<{ id: ExpenseCategoryId; label: string; icon: IconName }> = [
  { id: 'meal', label: '식사', icon: 'restaurant' },
  { id: 'grocery', label: '장보기', icon: 'shopping-cart' },
  { id: 'cafe', label: '카페·간식', icon: 'local-cafe' },
  { id: 'transit', label: '교통', icon: 'directions-bus' },
  { id: 'medical', label: '의료·약', icon: 'local-pharmacy' },
  { id: 'culture', label: '문화·여가', icon: 'movie' },
  { id: 'other', label: '기타', icon: 'payments' },
];

const ICON_BY_ID: Record<ExpenseCategoryId, IconName> = Object.fromEntries(
  EXPENSE_CATEGORIES.map((c) => [c.id, c.icon]),
) as Record<ExpenseCategoryId, IconName>;

export function iconForExpenseCategory(id: string | null | undefined): IconName {
  if (id && EXPENSE_CATEGORY_IDS.includes(id as ExpenseCategoryId)) {
    return ICON_BY_ID[id as ExpenseCategoryId];
  }
  return ICON_BY_ID.other;
}
