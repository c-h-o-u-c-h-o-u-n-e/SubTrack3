# YOUWARE Agent Guide

## Project Overview
This is a React-based subscription tracking application built with TypeScript, Vite, and Tailwind CSS. The app uses a custom Gruvbox color theme and FontAwesome icons for a cohesive dark theme interface.

## Technology Stack
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS with custom Gruvbox theme
- **Icons**: FontAwesome
- **State Management**: React hooks with localStorage persistence

## Development Commands
```bash
# Install dependencies
npm install

# Build for production (MANDATORY after code changes)
npm run build

# Development server (for testing only)
npm run dev
```

## Architecture

### Component Structure
- **Main App**: `App.tsx` - Main application component
- **Core Components**:
  - `Dashboard.tsx` - Main dashboard view
  - `SettingsModal.tsx` - Settings modal with tabs (regional, display, categories, payment methods, data, reset)
  - `SubscriptionCard.tsx` - Individual subscription display
  - `SubscriptionForm.tsx` - Add/edit subscription form
  - `CategoryManager.tsx` - Category management
  - `PaymentMethodManager.tsx` - Payment method management

### Custom UI Components (`src/components/ui/`)
- Custom form components with Gruvbox theme integration
- Consistent styling across the application

### Utility Functions
- `subscriptionUtils.ts` - Subscription data management and category settings
- `paymentMethodUtils.ts` - Payment method configuration management
- `useLocalStorage.ts` - LocalStorage persistence hook
- `useAppSettings.ts` - Application settings management

### Data Management
- All data stored in browser localStorage
- Settings persisted across sessions
- Event-driven updates using custom events (`settings-changed`)

## Key Features
1. **Multi-language Support**: French/English interface
2. **Currency Formatting**: Multiple currency and number format options
3. **Category Management**: Dynamic category creation and management
4. **Payment Methods**: Configurable payment method options
5. **Data Import/Export**: JSON-based backup and restore
6. **Responsive Design**: Mobile and desktop compatible

## Color Theme
Uses custom Gruvbox color palette defined in Tailwind config:
- Background variants: `gruvbox-bg0`, `gruvbox-bg1`, `gruvbox-bg2`
- Foreground variants: `gruvbox-fg0` to `gruvbox-fg4`
- Accent colors: `gruvbox-red`, `gruvbox-green`, `gruvbox-orange`, `gruvbox-blue`, `gruvbox-purple`

## Build Requirements
- Always run `npm run build` after any code changes
- Ensure all TypeScript errors are resolved before deployment
- Use production builds for testing functionality