import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { wordApi, errMsg } from '../api';
import type { Word } from '../api';
import { Icon } from '../components/icons';

const LEVELS = ['Tất cả', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

export default function Words() {
  const [words, setWords] = useState<Word[]>([]);
  const [level, setLevel] = useState('Tất cả');
  const [search, setSearch] = useState('');
  const [q, setQ] = useState('');
  const [fav, setFav] = useState<Set<number>>(new Set());
  const [err, setErr] = useState('');
  const nav = useNavigate();

  const load = () => {
    wordApi.list({ page: 0, size: 20, level: level === 'Tất cả' ? undefined : level, search: q || undefined })
      .then(({ data }) => setWords(data.content))
      .catch((e) => setErr(errMsg(e)));
  };
  useEffect(load, [level]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { wordApi.favorites(0, 200).then(({ data }) => setFav(new Set(data.content.map((w) => w.id)))).catch(() => {}); }, []);

  const toggleFav = async (id: number) => {
    const isFav = fav.has(id);
    try {
      if (isFav) await wordApi.unfavorite(id); else await wordApi.favorite(id);
      setFav((s) => { const n = new Set(s); isFav ? n.delete(id) : n.add(id); return n; });
    } catch (e) { setErr(errMsg(e)); }
  };

  return (
    <div className="content">
      <div className="pagehead"><h1>Khám phá từ vựng</h1><div className="sub">Tìm từ mới theo trình độ và chủ đề</div></div>
      <div className="row">
        <div style={{ position: 'relative', flex: 1 }}>
          <input className="input" style={{ paddingLeft: 48 }} placeholder="Tìm từ vựng..." value={search}
            onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { setQ(search); setTimeout(load, 0); } }} />
          <span style={{ position: 'absolute', left: 16, top: 17, color: 'var(--muted)' }}><Icon n="search" s={22} /></span>
        </div>
        <button className="btn" style={{ width: 160 }} onClick={() => { setQ(search); setTimeout(load, 0); }}>Tìm kiếm</button>
      </div>
      <div className="chips">{LEVELS.map((l) => (
        <button key={l} className={'chip' + (level === l ? ' on' : '')} onClick={() => setLevel(l)}>{l}</button>
      ))}</div>
      {err && <div className="error">{err}</div>}
      <div className="card" style={{ padding: 8 }}>
        {words.length === 0 ? <div className="empty">Chưa có từ vựng nào.</div> : words.map((w) => (
          <div className="word" key={w.id} style={{ borderBottom: '1px solid var(--line)', cursor: 'pointer' }} onClick={() => nav(`/words/${w.id}`)}>
            <div className="avatar tint-n"><Icon n="book" s={24} /></div>
            <div><div className="w">{w.word}</div><div className="m">{w.meaning}</div></div>
            <span className="pill level" style={{ marginLeft: 12 }}>{w.level}</span>
            <button className={'heart' + (fav.has(w.id) ? ' on' : '')} onClick={(e) => { e.stopPropagation(); toggleFav(w.id); }} aria-label="yêu thích">
              <Icon n="heart" s={24} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
