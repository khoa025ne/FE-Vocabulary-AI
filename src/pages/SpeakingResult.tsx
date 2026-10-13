import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { speakApi, errMsg } from '../api';
import type { SessionDetail } from '../api';
import { Mascot, Icon } from '../components/icons';

function Radar({ scores }: { scores: { label: string; v: number }[] }) {
  const C = 110, R = 88;
  const pt = (i: number, v: number) => {
    const a = (Math.PI * 2 * i) / scores.length - Math.PI / 2;
    const r = (R * v) / 100;
    return `${C + r * Math.cos(a)},${C + r * Math.sin(a)}`;
  };
  const poly = scores.map((s, i) => pt(i, s.v)).join(' ');
  const grid = [25, 50, 75, 100].map((g) => scores.map((_, i) => pt(i, g)).join(' '));
  return (
    <svg viewBox="0 0 220 220" width="300" height="300" style={{ margin: '0 auto', display: 'block' }}>
      {grid.map((g, i) => <polygon key={i} points={g} fill="none" stroke="var(--line)" strokeWidth="1.5" />)}
      {scores.map((s, i) => { const [x, y] = pt(i, 118).split(',').map(Number); return <text key={i} x={x} y={y} textAnchor="middle" fontSize="13" fontWeight="800" fill="var(--muted)">{s.label}</text>; })}
      <polygon points={poly} fill="rgba(21,101,192,.15)" stroke="var(--primary)" strokeWidth="2.5" />
      {scores.map((s, i) => { const [x, y] = pt(i, s.v).split(',').map(Number); return <circle key={i} cx={x} cy={y} r="4.5" fill="var(--primary)" />; })}
    </svg>
  );
}

export default function SpeakingResult() {
  const { state } = useLocation() as { state?: { sessionId: number } };
  const nav = useNavigate();
  const [d, setD] = useState<SessionDetail | null>(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    if (state?.sessionId) speakApi.sessionDetail(state.sessionId).then(({ data }) => setD(data)).catch((e) => setErr(errMsg(e)));
  }, [state]);

  if (!state?.sessionId) return <div className="content narrow center" style={{ paddingTop: 80 }}><div className="sub">Chưa có phiên nào.</div><button className="btn mt16" onClick={() => nav('/speaking')}>Luyện nói ngay</button></div>;
  if (err) return <div className="content narrow"><div className="error">{err}</div></div>;
  if (!d) return <div className="content"><div className="loading">Vi đang chấm...</div></div>;

  const last = d.attempts[d.attempts.length - 1];
  const scores = [
    { label: 'Ngữ pháp', v: 72 }, { label: 'Từ vựng', v: 80 }, { label: 'Trôi chảy', v: 65 }, { label: 'Nội dung', v: 78 },
  ];

  return (
    <div className="content">
      <div className="pagehead"><h1>Kết quả luyện nói</h1><div className="sub">{d.topic} · lần thử #{d.attemptCount}</div></div>
      <div className="cols2">
        <div className="card center">
          <h2>Bản đồ kỹ năng</h2>
          <Radar scores={scores} />
          <div className="score-big">{last?.overallScore ?? '—'}</div>
          <div className="sub">điểm tổng · {d.statistics.improvement}</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div className="card">
            <h2>Chi tiết điểm</h2>
            {scores.map((s) => (
              <div className="bar-row mt8" key={s.label}><span className="lbl">{s.label}</span><div className="progress"><i style={{ width: `${s.v}%` }} /></div><b>{s.v}</b></div>
            ))}
          </div>
          <div className="card">
            <h2>Lịch sử phiên này</h2>
            <table className="data mt8"><thead><tr><th>Lần</th><th>Điểm</th></tr></thead><tbody>
              {d.attempts.map((a) => <tr key={a.id}><td>#{a.attemptNumber}</td><td><b>{a.overallScore}</b></td></tr>)}
            </tbody></table>
          </div>
        </div>
      </div>
      <div className="card">
        <div className="coach"><Mascot s={52} />
          <div className="bubble"><b>Vi nhận xét:</b> phát âm của bạn đã tốt hơn {d.statistics.improvement}. Luyện thêm phần trôi chảy bằng cách nói chậm và đều nhịp nhé.</div></div>
      </div>
      <div className="btn-row">
        <button className="btn ghost" onClick={() => nav('/speaking')}><Icon n="mic" s={20} />Luyện tiếp</button>
        <button className="btn" onClick={() => nav('/')}>Về trang chủ</button>
      </div>
    </div>
  );
}
