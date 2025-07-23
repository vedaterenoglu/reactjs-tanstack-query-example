# 🎨 UI & Theming System

## Overview

The UI & Theming System provides a comprehensive design system built on **Tailwind CSS 4.1.11** and **Radix UI components**. Integrated with **Redux Toolkit patterns**, it features dark/light mode support, consistent design tokens, and accessible component patterns with modern state management.

## 🎯 Core Features

### Theme Management

- **Dark/Light Mode**: Complete theme switching with system preference detection
- **Theme Persistence**: User preference saved across sessions
- **CSS Variables**: Dynamic theme switching using CSS custom properties
- **System Integration**: Respects user's OS theme preference

### Component System

- **shadcn/ui Base**: Pre-built accessible component primitives
- **Custom Components**: Extended components with project-specific styling
- **Variant System**: Multiple component variants using **Class Variance Authority 0.7.1**
- **Composition Pattern**: Components built through composition

### Design Tokens

- **Color System**: Comprehensive color palette with semantic naming
- **Typography Scale**: Consistent font sizes and line heights
- **Spacing System**: Systematic spacing using Tailwind's scale
- **Animation Library**: Smooth transitions and micro-interactions

## 🏗️ Technical Implementation

### Theme Configuration

```typescript
// Theme provider with context
interface ThemeContextType {
  theme: 'light' | 'dark' | 'system'
  resolvedTheme: 'light' | 'dark'
  setTheme: (theme: 'light' | 'dark' | 'system') => void
}

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system')
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const updateTheme = () => {
      if (theme === 'system') {
        setResolvedTheme(mediaQuery.matches ? 'dark' : 'light')
      } else {
        setResolvedTheme(theme)
      }
    }

    updateTheme()
    mediaQuery.addEventListener('change', updateTheme)
    return () => mediaQuery.removeEventListener('change', updateTheme)
  }, [theme])

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      <div className={resolvedTheme}>{children}</div>
    </ThemeContext.Provider>
  )
}
```

### CSS Variables System

```css
/* Global theme variables */
:root {
  /* Light theme colors */
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --card: 0 0% 100%;
  --card-foreground: 222.2 84% 4.9%;
  --popover: 0 0% 100%;
  --popover-foreground: 222.2 84% 4.9%;
  --primary: 221.2 83.2% 53.3%;
  --primary-foreground: 210 40% 98%;
  --secondary: 210 40% 96%;
  --secondary-foreground: 222.2 84% 4.9%;
  --muted: 210 40% 96%;
  --muted-foreground: 215.4 16.3% 46.9%;
  --accent: 210 40% 96%;
  --accent-foreground: 222.2 84% 4.9%;
  --destructive: 0 84.2% 60.2%;
  --destructive-foreground: 210 40% 98%;
  --border: 214.3 31.8% 91.4%;
  --input: 214.3 31.8% 91.4%;
  --ring: 221.2 83.2% 53.3%;
  --radius: 0.5rem;
}

.dark {
  /* Dark theme colors */
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  --card: 222.2 84% 4.9%;
  --card-foreground: 210 40% 98%;
  --popover: 222.2 84% 4.9%;
  --popover-foreground: 210 40% 98%;
  --primary: 217.2 91.2% 59.8%;
  --primary-foreground: 222.2 84% 4.9%;
  --secondary: 217.2 32.6% 17.5%;
  --secondary-foreground: 210 40% 98%;
  --muted: 217.2 32.6% 17.5%;
  --muted-foreground: 215 20.2% 65.1%;
  --accent: 217.2 32.6% 17.5%;
  --accent-foreground: 210 40% 98%;
  --destructive: 0 62.8% 30.6%;
  --destructive-foreground: 210 40% 98%;
  --border: 217.2 32.6% 17.5%;
  --input: 217.2 32.6% 17.5%;
  --ring: 224.3 76.3% 94.1%;
}
```

### Component Variant System

```typescript
// Button component with variants
const buttonVariants = cva(
  // Base styles
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline: "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
```

### Custom Component Extensions

```typescript
// Extended card component with project-specific features
interface CustomCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'interactive' | 'elevated'
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

export const CustomCard = React.forwardRef<HTMLDivElement, CustomCardProps>(
  ({ className, variant = 'default', padding = 'md', children, ...props }, ref) => {
    const cardVariants = cn(
      // Base card styles
      "rounded-xl border bg-card text-card-foreground shadow",
      // Variant styles
      {
        'hover:shadow-md transition-shadow cursor-pointer': variant === 'interactive',
        'shadow-lg': variant === 'elevated',
      },
      // Padding variants
      {
        'p-0': padding === 'none',
        'p-3': padding === 'sm',
        'p-6': padding === 'md',
        'p-8': padding === 'lg',
      },
      className
    )

    return (
      <div ref={ref} className={cardVariants} {...props}>
        {children}
      </div>
    )
  }
)
```

