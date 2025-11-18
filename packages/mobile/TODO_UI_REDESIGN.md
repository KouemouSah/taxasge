# TaxasGE Mobile - UI Redesign TODO

## 📋 Overview

Cette refonte UI est MASSIVE et implique la modification/création de ~8 pages principales plus des dizaines de composants. Estimation: **5000+ lignes de code**.

**Design References:**
- `.github/docs-internal/Documentations/MOBILE/Design/Inicio.png` - HomeScreen
- `.github/docs-internal/Documentations/MOBILE/Design/ministerio_icones.png` - Ministries Grid
- `.github/docs-internal/Documentations/MOBILE/Design/ministerio_liste.png` - Ministries List
- `.github/docs-internal/Documentations/MOBILE/Design/taxas_1.png` - Service Detail
- `.github/docs-internal/Documentations/MOBILE/Design/chatbot.png` - Chatbot
- `.github/docs-internal/Documentations/MOBILE/Design/perfil_1.png` - Profile
- `.github/docs-internal/Documentations/MOBILE/Design/brief_designer_lottie.md` - Animations spec

---

## ✅ COMPLETED

### Infrastructure
- [x] Created `src/theme/gradients.ts` - Gradient definitions
- [x] Created `src/components/GradientHeader.tsx` - Reusable header component
- [x] Created `src/components/BottomTabBar.tsx` - Bottom navigation
- [x] Created `src/screens/MinisteriosScreen.tsx` - Full example implementation
- [x] Updated `src/theme/index.ts` - Export gradients

---

## 🔴 HIGH PRIORITY - Core Pages

### 1. HomeScreen.tsx Redesign (CRITICAL)

**File:** `packages/mobile/src/screens/HomeScreen.tsx`

**Current State:** Basic layout with tabs at top, old menu style

**Required Changes:**

#### Header Section
```typescript
// Replace current header with GradientHeader
import { GradientHeader } from '../components/GradientHeader';
import LinearGradient from 'react-native-linear-gradient';

// Header should have:
// - Logo + "TaxasGE - E-Fiscal Servicios"
// - Search bar with icon (white background, rounded)
// - Notification bell icon (top right)
```

#### Quick Actions Section
```typescript
// BEFORE: Text-based menu buttons
// AFTER: Grid 2x2 with centered icons

const QUICK_ACTIONS = [
  {
    icon: '🔍', // Use modern monochrome white icon on gradient background
    label: 'Buscar Servicios',
    gradient: ['#4A90E2', '#357ABD'], // Blue gradient
    screen: 'search'
  },
  {
    icon: '🤖',
    label: 'Contactar Asistente',
    gradient: ['#50C878', '#3EAE63'], // Green gradient
    screen: 'chatbot'
  },
  {
    icon: '❤️',
    label: 'Mis Favoritos',
    gradient: ['#E91E63', '#C2185B'], // Pink gradient
    screen: 'favorites'
  },
  {
    icon: '📅',
    label: 'Citas Programadas',
    gradient: ['#9C27B0', '#7B1FA2'], // Purple gradient
    screen: 'appointments'
  }
];

// Style requirements:
// - Icons centered in cards
// - Icon size: 40-50% of card height
// - Cards with LinearGradient background
// - Shadow elevation
// - Text below icon, centered
```

#### Ministerios Section
```typescript
// CRITICAL: Display 4 RANDOM ministries (not top 4)
const getRandomMinistries = (ministries: Ministry[], count: number = 4): Ministry[] => {
  const shuffled = [...ministries].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

// Each ministry card should show:
// - Ministry icon (🏛️ or actual icon)
// - Ministry name (translated)
// - Service count: "X servicios fiscales"
// - Arrow →

// "Ver todos →" button at the end
// - Links to MinisteriosScreen
```

#### Bottom Navigation
```typescript
// Replace top tabs with BottomTabBar
import { BottomTabBar } from '../components/BottomTabBar';

<BottomTabBar
  activeTab="home"
  onTabPress={(tab) => {
    // Navigate to appropriate screen
  }}
  language={currentLanguage}
/>

// Tabs: Inicio | Buscar | Favoritos | Perfil
// Icons only (no text labels on mobile)
```

#### Spacing Adjustments
```typescript
// REDUCE space between sections:
// Quick Actions → Ministerios: 16px (currently ~32px)
// Use Spacing.md instead of Spacing.lg
```

---

