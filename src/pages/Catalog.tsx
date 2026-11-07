import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CalendarDays, Radio, Speaker, MicVocal, Projector, Plug, Printer, ShoppingBag } from 'lucide-react';
import { useAppStore } from '../domain/store';
import { availableCount } from '../domain/logic';
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
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const cartCount = data.cart.reduce((sum, line) => sum + line.quantity, 0);
  const filtered = useMemo(() => data.equipment.filter(item => `${item.name} ${item.category}`.toLowerCase().includes(search.toLowerCase())), [data.equipment, search]);
  const changeDate = (start: string, end: string) => {
    try { data.setCartDates(start, end); setError(''); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Некорректные даты'); }
  };
  return <div className="page-content">
    <div className="page-heading"><div><p className="overline">ОБОРУДОВАНИЕ</p><h1>Каталог</h1></div>
      <Link className="button primary cart-button" to={`/${mode}/${role}/new`}><ShoppingBag size={18}/> Заявка ({cartCount})</Link></div>
    <div className="filter-bar"><Field label="С даты"><input type="date" value={data.cartStart} onChange={e => changeDate(e.target.value, e.target.value > data.cartEnd ? e.target.value : data.cartEnd)}/></Field>
      <Field label="По дату"><input type="date" min={data.cartStart} value={data.cartEnd} onChange={e => changeDate(data.cartStart, e.target.value)}/></Field>
      <Field label="Поиск"><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Название или категория"/></Field></div>
    {error && <p className="error-text" role="alert">{error}</p>}
    <div className="catalog-grid">{filtered.map(item => {
      const total = data.units.filter(unit => unit.typeId === item.id).length;
      const available = availableCount(data, item.id, data.cartStart, data.cartEnd);
      const selected = data.cart.find(line => line.typeId === item.id)?.quantity ?? 0;
      return <div className="equipment-card" key={item.id}>
        <div className="spread"><EquipmentIcon item={item}/><span className="category">{item.category}</span></div>
        <h2>{item.name}</h2><p className="muted">{item.description}</p>
        <div className="equipment-count"><strong>{available}</strong><span>свободно из {total}</span></div>
        <button className="button primary full" disabled={item.restricted || selected >= available} onClick={() => {
          try { data.addToCart(item.id); setError(''); }
          catch (cause) { setError(cause instanceof Error ? cause.message : 'Ошибка'); }
        }}>{item.restricted ? 'Спецдоступ' : selected ? `Добавить ещё · ${selected} в заявке` : 'Добавить в заявку'}</button>
      </div>;
    })}</div>
  </div>;
}
