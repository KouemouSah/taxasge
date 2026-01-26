# Plan d'Implémentation : Page PENDIENTES Optimisée

**Date**: 2026-01-26
**Objectif**: Permettre le traitement de 50+ dossiers/jour en 3-4 clics maximum
**Pattern**: Split View (Liste + Aperçu)

---

## Architecture Cible

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  PENDIENTES - {count} dossiers à traiter              [Filtres ▼] [↻ Refresh]  │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌─ Liste (35%) ───────────────────┐  ┌─ APERÇU DOSSIER (65%) ────────────────┐│
│  │                                  │  │                                       ││
│  │  🔍 Rechercher...                │  │  ┌─ DONNÉES DEMANDE ───────────────┐ ││
│  │  ─────────────────────────────   │  │  │ PASAPORTE EXPEDICION            │ ││
│  │                                  │  │  │ Ref: REF-2026-00123   🔴 URGENT │ ││
│  │  ▶ REF-2026-00123        ⏱ 2h   │  │  │ SLA: ⏱ 2h restantes            │ ││
│  │    Pasaporte Exp.    🔴 URGENT  │  │  └─────────────────────────────────┘ ││
│  │    Juan García Pérez             │  │                                       ││
│  │  ─────────────────────────────   │  │  ┌─ DONNÉES EXTRAITES ─────────────┐ ││
│  │                                  │  │  │ Nom: GARCÍA PÉREZ               │ ││
│  │    REF-2026-00124        ⏱ 4h   │  │  │ Prénom: Juan Carlos              │ ││
│  │    Pasaporte Ren.    🟡 NORMAL  │  │  │ Né le: 15/03/1990                │ ││
│  │    Maria López                   │  │  │ Sexe: Masculino                  │ ││
│  │  ─────────────────────────────   │  │  │ Lieu: Malabo                     │ ││
│  │                                  │  │  │ N° DIP: 123456789                │ ││
│  │    REF-2026-00125        ⏱ 6h   │  │  │ Domicilio: Calle Principal, 12   │ ││
│  │    Residencia Exp.   🟢 LOW     │  │  └─────────────────────────────────┘ ││
│  │    Pedro Martín                  │  │                                       ││
│  │  ─────────────────────────────   │  │  ┌─ DOCUMENTOS (3) ────────────────┐ ││
│  │                                  │  │  │ [📄] [📄] [📄]  [Ver todos →]   │ ││
│  │    ...                           │  │  │ Foto  Partida  DIP              │ ││
│  │                                  │  │  └─────────────────────────────────┘ ││
│  │                                  │  │                                       ││
│  │                                  │  │  ┌─ CONTACT ───────────────────────┐ ││
│  │                                  │  │  │ 📧 juan@email.com                │ ││
│  │                                  │  │  │ 📱 +240 222 333 444              │ ││
│  │                                  │  │  └─────────────────────────────────┘ ││
│  │                                  │  │                                       ││
│  │                                  │  │  ┌─ RENDEZ-VOUS ───────────────────┐ ││
│  │                                  │  │  │ 📅 28/01/2026 à 10:30           │ ││
│  │                                  │  │  │ 📍 CNEDOGE Malabo, Oficina 3    │ ││
│  │                                  │  │  └─────────────────────────────────┘ ││
│  │                                  │  │                                       ││
│  │  ─────────────────────────────   │  │  ┌─ ACTIONS ───────────────────────┐ ││
│  │  Page 1/5   [◀] [1] [2] [▶]     │  │  │                                  │ ││
│  │                                  │  │  │  [✓ APROBAR]  [✗ RECHAZAR]     │ ││
│  │                                  │  │  │                                  │ ││
│  │                                  │  │  │  [👁 Ver detalle completo]       │ ││
│  │                                  │  │  └─────────────────────────────────┘ ││
│  └──────────────────────────────────┘  └───────────────────────────────────────┘│
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Phase 1 : Backend - Nouvel Endpoint Aperçu

### 1.1 Nouveau Modèle Pydantic

**Fichier**: `packages/backend/app/modules/service_requests/api/agent_routes.py`

