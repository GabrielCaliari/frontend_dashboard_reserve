/**
 * Centralized theme colors for consistent dark theme
 * Use these instead of hardcoded blue colors
 */

export const themeColors = {
  // Primary colors (neutral grays)
  background: 'hsl(var(--background))',
  foreground: 'hsl(var(--foreground))',
  
  // Card colors
  card: 'hsl(var(--card))',
  cardForeground: 'hsl(var(--card-foreground))',
  
  // Interactive elements
  primary: 'hsl(var(--primary))',
  primaryForeground: 'hsl(var(--primary-foreground))',
  
  secondary: 'hsl(var(--secondary))',
  secondaryForeground: 'hsl(var(--secondary-foreground))',
  
  // Muted elements
  muted: 'hsl(var(--muted))',
  mutedForeground: 'hsl(var(--muted-foreground))',
  
  // Accent elements
  accent: 'hsl(var(--accent))',
  accentForeground: 'hsl(var(--accent-foreground))',
  
  // Borders and inputs
  border: 'hsl(var(--border))',
  input: 'hsl(var(--input))',
  ring: 'hsl(var(--ring))',
  
  // Status colors (keep semantic meaning)
  destructive: 'hsl(var(--destructive))',
  destructiveForeground: 'hsl(var(--destructive-foreground))',
} as const;

/**
 * Tailwind class mappings for consistent styling
 */
export const themeClasses = {
  // Backgrounds
  bgPrimary: 'bg-secondary',
  bgSecondary: 'bg-muted',
  bgAccent: 'bg-accent',
  bgHover: 'hover:bg-accent',
  
  // Text colors
  textPrimary: 'text-foreground',
  textSecondary: 'text-muted-foreground',
  textAccent: 'text-accent-foreground',
  
  // Borders
  border: 'border-border',
  borderAccent: 'border-accent',
  
  // Interactive states
  focusRing: 'focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background',
  
  // Buttons
  btnPrimary: 'bg-secondary text-secondary-foreground hover:bg-accent',
  btnSecondary: 'bg-muted text-muted-foreground hover:bg-accent',
  
  // Status badges
  statusActive: 'bg-green-900/40 text-green-300 border-green-700/50',
  statusPending: 'bg-yellow-900/40 text-yellow-300 border-yellow-700/50',
  statusInactive: 'bg-gray-900/40 text-gray-300 border-gray-700/50',
  statusError: 'bg-red-900/40 text-red-300 border-red-700/50',
} as const;
