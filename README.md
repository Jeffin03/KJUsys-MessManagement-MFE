# KJUsys UI Base

This is a clean, modular micro-frontend base workspace built on **Angular 16** and **Webpack Module Federation**. It is designed to act as a boilerplate/starter kit for building modular web applications. All domain-specific libraries and remote applications have been pruned, and authentication checks have been bypassed to allow instant, direct access to the portal dashboard.

---

## 1. Features
- **Zero-Auth Bypassed Routing**: Direct redirection to the dashboard (`/kjusys`). The `AuthGuard` returns `true` unconditionally.
- **Dynamic Manifest-Driven Navigation**: The host shell dynamically discovers and registers all micro-frontend (MFE) remote applications and their sub-modules at runtime by reading local manifests (`mf.manifest.json`), eliminating backend API dependencies.
- **Automation CLI Tools**: Built-in scripts to generate new MFE remote projects and internal modules with automated route and manifest registration.
- **Pre-Built Shared Libraries**: Contains core reusable libraries for shared utilities, UI components, custom grids, alerts, and navigation menus.

---

## 2. Workspace Topography

```
base_project/
├── angular.json               # Angular workspace configuration
├── package.json               # Workspace dependencies & build/serve scripts
├── tsconfig.json              # TypeScript configuration & path mappings
├── prod-server/               # Express static servers for production builds
│   ├── shell.js               # Shell/Host server (Port 4200)
│   └── server.js              # Production static reverse-proxy runner
├── scripts/                   # Automation and build orchestration scripts
│   ├── create-project.js      # CLI tool to bootstrap a new MFE remote project
│   ├── create-module.js       # CLI tool to add an MFE sub-module
│   └── dynamic-build.js       # Resource-aware parallel package compiler
└── projects/
    ├── shell/                 # Core Host Shell application
    └── libs/                  # Reusable shared libraries
        ├── shared-auth/       # Bypassed authentication library and mock session
        ├── shared-ui/         # Standalone UI components (e.g. lib-breadcrumbs-title)
        ├── tabs/              # Scroll-aware dynamic tabs library component
        ├── left-menu-lib/     # Main left sidebar menu renderer
        ├── menu-header-lib/   # Top navbar and user profile header (stubbed)
        └── http-common/       # Interceptor-enabled HttpClient wrapper
```

---

## 3. Getting Started

### Prerequisites
- Node.js version **v16+** (v18 or v20 LTS recommended)
- Angular CLI installed globally: `npm i -g @angular/cli@16`

### Installation
```bash
npm install
```

### Build Libraries
Before running or building applications, you must build the shared libraries first:
```bash
npm run build:lib
```

### Local Development
To start the dev server (spawns the shell and all registered remote applications concurrently):
```bash
npm run serve
```
Open your browser and navigate to **`http://localhost:4200`** to view the clean welcome dashboard.

---

## 4. Automation CLI Commands

### 4.1. Create a New Remote Project
Bootstrap a clean, pre-configured MFE application:
```bash
npm run create:project -- --name <project-name> --port <port>
```
*Example:*
```bash
npm run create:project -- --name hr --port 4205
```

**Port Configuration Rules:**
* **Required Parameter:** The `--port <port>` flag is **required** to specify the project's port.
* **Unique Ports:** Every project must run on a different unique port. Make sure to choose a different port number for each remote project.
* **Shell Reservation:** Port `4200` is reserved for the host shell and cannot be used for any remote project.

This command:
1. Configures Module Federation for the new application.
2. Creates environment files, routes, and main navigation components.
3. Automatically registers the project in `angular.json`, `package.json` scripts, and the dynamic manifests.

### 4.2. Create a Sub-Module inside a Remote
Bootstrap a new module and register it dynamically inside an existing project:
```bash
npm run create:module -- --project <project-name> --module <module-name>
```
*Example:*
```bash
npm run create:module -- --project hr --module onboarding
```
This command:
1. Generates an Angular routing module and component.
2. Injects the module route entry inside the project's `app.routes.ts` file.
3. Exposes the module entry in `webpack.config.js`.
4. Adds the module as a dynamic menu route to the shell manifests (`mf.manifest.json`).

---

## 5. Deployment & Production Build

To build the entire workspace (shell + all registered remotes + libraries):
```bash
npm run build
```

To run the production static servers locally:
```bash
npm run start
```
*Note: Make sure to define any environment variables or replace remote endpoints in the environments configuration (`environment.prod.ts`) before compiling for staging/production.*