```python
class RequestPreviewExtractedData(BaseModel):
    """Données extraites pour l'aperçu"""
    apellidos: Optional[str] = None
    nombres: Optional[str] = None
    fecha_nacimiento: Optional[str] = None
    sexo: Optional[str] = None
    lugar_nacimiento: Optional[str] = None
    numero_dip: Optional[str] = None
    numero_pasaporte_antiguo: Optional[str] = None  # Si renovation
    domicilio: Optional[str] = None


class RequestPreviewDocument(BaseModel):
    """Document pour l'aperçu (miniature)"""
    code: str
    name: str
    thumbnail_url: Optional[str] = None
    validation_status: str = "pending"


class RequestPreviewAppointment(BaseModel):
    """Info RDV pour l'aperçu"""
    date: str
    time: str
    location_name: str
    location_address: Optional[str] = None


class ServiceRequestPreview(BaseModel):
    """Aperçu complet d'une demande pour le split view"""
    # Données demande
    id: str
    reference: str
    workflow_code: str
    workflow_label: str
    solicitud_type: str
    motivo: Optional[str] = None
    status: str
    priority: str

    # SLA
    sla_deadline: Optional[str] = None
    sla_remaining_hours: Optional[float] = None
    sla_status: str = "on_track"  # on_track, warning, breached

    # Données extraites
    extracted_data: RequestPreviewExtractedData

    # Documents (max 4 pour aperçu)
    documents: List[RequestPreviewDocument]
    documents_count: int

    # Contact (utilisateur qui a initié)
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None

    # RDV (si planifié)
    appointment: Optional[RequestPreviewAppointment] = None

    # Métadonnées
    created_at: str
    submitted_at: Optional[str] = None


class ServiceRequestListWithPreview(BaseModel):
    """Liste avec aperçu intégré"""
    items: List[ServiceRequestListItem]  # Liste légère pour la colonne gauche
    total: int
    page: int
    page_size: int
    total_pages: int
```

### 1.2 Nouvel Endpoint GET Preview

**Fichier**: `packages/backend/app/modules/service_requests/api/agent_routes.py`

```python
@router.get(
    "/entity/{entity_code}/requests/{request_id}/preview",
    response_model=ServiceRequestPreview,
    summary="Get request preview for split view"
)
async def get_request_preview(
    entity_code: str = Path(...),
    request_id: UUID = Path(...),
    db: asyncpg.Connection = Depends(get_database),
    current_user=Depends(get_current_user),
    _=Depends(permission_required("service_request.view"))
):
    """
    Get lightweight preview of a service request for the split view.
    Returns essential data for quick review without full detail page.
    """
    # Query optimisée pour l'aperçu
    query = """
        SELECT
            sr.id,
            sr.reference,
            sr.workflow_code,
            w.name_es as workflow_label,
            sr.solicitud_type,
            sr.motivo,
            sr.status,
            sr.priority,
            sr.form_data,
            sr.created_at,
            sr.submitted_at,
            sr.sla_deadline,
            u.email as contact_email,
            u.phone_number as contact_phone,
            ar.appointment_date,
            ar.appointment_time,
            el.location_name,
            el.location_address
        FROM service_requests sr
        JOIN users u ON sr.user_id = u.id
        JOIN workflows w ON sr.workflow_code = w.code
        LEFT JOIN appointment_reservations ar ON ar.service_request_id = sr.id
            AND ar.status NOT IN ('cancelled', 'expired')
        LEFT JOIN entity_locations el ON ar.entity_location_id = el.id
        WHERE sr.id = $1
    """
    # ... implementation
```

### 1.3 Checklist Backend Phase 1

- [x] Créer les modèles Pydantic pour preview (RequestPreviewExtractedData, RequestPreviewDocument, RequestPreviewAppointment, ServiceRequestPreview)
- [x] Créer endpoint GET `/entity/{entity_code}/requests/{request_id}/preview`
- [x] Optimiser la query pour extraire form_data (single query with JOINs)
- [x] Ajouter calcul SLA remaining hours
- [x] Support navigation (list_index, list_total params)
- [ ] Tester avec Swagger UI (après déploiement)
- [ ] Vérifier performance (< 200ms)

---

## Phase 2 : Frontend - Composants Split View

### 2.1 Structure des Composants

