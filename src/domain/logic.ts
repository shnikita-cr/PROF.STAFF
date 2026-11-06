import type { AppData, Booking, BookingLine, Condition, EquipmentOperation, EquipmentUnit } from './types';

export const overlaps = (startA: string, endA: string, startB: string, endB: string): boolean =>
  startA <= endB && startB <= endA;

export const today = (): string => {
  const value = new Date();
  const offset = value.getTimezoneOffset() * 60_000;
  return new Date(value.getTime() - offset).toISOString().slice(0, 10);
};

export function unitHolder(data: AppData, unitId: string): string | undefined {
  const operations = data.operations.filter(op => op.unitId === unitId);
  const last = operations.at(-1);
  return last?.kind === 'issue' ? last.bookingId : undefined;
}

export function isIssuedFor(data: AppData, bookingId: string, unitId: string): boolean {
  return unitHolder(data, unitId) === bookingId;
}

export function issuedUnits(data: AppData, bookingId: string): EquipmentUnit[] {
  return data.units.filter(unit => isIssuedFor(data, bookingId, unit.id));
}

export function availableCount(data: AppData, typeId: string, start: string, end: string, excludeBookingId?: string): number {
  const validUnits = data.units.filter(unit => unit.typeId === typeId && unit.status === 'ready');
  const overlapping = data.bookings.filter(booking => (booking.status === 'approved' || booking.status === 'pending') && booking.id !== excludeBookingId && overlaps(start, end, booking.start, booking.end));
  const reserved = overlapping.reduce((sum, booking) => sum + (booking.lines.find(line => line.typeId === typeId)?.quantity ?? 0), 0);
  const overdueIssued = validUnits.filter(unit => {
    const holder = unitHolder(data, unit.id);
    if (!holder || holder === excludeBookingId) return false;
    const booking = data.bookings.find(item => item.id === holder);
    return booking && !overlaps(start, end, booking.start, booking.end);
  }).length;
  return Math.max(0, validUnits.length - reserved - overdueIssued);
}

export function validateLines(data: AppData, lines: BookingLine[], start: string, end: string, excludeBookingId?: string): void {
  if (!start || !end || start > end) throw new Error('Проверьте даты бронирования');
  if (!lines.length) throw new Error('Выберите оборудование');
  for (const line of lines) {
    const type = data.equipment.find(item => item.id === line.typeId);
    if (!type || !Number.isInteger(line.quantity) || line.quantity < 1) throw new Error('Некорректное количество оборудования');
    if (type.restricted) throw new Error('Эта позиция доступна только для общепрофовских мероприятий');
    if (availableCount(data, line.typeId, start, end, excludeBookingId) < line.quantity) throw new Error(`Недостаточно оборудования: ${type.name}`);
  }
}

export function approveBooking(data: AppData, id: string): AppData {
  const booking = data.bookings.find(item => item.id === id);
  if (!booking || booking.status !== 'pending') throw new Error('Согласовать можно только ожидающую заявку');
  validateLines(data, booking.lines, booking.start, booking.end, booking.id);
  return { ...data, bookings: data.bookings.map(item => item.id === id ? { ...item, status: 'approved' } : item) };
}

export function issueUnit(data: AppData, bookingId: string, unitId: string): AppData {
  const booking = data.bookings.find(item => item.id === bookingId);
  const unit = data.units.find(item => item.id === unitId);
  if (!booking || booking.status !== 'approved') throw new Error('Заявка не согласована');
  if (!unit || unit.status !== 'ready') throw new Error('Оборудование недоступно');
  if (unitHolder(data, unitId)) throw new Error('Эта единица уже выдана');
  const line = booking.lines.find(item => item.typeId === unit.typeId);
  if (!line) throw new Error('Этого типа оборудования нет в заявке');
  const issuedCount = issuedUnits(data, bookingId).filter(item => item.typeId === unit.typeId).length;
  if (issuedCount >= line.quantity) throw new Error('Все единицы этого типа уже выданы');
  // Не выдаём единицу, зарезервированную другой заявкой на пересекающийся период.
  const otherReservations = data.bookings.filter(item => item.id !== bookingId && (item.status === 'approved' || item.status === 'pending') && overlaps(item.start, item.end, booking.start, booking.end));
  const reservedOther = otherReservations.reduce((sum, item) => sum + (item.lines.find(entry => entry.typeId === unit.typeId)?.quantity ?? 0), 0);
  const typeReadyCount = data.units.filter(item => item.typeId === unit.typeId && item.status === 'ready').length;
  const otherIssued = data.units.filter(item => item.typeId === unit.typeId && unitHolder(data, item.id) && !isIssuedFor(data, bookingId, item.id)).length;
  if (typeReadyCount - Math.max(reservedOther, otherIssued) <= issuedCount) throw new Error('Нет свободных единиц для выдачи');
  return appendOperation(data, bookingId, unitId, 'issue', 'ok');
}

export function returnUnit(data: AppData, bookingId: string, unitId: string, condition: Condition): AppData {
  if (!isIssuedFor(data, bookingId, unitId)) throw new Error('Единица не числится выданной по этой заявке');
  const updated = appendOperation(data, bookingId, unitId, 'return', condition);
  if (condition === 'ok') return updated;
  return { ...updated, units: updated.units.map(unit => unit.id === unitId ? { ...unit, status: 'maintenance' } : unit) };
}

function appendOperation(data: AppData, bookingId: string, unitId: string, kind: EquipmentOperation['kind'], condition: Condition): AppData {
  const operation: EquipmentOperation = { id: crypto.randomUUID(), bookingId, unitId, kind, condition, at: new Date().toISOString(), operator: 'Демо-администратор' };
  return { ...data, operations: [...data.operations, operation] };
}

export const isOverdue = (data: AppData, booking: Booking): boolean =>
  booking.status === 'approved' && booking.end < today() && issuedUnits(data, booking.id).length > 0;

export function bookingState(data: AppData, booking: Booking): string {
  if (booking.status === 'pending') return 'На согласовании';
  if (booking.status === 'rejected') return 'Отклонена';
  if (booking.status === 'cancelled') return 'Отменена';
  const issued = issuedUnits(data, booking.id);
  if (isOverdue(data, booking)) return 'Просрочена';
  const requestedCount = booking.lines.reduce((sum, line) => sum + line.quantity, 0);
  const everIssued = new Set(data.operations.filter(op => op.bookingId === booking.id && op.kind === 'issue').map(op => op.unitId)).size;
  if (issued.length) return issued.length < requestedCount ? 'Выдано частично' : 'Выдано';
  const hasReturns = data.operations.some(op => op.bookingId === booking.id && op.kind === 'return');
  return hasReturns ? everIssued < requestedCount ? 'Возвращено частично' : 'Возвращено' : 'Одобрена';
}
