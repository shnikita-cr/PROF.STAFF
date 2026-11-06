import type { FormEvent } from 'react';
import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { availableCount, today } from '../domain/logic';
import { useAppStore } from '../domain/store';
import { Field } from '../components/Elements';

export function NewBooking() {
  const [params] = useSearchParams();
  const { mode, role } = useParams();
  const navigate = useNavigate();
  const data = useAppStore();
  const [typeId, setTypeId] = useState(params.get('type') ?? 'radio');
  const [start, setStart] = useState(params.get('start') ?? today());
  const [end, setEnd] = useState(params.get('end') ?? today());
  const [quantity, setQuantity] = useState(1);
  const [applicant, setApplicant] = useState('Демо-активист');
  const [department, setDepartment] = useState('Студенческое объединение');
  const [eventName, setEventName] = useState('Студенческое мероприятие');
  const [error, setError] = useState('');
  const type = useMemo(() => data.equipment.find(item => item.id === typeId), [data.equipment, typeId]);
  const available = availableCount(data, typeId, start, end);
  const canSubmit = Boolean(start && end && start <= end && quantity >= 1 && quantity <= available && !type?.restricted);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    try {
      const id = data.createBooking({ applicant, department, eventName, start, end, lines: [{ typeId, quantity }] });
      navigate(`/${mode}/${role}/bookings/${id}`);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Не удалось создать заявку'); }
  };

  return <div className="page-content narrow"><Link to={`/${mode}/${role}/catalog`} className="back-link">← Каталог</Link><div className="page-heading"><div><p className="overline">НОВАЯ ЗАЯВКА</p><h1>Бронирование</h1></div></div>
    <form className="surface-form" onSubmit={submit}>
      <Field label="Оборудование"><select value={typeId} onChange={event => { setTypeId(event.target.value); setQuantity(1); }}>{data.equipment.filter(item => !item.restricted).map(item => <option value={item.id} key={item.id}>{item.name}</option>)}</select></Field>
      <div className="form-grid"><Field label="Дата начала"><input type="date" min={today()} value={start} onChange={event => { setStart(event.target.value); if (event.target.value > end) setEnd(event.target.value); }}/></Field><Field label="Дата окончания"><input type="date" min={start} value={end} onChange={event => setEnd(event.target.value)}/></Field></div>
      <div className="availability-line"><span>Свободно на выбранные даты</span><strong>{available} шт.</strong></div>
      <Field label="Количество"><input type="number" min={1} max={Math.max(1, available)} value={quantity} onChange={event => setQuantity(Number(event.target.value))}/></Field>
      <Field label="ФИО заявителя"><input value={applicant} required onChange={event => setApplicant(event.target.value)}/></Field>
      <Field label="Подразделение"><input value={department} required onChange={event => setDepartment(event.target.value)}/></Field>
      <Field label="Мероприятие"><input value={eventName} required onChange={event => setEventName(event.target.value)}/></Field>
      <div className="info-note">После подачи заявка поступит на согласование. Количество зарезервируется после одобрения.</div>
      {error && <p className="error-text" role="alert">{error}</p>}
      <button type="submit" disabled={!canSubmit} className="button primary full">Отправить заявку</button>
    </form>
  </div>;
}
