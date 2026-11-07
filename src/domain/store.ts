import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createSeed } from './seed';
import { approveBooking, availableCount, issueUnit, returnUnit, scanComponent, finalizeIncompleteReturn, undoIssue, today, validateLines } from './logic';
import type { AppData, Booking, BookingLine, Condition } from './types';

interface CreateBookingInput {
  applicant: string;
  department: string;
  eventName: string;
  start: string;
  end: string;
  lines: BookingLine[];
  note?: string;
}

interface AppStore extends AppData {
  cart: BookingLine[];
  cartStart: string;
  cartEnd: string;
  addToCart: (typeId: string) => void;
  updateCart: (typeId: string, quantity: number) => void;
  setCartDates: (start: string, end: string) => void;
  clearCart: () => void;
  createBooking: (input: CreateBookingInput) => string;
  decide: (id: string, approved: boolean) => void;
  cancel: (id: string) => void;
  issue: (bookingId: string, unitId: string) => void;
  returnEquipment: (bookingId: string, unitId: string, condition: Condition) => void;
  scanPart: (bookingId: string, componentId: string, kind: 'issue' | 'return', condition?: Condition) => void;
  incompleteReturn: (bookingId: string, unitId: string, condition: 'incomplete' | 'damaged') => void;
  cancelIssue: (bookingId: string, unitId: string) => void;
  reset: () => void;
}

const core = (state: AppStore): AppData => ({
  equipment: state.equipment,
  units: state.units,
  bookings: state.bookings,
  operations: state.operations,
  componentScans: state.componentScans ?? [],
});

export const useAppStore = create<AppStore>()(persist((set, get) => ({
  ...createSeed(),
  cart: [],
  cartStart: today(),
  cartEnd: today(),
  addToCart(typeId) {
    const state = get();
    const type = state.equipment.find(item => item.id === typeId);
    if (!type || type.restricted) throw new Error('Позиция недоступна');
    const current = state.cart.find(item => item.typeId === typeId)?.quantity ?? 0;
    if (current >= availableCount(core(state), typeId, state.cartStart, state.cartEnd)) throw new Error('Свободного оборудования больше нет');
    set({ cart: [...state.cart.filter(item => item.typeId !== typeId), { typeId, quantity: current + 1 }] });
  },
  updateCart(typeId, quantity) {
    const state = get();
    if (!Number.isInteger(quantity) || quantity < 0) throw new Error('Некорректное количество');
    if (quantity > availableCount(core(state), typeId, state.cartStart, state.cartEnd)) throw new Error('Недостаточно свободного оборудования');
    set({ cart: [...state.cart.filter(item => item.typeId !== typeId), ...(quantity ? [{ typeId, quantity }] : [])] });
  },
  setCartDates(start, end) {
    if (!start || !end || start > end || start < today()) throw new Error('Проверьте даты');
    set({ cartStart: start, cartEnd: end });
  },
  clearCart() { set({ cart: [] }); },
  createBooking(input) {
    const data = core(get());
    if (!input.applicant.trim() || !input.department.trim() || !input.eventName.trim()) throw new Error('Заполните все поля заявки');
    if (input.start < new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10)) throw new Error('Дата начала уже прошла');
    validateLines(data, input.lines, input.start, input.end);
    const id = String(Math.max(1042, ...data.bookings.map(booking => Number(booking.id))) + 1);
    const booking: Booking = { id, ...input, createdAt: new Date().toISOString(), status: 'pending' };
    set({ bookings: [booking, ...data.bookings], cart: [] });
    return id;
  },
  decide(id, approved) {
    const data = core(get());
    if (approved) set(approveBooking(data, id));
    else {
      const booking = data.bookings.find(item => item.id === id);
      if (!booking || booking.status !== 'pending') throw new Error('Отклонить можно только ожидающую заявку');
      set({ bookings: data.bookings.map(item => item.id === id ? { ...item, status: 'rejected' } : item) });
    }
  },
  cancel(id) {
    const state = get();
    const booking = state.bookings.find(item => item.id === id);
    if (!booking || !['pending', 'approved'].includes(booking.status)) throw new Error('Заявку нельзя отменить');
    if (state.operations.some(op => op.bookingId === id && op.kind === 'issue')) throw new Error('Для отмены сначала завершите выдачу');
    set({ bookings: state.bookings.map(item => item.id === id ? { ...item, status: 'cancelled' } : item) });
  },
  issue(bookingId, unitId) { set(issueUnit(core(get()), bookingId, unitId)); },
  returnEquipment(bookingId, unitId, condition) { set(returnUnit(core(get()), bookingId, unitId, condition)); },
  scanPart(bookingId, componentId, kind, condition = 'ok') { set(scanComponent(core(get()), bookingId, componentId, kind, condition)); },
  incompleteReturn(bookingId, unitId, condition) { set(finalizeIncompleteReturn(core(get()), bookingId, unitId, condition)); },
  cancelIssue(bookingId, unitId) { set(undoIssue(core(get()), bookingId, unitId)); },
  reset() { set({ ...createSeed(), cart: [], cartStart: today(), cartEnd: today() }); },
}), {
  name: 'prof-staff-demo-v1',
  version: 2,
  migrate: persisted => {
    const previous = persisted as Partial<AppData>;
    const units = previous.units ?? [];
    const existing = new Set(units.map(unit => unit.id));
    const additional = createSeed().units.filter(unit => unit.typeId === 'radio' && !existing.has(unit.id));
    return { ...previous, units: [...units, ...additional] };
  },
  partialize: state => ({ ...core(state), cart: state.cart, cartStart: state.cartStart, cartEnd: state.cartEnd }),
}));
