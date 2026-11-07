import type { AppData, EquipmentType, EquipmentUnit } from './types';

export const equipment: EquipmentType[] = [
  { id: 'radio', name: 'Рации', category: 'Связь', icon: 'radio', description: 'Радиосвязь для мероприятий', components: ['Рация', 'Аккумулятор', 'Зарядная станция', 'Адаптер', 'Коробка'] },
  { id: 'speaker', name: 'Колонки', category: 'Звук', icon: 'speaker', description: 'Переносные акустические системы', components: ['Колонка', 'Кабель питания'] },
  { id: 'microphone', name: 'Микрофоны', category: 'Звук', icon: 'mic', description: 'Микрофоны для ведущих', components: ['Микрофон', 'Чехол'] },
  { id: 'projector', name: 'Проекторы', category: 'Презентации', icon: 'projector', description: 'Проекционное оборудование', components: ['Проектор', 'Кабель питания', 'HDMI'] },
  { id: 'extension', name: 'Удлинители', category: 'Электрика', icon: 'plug', description: 'Сетевые удлинители', components: ['Удлинитель'] },
  { id: 'printer', name: 'Принтер', category: 'Особые позиции', icon: 'printer', description: 'Для общепрофовских мероприятий', components: ['Принтер', 'Кабель питания'], restricted: true },
];

const makeUnits = (typeId: string, prefix: string, count: number, room: string, cabinet: string, shelf: string): EquipmentUnit[] =>
  Array.from({ length: count }, (_, i) => ({
    id: `${prefix}-${String(i + 1).padStart(3, '0')}`,
    typeId,
    room,
    cabinet,
    shelf,
    status: 'ready',
  }));

export function createSeed(): AppData {
  const units = [
    ...makeUnits('radio', 'RAD', 42, '349', 'Шкаф 2', 'Полка 3'),
    ...makeUnits('speaker', 'SPK', 2, '350', 'Шкаф 1', 'Полка 1'),
    ...makeUnits('microphone', 'MIC', 6, '349', 'Шкаф 1', 'Полка 2'),
    ...makeUnits('projector', 'PRJ', 2, '350', 'Шкаф 3', 'Полка 1'),
    ...makeUnits('extension', 'EXT', 4, '349', 'Шкаф 3', 'Полка 2'),
    ...makeUnits('printer', 'PRN', 1, '349', 'Шкаф 4', 'Полка 1'),
  ];
  const today = new Date();
  const isoDate = (days: number): string => {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() + days);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };
  const now = new Date().toISOString();
  return {
    equipment,
    units,
    bookings: [
      { id: '1041', applicant: 'Алексей Смирнов', department: 'Студсовет', eventName: 'Встреча активистов', start: isoDate(3), end: isoDate(4), createdAt: now, status: 'approved', lines: [{ typeId: 'radio', quantity: 3 }] },
      { id: '1042', applicant: 'Мария Иванова', department: 'Медиацентр', eventName: 'Открытая лекция', start: isoDate(5), end: isoDate(5), createdAt: now, status: 'pending', lines: [{ typeId: 'projector', quantity: 1 }] },
      { id: '1040', applicant: 'Илья Орлов', department: 'ПРОФ.event', eventName: 'Форум студобъединений', start: isoDate(-3), end: isoDate(-1), createdAt: now, status: 'approved', lines: [{ typeId: 'microphone', quantity: 2 }] },
    ],
    componentScans: [],
    operations: [
      { id: 'op-1', bookingId: '1040', unitId: 'MIC-001', kind: 'issue', condition: 'ok', at: now, operator: 'Ирина' },
      { id: 'op-2', bookingId: '1040', unitId: 'MIC-002', kind: 'issue', condition: 'ok', at: now, operator: 'Ирина' },
    ],
  };
}