```
packages/web/src/modules/agent-dashboard/components/
├── pending/
│   ├── PendingPage.tsx              # Page principale split view
│   ├── RequestList.tsx              # Colonne gauche - liste
│   ├── RequestListItem.tsx          # Item de la liste
│   ├── RequestPreview.tsx           # Colonne droite - aperçu
│   ├── PreviewSkeleton.tsx          # Loading state aperçu
│   ├── sections/
│   │   ├── RequestInfoSection.tsx   # Bloc données demande
│   │   ├── ExtractedDataSection.tsx # Bloc données extraites
│   │   ├── DocumentsSection.tsx     # Bloc documents (miniatures)
│   │   ├── ContactSection.tsx       # Bloc contact
│   │   ├── AppointmentSection.tsx   # Bloc RDV
│   │   └── ActionsSection.tsx       # Bloc actions
│   └── hooks/
│       ├── useRequestList.ts        # Hook liste paginée
│       └── useRequestPreview.ts     # Hook aperçu
```

### 2.2 Composant Principal : PendingPage.tsx

```typescript
'use client';

import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { RequestList } from './RequestList';
import { RequestPreview } from './RequestPreview';
import { PreviewSkeleton } from './PreviewSkeleton';
import { useRequestList } from './hooks/useRequestList';
import { useRequestPreview } from './hooks/useRequestPreview';
import type { EntityCode } from '../../types';

interface PendingPageProps {
  entityCode: EntityCode;
}

export function PendingPage({ entityCode }: PendingPageProps) {
  const t = useTranslations('agent.pending');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    search: '',
    priority: undefined,
    solicitudType: undefined,
  });

  // Liste des demandes
  const {
    data: listData,
    isLoading: listLoading,
    refetch: refetchList
  } = useRequestList(entityCode, {
    action: 'pending',
    ...filters,
  });

  // Aperçu de la demande sélectionnée
  const {
    data: preview,
    isLoading: previewLoading
  } = useRequestPreview(entityCode, selectedId);

  // Auto-sélection du premier item
  useEffect(() => {
    if (listData?.items?.length && !selectedId) {
      setSelectedId(listData.items[0].id);
    }
  }, [listData, selectedId]);

  // Callbacks actions
  const handleApprove = useCallback(async () => {
    // Appel API approve
    // Refetch list
    // Sélectionner item suivant
  }, [selectedId]);

  const handleReject = useCallback(async (reason: string) => {
    // Appel API reject avec raison
    // Refetch list
    // Sélectionner item suivant
  }, [selectedId]);

  return (
    <div className="flex h-[calc(100vh-12rem)] gap-4">
      {/* Colonne gauche - Liste */}
      <div className="w-[35%] flex flex-col">
        <RequestList
          items={listData?.items || []}
          selectedId={selectedId}
          onSelect={setSelectedId}
          isLoading={listLoading}
          filters={filters}
          onFiltersChange={setFilters}
          pagination={{
            page: listData?.page || 1,
            totalPages: listData?.total_pages || 1,
            total: listData?.total || 0,
          }}
        />
      </div>

      {/* Colonne droite - Aperçu */}
      <div className="w-[65%] overflow-y-auto">
        {previewLoading ? (
          <PreviewSkeleton />
        ) : preview ? (
          <RequestPreview
            data={preview}
            onApprove={handleApprove}
            onReject={handleReject}
            entityCode={entityCode}
          />
        ) : (
          <EmptyState message={t('selectRequest')} />
        )}
      </div>
    </div>
  );
}
```

### 2.3 Composant RequestPreview.tsx

```typescript
interface RequestPreviewProps {
  data: ServiceRequestPreview;
  onApprove: () => Promise<void>;
  onReject: (reason: string) => Promise<void>;
  entityCode: EntityCode;
}

export function RequestPreview({
  data,
  onApprove,
  onReject,
  entityCode
}: RequestPreviewProps) {
  const t = useTranslations('agent.pending.preview');
  const locale = useLocale();
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);

  return (
    <div className="space-y-4 p-4">
      {/* BLOC 1: Données Demande */}
      <RequestInfoSection
        reference={data.reference}
        workflowLabel={data.workflow_label}
        solicitudType={data.solicitud_type}
        priority={data.priority}
        slaStatus={data.sla_status}
        slaRemainingHours={data.sla_remaining_hours}
      />

      {/* BLOC 2: Données Extraites */}
      <ExtractedDataSection data={data.extracted_data} />

      {/* BLOC 3: Documents */}
      <DocumentsSection
        documents={data.documents}
        totalCount={data.documents_count}
        requestId={data.id}
      />

      {/* BLOC 4: Contact */}
      <ContactSection
        email={data.contact_email}
        phone={data.contact_phone}
      />

      {/* BLOC 5: RDV (si existe) */}
      {data.appointment && (
        <AppointmentSection appointment={data.appointment} />
      )}

      {/* BLOC 6: Actions */}
      <ActionsSection
        onApprove={onApprove}
        onReject={onReject}
        isApproving={isApproving}
        isRejecting={isRejecting}
        detailUrl={`/${locale}/dashboard/agent/${entityCode}/request/${data.id}`}
      />
    </div>
  );
}
```

