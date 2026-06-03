# UI Development Standards

This document outlines the mandatory design specifications for UI development to ensure visual consistency and professional aesthetics across the platform.

## 1. Typography System

The typography scale is designed to maintain a crisp, readable hierarchy using small but clear font sizes. Developers should adhere to these specific sizes and weights.

| Element | Font Size | Font Weight | Tailwind Class Equivalent |
| :--- | :--- | :--- | :--- |
| **Title** | 14px | Semibold | `text-sm font-semibold` |
| **Subtitle** | 12px | Semibold | `text-xs font-semibold` |
| **Content** | 12px | Regular | `text-xs` |
| **Input Field** | 12px | Regular | `text-xs` |
| **Input Label** | 10px | Medium | `text-[10px] font-medium` |
| **Secondary Text** | 10px | Regular | `text-[10px]` |
| **Breadcrumbs** | 10px | Regular | `text-[10px]` |

> [!NOTE]
> The typography scale is optimized for information density. Titles use 14px (`text-sm`), while content, subtitles, and input fields utilize 12px (`text-xs`) to maintain a crisp, modern look. Breadcrumbs and labels are reduced to 10px to minimize visual noise.

---

## 2. Input Field Specifications

To ensure uniform user interaction across all forms, input fields must strictly follow the defined border colors, backgrounds, and focus states.

### 2.1 Visual States

| State | Border Color | Background Color | Ring Size (Active) |
| :--- | :--- | :--- | :--- |
| **Default** | `gray-300` | Transparent/White | - |
| **Disabled** | `gray-300` | `gray-100` | - |
| **Error** | `red-300` | No Change | - |
| **Active/Focus** | `blue-500` | No Change | `ring-1` |

\* *Active states utilize a blue border (`border-blue-500`) and a `ring-1` focus ring to provide clear visual feedback.*

### 2.2 Functional Requirements
- **Disabled Fields**: Must utilize `gray-100` background to clearly indicate non-interactive status.
- **Error Validation**: Mandatory use of `red-300` border to highlight validation failures.
- **Input Labels**: All input box labels must utilize `10px` font size (`text-[10px]`) and `medium` weight (`font-medium`) to maintain a clean, organized hierarchy.
- **Interactive Focus**: All interactive input elements must display a `blue-500` border and a `ring-1` focus ring when active to provide clear keyboard and click feedback.

---

## 3. Layout and Spacing

To maintain structural balance across different pages and modules, the following spacing rules must be applied.

### 3.1 Content Padding
- **Standard Padding**: The main content area must utilize `p-5` padding. This ensures visual alignment with the breadcrumbs and page titles, which also follow the `p-5` padding standard.

---

## 3. Layout & Padding

To maintain visual uniformity across the application, content areas must align with the navigation elements.

- **Uniform Padding**: The padding for the main content and the breadcrumb section must be identical. Use `p-5` (1.25rem) as the standard padding, as this aligns with the internal padding of the breadcrumb library.

