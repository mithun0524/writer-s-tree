# Writer's Tree - Design & Interface Specification

## 1. Design Philosophy

### 1.1 Core Principles
- **Minimal Distraction**: Every element serves the writer, nothing exists purely for aesthetics
- **Organic Motion**: All transitions mirror natural growth - never mechanical
- **Typographic Excellence**: Text is the hero; typography must be flawless
- **Breathing Space**: Generous whitespace creates mental clarity
- **Subtle Celebration**: Delight through micro-interactions, not overwhelming effects

### 1.2 Design Values
- Calm over excitement
- Function over decoration
- Elegance over complexity
- Rhythm over rigidity

## 2. Visual Design System

### 2.1 Color Palette

#### Primary Colors
```
Background Primary:    #FEFDFB (Warm off-white)
Background Secondary:  #F8F6F3 (Subtle cream)
Text Primary:          #2C2C2C (Rich black)
Text Secondary:        #6B6B6B (Medium grey)
Text Tertiary:         #A8A8A8 (Light grey)
```

#### Tree & Nature Colors
```
Tree Trunk:           #5C4A3A (Warm brown)
Tree Bark Shadow:     #3D2F24 (Deep brown)
Leaves Young:         #7CB342 (Fresh green)
Leaves Mature:        #558B2F (Deep green)
Leaves Highlight:     #9CCC65 (Bright green)
```

#### Accent & Interaction
```
Bloom Pink:           #FFA5C0 (Soft pink - for blooming effects)
Bloom Deep:           #FF6B9D (Rich pink - for milestones)
Focus Accent:         #4A90E2 (Calm blue)
Success:              #7CB342 (Growth green)
Warning:              #FFB74D (Amber)
```

#### Dark Mode (Optional Phase 2)
```
Background Primary:    #1A1A1A
Background Secondary:  #242424
Text Primary:          #E8E8E8
Tree Trunk:           #8B7355
```

### 2.2 Typography

#### Font Stack
**Primary (Body/Editor)**: 
- Serif: `'Lora', 'Crimson Text', 'Georgia', serif`
- Purpose: Long-form reading comfort, literary feel
- Size: 18px base, 1.8 line-height

**Secondary (UI/Interface)**:
- Sans-serif: `'Inter', 'SF Pro Display', 'Segoe UI', system-ui, sans-serif`
- Purpose: Clarity for controls, counts, labels
- Size: 14px base, 1.5 line-height

**Monospace (Keyboard/Code)**:
- `'JetBrains Mono', 'Fira Code', 'Consolas', monospace`
- Purpose: Keyboard visualization, word suggestions
- Size: 13px, 1.4 line-height

#### Type Scale
```
Hero:          48px / 56px line-height (Project titles on start)
H1:            32px / 40px
H2:            24px / 32px
H3:            20px / 28px
Body Large:    18px / 32px (Editor text)
Body:          16px / 24px
Small:         14px / 20px
Tiny:          12px / 18px (Keyboard hints)
```

#### Font Weights
- Light: 300 (Subtle UI labels)
- Regular: 400 (Body text)
- Medium: 500 (Emphasis)
- Semi-bold: 600 (Headings)
- Bold: 700 (Never used - too heavy)

### 2.3 Spacing System
Based on 8px grid for consistency:
```
XXS:  4px   (Tight elements)
XS:   8px   (Compact spacing)
SM:   16px  (Related elements)
MD:   24px  (Section padding)
LG:   32px  (Major sections)
XL:   48px  (Panel separation)
XXL:  64px  (Hero spacing)
```

### 2.4 Elevation & Shadows
Subtle shadows for depth without harshness:
```
Level 1:  0 1px 3px rgba(0,0,0,0.04)
Level 2:  0 2px 8px rgba(0,0,0,0.06)
Level 3:  0 4px 16px rgba(0,0,0,0.08)
Level 4:  0 8px 32px rgba(0,0,0,0.10)
```

