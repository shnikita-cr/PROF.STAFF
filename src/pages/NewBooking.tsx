import type { FormEvent } from 'react';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { availableCount } from '../domain/logic';
import { useAppStore } from '../domain/store';
import { Field } from '../components/Elements';

export function NewBooking() {
  const { mode, role } = useParams();
  const navigate = useNavigate();
  const data = useAppStore();
  const [applicant, setApplicant] = useState('Демо-активист');
  const [department, setDepartment] = useState('Студенческое объединение');
  const [eventName, setEventName] = useState('Студенческое мероприятие');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const submit = (event: FormEvent) => {
    event.preventDefault();
    try {
      const id = data.createBooking({ applicant, department, eventName, note, start: data.cartStart, end: data.cartEnd, lines: data.cart });
      navigate(`/${mode}/${role}/bookings/${id}`);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Не удалось создать заявку'); }
  };
  return <div className="page-content narrow"><Link to={`/${mode}/${role}/catalog`} className="back-link">← Каталог</Link>
    <div className="page-heading"><div><p className="overline">БРОНИРОВАНИЕ</p><h1>Новая заявка</h1></div></div>
    <form className="surface-form" onSubmit={submit}>
      <div className="form-grid"><Field label="Начало"><input type="date" value={data.cartStart} onChange={e => {
        try { data.setCartDates(e.target.value, e.target.value > data.cartEnd ? e.target.value : data.cartEnd); setError(''); }
        catch (cause) { setError(cause instanceof Error ? cause.message : 'Дата'); }
      }}/></Field>
      <Field label="Окончание"><input type="date" min={data.cartStart} value={data.cartEnd} onChange={e => {
        try { data.setCartDates(data.cartStart, e.target.value); setError(''); }
        catch (cause) { setError(cause instanceof Error ? cause.message : 'Дата'); }
      }}/></Field></div>
      <h3>Оборудование</h3>
      {data.cart.length === 0 && <p className="muted">Добавьте оборудование из каталога.</p>}
      {data.cart.map(line => {
        const type = data.equipment.find(item => item.id === line.typeId);
        const max = availableCount(data, line.typeId, data.cartStart, data.cartEnd);
        return <div className="cart-row" key={line.typeId}><strong>{type?.name}</strong>
          <div className="cart-actions"><input type="number" min={1} max={Math.max(1,max)} aria-label={`Количество: ${type?.name}`} value={line.quantity} onChange={e => {
            try { data.updateCart(line.typeId, Number(e.target.value)); setError(''); }
            catch (cause) { setError(cause instanceof Error ? cause.message : 'Количество'); }
          }}/><button className="link-button" type="button" onClick={() => data.updateCart(line.typeId,0)}>Убрать</button></div>
          {line.quantity > max && <span className="error-text">Осталось {max} шт.</span>}
        </div>;
      })}
      <Field label="Заявитель"><input required value={applicant} onChange={e => setApplicant(e.target.value)}/></Field>
      <Field label="Подразделение"><input required value={department} onChange={e => setDepartment(e.target.value)}/></Field>
      <Field label="Мероприятие"><input required value={eventName} onChange={e => setEventName(e.target.value)}/></Field>
      <Field label="Комментарий"><textarea rows={3} value={note} onChange={e => setNote(e.target.value)} placeholder="Пожелания к выдаче, место мероприятия"/></Field>
      {error && <p className="error-text" role="alert">{error}</p>}
      <button type="submit" disabled={!data.cart.length} className="button primary full">Отправить на согласование</button>
    </form>
  </div>;
}
