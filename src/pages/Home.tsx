import { Link } from 'react-router-dom';
import { ArrowUpRight, Monitor, Smartphone } from 'lucide-react';

const routes = [
  { to: '/miniapp/activist', device: 'Mini App', role: 'Активист', detail: 'Каталог, бронь, мои заявки', icon: Smartphone },
  { to: '/miniapp/admin', device: 'Mini App', role: 'Администратор', detail: 'Согласование, выдача, QR', icon: Smartphone },
  { to: '/desktop/activist', device: 'Desktop', role: 'Активист', detail: 'Каталог и календарь заявок', icon: Monitor },
  { to: '/desktop/admin', device: 'Desktop', role: 'Администратор', detail: 'Реестр, заявки, возвраты', icon: Monitor },
];

export function Home() {
  return <main className="home-page"><div className="home-wrap">
    <div className="home-eyebrow">ДЕМОНСТРАЦИЯ СИСТЕМЫ УЧЁТА И БРОНИРОВАНИЯ</div>
    <h1>PROF<span>.</span>STAFF</h1>
    <p className="home-intro">Бронирование и учёт оборудования студобъединений</p>
    <section className="routes-grid">{routes.map(route => <Link to={route.to} className="route-card" key={route.to}>
      <div className="spread"><span className="route-device"><route.icon size={20}/>{route.device}</span><ArrowUpRight size={22}/></div>
      <h2>{route.role}</h2><p>{route.detail}</p><span className="route-action">Открыть маршрут →</span>
    </Link>)}</section>

  </div></main>;
}
