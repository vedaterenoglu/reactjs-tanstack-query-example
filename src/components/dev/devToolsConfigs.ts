/**
 * Predefined DevTools configurations for different scenarios
 */

/**
 * Configuration options for TanStack Query DevTools
 */
export interface QueryDevToolsConfig {
  initialIsOpen?: boolean
  position?: 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right'
  panelPosition?: 'bottom' | 'left' | 'right' | 'top'
  closeButtonProps?: Record<string, unknown>
  toggleButtonProps?: Record<string, unknown>
  errorTypes?: Array<{ name: string; initialIsOpen?: boolean }>
  styleNonce?: string
  shadowDOMTarget?: ShadowRoot
}

/**
 * Predefined DevTools configurations for different scenarios
 */
export const DEV_TOOLS_CONFIGS = {
  // Default development configuration
  DEFAULT: {
    initialIsOpen: false,
    position: 'bottom-right' as const,
    panelPosition: 'bottom' as const,
  },

  // Minimal configuration for smaller screens
  MINIMAL: {
    initialIsOpen: false,
    position: 'bottom-left' as const,
    panelPosition: 'left' as const,
  },

  // Debug configuration with more visibility
  DEBUG: {
    initialIsOpen: true,
    position: 'top-right' as const,
    panelPosition: 'right' as const,
    errorTypes: [
      { name: 'Query Errors', initialIsOpen: true },
      { name: 'Mutation Errors', initialIsOpen: true },
    ],
  },

  // Production debugging (use with caution)
  PRODUCTION_DEBUG: {
    initialIsOpen: false,
    position: 'bottom-right' as const,
    panelPosition: 'bottom' as const,
    toggleButtonProps: {
      style: {
        background: 'red',
        color: 'white',
        fontSize: '12px',
        padding: '4px 8px',
      },
    },
  },
} as const satisfies Record<string, QueryDevToolsConfig>

/**
 * Export type for DevTools configurations
 */
export type DevToolsConfigType = keyof typeof DEV_TOOLS_CONFIGS