# Frontend Design Documentation

This directory serves as the central hub for the design standards, guidelines, and reusable UI components that power the platform's user interface.

## UI Foundation

For core design principles, typography scales, and input field specifications, please refer to the main standards document:
- **[Rules and Guidelines](./rules-and-guidelines.md)**
---

## Reusable UI Libraries

The platform utilize a suite of custom-built Angular libraries to ensure visual consistency and developer efficiency. These libraries are architected as independent packages within the monorepo.

### Technical Architecture
- **Source Code**: Located in `KJUsys-UI/projects/libs`
- **Documentation**: Detailed technical manuals and API references are stored within the `./libraries` directory.

### Library Directory

| Library Name | Use Case | Documentation |
| :--- | :--- | :--- |
| **Alerts** | Contextual feedback, success/error notifications, and actionable alerts. | [click here](./libraries/alert.md) |
| **Tabs** | Primary navigation system for handling multiple top-level sections with overflow support. | [click here](./libraries/tabs.md) |
| **Sub-Tabs** | Secondary navigation layer optimized for sub-sections and horizontal clarity. | [click here](./libraries/sub-tabs.md) |
| **Dropdowns** | Advanced single and multi-select dropdowns with search and smart positioning. | [click here](./libraries/dropdown-lib.md) |
| **Shared UI** | A collection of core, atomic UI components including Buttons, Empty States, and Breadcrumbs. | [click here](./libraries/shared-ui.md) |
| **Table** | A fully-featured, reusable Angular 16 table component with zero external CSS dependencies. | [click here](./libraries/table.md) |


---

## Design Principles
- **Predictability**: Components must behave consistently across all modules.
- **Responsiveness**: All library components must handle dynamic layouts and window resizing.
- **Density**: Design patterns are optimized for professional, information-dense administrative interfaces.