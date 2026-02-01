# Design System - Compliance Management System

## Design Principles

### 1. Professional & Clean
- Minimalist approach with clear hierarchy
- No rounded corners on cards/buttons
- Subtle shadows for depth
- Generous white space

### 2. Typography
- **Page Titles (H1):** 24px, font-weight: 500
- **Section Titles (H2):** 18px, font-weight: 500
- **Card Titles:** 16px, font-weight: 500
- **Body Text:** 14px, font-weight: 400
- **Labels:** 13px, font-weight: 500, uppercase with letter-spacing: 0.5px
- **Small Text:** 12px, font-weight: 400

### 3. Color Palette
```scss
// Primary Colors
$primary: #1976d2;        // Material Blue
$primary-light: #e3f2fd;

// Status Colors
$pending: #ff9800;        // Orange
$pending-light: #fff3e0;
$warning: #ffc107;        // Amber
$warning-light: #fff8e1;
$danger: #f44336;         // Red
$danger-light: #ffebee;
$success: #4caf50;        // Green
$success-light: #e8f5e9;

// Neutral Colors
$text-primary: #1a1a1a;
$text-secondary: #666;
$text-disabled: #bdbdbd;
$border: #e0e0e0;
$background: #f5f7fa;
$white: #ffffff;
```

### 4. Spacing System
```scss
// Base unit: 4px
$spacing-xs: 8px;   // 2 units
$spacing-sm: 12px;  // 3 units
$spacing-md: 16px;  // 4 units
$spacing-lg: 20px;  // 5 units
$spacing-xl: 24px;  // 6 units
$spacing-2xl: 32px; // 8 units
$spacing-3xl: 48px; // 12 units
```

### 5. Component Standards

#### Toolbar
- Height: 64px
- Background: Primary color
- Shadow: 0 2px 4px rgba(0,0,0,0.1)
- Font size: 18px

#### Page Container
- Max-width: 1400px
- Padding: 32px 24px
- Background: #f5f7fa
- Margin: 0 auto

#### Page Header
- Margin-bottom: 32px
- H1: 24px, color: #1a1a1a
- Subtitle: 14px, color: #666

#### Cards
- Border-radius: 0px (no rounded corners)
- Shadow: 0 2px 4px rgba(0,0,0,0.1)
- Hover: 0 4px 12px rgba(0,0,0,0.15)
- Padding: 20px 24px

#### Stat Cards
- Horizontal layout (info left, icon right)
- Label: 13px uppercase, letter-spacing: 0.5px
- Value: 32px, font-weight: 600
- Icon: 32px in colored background (56x56px)

#### Tables
- Full width
- Header: 12px uppercase, font-weight: 600, padding: 16px
- Cell: 14px, padding: 16px
- Row hover: #f5f7fa

#### Status Badges
- Display: inline-block
- Padding: 4px 12px
- Font: 11px, uppercase, font-weight: 600
- Letter-spacing: 0.5px
- Background: Light color variant

#### Buttons
- Font-size: 14px
- Padding: 12px 20px
- Border-radius: 0px
- Icon + Text with 8px gap

#### Forms
- Label: 13px, font-weight: 500
- Input height: 48px
- Error text: 12px, color: #f44336

## Implementation Guidelines

### 1. Consistent Layout Structure
```html
<mat-toolbar color="primary" class="app-toolbar">
  <!-- Toolbar content -->
</mat-toolbar>

<div class="page-wrapper">
  <div class="page-container">
    <div class="page-header">
      <h1>Page Title</h1>
      <p class="page-subtitle">Description</p>
    </div>
    
    <div class="page-content">
      <!-- Page content -->
    </div>
  </div>
</div>
```

### 2. Common CSS Classes
```css
/* Layout */
.page-wrapper { min-height: calc(100vh - 64px); background: #f5f7fa; }
.page-container { max-width: 1400px; margin: 0 auto; padding: 32px 24px; }
.page-header { margin-bottom: 32px; }
.page-content { /* content area */ }

/* Typography */
.page-title { font-size: 24px; font-weight: 500; color: #1a1a1a; margin: 0 0 4px 0; }
.page-subtitle { font-size: 14px; color: #666; margin: 0; }
.section-title { font-size: 18px; font-weight: 500; color: #1a1a1a; }

/* Components */
.content-card { margin-bottom: 24px; }
.stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 20px; }
.action-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 12px; }

/* Status */
.status-badge { display: inline-block; padding: 4px 12px; font-size: 11px; }
.status-PENDING { background: #fff3e0; color: #f57c00; }
.status-COMPLETED { background: #e8f5e9; color: #2e7d32; }
.status-SKIPPED { background: #f5f5f5; color: #757575; }
```

### 3. Material Angular Components Usage
- Use `mat-raised-button` for primary actions
- Use `mat-button` for secondary actions
- Use `mat-icon-button` for icon-only actions
- Use `mat-card` for content containers
- Use `mat-table` for data tables
- Use `mat-form-field` with `appearance="outline"` for forms

### 4. Icons
- Size: 20px for buttons, 32px for stat cards, 64px for empty states
- Color: Inherit from parent or use semantic colors

### 5. Responsive Breakpoints
```css
/* Mobile */
@media (max-width: 768px) {
  .page-container { padding: 20px 16px; }
  .stats-grid { grid-template-columns: 1fr; }
  .page-title { font-size: 20px; }
}
```

## Pages to Update
1. ✅ Dashboard - Completed
2. Tasks List
3. Task Detail
4. Task Create
5. CSV Import
6. Users Management
7. Master Data
8. Reports
9. Teams Configuration

## Accessibility
- Use proper ARIA labels
- Ensure color contrast ratios meet WCAG AA standards
- Keyboard navigation support
- Focus indicators visible
