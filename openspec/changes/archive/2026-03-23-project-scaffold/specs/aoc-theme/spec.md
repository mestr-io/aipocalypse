## ADDED Requirements

### Requirement: Shared HTML layout
The project SHALL have a layout function at `src/views/layout.ts` that wraps page content in a complete HTML document. The layout SHALL include the doctype, head (with charset, viewport, title, and CSS link), a navigation bar, main content area, and footer.

#### Scenario: Layout produces valid HTML
- **WHEN** the layout function is called with a title and body content
- **THEN** it returns a complete HTML5 document string with the content wrapped in the nav/main/footer structure

#### Scenario: Navigation shows site title
- **WHEN** any page is rendered through the layout
- **THEN** the navigation bar displays "AIPocalypse" as a link to `/`

#### Scenario: CSS is linked
- **WHEN** the layout renders the `<head>`
- **THEN** it includes a `<link>` to `/public/style.css`

### Requirement: Advent of Code visual theme
The CSS SHALL implement a visual style inspired by Advent of Code with the following properties:
- Background color: `#0f0f23` (dark navy)
- Primary text color: `#cccccc` (light grey)
- Accent color: `#00cc00` (terminal green)
- Highlight color: `#ffff66` (gold)
- Dimmed color: `#333340` (dark grey)
- Link color: `#009900` (dark green), with `#00cc00` on hover
- Font: `"Source Code Pro", monospace`

#### Scenario: Dark background renders
- **WHEN** any page loads in a browser
- **THEN** the page background is `#0f0f23` and text is `#cccccc` in a monospace font

#### Scenario: Links use green color scheme
- **WHEN** links are rendered
- **THEN** they appear in `#009900` and change to `#00cc00` on hover with no underline by default

### Requirement: AoC-style progress bars
The CSS SHALL support progress bars rendered as `[*******     ]` where completed stars are gold (`#ffff66`) and the remaining space is dimmed grey (`#333340`). Progress bars are pure HTML/CSS with no JavaScript.

#### Scenario: Progress bar at 50%
- **WHEN** a progress bar element is rendered with 50% completion
- **THEN** it displays as `[**********          ]` with the stars in gold and remaining space in dimmed grey (approximately, based on character width)

#### Scenario: Progress bar at 0%
- **WHEN** a progress bar element is rendered with 0% completion
- **THEN** it displays as `[                    ]` with all dimmed characters

#### Scenario: Progress bar at 100%
- **WHEN** a progress bar element is rendered with 100% completion
- **THEN** it displays as `[********************]` with all stars in gold

### Requirement: Responsive monospace layout
The layout SHALL be readable on both desktop and mobile. Content SHALL have a maximum width to maintain readability of monospace text. The layout SHALL NOT use heavy UI components, rounded cards, or gradients.

#### Scenario: Desktop viewport
- **WHEN** the page is viewed on a desktop browser (>768px)
- **THEN** content is centered with a max-width and comfortable padding

#### Scenario: Mobile viewport
- **WHEN** the page is viewed on a mobile browser (<768px)
- **THEN** content fills the screen width with appropriate padding and text remains readable
