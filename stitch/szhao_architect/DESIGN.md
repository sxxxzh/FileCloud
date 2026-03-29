# Design System Specification: Architectural Minimalism

## 1. Overview & Creative North Star: "The Digital Monolith"
This design system is built upon the concept of **The Digital Monolith**. It rejects the cluttered, colorful "SaaS-standard" look in favor of a high-end, editorial aesthetic inspired by brutalist architecture and premium Swiss typography. 

The goal is to convey absolute security and institutional reliability through restraint. By utilizing a strict monochrome palette and razor-sharp geometry, we create a "Quiet Luxury" experience. We break the template look by using **intentional asymmetry**, expansive negative space (white space as a functional element), and a typographic hierarchy that feels like a prestigious financial journal rather than a utility app.

---

## 2. Colors & Tonal Depth
The palette is a sophisticated range of achromatic tones designed to create depth through layering rather than lines.

### Core Palette
- **Primary (`#000000`)**: Used for high-impact typography and primary CTAs. It represents the "solid ground" of the system.
- **Surface (`#fcf9f8`)**: A slightly warm, "gallery white" that prevents eye strain and feels more premium than pure hex white.
- **Secondary (`#5f5e5e`)**: Used for secondary information and de-emphasized actions.

### The "No-Line" Rule
Standard 1px borders are strictly prohibited for sectioning. Structural definition must be achieved through **Background Color Shifts**. 
*   **Example:** A `surface-container-low` (#f6f3f2) sidebar sitting against a `surface` (#fcf9f8) main content area.
*   **The Signature Texture:** For primary CTAs, use a subtle linear gradient from `primary` (#000000) to `primary-container` (#3b3b3b) at a 45-degree angle to add a "milled metal" feel.

### Glassmorphism Implementation
For floating menus or top navigation bars, use `surface-container-lowest` (#ffffff) with **60% opacity** and a **24px backdrop-blur**. This ensures the UI feels like layered sheets of architectural glass rather than flat digital boxes.

---

## 3. Typography: The Editorial Voice
We utilize a pairing of **Inter** (for Latin characters) and **Noto Sans SC** (for Chinese characters). The relationship between large display type and microscopic, high-contrast labels is the soul of this system.

- **Display (Large/Medium)**: Use for "Big Data" moments (e.g., storage capacity). Set with `-0.02em` tracking to feel dense and authoritative.
- **Headline (Small)**: Used for section headers. Always in `primary` (#000000).
- **Body-MD**: The workhorse. Use `on_surface_variant` (#474747) for long-form reading to maintain a soft, premium contrast.
- **Label-SM**: Always uppercase with `+0.05em` letter spacing when used for metadata or category tags.

---

## 4. Elevation & Depth: Tonal Layering
We do not use shadows to show importance; we use **Tonal Nesting**.

### The Layering Principle
Hierarchy is defined by the "closeness" to the user:
1.  **Base Layer**: `surface` (#fcf9f8) - The canvas.
2.  **Section Layer**: `surface-container-low` (#f6f3f2) - For grouping content areas.
3.  **Object Layer**: `surface-container-lowest` (#ffffff) - For cards or interactive elements.

### Ambient Shadows
If a floating element (like a modal) requires a shadow, it must be an **Ambient Shadow**:
- `box-shadow: 0 20px 40px rgba(28, 27, 27, 0.06);`
- The shadow color must be a derivative of `on_surface` (#1c1b1b), never pure black.

---

## 5. Components

### Buttons (Sharp & Intentional)
- **Primary**: Background `#000000`, Text `#ffffff`. Radius: `0px`. 
- **Secondary**: Background `transparent`, Border `1px solid #c6c6c6` (The Ghost Border), Text `#000000`.
- **Interaction**: On hover, Primary buttons shift to `primary_fixed` (#5e5e5e). Transitions must be immediate (150ms) to feel "mechanical" and responsive.

### Input Fields
- **Styling**: No bottom line or full border. Use a subtle background fill of `surface_container` (#f0edec).
- **State**: On focus, the background shifts to `surface_container_high` (#ebe7e7) with a 1px `primary` (#000000) left-accent bar.

### Cards & Lists
- **Rule**: Forbid divider lines. 
- **Execution**: Separate file list items using `1.4rem` (Spacing 4) of vertical padding. Distinguish the "Header" row from the "Data" rows by giving the header a `surface-dim` (#dcd9d9) background.

### Data Visualization (Cloud Storage Specific)
- **The Capacity Bar**: A solid `primary` (#000000) bar against a `secondary_container` (#d6d4d3) track. No rounded ends—keep them perfectly rectangular.

---

## 6. Do’s and Don’ts

### Do
- **Use "White Space" as a border.** Use the Spacing Scale (specifically `8` and `12`) to separate disparate functional groups.
- **Align to a strict grid.** Architecture is precise; your UI should be too.
- **Use thin-line icons (1px or 1.5px stroke).** Icons should be seen as "diagrams," not "illustrations."

### Don’t
- **Do not use "Success Green" or "Warning Orange" unless mandatory.** Use `on_surface` for everything. Only `error` (#ba1a1a) is permitted for destructive actions (e.g., permanent file deletion).
- **No Rounded Corners.** The `0px` radius is our signature. It conveys a "Pro" tool feel. Max `4px` is only permitted for small mobile-touch targets if strictly necessary.
- **No standard drop shadows.** If the layout feels flat, increase the contrast between `surface` tiers rather than adding a shadow.

### Accessibility Note
While we are "Minimalist," we are not "Invisible." Ensure that `on_surface_variant` (#474747) is used for secondary text to maintain a high enough contrast ratio against the `surface` background for WCAG compliance.