### 2.5 Border Radius
```
Small:    4px  (Buttons, inputs)
Medium:   8px  (Cards, panels)
Large:    12px (Modals)
Round:    50% (Circular elements)
```

### 2.6 Animation Timing
All animations use cubic-bezier easing for organic feel:
```
Quick:     150ms cubic-bezier(0.4, 0, 0.2, 1)  // Hovers
Standard:  300ms cubic-bezier(0.4, 0, 0.2, 1)  // Transitions
Slow:      500ms cubic-bezier(0.4, 0, 0.2, 1)  // Major changes
Organic:   800ms cubic-bezier(0.34, 1.56, 0.64, 1)  // Tree growth
Bloom:     1200ms cubic-bezier(0.25, 0.46, 0.45, 0.94) // Flower effects
```

## 3. Layout Architecture

### 3.1 Split-Screen Layout (Primary View)

```
┌────────────────────────────────────────────────────────────┐
│  [Logo]              Word Count: 2,847 / 50,000      [⚙︎]  │ ← Header (64px)
├──────────────────────────┬─────────────────────────────────┤
│                          │                                 │
│                          │                                 │
│   EDITOR PANEL (60%)     │   TREE PANEL (40%)              │
│                          │                                 │
│   [Writing Area]         │   [Living Tree Visualization]   │
│                          │                                 │
│                          │                                 │
│                          │                                 │
│                          │                                 │
├──────────────────────────┴─────────────────────────────────┤
│  [Keyboard Visualization + Word Suggestions]               │ ← Footer (80px)
└────────────────────────────────────────────────────────────┘
```

### 3.2 Panel Dimensions

**Desktop (1920x1080)**
- Editor Panel: 1152px width (60%)
- Tree Panel: 768px width (40%)
- Header: 64px height
- Footer: 80px height
- Writing area: Content width 800px max (centered in panel)

**Laptop (1440x900)**
- Editor Panel: 864px width (60%)
- Tree Panel: 576px width (40%)
- Writing area: Content width 680px max

**Tablet (1024x768) - Phase 2**
- Vertical stack: Editor top, Tree bottom
- Or tab-based switching

### 3.3 Responsive Breakpoints
```
Mobile:     < 768px   (Stacked, simplified)
Tablet:     768-1023px (Adjustable split)
Laptop:     1024-1439px (60/40 split)
Desktop:    1440-1919px (60/40 split)
Large:      ≥ 1920px (Max 2400px, centered)
```

## 4. Interface Components

### 4.1 Header Bar

#### Layout
```
┌──────────────────────────────────────────────────────────────┐
│  🌱 Writer's Tree    [Project Title]    2,847/50,000    [⚙︎] │
│  ↑                   ↑                   ↑                ↑    │
│  Logo (32px)         Editable title     Progress         Menu │
└──────────────────────────────────────────────────────────────┘
```

#### Elements
1. **Logo/Brand** (Left)
   - Icon: Minimalist sapling symbol (32x32px)
   - Text: "Writer's Tree" (14px, Inter Medium)
   - Color: #558B2F (tree green)
   - Hover: Gentle scale (1.05x)

2. **Project Title** (Center-Left)
   - Editable on click
   - Font: Inter Semi-bold, 16px
   - Color: #2C2C2C
   - Max width: 300px, truncate with ellipsis
   - Placeholder: "Untitled Project"

3. **Word Count Display** (Center-Right)
   - Format: "Current / Goal"
   - Font: JetBrains Mono, 14px
   - Color: #6B6B6B
   - Updates in real-time
   - Subtle pulse animation when milestone reached

4. **Settings Icon** (Right)
   - Icon: Gear/Cog (20x20px)
   - Hover: Rotate 45° clockwise
   - Opens settings panel (overlay)

#### Visual Treatment
- Background: #FEFDFB (solid)
- Bottom border: 1px solid #F0EDE8
- Shadow: Level 1 (subtle)
- Padding: 16px 32px

