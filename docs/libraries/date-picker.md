# Date Picker Library

The Date Picker Library (`lib-date-picker`) provides a premium, custom-built date range selection component. It features a modern calendar interface with smooth transitions and confirmation logic to ensure accurate data entry.

## Technical Overview

The component resides in the `@libs/date-picker` package. It is designed to handle both single date and date range selections with a focus on user experience.

### Key Features
- **Range Selection**: Select a start and end date with clear visual indicators for the selected range.
- **Confirmation Logic**: Selection is only confirmed when the user clicks "Apply", allowing them to cancel or revert changes.
- **Today Indicator**: Highlights the current date for quick reference.
- **Navigation**: Smoothly navigate between months and years.

---

## Usage Guide (Angular)

### Implementation in Template

```html
<lib-date-picker 
  [initialStartDate]="startDate" 
  [initialEndDate]="endDate" 
  placeholder="Select Date Range"
  (dateRangeSelected)="onDateRangeSelect($event)"
  (onClear)="onClear()">
</lib-date-picker>
```

### Handling Selection

```typescript
onDateRangeSelect(range: { from: Date; to: Date | null }) {
  console.log('Selected Range:', range.from, range.to);
}
```

---

## API Reference

### Inputs & Outputs

| Property | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `[initialStartDate]` | `Date \| null` | `null` | Pre-selected start date. |
| `[initialEndDate]` | `Date \| null` | `null` | Pre-selected end date. |
| `[placeholder]` | `string` | `'Select Date Range'` | Text displayed in the trigger button. |
| `(dateRangeSelected)`| `EventEmitter<{ from: Date; to: Date \| null }>` | - | Emits the confirmed date range. |
| `(onClear)` | `EventEmitter<void>` | - | Emits when the selection is cleared. |

---

## Design Standards

- **Active State**: Selected dates feature a deep blue background with white text.
- **Range Highlight**: The days between the start and end dates are highlighted with a soft blue background.
- **Today Indicator**: A subtle border or different text color distinguishes the current date.
- **Interactive States**: Hover effects on dates provide immediate visual feedback.