### 2. MinisterioDetailScreen.tsx (NEW - CRITICAL)

**File:** `packages/mobile/src/screens/MinisterioDetailScreen.tsx` (CREATE)

**Purpose:** Show detailed ministry information

**Design Reference:** Infer from ministerio_icones.png layout

**Required Components:**

```typescript
interface MinisterioDetailScreenProps {
  ministry: Ministry;
  language: 'es' | 'fr' | 'en';
  onBack: () => void;
  onServicePress: (service: FiscalService) => void;
}

// Layout sections:
// 1. GradientHeader with ministry name
// 2. Hero section:
//    - Large icon (circular background)
//    - Ministry name
//    - Short description
// 3. Contact info:
//    - 📍 Location/Address
//    - 📧 Email
//    - 🌐 Website
// 4. Stats cards (3 columns):
//    - Number of sectors
//    - Number of categories
//    - Number of fiscal services
// 5. Services list (from this ministry)
//    - Grouped by category
//    - Click to go to ServiceDetailScreen

// Data loading:
const loadMinistryDetails = async (ministryId: string) => {
  const db = DatabaseService.getInstance();

  // Get sectors count
  const sectors = await db.query(
    'SELECT COUNT(DISTINCT sector_id) as count FROM fiscal_services WHERE ministry_id = ?',
    [ministryId]
  );

  // Get categories count
  const categories = await db.query(
    'SELECT COUNT(DISTINCT category_id) as count FROM fiscal_services WHERE ministry_id = ?',
    [ministryId]
  );

  // Get services count
  const services = await db.query(
    'SELECT COUNT(*) as count FROM fiscal_services WHERE ministry_id = ? AND status = ?',
    [ministryId, 'active']
  );

  return {
    sectorsCount: sectors[0].count,
    categoriesCount: categories[0].count,
    servicesCount: services[0].count
  };
};
```

**Stats Cards Design:**
```typescript
<View style={styles.statsContainer}>
  <View style={styles.statCard}>
    <Text style={styles.statNumber}>{sectorsCount}</Text>
    <Text style={styles.statLabel}>Sectores</Text>
  </View>
  <View style={styles.statCard}>
    <Text style={styles.statNumber}>{categoriesCount}</Text>
    <Text style={styles.statLabel}>Categorías</Text>
  </View>
  <View style={styles.statCard}>
    <Text style={styles.statNumber}>{servicesCount}</Text>
    <Text style={styles.statLabel}>Servicios</Text>
  </View>
</View>

const styles = StyleSheet.create({
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginVertical: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    ...Shadows.sm,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.primary,
  },
  statLabel: {
    fontSize: 12,
    color: '#666666',
    marginTop: 4,
  },
});
```

---

### 3. ProfileScreen.tsx (NEW - HIGH PRIORITY)

**File:** `packages/mobile/src/screens/ProfileScreen.tsx` (CREATE)

**Design Reference:** `perfil_1.png`

**Required Sections:**

```typescript
interface ProfileScreenProps {
  language: 'es' | 'fr' | 'en';
  onBack: () => void;
  onLanguageChange: (lang: 'es' | 'fr' | 'en') => void;
  onNavigate: (screen: string) => void;
}

// Layout:
// 1. GradientHeader "Mi Perfil" / "Mon Profil" / "My Profile"
// 2. User info section (if auth enabled)
//    - Avatar placeholder
//    - Name
//    - Email
//    - Member since date
// 3. Settings sections:

// Section 1: Language
<View style={styles.section}>
  <Text style={styles.sectionTitle}>Idioma / Langue / Language</Text>
  <TouchableOpacity onPress={() => setShowLanguageModal(true)}>
    <View style={styles.settingRow}>
      <Text style={styles.settingIcon}>🌐</Text>
      <Text style={styles.settingLabel}>Seleccionar idioma</Text>
      <Text style={styles.settingValue}>Español</Text>
      <Text style={styles.settingArrow}>→</Text>
    </View>
  </TouchableOpacity>
</View>

// Section 2: Calculation History
<View style={styles.section}>
  <Text style={styles.sectionTitle}>Historial</Text>
  <TouchableOpacity onPress={() => onNavigate('history')}>
    <View style={styles.settingRow}>
      <Text style={styles.settingIcon}>🕐</Text>
      <Text style={styles.settingLabel}>Historial de cálculos</Text>
      <Text style={styles.settingArrow}>→</Text>
    </View>
  </TouchableOpacity>
</View>

// Section 3: Chatbot Customization (OPTIONAL - if time permits)
<View style={styles.section}>
  <Text style={styles.sectionTitle}>Personalización</Text>
  <TouchableOpacity onPress={() => setShowBackgroundModal(true)}>
    <View style={styles.settingRow}>
      <Text style={styles.settingIcon}>🎨</Text>
      <Text style={styles.settingLabel}>Fondo del chatbot</Text>
      <Text style={styles.settingValue}>Verde con patrón</Text>
      <Text style={styles.settingArrow}>→</Text>
    </View>
  </TouchableOpacity>
</View>

// Language Modal
const LanguageModal = () => (
  <Modal visible={showLanguageModal} animationType="slide">
    <View style={styles.modalContainer}>
      <Text style={styles.modalTitle}>Seleccionar Idioma</Text>
      {['es', 'fr', 'en'].map(lang => (
        <TouchableOpacity
          key={lang}
          onPress={() => {
            onLanguageChange(lang);
            setShowLanguageModal(false);
          }}>
          <View style={styles.languageOption}>
            <Text>{lang === 'es' ? '🇪🇸 Español' : lang === 'fr' ? '🇫🇷 Français' : '🇬🇧 English'}</Text>
            {currentLanguage === lang && <Text>✓</Text>}
          </View>
        </TouchableOpacity>
      ))}
    </View>
  </Modal>
);
```