### 2.4 Checklist Frontend Phase 2

- [x] Créer structure dossiers `pending/`
- [x] Utiliser `useEntityServiceRequests` existant (pas besoin de nouveau hook)
- [x] Implémenter `useRequestPreview` hook
- [x] Créer `PendingPage.tsx` (split view)
- [x] Créer `RequestList.tsx` avec sélection
- [x] Créer `RequestListItem.tsx` avec indicateurs SLA
- [x] Créer `RequestPreview.tsx` avec navigation prev/next
- [x] Créer sections (5 blocs): RequestInfo, ExtractedData, Documents, Contact, Appointment
- [x] Ajouter loading states (skeletons)
- [x] Ajouter empty states
- [x] Intégrer actions Approve/Reject avec dialog
- [x] Navigation clavier (↑↓)
- [x] Traductions es/fr/en ajoutées
- [ ] Tests manuels avec données réelles (après déploiement)

---

## Phase 3 : Intégration Actions

### 3.1 Action Approve (Quick)

```typescript
// Dans ActionsSection.tsx
const handleQuickApprove = async () => {
  setIsApproving(true);
  try {
    await agentRequestsApi.makeDecision(requestId, {
      decision: 'approve',
      agent_comments: 'Aprobado desde vista rápida',
    });
    toast.success(t('approveSuccess'));
    onApprove(); // Callback parent pour refetch + next
  } catch (error) {
    toast.error(t('approveError'));
  } finally {
    setIsApproving(false);
  }
};
```

### 3.2 Action Reject (avec raison)

```typescript
const handleReject = async () => {
  if (!rejectReason.trim()) {
    toast.error(t('rejectReasonRequired'));
    return;
  }
  setIsRejecting(true);
  try {
    await agentRequestsApi.makeDecision(requestId, {
      decision: 'reject',
      rejection_reason: rejectReason,
    });
    toast.success(t('rejectSuccess'));
    onReject(rejectReason);
  } catch (error) {
    toast.error(t('rejectError'));
  } finally {
    setIsRejecting(false);
    setShowRejectInput(false);
    setRejectReason('');
  }
};
```

### 3.3 Auto-navigation après action

```typescript
const handleActionComplete = useCallback(() => {
  // Trouver l'index actuel
  const currentIndex = listData.items.findIndex(i => i.id === selectedId);

  // Refetch la liste
  refetchList();

  // Sélectionner le suivant (ou précédent si dernier)
  setTimeout(() => {
    if (currentIndex < listData.items.length - 1) {
      setSelectedId(listData.items[currentIndex + 1]?.id);
    } else if (currentIndex > 0) {
      setSelectedId(listData.items[currentIndex - 1]?.id);
    } else {
      setSelectedId(null);
    }
  }, 100);
}, [listData, selectedId, refetchList]);
```

### 3.4 Checklist Phase 3

- [ ] Implémenter quick approve
- [ ] Implémenter reject avec modal raison
- [ ] Auto-navigation vers item suivant
- [ ] Raccourcis clavier (A = approve, R = reject)
- [ ] Toast notifications (succès/erreur)
- [ ] Gestion erreurs réseau

---

## Phase 4 : Traductions

### 4.1 Clés à ajouter (es.json)

