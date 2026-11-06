import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createSeed } from './seed';
import { approveBooking, issueUnit, returnUnit, validateLines } from './logic';
import type { AppData, Booking, BookingLine, Condition } from './types';

interface CreateBookingInput {
  applicant: string;
  department: string;
  eventName: string;
  start: string;
  end: string;
  lines: BookingLine[];
}

interface AppStore extends AppData {
  createBooking: (input: CreateBookingInput) => string;
  decide: (id: string, approved: boolean) => void;
  cancel: (id: string) => void;
  issue: (bookingId: string, unitId: string) => void;
  returnEquipment: (bookingId: string, unitId: string, condition: Condition) => void;
  reset: () => void;
}

const core = (state: AppStore): AppData => ({
  equipment: state.equipment,
  units: state.units,
  bookings: state.bookings,
  operations: state.operations,
});

export const useAppStore = create<AppStore>()(persist((set, get) => ({
  ...createSeed(),
  createBooking(input) {
    const data = core(get());
    if (!input.applicant.trim() || !input.department.trim() || !input.eventName.trim()) throw new Error('Заполните все поля заявки');
    if (input.start < new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10)) throw new Error('Дата начала уже прошла');
    validateLines(data, input.lines, input.start, input.end);
    const id = String(Math.max(1042, ...data.bookings.map(booking => Number(booking.id))) + 1);
    const booking: Booking = { id, ...input, createdAt: new Date().toISOString(), status: 'pending' };
    set({ bookings: [booking, ...data.bookings] });
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
  reset() { set(createSeed()); },
}),  { name: 'prof-staff-demo-v1', version: 1, partialize: state => core(state) }));
