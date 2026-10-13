import { api } from './client';
export { api, errMsg } from './client';

/* ---------- types ---------- */
export interface User { id: number; email: string; username: string; fullName?: string; role: 'ADMIN' | 'STUDENT'; status: string }
export interface AuthResp { accessToken: string; refreshToken: string; expiresIn: number; user: User; message: string }
/** BE RegisterSuccessResponse — KHÔNG chứa token (BE bắt đăng nhập tay sau OTP) */
export interface RegisterSuccess { message: string; email: string; username: string; fullName: string; status: string; instruction: string }
export interface Page<T> { content: T[]; pageable: { pageNumber: number; pageSize: number; totalElements: number; totalPages: number } }
export interface Category { id: number; name: string }
export interface Word { id: number; word: string; pronunciation?: string; meaning: string; example?: string; level: string; audioUrl?: string; imageUrl?: string; category?: Category }
export interface ReviewItem { wordId: number; word: string; daysOverdue: number; attemptCount: number }
/** BE: LearningProgressResponse — item của GET /api/learning/review-queue (Spring Page) */
export interface ProgressItem {
  id: number; word: Word; status: string;
  correctCount: number; wrongCount: number; reviewCount: number;
  accuracy?: number; nextReviewAt?: string; lastReviewedAt?: string;
}
export interface ProgressPage { content: ProgressItem[]; totalElements: number; totalPages: number }
/** Số ngày trễ ôn = hôm nay - nextReviewAt (BE không trả sẵn) */
export const daysOverdue = (it: ProgressItem): number => {
  if (!it.nextReviewAt) return 0;
  const d = Math.ceil((Date.now() - new Date(it.nextReviewAt).getTime()) / 86400000);
  return d > 0 ? d : 0;
};
export interface Quiz { id: number; title: string; level: string; questionCount: number; timeLimit: number; category?: string; status: string }
export interface Question { id: number; content: string; options: string[] }
export interface QuizDetail extends Quiz { totalQuestions: number; questions: Question[] }
export interface Attempt { attemptId: number; quizId: number; startedAt: string; expiresAt: string }
export interface QuizResult { attemptId: number; score: number; totalQuestions: number; correctAnswers: number; feedback: string }
export interface Explain { wordId: number; word: string; meaning: string; examples: string[]; synonyms: string[]; usageTips: string; tokensUsed: number; source: string }
export interface GrammarErr { errorType: string; message: string; suggestion: string }
export interface GrammarResp { originalText: string; correctedText: string; score: number; errors: GrammarErr[]; tokensUsed: number }
export interface Hint { progressId: number; word: string; attemptCount: number; hint: string; difficulty: string; tokensUsed: number }
export interface Conversation { id: number; type: string; title: string; createdAt: string }
export interface ChatMsg { id: number; conversationId: number; role: 'USER' | 'ASSISTANT'; content: string; tokensUsed?: number }
export interface SpeakSession { id: number; topic: string; level: string; startedAt: string; status: string }
export interface SpeakAttempt { attemptId: number; sessionId: number; attemptNumber: number; audioUrl: string; audioDurationSeconds: number; transcript: string; transcriptConfidence: number; scores: { grammarScore: number; vocabularyScore: number; fluencyScore: number; contentScore: number; overallScore: number }; feedback: { generalFeedback: string; suggestions: string[]; strengths: string[]; weaknesses: string[] } }
export interface SessionDetail extends SpeakSession { attemptCount: number; attempts: { id: number; attemptNumber: number; overallScore: number }[]; statistics: { averageScore: number; bestScore: number; improvement: string } }

/* ---------- auth ---------- */
export const authApi = {
  validate: (d: { email: string; username: string; fullName: string; password: string }) =>
    api.post('/api/auth/register/validate', d),
  verifyOtp: (d: { email: string; otp: string; username: string; password: string; fullName: string }) =>
    api.post<RegisterSuccess>('/api/auth/register/verify-otp', d),
  login: (d: { emailOrUsername: string; password: string }) =>
    api.post<AuthResp>('/api/auth/login', d),
  // BE POST /api/auth/logout yêu cầu body { refreshToken } — không gửi là 400
  logout: () => {
    const rt = localStorage.getItem('vocab_refresh');
    return api.post('/api/auth/logout', rt ? { refreshToken: rt } : {}).catch(() => {});
  },
};

