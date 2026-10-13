import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { wordApi, errMsg } from '../api';
import type { Word } from '../api';
import { Icon } from '../components/icons';

export default function Favorites() {
  const [words, setWords] = useState<Word[]>([]);
  const [err, setErr] = useState('');
  const nav = useNavigate();

  const load = () => wordApi.favorites(0, 50)
    .then(({ data }) => setWords(data.content))
    .catch((e) => setErr(errMsg(e)));
  useEffect(() => { load(); }, []);

  const remove = async (id: number) => {
    try { await wordApi.unfavorite(id); setWords((w) => w.filter((x) => x.id !== id)); }
    catch (e) { setErr(errMsg(e)); }
  };

  return (
    <div className="content">
      <div className="pagehead"><h1>Từ yêu thích</h1><div className="sub">{words.length} từ bạn đã đánh dấu</div></div>
      {err && <div className="error">{err}</div>}
      <div className="card" style={{ padding: 8 }}>
        {words.length === 0 ? (
          <div className="empty">Chưa có từ yêu thích nào.<br />Bấm vào trái tim ở trang Từ vựng để lưu lại nhé.</div>
        ) : words.map((w) => (
          <div className="word" key={w.id} style={{ borderBottom: '1px solid var(--line)', cursor: 'pointer' }} onClick={() => nav(`/words/${w.id}`)}>
            <div className="avatar tint-n"><Icon n="book" s={24} /></div>
            <div><div className="w">{w.word}</div><div className="m">{w.meaning}</div></div>
            <span className="pill level" style={{ marginLeft: 12 }}>{w.level}</span>
            <button className="heart on" onClick={(e) => { e.stopPropagation(); remove(w.id); }} aria-label="bỏ yêu thích">
              <Icon n="heart" s={24} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
