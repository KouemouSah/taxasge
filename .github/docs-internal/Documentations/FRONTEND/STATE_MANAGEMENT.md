# 🗄️ STATE MANAGEMENT TAXASGE
## Guide Complet Zustand + React State

**Version** : 1.0  
**Date** : 2025-10-31  
**Statut** : ✅ PRODUCTION READY  
**Bibliothèque** : Zustand + React Hooks

---

## 📋 TABLE DES MATIÈRES

1. [Vue d'ensemble](#vue-densemble)
2. [Local State (useState)](#local-state-usestate)
3. [Global State (Zustand)](#global-state-zustand)
4. [Stores Zustand](#stores-zustand)
5. [Patterns avancés](#patterns-avancés)
6. [Persistence](#persistence)
7. [Best Practices](#best-practices)

---

## 🎯 VUE D'ENSEMBLE

### Philosophie State Management

```
Local State (useState, useReducer)
    ↓
Pour état composant seul
Exemples : form inputs, toggles, dropdowns
    ↓
    
Global State (Zustand)
    ↓
Pour état partagé entre composants
Exemples : user auth, theme, cart, notifications
    ↓

Server State (React Query / SWR)
    ↓
Pour données serveur (cache, refetch)
Exemples : API data, real-time updates
```

---

### Quand Utiliser Quoi ?

| Cas d'usage | Solution | Exemple |
|-------------|----------|---------|
| État composant unique | `useState` | Search input value |
| État complexe composant | `useReducer` | Multi-step form |
| État partagé app-wide | `Zustand` | User authentication |
| Données serveur | `Server Components` | Services list |
| Données serveur client | `React Query/SWR` | Real-time data |

---

## 🔵 LOCAL STATE (useState)

### useState Basique

```tsx
'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export function SearchBar() {
  const [query, setQuery] = useState('');
  
  const handleSearch = () => {
    console.log('Searching for:', query);
  };
  
  return (
    <div className="flex gap-2">
      <Input 
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Rechercher..."
      />
      <Button onClick={handleSearch}>Rechercher</Button>
    </div>
  );
}
```

---

### useState avec Objet

```tsx
'use client';

import { useState } from 'react';

interface User {
  name: string;
  email: string;
  age: number;
}

export function UserForm() {
  const [user, setUser] = useState<User>({
    name: '',
    email: '',
    age: 0,
  });
  
  // ✅ Mise à jour partielle (spread)
  const handleChange = (field: keyof User, value: string | number) => {
    setUser(prev => ({
      ...prev,
      [field]: value,
    }));
  };
  
  return (
    <div className="space-y-4">
      <Input 
        value={user.name}
        onChange={(e) => handleChange('name', e.target.value)}
        placeholder="Nom"
      />
      <Input 
        value={user.email}
        onChange={(e) => handleChange('email', e.target.value)}
        placeholder="Email"
      />
      <Input 
        type="number"
        value={user.age}
        onChange={(e) => handleChange('age', parseInt(e.target.value))}
        placeholder="Âge"
      />
    </div>
  );
}
```

---

### useState avec Array

```tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

export function TodoList() {
  const [todos, setTodos] = useState<string[]>([]);
  const [input, setInput] = useState('');
  
  // Ajouter
  const addTodo = () => {
    setTodos(prev => [...prev, input]);
    setInput('');
  };
  
  // Supprimer
  const removeTodo = (index: number) => {
    setTodos(prev => prev.filter((_, i) => i !== index));
  };
  
  return (
    <div>
      <div className="flex gap-2 mb-4">
        <Input 
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <Button onClick={addTodo}>Ajouter</Button>
      </div>
      
      <ul className="space-y-2">
        {todos.map((todo, index) => (
          <li key={index} className="flex justify-between items-center">
            <span>{todo}</span>
            <Button 
              variant="destructive" 
              size="sm"
              onClick={() => removeTodo(index)}
            >
              Supprimer
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

---

### useReducer (État Complexe)

```tsx
'use client';

import { useReducer } from 'react';

// Types
interface State {
  count: number;
  step: number;
}

type Action = 
  | { type: 'increment' }
  | { type: 'decrement' }
  | { type: 'setStep'; payload: number }
  | { type: 'reset' };

// Reducer
function counterReducer(state: State, action: Action): State {
  switch (action.type) {
    case 'increment':
      return { ...state, count: state.count + state.step };
    case 'decrement':
      return { ...state, count: state.count - state.step };
    case 'setStep':
      return { ...state, step: action.payload };
    case 'reset':
      return { count: 0, step: 1 };
    default:
      return state;
  }
}

export function Counter() {
  const [state, dispatch] = useReducer(counterReducer, {
    count: 0,
    step: 1,
  });
  
  return (
    <div className="space-y-4">
      <div className="text-4xl font-bold">{state.count}</div>
      
      <div className="flex gap-2">
        <Button onClick={() => dispatch({ type: 'decrement' })}>
          - {state.step}
        </Button>
        <Button onClick={() => dispatch({ type: 'increment' })}>
          + {state.step}
        </Button>
      </div>
      
      <Input 
        type="number"
        value={state.step}
        onChange={(e) => dispatch({ 
          type: 'setStep', 
          payload: parseInt(e.target.value) 
        })}
        placeholder="Step"
      />
      
      <Button variant="outline" onClick={() => dispatch({ type: 'reset' })}>
        Reset
      </Button>
    </div>
  );
}
```

---

## 🟢 GLOBAL STATE (Zustand)

### Installation

```bash
npm install zustand
# ou
yarn add zustand
```

---

### Store Simple

```ts
// lib/stores/counter-store.ts
import { create } from 'zustand';

interface CounterState {
  count: number;
  increment: () => void;
  decrement: () => void;
  reset: () => void;
}

export const useCounterStore = create<CounterState>((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
  decrement: () => set((state) => ({ count: state.count - 1 })),
  reset: () => set({ count: 0 }),
}));
```

**Usage** :
```tsx
'use client';

import { useCounterStore } from '@/lib/stores/counter-store';
import { Button } from '@/components/ui/button';

export function Counter() {
  const { count, increment, decrement, reset } = useCounterStore();
  
  return (
    <div className="space-y-4">
      <div className="text-4xl font-bold">{count}</div>
      <div className="flex gap-2">
        <Button onClick={decrement}>-</Button>
        <Button onClick={increment}>+</Button>
        <Button variant="outline" onClick={reset}>Reset</Button>
      </div>
    </div>
  );
}
```

---

## 🗂️ STORES ZUSTAND

### Auth Store

```ts
// lib/stores/auth-store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  
  // Actions
  login: (user: User, token: string) => void;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      
      login: (user, token) => set({ 
        user, 
        token, 
        isAuthenticated: true 
      }),
      
      logout: () => set({ 
        user: null, 
        token: null, 
        isAuthenticated: false 
      }),
      
      updateUser: (userData) => set((state) => ({
        user: state.user ? { ...state.user, ...userData } : null,
      })),
    }),
    {
      name: 'auth-storage', // localStorage key
    }
  )
);
```

**Usage** :
```tsx
'use client';

import { useAuthStore } from '@/lib/stores/auth-store';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export function UserMenu() {
  const { user, isAuthenticated, logout } = useAuthStore();
  
  if (!isAuthenticated || !user) {
    return <Button asChild><Link href="/auth/login">Connexion</Link></Button>;
  }
  
  return (
    <div className="flex items-center gap-4">
      <Avatar>
        <AvatarFallback>{user.name[0]}</AvatarFallback>
      </Avatar>
      <div>
        <p className="font-medium">{user.name}</p>
        <p className="text-sm text-muted-foreground">{user.email}</p>
      </div>
      <Button variant="outline" onClick={logout}>
        Déconnexion
      </Button>
    </div>
  );
}
```

---

### UI Store (Theme, Sidebar)

```ts
// lib/stores/ui-store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'light' | 'dark' | 'system';

interface UIState {
  theme: Theme;
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  
  // Actions
  setTheme: (theme: Theme) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebarCollapsed: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      theme: 'system',
      sidebarOpen: true,
      sidebarCollapsed: false,
      
      setTheme: (theme) => set({ theme }),
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      toggleSidebarCollapsed: () => set((state) => ({ 
        sidebarCollapsed: !state.sidebarCollapsed 
      })),
    }),
    {
      name: 'ui-storage',
    }
  )
);
```

**Usage** :
```tsx
'use client';

