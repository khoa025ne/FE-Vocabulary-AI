import { useState } from 'react';
import { aiApi, errMsg } from '../api';
import type { GrammarResp } from '../api';
import { Icon, Mascot } from '../components/icons';

export default function Grammar() {
  const [text, setText] = useState('');
  const [res, setRes] = useState<GrammarResp | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const check = async () => {
    if (text.trim().length < 3) { setErr('Viết vài từ đã rồi hãy kiểm tra nhé.'); return; }
    setErr(''); setBusy(true); setRes(null);
    try { const { data } = await aiApi.grammar(text); setRes(data); }
    catch (e) { setErr(errMsg(e, 'AI đang bận, thử lại sau nhé.')); }
    finally { setBusy(false); }
  };

  return (
    <div className="content">
      <div className="pagehead"><h1>Sửa ngữ pháp</h1><div className="sub">Vi kiểm tra câu của bạn và gợi ý cách viết hay hơn</div></div>
      <div className="cols2">
        <div className="card">
          <div className="field"><label>Câu của bạn</label>
            <textarea className="input" value={text} onChange={(e) => setText(e.target.value)} placeholder="I go to school yesterday..." />
          </div>
          <button className="btn block mt16" disabled={busy} onClick={check}>
            <Icon n="spark" s={20} />{busy ? 'Vi đang đọc...' : 'Kiểm tra'}
          </button>
          {err && <div className="error mt8">{err}</div>}
        </div>
        <div>
          {!res && !busy && <div className="card"><div className="empty">Kết quả sẽ hiện ở đây.</div></div>}
          {busy && <div className="card"><div className="loading">Vi đang phân tích...</div></div>}
          {res && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div className="card">
                <div className="row"><h2>Kết quả</h2><span className="pill level">{res.score}/100</span></div>
                <div className="mt8"><span className="sub">Câu gốc:</span><div style={{ fontWeight: 700 }}>{res.originalText}</div></div>
                <div className="mt8"><span className="sub">Câu đã sửa:</span>
                  <div style={{ fontWeight: 800, color: 'var(--green-dark)', fontSize: 17 }}>{res.correctedText}</div></div>
              </div>
              {res.errors?.length > 0 && (
                <div className="card">
                  <h2><span className="dot r" />{res.errors.length} lỗi cần chú ý</h2>
                  {res.errors.map((e, i) => (
                    <div className="kv" key={i} style={{ display: 'block' }}>
                      <b style={{ color: 'var(--red-dark)' }}>{e.errorType}</b>
                      <div className="mt8">{e.message}</div>
                      <div className="sub mt8">Gợi ý: {e.suggestion}</div>
                    </div>
                  ))}
                </div>
              )}
              <div className="card">
                <div className="coach"><Mascot s={44} />
                  <div className="bubble"><b>Mẹo của Vi:</b> đọc to câu đã sửa 3 lần để miệng quen với cấu trúc đúng nhé.</div></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