**Chatbot Background Options (if implementing):**
```typescript
const CHATBOT_BACKGROUNDS = {
  greenPattern: {
    name: 'Verde con patrón',
    gradient: ['#40E0D0', '#20B2AA'],
    pattern: 'dots', // SVG pattern to create
  },
  bluePattern: {
    name: 'Azul con patrón',
    gradient: ['#004aad', '#0066cc'],
    pattern: 'stripes',
  },
  // ... more options
};

// Store in AsyncStorage
await AsyncStorage.setItem('@chatbot_background', 'greenPattern');
```

---

### 4. ChatbotScreen.tsx Redesign (HIGH PRIORITY)

**File:** `packages/mobile/src/screens/ChatbotScreen.tsx`

**Design Reference:** `chatbot.png`

**Required Changes:**

#### Header
```typescript
// Replace header with:
<LinearGradient colors={HEADER_GRADIENT} style={styles.header}>
  <TouchableOpacity onPress={onBack}>
    <Text style={styles.backButton}>←</Text>
  </TouchableOpacity>

  {/* Logo with white circle background */}
  <View style={styles.profileContainer}>
    <View style={styles.profileCircle}>
      <Image
        source={require('../assets/images/taxasge.png')}
        style={styles.profileLogo}
        resizeMode="contain"
      />
    </View>
    <Text style={styles.assistantName}>TaxaBot</Text>
  </View>

  <View style={styles.headerRight} />
</LinearGradient>

const styles = StyleSheet.create({
  profileContainer: {
    alignItems: 'center',
  },
  profileCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
  },
  profileLogo: {
    width: 44,
    height: 44,
  },
  assistantName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
});
```

#### Background with Pattern
```typescript
// Create patterned background component
const ChatbotBackground = () => {
  return (
    <View style={styles.backgroundContainer}>
      <LinearGradient
        colors={CHATBOT_GRADIENT}
        style={StyleSheet.absoluteFill}
      />
      {/* SVG Pattern overlay */}
      <Svg height="100%" width="100%" style={StyleSheet.absoluteFill}>
        <Defs>
          <Pattern
            id="pattern"
            x="0"
            y="0"
            width="40"
            height="40"
            patternUnits="userSpaceOnUse">
            <Circle cx="20" cy="20" r="2" fill="#808080" opacity="0.1" />
            <Circle cx="40" cy="40" r="2" fill="#808080" opacity="0.1" />
          </Pattern>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#pattern)" />
      </Svg>
    </View>
  );
};

// If react-native-svg not available, use alternative:
const AlternativeBackground = () => (
  <ImageBackground
    source={/* Create a pattern image asset */}
    style={styles.background}
    imageStyle={{ opacity: 0.1 }}>
    <LinearGradient
      colors={CHATBOT_GRADIENT}
      style={StyleSheet.absoluteFill}
    />
  </ImageBackground>
);
```

