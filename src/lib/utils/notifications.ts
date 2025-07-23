/**
 * Notification utilities - Centralized error and success messaging
 * Following SOLID principles with single responsibility for notifications
 */

/**
 * Shows an error notification to the user
 * In a real app, this would integrate with a toast/notification system
 */
export const showErrorNotification = (message: string): void => {
  // In production, this would use a proper notification system
  // For now, using console.error as fallback
  console.error(`Notification: ${message}`)
}

/**
 * Shows a success notification to the user
 * In a real app, this would integrate with a toast/notification system
 */
export const showSuccessNotification = (message: string): void => {
  // In production, this would use a proper notification system
  // For now, using console.log as fallback
  console.warn(`Success: ${message}`)
}

/**
 * Shows an info notification to the user
 * In a real app, this would integrate with a toast/notification system
 */
export const showInfoNotification = (message: string): void => {
  // In production, this would use a proper notification system
  // For now, using console.log as fallback
  console.warn(`Info: ${message}`)
}
