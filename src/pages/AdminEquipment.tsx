import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { Search, ScanLine } from 'lucide-react';
import { unitHolder } from '../domain/logic';
import { componentCodes, parseInventoryCode } from '../domain/components';
import { useAppStore } from '../domain/store';
import { Empty, Status } from '../components/Elements';
import { QrCode } from '../components/QrCode';
import { Scanner } from '../components/Scanner';
import { useModalDismiss } from '../components/useModalDismiss';

export function AdminEquipment() {
  const data = useAppStore();
  const { mode, role } = useParams();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchParams, setSearchParams] = useSearchParams();
  const [selected, setSelected] = useState<string | null>(null);
  const [scanner, setScanner] = useState(false);
  const [error, setError] = useState('');
  const selectedFromLink = searchParams.get('unit');
  useEffect(() => {
    if (selectedFromLink && data.units.some(unit => unit.id === selectedFromLink)) setSelected(selectedFromLink);
  }, [selectedFromLink, data.units]);
  const closeUnit = () => { setSelected(null); if (selectedFromLink) setSearchParams({}, { replace: true }); };
  useModalDismiss(Boolean(selected) && !scanner, closeUnit);
  const openUnit = (unitId: string) => { setSelected(unitId); setSearchParams({ unit: unitId }, { replace: true }); }; 
  const items = data.units.filter(unit => {
    const type = data.equipment.find(entry => entry.id === unit.typeId);
    const loan = unitHolder(data, unit.id);
    const status = unit.status === 'maintenance' ? 'maintenance' : loan ? 'issued' : 'ready';
    return (typeFilter === 'all' || typeFilter === unit.typeId)
      && (statusFilter === 'all' || statusFilter === status)
      && `${unit.id} ${type?.name} ${unit.room} ${unit.cabinet}`.toLowerCase().includes(search.toLowerCase());
  });
  const current = data.units.find(unit => unit.id === selected);
  const holder = current ? unitHolder(data, current.id) : undefined;
  const borrowed = holder ? data.bookings.find(booking => booking.id === holder) : undefined;
  const parse = parseInventoryCode;
  return <div className="page-content"><div className="page-heading"><div><p className="overline">АДМИНИСТРИРОВАНИЕ</p><h1>Реестр оборудования</h1><p className="muted">Индивидуальные номера, размещение, выдача и состояние.</p></div><button className="button primary" onClick={() => setScanner(true)}><ScanLine size={18}/> Найти по QR</button></div>
    <div className="stats-grid"><div className="stat"><strong>{data.units.length}</strong><span>Всего единиц</span></div><div className="stat"><strong>{data.units.filter(unit => unitHolder(data, unit.id)).length}</strong><span>Выданы</span></div><div className="stat"><strong>{data.units.filter(unit => unit.status === 'maintenance').length}</strong><span>Требуют осмотра</span></div></div>
    <div className="equipment-filters">
      <div className="search-field equipment-search"><Search size={19}/><input aria-label="Поиск оборудования" placeholder="Номер, название, кабинет" value={search} onChange={event => setSearch(event.target.value)}/></div>
      <select aria-label="Тип оборудования" value={typeFilter} onChange={event => setTypeFilter(event.target.value)}>
        <option value="all">Все виды</option>{[...data.equipment].sort((a,b)=>a.name.localeCompare(b.name,'ru')).map(type => <option value={type.id} key={type.id}>{type.name}</option>)}
      </select>
      <select aria-label="Статус оборудования" value={statusFilter} onChange={event => setStatusFilter(event.target.value)}>
        <option value="all">Все статусы</option><option value="ready">На складе</option><option value="issued">Выдано</option><option value="maintenance">На проверке</option>
      </select>
    </div>
    <div className="table-wrap"><table><thead><tr><th>Инв. №</th><th>Оборудование</th><th>Расположение</th><th>Статус</th><th>Заявка</th></tr></thead><tbody>{items.map(unit => { const loan = unitHolder(data, unit.id); const booking = data.bookings.find(item => item.id === loan); return <tr key={unit.id} onClick={() => openUnit(unit.id)} tabIndex={0} onKeyDown={event => { if (event.key === 'Enter') openUnit(unit.id); }}><td><strong>{unit.id}</strong></td><td>{data.equipment.find(type => type.id === unit.typeId)?.name}</td><td>Каб. {unit.room} · {unit.cabinet} · {unit.shelf}</td><td><Status text={unit.status === 'maintenance' ? 'На проверке' : loan ? 'Выдано' : 'На складе'}/></td><td>{booking ? `№${booking.id} · ${booking.applicant} · до ${booking.end}` : '—'}</td></tr>; })}</tbody></table>{items.length === 0 && <Empty>Оборудование не найдено.</Empty>}</div>
    {current && <div className="scanner-modal" role="presentation"
      onMouseDown={event => { if (event.target === event.currentTarget) closeUnit(); }}>
      <div className="scanner-panel unit-detail-panel" role="dialog" aria-modal="true" aria-label={`Оборудование ${current.id}`} ><div className="unit-panel-header"><h2>{current.id}</h2><button className="button secondary" onClick={closeUnit}>Закрыть</button></div><p>{data.equipment.find(type => type.id === current.typeId)?.name}</p><p className="muted">Каб. {current.room}, {current.cabinet}, {current.shelf}</p><p>Статус: {current.status === 'maintenance' ? 'На проверке' : holder ? 'Выдано' : 'На складе'}</p>{borrowed && <p>Получатель: {borrowed.applicant}. Вернуть до {borrowed.end}. <Link onClick={closeUnit} className="inline-link" to={`/${mode}/${role}/requests/${borrowed.id}`}>Открыть заявку №{borrowed.id}</Link></p>}<div className="equipment-components">
      <h3>{current.typeId === 'radio' ? 'QR-коды пяти частей комплекта' : 'QR-код оборудования'}</h3>
      {componentCodes(current).map(component => <QrCode key={component.id} value={`PROF.STAFF:COMPONENT:${component.id}`} caption={`${component.name} · ${component.id}`}/>)}
    </div></div></div>}
    {scanner && <Scanner onClose={() => setScanner(false)} onScan={raw => { const unit = data.units.find(item => componentCodes(item).some(component => component.id === parse(raw))); if (unit) { openUnit(unit.id); setScanner(false); setError(''); } else setError('Единица оборудования не найдена'); }}/>} {error && <div className="error-text">{error}</div>}
  </div>;
}
