import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { Icon, Mascot } from './icons';

const TABS = [
  { to: '/', label: 'Tổng quan', icon: 'home' as const, end: true },
  { to: '/words', label: 'Từ vựng', icon: 'book' as const },
  { to: '/speaking', label: 'Luyện nói', icon: 'mic' as const },
  { to: '/profile', label: 'Cá nhân', icon: 'user' as const },
];

export function Layout() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  return (
    <div className="web">
      <aside className="sidebar">
        <div className="brand"><Mascot s={38} />VocabularyAI</div>
        {TABS.map((t) => (
          <NavLink key={t.to} to={t.to} end={t.end} className={({ isActive }) => 'nav' + (isActive ? ' on' : '')}>
            <Icon n={t.icon} s={24} />{t.label}
          </NavLink>
        ))}
        <div className="side-coach">
          <Mascot s={40} />
          <div><span className="dot"></span><b>Vi nhắc:</b> duy trì streak mỗi ngày nhé!</div>
        </div>
        <button className="nav" onClick={logout} style={{ marginTop: 8 }}>
          <Icon n="logout" s={24} />Đăng xuất
        </button>
      </aside>
      <div className="main">
        <div className="topbar">
          <div className="stat"><Icon n="flame" s={18} /><span style={{ color: '#B57F1F' }}>12</span></div>
          <div className="stat"><Icon n="gem" s={18} /><span style={{ color: 'var(--primary)' }}>340</span></div>
          <div className="stat"><Icon n="heart" s={18} /><span style={{ color: 'var(--red)' }}>5</span></div>
          <div className="uavatar" onClick={() => nav('/profile')} style={{ cursor: 'pointer' }}>
            {(user?.username || 'U')[0].toUpperCase()}
          </div>
        </div>
        <Outlet />
      </div>
    </div>
  );
}
