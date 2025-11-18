# Configuration du Dashboard Admin & Gestion de la Vérification d'Email

## 📋 Problématique

Le système actuel requiert la vérification d'email pour tous les utilisateurs. Comment permettre l'accès au dashboard admin tout en maintenant la sécurité ?

## 🎯 Solutions Proposées

### Solution 1: Email Pré-Vérifié (RECOMMANDÉE) ⭐

**Principe:** Marquer l'email comme vérifié lors de la création de l'utilisateur admin.

**Avantages:**
- ✅ Simple et direct
- ✅ Pas de modification du flow d'authentification
- ✅ Utilisateur admin peut se connecter immédiatement
- ✅ Maintient la sécurité pour les autres utilisateurs

**Implémentation:**
```sql
-- L'email_confirmed_at est défini lors de la création
INSERT INTO auth.users (
    email,
    encrypted_password,
    email_confirmed_at,  -- ← Pré-vérifié
    ...
) VALUES (
    'sah@emacsah.com',
    crypt('password', gen_salt('bf')),
    NOW(),  -- ← Email déjà vérifié
    ...
);
```

**Status:** ✅ Implémenté dans `create_admin_user.py`

---

### Solution 2: Bypass de Vérification pour les Admins

**Principe:** Modifier la logique d'authentification pour permettre aux admin de bypass la vérification.

**Avantages:**
- Flexibilité pour plusieurs admin
- Pas besoin de pré-vérifier chaque admin

**Inconvénients:**
- ⚠️ Modifie le flow de sécurité
- ⚠️ Plus complexe à implémenter
- ⚠️ Risque de bypass non intentionnel

**Implémentation:**
```python
# packages/backend/app/api/v1/auth.py

def verify_user_access(user):
    """Check if user can access dashboard"""
    # Check if email is verified OR user is admin
    if user.email_verified:
        return True

    # Check if user has admin role
    if user.role and user.role.code == 'ADMIN':
        return True  # Admin can bypass email verification

    raise HTTPException(
        status_code=403,
        detail="Email not verified. Please check your email."
    )
```

---

### Solution 3: Email de Vérification Automatique pour Admin

**Principe:** Envoyer un email de vérification mais avec lien de courte durée (5 min)

**Avantages:**
- Maintient le processus standard
- Traçabilité de la vérification

**Inconvénients:**
- ⚠️ Nécessite configuration SMTP
- ⚠️ Délai avant accès initial
- ⚠️ Complexité inutile pour un seul utilisateur

---

## 🏗️ Structure du Dashboard Admin

### 1. Navigation Sidebar

**Fichier:** `packages/web/src/components/layout/Sidebar.tsx` (à créer ou modifier)

```typescript
// Structure proposée pour le menu admin

const adminMenuItems = [
  {
    title: "Dashboard",
    href: "/dashboard/admin",
    icon: LayoutDashboard,
    permission: "dashboard:view"
  },
  {
    title: "Gestion",
    items: [
      {
        title: "Utilisateurs",
        href: "/dashboard/admin/users",
        icon: Users,
        permission: "users:view"
      },
      {
        title: "Rôles",
        href: "/dashboard/admin/roles",
        icon: Shield,
        permission: "roles:view"
      },
      {
        title: "Permissions",
        href: "/dashboard/admin/permissions",
        icon: Key,
        permission: "permissions:view"
      }
    ]
  },
  {
    title: "Système",
    items: [
      {
        title: "Logs d'Audit",
        href: "/dashboard/admin/audit-logs",
        icon: FileText,
        permission: "audit:view"
      },
      {
        title: "Paramètres",
        href: "/dashboard/admin/settings",
        icon: Settings,
        permission: "settings:manage"
      }
    ]
  }
]
```

### 2. Layout Admin

**Fichier:** `packages/web/src/app/dashboard/admin/layout.tsx` (à créer)

```typescript
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminHeader from '@/components/admin/AdminHeader';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession();

  // Check if user is authenticated
  if (!session) {
    redirect('/login');
  }

  // Check if user has admin role
  if (session.user.role?.code !== 'ADMIN') {
    redirect('/dashboard'); // Redirect to user dashboard
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <AdminSidebar />

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminHeader user={session.user} />

        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
```

### 3. Page d'Index Admin

**Fichier:** `packages/web/src/app/dashboard/admin/page.tsx` (à créer)