#### Message Formatting - PROFESSIONAL
```typescript
// Current: Simple bubbles
// Required: Professional formatted messages with proper structure

const BotMessage = ({ message }: { message: ChatMessage }) => {
  // Parse message content for structure
  const parsedContent = parseMessageContent(message.content);

  return (
    <View style={styles.botMessageContainer}>
      <View style={styles.botBubble}>
        {/* If message contains service info */}
        {parsedContent.serviceInfo && (
          <View style={styles.serviceInfoCard}>
            <Text style={styles.serviceName}>{parsedContent.serviceInfo.name}</Text>
            <Text style={styles.serviceMinistry}>{parsedContent.serviceInfo.ministry}</Text>

            <View style={styles.divider} />

            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Tasa de expedición:</Text>
              <Text style={styles.priceValue}>{parsedContent.serviceInfo.expedicionPrice} XAF</Text>
            </View>

            {parsedContent.serviceInfo.renovacionPrice > 0 && (
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Tasa de renovación:</Text>
                <Text style={styles.priceValue}>{parsedContent.serviceInfo.renovacionPrice} XAF</Text>
              </View>
            )}

            {parsedContent.serviceInfo.documents && (
              <>
                <View style={styles.divider} />
                <Text style={styles.sectionTitle}>Documentos requeridos:</Text>
                {parsedContent.serviceInfo.documents.map((doc, i) => (
                  <Text key={i} style={styles.documentItem}>• {doc}</Text>
                ))}
              </>
            )}

            <TouchableOpacity
              style={styles.detailsButton}
              onPress={() => /* Navigate to service detail */}>
              <Text style={styles.detailsButtonText}>Ver los detalles</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Regular text content */}
        {parsedContent.text && (
          <Text style={styles.botText}>{parsedContent.text}</Text>
        )}

        <Text style={styles.timestamp}>
          {formatTime(message.timestamp)}
        </Text>
      </View>
    </View>
  );
};

const parseMessageContent = (content: string) => {
  // Parse structured content from chatbot responses
  // Look for patterns like:
  // "Pasaporte ordinario\nMinisterio de Asuntos Exteriores\nTasa de expedición: 16.000 XAF\n..."

  // Return structured data for professional rendering
};

const styles = StyleSheet.create({
  botBubble: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    maxWidth: '85%',
    ...Shadows.md,
  },
  serviceInfoCard: {
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  serviceName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  serviceMinistry: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 12,
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 12,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  priceLabel: {
    fontSize: 14,
    color: '#666666',
  },
  priceValue: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  documentItem: {
    fontSize: 13,
    color: '#666666',
    marginBottom: 4,
    marginLeft: 8,
  },
  detailsButton: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  detailsButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
```

#### Send Button - Soft & Elegant
```typescript
// Current: Basic send button
// Required: Modern, soft, elegant design

<View style={styles.inputContainer}>
  <TextInput
    style={styles.input}
    placeholder="Escribir un mensaje..."
    value={inputText}
    onChangeText={setInputText}
    multiline
  />

  <TouchableOpacity
    style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
    onPress={handleSend}
    disabled={!inputText.trim()}
    activeOpacity={0.8}>
    <LinearGradient
      colors={inputText.trim() ? ['#50C878', '#3EAE63'] : ['#CCCCCC', '#AAAAAA']}
      style={styles.sendButtonGradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}>
      <Text style={styles.sendIcon}>➤</Text>
    </LinearGradient>
  </TouchableOpacity>
</View>

const styles = StyleSheet.create({
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  input: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    maxHeight: 100,
    marginRight: 8,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
    ...Shadows.md,
  },
  sendButtonGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendIcon: {
    fontSize: 20,
    color: '#FFFFFF',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});
```

---

### 5. ServiceDetailScreen.tsx Redesign (MEDIUM PRIORITY)

**File:** `packages/mobile/src/screens/ServiceDetailScreen.tsx`

**Design Reference:** `taxas_1.png`

**Required Changes:**

