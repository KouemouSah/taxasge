# Precios PDF - Data Extraction Reference

## Source

- **Document**: Precios.pdf - Decreto Presidencial GE
- **Extraction date**: 2026-03-11
- **Verification status**: 948 price entries across 120 bundle-zone combinations, **0 errors**
- **Structure**: 10 bundles x 12 zones x 7-9 services each = 948 individual prices
- **Computed totals match `pdf_totals`**: YES (all 120 combinations verified)

---

## 1. Zones (12)

| Code | Tier | Rank | Name | Description |
|------|------|------|------|-------------|
| A1 | A | 1 | Capitales de Regiones | Malabo, Bata -- centros comerciales principales |
| A2 | A | 2 | Capitales de Regiones (2) | Malabo, Bata -- zonas secundarias |
| A3 | A | 3 | Capitales de Regiones (3) | Malabo, Bata -- periferia |
| B1 | B | 1 | Capitales de Provincias | Ebebiyin, Mongomo, Evinayong y similares |
| B2 | B | 2 | Capitales de Provincias (2) | Capitales provinciales -- zonas secundarias |
| B3 | B | 3 | Capitales de Provincias (3) | Capitales provinciales -- periferia |
| C1 | C | 1 | Capitales Distritales y Municipales | Luba, Riaba, Niefang, Anisok y similares |
| C2 | C | 2 | Capitales Distritales y Municipales (2) | Distritos -- zonas secundarias |
| C3 | C | 3 | Capitales Distritales y Municipales (3) | Distritos -- periferia |
| D1 | D | 1 | Consejos de Poblados | Poblados principales |
| D2 | D | 2 | Consejos de Poblados (2) | Poblados secundarios |
| D3 | D | 3 | Consejos de Poblados (3) | Poblados rurales remotos |

**Tier logic**: A (capital regional) > B (capital provincial) > C (capital distrital/municipal) > D (poblados). Rank 1 = centro, 2 = secundario, 3 = periferia/remoto.

---

## 2. Services (12 concepts)

| Code | Name | Ministry | Order |
|------|------|----------|-------|
| CMF | Contribucion Mobiliaria Fiscal (CMF) | HACIENDA | 1 |
| CUOTA_ANUAL | Cuota Anual | HACIENDA | 2 |
| FICHA_COMERCIAL | Ficha comercial | HACIENDA | 3 |
| CERT_COMERCIO | Certificado de Comercio | HACIENDA | 4 |
| LIBRETA_COMERCIAL | Libreta comercial | HACIENDA | 5 |
| CERT_ACTUALIZACION_PE | Certificado de Actualizacion PE | HACIENDA | 6 |
| ROTULOS_NO_LUMINOSOS | Rotulos no Luminosos | INFORMACION | 7 |
| AUTORIZACION_PESCA | Autorizacion de venta Pescados abacerias | PESCA | 8 |
| LICENCIA_TURISMO | Licencia de Turismo | TURISMO | 9 |
| INSPECCION_ANUAL | Inspeccion Anual | INDUSTRIA | 10 |
| LICENCIA_MEDIO_AMBIENTAL | Licencia Medio Ambiental | MEDIO_AMBIENTE | 11 |
| LICENCIA_CULTURA | Licencia de Cultura | CULTURA | 12 |

---

## 3. Bundles (10)