```typescript
import StatsCards from '@/components/admin/StatsCards';
import RecentActivity from '@/components/admin/RecentActivity';
import SystemHealth from '@/components/admin/SystemHealth';

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard Administrateur</h1>
        <p className="text-muted-foreground mt-2">
          Vue d'ensemble du système et des activités
        </p>
      </div>

      {/* Stats Cards */}
      <StatsCards />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <RecentActivity />

        {/* System Health */}
        <SystemHealth />
      </div>
    </div>
  );
}
```

### 4. Protection des Routes Admin

**Middleware:** `packages/web/src/middleware.ts` (à modifier)

```typescript
import { withAuth } from 'next-auth/middleware';

export default withAuth(
  function middleware(req) {
    // Check admin routes
    if (req.nextUrl.pathname.startsWith('/dashboard/admin')) {
      const token = req.nextauth.token;

      // Redirect if not admin
      if (token?.role?.code !== 'ADMIN') {
        return NextResponse.redirect(new URL('/dashboard', req.url));
      }
    }
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: ['/dashboard/:path*'],
};
```

---

## 📝 Plan d'Implémentation

### Étape 1: Créer l'Utilisateur Admin ✅

```bash
# Exécuter le script de création
python "C:\Program Files\Odoo 17\python\python.exe" .github/docs-internal/database/create_admin_user.py
```

**Résultat attendu:**
- ✅ Utilisateur créé avec email: `sah@emacsah.com`
- ✅ Email marqué comme vérifié (email_confirmed_at défini)
- ✅ Rôle admin assigné
- ✅ Toutes les permissions accordées au rôle admin

### Étape 2: Créer la Structure du Dashboard

1. **Layout Admin** (`/dashboard/admin/layout.tsx`)
   - Protection de route (admin seulement)
   - Sidebar avec navigation
   - Header avec profil utilisateur

2. **Page Index** (`/dashboard/admin/page.tsx`)
   - Dashboard avec statistiques
   - Activité récente
   - État du système

3. **Composants Réutilisables**
   - `AdminSidebar.tsx` - Navigation latérale
   - `AdminHeader.tsx` - En-tête avec profil
   - `StatsCards.tsx` - Cartes de statistiques

### Étape 3: Intégrer les Pages Existantes

Les pages déjà créées sont prêtes:
- ✅ `/dashboard/admin/permissions` - Liste et gestion des permissions
- ✅ `/dashboard/admin/roles` - CRUD complet des rôles

Il suffit de:
1. Ajouter les liens dans le sidebar
2. Vérifier les permissions d'accès
3. Tester le flow complet

### Étape 4: Tests

1. **Test de Connexion**
   - Connexion avec credentials admin
   - Vérification que l'email n'a pas besoin de validation
   - Redirection vers dashboard admin

2. **Test des Permissions**
   - Accès aux pages admin
   - Vérification des permissions sur chaque action
   - Test de création/modification de rôles

3. **Test de Sécurité**
   - Tentative d'accès avec utilisateur non-admin
   - Vérification des redirections
   - Test des protections de routes

---

## 🔐 Sécurité

### Bonnes Pratiques Implémentées

1. **Email Pré-Vérifié**
   - Seulement pour le premier admin
   - Traçabilité complète (email_confirmed_at)

2. **Permissions Granulaires**
   - Chaque action nécessite une permission spécifique
   - Audit complet des changements (permission_audit_log)

3. **Protection des Routes**
   - Middleware vérifie le rôle admin
   - Pas d'accès direct aux URLs admin

4. **Audit Trail**
   - Toutes les modifications enregistrées
   - Who, What, When pour chaque changement

---

## 🚀 Commandes Rapides

```bash
# Créer l'utilisateur admin
"C:\Program Files\Odoo 17\python\python.exe" .github/docs-internal/database/create_admin_user.py

# Vérifier la création
psql $DATABASE_URL -c "SELECT email, email_confirmed_at, role_id FROM auth.users WHERE email = 'sah@emacsah.com';"

# Voir les permissions du rôle admin
psql $DATABASE_URL -c "SELECT COUNT(*) FROM role_permissions WHERE role_id = (SELECT id FROM roles WHERE code = 'ADMIN');"
```

---

## 📌 Recommandation Finale

**Solution Recommandée:** Solution 1 - Email Pré-Vérifié

**Raisons:**
1. ✅ Sécurité maintenue pour tous les autres utilisateurs
2. ✅ Simplicité d'implémentation
3. ✅ Pas de modification du code d'authentification
4. ✅ Admin peut se connecter immédiatement
5. ✅ Traçabilité complète (email_confirmed_at visible dans la BDD)

**Prochaines Étapes:**
1. Exécuter `create_admin_user.py`
2. Tester la connexion
3. Créer la structure du dashboard admin
4. Intégrer les pages existantes
