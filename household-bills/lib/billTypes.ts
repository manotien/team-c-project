import { BillType } from '@prisma/client';

export const BILL_TYPE_ICONS: Record<BillType, string> = {
  ELECTRIC: '⚡',
  WATER: '💧',
  INTERNET: '🌐',
  CAR: '🚗',
  HOME: '🏠',
  OTHER: '📄',
};

export function getBillTypeIcon(type: BillType): string {
  return BILL_TYPE_ICONS[type] || '📄';
}
