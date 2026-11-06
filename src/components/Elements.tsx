import type { ReactNode } from 'react';
import type { BookingStatus } from '../domain/types';

export function Status({ text, kind }: { text: string; kind?: BookingStatus }) {
  const tone = kind === 'rejected' || text.includes('Просроч') ? 'danger' : kind === 'approved' || text.includes('Возвращ') || text.includes('Выдан') ? 'success' : 'pending';
  return <span className={`status ${tone}`}>{text}</span>;
}

export function Empty({ children }: { children: ReactNode }) { return <div className="empty">{children}</div>; }
export function Field({ label, children }: { label: string; children: ReactNode }) { return <label className="field"><span>{label}</span>{children}</label>; }