```typescript
// Current design: Already functional but needs visual update

// Changes needed:
// 1. Replace current header with GradientHeader
import { GradientHeader } from '../components/GradientHeader';

// 2. Update hero section with ministry icon + gradient background
<View style={styles.heroSection}>
  <LinearGradient
    colors={getMinistryGradient(service.ministry_id)}
    style={styles.heroGradient}>
    <View style={styles.heroContent}>
      <View style={styles.iconCircle}>
        <Text style={styles.icon}>🏛️</Text>
      </View>
      <Text style={styles.serviceName}>{getServiceName(service, language)}</Text>
      <Text style={styles.ministryName}>{getMinistryName(service, language)}</Text>
      <Text style={styles.serviceCount}>3 servicios disponibles</Text>
    </View>
  </LinearGradient>
</View>

// 3. Service card with better formatting (as shown in taxas_1.png)
<View style={styles.serviceCard}>
  <Text style={styles.cardTitle}>Pasaporte Ordinario</Text>
  <Text style={styles.cardSubtitle}>Expedición y renovación de pasaportes para ciudadanos</Text>

  <View style={styles.divider} />

  {/* Documents section */}
  <View style={styles.section}>
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionIcon}>📄</Text>
      <Text style={styles.sectionTitle}>Documentos Requeridos</Text>
    </View>
    {documents.map((doc, i) => (
      <Text key={i} style={styles.bulletItem}>• {doc}</Text>
    ))}
  </View>

  <View style={styles.divider} />

  {/* Processing time */}
  <View style={styles.infoRow}>
    <Text style={styles.infoIcon}>⏱️</Text>
    <View style={styles.infoContent}>
      <Text style={styles.infoLabel}>Tiempo de Procesamiento</Text>
      <Text style={styles.infoValue}>5-7 días hábiles</Text>
    </View>
  </View>

  <View style={styles.divider} />

  {/* Costs */}
  <View style={styles.costsSection}>
    <Text style={styles.costsIcon}>💰</Text>
    <View style={styles.costsContent}>
      <Text style={styles.costsLabel}>Costos</Text>
      <View style={styles.priceRow}>
        <Text style={styles.priceLabel}>Expedición:</Text>
        <Text style={styles.priceValue}>16.000 FCA</Text>
      </View>
      <View style={styles.priceRow}>
        <Text style={styles.priceLabel}>Renovación:</Text>
        <Text style={styles.priceValue}>7.500 FCA</Text>
      </View>
    </View>
  </View>

  {/* Help button */}
  <TouchableOpacity style={styles.helpButton}>
    <Text style={styles.helpButtonIcon}>💬</Text>
    <Text style={styles.helpButtonText}>Obtener Ayuda</Text>
  </TouchableOpacity>
</View>

// Key styling from taxas_1.png:
const styles = StyleSheet.create({
  heroSection: {
    marginTop: -20, // Overlap with header
  },
  heroGradient: {
    paddingVertical: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  icon: {
    fontSize: 40,
  },
  serviceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    margin: 16,
    padding: 20,
    marginTop: -30, // Overlap with hero
    ...Shadows.lg,
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  bulletItem: {
    fontSize: 14,
    color: '#666666',
    marginLeft: 28,
    marginBottom: 6,
  },
  helpButton: {
    flexDirection: 'row',
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  helpButtonIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  helpButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
```

---

## 🟡 MEDIUM PRIORITY

### 6. NewOnboardingScreen.tsx Updates

**File:** `packages/mobile/src/screens/NewOnboardingScreen.tsx`

**Changes Required:**

