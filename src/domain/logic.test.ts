import { describe, expect, it } from 'vitest';
import { approveBooking, availableCount, bookingState, issueUnit, isOverdue, returnUnit, scanComponent, undoIssue, unitHolder } from './logic';
import { createSeed } from './seed';

describe('бронирование и учёт', () => {
  it('учитывает одобренные пересекающиеся заявки', () => {
    const data = createSeed();
    const existing = data.bookings.find(item => item.id === '1041')!;
    expect(availableCount(data, 'radio', existing.start, existing.end)).toBe(39);
    expect(availableCount(data, 'radio', existing.start, existing.end, existing.id)).toBe(42);
  });
  it('учитывает заявки, ожидающие согласования, и освобождает остаток после отказа', () => {
    const data = createSeed();
    const pending = data.bookings.find(item => item.id === '1042')!;
    expect(availableCount(data, 'projector', pending.start, pending.end)).toBe(1);
    const declined = { ...data, bookings: data.bookings.map(item => item.id === pending.id ? { ...item, status: 'rejected' as const } : item) };
    expect(availableCount(declined, 'projector', pending.start, pending.end)).toBe(2);
  });
  it('согласует заявку и запрещает повторное согласование', () => {
    const data = createSeed();
    const approved = approveBooking(data, '1042');
    expect(approved.bookings.find(item => item.id === '1042')?.status).toBe('approved');
    expect(() => approveBooking(approved, '1042')).toThrow();
  });
  it('выдаёт конкретную единицу, затем учитывает возврат', () => {
    const data = createSeed();
    const issued = issueUnit(data, '1041', 'RAD-001');
    expect(unitHolder(issued, 'RAD-001')).toBe('1041');
    expect(() => issueUnit(issued, '1041', 'RAD-001')).toThrow();
    const returned = returnUnit(issued, '1041', 'RAD-001', 'ok');
    expect(unitHolder(returned, 'RAD-001')).toBeUndefined();
    expect(bookingState(returned, returned.bookings.find(item => item.id === '1041')!)).toBe('Возвращено частично');
  });
  it('помечает повреждённую единицу на проверку', () => {
    const data = issueUnit(createSeed(), '1041', 'RAD-001');
    const returned = returnUnit(data, '1041', 'RAD-001', 'damaged');
    expect(returned.units.find(unit => unit.id === 'RAD-001')?.status).toBe('maintenance');
  });
  it('требует пять разных QR-кодов для выдачи рации', () => {
    let data = createSeed();
    for (const part of ['RAD', 'BAT', 'CHG', 'ADP']) {
      data = scanComponent(data, '1041', `RAD-001:${part}`, 'issue');
      expect(unitHolder(data, 'RAD-001')).toBeUndefined();
    }
    expect(() => scanComponent(data, '1041', 'RAD-001:BAT', 'issue')).toThrow();
    data = scanComponent(data, '1041', 'RAD-001:BOX', 'issue');
    expect(unitHolder(data, 'RAD-001')).toBe('1041');
  });
  it('позволяет отменить ошибочную выдачу с записью в истории', () => {
    const data = issueUnit(createSeed(), '1041', 'RAD-001');
    const fixed = undoIssue(data, '1041', 'RAD-001');
    expect(unitHolder(fixed, 'RAD-001')).toBeUndefined();
    expect(fixed.operations.at(-1)?.kind).toBe('void_issue');
  });
  it('не даёт выдать одну рацию после заполнения квоты заявки', () => {
    let data = createSeed();
    for (const id of ['RAD-001', 'RAD-002', 'RAD-003']) {
      for (const part of ['RAD', 'BAT', 'CHG', 'ADP', 'BOX']) {
        data = scanComponent(data, '1041', `${id}:${part}`, 'issue');
      }
    }
    expect(() => scanComponent(data, '1041', 'RAD-004:RAD', 'issue')).toThrow();
  });
  it('находит просроченную выдачу', () => {
    const data = createSeed();
    expect(isOverdue(data, data.bookings.find(item => item.id === '1040')!)).toBe(true);
  });
});