### 4.2 Editor Panel

#### Container
```
┌────────────────────────────────┐
│  [          Padding 48px     ] │
│                                │
│    The cursor blinked          │
│    steadily in the empty       │
│    document. Outside, rain     │
│    tapped against the...       │
│                                │
│    [Typing area continues]     │
│                                │
│  [                           ] │
└────────────────────────────────┘
```

#### Specifications
- **Background**: #FEFDFB (pure, no texture)
- **Padding**: 48px all sides on desktop
- **Content Width**: 800px max (optimal line length)
- **Text Color**: #2C2C2C
- **Font**: Lora, 18px, 400 weight
- **Line Height**: 32px (1.78 ratio - perfect readability)
- **Paragraph Spacing**: 24px margin-bottom
- **Cursor**: 2px width, #4A90E2, 1s blink

#### Text Selection
- Background: rgba(74, 144, 226, 0.15)
- Smooth transition on selection change

#### Focus State
- No visible outline (clean)
- Tree panel slightly dims (opacity: 0.92) when typing
- Returns to full opacity after 3s of inactivity

#### Formatting Toolbar (Minimal, Hidden by Default)
Appears on text selection:
```
[B] [I] [H1] [H2] [Quote]
```
- Position: Floating above selection
- Background: White with Level 3 shadow
- Icons: 16px, #6B6B6B
- Hover: #2C2C2C
- Keyboard shortcuts shown on hover

### 4.3 Tree Panel

#### Container
```
┌───────────────────────────┐
│                           │
│         🌸                │
│       /   \               │
│      /     \     🌸       │
│     |   🌳  |             │
│     |       |             │
│     |       |             │
│    ─┴───────┴─            │
│                           │
│  [Growth: 38%]   [⚙︎]     │
└───────────────────────────┘
```

#### Specifications
- **Background**: Linear gradient
  - Top: #F8F6F3
  - Bottom: #FEFDFB
  - Subtle, creates depth
- **Padding**: 32px all sides
- **Tree Canvas**: SVG, fills available space
- **Tree Position**: Bottom-centered, grows upward
- **Ground Line**: Subtle 1px line, #E0DDD8

#### Tree Rendering Details
- **Trunk Width**: Scales with growth (8px → 32px)
- **Branch Count**: Determined by growth stage
- **Leaf Opacity**: Fades in gradually per leaf (staggered)
- **Animation**: Continuous subtle sway (2-3° rotation, 4s duration, infinite)

#### Control Elements
**Bottom-Right Corner:**
1. **Growth Percentage**
   - Font: JetBrains Mono, 12px
   - Color: #A8A8A8
   - Format: "Growth: XX%"
   - Updates smoothly (count-up animation)

2. **Tree Controls** (Icon)
   - Zoom In/Out
   - Reset View
   - Toggle Season
   - Export Tree Image

#### Micro-interactions
- **Branches**: Subtle highlight on hover (if interactive)
- **Leaves**: Gentle flutter on mouse proximity
- **Ground**: Small grass/flower sprites at 50%+ growth

### 4.4 Keyboard Visualization Panel

#### Layout
```
┌──────────────────────────────────────────────────────────────┐
│  [Q][W][E][R][T][Y]... (Current key highlighted)             │
│                                                               │
│  Suggestions:  1.continued  2.character  3.carefully         │
└──────────────────────────────────────────────────────────────┘
```

#### Keyboard Display
**Top Section (40px height):**
- Simplified keyboard layout (not full QWERTY, just active keys)
- Only show keys as they're pressed
- Active key: 
  - Background: #4A90E2
  - Color: White
  - Scale: 1.1x
  - Shadow: Level 2
  - Duration: 150ms
- Inactive keys: 
  - Background: #F8F6F3
  - Border: 1px solid #E0DDD8
  - Color: #6B6B6B

**Key Styling:**
- Size: 32x32px squares
- Border-radius: 4px
- Font: JetBrains Mono, 14px
- Gap: 4px between keys
- Only show ~15 keys centered (active typing area)

