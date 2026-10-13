import { useAuth } from '../auth/AuthContext';
import { Icon, Mascot } from '../components/icons';
import { useNavigate } from 'react-router-dom';

export default function Profile() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  if (!user) return null;

  return (
    <div className="content narrow">
      <div className="pagehead"><h1>Cá nhân</h1><div className="sub">Thông tin tài khoản của bạn</div></div>
      <div className="card">
        <div className="row">
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <div className="uavatar" style={{ width: 64, height: 64, fontSize: 28 }}>{user.username[0].toUpperCase()}</div>
            <div><h2>{user.fullName || user.username}</h2><div className="sub">@{user.username}</div></div>
          </div>
          <span className="pill level">{user.role}</span>
        </div>
        <div className="mt16">
          <div className="kv"><span>Email</span><b>{user.email}</b></div>
          <div className="kv"><span>Trạng thái</span><b>{user.status}</b></div>
        </div>
      </div>
      <div className="cols2">
        <div className="card center"><div className="sub"><Icon n="flame" s={18} /> Streak</div><b style={{ fontSize: 28 }}>12 ngày</b></div>
        <div className="card center"><div className="sub"><Icon n="gem" s={18} /> Kim cương</div><b style={{ fontSize: 28 }}>340</b></div>
      </div>
      <div className="card">
        <div className="coach"><Mascot s={44} />
          <div className="bubble"><b>Vi:</b> bạn đang ở trình độ <b>B1</b>. Mục tiêu tuần này: hoàn thành Business English bài 4/12.</div></div>
      </div>
      <div className="btn-row">
        <button className="btn ghost" onClick={() => nav('/favorites')}><Icon n="heart" s={20} />Từ yêu thích</button>
        <button className="btn danger-ghost" onClick={logout}><Icon n="logout" s={20} />Đăng xuất</button>
      </div>
    </div>
  );
}