import { useUIStore } from '@/lib/stores/ui-store';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';

export function Header() {
  const { toggleSidebar } = useUIStore();
  
  return (
    <header className="flex items-center gap-4 p-4">
      <Button variant="ghost" size="icon" onClick={toggleSidebar}>
        <Menu className="h-5 w-5" />
      </Button>
      <h1>TaxasGE</h1>
    </header>
  );
}

export function Sidebar() {
  const { sidebarOpen, sidebarCollapsed } = useUIStore();
  
  if (!sidebarOpen) return null;
  
  return (
    <aside className={sidebarCollapsed ? 'w-16' : 'w-64'}>
      {/* Sidebar content */}
    </aside>
  );
}
```

---

### Cart Store (Panier)

```ts
// lib/stores/cart-store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  
  // Actions
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  
  // Computed
  totalItems: () => number;
  totalPrice: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      
      addItem: (item) => set((state) => {
        const existingItem = state.items.find(i => i.id === item.id);
        
        if (existingItem) {
          return {
            items: state.items.map(i =>
              i.id === item.id
                ? { ...i, quantity: i.quantity + 1 }
                : i
            ),
          };
        }
        
        return {
          items: [...state.items, { ...item, quantity: 1 }],
        };
      }),
      
      removeItem: (id) => set((state) => ({
        items: state.items.filter(item => item.id !== id),
      })),
      
      updateQuantity: (id, quantity) => set((state) => ({
        items: state.items.map(item =>
          item.id === id ? { ...item, quantity } : item
        ),
      })),
      
      clearCart: () => set({ items: [] }),
      
      totalItems: () => {
        const { items } = get();
        return items.reduce((sum, item) => sum + item.quantity, 0);
      },
      
      totalPrice: () => {
        const { items } = get();
        return items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      },
    }),
    {
      name: 'cart-storage',
    }
  )
);
```

**Usage** :
```tsx
'use client';