```typescript
// 1. First screen (logo + flag) - WHITE BACKGROUND
// Current: Gradient background
// Required: Pure white background

const backgrounds = [
  ['#FFFFFF', '#FFFFFF'], // CHANGED from gradient to white
  ['#40E0D0', '#20B2AA'],
  ['#FFD700', '#FFC700'],
  ['#9C27B0', '#7B1FA2'],
];

// 2. Logo animation - CONTINUOUS (based on brief_designer_lottie.md)
// Phase 1: Intro (plays once on mount)
// Phase 2: Loop micro-animation (continuous)

import LottieView from 'lottie-react-native';

// If we have the logo animation JSON from designer:
<LottieView
  source={require('../assets/animations/taxage_logo_animation.json')}
  autoPlay
  loop
  style={styles.logoAnimation}
/>

// If not yet available, simulate with Animated API:
const logoScale = useRef(new Animated.Value(1)).current;
const logoRotate = useRef(new Animated.Value(0)).current;

useEffect(() => {
  // Phase 1: Intro (0-2s)
  Animated.sequence([
    Animated.timing(logoScale, {
      toValue: 1.1,
      duration: 300,
      useNativeDriver: true,
    }),
    Animated.timing(logoScale, {
      toValue: 1.0,
      duration: 300,
      useNativeDriver: true,
    }),
  ]).start(() => {
    // Phase 2: Continuous loop (2-4s, repeats)
    startLoopAnimation();
  });
}, []);

const startLoopAnimation = () => {
  Animated.loop(
    Animated.sequence([
      // Shine effect simulation
      Animated.timing(logoRotate, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      }),
      // Micro pulse
      Animated.timing(logoScale, {
        toValue: 1.02,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(logoScale, {
        toValue: 1.0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.delay(500),
    ])
  ).start();
};

// Animated logo component:
<Animated.View
  style={{
    transform: [
      { scale: logoScale },
      {
        rotate: logoRotate.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', '360deg'],
        }),
      },
    ],
  }}>
  <Image source={taxasgeLogo} style={styles.logo} />

  {/* Shine overlay */}
  <Animated.View
    style={[
      styles.shineOverlay,
      {
        opacity: logoRotate.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [0, 0.6, 0],
        }),
      },
    ]}
  />
</Animated.View>

// 3. Text entrance animations
// Currently: Staggered fade-in
// Add: Slide up + fade in for more dynamic feel

const titleAnimation = useRef(new Animated.Value(0)).current;

Animated.sequence([
  // ... logo and media animations ...
  Animated.parallel([
    Animated.timing(titleAnimation, {
      toValue: 1,
      duration: 600,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }),
  ]),
]).start();

<Animated.View
  style={{
    opacity: titleAnimation,
    transform: [
      {
        translateY: titleAnimation.interpolate({
          inputRange: [0, 1],
          outputRange: [20, 0], // Slide up 20px
        }),
      },
    ],
  }}>
  <Text style={styles.title}>{item[titleKey]}</Text>
</Animated.View>
```

---

### 7. ServiceListScreen.tsx Updates

**File:** `packages/mobile/src/screens/ServiceListScreen.tsx`

**Changes Required:**

```typescript
// Simple update: Replace header with GradientHeader

import { GradientHeader } from '../components/GradientHeader';

// BEFORE:
<View style={styles.header}>
  <TouchableOpacity onPress={onBack}>...</TouchableOpacity>
  <Text style={styles.headerTitle}>...</Text>
</View>

// AFTER:
<GradientHeader
  title={TEXTS[language].title}
  onBack={onBack}
  rightComponent={
    <TouchableOpacity onPress={() => setShowFiltersModal(true)}>
      <Text style={styles.filterIcon}>⚙️</Text>
    </TouchableOpacity>
  }
/>

// That's it! The rest of the screen stays the same.
```

---

## 🟢 LOW PRIORITY / ENHANCEMENTS

### 8. Modern Icons System

**Option A: Install react-native-vector-icons**
```bash
npm install react-native-vector-icons
cd ios && pod install
```

Then use Ionicons:
```typescript
import Icon from 'react-native-vector-icons/Ionicons';

<Icon name="search" size={24} color="#FFFFFF" />
<Icon name="chatbot-outline" size={24} color="#FFFFFF" />
<Icon name="heart" size={24} color="#FFFFFF" />
```

**Option B: Custom SVG Icons**
Create `src/components/icons/` folder with individual SVG components

**Option C: Use current emoji system** (already working)

---

### 9. SVG Pattern Background Generator

For chatbot background patterns:

**File:** `packages/mobile/src/components/PatternBackground.tsx` (CREATE)

```typescript
import React from 'react';
import Svg, { Defs, Pattern, Circle, Rect, Line } from 'react-native-svg';

type PatternType = 'dots' | 'stripes' | 'grid' | 'waves';

interface PatternBackgroundProps {
  pattern: PatternType;
  color?: string;
  opacity?: number;
}

export const PatternBackground: React.FC<PatternBackgroundProps> = ({
  pattern,
  color = '#808080',
  opacity = 0.1,
}) => {
  const renderPattern = () => {
    switch (pattern) {
      case 'dots':
        return (
          <Pattern id="pattern" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
            <Circle cx="20" cy="20" r="2" fill={color} opacity={opacity} />
          </Pattern>
        );

      case 'stripes':
        return (
          <Pattern id="pattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
            <Line x1="0" y1="0" x2="0" y2="20" stroke={color} strokeWidth="2" opacity={opacity} />
          </Pattern>
        );

      case 'grid':
        return (
          <Pattern id="pattern" x="0" y="0" width="30" height="30" patternUnits="userSpaceOnUse">
            <Line x1="0" y1="0" x2="30" y2="0" stroke={color} strokeWidth="1" opacity={opacity} />
            <Line x1="0" y1="0" x2="0" y2="30" stroke={color} strokeWidth="1" opacity={opacity} />
          </Pattern>
        );

      default:
        return null;
    }
  };

  return (
    <Svg height="100%" width="100%" style={{ position: 'absolute' }}>
      <Defs>{renderPattern()}</Defs>
      <Rect width="100%" height="100%" fill="url(#pattern)" />
    </Svg>
  );
};
```

