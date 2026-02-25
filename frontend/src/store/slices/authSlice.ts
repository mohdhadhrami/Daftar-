import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { authApi } from '../../api/endpoints';
import { User, Company } from '../../types';
import { DEMO_USER, DEMO_COMPANY } from '../../demo/data';

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  companies: Company[];
  isLoading: boolean;
  error: string | null;
  isDemo: boolean;
}

const initialState: AuthState = {
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  token: localStorage.getItem('token'),
  refreshToken: localStorage.getItem('refreshToken'),
  companies: JSON.parse(localStorage.getItem('companies') || '[]'),
  isLoading: false,
  error: null,
  isDemo: localStorage.getItem('isDemo') === 'true',
};

export const login = createAsyncThunk(
  'auth/login',
  async (credentials: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const response: any = await authApi.login(credentials);
      return response.data;
    } catch {
      return rejectWithValue('Unable to connect to server. Try Demo Mode to explore the app.');
    }
  },
);

export const register = createAsyncThunk(
  'auth/register',
  async (
    data: {
      email: string;
      password: string;
      firstName: string;
      lastName: string;
      companyName?: string;
    },
    { rejectWithValue },
  ) => {
    try {
      const response: any = await authApi.register(data);
      return response.data;
    } catch {
      return rejectWithValue('Unable to connect to server. Backend is required for registration.');
    }
  },
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state) {
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      state.companies = [];
      state.isDemo = false;
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('companies');
      localStorage.removeItem('isDemo');
    },
    setTokens(state, action: PayloadAction<{ token: string; refreshToken: string }>) {
      state.token = action.payload.token;
      state.refreshToken = action.payload.refreshToken;
      localStorage.setItem('token', action.payload.token);
      localStorage.setItem('refreshToken', action.payload.refreshToken);
    },
    clearError(state) {
      state.error = null;
    },
    loginDemo(state) {
      state.user = DEMO_USER;
      state.token = 'demo-token';
      state.refreshToken = 'demo-refresh';
      state.companies = [DEMO_COMPANY];
      state.isDemo = true;
      state.isLoading = false;
      state.error = null;
      localStorage.setItem('user', JSON.stringify(DEMO_USER));
      localStorage.setItem('token', 'demo-token');
      localStorage.setItem('refreshToken', 'demo-refresh');
      localStorage.setItem('companies', JSON.stringify([DEMO_COMPANY]));
      localStorage.setItem('isDemo', 'true');
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
        state.companies = action.payload.companies || [];

        localStorage.setItem('user', JSON.stringify(action.payload.user));
        localStorage.setItem('token', action.payload.accessToken);
        localStorage.setItem('refreshToken', action.payload.refreshToken);
        localStorage.setItem(
          'companies',
          JSON.stringify(action.payload.companies || []),
        );
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(register.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(register.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { logout, setTokens, clearError, loginDemo } = authSlice.actions;
export default authSlice.reducer;