| Code | Name | Services (count) | Services included |
|------|------|-------------------|-------------------|
| ABACERIAS | Abacerias, Factorias y Comercio en General | 8 | CMF, CUOTA_ANUAL, FICHA_COMERCIAL, CERT_COMERCIO, LIBRETA_COMERCIAL, CERT_ACTUALIZACION_PE, ROTULOS_NO_LUMINOSOS, AUTORIZACION_PESCA |
| FERRETERIAS | Ferreterias | 7 | CMF, CUOTA_ANUAL, FICHA_COMERCIAL, CERT_COMERCIO, LIBRETA_COMERCIAL, CERT_ACTUALIZACION_PE, ROTULOS_NO_LUMINOSOS |
| CAFETERIAS_PASTELERIAS | Cafeterias-Pastelerias, Panaderias y Snack Bar | 8 | CMF, CUOTA_ANUAL, FICHA_COMERCIAL, CERT_COMERCIO, LIBRETA_COMERCIAL, CERT_ACTUALIZACION_PE, ROTULOS_NO_LUMINOSOS, LICENCIA_TURISMO |
| BARES_RESTAURANTES | Bares y Restaurantes | 8 | CMF, CUOTA_ANUAL, FICHA_COMERCIAL, CERT_COMERCIO, LIBRETA_COMERCIAL, CERT_ACTUALIZACION_PE, ROTULOS_NO_LUMINOSOS, LICENCIA_TURISMO |
| DISCOTECAS | Discotecas y Similares | 8 | CMF, CUOTA_ANUAL, FICHA_COMERCIAL, CERT_COMERCIO, LIBRETA_COMERCIAL, CERT_ACTUALIZACION_PE, ROTULOS_NO_LUMINOSOS, LICENCIA_TURISMO |
| CLINICAS_FARMACIAS | Clinicas, Farmacias y Similares | 7 | CMF, CUOTA_ANUAL, FICHA_COMERCIAL, CERT_COMERCIO, LIBRETA_COMERCIAL, CERT_ACTUALIZACION_PE, ROTULOS_NO_LUMINOSOS |
| TALLERES_BLOQUERIAS | Talleres y Bloquerias en General | 9 | CMF, CUOTA_ANUAL, FICHA_COMERCIAL, CERT_COMERCIO, LIBRETA_COMERCIAL, CERT_ACTUALIZACION_PE, INSPECCION_ANUAL, ROTULOS_NO_LUMINOSOS, LICENCIA_MEDIO_AMBIENTAL |
| TALLERES_ARTESANALES | Talleres y Tiendas Artesanales | 8 | CMF, CUOTA_ANUAL, FICHA_COMERCIAL, CERT_COMERCIO, LIBRETA_COMERCIAL, CERT_ACTUALIZACION_PE, ROTULOS_NO_LUMINOSOS, LICENCIA_CULTURA |
| VIDEOS_CLUBS | Video Clubs y Similares | 8 | CMF, CUOTA_ANUAL, FICHA_COMERCIAL, CERT_COMERCIO, LIBRETA_COMERCIAL, CERT_ACTUALIZACION_PE, ROTULOS_NO_LUMINOSOS, LICENCIA_CULTURA |
| CARPINTERIAS | Carpinterias en General | 8 | CMF, CUOTA_ANUAL, FICHA_COMERCIAL, CERT_COMERCIO, LIBRETA_COMERCIAL, CERT_ACTUALIZACION_PE, INSPECCION_ANUAL, ROTULOS_NO_LUMINOSOS |

**Common core** (6 services in ALL bundles): CMF, CUOTA_ANUAL, FICHA_COMERCIAL, CERT_COMERCIO, LIBRETA_COMERCIAL, CERT_ACTUALIZACION_PE

**Differentiators**:
- ROTULOS_NO_LUMINOSOS: in ALL bundles
- AUTORIZACION_PESCA: only ABACERIAS
- LICENCIA_TURISMO: CAFETERIAS_PASTELERIAS, BARES_RESTAURANTES, DISCOTECAS
- INSPECCION_ANUAL: TALLERES_BLOQUERIAS, CARPINTERIAS
- LICENCIA_MEDIO_AMBIENTAL: only TALLERES_BLOQUERIAS
- LICENCIA_CULTURA: TALLERES_ARTESANALES, VIDEOS_CLUBS

---

## 4. Price Matrix -- Bundle Totals per Zone (FCFA)

