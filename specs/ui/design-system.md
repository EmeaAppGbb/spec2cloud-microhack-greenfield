# TaskBoard Design System

> **Wireframe-quality** — speed over polish. All values are CSS custom properties ready to paste into self-contained HTML prototypes.

---

## 1. Color Palette

| Token | Value | Usage |
|-------|-------|-------|
| `--color-primary` | `#2563eb` | Buttons, links, active states |
| `--color-primary-hover` | `#1d4ed8` | Hover state for primary elements |
| `--color-secondary` | `#64748b` | Secondary text, borders |
| `--color-accent` | `#16a34a` | Success states, "Done" column |
| `--color-error` | `#dc2626` | Error messages, delete buttons |
| `--color-warning` | `#d97706` | "In Progress" column accent |
| `--color-bg` | `#ffffff` | Page background |
| `--color-bg-alt` | `#f8fafc` | Card / column backgrounds |
| `--color-text` | `#1e293b` | Primary text |
| `--color-text-muted` | `#64748b` | Secondary / helper text |
| `--color-border` | `#e2e8f0` | Borders, dividers |
| `--color-todo` | `#dbeafe` | To Do column background |
| `--color-in-progress` | `#fef3c7` | In Progress column background |
| `--color-done` | `#dcfce7` | Done column background |

---

## 2. Typography

**Font family:** `system-ui, -apple-system, sans-serif` (no external dependencies)

### Scale

| Token | Size |
|-------|------|
| `--text-xs` | `0.75rem` |
| `--text-sm` | `0.875rem` |
| `--text-base` | `1rem` |
| `--text-lg` | `1.125rem` |
| `--text-xl` | `1.25rem` |
| `--text-2xl` | `1.5rem` |
| `--text-3xl` | `1.875rem` |

### Line Heights

| Token | Value |
|-------|-------|
| `--leading-tight` | `1.25` |
| `--leading-normal` | `1.5` |
| `--leading-relaxed` | `1.75` |

### Font Weights

| Token | Value |
|-------|-------|
| `--font-normal` | `400` |
| `--font-medium` | `500` |
| `--font-semibold` | `600` |
| `--font-bold` | `700` |

---

## 3. Spacing

4px grid system:

| Token | Value |
|-------|-------|
| `--space-1` | `0.25rem` |
| `--space-2` | `0.5rem` |
| `--space-3` | `0.75rem` |
| `--space-4` | `1rem` |
| `--space-6` | `1.5rem` |
| `--space-8` | `2rem` |
| `--space-12` | `3rem` |
| `--space-16` | `4rem` |

---

## 4. Border Radius

| Token | Value |
|-------|-------|
| `--radius-sm` | `0.25rem` |
| `--radius-md` | `0.375rem` |
| `--radius-lg` | `0.5rem` |
| `--radius-full` | `9999px` |

---

## 5. Shadows

| Token | Value |
|-------|-------|
| `--shadow-sm` | `0 1px 2px rgba(0, 0, 0, 0.05)` |
| `--shadow-md` | `0 4px 6px rgba(0, 0, 0, 0.1)` |
| `--shadow-lg` | `0 10px 15px rgba(0, 0, 0, 0.1)` |

---

## 6. Responsive Breakpoints

| Name | Range | Notes |
|------|-------|-------|
| Mobile | `< 640px` | Default (mobile-first) |
| Tablet | `640px – 1023px` | `@media (min-width: 640px)` |
| Desktop | `≥ 1024px` | `@media (min-width: 1024px)` |

---

## 7. Component Styles

### Button (primary)

- Background: `var(--color-primary)`, hover `var(--color-primary-hover)`
- Text: white, `var(--text-sm)`, `var(--font-medium)`
- Padding: `var(--space-2) var(--space-4)`
- Border radius: `var(--radius-md)`
- Cursor: pointer

### Button (secondary)

- Background: white
- Border: `1px solid var(--color-border)`
- Text: `var(--color-primary)`, `var(--text-sm)`, `var(--font-medium)`
- Padding: `var(--space-2) var(--space-4)`
- Border radius: `var(--radius-md)`

### Button (danger)

- Background: `var(--color-error)`
- Text: white, `var(--text-sm)`, `var(--font-medium)`
- Padding: `var(--space-2) var(--space-4)`
- Border radius: `var(--radius-md)`

### Input

- Border: `1px solid var(--color-border)`
- Border radius: `var(--radius-md)`
- Padding: `var(--space-2)`
- Width: 100%
- Font size: `var(--text-base)`
- Focus: `outline: 2px solid var(--color-primary)`

### Card

- Background: white
- Border: `1px solid var(--color-border)`
- Border radius: `var(--radius-lg)`
- Box shadow: `var(--shadow-sm)`
- Padding: `var(--space-4)`

### Badge

- Display: inline-block
- Border radius: `var(--radius-full)`
- Padding: `var(--space-1) var(--space-2)`
- Font size: `var(--text-xs)`
- Font weight: `var(--font-medium)`
- Colored background per status (todo / in-progress / done)

### Table

- Width: 100%
- Border collapse: collapse
- Header: `var(--font-semibold)`, border-bottom `2px solid var(--color-border)`
- Rows: alternating `var(--color-bg)` / `var(--color-bg-alt)`
- Cells: padding `var(--space-2) var(--space-3)`, border-bottom `1px solid var(--color-border)`

