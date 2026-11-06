import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ClipboardCheck, MapPin, RotateCcw, ScanLine } from 'lucide-react';
import { bookingState, issuedUnits, isIssuedFor, unitHolder } from '../domain/logic';
import { useAppStore } from '../domain/store';
import { Empty, Status } from '../components/Elements';
import { Scanner } from '../components/Scanner';
import { QrCode } from '../components/QrCode';
import { NoticeDialog } from '../components/NoticeDialog';
import type { Condition, EquipmentUnit } from '../domain/types';

function parseUnitCode(value: string): string {
  const clean = value.trim();
  if (clean.startsWith('PROF.STAFF:UNIT:')) return clean.slice('PROF.STAFF:UNIT:'.length);
  return clean;
}

export function AdminBookingDetail() {
  const { id, mode, role } = useParams();
  const data = useAppStore();
  const booking = data.bookings.find(item => item.id === id);
  const [scanner, setScanner] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [condition, setCondition] = useState<Condition>('ok');
  const [returnMode, setReturnMode] = useState(false);
  if (!booking) return <div className="page-content"><Empty>Заявка не найдена</Empty></div>;
  const activeUnits = issuedUnits(data, booking.id);
  const typeIds = new Set(booking.lines.map(line => line.typeId));
  const candidateUnits = data.units.filter(unit => typeIds.has(unit.typeId));
  const note = (errorText: string, successText = '') => { setError(errorText); setMessage(successText); };
  const operate = (unitId: string) => {
    try {
      if (returnMode) data.returnEquipment(booking.id, unitId, condition);
      else data.issue(booking.id, unitId);
      note('', `${unitId}: ${returnMode ? 'возврат зафиксирован' : 'выдача подтверждена'}`);
      setScanner(false);
    } catch (cause) { note(cause instanceof Error ? cause.message : 'Ошибка операции'); }
  };
  const decide = (approved: boolean) => {
    try { data.decide(booking.id, approved); note('', approved ? 'Заявка согласована' : 'Заявка отклонена'); }
    catch (cause) { note(cause instanceof Error ? cause.message : 'Не удалось изменить заявку'); }
  };
  const lastOperation = (unitId: string) => data.operations.filter(op => op.unitId === unitId && op.bookingId === booking.id).at(-1);
  const unitLabel = (unit: EquipmentUnit): string => data.equipment.find(type => type.id === unit.typeId)?.name ?? unit.typeId;
  const toIssue = candidateUnits.filter(unit => unit.status === 'ready' && !unitHolder(data, unit.id));
  const typesRequested = booking.lines.map(line => ({
    ...line,
    name: data.equipment.find(type => type.id === line.typeId)?.name ?? line.typeId,
    issued: activeUnits.filter(unit => unit.typeId === line.typeId).length,
  }));
  return <div className="page-content"><Link to={`/${mode}/${role}/requests`} className="back-link">← Все заявки</Link>
    <div className="page-heading"><div><p className="overline">КАРТОЧКА ЗАЯВКИ</p><h1>Заявка №{booking.id}</h1><p className="muted">{booking.eventName}</p></div><Status text={bookingState(data, booking)} kind={booking.status}/></div>
    <div className="detail-layout"><div className="detail-main">
      <section className="card"><h2>Информация</h2><div className="details-grid"><div><span className="muted">Заявитель</span><strong>{booking.applicant}</strong></div><div><span className="muted">Подразделение</span><strong>{booking.department}</strong></div><div><span className="muted">Начало</span><strong>{booking.start}</strong></div><div><span className="muted">Возврат до</span><strong>{booking.end}</strong></div></div></section>
      <section className="card"><div className="spread"><h2>Оборудование</h2><span className="muted">Выдано {activeUnits.length} шт.</span></div>{typesRequested.map(line => <div className="line-item" key={line.typeId}><div className="spread"><strong>{line.name}</strong><span>{line.issued} / {line.quantity} выдано</span></div><div className="progress-track"><div style={{ width: `${100 * line.issued / line.quantity}%` }}/></div></div>)}
        <h3>Шпаргалка по местам хранения</h3><div className="storage-list">{candidateUnits.filter(unit => unit.status === 'ready' || isIssuedFor(data, booking.id, unit.id)).slice(0, 35).map(unit => <div className="storage-row" key={unit.id}><div><strong>{unit.id}</strong><div className="muted">{unitLabel(unit)} · каб. {unit.room}, {unit.cabinet}, {unit.shelf}</div></div><span className="muted">{isIssuedFor(data, booking.id, unit.id) ? 'Выдано' : unitHolder(data, unit.id) ? 'У другого' : 'На складе'}</span></div>)}</div>
      </section>
      <section className="card"><h2>История операций</h2>{data.operations.filter(op => op.bookingId === booking.id).length === 0 ? <p className="muted">Операций пока нет</p> : [...data.operations].filter(op => op.bookingId === booking.id).reverse().map(op => <div className="storage-row" key={op.id}><div><strong>{op.unitId}</strong><div className="muted">{new Date(op.at).toLocaleString('ru-RU')} · {op.operator}</div></div><Status text={op.kind === 'issue' ? 'Выдано' : op.condition === 'ok' ? 'Возвращено' : 'Проверить комплектность'}/></div>)}</section>
    </div><aside className="detail-side"><section className="card sticky-card"><h2>Управление заявкой</h2>
      {booking.status === 'pending' && <div className="button-stack"><button className="button primary full" onClick={() => decide(true)}><ClipboardCheck size={18}/> Согласовать</button><button className="button secondary full" onClick={() => decide(false)}>Отклонить</button></div>}
      {booking.status === 'approved' && <><div className="segmented"><button className={!returnMode ? 'selected' : ''} onClick={() => setReturnMode(false)}>Выдача</button><button className={returnMode ? 'selected' : ''} onClick={() => setReturnMode(true)}>Возврат</button></div>
        {returnMode && <label className="field">Состояние при возврате<select value={condition} onChange={event => setCondition(event.target.value as Condition)}><option value="ok">Исправно, комплект полный</option><option value="incomplete">Некомплект</option><option value="damaged">Повреждено</option></select></label>}
        <button className="button primary full" onClick={() => setScanner(true)}>{returnMode ? <RotateCcw size={18}/> : <ScanLine size={18}/>} {returnMode ? 'Сканировать возврат' : 'Сканировать выдачу'}</button>
        <p className="muted small">{returnMode ? `Ожидают возврата: ${activeUnits.length}` : `Доступно для выбора: ${toIssue.length}`}. Сканирование каждой единицы подтверждает операцию.</p>
        <div className="quick-units"><h3>{returnMode ? 'Выданные единицы' : 'Свободные единицы'}</h3>{(returnMode ? activeUnits : toIssue).slice(0, 16).map(unit => <button className="unit-chip" onClick={() => operate(unit.id)} key={unit.id}>{unit.id}</button>)}</div>
      </>}
      <div className="qr-area"><QrCode value={`${window.location.origin}${window.location.pathname}#/miniapp/admin/requests/${booking.id}`} caption={`QR заявки №${booking.id}`}/></div>

      <div className="muted small"><MapPin size={14}/> Адреса хранения указаны для демонстрации.</div>
    </section></aside></div>
    {error && <NoticeDialog message={error} onClose={() => setError('')}/>}
    {message && <NoticeDialog message={message} onClose={() => setMessage('')}/>}
    {scanner && <Scanner onClose={() => setScanner(false)} onScan={value => operate(parseUnitCode(value))}/>}
  </div>;
}
