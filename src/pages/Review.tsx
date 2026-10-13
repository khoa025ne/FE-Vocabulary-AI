import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { learnApi, aiApi, errMsg, daysOverdue } from '../api';
import type { ProgressItem } from '../api';
import { Mascot, Icon } from '../components/icons';

export default function Review() {
  const [queue, setQueue] = useState<ProgressItem[]>([]);
  const [i, setI] = useState(0);
  const [flip, setFlip] = useState(false);
  const [hint, setHint] = useState('');
  const [done, setDone] = useState(0);
  const [err, setErr] = useState('');
  const nav = useNavigate();

  useEffect(() => {
    learnApi.queue(20).then(({ data }) => setQueue(data.content)).catch((e) => setErr(errMsg(e)));
  }, []);

  const cur = queue[i];
  const overdue = cur ? daysOverdue(cur) : 0;
  const answer = async (ok: boolean) => {
    if (!cur) return;
    try { await learnApi.review(cur.word.id, ok); } catch { /* vẫn cho qua */ }
    setDone((d) => d + 1); setFlip(false); setHint('');
    if (i + 1 >= queue.length) setI(-1); else setI(i + 1);
  };
  const getHint = async () => {
    if (!cur) return;
    try { const { data } = await aiApi.hint(cur.id, cur.reviewCount + 1); setHint(data.hint); }
    catch { setHint('Nghĩ tới ngữ cảnh bạn đã gặp từ này nhé.'); }
  };

  if (i === -1) return (
    <div className="content narrow center" style={{ paddingTop: 80 }}>
      <Mascot s={100} />
      <h1 className="mt16">Xong phiên ôn tập!</h1>
      <div className="sub mt8">Bạn đã ôn {done} từ. Vi tự hào về bạn!</div>
      <div className="btn-row mt16"><button className="btn ghost" onClick={() => nav('/words')}>Học từ mới</button><button className="btn" onClick={() => nav('/')}>Về trang chủ</button></div>
    </div>
  );

  return (
    <div className="content narrow">
      <div className="pagehead"><h1>Ôn tập</h1><div className="sub">{queue.length === 0 ? 'Đang tải...' : `Từ ${Math.min(i + 1, queue.length)}/${queue.length}`}</div></div>
      {queue.length > 0 && <div className="progress"><i style={{ width: `${(i / queue.length) * 100}%` }} /></div>}
      {err && <div className="error">{err}</div>}
      {cur && (
        <>
          <div className="card flash" onClick={() => setFlip(!flip)}>
            {!flip ? (<><div className="big">{cur.word.word}</div><div className="sub">Bấm để lật xem nghĩa</div></>
            ) : (<><div className="big">{cur.word.word}</div><div className="mean">— nghĩa sẽ hiện sau khi bạn tự nhớ —</div>
              <div className="sub">Bạn còn nợ từ này {overdue} ngày</div></>)}
          </div>
          {hint && <div className="card"><b><Icon n="bulb" s={18} /> Gợi ý của Vi:</b><div className="mt8">{hint}</div></div>}
          <div className="btn-row">
            <button className="btn danger-ghost" onClick={() => answer(false)}>Chưa nhớ</button>
            <button className="btn ghost" onClick={getHint}><Icon n="bulb" s={20} />Gợi ý</button>
            <button className="btn green" onClick={() => answer(true)}>Đã nhớ</button>
          </div>
        </>
      )}
      {queue.length === 0 && !err && <div className="empty">Hết từ cần ôn — quay lại sau nhé!</div>}
    </div>
  );
}