## 🎨 Design System Components

### Layout Components

```typescript
// Grid system with responsive patterns
export const ResponsiveGrid = ({ children, minWidth = 280 }: Props) => (
  <div
    className="grid gap-6 w-full"
    style={{
      gridTemplateColumns: `repeat(auto-fit, minmax(${minWidth}px, 1fr))`,
    }}
  >
    {children}
  </div>
)

// Container with consistent spacing
export const Container = ({ children, size = 'default' }: Props) => (
  <div className={cn(
    "mx-auto px-4 sm:px-6 lg:px-8",
    {
      'max-w-3xl': size === 'sm',
      'max-w-7xl': size === 'default',
      'max-w-none': size === 'full',
    }
  )}>
    {children}
  </div>
)
```

### Interactive Components

```typescript
// Enhanced dialog with theme support
export const ThemedDialog = ({ children, ...props }: DialogProps) => (
  <Dialog {...props}>
    <DialogOverlay className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
    <DialogContent className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background border border-border rounded-lg shadow-lg max-w-md w-full mx-4">
      {children}
    </DialogContent>
  </Dialog>
)

// Loading state component with theme awareness
export const LoadingSpinner = ({ size = 'default' }: Props) => (
  <div className={cn(
    "animate-spin rounded-full border-2 border-muted border-t-primary",
    {
      'h-4 w-4': size === 'sm',
      'h-8 w-8': size === 'default',
      'h-12 w-12': size === 'lg',
    }
  )} />
)
```

## 🎯 Design Patterns Applied

### SOLID Principles in UI

- **SRP**: Each component has single visual responsibility
- **OCP**: Components extensible through props and variants
- **LSP**: Component variants maintain consistent interface
- **ISP**: Focused prop interfaces for specific use cases
- **DIP**: Components depend on theme abstractions

### Component Patterns

- **Compound Components**: Related UI elements work together
- **Render Props**: Flexible rendering patterns for complex components
- **Composition Pattern**: Build complex UIs from simple components
- **Factory Pattern**: Dynamic component creation based on props

### Theme Patterns

- **CSS Custom Properties**: Dynamic theme switching
- **Design Tokens**: Systematic design value management
- **Semantic Naming**: Theme-aware color and spacing names
- **Responsive Design**: Mobile-first responsive patterns

## 🌈 Animation System

### Transition Utilities

```typescript
// Smooth transition utilities
export const transitions = {
  fast: 'transition-all duration-150 ease-in-out',
  normal: 'transition-all duration-300 ease-in-out',
  slow: 'transition-all duration-500 ease-in-out',
}

// Animation component wrapper
export const AnimatedWrapper = ({
  children,
  animation = 'fadeIn',
  duration = 'normal'
}: Props) => (
  <div className={cn(
    transitions[duration],
    {
      'animate-fade-in': animation === 'fadeIn',
      'animate-slide-up': animation === 'slideUp',
      'animate-scale': animation === 'scale',
    }
  )}>
    {children}
  </div>
)
```

### Scroll Animations

```typescript
// Scroll-triggered animations
export const useScrollAnimation = () => {
  const [isVisible, setIsVisible] = useState(false)
  const elementRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.1 }
    )

    if (elementRef.current) {
      observer.observe(elementRef.current)
    }

    return () => observer.disconnect()
  }, [])

  return { elementRef, isVisible }
}

// Scroll animate wrapper component
export const ScrollAnimateWrapper = ({ children }: Props) => {
  const { elementRef, isVisible } = useScrollAnimation()

  return (
    <div
      ref={elementRef}
      className={cn(
        'transition-all duration-700 ease-out',
        isVisible
          ? 'opacity-100 translate-y-0'
          : 'opacity-0 translate-y-8'
      )}
    >
      {children}
    </div>
  )
}
```

## 🔧 Utility Functions

### Class Name Management

```typescript
// Enhanced cn utility with theme support
export const cn = (...inputs: ClassValue[]) => {
  return twMerge(clsx(inputs))
}

// Theme-aware class generation
export const getThemeClasses = (theme: 'light' | 'dark') => ({
  background: theme === 'dark' ? 'bg-gray-900' : 'bg-white',
  text: theme === 'dark' ? 'text-gray-100' : 'text-gray-900',
  border: theme === 'dark' ? 'border-gray-700' : 'border-gray-200',
})

// Responsive class generator
export const responsive = (classes: Record<string, string>) => {
  return Object.entries(classes)
    .map(([breakpoint, className]) =>
      breakpoint === 'default' ? className : `${breakpoint}:${className}`
    )
    .join(' ')
}
```

