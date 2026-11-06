import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CalendarDays, ChevronRight, Radio, Speaker, MicVocal, Projector, Plug, Printer } from 'lucide-react';
import { useAppStore } from '../domain/store';
import { availableCount, today } from '../domain/logic';
import { Field } from '../components/Elements';
import type { EquipmentType } from '../domain/types';

const icons = { radio: Radio, speaker: Speaker, mic: MicVocal, projector: Projector, plug: Plug, printer: Printer };
export function EquipmentIcon({ item }: { item: EquipmentType }) {
  const Icon = icons[item.icon as keyof typeof icons] ?? Radio;
  return <div className="equipment-icon"><Icon size={25}/></div>;
}

export function Catalog() {
  const { mode, role } = useParams();
  const data = useAppStore();
  const [start, setStart] = useState(today());
  const [end, setEnd] = useState(today());
  const [search, setSearch] = useState('');
  const equipment = useMemo(() => data.equipment.filter(item => `${item.name} ${item.category}`.toLowerCase().includes(search.toLowerCase())), [data.equipment, search]);
  return <div className="page-content">
    <div className="page-heading"><div><p className="overline">ДОСТУПНОЕ ОБОРУДОВАНИЕ</p><h1>Каталог</h1><p className="muted">Выберите даты, чтобы увидеть свободное количество.</p></div><CalendarDays className="heading-icon" size={36}/></div>
    <div className="filter-bar"><Field label="С даты"><input aria-label="С даты" type="date" min={today()} value={start} onChange={event => { setStart(event.target.value); if (event.target.value > end) setEnd(event.target.value); }}/></Field><Field label="По дату"><input aria-label="По дату" type="date" min={start} value={end} onChange={event => setEnd(event.target.value)}/></Field><Field label="Поиск"><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Название или категория" /></Field></div>
    <div className="catalog-grid">{equipment.map(item => {
      const total = data.units.filter(unit => unit.typeId === item.id).length;
      const available = availableCount(data, item.id, start, end);
      return <div className="equipment-card" key={item.id}>
        <div className="spread"><EquipmentIcon item={item}/><span className="category">{item.category}</span></div>
        <h2>{item.name}</h2><p className="muted">{item.description}</p>
        <div className="equipment-count"><strong>{available}</strong><span>свободно из {total}</span></div>
        <Link className={`button ${available && !item.restricted ? 'primary' : 'disabled-link'}`} to={`/${mode}/${role}/new?type=${item.id}&start=${start}&end=${end}`} aria-disabled={!available || !!item.restricted} onClick={event => { if (!available || item.restricted) event.preventDefault(); }}>{item.restricted ? 'Спецдоступ' : available ? 'Забронировать' : 'Нет в наличии'}<ChevronRight size={17}/></Link>
      </div>;
    })}</div>
    <p className="muted disclaimer">Количество в демонстрационной базе условное. Наличие рассчитано с учётом одобренных пересекающихся бронирований.</p>
  </div>;
}
