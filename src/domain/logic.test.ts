import { describe, expect, it } from 'vitest';
import { approveBooking, availableCount, bookingState, issueUnit, isOverdue, returnUnit, unitHolder } from './logic';
import { createSeed } from './seed';

describe('бронирование и учёт', () => {
  it('учитывает одобренные пересекающиеся заявки', () => {
    const data = createSeed();
    const existing = data.bookings.find(item => item.id === '1041')!;
    expect(availableCount(data, 'radio', existing.start, existing.end)).toBe(9);
    expect(availableCount(data, 'radio', existing.start, existing.end, existing.id)).toBe(12);
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
  it('находит просроченную выдачу', () => {
    const data = createSeed();
    expect(isOverdue(data, data.bookings.find(item => item.id === '1040')!)).toBe(true);
  });
});
