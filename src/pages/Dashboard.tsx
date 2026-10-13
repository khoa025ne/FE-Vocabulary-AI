import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { learnApi, errMsg, daysOverdue } from '../api';
import type { ProgressItem } from '../api';
import { Mascot } from '../components/icons';

export default function Dashboard() {
  const [queue, setQueue] = useState<ProgressItem[]>([]);
  const [total, setTotal] = useState(0);
  const [err, setErr] = useState('');
  const nav = useNavigate();

  useEffect(() => {
    learnApi.queue(10).then(({ data }) => { setQueue(data.content); setTotal(data.totalElements); })
      .catch((e) => setErr(errMsg(e)));
  }, []);

  const kpis = [
    { lbl: 'Từ đến hạn ôn', num: String(total), delta: total > 0 ? `${total} từ chờ` : 'hết nợ', dir: total > 0 ? 'down' : 'up' },
    { lbl: 'Từ đã học', num: '248', delta: '+12 tuần này', dir: 'up' },
    { lbl: 'Điểm quiz TB', num: '82', delta: '+4 điểm', dir: 'up' },
    { lbl: 'Streak', num: '12', unit: 'ngày', delta: 'kỷ lục cá nhân', dir: 'up' },
  ];

  return (
    <div className="content">
      <div className="pagehead"><h1>Tổng quan học tập</h1><div className="sub">Chào buổi sáng, Minh — hôm nay mình học gì nè?</div></div>
      {err && <div className="error">{err}</div>}
      <div className="kpi-row">
        {kpis.map((k) => (
          <div className="kpi" key={k.lbl}>
            <div className="lbl">{k.lbl}</div>
            <div className="num">{k.num}{k.unit && <span style={{ fontSize: 18 }}> {k.unit}</span>}</div>
            <div className={`delta ${k.dir}`}>{k.delta}</div>
          </div>
        ))}
      </div>
      <div className="cols2">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div className="card">
            <div className="row"><h2><span className="dot r" />Ôn tập hôm nay</h2>{total > 0 && <span className="pill warn">{total} từ</span>}</div>
            {queue.length === 0 ? (
              <div className="empty">Hết từ cần ôn — giỏi quá!</div>
            ) : (
              <table className="data mt8">
                <thead><tr><th>Từ vựng</th><th>Trễ</th><th>Lần thử</th><th /></tr></thead>
                <tbody>
                  {queue.slice(0, 5).map((q) => {
                    const od = daysOverdue(q);
                    return (
                      <tr key={q.word.id}>
                        <td><b>{q.word.word}</b></td>
                        <td style={od > 0 ? { color: 'var(--red-dark)' } : {}}><b>{od > 0 ? `${od} ngày` : 'hôm nay'}</b></td>
                        <td>{q.reviewCount}</td>
                        <td><span className="pill">ôn ngay</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
            <button className="btn block mt16" onClick={() => nav('/review')} disabled={total === 0}>Bắt đầu ôn tập</button>
          </div>
          <div className="card">
            <div className="row"><h2><span className="dot" />Hoạt động tuần</h2><span className="sub">từ · quiz · nói</span></div>
            <div className="mt8" style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: 110 }}>
              {[38, 62, 48, 78, 55, 96, 30].map((h, i) => (
                <div key={i} style={{ flex: 1, background: i === 5 ? 'var(--primary)' : 'var(--line)', borderRadius: 4, height: `${h}%` }} />
              ))}
            </div>
            <div className="sub mt8" style={{ display: 'flex', justifyContent: 'space-between' }}>
              {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((d, i) => (
                <span key={d} style={i === 5 ? { color: 'var(--primary-dark)', fontWeight: 900 } : {}}>{d}</span>
              ))}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div className="card">
            <div className="row"><h2><span className="dot g" />Học tiếp</h2><span className="pill level">B1 · Business</span></div>
            <div className="mt8"><b style={{ fontSize: 18 }}>Business English — Trung cấp</b><div className="sub">Dở dang bài 4/12</div></div>
            <div className="progress mt8"><i style={{ width: '33%' }} /></div>
            <button className="btn ghost block mt8" onClick={() => nav('/quiz')}>Tiếp tục học</button>
          </div>
          <div className="card">
            <div className="row"><h2><span className="dot" />Mục tiêu hôm nay</h2><span className="pill">6/10</span></div>
            <div className="progress mt8"><i style={{ width: '60%' }} /></div>
            <div className="sub mt8">Còn 4 hoạt động nữa là hoàn thành.</div>
          </div>
          <div className="card">
            <div className="coach">
              <Mascot s={52} />
              <div className="bubble"><b>Phân tích của Vi:</b> từ vựng M&A của bạn tiến bộ tốt. Điểm yếu hiện tại là <b>phát âm</b> — gợi ý luyện nói 10 phút hôm nay.</div>
            </div>
            <button className="btn block mt8" onClick={() => nav('/speaking')}>Luyện nói ngay</button>
          </div>
        </div>
      </div>
    </div>
  );
}
