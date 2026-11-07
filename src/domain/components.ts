import type { EquipmentUnit } from './types';

export const RADIO_PARTS = [
  { suffix: 'RAD', name: 'Рация' },
  { suffix: 'BAT', name: 'Аккумулятор' },
  { suffix: 'CHG', name: 'Зарядная станция' },
  { suffix: 'ADP', name: 'Адаптер' },
  { suffix: 'BOX', name: 'Коробка' },
] as const;

export const componentCodes = (unit: EquipmentUnit) => unit.typeId === 'radio'
  ? RADIO_PARTS.map(part => ({ id: `${unit.id}:${part.suffix}`, name: part.name }))
  : [{ id: unit.id, name: 'Оборудование' }];

export function parseInventoryCode(raw: string): string {
  return raw.trim().replace(/^PROF\.STAFF:(?:UNIT|COMPONENT):/i, '').toUpperCase();
}
