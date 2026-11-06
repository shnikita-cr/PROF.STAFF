export type BookingStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';
export type UnitStatus = 'ready' | 'maintenance';
export type OperationKind = 'issue' | 'return';
export type Condition = 'ok' | 'damaged' | 'incomplete';

export interface EquipmentType {
  id: string;
  name: string;
  category: string;
  description: string;
  icon: string;
  components: string[];
  restricted?: boolean;
}

export interface EquipmentUnit {
  id: string;
  typeId: string;
  room: string;
  cabinet: string;
  shelf: string;
  status: UnitStatus;
}

export interface BookingLine { typeId: string; quantity: number }
export interface Booking {
  id: string;
  applicant: string;
  department: string;
  eventName: string;
  start: string;
  end: string;
  createdAt: string;
  status: BookingStatus;
  lines: BookingLine[];
  note?: string;
}

export interface EquipmentOperation {
  id: string;
  bookingId: string;
  unitId: string;
  kind: OperationKind;
  condition: Condition;
  at: string;
  operator: string;
}

export interface AppData {
  equipment: EquipmentType[];
  units: EquipmentUnit[];
  bookings: Booking[];
  operations: EquipmentOperation[];
}
