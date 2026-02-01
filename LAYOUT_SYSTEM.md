# Shared Layout System

## Overview
The application now uses a centralized layout component (`AppLayoutComponent`) that wraps all authenticated pages. This means the header/toolbar is defined in ONE place and automatically applies to all pages.

## Structure

```
app-layout.component (Shared Header + Router Outlet)
├── Dashboard
├── Task List
├── Task Create
├── Task Detail
├── Reports
└── Admin Pages
    ├── Users
    ├── Master Data
    ├── CSV Import
    └── Teams Config
```

## Files

### Layout Component
- **Component**: `/apps/frontend-angular/src/app/core/layout/app-layout.component.ts`
- **Template**: `/apps/frontend-angular/src/app/core/layout/app-layout.component.html`
- **Styles**: `/apps/frontend-angular/src/app/core/layout/app-layout.component.css`

### Routing
- **Routes**: `/apps/frontend-angular/src/app/app.routes.ts`

## How It Works

1. **Single Header Definition**: The header with logo, user info, and logout button is defined once in `app-layout.component.html`

2. **Automatic Application**: All child routes (dashboard, tasks, reports, admin pages) automatically inherit this header

3. **Page Content**: Each page component now only contains its own content, without the header code

## Making Changes

### To Update the Header (Logo, Style, etc.)
Edit ONLY these files:
- `/apps/frontend-angular/src/app/core/layout/app-layout.component.html` - Header structure
- `/apps/frontend-angular/src/app/core/layout/app-layout.component.css` - Header styles

The change will automatically apply to ALL pages!

### Current Header Features
- **Black background** (#000000)
- **Kelp logo** (clickable, links to dashboard)
- **User info** (name/email)
- **Logout button**
- **Fixed position** at top
- **Responsive container** (max-width: 1600px)

## Benefits

1. ✅ **DRY Principle**: Define header once, use everywhere
2. ✅ **Easy Maintenance**: Change header in one place
3. ✅ **Consistency**: All pages have identical headers
4. ✅ **Smaller Components**: Page components focus only on their content
5. ✅ **Fixed Header**: Toolbar stays at top when scrolling

## Page Components Updated

All these components have been simplified (toolbar removed):
- ✅ Dashboard
- ⏳ Task List (next)
- ⏳ Task Create (next)
- ⏳ Reports (next)
- ⏳ CSV Import (next)
- ⏳ Users (next)
- ⏳ Master Data (next)
- ⏳ Teams Config (next)
