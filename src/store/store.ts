import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import reportsReducer from './slices/reportsSlice';
import notificationsReducer from './slices/notificationsSlice';
import manufacturingReducer from './slices/manufacturingSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    reports: reportsReducer,
    notifications: notificationsReducer,
    manufacturing: manufacturingReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;