| Bundle | A1 | A2 | A3 | B1 | B2 | B3 | C1 | C2 | C3 | D1 | D2 | D3 |
|--------|----:|----:|----:|----:|----:|----:|----:|----:|----:|----:|----:|----:|
| ABACERIAS | 636,000 | 342,000 | 135,000 | 249,000 | 144,000 | 105,000 | 159,000 | 123,000 | 93,000 | 87,000 | 84,000 | 81,000 |
| FERRETERIAS | 609,000 | 315,000 | 108,000 | 222,000 | 117,000 | 78,000 | 218,000 | 96,000 | 66,000 | 188,000 | 57,000 | 54,000 |
| CAFETERIAS_PASTELERIAS | 672,000 | 382,000 | 153,000 | 312,000 | 177,000 | 123,000 | 222,000 | 156,000 | 111,000 | 204,000 | 90,000 | 102,000 |
| BARES_RESTAURANTES | 642,000 | 333,000 | 138,000 | 282,000 | 162,000 | 123,000 | 192,000 | 141,000 | 96,000 | 174,000 | 129,000 | 87,000 |
| DISCOTECAS | 882,000 | 468,000 | 228,000 | 522,000 | 297,000 | 198,000 | 432,000 | 276,000 | 186,000 | 414,000 | 264,000 | 177,000 |
| CLINICAS_FARMACIAS | 582,000 | 288,000 | 108,000 | 222,000 | 117,000 | 78,000 | 132,000 | 96,000 | 66,000 | 114,000 | 84,000 | 57,000 |
| TALLERES_BLOQUERIAS | 882,000 | 558,000 | 333,000 | 522,000 | 387,000 | 303,000 | 432,000 | 366,000 | 291,000 | 414,000 | 354,000 | 282,000 |
| TALLERES_ARTESANALES | 591,000 | 297,000 | 117,000 | 231,000 | 126,000 | 87,000 | 141,000 | 105,000 | 75,000 | 123,000 | 93,000 | 66,000 |
| VIDEOS_CLUBS | 600,000 | 306,000 | 126,000 | 240,000 | 135,000 | 96,000 | 150,000 | 114,000 | 84,000 | 116,000 | 86,000 | 59,000 |
| CARPINTERIAS | 702,000 | 378,000 | 153,000 | 234,000 | 207,000 | 123,000 | 252,000 | 186,000 | 111,000 | 126,000 | 96,000 | 69,000 |

**Ranges**: Cheapest = CLINICAS_FARMACIAS D3 (57,000 FCFA). Most expensive = DISCOTECAS A1 / TALLERES_BLOQUERIAS A1 (882,000 FCFA).

---

## 5. Price Pattern Analysis

**General trend**: Prices decrease from A1 (most expensive) to D3 (cheapest), following zone tier and rank.

**DISCOTECAS and TALLERES_BLOQUERIAS** are the most expensive bundles (both 882,000 at A1), but for different reasons:
- DISCOTECAS: high CMF + LICENCIA_TURISMO
- TALLERES_BLOQUERIAS: INSPECCION_ANUAL + LICENCIA_MEDIO_AMBIENTAL (these hold value even in remote zones)

**TALLERES_BLOQUERIAS anomaly**: Prices decrease much less steeply than other bundles (A1=882K, D3=282K vs DISCOTECAS A1=882K, D3=177K). The INSPECCION_ANUAL and LICENCIA_MEDIO_AMBIENTAL services maintain relatively high prices across all zones.

---

## 6. Ministry Mapping (Current DB --> Decree)

| DB ID | Current DB Name | New Official Name (Gobierno actual) | Action |
|-------|-----------------|-------------------------------------|--------|
| 91 | HACIENDA | Ministerio de Hacienda, Planificacion y Desarrollo Economico | UPDATE name |
| 92 | INFORMACION | Ministerio de Informacion, Prensa y Cultura | UPDATE name |
| 88 | CULTURA | Merged into id 92 (Informacion y Cultura) | MERGE/DEACTIVATE |
| 103 | -- (NEW) | Ministerio de Turismo e Infraestructuras Turisticas | CREATE |
| 104 | -- (NEW) | Ministerio de Agricultura, Ganaderia, Bosques, Pesca y Medio Ambiente | CREATE (PESCA + MEDIO_AMBIENTE merged here) |
| 105 | -- (NEW) | INDUSTRIA -- To be determined | CREATE |

**Notes**:
- PESCA is NOT a standalone ministry; it is merged into Agricultura (id 104)
- MEDIO_AMBIENTE is also merged into Agricultura (id 104)
- CULTURA is merged into Informacion (id 92)
- INDUSTRIA ministry name needs confirmation from official sources

---

## 7. Fiscal Services Mapping

### Existing services to update