#### Word Suggestions
**Bottom Section (40px height):**
```
Suggestions:  ①continued  ②character  ③carefully
```

**Specifications:**
- Font: JetBrains Mono, 13px
- Label: "Suggestions:" in #A8A8A8
- Word format: Circled number + word
  - Number: #4A90E2 (matches keyboard accent)
  - Word: #2C2C2C
  - Hover: Underline + slight bold
- Spacing: 24px between suggestions
- Max 3 suggestions always
- Updates as user types (debounced 100ms)

**Interaction:**
- Press `1`, `2`, or `3` to insert suggestion
- Visual feedback: Brief flash (#7CB342 background, 200ms)
- Inserted word continues with space
- Fade-in animation when suggestions update (300ms)

#### Container Styling
- Background: #FFFFFF
- Top border: 1px solid #E0DDD8
- Shadow: Level 2 (elevated above editor)
- Padding: 12px 32px
- Flexbox: Space-between (keyboard left, suggestions right)

### 4.5 Settings Panel (Overlay)

Slides in from right (400px width):
```
┌─────────────────────────┐
│  ← Settings             │
├─────────────────────────┤
│                         │
│  🎨 Appearance          │
│    □ Dark Mode          │
│    □ Dyslexic Font      │
│                         │
│  🌳 Tree Settings       │
│    Season: [Spring ▼]   │
│    Style: [Oak ▼]       │
│                         │
│  📊 Writing Goal        │
│    Words: [50000]       │
│                         │
│  ⌨️  Keyboard           │
│    □ Show Keyboard      │
│    □ Word Suggestions   │
│                         │
│  💾 Export              │
│    [Download .docx]     │
│    [Download .pdf]      │
│                         │
└─────────────────────────┘
```

**Styling:**
- Background: #FFFFFF
- Shadow: Level 4 (prominent)
- Slide animation: 300ms ease-out
- Close: Click outside or ESC key

## 5. Micro-interactions & Transitions

### 5.1 Tree Growth Animation

**Continuous Growth (Every Word):**
- Target growth percentage calculated from word count
- Smooth interpolation to target over 800ms
- Easing: Organic cubic-bezier
- New branches appear when crossing growth thresholds
- Branch emergence: Fade + scale from 0.5 to 1.0 (500ms)

**On Type Animation:**
- Subtle pulse in trunk (scale 1.0 → 1.02 → 1.0, 600ms)
- Triggered every 50 words typed
- Nearest leaves flutter (2-3 leaves, gentle rotation)

### 5.2 Bloom Effect (Milestones)

**Trigger Points:** 25%, 50%, 75%, 100%

**Animation Sequence:**
1. **Bud Appearance** (0-400ms)
   - Small pink circles appear on branches
   - Fade in + scale (0 → 1)
   - Positioned randomly on upper branches
   
2. **Bloom Opening** (400-1200ms)
   - Buds expand into flower shapes
   - 5-petal design using SVG paths
   - Color: #FFA5C0 → #FF6B9D gradient
   - Rotation: 0° → 360° (slow spin)
   - Scale: 1.0 → 1.5
   
3. **Petal Fall** (1200-3000ms)
   - Individual petals detach
   - Float downward with gentle sway
   - Fade out as they reach bottom
   - Physics: Subtle gravity + wind effect
   
4. **Particles** (Throughout)
   - Sparkle particles around blooms
   - Small circles, #FFA5C0, 2-4px
   - Appear and fade (800ms lifespan)
   - Total: 20-30 particles

**User Control:**
- Can be skipped (ESC key or click)
- Replays on request from milestone indicator

### 5.3 Typing Feedback

**Per Keystroke:**
- Keyboard key highlight (150ms)
- If word boundary (space/punctuation):
  - Suggestion refresh (fade out old, fade in new, 200ms)
  - Word count increment (count-up animation, 300ms)

**Per Sentence (Period/Exclamation/Question):**
- Subtle leaf rustle on tree (2-3 second wave through canopy)
- Sound: Optional gentle chime (can disable)

**Per Paragraph (Double line break):**
- Gentle upward growth burst (+0.1% growth immediately)
- Visible branch thickening if near threshold

### 5.4 Suggestion Selection

**When pressing 1/2/3:**
1. Keyboard shows number key pressed (150ms)
2. Selected suggestion highlights (#7CB342 bg, 100ms)
3. Word inserts with fade-in (200ms)
4. Cursor positions after word + space
5. New suggestions appear (300ms delay)

### 5.5 Idle State Animation

**After 10s of No Typing:**
- Tree begins deeper sway (4° rotation, slower)
- Occasional leaf drift (1 leaf every 3s falls gently)
- Ambient particles float up from ground (fireflies at night mode)
- Word count display subtle pulse (every 3s)

**Resume Typing:**
- All idle animations cease immediately
- Smooth transition back to active state (300ms)

### 5.6 Focus Transitions

**Editor Focused:**
- Tree panel dims to 92% opacity (300ms)
- Keyboard panel brightens (border glow: #4A90E2, subtle)
- Settings icon fades slightly

**Tree Panel Hovered:**
- Editor maintains opacity
- Tree interactive elements appear (zoom controls, etc.)
- Cursor changes to indicate interactivity

**Settings Opened:**
- Main panels dim with overlay (rgba(0,0,0,0.3))
- Settings slides in from right (300ms)
- Focus trap within settings

## 6. Iconography

### 6.1 Icon Style
- **Design**: Outline style (2px stroke weight)
- **Size**: 20x20px standard, 16x16px small, 24x24px large
- **Color**: Inherits from context (#6B6B6B default)
- **Hover**: #2C2C2C + slight scale (1.1x)

### 6.2 Icon Set (Required)
```
Interface:
- Settings (gear/cog)
- Close (X)
- Menu (hamburger)
- Save (floppy/cloud)
- Export (download arrow)
- Info (i in circle)
- Help (?)

Formatting:
- Bold (B)
- Italic (I)
- H1, H2 (heading indicators)
- Quote (quotation marks)
- Link (chain)

Tree Controls:
- Zoom In (+)
- Zoom Out (-)
- Reset View (center arrows)
- Season Change (leaf/snowflake)
- Share (share arrows)

Feedback:
- Success (checkmark)
- Warning (!)
- Loading (spinner)
```

## 7. Loading & Empty States

### 7.1 Initial Load (First Time User)

**Sequence:**
1. **Logo Fade In** (0-500ms)
   - Centered sapling icon
   - Scale from 0.8 to 1.0
   
2. **Welcome Message** (500-1500ms)
   - "Welcome to Writer's Tree"
   - Subtitle: "Watch your story grow"
   - Fade in below logo
   
3. **Layout Reveal** (1500-2500ms)
   - Panels slide in from edges
   - Editor from left, Tree from right
   - Meet in center
   
4. **Ready State** (2500ms)
   - Cursor blinks in editor
   - Small seed visible in tree panel
   - Keyboard panel slides up from bottom

### 7.2 Project Load (Returning User)

**Sequence:**
1. **Quick Fade In** (0-300ms)
   - Full layout appears
   - No elaborate animation
   
2. **Tree Render** (0-800ms)
   - Tree grows from seed to current state
   - Accelerated playback of growth
   - Leaves populate gradually
   
3. **Content Load** (300ms)
   - Text fades in to last position
   - Scroll position restored

### 7.3 Empty Project State

**Editor Panel:**
```
          Click here to begin your story...
          
          Every word you write helps your tree grow.
```
- Text: Centered, #A8A8A8, Italic
- Fades out on first keystroke

**Tree Panel:**
- Single seed or tiny sprout
- Text below: "Your tree awaits..."
- Gentle pulsing animation (subtle)

### 7.4 Saving Indicator

**Auto-Save Feedback:**
- Small text in header (right side)
- States:
  - Typing: "..." (subtle dots)
  - Saving: "Saving..." (with spinner)
  - Saved: "All changes saved" (with checkmark, 2s, then fade)
- Font: Inter, 12px
- Color: #A8A8A8
- Fade transitions (200ms)

## 8. Accessibility Considerations

### 8.1 Keyboard Navigation
- Full tab-key navigation through all interactive elements
- Visible focus indicators (2px outline, #4A90E2)
- Escape key closes modals/settings
- Shortcuts displayed on hover

### 8.2 Screen Reader Support
- Semantic HTML throughout
- ARIA labels on all icons/buttons
- Live region for word count updates (polite)
- Tree described via alt text (growth percentage)

### 8.3 Visual Accessibility
- Color contrast ratios meet WCAG AA (4.5:1 minimum)
- No information conveyed by color alone
- Reduce motion option (disables tree sway, blooms)
- High contrast mode available

### 8.4 Font Accessibility
- OpenDyslexic option in settings
- Font size controls (16-24px range)
- Line height maintained for readability

## 9. Responsive Behavior

### 9.1 Tablet (768-1023px)

**Split Adjustment:**
- Editor: 55% width
- Tree: 45% width
- Keyboard panel: Collapsible (toggle button)
- Suggestions: Inline with keyboard (stacked)

### 9.2 Mobile (< 768px) - Phase 2

**Stacked Layout:**
- Editor: Full width
- Tree: Hidden by default (toggle to overlay)
- Keyboard panel: System keyboard only
- Suggestions: Top bar (3 chips)

**Tree Overlay (When Toggled):**
- Slides up from bottom (70vh height)
- Backdrop blur on editor
- Swipe down to dismiss

## 10. Design Deliverables Checklist

### For Development Handoff:
- [ ] Complete color palette with hex codes
- [ ] Typography scale with line heights
- [ ] Spacing system (8px grid)
- [ ] Component library (buttons, inputs, cards)
- [ ] Icon set (SVG exports)
- [ ] Animation specifications (timing, easing)
- [ ] Responsive breakpoints
- [ ] Accessibility requirements
- [ ] Empty states and loading animations
- [ ] Error states and validation
- [ ] Interactive prototype (Figma/Framer)
- [ ] Design tokens (JSON for developers)

### Design Files Structure:
```
/Writer-Tree-Design
  /Components
    - Header.fig
    - Editor.fig
    - Tree.fig
    - Keyboard.fig
    - Settings.fig
  /Layouts
    - Desktop.fig
    - Tablet.fig
    - Mobile.fig
  /Animations
    - TreeGrowth.fig
    - BloomEffect.fig
    - Micro-interactions.fig
  /Assets
    - Icons/
    - Tree-SVG/
    - Fonts/
  /Exports
    - design-tokens.json
    - style-guide.pdf
```

## 11. Brand Voice in UI Copy

### 11.1 Tone
- **Encouraging**: "You've written 1,000 words! Your tree is thriving."
- **Gentle**: "Take a break when you need to. Your tree will be here."
- **Poetic**: Not clinical ("Target achieved" ❌ / "Your story blooms" ✓)
- **Minimal**: Say less, mean more

### 11.2 Example Copy

**Milestones:**
- 25%: "Quarter way there. Buds are forming."
- 50%: "Halfway grown. Your tree reaches for the sky."
- 75%: "Almost there. Blossoms appear."
- 100%: "Complete. Your tree stands tall."

**Empty States:**
- New project: "Every great story starts with a single word."
- No projects: "Plant your first story."
- Error: "Something withered. Please try again."

**Tooltips:**
- Word count: "Words written / Goal"
- Tree: "Click to zoom"
- Export: "Take your story with you"

---

**Document Version**: 1.0  
**Last Updated**: January 25, 2026  
**Design Owner**: Design Team  
**Stakeholders**: Product, Engineering, UX Research