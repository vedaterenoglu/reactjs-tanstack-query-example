/**
 * Events Redux Slice - Traditional Redux Implementation
 *
 * Design Patterns Applied:
 * 1. **Module Pattern**: Encapsulates all event-related Redux logic
 * 2. **Barrel Export Pattern**: Single point of import for external consumers
 * 3. **Facade Pattern**: Hides internal complexity behind clean exports
 *
 * SOLID Principles:
 * - **SRP**: Each exported module has single responsibility
 * - **OCP**: Extensible through new actions without modifying existing
 * - **ISP**: Focused exports for specific use cases
 * - **DIP**: Consumers depend on interfaces, not implementations
 *
 * Exports:
 * - Actions and action creators
 * - Reducer function  
 * - Memoized selectors
 * - Async thunk operations
 *
 * Following traditional Redux patterns for consistency with cities slice
 * Implements immutable state management and proper separation of concerns
 */

export {
  EVENT_ACTIONS,
  eventActionCreators,
  type EventAction,
} from './eventActions'
export { eventReducer } from './eventReducer'
export * from './eventSelectors'
export * from './eventThunks'