export const FOOD_DAY_CATEGORY_VALUES = [
  'meal',
  'grocery',
  'cafe',
  'transit',
  'medical',
  'culture',
  'other',
] as const;

export type FoodDayCategory = (typeof FOOD_DAY_CATEGORY_VALUES)[number];

export function isFoodDayCategory(v: string): v is FoodDayCategory {
  return (FOOD_DAY_CATEGORY_VALUES as readonly string[]).includes(v);
}
