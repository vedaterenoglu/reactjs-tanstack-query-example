/**
 * Environment Configuration - Centralized environment variable management
 *
 * Design Patterns Applied:
 * 1. **Configuration Pattern**: Centralized configuration management
 * 2. **Singleton Pattern**: Single source of truth for environment variables
 * 3. **Validation Pattern**: Environment variable validation at startup
 *
 * SOLID Principles:
 * - **SRP**: Only responsible for environment variable management
 * - **OCP**: Extensible for additional environment variables
 * - **DIP**: Code depends on configuration abstractions, not direct env access
 *
 * React 19 Patterns:
 * - Type-safe environment variable access
 * - Validation at module load time
 * - Development vs production configuration support
 */

interface EnvironmentConfig {
  /** Stripe publishable key for payment processing */
  stripePublishableKey: string
  /** API base URL for backend requests */
  apiBaseUrl: string
  /** Application base URL for redirects */
  appBaseUrl: string
  /** Application name */
  appName: string
  /** Environment mode */
  mode: 'development' | 'production' | 'test'
}

/**
 * Validates required environment variables
 */
function validateEnvironment(): void {
  const required = [
    'VITE_STRIPE_PUBLISHABLE_KEY',
    'VITE_API_BASE_URL',
    'VITE_APP_URL',
  ]

  const missing = required.filter(
    // eslint-disable-next-line security/detect-object-injection
    key => !(import.meta.env as Record<string, string>)[key]
  )

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
        'Please check your .env file and ensure all required variables are set.'
    )
  }

  // Validate Stripe key format
  const stripeKey = (import.meta.env as Record<string, string>)[
    'VITE_STRIPE_PUBLISHABLE_KEY'
  ]
  if (!stripeKey || !stripeKey.startsWith('pk_')) {
    throw new Error(
      'Invalid Stripe publishable key format. Key must start with "pk_"'
    )
  }
}

/**
 * Creates typed environment configuration
 */
function createEnvironmentConfig(): EnvironmentConfig {
  validateEnvironment()

  const envVars = import.meta.env as Record<string, string>

  return {
    stripePublishableKey: envVars['VITE_STRIPE_PUBLISHABLE_KEY'] || '',
    apiBaseUrl: envVars['VITE_API_BASE_URL'] || '',
    appBaseUrl: envVars['VITE_APP_URL'] || '',
    appName: envVars['VITE_APP_NAME'] || 'Event Booking App',
    mode: (envVars['MODE'] || 'development') as
      | 'development'
      | 'production'
      | 'test',
  }
}

/**
 * Typed environment configuration object
 * Validates and provides type-safe access to environment variables
 */
export const env = createEnvironmentConfig()

/**
 * Helper function to check if running in development mode
 */
export const isDevelopment = env.mode === 'development'

/**
 * Helper function to check if running in production mode
 */
export const isProduction = env.mode === 'production'

/**
 * Helper function to get API endpoint URL
 * Automatically adds /api prefix to maintain consistency with existing codebase
 */
export function getApiUrl(endpoint: string): string {
  // Ensure endpoint starts with /
  const normalizedEndpoint = endpoint.startsWith('/')
    ? endpoint
    : `/${endpoint}`

  // Add /api prefix if not already present
  const apiEndpoint = normalizedEndpoint.startsWith('/api/')
    ? normalizedEndpoint
    : `/api${normalizedEndpoint}`

  return `${env.apiBaseUrl}${apiEndpoint}`
}

/**
 * Helper function to get application URL for redirects
 */
export function getAppUrl(path: string): string {
  return `${env.appBaseUrl}${path.startsWith('/') ? '' : '/'}${path}`
}
