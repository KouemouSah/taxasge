# TaxasGE Mobile - Design System Documentation

## 🎨 Overview

This document describes the design system used in TaxasGE Mobile, following the official brand guidelines and creating a modern, accessible, and beautiful user experience.

## 📐 Design Principles

1. **Clarity First** - Information must be clear and easy to understand
2. **Accessibility** - Support for multiple languages (ES, FR, EN)
3. **Performance** - Smooth animations that don't sacrifice performance
4. **Consistency** - Unified design language across all screens
5. **Brand Aligned** - Strict adherence to official color palette

## 🎨 Color Palette

### Primary Colors

```typescript
Red:        #d10d00  // Primary actions, attention, CTA buttons
Blue:       #004aad  // Trust, security, backgrounds
Green:      #499003  // Innovation, AI features, success states
GreenLight: #def6e5  // Secondary backgrounds, accents
Yellow:     #ffde59  // Highlights, secondary CTAs
```

### Usage Guidelines

- **Red (#d10d00)**: Main CTA buttons, important alerts
- **Blue (#004aad)**: Trust-building elements, screen backgrounds
- **Green (#499003)**: AI features, success messages, positive actions
- **Yellow (#ffde59)**: Secondary actions, highlights, playful elements
- **White/Black**: Text, contrasts, backgrounds

## 🔤 Typography

### Type Scale

```typescript
Display:     48px / 56px line height - Hero titles
H1:          32px / 40px - Page titles
H2:          28px / 36px - Section headers
H3:          24px / 32px - Subsection headers
H4:          20px / 28px - Card titles
Body Large:  18px / 28px - Emphasized body text
Body:        16px / 24px - Standard body text
Body Small:  14px / 20px - Secondary information
Caption:     12px / 16px - Small labels, metadata
```

### Font Weights

- **Regular (400)**: Body text, descriptions
- **Medium (500/600)**: Labels, emphasized text
- **Bold (700)**: Headings, CTA buttons

## 📏 Spacing System

8px grid system:

```typescript
xs:   4px   // Tight spacing
sm:   8px   // Small gaps
md:   16px  // Standard spacing
lg:   24px  // Section spacing
xl:   32px  // Large sections
xxl:  48px  // Major sections
xxxl: 64px  // Hero sections
```

### Border Radius

```typescript
xs:   4px   // Subtle rounding
sm:   8px   // Cards
md:   12px  // Medium elements
lg:   16px  // Large cards
xl:   24px  // Featured elements
xxl:  32px  // Hero elements
full: 9999px // Pills, circular buttons
```

## 🎬 Animations

### Lottie Animations

Located in `src/assets/animations/`:

1. **calculatrice.json** (24KB)
   - Used in: Onboarding screen 2 (Consulta Sencilla)
   - Purpose: Illustrate calculation features
   - Loop: Yes

2. **robot.json** (19KB)
   - Used in: Onboarding screen 3 (TaxaBot AI)
   - Purpose: Represent AI chatbot assistant
   - Loop: Yes

3. **chatbot.json** (47KB)
   - Reserved for: Future chatbot features
   - Purpose: Interactive chat illustrations

### Animation Principles

- **Duration**: Keep animations under 400ms for interactions
- **Easing**: Use natural easing (spring, ease-out)
- **Purpose**: Every animation should have a purpose
- **Performance**: Target 60fps, test on older devices

## 📱 Onboarding Screens

### Screen 1: Welcome / Gestión Fiscal

**Visual Design:**
- Background: White to beige gradient
- Logo: TaxasGE logo at top
- Image: Guinean flag with 3D ribbon effect
- Text Color: Green (#499003) for title
- Button: Red (#d10d00) pill button

**Content:**
- Title: "La gestión fiscal"
- Subtitle: "nunca fue tan sencilla..."
- CTA: "Iniciar"

### Screen 2: Features / Consulta + Cálculo

**Visual Design:**
- Background: Blue (#004aad) gradient with diagonal pattern
- Split layout: Two sections
- Animation: Calculator Lottie
- Text Color: White
- Button: White pill with blue text

**Content:**
- Section 1: "Consulta Sencilla"
- Section 2: "Cálculo exacto"
- CTA: "Iniciar la exploración"

### Screen 3: TaxaBot AI

**Visual Design:**
- Background: Green (#499003) gradient with diagonal pattern
- Central circle: Light green (#def6e5) background
- Animation: Robot Lottie
- Text Color: White
- Button: Yellow (#ffde59) pill

**Content:**
- Title: "TaxaBot AI"
- Subtitle: "¡Adiós a la complejidad tributaria!"
- CTA: "Ver cómo TaxaBot le asiste"

## 🎯 Component Patterns

### Primary CTA Button

```typescript
Style:
- Border radius: Full (pill shape)
- Padding: 24px vertical, 32px horizontal
- Min width: 80% of screen
- Shadow: Large elevation
- Icon: White circle with arrow on right
```

### Pagination Dots

```typescript
Inactive: 8px × 8px circle, 30% opacity
Active: 24px × 8px pill, 100% opacity
Animated: Width interpolation
Color: Context-dependent (white on dark, green on light)
```

### Diagonal Pattern (Screens 2 & 3)

```typescript
Lines: 2px wide
Spacing: 50px apart
Rotation: 45 degrees
Opacity: 5% white
Purpose: Add depth and texture
```

## 📦 File Structure

```
src/
├── theme/
│   ├── colors.ts      // Color constants
│   ├── typography.ts  // Text styles
│   ├── spacing.ts     // Spacing system
│   └── index.ts       // Exports + shadows
│
├── assets/
│   ├── images/
│   │   ├── taxasge.png  // Main logo
│   │   └── flag.jpg     // Guinea Ecuatorial flag
│   │
│   └── animations/
│       ├── calculatrice.json  // Calculator animation
│       ├── robot.json         // Robot/AI animation
│       └── chatbot.json       // Chat animation
│
└── screens/
    ├── NewOnboardingScreen.tsx  // Modern onboarding
    └── ...
```

## 🚀 Implementation Notes

### Dependencies

```json
{
  "lottie-react-native": "^6.x",
  "react-native-linear-gradient": "^2.x"
}
```

### Platform Considerations

- **iOS**: Uses System font, requires pod install
- **Android**: Uses Roboto, automatic linking
- **Animations**: Test on older devices (iPhone SE, old Android)
- **Gradients**: LinearGradient requires native module

### Performance Optimizations

1. **Lottie**: Files kept under 50KB each
2. **Images**: Compressed, appropriate sizes
3. **Animations**: Use `useNativeDriver: true` when possible
4. **Rendering**: FlatList for horizontal scrolling (better than ScrollView)

## 🔄 Future Enhancements

### Planned Additions

1. **Dark Mode Support**
   - Add dark color palette
   - Use system preference detection
   - Smooth theme transitions

2. **Custom Fonts**
   - Montserrat for headings
   - Inter for body text
   - Implement font loading

3. **Additional Animations**
   - Success celebrations
   - Loading states
   - Micro-interactions

4. **Accessibility**
   - Screen reader support
   - High contrast mode
   - Reduced motion option

## 📚 References

- **Design Brief**: `.github/docs-internal/Documentations/MOBILE/Design/brief_designer_lottie.md`
- **Lottie Docs**: https://airbnb.io/lottie/
- **React Native**: https://reactnative.dev/docs/animations
- **Figma Designs**: See design screenshots in Design folder

## ✅ Quality Checklist

Before shipping a new screen:

- [ ] Follows color palette exactly
- [ ] Typography scale consistent
- [ ] Spacing uses 8px grid
- [ ] Animations smooth at 60fps
- [ ] Supports all 3 languages (ES, FR, EN)
- [ ] Tested on iOS and Android
- [ ] Accessible (good contrast, readable)
- [ ] Responsive across screen sizes

---

**Last Updated**: 2025-11-17
**Version**: 1.0.0
**Maintainer**: TaxasGE Development Team
