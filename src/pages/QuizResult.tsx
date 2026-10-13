import { useLocation, useNavigate } from 'react-router-dom';
import type { QuizResult as R } from '../api';
import { Mascot, Icon } from '../components/icons';

export default function QuizResult() {
  const { state } = useLocation() as { state?: { result: R; title?: string } };
  const nav = useNavigate();
  const r = state?.result;

  if (!r) return (
    <div className="content narrow center" style={{ paddingTop: 80 }}>
      <div className="sub">Không có kết quả để hiển thị.</div>
      <button className="btn mt16" onClick={() => nav('/quiz')}>Về danh sách quiz</button>
    </div>
  );

  const pct = Math.round((r.correctAnswers / r.totalQuestions) * 100);
  const R_ = 54, C = 2 * Math.PI * R_;

  return (
    <div className="content narrow center">
      <div style={{ color: 'var(--yellow-dark)', margin: '20px auto 0' }}><Icon n="trophy" s={72} /></div>
      <h1 className="mt8">{pct >= 80 ? 'Tuyệt vời!' : pct >= 50 ? 'Khá tốt!' : 'Cố gắng thêm nhé!'}</h1>
      <div className="sub">Bạn làm đúng {r.correctAnswers}/{r.totalQuestions} câu{r.score !== undefined && r.score !== pct ? ` · ${r.score} điểm` : ''}</div>
      <div style={{ margin: '24px auto', width: 140 }}>
        <svg viewBox="0 0 140 140" width="140" height="140">
          <circle cx="70" cy="70" r={R_} fill="none" stroke="var(--line)" strokeWidth="14" />
          <circle cx="70" cy="70" r={R_} fill="none" stroke="var(--primary)" strokeWidth="14" strokeLinecap="round"
            strokeDasharray={C} strokeDashoffset={C * (1 - pct / 100)} transform="rotate(-90 70 70)" />
          <text x="70" y="82" textAnchor="middle" fontSize="34" fontWeight="900" fill="var(--ink)">{pct}</text>
        </svg>
      </div>
      <div className="cols3" style={{ textAlign: 'left' }}>
        <div className="card center"><div className="sub"><Icon n="clock" s={16} /> Thời gian</div><b style={{ fontSize: 22 }}>—</b></div>
        <div className="card center"><div className="sub"><Icon n="zap" s={16} /> Điểm</div><b style={{ fontSize: 22, color: 'var(--yellow-dark)' }}>{r.score ?? pct}</b></div>
        <div className="card center"><div className="sub"><Icon n="checkc" s={16} /> Đúng</div><b style={{ fontSize: 22 }}>{r.correctAnswers}/{r.totalQuestions}</b></div>
      </div>
      {r.feedback && (
        <div className="card mt16" style={{ textAlign: 'left' }}>
          <div className="coach"><Mascot s={44} /><div className="bubble"><b>Vi nhận xét:</b> {r.feedback}</div></div>
        </div>
      )}
      <div className="btn-row mt16">
        <button className="btn ghost" onClick={() => nav('/quiz')}>Quiz khác</button>
        <button className="btn" onClick={() => nav('/')}>Về trang chủ</button>
      </div>
    </div>
  );
}
