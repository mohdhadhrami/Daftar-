import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Company } from '../../types';

interface CompanyState {
  currentCompany: Company | null;
}

const initialState: CompanyState = {
  currentCompany: JSON.parse(localStorage.getItem('currentCompany') || 'null'),
};

const companySlice = createSlice({
  name: 'company',
  initialState,
  reducers: {
    setCurrentCompany(state, action: PayloadAction<Company>) {
      state.currentCompany = action.payload;
      localStorage.setItem('currentCompany', JSON.stringify(action.payload));
    },
    clearCurrentCompany(state) {
      state.currentCompany = null;
      localStorage.removeItem('currentCompany');
    },
  },
});

export const { setCurrentCompany, clearCurrentCompany } = companySlice.actions;
export default companySlice.reducer;