import { useCartStore } from '@/lib/stores/cart-store';
import { Button } from '@/components/ui/button';
import { ShoppingCart } from 'lucide-react';

export function CartBadge() {
  const { totalItems } = useCartStore();
  const count = totalItems();
  
  return (
    <Button variant="ghost" size="icon" className="relative">
      <ShoppingCart className="h-5 w-5" />
      {count > 0 && (
        <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
          {count}
        </span>
      )}
    </Button>
  );
}

export function AddToCartButton({ service }: { service: Service }) {
  const { addItem } = useCartStore();
  
  return (
    <Button onClick={() => addItem({
      id: service.id,
      name: service.name,
      price: service.price,
    })}>
      Ajouter au panier
    </Button>
  );
}
```

---

### Notifications Store

```ts
// lib/stores/notifications-store.ts
import { create } from 'zustand';

interface Notification {
  id: string;
  title: string;
  description?: string;
  type: 'success' | 'error' | 'warning' | 'info';
  timestamp: number;
}

interface NotificationsState {
  notifications: Notification[];
  
  // Actions
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
}

export const useNotificationsStore = create<NotificationsState>((set) => ({
  notifications: [],
  
  addNotification: (notification) => {
    const id = Date.now().toString();
    const timestamp = Date.now();
    
    set((state) => ({
      notifications: [
        ...state.notifications,
        { ...notification, id, timestamp },
      ],
    }));
    
    // Auto-remove après 5 secondes
    setTimeout(() => {
      set((state) => ({
        notifications: state.notifications.filter(n => n.id !== id),
      }));
    }, 5000);
  },
  
  removeNotification: (id) => set((state) => ({
    notifications: state.notifications.filter(n => n.id !== id),
  })),
  
  clearAll: () => set({ notifications: [] }),
}));
```

**Usage** :
```tsx
'use client';