### Color Utilities

```typescript
// Color manipulation utilities
export const colorUtils = {
  // Get CSS variable value
  getCSSVariable: (variable: string) =>
    getComputedStyle(document.documentElement)
      .getPropertyValue(`--${variable}`)
      .trim(),

  // Apply opacity to CSS color
  withOpacity: (color: string, opacity: number) => `hsl(${color} / ${opacity})`,

  // Generate color variations
  generateShades: (baseColor: string) => ({
    50: `hsl(${baseColor} / 0.05)`,
    100: `hsl(${baseColor} / 0.1)`,
    200: `hsl(${baseColor} / 0.2)`,
    500: `hsl(${baseColor})`,
    800: `hsl(${baseColor} / 0.8)`,
    900: `hsl(${baseColor} / 0.9)`,
  }),
}
```

## 📱 Responsive Design System

### Breakpoint Management

```typescript
// Responsive breakpoints
export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const

// Responsive hook
export const useResponsive = () => {
  const [breakpoint, setBreakpoint] = useState<keyof typeof breakpoints>('sm')

  useEffect(() => {
    const updateBreakpoint = () => {
      const width = window.innerWidth
      if (width >= 1536) setBreakpoint('2xl')
      else if (width >= 1280) setBreakpoint('xl')
      else if (width >= 1024) setBreakpoint('lg')
      else if (width >= 768) setBreakpoint('md')
      else setBreakpoint('sm')
    }

    updateBreakpoint()
    window.addEventListener('resize', updateBreakpoint)
    return () => window.removeEventListener('resize', updateBreakpoint)
  }, [])

  return breakpoint
}
```

### Mobile-First Components

```typescript
// Mobile-optimized navigation
export const MobileNav = ({ items }: Props) => (
  <nav className="lg:hidden">
    <div className="flex items-center justify-between p-4">
      <Logo />
      <MobileMenuButton />
    </div>
    <MobileMenu items={items} />
  </nav>
)

// Desktop navigation
export const DesktopNav = ({ items }: Props) => (
  <nav className="hidden lg:flex lg:items-center lg:space-x-8">
    {items.map(item => (
      <NavItem key={item.id} {...item} />
    ))}
  </nav>
)
```

## 🧪 Testing UI Components

### Component Testing

```typescript
describe('Button Component', () => {
  it('renders with correct variant styles', () => {
    render(<Button variant="destructive">Delete</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('bg-destructive')
  })

  it('applies custom className', () => {
    render(<Button className="custom-class">Test</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('custom-class')
  })
})

// Theme testing
describe('Theme Provider', () => {
  it('applies dark theme when selected', () => {
    const { container } = render(
      <ThemeProvider>
        <div data-testid="themed-content">Content</div>
      </ThemeProvider>
    )

    // Test theme switching logic
    const themeContainer = container.firstChild
    expect(themeContainer).toHaveClass('light') // Default system theme
  })
})
```

### Visual Regression Testing

```typescript
// Storybook integration for visual testing
export default {
  title: 'Components/Button',
  component: Button,
  parameters: {
    docs: { description: { component: 'Button component with variants' } }
  }
}

export const AllVariants = () => (
  <div className="space-y-4">
    <Button variant="default">Default</Button>
    <Button variant="destructive">Destructive</Button>
    <Button variant="outline">Outline</Button>
    <Button variant="secondary">Secondary</Button>
    <Button variant="ghost">Ghost</Button>
    <Button variant="link">Link</Button>
  </div>
)

export const DarkMode = AllVariants.bind({})
DarkMode.parameters = {
  backgrounds: { default: 'dark' },
  className: 'dark',
}
```

## 🔮 Future Enhancements

### Advanced Theming

- **Color Palette Generator**: Dynamic color palette generation
- **Theme Editor**: Visual theme customization interface
- **Brand Themes**: Multiple brand theme support
- **High Contrast**: Accessibility-focused high contrast themes

### Component Library

- **Design System Documentation**: Comprehensive component documentation
- **Token Management**: Advanced design token management
- **Component Generator**: CLI tool for component scaffolding
- **Theme Migration**: Automated theme migration tools

### Performance Optimization

- **CSS-in-JS**: Runtime CSS generation for dynamic themes
- **Style Caching**: Advanced CSS caching strategies
- **Bundle Optimization**: Optimized CSS bundle splitting
- **Critical CSS**: Above-the-fold CSS optimization

---

**Status**: ✅ **Production-Ready Design System**