---

## 📱 App.js Integration

**File:** `packages/mobile/src/App.js`

**Changes Required:**

```typescript
// 1. Add new screens to state management
const [currentTab, setCurrentTab] = useState<TabName>('home');

// 2. Add Ministry type to state
import { Ministry } from './database/services/FiscalServicesService';
const [selectedMinistry, setSelectedMinistry] = useState<Ministry | null>(null);

// 3. Update renderCurrentScreen to handle new screens
const renderCurrentScreen = () => {
  switch (currentScreen) {
    case 'home':
      return (
        <HomeScreen
          language={currentLanguage}
          onNavigate={navigateTo}
          onTabPress={(tab) => {
            // Handle tab navigation
            if (tab === 'profile') navigateTo('profile');
            else if (tab === 'favorites') navigateTo('favorites');
            else if (tab === 'search') navigateTo('search');
            else if (tab === 'home') navigateTo('home');
          }}
        />
      );

    case 'ministerios':
      return (
        <MinisteriosScreen
          language={currentLanguage}
          onBack={navigateBack}
          onMinistryPress={(ministry) => {
            setSelectedMinistry(ministry);
            navigateTo('ministerioDetail');
          }}
          onTabPress={(tab) => {/* ... */}}
        />
      );

    case 'ministerioDetail':
      if (!selectedMinistry) {
        navigateTo('ministerios');
        return null;
      }
      return (
        <MinisterioDetailScreen
          ministry={selectedMinistry}
          language={currentLanguage}
          onBack={navigateBack}
          onServicePress={(service) => {
            navigateTo('serviceDetail', service);
          }}
        />
      );

    case 'profile':
      return (
        <ProfileScreen
          language={currentLanguage}
          onBack={navigateBack}
          onLanguageChange={(lang) => setCurrentLanguage(lang)}
          onNavigate={navigateTo}
        />
      );

    // ... existing cases
  }
};

// 4. Add new navigation handlers
const handleTabNavigation = (tab: TabName) => {
  setCurrentTab(tab);
  switch (tab) {
    case 'home':
      navigateTo('home');
      break;
    case 'search':
      navigateTo('search');
      break;
    case 'favorites':
      navigateTo('favorites');
      break;
    case 'profile':
      navigateTo('profile');
      break;
  }
};
```

---

## 🎨 Design Tokens Summary

### Colors
```typescript
// From designs
const BRAND_COLORS = {
  red: '#d10d00',
  blue: '#004aad',
  green: '#499003',
  greenLight: '#def6e5',
  yellow: '#ffde59',
  white: '#ffffff',
  black: '#000000',
};

// Gradients (already created in src/theme/gradients.ts)
```

### Typography
```typescript
// Header sizes
headerXL: 32px (Hero headings)
headerL: 24px (Section headings)
headerM: 20px (Page titles)
headerS: 18px (Card titles)

// Body sizes
bodyL: 16px (Primary content)
bodyM: 14px (Secondary content)
bodyS: 12px (Captions, metadata)

// Weights
bold: '700'
semibold: '600'
medium: '500'
regular: '400'
```

### Spacing
```typescript
// From design mockups
xs: 4px
sm: 8px
md: 16px
lg: 24px
xl: 32px
xxl: 40px
```

---

## 📦 Dependencies to Install (if not already)

```bash
# If using vector icons
npm install react-native-vector-icons
npm install --save-dev @types/react-native-vector-icons

# If using SVG patterns
npm install react-native-svg
```

---

## ✅ Testing Checklist

Before considering redesign complete:

