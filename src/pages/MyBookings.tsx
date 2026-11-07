import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAppStore } from '../domain/store';
import { bookingState, isOverdue, today } from '../domain/logic';
import { Empty, Status } from '../components/Elements';
import { QrCode } from '../components/QrCode';

export function MyBookings() {
  const data = useAppStore();
  const { mode, role } = useParams();
  const [filter, setFilter] = useState('all');
  const bookings = [...data.bookings]
    .filter(booking => filter === 'all' || (filter === 'overdue'
      ? isOverdue(data, booking)
      : booking.status === filter))
    .sort((a, b) => b.id.localeCompare(a.id));
  return <div className="page-content"><div className="page-heading"><div><p className="overline">КАБИНЕТ АКТИВИСТА</p><h1>Мои заявки</h1></div>
    <Link className="button primary new-request" to={`/${mode}/${role}/catalog`}>Новая заявка</Link></div>
    <div className="booking-filter-row"><label htmlFor="my-booking-status">Статус заявки</label><select id="my-booking-status" value={filter} onChange={event => setFilter(event.target.value)}>
      <option value="all">Все заявки</option><option value="pending">На согласовании</option>
      <option value="approved">Одобрены</option><option value="rejected">Отклонены</option>
      <option value="overdue">Просрочены</option><option value="cancelled">Отменены</option>
    </select></div>
    <div className="list-stack">{!bookings.length && <Empty>Заявок по выбранному статусу нет.</Empty>}{bookings.map(booking =>
      <Link to={`/${mode}/${role}/bookings/${booking.id}`} className="list-card" key={booking.id}>
        <div className="spread"><strong>Заявка №{booking.id}</strong><Status text={bookingState(data, booking)} kind={booking.status}/></div>
        <div>{booking.eventName}</div>
        <div className="muted">{booking.lines.map(line => `${data.equipment.find(type => type.id === line.typeId)?.name ?? line.typeId} × ${line.quantity}`).join(', ')}</div>
        <div className="muted">{booking.start} — {booking.end}</div>
        {isOverdue(data, booking) && <div className="error-text">Оборудование не возвращено в срок</div>}
        {booking.status === 'approved' && booking.end >= today() && <div className="hint-line">Вернуть до {booking.end}</div>}
      </Link>)}</div></div>;
}

export function MyBookingDetail() {
  const { id, mode, role } = useParams();
  const data = useAppStore();
  const [showQr, setShowQr] = useState(false);
  const booking = data.bookings.find(item => item.id === id);
  if (!booking) return <div className="page-content"><Empty>Заявка не найдена.</Empty></div>;
  const qrValue = `PROF.STAFF:BOOKING:${booking.id}`;
  return <div className="page-content narrow booking-detail"><Link className="back-link" to={`/${mode}/${role}/bookings`}>← Мои заявки</Link>
    <div className="page-heading"><div><p className="overline">ЗАЯВКА</p><h1>№{booking.id}</h1></div><Status text={bookingState(data, booking)} kind={booking.status}/></div>
    <section className="surface-form compact-detail">
      <div className="details-grid"><div><span className="muted">Мероприятие</span><strong>{booking.eventName}</strong></div>
      <div><span className="muted">Подразделение</span><strong>{booking.department}</strong></div>
      <div><span className="muted">Заявитель</span><strong>{booking.applicant}</strong></div>
      <div><span className="muted">Даты</span><strong>{booking.start} — {booking.end}</strong></div></div>
      <div><h3>Оборудование</h3>{booking.lines.map(line => <div className="spread line-item" key={line.typeId}>
        <span>{data.equipment.find(type => type.id === line.typeId)?.name}</span><strong>× {line.quantity}</strong></div>)}</div>
      {booking.note && <p className="muted small">Комментарий: {booking.note}</p>}
      {booking.status === 'pending' && <p className="muted small">Ожидает согласования</p>}
      {booking.status === 'approved' && <button className="button primary full" onClick={() => setShowQr(true)}>QR-код заявки</button>}
    </section>
    {showQr && <div className="notice-overlay" onMouseDown={e => { if (e.currentTarget === e.target) setShowQr(false); }}>
      <div className="notice-dialog" role="dialog" aria-modal="true" aria-label="QR-код заявки">
        <QrCode value={qrValue} caption={`Заявка №${booking.id}`}/>
        <p className="muted centered">Покажите код при получении и возврате оборудования.</p>
        <button className="button full" onClick={() => setShowQr(false)}>Закрыть</button>
      </div></div>}
  </div>;
}
