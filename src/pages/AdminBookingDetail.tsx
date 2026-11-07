import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ClipboardCheck, ScanLine, RotateCcw } from 'lucide-react';
import { bookingState, issuedUnits, isIssuedFor, unitHolder } from '../domain/logic';
import { componentCodes, parseInventoryCode } from '../domain/components';
import { useAppStore } from '../domain/store';
import { Empty, Status } from '../components/Elements';
import { Scanner } from '../components/Scanner';
import { QrCode } from '../components/QrCode';
import { NoticeDialog } from '../components/NoticeDialog';
import { useModalDismiss } from '../components/useModalDismiss';
import type { Condition, EquipmentUnit } from '../domain/types';

export function AdminBookingDetail() {
  const { id, mode, role } = useParams();
  const data = useAppStore();
  const [scanner, setScanner] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [condition, setCondition] = useState<Condition>('ok');
  const [returnMode, setReturnMode] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState('');
  const [confirmCancel, setConfirmCancel] = useState('');
  useModalDismiss(Boolean(confirmCancel), () => setConfirmCancel(''));
  const booking = data.bookings.find(item => item.id === id);

  if (!booking) return <div className="page-content"><Empty>Заявка не найдена</Empty></div>;

  const activeUnits = issuedUnits(data, booking.id);
  const typeIds = new Set(booking.lines.map(line => line.typeId));
  const candidates = data.units.filter(unit => typeIds.has(unit.typeId));
  const lines = [...booking.lines].sort((a, b) =>
    (data.equipment.find(item => item.id === a.typeId)?.name ?? '').localeCompare(
      data.equipment.find(item => item.id === b.typeId)?.name ?? '', 'ru'
    )
  );
  const availableUnits = candidates.filter(unit => unit.status === 'ready' && !unitHolder(data, unit.id));
  const choices = returnMode ? activeUnits : availableUnits;
  const currentUnit = choices.find(unit => unit.id === selectedUnit);
  const activeUnit = currentUnit ?? choices[0];

  const notice = (action: () => void, success: string) => {
    try { action(); setError(''); setMessage(success); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Ошибка операции'); }
  };
  const processCode = (raw: string) => {
    const componentId = parseInventoryCode(raw);
    const target = candidates.find(unit => componentCodes(unit).some(component => component.id === componentId));
    if (!target) { setError('Код отсутствует в составе заявки'); return; }
    if (selectedUnit && target.id !== selectedUnit) {
      setError(`Выбрана единица ${selectedUnit}. Отсканирован код ${target.id}`);
      return;
    }
    try {
      data.scanPart(booking.id, componentId, returnMode ? 'return' : 'issue', condition);
      setScanner(false);
      setError('');
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Не удалось считать код'); }
  };
  const partsFor = (unit: EquipmentUnit) => componentCodes(unit).map(component => ({
    ...component,
    scanned: (data.componentScans ?? []).some(scan => scan.bookingId === booking.id &&
      scan.componentId === component.id && scan.kind === (returnMode ? 'return' : 'issue')),
  }));
  const operations = [...data.operations].filter(op => op.bookingId === booking.id).reverse();

  return <div className="page-content">
    <Link to={`/${mode}/${role}/requests`} className="back-link">← Все заявки</Link>
    <div className="page-heading"><div><p className="overline">КАРТОЧКА ЗАЯВКИ</p><h1>Заявка №{booking.id}</h1>
      <p className="muted">{booking.eventName}</p></div>
      <Status text={bookingState(data, booking)} kind={booking.status}/>
    </div>
    <div className="detail-layout"><div className="detail-main">
      <section className="card"><h2>Информация</h2><div className="details-grid">
        <div><span className="muted">Заявитель</span><strong>{booking.applicant}</strong></div>
        <div><span className="muted">Подразделение</span><strong>{booking.department}</strong></div>
        <div><span className="muted">Начало</span><strong>{booking.start}</strong></div>
        <div><span className="muted">Возврат до</span><strong>{booking.end}</strong></div>
      </div>{booking.note && <p className="muted small">Комментарий: {booking.note}</p>}</section>
      <section className="card"><div className="spread"><h2>Оборудование</h2><span className="muted">Выдано {activeUnits.length}</span></div>
        {lines.map(line => {
          const name = data.equipment.find(type => type.id === line.typeId)?.name ?? line.typeId;
          const issued = activeUnits.filter(unit => unit.typeId === line.typeId).length;
          return <div className="line-item" key={line.typeId}><div className="spread"><strong>{name}</strong><span>{issued} / {line.quantity} выдано</span></div>
            <div className="progress-track"><div style={{ width: `${100 * issued / line.quantity}%` }}/></div></div>;
        })}
        <h3>Места хранения</h3><div className="storage-list">
          {candidates.filter(unit => unit.status === 'ready' || isIssuedFor(data, booking.id, unit.id)).slice(0, 35).map(unit =>
            <div className="storage-row" key={unit.id}>
              <div><Link className="inline-link" to={`/${mode}/${role}/equipment?unit=${encodeURIComponent(unit.id)}`}>{unit.id}</Link><div className="muted">Каб. {unit.room}, {unit.cabinet}, {unit.shelf}</div></div>
              <span className="muted">{isIssuedFor(data, booking.id, unit.id) ? 'Выдано' : unitHolder(data, unit.id) ? 'У другого' : 'На складе'}</span>
            </div>)}
        </div>
      </section>
      <section className="card"><h2>История операций</h2>
        {operations.length === 0 && <p className="muted">Операций пока нет</p>}
        {operations.map(op => <div className="storage-row" key={op.id}>
          <div><Link className="inline-link" to={`/${mode}/${role}/equipment?unit=${encodeURIComponent(op.unitId)}`}>{op.unitId}</Link><div className="muted">{new Date(op.at).toLocaleString('ru-RU')} · {op.operator}</div></div>
          <Status text={op.kind === 'issue' ? 'Выдано' : op.kind === 'void_issue' ? 'Выдача отменена' : op.condition === 'ok' ? 'Возвращено' : 'На проверке'}/>
        </div>)}
      </section>
    </div><aside className="detail-side"><section className="card sticky-card"><h2>Управление заявкой</h2>
      {booking.status === 'pending' && <div className="button-stack">
        <button className="button primary full" onClick={() => notice(() => data.decide(booking.id, true), 'Заявка согласована')}><ClipboardCheck size={18}/> Согласовать</button>
        <button className="button secondary full" onClick={() => notice(() => data.decide(booking.id, false), 'Заявка отклонена')}>Отклонить</button>
      </div>}
      {booking.status === 'approved' && <>
        <div className="segmented"><button className={!returnMode ? 'selected' : ''} onClick={() => { setReturnMode(false); setSelectedUnit(''); }}>Выдача</button>
          <button className={returnMode ? 'selected' : ''} onClick={() => { setReturnMode(true); setSelectedUnit(''); }}>Возврат</button></div>
        {returnMode && <label className="field">Состояние при возврате
          <select value={condition} onChange={event => setCondition(event.target.value as Condition)}>
            <option value="ok">Исправно, комплект полный</option><option value="incomplete">Некомплект</option><option value="damaged">Повреждено</option>
          </select></label>}
        <label className="field">Инвентарный номер
          <select value={activeUnit?.id ?? ''} onChange={event => setSelectedUnit(event.target.value)}>
            {choices.length === 0 && <option value="">Нет единиц</option>}
            {choices.map(unit => <option key={unit.id} value={unit.id}>{unit.id} · {unit.cabinet}, {unit.shelf}</option>)}
          </select></label>
        {activeUnit && <div className="component-panel"><strong>{activeUnit.id}</strong>
          <p className="muted small">{activeUnit.typeId === 'radio' ? 'Пять QR-кодов комплекта' : 'Один QR-код оборудования'}</p>
          {partsFor(activeUnit).map(part => <div className="component-line" key={part.id}>
            <span>{part.name}<small>{part.id}</small></span>
            <button type="button" className={`button compact ${part.scanned ? 'confirmed' : ''}`} disabled={part.scanned}
              onClick={() => processCode(`PROF.STAFF:COMPONENT:${part.id}`)}>
              {part.scanned ? 'Проверено' : 'Подтвердить'}</button>
          </div>)}
          <button className="button primary full" onClick={() => setScanner(true)}><ScanLine size={18}/> Сканировать QR</button>
          {returnMode && condition !== 'ok' && <button className="button secondary full" onClick={() =>
            notice(() => data.incompleteReturn(booking.id, activeUnit.id, condition), 'Возврат принят, требуется проверка')}>Зафиксировать {condition === 'damaged' ? 'повреждение' : 'некомплект'}</button>}
        </div>}
        {activeUnits.length > 0 && !returnMode && <div className="cancel-issues"><h3>Активные выдачи</h3>
          {activeUnits.map(unit => <div className="spread" key={unit.id}><Link className="inline-link" to={`/${mode}/${role}/equipment?unit=${encodeURIComponent(unit.id)}`}>{unit.id}</Link>
            <button className="link-button danger-link" onClick={() => setConfirmCancel(unit.id)}>Отменить выдачу</button></div>)}
        </div>}
      </>}
      <div className="qr-area"><QrCode value={`${window.location.origin}${window.location.pathname}#/miniapp/admin/requests/${booking.id}`} caption={`QR заявки №${booking.id}`}/></div>
    </section></aside></div>
    {error && <NoticeDialog message={error} onClose={() => setError('')}/>}
    {message && <NoticeDialog message={message} onClose={() => setMessage('')}/>}
    {scanner && <Scanner onClose={() => setScanner(false)} onScan={processCode}/>}
    {confirmCancel && <div className="notice-overlay" role="presentation"
      onMouseDown={event => { if (event.target === event.currentTarget) setConfirmCancel(''); }}>
      <div className="notice-dialog" role="dialog" aria-modal="true">
      <h2>Отменить выдачу {confirmCancel}?</h2><p>Операция останется в истории. Оборудование снова будет числиться на складе.</p>
      <div className="dialog-actions"><button className="button" onClick={() => setConfirmCancel('')}>Назад</button>
        <button className="button primary" onClick={() => {
          notice(() => data.cancelIssue(booking.id, confirmCancel), `Выдача ${confirmCancel} отменена`);
          setConfirmCancel('');
        }}>Отменить выдачу</button></div>
    </div></div>}
  </div>;
}
