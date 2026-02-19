// src/lib/api.ts
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Axiosインスタンス作成
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = document.cookie
    .split('; ')
    .find(row => row.startsWith('XSRF-TOKEN='))
    ?.split('=')[1];

  if (token) {
    // 手動でヘッダ「X-XSRF=TOKEN」を追加。この名前をsanctumが見つけて
    // csrfトークンとして扱う。本来axiosが自動でやるが、無能なので手動で実装。
    /**
     * 「渡されたクッキーに入っているトークンを X-XSRF-TOKEN ヘッダに入れて
     * 　SPA側からリクエストする必要があります」
     */
    config.headers['X-XSRF-TOKEN'] = decodeURIComponent(token);
  }

  return config;
});

export { apiClient };