# Matrice des Documents - Demande de Pasaporte GE

> **SOURCE DE VERITE** - Ce document definit les documents requis par type et motif de demande.
> **Derniere mise a jour** : 2026-02-05
> **Validation metier** : Utilisateur

## Legende

| Symbole | Signification |
|---------|---------------|
| X | Document requis |
| - | Document non requis |
| X* | Requis si `representante_unico = false` |

---

## Matrice complete (8 colonnes)

| Document | EXP Adulte | EXP Mineur | VENC Adulte | VENC Mineur | DET Adulte | DET Mineur | PERD/ROBO Adulte | PERD/ROBO Mineur |
|----------|------------|------------|-------------|-------------|------------|------------|------------------|------------------|
| DIP | X | - | X | - | X | - | X | - |
| Certif. Nacimiento | X | X | - | X | - | X | - | X |
| Photo | X | X | X | X | X | X | X | X |
| Autoriz. Parental | - | X | - | X | - | X | - | X |
| DIP Rep. 1 | - | X | - | X | - | X | - | X |
| DIP Rep. 2 | - | X* | - | X* | - | X* | - | X* |
| Pasaporte Antiguo | - | - | X | X | X | X | X | X |
| Denuncia Policial | - | - | - | - | - | - | X | X |

---

## Detail par type de demande

### 1. EXPEDICION (Primera vez)

| Document | Adulte | Mineur |
|----------|--------|--------|
| DIP | X | - |
| Certificado de Nacimiento | X | X |
| Photo | X | X |
| Autorizacion Parental | - | X |
| DIP Representante 1 | - | X |
| DIP Representante 2 | - | X* |
| Pasaporte Antiguo | - | - |
| Denuncia Policial | - | - |

### 2. RENOVACION - VENCIMIENTO

| Document | Adulte | Mineur |
|----------|--------|--------|
| DIP | X | - |
| Certificado de Nacimiento | - | X |
| Photo | X | X |
| Autorizacion Parental | - | X |
| DIP Representante 1 | - | X |
| DIP Representante 2 | - | X* |
| Pasaporte Antiguo | X | X |
| Denuncia Policial | - | - |

### 3. RENOVACION - DETERIORO

| Document | Adulte | Mineur |
|----------|--------|--------|
| DIP | X | - |
| Certificado de Nacimiento | - | X |
| Photo | X | X |
| Autorizacion Parental | - | X |
| DIP Representante 1 | - | X |
| DIP Representante 2 | - | X* |
| Pasaporte Antiguo (Danado) | X | X |
| Denuncia Policial | - | - |

### 4. RENOVACION - PERDIDA

| Document | Adulte | Mineur |
|----------|--------|--------|
| DIP | X | - |
| Certificado de Nacimiento | - | X |
| Photo | X | X |
| Autorizacion Parental | - | X |
| DIP Representante 1 | - | X |
| DIP Representante 2 | - | X* |
| Pasaporte Antiguo | X | X |
| Denuncia Policial | X | X |

### 5. RENOVACION - ROBO

| Document | Adulte | Mineur |
|----------|--------|--------|
| DIP | X | - |
| Certificado de Nacimiento | - | X |
| Photo | X | X |
| Autorizacion Parental | - | X |
| DIP Representante 1 | - | X |
| DIP Representante 2 | - | X* |
| Pasaporte Antiguo | X | X |
| Denuncia Policial | X | X |

---

## Logique metier

### Document d'identite principal
- **Adulte** : DIP (toujours requis)
- **Mineur** : Certificado de Nacimiento (remplace le DIP)

### Pasaporte Antiguo
- **EXPEDICION** : Non requis (premier passeport)
- **VENCIMIENTO, DETERIORO** : Requis (document physique a presenter)
- **PERDIDA, ROBO** : Requis (copie ou informations de l'ancien passeport)

### Denuncia Policial
- Requis UNIQUEMENT pour PERDIDA et ROBO
- Declaration officielle aupres de la police

### Representantes legaux (mineur)
- **DIP Representante 1** : Toujours requis pour mineur
- **DIP Representante 2** : Requis si `representante_unico = false` (deux tuteurs)

---

## Champs filiation par document source

### DIP (verso - bloc HIJO DE)

**Correction importante** : Le DIP GE contient bien les deux noms des parents.

```
Zone verso, bloc "HIJO DE" :
- Ligne 1 : Nom complet du PERE (ex: CELESTINO NZO MESI EYANG)
- Ligne 2 : Nom complet de la MERE (ex: FLORENTINA MISENG OSA OBONO)
```

**Champs extractibles du DIP :**
- `nombre_padre` : 1ere ligne sous HIJO DE
- `nombre_madre` : 2eme ligne sous HIJO DE

**Note** : Le schema `dip_gq.json` doit etre corrige pour ajouter `nombre_padre`.

### Certificado de Nacimiento

**Champs extractibles :**
- `padre.nombre_completo`, `padre.profesion`
- `madre.nombre_completo`, `madre.profesion`

---

## Corrections a appliquer au code

### 1. Schema DIP (`dip_gq.json`)

```json
"filiacion": {
  "fields": {
    "nombre_padre": {
      "type": "string",
      "required": false,
      "description": "Nombre completo del padre (1ra linea bloc HIJO DE, verso)",
      "source": "verso",
      "pii": true
    },
    "nombre_madre": {
      "type": "string",
      "required": false,
      "description": "Nombre completo de la madre (2da linea bloc HIJO DE, verso)",
      "source": "verso",
      "pii": true
    }
  }
}
```

### 2. Visual zones DIP

```json
"visual_zones": {
  "verso": [
    "Zone superieure gauche: Bloc HIJO DE - Nom pere (1ere ligne) + Nom mere (2eme ligne)",
    ...
  ]
}
```

### 3. Wizard frontend (`page.tsx`)

Conditionner l'affichage des champs filiation :
- `nombre_padre`, `profesion_padre` : Afficher si EXPEDICION ou isMinor
- `nombre_madre`, `profesion_madre` : Afficher si EXPEDICION ou isMinor

Pour RENOVACION adulte : Ces champs peuvent etre pre-remplis depuis le DIP (si OCR disponible).

### 4. Workflow backend (`pasaporte_workflow_v2.py`)

Ajouter condition sur section `filiacion` dans `form_review_2` :
```python
{
    "id": "filiacion",
    "title_es": "Filiacion",
    "condition": {"solicitud_type": "EXPEDICION"},  # Ou ajouter "|| is_minor"
    "fields": [...]
}
```

---

## Configuration workflow_document_requirements

| document_code | condition_type | condition_value |
|---------------|----------------|-----------------|
| `dip` | `IS_MINOR` | `false` |
| `certificado_nacimiento` | `CUSTOM` | `solicitud_type='EXPEDICION' OR is_minor=true` |
| `photo` | `ALWAYS` | - |
| `autorizacion_parental` | `IS_MINOR` | `true` |
| `dip_representante_1` | `IS_MINOR` | `true` |
| `dip_representante_2` | `CUSTOM` | `is_minor=true AND representante_unico=false` |
| `pasaporte_antiguo` | `CUSTOM` | `solicitud_type='RENOVACION'` |
| `denuncia_policial` | `CUSTOM` | `motivo IN ('PERDIDA','ROBO')` |
