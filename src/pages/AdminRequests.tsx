import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ScanLine, Search } from 'lucide-react';
import { bookingState, isOverdue } from '../domain/logic';
import { useAppStore } from '../domain/store';
import { Empty, Status } from '../components/Elements';
import { Scanner } from '../components/Scanner';
import { NoticeDialog } from '../components/NoticeDialog';

export function AdminRequests() {
  const data = useAppStore();
  const { mode, role } = useParams();
  const navigate = useNavigate();
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [scanner, setScanner] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const bookings = [...data.bookings].filter(item => {
    const matches = `${item.id} ${item.applicant} ${item.eventName}`.toLowerCase().includes(search.toLowerCase());
    return matches && (filter === 'all' || (filter === 'overdue' ? isOverdue(data, item) : item.status === filter));
  }).sort((a, b) => b.id.localeCompare(a.id));
  const decide = (id: string, approved: boolean) => {
    try { data.decide(id, approved); setMessage(`Заявка №${id} ${approved ? 'согласована' : 'отклонена'}`); setError(''); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Ошибка согласования'); }
  };
  const pending = data.bookings.filter(item => item.status === 'pending');
  const handleScan = (value: string) => {
    const trimmed = value.trim();
    const id = trimmed.match(/#\/(?:miniapp|desktop)\/admin\/requests\/([^/?#]+)/)?.[1]
      ?? trimmed.replace(/^PROF\.STAFF:BOOKING:/i, '');
    if (!data.bookings.some(item => item.id === id)) { setError('Заявка с таким номером не найдена'); return; }
    setScanner(false);
    navigate(`/${mode}/${role}/requests/${id}`);
  };
  return <div className="page-content"><div className="page-heading"><div><p className="overline">АДМИНИСТРИРОВАНИЕ</p><h1>Заявки</h1><p className="muted">Согласование, выдача и контроль возвратов.</p></div><button className="button primary" onClick={() => setScanner(true)}><ScanLine size={19}/> Сканировать заявку</button></div>
    <div className="stats-grid"><div className="stat"><strong>{data.bookings.length}</strong><span>Всего заявок</span></div><div className="stat"><strong>{data.bookings.filter(item => item.status === 'pending').length}</strong><span>Ожидают согласования</span></div><div className="stat"><strong>{data.bookings.filter(item => isOverdue(data, item)).length}</strong><span>Просрочены</span></div></div>
    {pending.length > 0 && <section className="pending-panel"><h2>Ожидают согласования</h2>{pending.map(item => <div className="pending-item" key={item.id}><div><strong>№{item.id} · {item.eventName}</strong><div className="muted small">{item.applicant} · {item.start} — {item.end}</div></div><div className="pending-buttons"><button className="button primary" onClick={() => decide(item.id, true)}>Согласовать</button><button className="button secondary" onClick={() => decide(item.id, false)}>Отклонить</button></div></div>)}</section>}
    <div className="filter-bar admin-request-filters"><div className="search-field"><Search size={18}/><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Номер, заявитель, мероприятие"/></div><select className="status-filter" aria-label="Фильтр статуса" value={filter} onChange={event => setFilter(event.target.value)}><option value="all">Все статусы</option><option value="pending">На согласовании</option><option value="approved">Одобрены</option><option value="rejected">Отклонены</option><option value="overdue">Просрочены</option></select></div>
    <div className="list-stack">{bookings.length === 0 && <Empty>Подходящих заявок нет.</Empty>}{bookings.map(item => <Link className="list-card" to={`/${mode}/${role}/requests/${item.id}`} key={item.id}><div className="spread"><strong>№{item.id} · {item.applicant}</strong><Status text={bookingState(data, item)} kind={item.status}/></div><div>{item.eventName}</div><div className="muted">{item.lines.map(line => `${data.equipment.find(type => type.id === line.typeId)?.name} × ${line.quantity}`).join(', ')}</div><div className="muted">{item.start} — {item.end} · {item.department}</div></Link>)}</div>
    {error && <NoticeDialog message={error} onClose={() => setError('')}/>}
    {message && <NoticeDialog message={message} onClose={() => setMessage('')}/>}
    {scanner && <Scanner onScan={handleScan} onClose={() => setScanner(false)}/>}
  </div>;
}
