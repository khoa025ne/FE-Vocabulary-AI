import { useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { authApi, errMsg } from '../api';
import { Mascot } from '../components/icons';

export default function Otp() {
  const { state } = useLocation() as { state?: { email: string; username: string; fullName: string; password: string } };
  const nav = useNavigate();
  const [digits, setDigits] = useState<string[]>(Array(6).fill(''));
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  if (!state?.email) { nav('/login', { replace: true }); return null; }

  const set = (i: number, v: string) => {
    v = v.replace(/\D/g, '').slice(-1);
    const d = [...digits]; d[i] = v; setDigits(d);
    if (v && i < 5) refs.current[i + 1]?.focus();
  };
  const submit = async () => {
    const otp = digits.join('');
    if (otp.length < 6) { setErr('Nhập đủ 6 số nhé.'); return; }
    setErr(''); setBusy(true);
    try {
      // BE cố tình KHÔNG trả token sau verify OTP (RegisterSuccessResponse) → qua trang login đăng nhập tay
      await authApi.verifyOtp({ ...state, otp });
      nav('/login', { state: { registered: true }, replace: true });
    } catch (e) { setErr(errMsg(e, 'Mã OTP chưa đúng, thử lại nhé.')); }
    finally { setBusy(false); }
  };

  return (
    <div className="auth-wrap">
      <div className="auth-left">
        <Mascot s={120} />
        <h1>Gần xong rồi!</h1>
        <p>Chỉ còn một bước xác thực nữa thôi.<br />Kiểm tra cả hộp thư rác nếu không thấy mail nhé.</p>
      </div>
      <div className="auth-right">
        <div className="auth-card" style={{ alignItems: 'center', textAlign: 'center' }}>
          <h1>Nhập mã OTP</h1>
          <div className="sub">Mã đã gửi tới <b style={{ color: 'var(--ink)' }}>{state.email}</b></div>
          <div className="otp-row">
            {digits.map((d, i) => (
              <input key={i} ref={(el) => { refs.current[i] = el; }} className="otp" value={d}
                onChange={(e) => set(i, e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Backspace' && !d && i > 0) refs.current[i - 1]?.focus(); if (e.key === 'Enter') submit(); }} />
            ))}
          </div>
          {err && <div className="error" style={{ width: '100%' }}>{err}</div>}
          <button className="btn block" disabled={busy} onClick={submit}>{busy ? 'Đang xác thực...' : 'Xác nhận'}</button>
          <div className="sub">Chưa nhận được mã? <button className="link">Gửi lại</button></div>
        </div>
      </div>
    </div>
  );
}
