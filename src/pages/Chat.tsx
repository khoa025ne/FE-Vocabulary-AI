import { useEffect, useRef, useState } from 'react';
import { aiApi, errMsg } from '../api';
import type { Conversation, ChatMsg } from '../api';
import { Icon, Mascot } from '../components/icons';

export default function Chat() {
  const [convs, setConvs] = useState<Conversation[]>([]);
  const [cur, setCur] = useState<number | null>(null);
  const [msgs, setMsgs] = useState<ChatMsg[]>([]);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const bottom = useRef<HTMLDivElement>(null);

  useEffect(() => {
    aiApi.listConv().then(({ data }) => {
      setConvs(data.content);
      if (data.content[0]) openConv(data.content[0].id);
    }).catch(() => {});
  }, []);
  useEffect(() => bottom.current?.scrollIntoView({ behavior: 'smooth' }), [msgs]);

  const openConv = (id: number) => {
    setCur(id);
    aiApi.convMsgs(id).then(({ data }) => setMsgs(data.messages || [])).catch((e) => setErr(errMsg(e)));
  };
  const newConv = async () => {
    try {
      const { data } = await aiApi.createConv('GENERAL', 'Trò chuyện mới');
      setConvs((c) => [data, ...c]); openConv(data.id);
    } catch (e) { setErr(errMsg(e)); }
  };
  const send = async () => {
    if (!text.trim() || busy) return;
    let cid = cur;
    if (!cid) {
      try { const { data } = await aiApi.createConv('GENERAL', text.slice(0, 30)); cid = data.id; setConvs((c) => [data, ...c]); setCur(cid); }
      catch (e) { setErr(errMsg(e)); return; }
    }
    const content = text; setText(''); setBusy(true);
    setMsgs((m) => [...m, { id: Date.now(), conversationId: cid!, role: 'USER', content }]);
    try {
      const { data } = await aiApi.sendMsg(cid!, content);
      setMsgs((m) => [...m, data]);
    } catch (e) { setErr(errMsg(e, 'Vi chưa trả lời được, thử lại nhé.')); }
    finally { setBusy(false); }
  };

  return (
    <div className="content">
      <div className="pagehead"><h1>Trò chuyện với Vi</h1><div className="sub">Hỏi ngữ pháp, từ vựng, cách diễn đạt — Vi trả lời 24/7</div></div>
      <div className="cols2" style={{ gridTemplateColumns: '280px 1fr', alignItems: 'start' }}>
        <div className="card" style={{ padding: 10 }}>
          <button className="btn ghost block" style={{ minHeight: 48 }} onClick={newConv}><Icon n="pen" s={18} />Đoạn chat mới</button>
          <div className="mt8" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {convs.map((c) => (
              <button key={c.id} className={'nav' + (cur === c.id ? ' on' : '')} style={{ fontSize: 14 }} onClick={() => openConv(c.id)}>
                <Icon n="msg" s={20} /><span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.title}</span>
              </button>
            ))}
            {convs.length === 0 && <div className="empty">Chưa có đoạn chat nào.</div>}
          </div>
        </div>
        <div className="card" style={{ minHeight: 560, display: 'flex', flexDirection: 'column' }}>
          {err && <div className="error">{err}</div>}
          <div className="chat" style={{ flex: 1, overflowY: 'auto', maxHeight: 520 }}>
            {msgs.length === 0 && (
              <div className="center" style={{ padding: 40 }}>
                <Mascot s={72} />
                <div className="sub mt8">Chào bạn! Hỏi Vi bất cứ gì về tiếng Anh nhé.</div>
              </div>
            )}
            {msgs.map((m) => (
              <div key={m.id} className={'msg ' + (m.role === 'USER' ? 'me' : 'ai')}>{m.content}</div>
            ))}
            {busy && <div className="msg ai">Vi đang gõ...</div>}
            <div ref={bottom} />
          </div>
          <div className="chatbar mt16">
            <input className="input" value={text} onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && send()} placeholder="Hỏi Vi điều gì đó..." />
            <button className="btn" onClick={send} aria-label="gửi"><Icon n="send" s={22} /></button>
          </div>
        </div>
      </div>
    </div>
  );
}