/* ---------- vocabulary ---------- */
export const wordApi = {
  list: (p: { page?: number; size?: number; level?: string; category?: string; search?: string }) =>
    api.get<Page<Word>>('/api/words', { params: p }),
  favorite: (id: number) => api.post(`/api/words/${id}/favorite`),
  unfavorite: (id: number) => api.delete(`/api/words/${id}/favorite`),
  favorites: (page = 0, size = 20) => api.get<Page<Word>>('/api/words/favorites', { params: { page, size } }),
};

/* ---------- learning ---------- */
export const learnApi = {
  start: (wordId: number) => api.post(`/api/learning/words/${wordId}/start`),
  // BE ReviewWordRequest field là `correct` (@NotNull) — không phải isCorrect
  review: (wordId: number, isCorrect: boolean) => api.post(`/api/learning/words/${wordId}/review`, { correct: isCorrect }),
  // BE trả Spring Page<LearningProgressResponse>: { content, totalElements, totalPages }; nhận param size (không phải limit)
  queue: (limit = 10) => api.get<ProgressPage>('/api/learning/review-queue', { params: { size: limit } }),
};

/* ---------- quiz ---------- */
export const quizApi = {
  list: (p: { page?: number; size?: number; level?: string }) => api.get<Page<Quiz>>('/api/quizzes', { params: p }),
  detail: (id: number) => api.get<QuizDetail>(`/api/quizzes/${id}`),
  start: (id: number) => api.post<Attempt>(`/api/quizzes/${id}/start`),
  // BE: POST /api/quizzes/{attemptId}/submit (không có đoạn /{quizId}/attempts/ ở giữa)
  submit: (attemptId: number, answers: { questionId: number; answer: number }[]) =>
    api.post<QuizResult>(`/api/quizzes/${attemptId}/submit`, { answers }),
};

/* ---------- ai ---------- */
export const aiApi = {
  // BE: POST /api/v1/ai/vocabulary/explain { wordId, context } (không phải GET /explain/{id})
  explain: (wordId: number, context?: string) =>
    api.post<Explain>('/api/v1/ai/vocabulary/explain', { wordId, context }),
  grammar: (text: string) => api.post<GrammarResp>('/api/v1/ai/grammar', { text, language: 'en', includeSuggestions: true }),
  // BE: POST /api/v1/ai/hints/generate { learningProgressId, attemptCount } (không phải GET /hints/{id})
  hint: (progressId: number, attemptCount: number) =>
    api.post<Hint>('/api/v1/ai/hints/generate', { learningProgressId: progressId, attemptCount }),
  createConv: (type: string, title: string) => api.post<Conversation>('/api/v1/ai/conversations', { type, title }),
  listConv: () => api.get<Page<Conversation>>('/api/v1/ai/conversations', { params: { page: 0, size: 20 } }),
  sendMsg: (convId: number, content: string) =>
    api.post<ChatMsg>(`/api/v1/ai/conversations/${convId}/messages`, { content }),
  // BE khong co GET /{id}/messages rieng — GET /{id} tra ConversationDetailResponse kem san messages[]
  convMsgs: (convId: number) => api.get<{ messages: ChatMsg[] }>(`/api/v1/ai/conversations/${convId}`),
};

/* ---------- speaking ---------- */
export const speakApi = {
  createSession: (topic: string, level: string) => api.post<SpeakSession>('/api/ai/speaking/sessions', { topic, level }),
  uploadAttempt: (sessionId: number, file: Blob) => {
    const fd = new FormData();
    fd.append('audio', file, 'recording.webm');
    return api.post<SpeakAttempt>(`/api/ai/speaking/attempts?sessionId=${sessionId}`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' }, timeout: 180000,
    });
  },
  sessionDetail: (id: number) => api.get<SessionDetail>(`/api/ai/speaking/sessions/${id}`),
};
