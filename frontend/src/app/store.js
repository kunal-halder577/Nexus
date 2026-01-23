import { combineReducers, configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { 
  persistStore, 
  persistReducer,
  FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER 
} from 'redux-persist';
import storage from 'redux-persist/lib/storage'; 
import { baseApi } from '@/lib/api/baseApi';
import authReducer from '@/features/auth/authSlice';

// 1. Configure Persistence
const authPersistConfig = {
  key: 'auth',
  version: 1,
  storage,
  blacklist: ['token'], // Keep token secure (in-memory only)
};

const rootReducer = combineReducers({
  auth: persistReducer(authPersistConfig, authReducer),
  [baseApi.reducerPath]: baseApi.reducer,
});

// 2. Create the Store (and EXPORT it)
export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }).concat(baseApi.middleware),
  // Disable devtools in production for extra security
  devTools: import.meta.env.MODE !== 'production',
});

export const persistor = persistStore(store);

setupListeners(store.dispatch);