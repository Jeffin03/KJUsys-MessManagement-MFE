# Dropdown Component (`@libs/dropdown-lib`)

A versatile and modern Dropdown Component for Angular, styled with Tailwind CSS. It supports single-selection, multi-selection, dataset filtering, customized checkmarks, and dynamic object field bindings.


## Features
- **Single & Multi-Select Modes:** Switch seamlessly between single-item picking and multi-item picking modes.
- **Smart Selected Items Display:** In multi-select mode, if more than two items are selected, it displays a "+ N more" tag. Clicking this tag opens the dropdown with all selected items conveniently grouped at the top of the list.
- **Select All / Clear All Buttons:** Provides quick ways to select all or deselect all items in multi-select mode.
- **Search Filtering:** Integrated search box to quickly filter through large dropdown lists.
- **Smart Positioning:** Dynamically positions itself accurately below the trigger button using exact bounding coordinates to avoid layout flow issues.
- **Custom Bindings:** Easily customize `idField` and `textField` to match any API response or object format without mapping your data.
- **Modern UI:** Smooth transitions, rounded interactive elements, customizable checkboxes, and accessible focus indicators powered by Tailwind CSS.
- **Disabled State:** Built-in form-control-like disabled UI states locking interaction.

## Installation & Setup

Import the module into your target Angular module (e.g., `AppModule` or any feature-specific module like `IpConfigurationsModule`):

```typescript
import { DropdownLibModule } from '@libs/dropdown-lib';

@NgModule({
  declarations: [
    // ...
  ],
  imports: [
    // ... other imports
    DropdownLibModule
  ]
})
export class YourFeatureModule { }
```

## Usage Examples

### 1. Multi-Select Dropdown Example

```html
<lib-dropdown-lib
   label="Candidates"
   placeholder="Select multiple candidates"
   [singleSelection]="false"
   [data]="candidatesData"
   idField="_id"
   textField="name"
   [selectedItems]="selectedCandidates"
   (selectionChange)="updateSelection($event)">
</lib-dropdown-lib>
```

**TypeScript:**
```typescript
candidatesData = [
  { _id: '1', name: 'John Doe' },
  { _id: '2', name: 'Jane Smith' }
];
selectedCandidates = [];

updateSelection(selectedInfo: any[]) {
  this.selectedCandidates = selectedInfo;
}
```

### 2. Single-Select Dropdown Example

```html
<lib-dropdown-lib
   label="Primary Department"
   placeholder="Select department"
   [singleSelection]="true"
   [data]="deptData"
   idField="id"
   textField="deptName"
   [selectedItems]="selectedDept"
   (selectionChange)="updateDeptSelection($event)">
</lib-dropdown-lib>
```

**TypeScript:**
```typescript
deptData = [
  { id: 1, deptName: 'IT' },
  { id: 2, deptName: 'HR' }
];
// Note: Even for single selection, this remains an array.
selectedDept = []; 

updateDeptSelection(selectedInfo: any[]) {
  this.selectedDept = selectedInfo;
}
```

## Component API

### Inputs (`@Input()`)

| Property | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `label` | `string` | `'Label'` | The top-level visual label displayed above the dropdown field. |
| `placeholder` | `string` | `'Select one or more'` | Text displayed when no items are selected. |
| `singleSelection`| `boolean`| `false` | Set to `true` for single-select mode (auto-closes on select) or `false` for multi-select. |
| `data` | `any[]` | `[]` | Master array of objects to populate the dropdown list. |
| `selectedItems` | `any[]` | `[]` | Used to bind the pre-selected items. **Always provided as an array, even for single select.** |
| `idField` | `string` | `'id'` | The object's unique identifier property name. |
| `textField` | `string` | `'title'` | The object's display name property name shown in the UI. |
| `disabled` | `boolean`| `false` | When `true`, disables interaction and applies a professional grayed-out appearance. |

### Outputs (`@Output()`)

| Property | Type | Description |
| :--- | :--- | :--- |
| `selectionChange`| `EventEmitter<any[]>` | Emits the latest array of selected item(s) whenever the user alters the selection. |
