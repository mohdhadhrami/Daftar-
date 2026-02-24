import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import companyReducer from './slices/companySlice';
import accountingReducer from './slices/accountingSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    company: companyReducer,
    accounting: accountingReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
