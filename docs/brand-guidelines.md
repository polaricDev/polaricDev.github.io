# Polaric Brand Guidelines v1.0

> Polaric turns the notch at the top of a MacBook or Windows screen into a living island.
> The identity is built from that one picture: a black shape at the top of the screen, lit from
> behind by moving colour, on a night that fades from black into deep blue.

## Quick Reference

| Item | Value |
|---|---|
| Name | Polaric (never POLARIC, never Polaric Notch in running text after first use) |
| Line | Your notch, alive. |
| Ground | Abyss `#02040D` → Midnight `#050B23` → Navy `#0A2973` |
| Accent | Signal Blue `#3A90F6` |
| Light | Ice `#22D3EE` → Signal `#4F8BFF` (gradient type, one word a screen) |
| Display face | Bricolage Grotesque, 500, tracking −3% to −4% |
| Text face | Funnel Sans 400 / 500 |
| Mono | DM Mono (shortcuts, versions, counts) |
| Signature | The notch with its living glow (Prism: blue, cyan, green, gold, orange, rose) |

## 1. Color Palette

### Primary Colors

| Name | Hex | Use |
|---|---|---|
| Abyss | #02040D | the page ground at the top, the notch itself |
| Midnight | #050B23 | the page ground, panels on black |
| Navy | #0A2973 | the far end of every ground gradient, the brand band |
| Signal Blue | #3A90F6 | the one accent: primary button, links, focus, live state |

### Secondary Colors

| Name | Hex | Use |
|---|---|---|
| Ice | #22D3EE | the light end of the type gradient, success in UI |
| Royal | #102C6C | surfaces on the ground, hairline glow |
| Mint | #34D399 | "done" states only (Analysis Complete, task done) |

### Neutral Palette

| Name | Hex | Use |
|---|---|---|
| Frost | #EEF3FF | text, icons on the ground |
| Mist | #93A4C8 | secondary text, labels, meta |
| Line | rgba(238,243,255,.12) | hairlines, card borders |
| Surface | #0A1530 | cards, panels, the simulator chrome |

### Semantic Colors

| Name | Hex | Use |
|---|---|---|
| Success | #34D399 | finished, connected |
| Warning | #FFC94D | network unstable, battery low |
| Error | #FF5F7E | refused, failed |
| Info | #3A90F6 | updates, tips |

### The glow (signature)

The glow is the brand's one moving colour. Twenty palettes ship in the app; the site leads with
**Prism** `#3D8BFF #22D3EE #34D399 #FFD25A #FF8A4C #FF5F7E` and lets visitors try the rest.
It is drawn exactly as the app draws it: a blurred stroke that follows the notch outline with a
conic gradient turning 30°/s, plus six soft blobs wandering along the notch's foot, screen-blended,
masked to the notch shape grown by its reach. Never a flat drop shadow, never a box glow.

### Accessibility

- Frost on Midnight: 16.9:1. Mist on Midnight: 7.4:1. Signal Blue on Abyss: 6.3:1.
- Gradient type only at 40px and up, one word or phrase a screen.
- Colour never carries meaning alone: every state also has a word.

## 2. Typography

### Font Stack

```css
--font-display: "Bricolage Grotesque", system-ui, sans-serif; /* the app's own face */
--font-text: "Funnel Sans", system-ui, sans-serif;
--font-mono: "DM Mono", ui-monospace, Menlo, monospace;
```

### Type Scale

| Level | Desktop / phone | Weight | Tracking |
|---|---|---|---|
| Hero | 72 / 40 | 500 | −4% |
| H2 | 48 / 30 | 500 | −3% |
| H3 | 28 / 24 | 500 | −2% |
| Lead | 20 / 18 | 400 | 0 |
| Body | 16 / 16 | 400 | 0 |
| Label | 13 / 13 | 500 | +2%, sentence case |

### Font Loading

Bricolage Grotesque is self-hosted (`assets/fonts/BricolageGrotesque.woff2`, variable, OFL).
Funnel Sans and DM Mono from Google Fonts with `display=swap`.

## 3. Logo Usage

### Variants

- **App icon** (`assets/img/polaric-icon.png`): the user's own artwork. Never redrawn, recoloured
  or cropped. It is the logo on every surface.
- **Lockup**: icon + "Polaric" in Bricolage Grotesque 500, icon height = cap height × 1.6.
- **Notch mark** (`assets/img/brand/notch-mark.svg`): the notch shape alone, for favicons on black
  and small UI. Drawn from the app's own `NotchShape` path (flare + rounded foot).

### Clear Space

One notch height (the icon's width ÷ 4) on every side.

### Minimum Size

Icon 20px on screen, 8mm in print. Lockup 96px wide.

### Don'ts

- No glow behind the app icon (the glow belongs to the notch).
- No outline, drop shadow, gradient fill or rotation.
- No icon on a light ground without its own dark tile.

## 4. Voice & Tone

### Brand Personality

Precise, warm, a little playful (the mascots), never loud.

### Voice Chart

| We are | We are not |
|---|---|
| exact: shortcuts, numbers, versions | vague: "powerful", "seamless" |
| friendly: the mascots wave | childish |
| private by default | preachy about privacy |

### Tone by Context

| Context | Tone |
|---|---|
| Hero, features | plain claims with one fact |
| Release notes | what changed, in the user's words |
| Bug fixes | own it plainly: "A recent update left your data unreadable. We've fixed this bug." |
| Errors in the app | short, kind, what to do next |

### Prohibited Terms

seamless, effortless, unlock, elevate, supercharge, next-generation, game-changing, revolutionary.

## 5. Imagery Guidelines

### Photography Style

None. Polaric is shown as itself: the notch, live in the browser, or real captures.

### Illustrations

The 74 mascots are the only illustrations. They sit beside the camera, never as decoration.

### Icons

Real app logos in their own colours (WhatsApp, Gmail, Slack…). UI glyphs: 1.6px rounded strokes.

## 6. Design Components

### Buttons

Solid, 44px, radius 999px for pills in the notch, 10px on the page. Primary = Signal Blue with
Abyss text. Secondary = 1px Line border on transparent.

### Spacing Scale

4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 · 96 · 128

### Border Radius

| Token | Value | Use |
|---|---|---|
| sm | 10px | controls |
| md | 16px | panels |
| lg | 24px | cards, frames |
| notch | flare 10, foot 14 (closed) / 24 (open) | the notch shape only |

### Motion

- Ease out `cubic-bezier(.22,1,.36,1)` for anything settling; springs in the notch (open 0.42 s).
- The glow turns 30°/s at speed 1; blobs breathe on 4–9 s cycles.
- Nothing bounces past its mark. Reduced motion: the glow holds still, every state shows at once.

## AI Image Generation

### Base Prompt Template

"A MacBook screen top in a dark room, the black camera notch glowing from behind with soft
moving colour (blue, cyan, green, gold, coral), deep navy night gradient, crisp, minimal."

### Style Keywords

night, glass, glow, precise, calm, premium

### Visual Mood Descriptors

black to deep blue, a single light source at the top of the frame

### Visual Don'ts

purple-heavy grounds, neon cyberpunk, lens flares, people's faces on screens

### Example Prompts

- "Close-up of a black notch on a MacBook, multicolour glow along its rounded lower edge, navy gradient"

## Changelog

- v1.0 (2026-11-11): first guide, from the app (NotchGlow, GlowColor, Bricolage Grotesque) and the
  1.4.2 release posts.
