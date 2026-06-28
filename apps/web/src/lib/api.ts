import axios from 'axios';
import { useAuthStore } from '../store/auth.store';
import { API_BASE } from './env';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || API_BASE,
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().access_token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error?.response?.status;

    if (status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = useAuthStore.getState().refresh_token;
      if (refreshToken) {
        try {
          const res = await axios.post(`${api.defaults.baseURL}/auth/refresh`, {
            refresh_token: refreshToken,
          });
          const { access_token } = res.data;
          useAuthStore.getState().setAuth(
            useAuthStore.getState().user!,
            access_token,
            useAuthStore.getState().refresh_token!
          );
          return api(originalRequest);
        } catch (e) {
          useAuthStore.getState().logout();
        }
      } else {
        useAuthStore.getState().logout();
      }
    }
    return Promise.reject(error);
  }
);

export default api;
