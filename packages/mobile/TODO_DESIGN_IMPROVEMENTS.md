# TaxasGE Mobile - Design Improvements TODO

## ✅ COMPLETED

### 1. Fixed Critical Errors
- ✅ Fixed "useServices must be used within ServicesProvider" error
- ✅ Added ServicesProvider wrapper in App.js  
- ✅ Services, Favorites, Calculator now work correctly

### 2. Modern Onboarding  
- ✅ Created NewOnboardingScreen with Lottie animations
- ✅ 3 beautiful screens with gradients and animations
- ✅ Multilingual support (ES/FR/EN)
- ✅ Extracted real JSON from .lottie archives

---

## 🚧 IN PROGRESS / TODO

### 1. Onboarding Optimizations (HIGH PRIORITY)

**Problems:**
- Text overlaps with Lottie animations
- Text not visible on some screens
- Lottie animations too large/small for different screen sizes
- No entrance animations for elements
- Not optimized for screen rotation

**Solutions to implement:**
```typescript
// src/screens/NewOnboardingScreen.tsx

1. Adjust Lottie sizes to be proportional:
   - Use Dimensions API to calculate responsive sizes
   - Limit Lottie to 40-50% of screen height
   - Add proper spacing between logo/lottie/text

2. Fix text visibility:
   - Add semi-transparent backgrounds behind text
   - Use shadows for better contrast
   - Ensure text doesn't overlap animations

3. Add entrance animations:
   - Stagger animations for logo → lottie → text → button
   - Use Animated.sequence or Animated.stagger
   - Add bounce/fade effects

4. First screen improvements:
   - Add white background circle behind flag image
   - Place logo + app name at top (like Inicio.png)
   - Better spacing and alignment
```

### 2. App Icon (HIGH PRIORITY)

**Problem:** Default Android icon still showing

**Solution:**
```bash
# Generate icon sizes from taxasge.png:
# - mdpi:    48x48   (packages/mobile/android/app/src/main/res/mipmap-mdpi/ic_launcher.png)
# - hdpi:    72x72   (mipmap-hdpi)
# - xhdpi:   96x96   (mipmap-xhdpi)
# - xxhdpi:  144x144 (mipmap-xxhdpi)
# - xxxhdpi: 192x192 (mipmap-xxxhdpi)

# Tool to use: icon.kitchen or react-native-make
npm install -g @bam.tech/react-native-make
react-native set-icon --path src/assets/images/taxasge.png
```

### 3. Home Screen Redesign (HIGH PRIORITY)

**Reference:** `.github/docs-internal/Documentations/MOBILE/Design/Inicio.png`

**New HomeScreen.tsx structure:**
```
┌─────────────────────────────────────┐
│  Logo + App Name (TaxasGE)          │ ← Header
│  Search Bar + Filters               │
├─────────────────────────────────────┤
│  [Inicio] [Buscar] [Favoris] [Perfil] │ ← Tab Navigation
├─────────────────────────────────────┤
│  🔍 ACCIONES RÁPIDAS                │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐│
│  │Buscar│ │Chatbt│ │Favors│ │Histor││
│  └──────┘ └──────┘ └──────┘ └──────┘│
├─────────────────────────────────────┤
│  🏛️ MINISTERIOS     [Ver todos →]   │
│  ┌────────────────────────────────┐ │
│  │ 📋 Ministerio de...           │ │
│  │ 📋 Ministerio de...           │ │
│  │ 📋 Ministerio de...           │ │
│  │ 📋 Ministerio de...           │ │
│  └────────────────────────────────┘ │
├─────────────────────────────────────┤
│  📊 CONSULTAS RECIENTES             │
│  ┌────────────────────────────────┐ │
│  │ Service 1 - hace 2 horas      │ │
│  │ Service 2 - hace 1 día        │ │
│  │ Service 3 - hace 3 días       │ │
│  └────────────────────────────────┘ │
└─────────────────────────────────────┘
```

**Components to create:**
- `HomeScreen.tsx` (replaces ChatbotScreen as default)
- `QuickActionsSection.tsx`  
- `MinistriesSection.tsx`
- `RecentConsultationsSection.tsx`
- Bottom tab navigation (optional - can use buttons for now)

### 4. White Screen on Back (MEDIUM PRIORITY)

**Problem:** White screen appears when pressing back button

**Root cause:** selectedService not reset when navigating back to home

**Solution:**
```javascript
// In App.js navigateBack():
const navigateBack = useCallback(() => {
  if (navigationHistory.length <= 1) {
    return false;
  }
  
  const newHistory = [...navigationHistory];
  newHistory.pop();
  const previousScreen = newHistory[newHistory.length - 1];
  
  setNavigationHistory(newHistory);
  setCurrentScreen(previousScreen);
  
  // ALWAYS reset selectedService when going to home/search
  if (previousScreen === 'home' || previousScreen === 'search') {
    setSelectedService(null);
  }
  
  return true;
}, [navigationHistory]);
```

### 5. Search Bar with Filters (MEDIUM PRIORITY)

**Reuse from ServiceListScreen:**
- Extract filter logic to shared component
- Create `SearchBarWithFilters.tsx`
- Use in both HomeScreen and ServiceListScreen

---

## 📦 Assets Needed

### Icons for Quick Actions
- `buscar-servicios-icon.png`
- `chatbot-icon.png` (have robot.json Lottie)
- `favoritos-icon.png` (heart icon)
- `historial-icon.png` (clock icon)

### Ministry Icons (from Design folder)
Check if `ministerio_icones.png` can be split into individual icons

---

## 🎨 Design System Usage

All new components should use:
```typescript
import { Colors, Typography, Spacing, Shadows } from '../theme';

// Colors
Colors.primary.red, .blue, .green, .yellow
Colors.neutral.white, .black, .gray*
Colors.gradients.screen1, .screen2, .screen3

// Typography
Typography.h1, .h2, .h3, .body, .button

// Spacing  
Spacing.md (16), .lg (24), .screenPadding (20)

// Shadows
Shadows.sm, .md, .lg
```

---

## 📱 Testing Checklist

Before considering complete:
- [ ] Onboarding works on portrait and landscape
- [ ] Text visible on all backgrounds
- [ ] Animations smooth (60fps)
- [ ] No white screen on back navigation
- [ ] App icon shows correctly (not Android robot)
- [ ] Home screen scrolls properly
- [ ] All quick actions navigate correctly
- [ ] Ministries section loads and displays
- [ ] Recent consultations shows last 3 items

---

## 🚀 Priority Order

1. **CRITICAL** - Fix onboarding text visibility and Lottie sizes
2. **CRITICAL** - Implement new HomeScreen design
3. **HIGH** - Fix app icon
4. **MEDIUM** - Fix white screen on back
5. **LOW** - Screen rotation optimization

---

## 📝 Notes for Developer

- Use existing components where possible (ServiceCard, etc.)
- Follow design system strictly (colors, spacing, typography)
- Test on multiple screen sizes (small phone, tablet)
- Keep performance in mind (avoid re-renders)
- Add loading states for async operations

---

**Last Updated:** 2025-11-17  
**Status:** Onboarding functional but needs polish, HomeScreen needs complete redesign
