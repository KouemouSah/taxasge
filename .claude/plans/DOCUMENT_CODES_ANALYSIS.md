# Analyse des Document Codes — TaxasGE

**Date** : 2026-04-05
**Usage** : Reference pour DOCUMENT_CATEGORY_MAP et workflow_document_requirements

---

## 101 Document Codes identifies

### Identity (14)
dip, pasaporte, pasaporte_antiguo, pasaporte_danado, pasaporte_entrada, pasaporte_international, permiso_residencia, certificado_nacimiento, certificacion_nacimiento, declaracion_nacimiento, carnet_funcionario, nombramiento, cedula_personal, carnet_empadronamiento

### Vehicle (7)
itv, itv_antigua, cuve, cuve_antigua, permiso_circulacion, certificado_registro_vue, certificado_reconocimiento_vehiculo

### Legal (7)
contrato, contrato_compraventa, contrato_onrc, escritura_constitucion, poder_notarial, autorizacion_parental, autorizacion_gubernativa

### Financial (6)
certificado_nif, solvencia_tributaria, nota_ingreso, nota_ingreso_dgi, nota_ingreso_residencia, atestacion_bancaria

### Business (8)
certificado_padron, licencia_comercio, licencia_comercio_municipal, certificado_actualizacion_empresarial, certificado_conciso_mercantil, certificado_registro_comercio, certificado_registro_empresarial, certificado_registro_onrc

### Administrative (8)
instancia_solicitud, oficio_destino, toma_posesion, certificado_administrativo, permiso_extraordinario, promocion_administrativa, certificado_servicios, certificado_reforma

### Employment (5)
contrato_trabajo, contrato_funcionario, permiso_trabajo, nomina_reciente, nif_autorizacion

### Driving/License (5)
certificado_conducir, licencia_conducir, permiso_conducir, permiso_actual, certificado_medico_conducir

### Police/Legal (5)
denuncia_policial, denuncia, antecedentes_penales, certificado_buena_conducta, extrait_casier_judiciaire_international

### Medical (2)
certificado_medico, certificado_medico_conducir

### Education (3)
titulo_academico, matricula_estudios, calendario_estudios

### Photo (2)
photo_carnet, fotografias, foto_biometrica

### Travel/Visa (5)
visado, visado_entrada, sello_entrada, permanencia_previa, visa_control_financiero

### Other
certificado_conducta_policia, certificado_conducta_empresa, certificado_autenticidad, certificado_perdida, certificado_defuncion, certificado_actual, documento_familiar, documento_justificativo, documento_representante_1, documento_representante_2, identidad_propietario, identidad_representante, identidad_vendedor, factura, acta_adjudicacion, acuerdo_jv, cedula_poliza, ultima_resolucion, homologacion, residencia_anterior

---

## 13 Workflows avec leurs documents requis

### pasaporte_nuevo (6 docs : 3 always + 3 is_minor)
dip, acte_naissance, foto_biometrica, autorizacion_parental*, dip_padre*, dip_madre*

### pasaporte_renovacion (3 docs)
dip, pasaporte_anterior, foto_biometrica

### residencia (13 docs)
instancia_solicitud, fotografias, pasaporte_entrada, declaracion_jurada, autorizacion_reclutamiento, contrato_trabajo, nif_autorizacion, solvencia_tributaria, extracto_bancario, certificado_conducta_policia, certificado_conducta_empresa, certificado_medico, cedula_poliza

### residencia_renovacion (12 docs)
instancia_solicitud, fotografias, contrato_trabajo, nif_autorizacion, solvencia_tributaria, extracto_bancario, certificado_conducta_policia, certificado_conducta_empresa, certificado_medico, residencia_anterior, certificado_autenticidad, cedula_poliza

### carnet_funcionario (7 docs : 3 always + conditionals)
dip, nombramiento, foto_carnet, oficio_destino*, toma_posesion*, carnet_anterior*, certificado_perdida*

### certificado_conducir_nuevo (3 docs)
dip, certificado_medico, foto_carnet

### certificado_conducir_renovacion (3 docs)
dip, permiso_actual, certificado_medico

### transferencia_vehiculo (5 docs)
nota_ingreso, contrato_compraventa, dip_vendedor, dip_comprador, permiso_circulacion

### renovacion_vehiculo (5 docs)
nota_ingreso, dip_propietario, permiso_circulacion, cuve, tarjeta_itv

### contrato_onrc (4 docs)
contrato, dip_parte_a, dip_parte_b, nif_empresa

### certificado_administrativo (3 docs)
dip, solicitud, nombramiento

### permiso_extraordinario (3 docs)
dip, solicitud, justificativo

### promocion_administrativa (4 docs)
dip, carnet_funcionario, certificado_servicios, titulos_academicos

---

## 40 JSON Schemas (extraction Gemini)
antecedentes_penales_gq, atestacion_bancaria_gq, autorizacion_gubernativa_gq, autorizacion_parental_gq, carnet_funcionario_gq, certificacion_nacimiento_gq, certificado_actualizacion_empresarial_gq, certificado_buena_conducta_gq, certificado_conciso_mercantil_gq, certificado_conducir_gq, certificado_defuncion_gq, certificado_medico_gq, certificado_nacimiento_gq, certificado_nif_gq, certificado_padron_gq, certificado_reconocimiento_vehiculo_gq, certificado_registro_comercio_gq, certificado_registro_empresarial_gq, certificado_registro_vue_gq, contrato_compraventa_gq, contrato_funcionario_gq, contrato_onrc_gq, cuve_gq, declaracion_nacimiento_gq, dip_gq, escritura_constitucion_gq, extrait_casier_judiciaire_international, itv_gq, licencia_comercio_municipal_gq, nombramiento_gq, nota_ingreso_dgi_gq, nota_ingreso_residencia_gq, pasaporte_gq, pasaporte_international, permiso_circulacion_gq, permiso_residencia_gq, permiso_trabajo_gq, sello_entrada_gq, solvencia_tributaria_gq, visado_gq

*Asterisque = conditionnel (is_minor, is_new, is_renewal, is_duplicate)*
