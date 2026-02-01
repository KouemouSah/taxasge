# Plan de Refactoring - DisplayConfigForm

**Date**: 2026-02-01
**Objectif**: Implémenter checkbox toggle + drag & drop réel pour le réordonnancement des colonnes

---

## 1. Analyse de l'Existant

### Bibliothèque disponible
- `@dnd-kit/core`: ^6.3.1
- `@dnd-kit/sortable`: ^10.0.0
- `@dnd-kit/utilities`: ^3.2.2

### Fichier à modifier
- `packages/web/src/modules/admin/components/DisplayConfigForm.tsx`

### Comportement actuel (problématique)
- Clic pour ajouter une colonne (pas de toggle)
- Icône `GripVertical` cosmétique (TROMPEUR - ne fait rien)
- Flèches ↑↓ pour réordonner (fonctionnel mais basique)
- Layout 3 colonnes séparées

### Comportement cible
- Checkboxes toggle pour sélectionner/désélectionner colonnes
- Drag & drop RÉEL pour réordonner les colonnes sélectionnées
- Flèches ↑↓ comme alternative au drag & drop (accessibilité)
- Interface plus simple et cohérente

---

## 2. Architecture Technique

### Imports @dnd-kit nécessaires
```typescript
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
```

### Composant SortableColumnItem
```typescript
// Composant enfant pour chaque colonne draggable
function SortableColumnItem({
  id,
  label,
  onRemove,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast
}: SortableColumnItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="...">
      <button {...attributes} {...listeners}>
        <GripVertical /> {/* MAINTENANT FONCTIONNEL */}
      </button>
      <span>{label}</span>
      <div>
        <button onClick={onMoveUp} disabled={isFirst}>↑</button>
        <button onClick={onMoveDown} disabled={isLast}>↓</button>
        <button onClick={onRemove}>✕</button>
      </div>
    </div>
  );
}
```

### Handler onDragEnd
```typescript
const handleDragEnd = (event: DragEndEvent) => {
  const { active, over } = event;

  if (over && active.id !== over.id) {
    setSelectedColumns((items) => {
      const oldIndex = items.indexOf(active.id as string);
      const newIndex = items.indexOf(over.id as string);
      return arrayMove(items, oldIndex, newIndex);
    });
  }
};
```

---

## 3. Checklist d'Implémentation

### Phase 1: Refactoring Structure (Checkbox Toggle) ✅ COMPLÉTÉ
- [x] Remplacer le layout 3 colonnes par 2x2 grid (Colonnes dispo | Colonnes sélect | Sections | Preview)
- [x] Implémenter checkboxes toggle pour toutes les colonnes disponibles
- [x] Séparer visuellement colonnes système vs extraites
- [x] Garder la recherche/filtre sur les colonnes
- [x] Mettre à jour l'état `selectedColumns` via toggle

### Phase 2: Drag & Drop Réel ✅ COMPLÉTÉ
- [x] Créer composant `SortableColumnItem` avec `useSortable`
- [x] Wrapper la liste des colonnes sélectionnées avec `DndContext` + `SortableContext`
- [x] Configurer les sensors (Pointer + Keyboard pour accessibilité)
- [x] Implémenter `handleDragEnd` avec `arrayMove`
- [x] Ajouter styles visuels pendant le drag (opacity, shadow, ring)
- [x] Support touch via PointerSensor avec distance constraint

### Phase 3: Flèches comme Alternative ✅ COMPLÉTÉ
- [x] Boutons ↑↓ fonctionnels avec `moveColumn()`
- [x] Fonctionnent indépendamment du drag
- [x] Désactivés aux extrémités (index === 0, index === length - 1)

### Phase 4: Polish & Tests ✅ COMPLÉTÉ
- [x] GripVertical maintenant FONCTIONNEL (avec listeners)
- [x] Preview se met à jour en temps réel
- [x] Gestion des cas: 0 colonnes = message vide
- [x] Accessibilité clavier via KeyboardSensor + sortableKeyboardCoordinates
- [x] TypeScript validé (npm run type-check passe)

---

## 4. Design UI Final

```
┌─────────────────────────────────────────────────────────────────────┐
│ Pattern: [PASAPORTE_%                    ] (3 demandes trouvées)    │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────┐  ┌─────────────────────────────────┐
│ COLONNES DISPONIBLES            │  │ COLONNES SÉLECTIONNÉES (6)      │
│ [Rechercher...]                 │  │ Réordonner par drag ou flèches  │
│                                 │  │                                 │
│ ── Système ──                   │  │ ┌─────────────────────────────┐ │
│ [✓] Référence                   │  │ │ ≡ Référence          ↑ ↓ ✕ │ │
│ [✓] Nom Complet                 │  │ └─────────────────────────────┘ │
│ [ ] Type de Solicitud           │  │ ┌─────────────────────────────┐ │
│ [✓] Date Création               │  │ │ ≡ Nom Complet        ↑ ↓ ✕ │ │
│ [ ] Priorité                    │  │ └─────────────────────────────┘ │
│ [✓] Statut                      │  │ ┌─────────────────────────────┐ │
│                                 │  │ │ ≡ Date Création      ↑ ↓ ✕ │ │
│ ── Extraites (12 demandes) ──   │  │ └─────────────────────────────┘ │
│ [✓] Nombres                     │  │ ...                             │
│ [✓] Apellidos                   │  │                                 │
│ [ ] Numero DIP                  │  │ (drag & drop pour réordonner)   │
│ [ ] Fecha Nacimiento            │  │                                 │
│ ...                             │  │                                 │
└─────────────────────────────────┘  └─────────────────────────────────┘

┌─────────────────────────────────┐  ┌─────────────────────────────────┐
│ SECTIONS DU PANNEAU             │  │ APERÇU                          │
│                                 │  │ ┌─────────────────────────────┐ │
│ [✓] Info Générale               │  │ │ REF-2026-00142              │ │
│ [✓] Données Extraites           │  │ │ Juan Carlos García López    │ │
│ [✓] Documents                   │  │ │ ─────────────────────────── │ │
│ [✓] Contact                     │  │ │ Référence: —                │ │
│ [ ] Rendez-vous                 │  │ │ Nom Complet: —              │ │
│ [ ] Paiement                    │  │ │ +4 colonnes                 │ │
│ [ ] Timeline                    │  │ │ ─────────────────────────── │ │
│ [ ] Historique                  │  │ │ [Info] [Docs] [Contact]     │ │
└─────────────────────────────────┘  └─────────────────────────────────┘

                              [Enregistrer]
```

---

## 5. Fichiers Impactés

| Fichier | Action |
|---------|--------|
| `DisplayConfigForm.tsx` | MODIFIER - Refactoring complet |
| `package.json` | AUCUN - @dnd-kit déjà installé |
| Traductions | AUCUN - Déjà présentes |

---

## 6. Critères de Validation

1. **Drag & drop fonctionne** - Je peux glisser une colonne et la déposer ailleurs
2. **Flèches fonctionnent** - Je peux utiliser ↑↓ comme alternative
3. **Toggle fonctionne** - Checkbox coche/décoche ajoute/retire de la liste
4. **Ordre persisté** - L'ordre est sauvegardé correctement via l'API
5. **Pas de code trompeur** - Aucune icône/cursor sans fonction
6. **TypeScript valide** - `npm run type-check` passe

---

*Plan créé le 2026-02-01*
