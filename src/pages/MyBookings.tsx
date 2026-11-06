import { Link, useParams } from 'react-router-dom';
import { useAppStore } from '../domain/store';
import { bookingState, isOverdue, today } from '../domain/logic';
import { Empty, Status } from '../components/Elements';
import { QrCode } from '../components/QrCode';

export function MyBookings() {
  const data = useAppStore();
  const { mode, role } = useParams();
  const bookings = [...data.bookings].sort((a, b) => b.id.localeCompare(a.id));
  return <div className="page-content"><div className="page-heading"><div><p className="overline">КАБИНЕТ АКТИВИСТА</p><h1>Мои заявки</h1><p className="muted">Статусы согласования, QR-коды и сроки возврата.</p></div><Link className="button primary" to={`/${mode}/${role}/catalog`}>Новая заявка</Link></div>
    <div className="list-stack">{bookings.length === 0 && <Empty>Заявок пока нет.</Empty>}{bookings.map(booking => <Link to={`/${mode}/${role}/bookings/${booking.id}`} className="list-card" key={booking.id}><div className="spread"><strong>Заявка №{booking.id}</strong><Status text={bookingState(data, booking)} kind={booking.status}/></div><div>{booking.eventName}</div><div className="muted">{booking.lines.map(line => `${data.equipment.find(type => type.id === line.typeId)?.name ?? line.typeId} × ${line.quantity}`).join(', ')}</div><div className="muted">{booking.start} — {booking.end}</div>{isOverdue(data, booking) && <div className="error-text">Оборудование не возвращено в срок</div>}{booking.status === 'approved' && booking.end >= today() && <div className="hint-line">Напоминание: вернуть оборудование до {booking.end}</div>}</Link>)}</div>
  </div>;
}

export function MyBookingDetail() {
  const { id, mode, role } = useParams();
  const data = useAppStore();
  const booking = data.bookings.find(item => item.id === id);
  if (!booking) return <div className="page-content"><Empty>Заявка не найдена.</Empty></div>;
  const qrValue = `${window.location.origin}${window.location.pathname}#/miniapp/admin/requests/${booking.id}`;
  return <div className="page-content narrow"><Link className="back-link" to={`/${mode}/${role}/bookings`}>← Мои заявки</Link><div className="page-heading"><div><p className="overline">ДЕТАЛИ ЗАЯВКИ</p><h1>Заявка №{booking.id}</h1></div><Status text={bookingState(data, booking)} kind={booking.status}/></div>
    <div className="surface-form"><div className="details-grid"><div><span className="muted">Мероприятие</span><strong>{booking.eventName}</strong></div><div><span className="muted">Подразделение</span><strong>{booking.department}</strong></div><div><span className="muted">Заявитель</span><strong>{booking.applicant}</strong></div><div><span className="muted">Срок</span><strong>{booking.start} — {booking.end}</strong></div></div>
      <h3>Состав заявки</h3>{booking.lines.map(line => <div className="spread line-item" key={line.typeId}><span>{data.equipment.find(type => type.id === line.typeId)?.name}</span><strong>× {line.quantity}</strong></div>)}
      {booking.status === 'approved' && <><h3>QR-код для выдачи</h3><QrCode value={qrValue} caption={`Заявка №${booking.id}`}/><p className="muted centered">Покажите код ответственному при получении оборудования.</p></>}
      {booking.status === 'pending' && <div className="info-note">Заявка ожидает согласования ответственным.</div>}
    </div>
  </div>;
}
