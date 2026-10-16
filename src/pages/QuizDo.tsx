import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { quizApi, aiApi, errMsg } from '../api';
import type { QuizDetail, Attempt } from '../api';
import { Icon } from '../components/icons';

export default function QuizDo() {
  const { id } = useParams();
  const nav = useNavigate();
  const [quiz, setQuiz] = useState<QuizDetail | null>(null);
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [secs, setSecs] = useState(0);
  const [hint, setHint] = useState<Record<number, string>>({});
  const [err, setErr] = useState('');
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => {
    const qid = Number(id);
    Promise.all([quizApi.detail(qid), quizApi.start(qid)])
      .then(([{ data: q }, { data: a }]) => {
        setQuiz(q); setAttempt(a);
        // TEMP BUG-05: BE thiếu `expiresAt` → FE tự tính từ startedAt + timeLimit (phút, theo QuizList).
        // BE trả expiresAt thật thì dùng luôn, không ảnh hưởng.
        const exp = a.expiresAt || new Date(new Date(a.startedAt).getTime() + (q.timeLimit || 0) * 60000).toISOString();
        setSecs(Math.max(0, Math.floor((new Date(exp).getTime() - Date.now()) / 1000)));
      })
      .catch((e) => setErr(errMsg(e, 'Không mở được quiz này.')));
    return () => clearInterval(timer.current);
  }, [id]);

  useEffect(() => {
    if (secs <= 0) return;
    timer.current = window.setInterval(() => setSecs((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(timer.current);
  }, [attempt]);

  const mm = String(Math.floor(secs / 60)).padStart(2, '0');
  const ss = String(secs % 60).padStart(2, '0');

  const getHint = async (qid: number) => {
    try { const { data } = await aiApi.hint(qid, 1); setHint((h) => ({ ...h, [qid]: data.hint })); }
    catch { setHint((h) => ({ ...h, [qid]: 'Loại trừ đáp án bạn chắc chắn sai trước nhé.' })); }
  };

  const submit = async () => {
    if (!attempt) return;
    const payload = Object.entries(answers).map(([questionId, answer]) => ({ questionId: Number(questionId), answer }));
    if (payload.length < (quiz?.questions.length || 0) && !confirm(`Bạn mới làm ${payload.length}/${quiz?.questions.length} câu. Nộp luôn?`)) return;
    try {
      const { data } = await quizApi.submit(attempt.attemptId, payload);
      nav(`/quiz/${id}/result`, { state: { result: data, title: quiz?.title } });
    } catch (e) { setErr(errMsg(e, 'Nộp bài lỗi, thử lại nhé.')); }
  };

  if (err && !quiz) return <div className="content narrow"><div className="error">{err}</div></div>;
  if (!quiz) return <div className="content"><div className="loading">Đang tải đề...</div></div>;

  return (
    <div className="content narrow">
      <div className="row">
        <div><h1 style={{ fontSize: 24 }}>{quiz.title}</h1><div className="sub">{quiz.questions.length} câu</div></div>
        <div className="timer"><Icon n="clock" s={22} />{mm}:{ss}</div>
      </div>
      <div className="progress"><i style={{ width: `${(Object.keys(answers).length / quiz.questions.length) * 100}%` }} /></div>
      {err && <div className="error">{err}</div>}
      {quiz.questions.map((q, qi) => (
        <div className="card" key={q.id}>
          <b>Câu {qi + 1}: {q.content}</b>
          <div className="quiz-opt-grid mt8">
            {q.options.map((op, oi) => (
              <button key={oi} className={'opt' + (answers[q.id] === oi ? ' sel' : '')} onClick={() => setAnswers((a) => ({ ...a, [q.id]: oi }))}>
                <span className="k">{'ABCD'[oi]}</span>{op}
              </button>
            ))}
          </div>
          {hint[q.id]
            ? <div className="sub mt8"><b>Gợi ý:</b> {hint[q.id]}</div>
            : <button className="link mt8" onClick={() => getHint(q.id)}><Icon n="bulb" s={16} /> Xin gợi ý từ Vi</button>}
        </div>
      ))}
      <button className="btn block" onClick={submit}>Nộp bài</button>
    </div>
  );
}