import { useNotificationsStore } from '@/lib/stores/notifications-store';
import { Button } from '@/components/ui/button';

export function NotificationExample() {
  const { addNotification } = useNotificationsStore();
  
  const showSuccess = () => {
    addNotification({
      title: 'Succès',
      description: 'Votre action a été effectuée.',
      type: 'success',
    });
  };
  
  const showError = () => {
    addNotification({
      title: 'Erreur',
      description: 'Une erreur est survenue.',
      type: 'error',
    });
  };
  
  return (
    <div className="space-x-2">
      <Button onClick={showSuccess}>Succès</Button>
      <Button onClick={showError} variant="destructive">Erreur</Button>
    </div>
  );
}

// Composant pour afficher les notifications
export function NotificationsList() {
  const { notifications, removeNotification } = useNotificationsStore();
  
  return (
    <div className="fixed top-4 right-4 space-y-2 z-50">
      {notifications.map(notification => (
        <div 
          key={notification.id}
          className={`p-4 rounded-lg shadow-lg ${
            notification.type === 'success' ? 'bg-success text-success-foreground' :
            notification.type === 'error' ? 'bg-destructive text-destructive-foreground' :
            'bg-background'
          }`}
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="font-medium">{notification.title}</p>
              {notification.description && (
                <p className="text-sm mt-1">{notification.description}</p>
              )}
            </div>
            <button onClick={() => removeNotification(notification.id)}>
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
```

---

## 🎯 PATTERNS AVANCÉS

### Slices (Découper Store Complexe)

```ts
// lib/stores/app-store.ts
import { create } from 'zustand';

// Slice Auth
interface AuthSlice {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
}

const createAuthSlice = (set) => ({
  user: null,
  login: (user) => set({ user }),
  logout: () => set({ user: null }),
});

// Slice UI
interface UISlice {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const createUISlice = (set) => ({
  theme: 'light',
  setTheme: (theme) => set({ theme }),
});

// Store combiné
type AppState = AuthSlice & UISlice;

export const useAppStore = create<AppState>((set) => ({
  ...createAuthSlice(set),
  ...createUISlice(set),
}));
```

---

### Selectors (Optimisation Performance)

```tsx
'use client';

import { useCartStore } from '@/lib/stores/cart-store';

// ❌ Mauvais : Re-render à chaque changement du store
export function BadExample() {
  const store = useCartStore();
  const count = store.totalItems();
  
  return <div>{count}</div>;
}

// ✅ Bon : Re-render seulement si `items` change
export function GoodExample() {
  const items = useCartStore((state) => state.items);
  const count = items.reduce((sum, item) => sum + item.quantity, 0);
  
  return <div>{count}</div>;
}

// ✅ Encore mieux : Selector custom
const selectTotalItems = (state) => 
  state.items.reduce((sum, item) => sum + item.quantity, 0);

export function BestExample() {
  const count = useCartStore(selectTotalItems);
  
  return <div>{count}</div>;
}
```

---

### Async Actions

```ts
// lib/stores/services-store.ts
import { create } from 'zustand';
import { getServices } from '@/lib/api/services';

interface ServicesState {
  services: Service[];
  loading: boolean;
  error: string | null;
  
  // Actions
  fetchServices: () => Promise<void>;
  clearError: () => void;
}

export const useServicesStore = create<ServicesState>((set) => ({
  services: [],
  loading: false,
  error: null,
  
  fetchServices: async () => {
    set({ loading: true, error: null });
    
    try {
      const services = await getServices();
      set({ services, loading: false });
    } catch (error) {
      set({ 
        error: error.message, 
        loading: false 
      });
    }
  },
  
  clearError: () => set({ error: null }),
}));
```

**Usage** :
```tsx
'use client';

import { useEffect } from 'react';
import { useServicesStore } from '@/lib/stores/services-store';

export function ServicesList() {
  const { services, loading, error, fetchServices } = useServicesStore();
  
  useEffect(() => {
    fetchServices();
  }, [fetchServices]);
  
  if (loading) return <div>Chargement...</div>;
  if (error) return <div>Erreur : {error}</div>;
  
  return (
    <div>
      {services.map(service => (
        <div key={service.id}>{service.name}</div>
      ))}
    </div>
  );
}
```

---

## 💾 PERSISTENCE

### LocalStorage (Zustand persist)

```ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export const useStore = create(
  persist(
    (set) => ({
      // state & actions
    }),
    {
      name: 'storage-key', // localStorage key
      storage: createJSONStorage(() => localStorage), // default
    }
  )
);
```

---

### SessionStorage

```ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export const useStore = create(
  persist(
    (set) => ({
      // state & actions
    }),
    {
      name: 'session-key',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);
```

---

### Partial Persistence (Certaines clés seulement)

```ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      temporaryData: null, // Ne pas persister
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        // temporaryData est exclu
      }),
    }
  )
);
```

---

## 🎯 BEST PRACTICES

### ✅ DO (À FAIRE)

```tsx
// ✅ Types stricts
interface Store {
  count: number;
  increment: () => void;
}

export const useStore = create<Store>((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
}));

// ✅ Selectors pour optimisation
const selectCount = (state) => state.count;
const count = useStore(selectCount);

// ✅ Actions immutables
set((state) => ({ count: state.count + 1 })); // ✅
set({ count: state.count + 1 }); // ❌ state undefined

// ✅ Nommage clair
useAuthStore, useCartStore, useUIStore

// ✅ Un store par domaine
auth-store.ts, cart-store.ts, ui-store.ts

// ✅ Persist seulement ce qui est nécessaire
partialize: (state) => ({ user: state.user })
```

---

### ❌ DON'T (À ÉVITER)

```tsx
// ❌ Pas de types
export const useStore = create((set) => ({ // any
  count: 0,
}));

// ❌ Mutations directes
set((state) => {
  state.count++; // ❌ Mutation
  return state;
});

// ✅ Immutable update
set((state) => ({ count: state.count + 1 }));

// ❌ Store trop large (tout dans un store)
export const useAppStore = create((set) => ({
  user: null,
  cart: [],
  theme: 'light',
  notifications: [],
  // ... 50 autres propriétés
}));

// ✅ Stores séparés
useAuthStore, useCartStore, useUIStore, useNotificationsStore

// ❌ Logique métier dans composants
const Component = () => {
  const items = useCartStore((state) => state.items);
  const total = items.reduce(...); // ❌ Logique dans composant
}

// ✅ Logique dans store
const useCartStore = create((set, get) => ({
  items: [],
  totalPrice: () => get().items.reduce(...), // ✅
}));
```

---

## 📚 STORES TAXASGE

### Stores Disponibles

```
lib/stores/
├── auth-store.ts          → Authentification utilisateur
├── ui-store.ts            → Theme, sidebar, modals
├── cart-store.ts          → Panier services (si e-commerce)
└── notifications-store.ts → Notifications toasts
```

---

### Usage Type

```tsx
// Dans Header
const { user, logout } = useAuthStore();

// Dans Sidebar
const { sidebarOpen, toggleSidebar } = useUIStore();

// Dans Panier
const { items, totalPrice, clearCart } = useCartStore();

// Notifications
const { addNotification } = useNotificationsStore();
```

---

## 📚 RÉFÉRENCES

- **Zustand** : https://github.com/pmndrs/zustand
- **React Hooks** : https://react.dev/reference/react
- **ARCHITECTURE.md** : Architecture complète

---

**Document** : State Management  
**Auteur** : Claude (Agent IA)  
**Date** : 2025-10-31  
**Version** : 1.0  
**Statut** : ✅ Production Ready
