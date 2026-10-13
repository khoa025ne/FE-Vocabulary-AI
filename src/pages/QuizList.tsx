import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { quizApi, errMsg } from '../api';
import type { Quiz } from '../api';
import { Icon } from '../components/icons';

const LEVELS = ['Tất cả', 'A1', 'A2', 'B1', 'B2', 'C1'];

export default function QuizList() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [level, setLevel] = useState('Tất cả');
  const [err, setErr] = useState('');
  const nav = useNavigate();

  useEffect(() => {
    quizApi.list({ page: 0, size: 20, level: level === 'Tất cả' ? undefined : level })
      .then(({ data }) => setQuizzes(data.content))
      .catch((e) => setErr(errMsg(e)));
  }, [level]);

  return (
    <div className="content">
      <div className="pagehead"><h1>Quiz luyện tập</h1><div className="sub">Bấm giờ như thi thật — chọn đáp án rồi nộp bài</div></div>
      <div className="chips">{LEVELS.map((l) => (
        <button key={l} className={'chip' + (level === l ? ' on' : '')} onClick={() => setLevel(l)}>{l}</button>
      ))}</div>
      {err && <div className="error">{err}</div>}
      <div className="cols3">
        {quizzes.map((qz) => (
          <div className="card" key={qz.id}>
            <div className="row"><span className="pill level">{qz.level}</span><span className="sub"><Icon n="clock" s={16} /> {qz.timeLimit} phút</span></div>
            <h2 className="mt8">{qz.title}</h2>
            <div className="sub mt8">{qz.questionCount} câu hỏi{qz.category ? ` · ${qz.category}` : ''}</div>
            <button className="btn block mt16" onClick={() => nav(`/quiz/${qz.id}`)}>Làm bài</button>
          </div>
        ))}
      </div>
      {quizzes.length === 0 && !err && <div className="empty">Chưa có quiz nào ở trình độ này.</div>}
    </div>
  );
}
