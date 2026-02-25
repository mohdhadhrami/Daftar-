import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { accountsApi, journalsApi } from '../../api/endpoints';
import { Account, JournalEntry, Pagination } from '../../types';
import { DEMO_ACCOUNTS, DEMO_JOURNALS } from '../../demo/data';
import { RootState } from '../store';

interface AccountingState {
  accounts: Account[];
  journalEntries: JournalEntry[];
  pagination: Pagination | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: AccountingState = {
  accounts: [],
  journalEntries: [],
  pagination: null,
  isLoading: false,
  error: null,
};

export const fetchAccounts = createAsyncThunk(
  'accounting/fetchAccounts',
  async (type: string | undefined, { getState }) => {
    const state = getState() as RootState;
    if (state.auth.isDemo) {
      const accounts = type
        ? DEMO_ACCOUNTS.filter((a) => a.accountType === type)
        : DEMO_ACCOUNTS;
      return accounts;
    }
    const response: any = await accountsApi.getAll(type);
    return response.data;
  },
);

export const fetchJournalEntries = createAsyncThunk(
  'accounting/fetchJournalEntries',
  async (params: any | undefined, { getState }) => {
    const state = getState() as RootState;
    if (state.auth.isDemo) {
      let entries = [...DEMO_JOURNALS];
      if (params?.status) {
        entries = entries.filter((e) => e.status === params.status);
      }
      return { entries, pagination: { page: 1, limit: 20, total: entries.length, pages: 1 } };
    }
    const response: any = await journalsApi.getAll(params);
    return response.data;
  },
);

const accountingSlice = createSlice({
  name: 'accounting',
  initialState,
  reducers: {
    clearAccountingError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAccounts.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchAccounts.fulfilled, (state, action) => {
        state.isLoading = false;
        state.accounts = action.payload;
      })
      .addCase(fetchAccounts.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch accounts';
      })
      .addCase(fetchJournalEntries.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchJournalEntries.fulfilled, (state, action) => {
        state.isLoading = false;
        state.journalEntries = action.payload.entries;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchJournalEntries.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch journal entries';
      });
  },
});

export const { clearAccountingError } = accountingSlice.actions;
export default accountingSlice.reducer;