- [ ] HomeScreen displays with gradient header
- [ ] HomeScreen shows 4 random ministries on each load
- [ ] Quick Actions cards have centered icons with gradients
- [ ] Bottom tab navigation works (all 4 tabs)
- [ ] MinisteriosScreen grid/list toggle works
- [ ] MinisteriosScreen displays all ministries correctly
- [ ] MinisterioDetailScreen shows stats correctly
- [ ] MinisterioDetailScreen loads services from ministry
- [ ] ProfileScreen language selector works
- [ ] ProfileScreen navigates to history
- [ ] ChatbotScreen has logo with white circle
- [ ] ChatbotScreen has green patterned background
- [ ] ChatbotScreen messages are professionally formatted
- [ ] ChatbotScreen send button is soft/elegant
- [ ] ServiceDetailScreen matches taxas_1.png design
- [ ] All screens have gradient headers (consistent color)
- [ ] Onboarding screen 1 has white background
- [ ] Onboarding logo has continuous animation
- [ ] Onboarding texts have entrance animations
- [ ] All navigation flows work correctly
- [ ] Android back button works on all screens
- [ ] Language switching works across all screens
- [ ] No console errors or warnings
- [ ] Build succeeds (npm run lint:check)
- [ ] APK builds successfully

---

## 💾 Files Created So Far

✅ Completed:
- `src/theme/gradients.ts`
- `src/components/ModernIcon.tsx`
- `src/components/GradientHeader.tsx`
- `src/components/BottomTabBar.tsx`
- `src/screens/MinisteriosScreen.tsx`

---

## 📊 Estimated Work Remaining

| Task | Lines of Code | Priority | Estimated Time |
|------|---------------|----------|----------------|
| HomeScreen redesign | 400-500 | HIGH | 3-4 hours |
| MinisterioDetailScreen | 300-400 | HIGH | 2-3 hours |
| ProfileScreen | 400-500 | HIGH | 3-4 hours |
| ChatbotScreen redesign | 500-600 | HIGH | 4-5 hours |
| ServiceDetailScreen redesign | 300-400 | MEDIUM | 2-3 hours |
| Onboarding updates | 150-200 | MEDIUM | 1-2 hours |
| ServiceListScreen header | 50-100 | MEDIUM | 30 min |
| App.js integration | 100-150 | HIGH | 1-2 hours |
| Pattern backgrounds | 200-300 | LOW | 2 hours |
| Icon system | 200-300 | LOW | 1-2 hours |
| Testing & debugging | N/A | HIGH | 3-4 hours |
| **TOTAL** | **~3000-3500** | | **23-32 hours** |

---

## 🚀 Recommended Approach

### Phase 1 (Critical - 8-10 hours)
1. HomeScreen redesign with random ministries
2. MinisterioDetailScreen creation
3. ProfileScreen creation
4. App.js integration for new navigation

### Phase 2 (Important - 8-10 hours)
5. ChatbotScreen redesign (professional messages + send button)
6. ServiceDetailScreen visual update
7. ServiceListScreen header update

### Phase 3 (Polish - 6-8 hours)
8. Onboarding animations
9. Pattern backgrounds
10. Testing & bug fixes

### Phase 4 (Optional - 2-4 hours)
11. Modern icon system
12. Additional animations
13. Performance optimization

---

## 📝 Notes

1. **Icons**: The current implementation uses emoji. For production, consider:
   - react-native-vector-icons (Ionicons)
   - Custom SVG icons
   - PNG icon sets

2. **Animations**: Brief calls for Lottie animations. These need to be created by a designer using After Effects. Placeholder implementations use Animated API.

3. **Random Ministries**: Use `Math.random()` to shuffle and select 4 ministries. Consider caching the selection for the session to avoid constant changes.

4. **Chatbot Patterns**: If react-native-svg is not available, create a pattern PNG and use as ImageBackground.

5. **Gradients**: All created in `theme/gradients.ts`. Ensure LinearGradient is imported from 'react-native-linear-gradient'.

6. **Testing**: Test on both iOS and Android simulators. Pay special attention to:
   - Header heights (notch on iPhone X+)
   - Bottom tab bar (home indicator on iPhone X+)
   - Back button (Android hardware back)

---

## 🎯 Priority Order for Implementation

If implementing in multiple sessions:

**Session 1:**
- HomeScreen + MinisteriosScreen + ProfileScreen
- Reason: Core navigation framework

**Session 2:**
- ChatbotScreen + ServiceDetailScreen
- Reason: Main user-facing features

**Session 3:**
- Onboarding + ServiceListScreen + polishing
- Reason: Nice-to-haves and refinements

---

This TODO document can be updated as tasks are completed. Mark items with ✅ when done.