```json
{
  "agent": {
    "pending": {
      "title": "Dossiers Pendientes",
      "subtitle": "{count} dossiers a procesar",
      "search": "Buscar por referencia o nombre...",
      "filters": {
        "priority": "Prioridad",
        "type": "Tipo",
        "all": "Todos"
      },
      "list": {
        "empty": "No hay dossiers pendientes",
        "slaWarning": "SLA en riesgo",
        "slaBreached": "SLA vencido"
      },
      "preview": {
        "requestInfo": "Datos de la Solicitud",
        "extractedData": "Datos Extraídos",
        "documents": "Documentos",
        "viewAllDocs": "Ver todos",
        "contact": "Contacto",
        "appointment": "Cita Programada",
        "actions": "Acciones",
        "approve": "Aprobar",
        "reject": "Rechazar",
        "viewDetail": "Ver detalle completo",
        "approving": "Aprobando...",
        "rejecting": "Rechazando...",
        "rejectReason": "Motivo del rechazo",
        "rejectReasonPlaceholder": "Indique el motivo del rechazo...",
        "rejectReasonRequired": "El motivo es obligatorio",
        "confirmReject": "Confirmar rechazo",
        "cancelReject": "Cancelar",
        "approveSuccess": "Solicitud aprobada",
        "rejectSuccess": "Solicitud rechazada",
        "selectRequest": "Seleccione una solicitud para ver el aperçu"
      },
      "extractedFields": {
        "apellidos": "Apellidos",
        "nombres": "Nombres",
        "fechaNacimiento": "Fecha de Nacimiento",
        "sexo": "Sexo",
        "lugarNacimiento": "Lugar de Nacimiento",
        "numeroDip": "N° DIP",
        "pasaporteAntiguo": "N° Pasaporte Antiguo",
        "domicilio": "Domicilio"
      }
    }
  }
}
```

### 4.2 Checklist Phase 4

- [ ] Ajouter clés es.json
- [ ] Ajouter clés fr.json
- [ ] Ajouter clés en.json
- [ ] Vérifier toutes les clés utilisées

---

## Phase 5 : Tests & Optimisation

### 5.1 Performance

| Métrique | Cible |
|----------|-------|
| Temps chargement liste | < 500ms |
| Temps chargement aperçu | < 300ms |
| Temps action approve/reject | < 1s |

### 5.2 Tests à effectuer

- [ ] Charger page avec 0 dossiers (empty state)
- [ ] Charger page avec 50+ dossiers
- [ ] Navigation clavier ↑↓
- [ ] Approve rapide
- [ ] Reject avec raison
- [ ] Auto-navigation après action
- [ ] Filtres (priorité, type)
- [ ] Recherche
- [ ] Pagination
- [ ] Preview documents (clic miniature)
- [ ] Lien vers page détail
- [ ] Mobile responsive (optionnel)

---

## Résumé Phases

| Phase | Description | Durée estimée |
|-------|-------------|---------------|
| **Phase 1** | Backend - Endpoint preview | - |
| **Phase 2** | Frontend - Composants split view | - |
| **Phase 3** | Intégration actions | - |
| **Phase 4** | Traductions | - |
| **Phase 5** | Tests & optimisation | - |

---

## Fichiers à créer/modifier

### Backend
- `packages/backend/app/modules/service_requests/api/agent_routes.py` (modifier)

### Frontend
- `packages/web/src/modules/agent-dashboard/components/pending/PendingPage.tsx` (créer)
- `packages/web/src/modules/agent-dashboard/components/pending/RequestList.tsx` (créer)
- `packages/web/src/modules/agent-dashboard/components/pending/RequestListItem.tsx` (créer)
- `packages/web/src/modules/agent-dashboard/components/pending/RequestPreview.tsx` (créer)
- `packages/web/src/modules/agent-dashboard/components/pending/PreviewSkeleton.tsx` (créer)
- `packages/web/src/modules/agent-dashboard/components/pending/sections/*.tsx` (créer 6 fichiers)
- `packages/web/src/modules/agent-dashboard/components/pending/hooks/*.ts` (créer 2 fichiers)
- `packages/web/src/modules/agent-dashboard/services/agent-requests-api.ts` (modifier - ajouter getPreview)
- `packages/web/messages/es.json` (modifier)
- `packages/web/messages/fr.json` (modifier)
- `packages/web/messages/en.json` (modifier)

---

## Notes Techniques

1. **Optimisation query**: Utiliser une seule query avec JOINs pour l'aperçu
2. **Cache**: React Query avec staleTime de 30s pour la liste
3. **Prefetch**: Prefetch l'aperçu du prochain item pendant review
4. **Debounce**: Debounce 300ms sur la recherche
5. **Virtualisation**: Si > 100 items visibles, considérer react-window
