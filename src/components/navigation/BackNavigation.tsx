import { ArrowLeft } from 'lucide-react'

import { Button } from '@/components/ui/button'

/**
 * BackNavigation Component - Displays back navigation button with consistent styling
 *
 * Design Patterns Applied:
 * 1. **Presentational Component Pattern**: Pure UI component with injectable behavior
 * 2. **Single Responsibility Pattern**: Only handles back navigation button display
 * 3. **Dependency Injection Pattern**: Accepts onClick handler as prop
 *
 * SOLID Principles:
 * - **SRP**: Only responsible for displaying back navigation button
 * - **OCP**: Extensible through additional props without modification
 * - **LSP**: Can be substituted with other navigation components
 * - **ISP**: Minimal interface focused on navigation needs
 * - **DIP**: Depends on abstracted onClick handler instead of direct navigation
 *
 * React 19 Patterns:
 * - Reusable UI component with injectable behavior
 * - Consistent icon and button integration
 * - Accessible button with proper labeling
 */

interface BackNavigationProps {
  /** Click handler for back navigation behavior */
  onBackClick: () => void
  /** Button text label */
  label?: string
  /** Additional CSS classes for customization */
  className?: string
}

export const BackNavigation = ({
  onBackClick,
  label = 'Back to Events',
  className = '',
}: BackNavigationProps) => {
  return (
    <div className={`mb-6 ${className}`}>
      <Button onClick={onBackClick} variant="ghost" className="hover:bg-muted">
        <ArrowLeft className="mr-2 h-4 w-4" />
        {label}
      </Button>
    </div>
  )
}