### Nav Bar

- Background: white
- Border bottom: `1px solid var(--color-border)`
- Display: flex, justify-content: space-between, align-items: center
- Padding: `var(--space-4)`
- Logo / title: `var(--text-xl)`, `var(--font-bold)`

---

## 8. Shared CSS Snippet

Copy this `<style>` block into the `<head>` of every prototype HTML file:

```html
<style>
  :root {
    /* Colors */
    --color-primary: #2563eb;
    --color-primary-hover: #1d4ed8;
    --color-secondary: #64748b;
    --color-accent: #16a34a;
    --color-error: #dc2626;
    --color-warning: #d97706;
    --color-bg: #ffffff;
    --color-bg-alt: #f8fafc;
    --color-text: #1e293b;
    --color-text-muted: #64748b;
    --color-border: #e2e8f0;
    --color-todo: #dbeafe;
    --color-in-progress: #fef3c7;
    --color-done: #dcfce7;

    /* Typography */
    --text-xs: 0.75rem;
    --text-sm: 0.875rem;
    --text-base: 1rem;
    --text-lg: 1.125rem;
    --text-xl: 1.25rem;
    --text-2xl: 1.5rem;
    --text-3xl: 1.875rem;
    --leading-tight: 1.25;
    --leading-normal: 1.5;
    --leading-relaxed: 1.75;
    --font-normal: 400;
    --font-medium: 500;
    --font-semibold: 600;
    --font-bold: 700;

    /* Spacing (4px grid) */
    --space-1: 0.25rem;
    --space-2: 0.5rem;
    --space-3: 0.75rem;
    --space-4: 1rem;
    --space-6: 1.5rem;
    --space-8: 2rem;
    --space-12: 3rem;
    --space-16: 4rem;

    /* Border Radius */
    --radius-sm: 0.25rem;
    --radius-md: 0.375rem;
    --radius-lg: 0.5rem;
    --radius-full: 9999px;

    /* Shadows */
    --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
    --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
    --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
  }

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: system-ui, -apple-system, sans-serif;
    font-size: var(--text-base);
    line-height: var(--leading-normal);
    color: var(--color-text);
    background: var(--color-bg);
  }

  /* Buttons */
  .btn {
    display: inline-flex; align-items: center; gap: var(--space-2);
    padding: var(--space-2) var(--space-4);
    font-size: var(--text-sm); font-weight: var(--font-medium);
    border-radius: var(--radius-md);
    border: none; cursor: pointer;
    transition: background-color 0.15s ease;
  }
  .btn-primary { background: var(--color-primary); color: #fff; }
  .btn-primary:hover { background: var(--color-primary-hover); }
  .btn-secondary { background: #fff; color: var(--color-primary); border: 1px solid var(--color-border); }
  .btn-secondary:hover { background: var(--color-bg-alt); }
  .btn-danger { background: var(--color-error); color: #fff; }
  .btn-danger:hover { opacity: 0.9; }

  /* Inputs */
  .input {
    width: 100%; padding: var(--space-2);
    font-size: var(--text-base);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    outline: none;
  }
  .input:focus { border-color: var(--color-primary); box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.2); }

  /* Cards */
  .card {
    background: #fff; border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-sm);
    padding: var(--space-4);
  }

  /* Badges */
  .badge {
    display: inline-block;
    padding: var(--space-1) var(--space-2);
    font-size: var(--text-xs); font-weight: var(--font-medium);
    border-radius: var(--radius-full);
  }
  .badge-todo { background: var(--color-todo); color: var(--color-primary); }
  .badge-in-progress { background: var(--color-in-progress); color: var(--color-warning); }
  .badge-done { background: var(--color-done); color: var(--color-accent); }

  /* Nav */
  .nav {
    display: flex; justify-content: space-between; align-items: center;
    padding: var(--space-4);
    background: #fff;
    border-bottom: 1px solid var(--color-border);
  }

  /* Table */
  table { width: 100%; border-collapse: collapse; }
  th { font-weight: var(--font-semibold); text-align: left; border-bottom: 2px solid var(--color-border); }
  td, th { padding: var(--space-2) var(--space-3); }
  tr:nth-child(even) { background: var(--color-bg-alt); }
  td { border-bottom: 1px solid var(--color-border); }

  /* Utility */
  .text-muted { color: var(--color-text-muted); }
  .text-sm { font-size: var(--text-sm); }
  .text-lg { font-size: var(--text-lg); }
  .text-xl { font-size: var(--text-xl); }
  .text-2xl { font-size: var(--text-2xl); }
  .font-bold { font-weight: var(--font-bold); }
  .font-semibold { font-weight: var(--font-semibold); }
  .mt-2 { margin-top: var(--space-2); }
  .mt-4 { margin-top: var(--space-4); }
  .mb-2 { margin-bottom: var(--space-2); }
  .mb-4 { margin-bottom: var(--space-4); }
  .p-4 { padding: var(--space-4); }
  .flex { display: flex; }
  .gap-2 { gap: var(--space-2); }
  .gap-4 { gap: var(--space-4); }
</style>
```
