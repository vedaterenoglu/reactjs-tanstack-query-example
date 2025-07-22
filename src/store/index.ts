import { composeWithDevTools } from '@redux-devtools/extension'
import {
  legacy_createStore as createStore,
  applyMiddleware,
  combineReducers,
} from 'redux'
import { persistStore, persistReducer } from 'redux-persist'
import autoMergeLevel2 from 'redux-persist/lib/stateReconciler/autoMergeLevel2'
import storage from 'redux-persist/lib/storage'
import { thunk } from 'redux-thunk'

import { cityReducer } from './slices/cities'
import { eventReducer } from './slices/events'

import type { Action } from 'redux'
import type { PersistConfig } from 'redux-persist'
import type { ThunkDispatch, ThunkAction } from 'redux-thunk'

// Create root reducer with city and event slices
const rootReducer = combineReducers({
  cities: cityReducer,
  events: eventReducer,
})

// Infer RootState type from the reducer
export type RootState = ReturnType<typeof rootReducer>

const persistConfig: PersistConfig<RootState> = {
  key: 'root',
  storage,
  whitelist: ['cities', 'events'],
  stateReconciler: autoMergeLevel2,
}

const persistedReducer = persistReducer<RootState, Action>(
  persistConfig,
  rootReducer
)

export const store = createStore(
  persistedReducer,
  composeWithDevTools(applyMiddleware(thunk))
)

export const persistor = persistStore(store)

export type AppDispatch = ThunkDispatch<RootState, unknown, Action>
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action
>
