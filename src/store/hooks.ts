/**
 * Redux Toolkit typed hooks
 * Pre-typed versions of useDispatch and useSelector for better TypeScript integration
 */

import { useDispatch, useSelector } from 'react-redux'

import type { RootState, AppDispatch } from './index'

// Use throughout your app instead of plain `useDispatch` and `useSelector`
export const useAppDispatch = () => useDispatch<AppDispatch>()
export const useAppSelector = <TSelected>(
  selector: (state: RootState) => TSelected
) => useSelector(selector)