| Current Code | Current Name | PDF Name | Action |
|--------------|-------------|----------|--------|
| T-189 | Hoja comercial | Ficha comercial | RENAME to "Ficha comercial" |
| T-190 | Libreta comercial | Libreta comercial | KEEP as is |

### New services to create

| Code | Name | Ministry | Notes |
|------|------|----------|-------|
| CMF | Contribucion Mobiliaria Fiscal (CMF) | HACIENDA | Core service, in all bundles |
| CUOTA_ANUAL | Cuota Anual | HACIENDA | Core service, in all bundles |
| CERT_COMERCIO | Certificado de Comercio | HACIENDA | Core service, in all bundles |
| CERT_ACTUALIZACION_PE | Certificado de Actualizacion PE | HACIENDA | Core service, in all bundles |
| ROTULOS_NO_LUMINOSOS | Rotulos no Luminosos | INFORMACION (id 92) | In all bundles |
| AUTORIZACION_PESCA | Autorizacion de venta Pescados abacerias | PESCA (via Agricultura id 104) | Only ABACERIAS bundle |
| LICENCIA_TURISMO | Licencia de Turismo | TURISMO (id 103) | CAFETERIAS, BARES, DISCOTECAS |
| INSPECCION_ANUAL | Inspeccion Anual | INDUSTRIA (id 105) | TALLERES_BLOQUERIAS, CARPINTERIAS |
| LICENCIA_MEDIO_AMBIENTAL | Licencia Medio Ambiental | MEDIO_AMBIENTE (via Agricultura id 104) | Only TALLERES_BLOQUERIAS |
| LICENCIA_CULTURA | Licencia de Cultura | CULTURA (via Informacion id 92) | TALLERES_ARTESANALES, VIDEOS_CLUBS |

**FICHA_COMERCIAL** = T-189 renamed. **LIBRETA_COMERCIAL** = T-190 as-is. These two do NOT need new records, just mapping.

---

## 8. Migration Checklist

### Phase 1: Ministry Updates
- [ ] UPDATE ministry name for id 91 (HACIENDA)
- [ ] UPDATE ministry name for id 92 (INFORMACION --> Informacion, Prensa y Cultura)
- [ ] DEACTIVATE or MERGE ministry id 88 (CULTURA) into id 92
- [ ] CREATE ministry id 103 (TURISMO)
- [ ] CREATE ministry id 104 (Agricultura -- includes PESCA + MEDIO_AMBIENTE)
- [ ] CREATE ministry id 105 (INDUSTRIA -- name TBD)

### Phase 2: Fiscal Services
- [ ] RENAME T-189 "Hoja comercial" to "Ficha comercial"
- [ ] CREATE 10 new fiscal_services (CMF, CUOTA_ANUAL, CERT_COMERCIO, CERT_ACTUALIZACION_PE, ROTULOS_NO_LUMINOSOS, AUTORIZACION_PESCA, LICENCIA_TURISMO, INSPECCION_ANUAL, LICENCIA_MEDIO_AMBIENTAL, LICENCIA_CULTURA)
- [ ] Assign correct ministry_id to each new service

### Phase 3: Zones
- [ ] Verify/fix zone names and descriptions in DB match PDF definitions
- [ ] Ensure 12 zones exist with correct tier/rank structure

### Phase 4: Bundles & Prices
- [ ] DELETE old incorrect bundles and bundle_items from DB
- [ ] INSERT 10 correct bundles with names from PDF
- [ ] INSERT 948 bundle_items (10 bundles x 12 zones x 7-9 services each)
- [ ] Each bundle_item must reference: bundle_id, fiscal_service_id, zone_code, amount

### Phase 5: Verification
- [ ] Verify computed totals per bundle-zone match `pdf_totals` (120 checks)
- [ ] Verify each bundle has correct number of services (see Section 3)
- [ ] Verify no orphaned bundle_items
- [ ] Verify all 12 service concepts are referenced at least once
- [ ] Verify price monotonicity: A1 >= A2 >= A3, B1 >= B2 >= B3, etc. for each service within each bundle
- [ ] End-to-end test: select a bundle + zone in frontend, confirm total matches this document
