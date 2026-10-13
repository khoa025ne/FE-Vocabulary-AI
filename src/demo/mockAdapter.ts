import type { AxiosAdapter, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import {
  WORDS, FAV_IDS, REVIEW, QUIZZES, attemptQuiz,
} from './mockData';
import type {
  Attempt, AuthResp, ChatMsg, Conversation, Explain, GrammarResp, Hint,
  Page, ProgressItem, Quiz, QuizDetail, QuizResult, RegisterSuccess,
  SessionDetail, SpeakAttempt, SpeakSession, User, Word,
} from '../api';

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
const rnd = (a: number, b: number) => Math.round(a + Math.random() * (b - a));
const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

let attemptSeq = 9000;
let msgSeq = 50000;
let convSeq = 800;
const convList: Conversation[] = [
  { id: 701, type: 'GENERAL', title: 'Hỏi về thì hiện tại hoàn thành', createdAt: new Date(Date.now() - 86400000).toISOString() },
  { id: 702, type: 'GENERAL', title: 'Phân biệt "affect" và "effect"', createdAt: new Date(Date.now() - 3 * 86400000).toISOString() },
];
const convMsgs = new Map<number, ChatMsg[]>([
  [701, [
    { id: 1, conversationId: 701, role: 'USER', content: 'Khi nào dùng thì hiện tại hoàn thành vậy Vi?' },
    { id: 2, conversationId: 701, role: 'ASSISTANT', content: 'Dùng khi hành động xảy ra trong quá khứ nhưng còn liên quan tới hiện tại nha. Ví dụ: "I have finished my homework" — làm xong rồi, giờ rảnh. Dấu hiệu nhận biết: already, just, yet, ever, never, since, for.' },
  ]],
  [702, [
    { id: 3, conversationId: 702, role: 'USER', content: 'Phân biệt affect và effect giúp mình.' },
    { id: 4, conversationId: 702, role: 'ASSISTANT', content: '"Affect" thường là động từ (gây ảnh hưởng), "effect" thường là danh từ (kết quả). Mẹo nhớ: A = Action, E = End result. Ví dụ: "Rain affects traffic" / "The effect was huge."' },
  ]],
]);

function page<T>(items: T[], p: number, size: number): Page<T> {
  const totalPages = Math.max(1, Math.ceil(items.length / size));
  const content = items.slice(p * size, p * size + size);
  return { content, pageable: { pageNumber: p, pageSize: size, totalElements: items.length, totalPages } };
}

const SYNONYMS: Record<string, string[]> = {
  abandon: ['give up', 'leave behind', 'desert'],
  achieve: ['accomplish', 'attain', 'reach'],
  brave: ['courageous', 'fearless', 'bold'],
  curious: ['inquisitive', 'interested', 'eager to learn'],
  grateful: ['thankful', 'appreciative'],
  improve: ['enhance', 'better', 'upgrade'],
  inspire: ['motivate', 'encourage', 'stimulate'],
  patient: ['tolerant', 'calm', 'understanding'],
};

function explainFor(word: Word): Explain {
  return {
    wordId: word.id, word: word.word, meaning: word.meaning,
    examples: [
      word.example || `This is an example with "${word.word}".`,
      `Try using "${word.word}" in your own sentence today.`,
    ],
    synonyms: SYNONYMS[word.word] || ['xem thêm trong từ điển'],
    usageTips: `Dùng "${word.word}" trong văn nói trang trọng và văn viết học thuật. Chú ý phát âm ${word.pronunciation || ''} — luyện nói to 3 lần để nhớ lâu.`,
    tokensUsed: rnd(120, 220), source: 'demo-ai',
  };
}

const VI_REPLIES = [
  'Hay đó! Để Vi giải thích kỹ hơn nha: câu này dùng thì hiện tại đơn vì diễn tả thói quen. Nhớ công thức S + V(s/es) nhé.',
  'Vi hiểu rồi! Mẹo nhỏ: khi học từ mới, đặt 1 câu ví dụ của riêng bạn — não sẽ nhớ lâu gấp 3 lần so với chỉ đọc nghĩa.',
  'Câu hỏi thú vị! Quy tắc chung: tính từ đứng trước danh từ (a beautiful day), trạng từ bổ nghĩa cho động từ (speak slowly).',
  'Đúng hướng rồi đó! Vi gợi ý thêm: mỗi ngày ôn 10 từ cũ trước khi học từ mới — đó là cách chống quên hiệu quả nhất.',
];

function grammarFor(text: string): GrammarResp {
  const errors: GrammarResp['errors'] = [];
  let corrected = text.trim();
  const fixes: Array<[RegExp, string, string, string]> = [
    [/\beated\b/gi, 'ate', 'Thì quá khứ', '"eat" là động từ bất quy tắc: eat → ate → eaten.'],
    [/\bgoed\b/gi, 'went', 'Thì quá khứ', '"go" là động từ bất quy tắc: go → went → gone.'],
    [/\bwrited\b/gi, 'wrote', 'Thì quá khứ', '"write" là động từ bất quy tắc: write → wrote → written.'],
    [/\bspeaked\b/gi, 'spoke', 'Thì quá khứ', '"speak" là động từ bất quy tắc: speak → spoke → spoken.'],
    [/\bbuyed\b/gi, 'bought', 'Thì quá khứ', '"buy" là động từ bất quy tắc: buy → bought → bought.'],
    [/\bteached\b/gi, 'taught', 'Thì quá khứ', '"teach" là động từ bất quy tắc: teach → taught → taught.'],
    [/\bthinked\b/gi, 'thought', 'Thì quá khứ', '"think" là động từ bất quy tắc: think → thought → thought.'],
  ];
  for (const [re, to, type, msg] of fixes) {
    if (re.test(corrected)) {
      corrected = corrected.replace(re, (m) => (m[0] === m[0].toUpperCase() ? to[0].toUpperCase() + to.slice(1) : to));
      errors.push({ errorType: type, message: msg, suggestion: `Dùng "${to}" thay cho dạng sai.` });
    }
  }
  if (/^i\b/.test(corrected)) {
    corrected = 'I' + corrected.slice(1);
    errors.push({ errorType: 'Viết hoa', message: 'Đại từ "I" luôn viết hoa trong tiếng Anh.', suggestion: 'Viết hoa chữ I ở đầu câu.' });
  }
  corrected = corrected.charAt(0).toUpperCase() + corrected.slice(1);
  if (!/[.!?]$/.test(corrected)) {
    corrected += '.';
    errors.push({ errorType: 'Dấu câu', message: 'Câu thiếu dấu kết thúc.', suggestion: 'Thêm dấu chấm ở cuối câu.' });
  }
  const score = Math.max(40, 100 - errors.length * 12);
  return { originalText: text, correctedText: corrected, score, errors, tokensUsed: rnd(80, 160) };
}

function hintFor(progressId: number, attemptCount: number): Hint {
  const item = REVIEW.find((r) => r.id === progressId);
  const w = item ? item.word.word : 'từ này';
  const hints = [
    `Từ bắt đầu bằng chữ "${w[0].toUpperCase()}" và có ${w.length} chữ cái.`,
    `Nghĩ tới câu ví dụ bạn đã gặp "${w}" — ngữ cảnh giúp nhớ nhanh hơn.`,
    `Từ này thuộc trình độ ${item ? item.word.level : 'B1'}. Đọc to phát âm 3 lần rồi đoán nghĩa.`,
  ];
  return {
    progressId, word: w, attemptCount,
    hint: hints[Math.min(attemptCount - 1, hints.length - 1)] || hints[0],
    difficulty: attemptCount > 2 ? 'easy' : 'medium', tokensUsed: rnd(40, 90),
  };
}

function speakResult(sessionId: number): SessionDetail {
  const mk = (n: number) => ({
    id: n, attemptNumber: n, overallScore: rnd(68, 88),
  });
  return {
    id: sessionId, topic: 'Giới thiệu bản thân', level: 'B1',
    startedAt: new Date(Date.now() - 300000).toISOString(), status: 'COMPLETED',
    attemptCount: 1, attempts: [mk(1)],
    statistics: { averageScore: 76, bestScore: 82, improvement: '+6 so với lần trước. Phát âm đã rõ hơn, chú ý trọng âm từ 2 âm tiết nhé!' },
  };
}

/* ---------------- adapter ---------------- */

export const mockAdapter: AxiosAdapter = async (config: InternalAxiosRequestConfig) => {
  await delay(rnd(250, 650));
  const method = (config.method || 'get').toLowerCase();
  const url = config.url || '';
  const params = config.params || {};
  let body: Record<string, unknown> = {};
  try { body = typeof config.data === 'string' ? JSON.parse(config.data) : (config.data || {}); }
  catch { body = {}; }

  const ok = <T,>(data: T, message = 'OK'): AxiosResponse => ({
    data: { success: true, message, data, timestamp: new Date().toISOString() } as unknown as T,
    status: 200, statusText: 'OK', headers: {}, config,
  });

  const fail = (status: number, message: string): Promise<never> => {
    const err = Object.assign(new Error(message), {
      isAxiosError: true,
      config,
      response: { data: { success: false, message, data: null }, status, statusText: 'Error', headers: {}, config },
    });
    return Promise.reject(err);
  };

  // ---- auth ----
  if (method === 'post' && url === '/api/auth/register/validate') return ok({ message: 'Thông tin hợp lệ. Mã OTP đã gửi tới email của bạn (demo: nhập 6 số bất kỳ).' });
  if (method === 'post' && url === '/api/auth/register/verify-otp') {
    const s = body as { email?: string; username?: string; fullName?: string };
    const rs: RegisterSuccess = {
      message: 'Đăng ký thành công! Hãy đăng nhập để bắt đầu học.',
      email: String(s.email || ''), username: String(s.username || ''),
      fullName: String(s.fullName || ''), status: 'ACTIVE',
      instruction: 'Vui lòng đăng nhập bằng tài khoản vừa tạo.',
    };
    return ok(rs);
  }
  if (method === 'post' && url === '/api/auth/login') {
    const id = String((body as { emailOrUsername?: string }).emailOrUsername || 'demo@vocab.ai');
    const user: User = { id: 1, email: id.includes('@') ? id : `${id}@vocab.ai`, username: id.split('@')[0], fullName: 'Học viên Demo', role: 'STUDENT', status: 'ACTIVE' };
    const resp: AuthResp = { accessToken: 'demo-access-token', refreshToken: 'demo-refresh-token', expiresIn: 3600, user, message: 'Đăng nhập thành công' };
    return ok(resp);
  }
  if (method === 'post' && url === '/api/auth/logout') return ok({});
  if (method === 'post' && url === '/api/auth/refresh') return ok({ accessToken: 'demo-access-token-2', refreshToken: 'demo-refresh-token-2' });

  // ---- words ----
  if (method === 'get' && url === '/api/words/favorites')
    return ok(page(WORDS.filter((w) => FAV_IDS.has(w.id)), Number(params.page || 0), Number(params.size || 20)));
  if (method === 'get' && url === '/api/words') {
    let list = WORDS.slice();
    if (params.level) list = list.filter((w) => w.level === params.level);
    if (params.category) list = list.filter((w) => w.category?.name === params.category);
    if (params.search) {
      const q = String(params.search).toLowerCase();
      list = list.filter((w) => w.word.includes(q) || w.meaning.toLowerCase().includes(q));
    }
    return ok(page(list, Number(params.page || 0), Number(params.size || 20)));
  }
  const favMatch = url.match(/^\/api\/words\/(\d+)\/favorite$/);
  if (favMatch) {
    const id = Number(favMatch[1]);
    if (method === 'post') { FAV_IDS.add(id); return ok({}); }
    if (method === 'delete') { FAV_IDS.delete(id); return ok({}); }
  }

  // ---- learning ----
  const startMatch = url.match(/^\/api\/learning\/words\/(\d+)\/start$/);
  if (method === 'post' && startMatch) return ok({});
  const reviewMatch = url.match(/^\/api\/learning\/words\/(\d+)\/review$/);
  if (method === 'post' && reviewMatch) return ok({ correct: (body as { correct?: boolean }).correct });
  if (method === 'get' && url === '/api/learning/review-queue') {
    const items: ProgressItem[] = REVIEW.slice(0, Number(params.size || 10));
    return ok({ content: items, totalElements: REVIEW.length, totalPages: 1 });
  }

  // ---- quiz ----
  if (method === 'get' && url === '/api/quizzes') {
    const qs: Quiz[] = QUIZZES.map((q) => q.quiz);
    return ok(page(qs, Number(params.page || 0), Number(params.size || 20)));
  }
  const qDetail = url.match(/^\/api\/quizzes\/(\d+)$/);
  if (method === 'get' && qDetail) {
    const seed = QUIZZES.find((q) => q.quiz.id === Number(qDetail[1]));
    if (!seed) return fail(404, 'Không tìm thấy quiz.');
    const detail: QuizDetail = {
      ...seed.quiz, totalQuestions: seed.questions.length,
      questions: seed.questions.map(({ id, content, options }) => ({ id, content, options })),
    };
    return ok(detail);
  }
  const qStart = url.match(/^\/api\/quizzes\/(\d+)\/start$/);
  if (method === 'post' && qStart) {
    const seed = QUIZZES.find((q) => q.quiz.id === Number(qStart[1]));
    if (!seed) return fail(404, 'Không tìm thấy quiz.');
    const attemptId = attemptSeq++;
    attemptQuiz.set(attemptId, seed.quiz.id);
    const a: Attempt = {
      attemptId, quizId: seed.quiz.id,
      startedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + seed.quiz.timeLimit * 60000).toISOString(),
    };
    return ok(a);
  }
  const qSubmit = url.match(/^\/api\/quizzes\/(\d+)\/submit$/);
  if (method === 'post' && qSubmit) {
    const quizId = attemptQuiz.get(Number(qSubmit[1]));
    const seed = QUIZZES.find((q) => q.quiz.id === quizId);
    if (!seed) return fail(404, 'Attempt không hợp lệ.');
    const answers = (body as { answers?: Array<{ questionId: number; answer: number }> }).answers || [];
    let correct = 0;
    for (const q of seed.questions) {
      const a = answers.find((x) => x.questionId === q.id);
      if (a && a.answer === q.correct) correct++;
    }
    const total = seed.questions.length;
    const score = Math.round((correct / total) * 100);
    const result: QuizResult = {
      attemptId: Number(qSubmit[1]), score, totalQuestions: total, correctAnswers: correct,
      feedback: score >= 80 ? 'Xuất sắc! Bạn nắm chắc kiến thức này rồi.' : score >= 60 ? 'Khá tốt! Ôn lại vài câu sai là ổn.' : 'Cố gắng thêm nhé — Vi gợi ý ôn lại từ vựng tuần này.',
    };
    return ok(result);
  }

  // ---- ai ----
  if (method === 'post' && url === '/api/v1/ai/vocabulary/explain') {
    const wid = Number((body as { wordId?: number }).wordId);
    const w = WORDS.find((x) => x.id === wid) || WORDS[0];
    return ok(explainFor(w));
  }
  if (method === 'post' && url === '/api/v1/ai/grammar') {
    const text = String((body as { text?: string }).text || '');
    if (text.trim().length < 3) return fail(400, 'Viết vài từ đã rồi hãy kiểm tra nhé.');
    return ok(grammarFor(text));
  }
  if (method === 'post' && url === '/api/v1/ai/hints/generate') {
    const b = body as { learningProgressId?: number; attemptCount?: number };
    const h: Hint = hintFor(Number(b.learningProgressId), Number(b.attemptCount || 1));
    return ok(h);
  }
  if (method === 'post' && url === '/api/v1/ai/conversations') {
    const b = body as { type?: string; title?: string };
    const c: Conversation = { id: convSeq++, type: String(b.type || 'GENERAL'), title: String(b.title || 'Trò chuyện mới'), createdAt: new Date().toISOString() };
    convList.unshift(c);
    return ok(c);
  }
  if (method === 'get' && url === '/api/v1/ai/conversations') {
    return ok(page(convList, Number(params.page || 0), Number(params.size || 20)));
  }
  const cMsgs = url.match(/^\/api\/v1\/ai\/conversations\/(\d+)\/messages$/);
  if (cMsgs) {
    const cid = Number(cMsgs[1]);
    if (method === 'get') return ok(page(convMsgs.get(cid) || [], Number(params.page || 0), Number(params.size || 50)));
    if (method === 'post') {
      const content = String((body as { content?: string }).content || '');
      const arr = convMsgs.get(cid) || [];
      arr.push({ id: msgSeq++, conversationId: cid, role: 'USER', content });
      const reply: ChatMsg = { id: msgSeq++, conversationId: cid, role: 'ASSISTANT', content: pick(VI_REPLIES), tokensUsed: rnd(60, 140) };
      arr.push(reply);
      convMsgs.set(cid, arr);
      return ok(reply);
    }
  }

  // ---- speaking ----
  if (method === 'post' && url === '/api/ai/speaking/sessions') {
    const b = body as { topic?: string; level?: string };
    const s: SpeakSession = { id: rnd(1000, 9999), topic: String(b.topic || 'Giới thiệu bản thân'), level: String(b.level || 'B1'), startedAt: new Date().toISOString(), status: 'ACTIVE' };
    return ok(s);
  }
  if (method === 'post' && url.startsWith('/api/ai/speaking/attempts')) {
    const sessionId = Number(new URL(url, 'http://x').searchParams.get('sessionId') || 0);
    const a: SpeakAttempt = {
      attemptId: rnd(10000, 99999), sessionId, attemptNumber: 1,
      audioUrl: '', audioDurationSeconds: rnd(20, 45),
      transcript: 'Hello, my name is Demo. I am learning English every day.',
      transcriptConfidence: 0.92,
      scores: { grammarScore: rnd(70, 85), vocabularyScore: rnd(72, 88), fluencyScore: rnd(60, 78), contentScore: rnd(70, 85), overallScore: rnd(68, 84) },
      feedback: {
        generalFeedback: 'Bài nói tốt! Phát âm rõ ràng, ý tưởng mạch lạc.',
        suggestions: ['Chú ý trọng âm của từ 2 âm tiết', 'Nói chậm lại ở các câu dài'],
        strengths: ['Phát âm rõ ràng', 'Từ vựng đa dạng'],
        weaknesses: ['Ngữ điệu còn đều', 'Thỉnh thoảng nuốt âm cuối'],
      },
    };
    return ok(a, 'Đã chấm xong bài nói của bạn.');
  }
  const sDetail = url.match(/^\/api\/ai\/speaking\/sessions\/(\d+)$/);
  if (method === 'get' && sDetail) return ok(speakResult(Number(sDetail[1])));

  return fail(404, `Demo chưa giả lập: ${method.toUpperCase()} ${url}`);
};
