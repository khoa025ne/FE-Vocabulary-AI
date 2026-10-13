import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { speakApi, errMsg } from '../api';
import type { SpeakSession } from '../api';
import { Icon, Mascot } from '../components/icons';

const TOPICS = ['Giới thiệu bản thân', 'Kể về cuối tuần', 'Món ăn yêu thích', 'Công việc mơ ước', 'Chuyến du lịch đáng nhớ'];
const LEVELS = ['A1', 'A2', 'B1', 'B2'];

export default function Speaking() {
  const [topic, setTopic] = useState(TOPICS[0]);
  const [level, setLevel] = useState('B1');
  const [session, setSession] = useState<SpeakSession | null>(null);
  const [rec, setRec] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const mr = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const nav = useNavigate();

  const startSession = async () => {
    setErr(''); setBusy(true);
    try { const { data } = await speakApi.createSession(topic, level); setSession(data); }
    catch (e) { setErr(errMsg(e)); }
    finally { setBusy(false); }
  };

  const toggleRec = async () => {
    if (rec) {
      mr.current?.stop(); setRec(false); return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      chunks.current = [];
      const m = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      m.ondataavailable = (e) => { if (e.data.size) chunks.current.push(e.data); };
      m.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        if (!session) return;
        setBusy(true);
        try {
          await speakApi.uploadAttempt(session.id, new Blob(chunks.current, { type: 'audio/webm' }));
          nav('/speaking/result', { state: { sessionId: session.id } });
        } catch (e) { setErr(errMsg(e, 'Gửi bản ghi lỗi, thử lại nhé.')); setBusy(false); }
      };
      mr.current = m; m.start(); setRec(true);
    } catch { setErr('Không truy cập được micro. Cho phép quyền micro rồi thử lại nhé.'); }
  };

  return (
    <div className="content narrow">
      <div className="pagehead"><h1>Luyện nói</h1><div className="sub">Nói theo chủ đề — AI chấm phát âm, ngữ pháp, độ trôi chảy</div></div>
      {err && <div className="error">{err}</div>}
      {!session ? (
        <div className="card">
          <div className="field"><label>Chủ đề</label>
            <div className="chips">{TOPICS.map((t) => (
              <button key={t} className={'chip' + (topic === t ? ' on' : '')} onClick={() => setTopic(t)}>{t}</button>
            ))}</div></div>
          <div className="field mt16"><label>Trình độ</label>
            <div className="chips">{LEVELS.map((l) => (
              <button key={l} className={'chip' + (level === l ? ' on' : '')} onClick={() => setLevel(l)}>{l}</button>
            ))}</div></div>
          <button className="btn block mt16" disabled={busy} onClick={startSession}>
            <Icon n="mic" s={20} />{busy ? 'Đang tạo...' : 'Bắt đầu phiên luyện nói'}
          </button>
        </div>
      ) : (
        <div className="card center" style={{ padding: 40 }}>
          <span className="pill">{topic} · {level}</span>
          <h2 className="mt16">Hãy nói về: "{topic}"</h2>
          <div className="sub mt8">Nói tự nhiên 30–60 giây, rồi bấm dừng để Vi chấm điểm.</div>
          <div className="mt16">
            {rec ? (
              <><div className="wave">{Array.from({ length: 9 }).map((_, i) => <i key={i} />)}</div>
                <div className="sub mt8" style={{ color: 'var(--red-dark)', fontWeight: 900 }}>Đang ghi...</div></>
            ) : (
              <button className="rec" onClick={toggleRec} disabled={busy} aria-label="ghi âm">
                <Icon n="mic" s={44} />
              </button>
            )}
          </div>
          <div className="mt16">
            {rec
              ? <button className="btn danger-ghost" onClick={toggleRec}>Dừng & gửi chấm</button>
              : <button className="btn ghost" onClick={toggleRec} disabled={busy}>{busy ? 'Đang gửi...' : 'Bấm để ghi âm'}</button>}
          </div>
          <div className="coach mt16" style={{ textAlign: 'left' }}>
            <Mascot s={44} />
            <div className="bubble"><b>Mẹo:</b> nói chậm rãi, nhấn trọng âm đúng — điểm fluency sẽ cao hơn nói nhanh mà vấp.</div>
          </div>
        </div>
      )}
    </div>
  );
}
