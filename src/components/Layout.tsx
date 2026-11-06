import { Link, NavLink, Outlet, useNavigate, useParams } from 'react-router-dom';
import { Archive, ClipboardList, Home, LayoutGrid, RotateCcw, ScanLine, UserRound, Wrench } from 'lucide-react';
import { useAppStore } from '../domain/store';

export function Layout() {
  const { mode, role } = useParams();
  const navigate = useNavigate();
  const reset = useAppStore(state => state.reset);
  const mini = mode === 'miniapp';
  const admin = role === 'admin';
  const root = `/${mode}/${role}`;
  const links = admin ? [
    { path: 'requests', label: 'Заявки', icon: ClipboardList },
    { path: 'equipment', label: 'Оборудование', icon: Archive },
  ] : [
    { path: 'catalog', label: 'Каталог', icon: LayoutGrid },
    { path: 'bookings', label: 'Мои заявки', icon: ClipboardList },
  ];
  const modeName = mini ? 'Mini App' : 'Desktop';
  return <div className={`app-shell ${mini ? 'mini-shell' : 'desktop-shell'}`}>
    {!mini && <aside className="sidebar">
      <Link to="/" className="brand">PROF<span>.</span>STAFF</Link>
      <div className="side-subtitle">Оборудование студобъединений</div>
      <div className="nav-list">{links.map(item => <NavLink key={item.path} to={`${root}/${item.path}`} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}><item.icon size={19}/>{item.label}</NavLink>)}</div>
      <div className="sidebar-bottom"><button className="link-button" onClick={() => { if (confirm('Восстановить демонстрационные данные?')) { reset(); navigate(root); } }}><RotateCcw size={16}/> Сбросить демо</button><Link to="/" className="link-button"><Home size={16}/> Все маршруты</Link></div>
    </aside>}
    <div className="app-main">
      <header className="topbar">
        <div>{mini && <Link to="/" className="top-brand">PROF<span>.</span>STAFF</Link>}<div className="muted top-caption">{admin ? 'Панель администратора' : 'Кабинет активиста'} · {modeName}</div></div>
        <div className="top-actions"><span className="demo-mark">ДЕМО</span><Link to={`/${mini ? 'desktop' : 'miniapp'}/${role}`} className="small-link">{mini ? <Wrench size={17}/> : <UserRound size={17}/>} {mini ? 'Desktop' : 'Mini App'}</Link></div>
      </header>
      <main className="page-body"><Outlet /></main>
      {mini && <nav className="bottom-nav">{links.map(item => <NavLink key={item.path} to={`${root}/${item.path}`} className={({ isActive }) => `bottom-item ${isActive ? 'active' : ''}`}><item.icon size={22}/><span>{item.label}</span></NavLink>)}<Link className="bottom-item" to="/"><Home size={22}/><span>Главная</span></Link></nav>}
    </div>
  </div>;
}

export function ScanButton({ onClick }: { onClick: () => void }) {
  return <button className="button primary" onClick={onClick}><ScanLine size={18}/> Сканировать QR</button>;
}
