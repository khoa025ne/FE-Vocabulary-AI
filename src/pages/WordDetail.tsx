import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { wordApi, aiApi, learnApi, errMsg } from '../api';
import type { Word, Explain } from '../api';
import { Icon, Mascot } from '../components/icons';

export default function WordDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const [word, setWord] = useState<Word | null>(null);
  const [ex, setEx] = useState<Explain | null>(null);
  const [loadingEx, setLoadingEx] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    wordApi.list({ search: '', page: 0, size: 50 }).then(({ data }) => {
      const w = data.content.find((x) => x.id === Number(id));
      if (w) setWord(w); else setErr('Không tìm thấy từ này.');
    }).catch((e) => setErr(errMsg(e)));
  }, [id]);

  const explain = async () => {
    if (!word) return;
    setLoadingEx(true);
    try { const { data } = await aiApi.explain(word.id); setEx(data); }
    catch (e) { setErr(errMsg(e, 'AI đang bận, thử lại sau nhé.')); }
    finally { setLoadingEx(false); }
  };
  const startLearn = async () => {
    if (!word) return;
    try { await learnApi.start(word.id); nav('/review'); }
    catch (e) { setErr(errMsg(e)); }
  };

  if (!word && !err) return <div className="content"><div className="loading">Đang tải...</div></div>;

  return (
    <div className="content narrow">
      <button className="link" onClick={() => nav(-1)} style={{ alignSelf: 'flex-start' }}>← Quay lại</button>
      {err && <div className="error">{err}</div>}
      {word && (
        <>
          <div className="card center" style={{ padding: 36 }}>
            <span className="pill level">{word.level}{word.category ? ` · ${word.category.name}` : ''}</span>
            <div style={{ fontSize: 44, fontWeight: 900, margin: '12px 0 4px' }}>{word.word}</div>
            <div className="sub">{word.pronunciation}</div>
            <button className="btn ghost" style={{ width: 56, minHeight: 56, padding: 0, margin: '12px auto 0' }} aria-label="nghe phát âm">
              <Icon n="vol" s={24} />
            </button>
            <div style={{ fontSize: 20, fontWeight: 800, marginTop: 16 }}>{word.meaning}</div>
            {word.example && <div className="sub mt8" style={{ fontStyle: 'italic' }}>"{word.example}"</div>}
          </div>
          <div className="btn-row">
            <button className="btn" onClick={explain} disabled={loadingEx}>
              <Icon n="spark" s={20} />{loadingEx ? 'Vi đang nghĩ...' : 'AI giải thích'}
            </button>
            <button className="btn green" onClick={startLearn}>Học từ này</button>
          </div>
          {ex && (
            <div className="card">
              <div className="coach"><Mascot s={44} />
                <div className="bubble"><b>Vi giải thích:</b> {ex.meaning}</div>
              </div>
              {ex.examples?.length > 0 && (<div className="mt16"><b>Ví dụ</b><ul style={{ margin: '8px 0 0 20px', lineHeight: 1.8, fontWeight: 600 }}>{ex.examples.map((s, i) => <li key={i}>{s}</li>)}</ul></div>)}
              {ex.synonyms?.length > 0 && (<div className="mt8"><b>Từ đồng nghĩa:</b> <span className="sub">{ex.synonyms.join(', ')}</span></div>)}
              {ex.usageTips && (<div className="mt8"><b>Mẹo dùng:</b> <span className="sub">{ex.usageTips}</span></div>)}
            </div>
          )}
        </>
      )}
    </div>
  );
}
