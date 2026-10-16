import axios, { AxiosError } from 'axios';
import type { InternalAxiosRequestConfig } from 'axios';
import { mockAdapter } from '../demo/mockAdapter';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
const IS_DEMO = import.meta.env.VITE_DEMO === '1';

export const api = axios.create({ baseURL: API_URL, timeout: 60000 });

// Demo mode: giả lập toàn bộ BE thật bằng mockAdapter (không gọi mạng).
if (IS_DEMO) api.defaults.adapter = mockAdapter;

const getAccess = () => localStorage.getItem('vocab_access');
const getRefresh = () => localStorage.getItem('vocab_refresh');

api.interceptors.request.use((cfg: InternalAxiosRequestConfig) => {
  const t = getAccess();
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});

let refreshing: Promise<string> | null = null;

api.interceptors.response.use(
  (r) => {
    // BE bọc mọi response thành công trong ApiResponse {success, message, data, timestamp}
    // → bóc lấy `data` để code các trang dùng trực tiếp như cũ
    const body = r.data;
    if (body && typeof body === 'object' && 'success' in body && 'data' in body) {
      r.data = (body as { data: unknown }).data;
    }
    return r;
  },
  async (err: AxiosError) => {
    const orig = err.config as InternalAxiosRequestConfig & { _retried?: boolean };
    if (err.response?.status === 401 && !orig._retried && getRefresh()) {
      orig._retried = true;
      try {
        refreshing = refreshing || api.post('/api/auth/refresh', { refreshToken: getRefresh() })
          .then((r) => {
            // BUG-03: BE trả snake_case (access_token) — đọc cả hai để không lưu "undefined" vào localStorage
            const nd = r.data as { accessToken?: string; access_token?: string; refreshToken?: string; refresh_token?: string };
            const at = nd.accessToken ?? nd.access_token ?? '';
            const rt = nd.refreshToken ?? nd.refresh_token ?? '';
            localStorage.setItem('vocab_access', at);
            if (rt) localStorage.setItem('vocab_refresh', rt);
            return at;
          })
          .finally(() => { refreshing = null; });
        const token = await refreshing;
        orig.headers.Authorization = `Bearer ${token}`;
        return api(orig);
      } catch {
        localStorage.removeItem('vocab_access');
        localStorage.removeItem('vocab_refresh');
        // Demo mode dùng HashRouter → redirect bằng hash để không cần SPA fallback.
        window.location.href = IS_DEMO ? '/#/login' : '/login';
      }
    }
    return Promise.reject(err);
  }
);

export const errMsg = (e: unknown, fallback = 'Có lỗi xảy ra, thử lại nhé.') => {
  if (axios.isAxiosError(e)) return (e.response?.data?.message as string) || fallback;
  return fallback;
};
