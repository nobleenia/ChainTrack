# ChainTrack UI Component Library

A collection of reusable UI components built with React, Tailwind CSS, and class-variance-authority (CVA). Inspired by [shadcn/ui](https://ui.shadcn.com/) design patterns.

## Installation

Components are located in `frontend/src/components/ui/` and can be imported from the index:

```jsx
import { Button, Card, Input, Badge, Spinner } from '../components/ui'
```

## Components

### Button

Versatile button with multiple variants and sizes.

```jsx
import { Button } from '../components/ui'

// Variants
<Button variant="default">Primary Button</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="destructive">Delete</Button>
<Button variant="success">Confirm</Button>
<Button variant="gradient">Gradient</Button>

// Sizes
<Button size="sm">Small</Button>
<Button size="default">Default</Button>
<Button size="lg">Large</Button>
<Button size="xl">Extra Large</Button>
<Button size="icon"><Icon /></Button>

// Loading state
<Button loading>Processing...</Button>

// As child (polymorphic)
<Button asChild>
  <Link to="/dashboard">Go to Dashboard</Link>
</Button>
```

### Card

Container component with header, content, and footer sections.

```jsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui'

<Card>
  <CardHeader>
    <CardTitle>Product Details</CardTitle>
    <CardDescription>View and manage product information</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Main content goes here</p>
  </CardContent>
  <CardFooter>
    <Button>Save Changes</Button>
  </CardFooter>
</Card>
```

### Input

Styled input with error states and icon support.

```jsx
import { Input } from '../components/ui'
import { Mail, Search } from 'lucide-react'

// Basic
<Input placeholder="Enter text..." />

// With icon
<Input icon={Mail} placeholder="Email address" />
<Input icon={Search} iconPosition="right" placeholder="Search..." />

// With error
<Input error="This field is required" />

// Types
<Input type="email" />
<Input type="password" />
<Input type="number" />
```

### Badge

Status indicators with various color variants.

```jsx
import { Badge } from '../components/ui'

// Standard variants
<Badge variant="default">Default</Badge>
<Badge variant="secondary">Secondary</Badge>
<Badge variant="success">Success</Badge>
<Badge variant="warning">Warning</Badge>
<Badge variant="destructive">Error</Badge>
<Badge variant="outline">Outline</Badge>

// Supply chain specific
<Badge variant="manufactured">Manufactured</Badge>
<Badge variant="shipped">In Transit</Badge>
<Badge variant="delivered">Delivered</Badge>
<Badge variant="verified">Verified</Badge>
<Badge variant="pending">Pending</Badge>
```

### Spinner

Loading indicator with multiple sizes and colors.

```jsx
import { Spinner } from '../components/ui'

// Sizes
<Spinner size="sm" />
<Spinner size="default" />
<Spinner size="lg" />
<Spinner size="xl" />

// Colors
<Spinner color="default" />
<Spinner color="white" />
<Spinner color="gray" />
<Spinner color="success" />

// Custom label for screen readers
<Spinner label="Loading products..." />
```

## Utility Functions

### cn() - Class Name Merger

Combines clsx and tailwind-merge for optimal class handling.

```jsx
import { cn } from '../utils/cn'

// Merges classes with conflict resolution
<div className={cn(
  'px-4 py-2 bg-blue-500',
  isActive && 'bg-green-500',  // Will override bg-blue-500 when active
  className  // Allows external class overrides
)} />
```

## Accessibility

All components follow WCAG 2.1 AA guidelines:

- ✅ Proper focus indicators (`focus-visible:ring-2`)
- ✅ ARIA attributes where needed
- ✅ Screen reader support (sr-only labels)
- ✅ Keyboard navigation
- ✅ Reduced motion support

## Theming

Components automatically support dark mode via Tailwind's `dark:` modifier. Toggle dark mode using the ThemeContext provider.

## Customization

Components use CVA (class-variance-authority) for variant management. To add new variants:

```jsx
// In Button.jsx
const buttonVariants = cva(
  'base-classes...',
  {
    variants: {
      variant: {
        // Add your variant here
        custom: 'bg-purple-500 text-white hover:bg-purple-600',
      },
    },
  }
)
```

## File Structure

```
frontend/src/components/ui/
├── index.js       # Centralized exports
├── Button.jsx     # Button component
├── Card.jsx       # Card component
├── Input.jsx      # Input component
├── Badge.jsx      # Badge component
└── Spinner.jsx    # Spinner component
```
