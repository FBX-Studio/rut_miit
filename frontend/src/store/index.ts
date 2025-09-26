import { configureStore } from '@reduxjs/toolkit';
import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux';
import routesReducer from './slices/routesSlice';
import ordersReducer from './slices/ordersSlice';
import vehiclesReducer from './slices/vehiclesSlice';
import driversReducer from './slices/driversSlice';
import customersReducer from './slices/customersSlice';
import eventsReducer from './slices/eventsSlice';

export const store = configureStore({
  reducer: {
    routes: routesReducer,
    orders: ordersReducer,
    vehicles: vehiclesReducer,
    drivers: driversReducer,
    customers: customersReducer,
    events: eventsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;