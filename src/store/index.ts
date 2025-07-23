/**
 * Redux store configuration - Main store setup with persistence and middleware
 * Combines city and event reducers with Redux DevTools and persistence support
 */

import { configureStore, combineReducers } from '@reduxjs/toolkit'
import { persistStore, persistReducer } from 'redux-persist'
import autoMergeLevel2 from 'redux-persist/lib/stateReconciler/autoMergeLevel2'
import storage from 'redux-persist/lib/storage'

import { apiSlice } from './api/apiSlice'
import { cityReducer } from './slices/cities'
import { eventReducer } from './slices/events'

import type { Action, ThunkAction } from '@reduxjs/toolkit'
import type { PersistConfig } from 'redux-persist'

// Create root reducer with city, event slices, and RTK Query API
const rootReducer = combineReducers({
  cities: cityReducer,
  events: eventReducer,
  [apiSlice.reducerPath]: apiSlice.reducer,
})

// Infer RootState type from the reducer
export type RootState = ReturnType<typeof rootReducer>

const persistConfig: PersistConfig<RootState> = {
  key: 'root',
  storage,
  whitelist: ['cities', 'events'],
  blacklist: [apiSlice.reducerPath], // Don't persist RTK Query cache
  stateReconciler: autoMergeLevel2,
}

const persistedReducer = persistReducer<RootState, Action>(
  persistConfig,
  rootReducer
)

export const store = configureStore({
  reducer: persistedReducer,
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [
          'persist/PERSIST', 
          'persist/REHYDRATE',
          // RTK Query actions are serializable
        ],
      },
    }).concat(apiSlice.middleware),
})

export const persistor = persistStore(store)

export type AppDispatch = typeof store.dispatch
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action
>

// Re-export ThunkAction type for backward compatibility
export type { ThunkAction } from '@reduxjs/toolkit'

// Export typed hooks for better TypeScript integration
export { useAppDispatch, useAppSelector } from './hooks'
