import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { store } from '../store/store';
import { logout, setTokens } from '../store/slices/authSlice';

const API_URL = import.meta.env.VITE_API_URL || '/api/v1';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - attach auth token and company ID
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const state = store.getState();
    const { token } = state.auth;
    const { currentCompany } = state.company;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (currentCompany) {
      config.headers['X-Company-Id'] = currentCompany.id;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor - handle 401 and token refresh
apiClient.interceptors.response.use(
  (response) => response.data,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const state = store.getState();
      const { refreshToken } = state.auth;

      if (refreshToken) {
        try {
          const response = await axios.post(`${API_URL}/auth/refresh`, {
            refreshToken,
          });

          const { accessToken, refreshToken: newRefreshToken } =
            response.data.data;

          store.dispatch(
            setTokens({
              token: accessToken,
              refreshToken: newRefreshToken,
            }),
          );

          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return apiClient(originalRequest);
        } catch {
          store.dispatch(logout());
          window.location.href = '/login';
        }
      } else {
        store.dispatch(logout());
        window.location.href = '/login';
      }
    }

    return Promise.reject(error.response?.data || error.message);
  },
);

export default apiClient;
