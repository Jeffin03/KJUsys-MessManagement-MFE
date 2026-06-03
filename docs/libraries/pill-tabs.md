# Pill Tabs Library

The Pill Tabs Library (`lib-pill-tabs`) provides a clean, modern navigation component using a "pill" style indicator. It is ideal for filtering views or switching between small sets of related content.

## Technical Overview

The component resides in the `@libs/pill-tabs` package and is designed to be lightweight and data-driven.

### Key Features
- **Modern Aesthetic**: Rounded pill-style selection indicator with smooth transitions.
- **Data-Driven**: Easily populated with an array of simple objects.
- **Compact**: Designed to fit into headers or small UI sections.

---

## Usage Guide (Angular)

### 1. Define Tab Data
In your component TypeScript, define the array of tabs using the `PillTabItem` interface.

```typescript
import { PillTabItem } from '@libs/pill-tabs';

public myTabs: PillTabItem[] = [
  { id: 'all', label: 'All' },
  { id: 'active', label: 'Active' },
  { id: 'pending', label: 'Pending' }
];

public activeTab: string = 'all';

onTabChange(tabId: string) {
  this.activeTab = tabId;
}
```

### 2. Implementation in Template

```html
<lib-pill-tabs 
  [tabs]="myTabs" 
  [activeTabId]="activeTab" 
  (tabChange)="onTabChange($event)">
</lib-pill-tabs>
```

---

## API Reference

### Inputs & Outputs

| Property | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `[tabs]` | `PillTabItem[]` | `[]` | Required. The array of tabs to display. |
| `[activeTabId]` | `string` | `''` | The ID of the currently selected tab. |
| `(tabChange)` | `EventEmitter<string>` | - | Emits the `id` of the tab when clicked. |

### Data Model (`PillTabItem`)

| Property | Type | Description |
| :--- | :--- | :--- |
| `id` | `string` | Unique identifier for selection logic. |
| `label` | `string` | Text displayed on the tab. |
