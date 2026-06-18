# Mess Management Developer Guide

This guide provides a comprehensive overview of the architecture, workflow, and best practices for developing within the Mess Management Micro-Frontend (MFE). It is designed to help team members quickly onboard and understand how to navigate the codebase.

---

## 1. Creating Components and Subcomponents

The project follows a modular structure, where major features are separated into their own modules.

### Creating a Top-Level Feature Module
When building a new major section of the app (e.g., a `Billing` page), always use the custom workspace script. This script automatically wires up the routing and Webpack Module Federation manifests.

```bash
npm run create:module -- --project mess-management --module billing
```

### Creating Subcomponents
For smaller, modular UI pieces inside a specific feature (like a custom table or a stats card), generate them inside the feature's `components` directory using the Angular CLI:

```bash
npx ng generate component modules/dashboard/components/my-widget --project=mess-management
```

### Standalone vs. NgModule Architecture
This project is migrating towards **Angular Standalone Components**. 
- If your generated component is standalone (`standalone: true` in the `@Component` decorator), **do not** put it in a module's `declarations` array.
- Instead, add `CommonModule` to the component's own `imports` array, and then import the component directly into the parent component that needs it.

---

## 2. Managing Models and Shared Data

All domain-specific TypeScript models, interfaces, and data structures should be kept in a centralized shared directory to prevent circular dependencies.

**Location:** `projects/mess-management/src/app/shared/models/`

### Generating Models
You can generate interface files using the CLI or create them manually.

```bash
npx ng generate interface shared/models/subscriber --project=mess-management
```

*Note: This generates a file named `subscriber.ts`. When importing it into your components, make sure to omit the `.ts` extension:*
```typescript
// Correct Import Path Example (depending on your relative depth)
import { Subscriber } from '../../shared/models/subscriber';
```

---

## 3. Lazy Navigation and Routing

This application operates as a **Micro-Frontend Remote**. It does not control the main browser URL directly; instead, it provides "Chunks" of code to the central ERP Shell when requested.

### How the Routing Flow Works:
1. **The Shell** (running on port 4200) controls the global sidebar. When a user clicks "Dashboard", the Shell router looks for the Mess Management app.
2. **Webpack Exposes the Module**: In `projects/mess-management/webpack.config.js`, the `DashboardModule` is exposed to the outside world.
3. **App Routes Lazy Loading**: Inside `projects/mess-management/src/app/app.routes.ts`, the URL paths are mapped to lazily load the specific modules.

```typescript
// Inside app.routes.ts
{
  path: 'dashboard',
  loadChildren: () => import('./modules/dashboard/dashboard.module').then(m => m.DashboardModule)
}
```
*Because they are lazy-loaded, the browser only downloads the code for the Dashboard when the user actually navigates to it, keeping the app fast!*

---

## 4. Reusing Components from the Workspace Libs (`@libs`)

Because multiple teams are building MFEs for this ERP, common UI elements (like custom tables, dropdowns, and toast notifications) are stored in a centralized monorepo folder: `projects/libs/`.

### Importing from `@libs`
You do not need to use relative paths (like `../../../../libs/`). The workspace `tsconfig.json` provides path aliases.

**Example: Using the Shared Toast Service**
```typescript
import { Component } from '@angular/core';
import { SharedToastService } from '@libs/shared-toast';

@Component({ ... })
export class MyComponent {
  constructor(private toastService: SharedToastService) {}

  showSuccess() {
    this.toastService.success('Action completed successfully!');
  }
}
```

### Modifying Shared Libraries
If you ever need to edit the source code of a library (e.g., fixing a bug in `@libs/dropdown-lib`), your changes will not immediately reflect in your MFE. You **must** rebuild the libraries first:

```bash
npm run build:lib
```

---

## 5. Development Workflow Summary

1. Start the development servers: `npm run serve` (Runs both Shell and Mess Management).
2. Write your code inside `projects/mess-management/`.
3. Use the `create:module` script for new pages.
4. Keep interfaces in `shared/models/`.
5. Utilize `@libs` for common UI elements instead of reinventing the wheel.
