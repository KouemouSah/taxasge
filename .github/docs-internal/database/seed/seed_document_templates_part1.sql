BEGIN;

-- ============================================
-- SEED DOCUMENT TEMPLATES - PART 1
-- Inserts: 1441
-- ============================================

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_1_______________', 'Documento original a legalizar, Documento de identidad del solicitante', NULL, 'identity', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_2_______________', 'Escrito notariado original, Documento de identidad del solicitante, Poder notarial si actúa en representación', NULL, 'identity', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_3_______________', 'Diploma o título original, Documento de identidad, Certificado de estudios', NULL, 'identity', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_4_______________', 'Documento mercantil original, Documento de identidad del solicitante', NULL, 'identity', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_5_______________', 'Documento de identidad, Fotografía', NULL, 'identity', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_6_______________', 'Pasaporte actual, Documento de identidad', NULL, 'identity', 12, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_7_______________', 'Documento de identidad, Justificación de necesidad', NULL, 'identity', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_8_______________', 'Documento original, Documento de identidad', NULL, 'identity', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_9_______________', 'Escrito notariado original, Documento de identidad, Poder notarial si aplica', NULL, 'identity', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_10______________', 'Documento mercantil original, Documento de identidad, Documentación comercial adicional', NULL, 'identity', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_11______________', 'Documento de identidad, Fotografía, Comprobante de pago', NULL, 'identity', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_12______________', 'Pasaporte actual, Documento de identidad, Fotografía', NULL, 'identity', 12, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_13______________', 'Documento de identidad, Comprobante de registro consular', NULL, 'identity', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_14______________', 'Documentación de la aeronave, Certificado de peso', NULL, 'certificate', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_15______________', 'Documentación de la aeronave, Certificado de peso detallado', NULL, 'certificate', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_16______________', 'Certificado de aeronave privada, Documentación de turismo', NULL, 'certificate', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_17______________', 'Certificado de aeronave, Documentación de helicóptero', NULL, 'certificate', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_18______________', 'Documento de registro, Certificado de peso', NULL, 'certificate', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_19______________', 'Documentación de propiedad, Identificación del propietario', NULL, 'property', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_20______________', 'Solicitud de matrícula temporal, Documentación provisional de aeronave, Comprobante de trámite', NULL, 'payment_proof', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_21______________', 'Certificado temporal vigente, Documentación actualizada de aeronave, Comprobante de pago', NULL, 'payment_proof', 12, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_22______________', 'Certificado original, Declaración de pérdida, Documento de identidad, Comprobante de pago', NULL, 'identity', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_23______________', 'Documento de transferencia, Certificado de matrícula actual, Documento de identidad del nuevo propietario, Contrato de compraventa', NULL, 'identity', 12, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_24______________', 'Documento de hipoteca, Certificado de matrícula, Documento de identidad, Comprobante de pago', NULL, 'identity', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_25______________', 'Documento original del registro, Documento de identidad, Comprobante de solicitud', NULL, 'identity', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_26______________', 'Certificado original de aeronavegabilidad, Documentación técnica de la aeronave, Historial de mantenimiento', NULL, 'certificate', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_27______________', 'Documentación especial de la aeronave, Informe técnico detallado, Justificación de condición especial', NULL, 'aircraft', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_28______________', 'Plan de vuelo detallado, Documentación de la aeronave, Certificados de seguridad', NULL, 'certificate', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_29______________', 'Contrato de locación original, Documentación de la aeronave, Identificación de las partes', NULL, 'aircraft', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_30______________', 'Documento legal original, Certificado de propiedad de aeronave, Tasación del valor', NULL, 'certificate', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_31______________', 'Certificado de aeronavegabilidad extranjero original, Documentación técnica completa, Historial de mantenimiento', NULL, 'certificate', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_32______________', 'Documentación técnica de instalación radioeléctrica, Certificado de calibración, Plano de instalación', NULL, 'certificate', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_33______________', 'Informe de niveles de ruido, Documentación técnica de la aeronave, Certificado de fabricante', NULL, 'certificate', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_34______________', 'Documentación técnica de la aeronave, Certificado de capacidades especiales, Plan de vuelo detallado', NULL, 'certificate', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_35______________', 'Plano de terreno, Documentación de propiedad, Certificado de uso de suelo', NULL, 'certificate', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_36______________', 'Plano de terreno, Documentación de propiedad, Certificado de zonificación', NULL, 'certificate', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_37______________', 'Plan de vuelo, Documentación de la aeronave, Certificado de operación', NULL, 'certificate', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_38______________', 'Plan de ruta, Documentación de la aeronave, Seguros de vuelo', NULL, 'aircraft', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_39______________', 'Planos topográficos, Documentación técnica, Informes previos', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_40______________', 'Documentación base, Información técnica, Certificados de referencia', NULL, 'certificate', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_41______________', 'Documentación específica, Certificados relacionados, Informes de respaldo', NULL, 'certificate', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_42______________', 'Boleto de entrada, Documento de identificación', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_43______________', 'Ticket de estacionamiento, Documento de identificación', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_44______________', 'Ticket de estacionamiento original, Comprobante de pago de primera hora', NULL, 'payment_proof', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_45______________', 'Ticket de estacionamiento diario, Documento de identificación', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_46______________', 'Documentación oficial de la aeronave, Certificado de no comercial, Autorización estatal', NULL, 'certificate', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_47______________', 'Documentación oficial gubernamental, Certificado de no comercial, Autorización de gobierno', NULL, 'certificate', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_48______________', 'Documentación oficial de servicios republicanos, Certificado de no comercial, Autorización oficial', NULL, 'certificate', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_49______________', 'Documentación oficial de aeronave militar/gubernamental, Certificado de país amigo, Autorización de vuelo no comercial', NULL, 'certificate', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_50______________', 'Documentación técnica del motor, Historial de mantenimiento, Certificado de fabricante', NULL, 'certificate', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_51______________', 'Documentación técnica de la hélice, Historial de mantenimiento, Certificado de fabricante', NULL, 'certificate', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_52______________', 'Documentación técnica de la aeronave, Historial de vuelo, Certificado de navegabilidad', NULL, 'certificate', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_53______________', 'Informe de reparación, Documentación técnica, Certificado de taller', NULL, 'certificate', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_54______________', 'Informe de alteración, Documentación técnica detallada, Certificado de modificación', NULL, 'certificate', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_55______________', 'Documentación de la empresa, Certificado de operador, Plan de explotación', NULL, 'certificate', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_56______________', 'Expediente completo, Documentación técnica, Certificados de categorización', NULL, 'certificate', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_57______________', 'Solicitud de inspección, Documentación operativa, Plan de operaciones', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_58______________', 'Solicitud de inspección detallada, Documentación operativa completa, Plan de operaciones extendido', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_59______________', 'Solicitud de inspección especial, Documentación histórica completa, Plan de operaciones retrospectivo', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_60______________', 'Licencia de operación extranjera, Certificados de la aeronave, Documentación de seguros', NULL, 'certificate', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_61______________', 'Documentación actualizada de transportador, Certificados renovados, Informes de operaciones', NULL, 'certificate', 12, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_62______________', 'Documentación histórica completa, Informes de seguridad, Registros de mantenimiento', NULL, 'property', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_63______________', 'Solicitud de licencia, Documentación de la empresa, Plan de operaciones', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_64______________', 'Documentación actualizada, Informes de desempeño, Modificaciones al plan de operaciones', NULL, 'general', 12, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_65______________', 'Documentación histórica completa, Informes de auditoría, Evaluación de cumplimiento integral', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_66______________', 'Solicitud de certificado, Documentación de flota, Plan de operaciones de pasajeros', NULL, 'certificate', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_67______________', 'Documentación actualizada, Informes de desempeño, Modificaciones a operaciones de pasajeros', NULL, 'general', 12, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_68______________', 'Documentación histórica completa, Informes de seguridad, Evaluación integral de operaciones de pasajeros', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_69______________', 'Solicitud de certificado de carga, Documentación de flota de carga, Plan de operaciones de carga', NULL, 'certificate', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_70______________', 'Documentación actualizada de operaciones de carga, Informes de desempeño, Modificaciones a flota de carga', NULL, 'general', 12, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_71______________', 'Documentación histórica completa de operaciones de carga, Informes de seguridad, Evaluación integral de transporte de carga', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_72______________', 'Solicitud de autorización, Documentación de aeronaves de aviación general, Plan de operaciones', NULL, 'authorization', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_73______________', 'Documentación actualizada de aviación general, Informes de desempeño, Modificaciones a operaciones', NULL, 'general', 12, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_74______________', 'Documentación histórica completa de aviación general, Informes de seguridad, Evaluación integral de operaciones', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_75______________', 'Propuesta de especificaciones, Documentación técnica de aeronaves, Plan operativo detallado', NULL, 'aircraft', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_76______________', 'Documentación actualizada, Informes de desempeño operativo, Modificaciones propuestas', NULL, 'general', 12, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_77______________', 'Documentación histórica completa, Informes de seguridad, Evaluación integral de operaciones', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_78______________', 'Solicitud de modificación, Documentación actualizada de aeronaves, Justificación de cambios', NULL, 'aircraft', 12, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_79______________', 'Documentación adicional, Informes de desempeño, Propuestas de mejora', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_80______________', 'Documentación histórica completa, Informes de seguridad, Evaluación integral de modificaciones', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_81______________', 'Estatutos del aeroclub, Programas de formación, Certificación de instructores, Instalaciones', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_82______________', 'Plan de estudios profesional, Certificaciones de instructores, Documentación de instalaciones, Acreditaciones', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_83______________', 'Documentación técnica de servicios, Certificaciones de sistemas, Plan de control de tráfico aéreo', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_84______________', 'Documentación de control de área terminal, Sistemas de gestión de tráfico, Certificaciones especializadas', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_85______________', 'Planos del aeródromo, Certificaciones de infraestructura, Documentación técnica', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_86______________', 'Estudio topográfico, Evaluación de terreno, Documentación de propiedad', NULL, 'property', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_87______________', 'Documentación técnica completa, Certificaciones de cumplimiento, Informes de seguridad', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_88______________', 'Documentación de requisitos AR 5,7, Informes técnicos, Certificaciones de cumplimiento', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_89______________', 'Documentación de peso, Certificado de aeronave, Informes técnicos de peso', NULL, 'certificate', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_90______________', 'Documentación de peso detallada, Certificado de aeronave, Informes técnicos de rango de peso', NULL, 'certificate', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_91______________', 'Documentación de peso compleja, Certificado de aeronave de gran tonelaje, Informes técnicos especializados', NULL, 'certificate', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_92______________', 'Documentación de peso exhaustiva, Certificado de aeronave de gran envergadura, Informes técnicos integrales', NULL, 'certificate', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_93______________', 'Documentación de peso ultra-detallada, Certificado de aeronave de máxima envergadura, Informes técnicos avanzados', NULL, 'certificate', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_94______________', 'Documentación de peso de máxima complejidad, Certificado de aeronave de dimensiones excepcionales, Informes técnicos especializados de alto nivel', NULL, 'certificate', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_95______________', 'Historial de mantenimiento, Registro de inspecciones previas, Documentación técnica actualizada', NULL, 'property', 12, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_96______________', 'Certificación profesional, Documentación de identidad, Certificado médico, Comprobante de formación', NULL, 'identity', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_97______________', 'Certificación técnica, Documentación de identidad, Certificado médico, Comprobante de formación especializada', NULL, 'identity', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_98______________', 'Certificación de competencia, Documentación de identidad, Certificado médico, Comprobante de formación especializada', NULL, 'identity', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_99______________', 'Licencia de controlador vigente, Documentación de especialización, Certificado de entrenamiento adicional', NULL, 'certificate', 12, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_100_____________', 'Documentación profesional específica, Certificaciones relacionadas, Comprobante de formación', NULL, 'payment_proof', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_101_____________', 'Comprobante de inscripción, Documento de identidad, Fotografía', NULL, 'identity', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_102_____________', 'Documentación de la aeronave extranjera, Certificado de peso, Permiso de operación internacional', NULL, 'certificate', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_103_____________', 'Contrato de base operacional, Documentación de la aeronave, Certificado de peso', NULL, 'certificate', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_104_____________', 'Documentación de aeronave nacional, Certificado de peso, Registro de operaciones', NULL, 'certificate', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_105_____________', 'Boleto de vuelo, Documento de identidad', NULL, 'identity', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_106_____________', 'Boleto de vuelo internacional, Pasaporte, Documentos de viaje', NULL, 'identity', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_107_____________', 'Boleto de vuelo internacional, Pasaporte, Visado', NULL, 'identity', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_108_____________', 'Comprobante de combustible, Registro de vuelo, Documentación de la aeronave', NULL, 'payment_proof', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_109_____________', 'Comprobante de combustible internacional, Registro de vuelo internacional, Documentación de la aeronave', NULL, 'payment_proof', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_110_____________', 'Plan de vuelo, Certificado de aeronave, Autorización de aterrizaje', NULL, 'certificate', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_111_____________', 'Plan de vuelo, Documentación de aeronave local', NULL, 'aircraft', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_112_____________', 'Plan de vuelo detallado, Certificado de aeronave, Autorización de vuelo', NULL, 'certificate', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_113_____________', 'Plan de vuelo local, Documentación de aeronave regional', NULL, 'aircraft', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_114_____________', 'Documentación de aeronave, Categoría de operación, Certificados de registro', NULL, 'certificate', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_115_____________', 'Licencia de piloto, Documentación de experiencia de vuelo, Certificado médico', NULL, 'certificate', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_116_____________', 'Certificación profesional, Documentación de formación, Certificado médico', NULL, 'certificate', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_117_____________', 'Licencia extranjera original, Certificación de origen, Documentación de experiencia', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_118_____________', 'Licencia de piloto vigente, Certificación de experiencia instructiva, Documentación de formación pedagógica', NULL, 'general', 12, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_119_____________', 'Tarjeta de alumno vigente, Comprobante de inscripción actual, Documento de identidad', NULL, 'identity', 12, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_120_____________', 'Licencia vigente, Certificación de actividad reciente, Certificado médico actualizado', NULL, 'certificate', 12, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_121_____________', 'Licencia base, Documentación de especialización, Certificado de entrenamiento específico', NULL, 'certificate', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_122_____________', 'Licencia original, Documentación de habilitaciones adicionales, Certificados complementarios', NULL, 'certificate', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_123_____________', 'Boleto de vuelo nacional, Documento de identidad', NULL, 'identity', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_124_____________', 'Boleto de vuelo CEMAC, Pasaporte, Documentos de viaje regional', NULL, 'identity', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_125_____________', 'Factura de flete, Manifiesto de carga, Documentación de equipaje', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_126_____________', 'Plan de vuelo, Autorización de operación, Documentación de aeronave', NULL, 'authorization', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_127_____________', 'Comprobante de extensión inicial, Plan de vuelo actualizado, Autorización adicional', NULL, 'payment_proof', 12, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_128_____________', 'Solicitud de uso de pasarela, Información de vuelo, Documentación de aeronave', NULL, 'aircraft', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_129_____________', 'Extensión de uso de pasarela, Justificación de demora, Información adicional de vuelo', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_130_____________', 'Justificación de uso prolongado, Información detallada de vuelo, Autorización especial', NULL, 'authorization', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_131_____________', 'Certificado de peso de aeronave, Documentación técnica detallada, Especificaciones de aeronave de gran tonelaje', NULL, 'certificate', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_132_____________', 'Solicitud de uso de instalaciones especiales, Plan de vuelo detallado, Documentación de aeronave de gran envergadura', NULL, 'aircraft', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_133_____________', 'Extensión de uso de instalaciones, Justificación de demora, Información adicional de vuelo', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_134_____________', 'Plan de vuelo nacional, Documentación de la aeronave, Autorización de vuelo', NULL, 'authorization', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_135_____________', 'Plan de vuelo regional, Documentación de la aeronave, Autorización de vuelo internacional', NULL, 'authorization', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_136_____________', 'Plan de vuelo internacional, Documentación completa de la aeronave, Permisos de sobrevuelo', NULL, 'aircraft', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_137_____________', 'Solicitud de servicio, Documentación de la aeronave, Detalles de operación', NULL, 'aircraft', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_138_____________', 'Comprobante de venta, Certificado de calidad de combustible, Registro de suministro', NULL, 'payment_proof', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_139_____________', 'Boleto de vuelo, Documento de identidad, Pasaporte', NULL, 'identity', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_140_____________', 'Plan de vuelo internacional, Autorización de vuelo charter, Documentación de combustible', NULL, 'authorization', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_141_____________', 'Manifiesto de carga, Documentación de origen nacional, Certificado de peso', NULL, 'certificate', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_142_____________', 'Manifiesto de carga, Documentación de origen CEMAC, Certificado de peso', NULL, 'certificate', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_143_____________', 'Manifiesto de carga internacional, Documentación de origen, Certificado de peso', NULL, 'certificate', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_144_____________', 'Boleto de vuelo nacional, Documentación de equipaje, Tarjeta de embarque', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_145_____________', 'Boleto de vuelo internacional, Documentación de equipaje, Tarjeta de embarque internacional', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_146_____________', 'Certificado de peso, Documentación de la aeronave, Plan de vuelo internacional', NULL, 'certificate', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_147_____________', 'Certificado de aeronavegabilidad, Manual de operaciones, Certificación de peso y balance actualizada', NULL, 'certificate', 12, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_148_____________', 'Certificado de aeronavegabilidad especial, Manual de operaciones extendido, Certificación de peso y balance reforzada', NULL, 'certificate', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_149_____________', 'Certificado de aeronavegabilidad estándar, Manual básico de operaciones, Certificación de peso y balance', NULL, 'certificate', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_150_____________', 'Certificado de aeronavegabilidad intermedio, Manual de operaciones completo, Certificación de peso y balance detallada', NULL, 'certificate', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_151_____________', 'Certificado de aeronavegabilidad avanzado, Manual de operaciones extenso, Certificación de peso y balance completa', NULL, 'certificate', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_152_____________', 'Registro mercantil, licencia de actividad comercial, certificado fiscal', NULL, 'certificate', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_153_____________', 'Licencia municipal, registro comercial, certificado de seguridad', NULL, 'certificate', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_154_____________', 'Documento de identidad, certificado de residencia, permiso municipal', NULL, 'identity', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_155_____________', 'Registro mercantil, certificación bancaria, declaración de actividades comerciales', NULL, 'property', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_156_____________', 'Formulario de registro de precios, justificación de costos', NULL, 'property', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_157_____________', 'Factura comercial, lista de empaque, certificado de origen', NULL, 'certificate', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_158_____________', 'Certificado sanitario, certificado veterinario, licencia de manipulación', NULL, 'certificate', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_159_____________', 'Certificado de autenticidad, valoración artística, permiso cultural', NULL, 'certificate', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_160_____________', 'Solicitud de cambio, documentación actual, justificación del cambio', NULL, 'general', 12, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_161_____________', 'Acta de modificación, registro mercantil actualizado, certificación fiscal', NULL, 'property', 12, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_162_____________', 'Solicitud de cambio, licencia actual, justificación del cambio', NULL, 'general', 12, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_163_____________', 'Credenciales profesionales, plan de actividad, documentación de identidad', NULL, 'identity', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_164_____________', 'Documentos de transporte, declaración aduanera, certificado de origen', NULL, 'certificate', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_165_____________', 'Acta de decomiso, informe de valoración, documentación legal', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_166_____________', 'Plan de negocio, estados financieros, certificados de cumplimiento legal', NULL, 'certificate', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_167_____________', 'Solicitud temporal, justificación de plazo, documentación básica', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_168_____________', 'Documentación especializada, certificaciones específicas, plan detallado', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_169_____________', 'Plan de distribución, certificados de calidad, licencias de producto', NULL, 'certificate', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_170_____________', 'Certificado forestal, permiso de tala, documentación ambiental', NULL, 'certificate', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_171_____________', 'Certificado de procesamiento, licencia industrial, documentación ambiental', NULL, 'certificate', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_172_____________', 'Formulario comercial, datos empresa, registro actividad', NULL, 'property', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_173_____________', 'Identificación comercial, historial actividad, documentos empresa', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_174_____________', 'Licencia comercial, inspección local, documentos constitutivos', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_175_____________', 'Solicitud búsqueda, identificación documentos, justificación', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_176_____________', 'Acta disolución, balance final, certificados fiscales', NULL, 'certificate', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_177_____________', 'Lista mercancías, justificación temporal, garantía retorno', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_178_____________', 'Declaración valor CIF, documentos importación, certificado origen', NULL, 'certificate', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_179_____________', 'Factura comercial, documentos técnicos, certificados de autenticidad', NULL, 'certificate', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_180_____________', 'Factura proforma, lista de empaque, certificados de origen', NULL, 'certificate', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_181_____________', 'Factura original, documentos comerciales, certificación consular', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_182_____________', 'Factura comercial, declaración justificativa, documentación adicional', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_183_____________', 'Factura original, explicación no visado, documentación complementaria', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_184_____________', 'Licencia internacional, seguro responsabilidad civil, certificación técnica', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_185_____________', 'Permiso internacional, seguro artistas, programa detallado', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_186_____________', 'Plan seguridad, permisos municipales, seguro responsabilidad', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_187_____________', 'Lista participantes, seguro grupo, programa actuación', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_188_____________', 'Lista personal, seguro colectivo, plan escenario', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_189_____________', 'Plan logístico, seguro ampliado, certificación técnica', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_190_____________', 'Visados artistas, seguro internacional, programa detallado', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_191_____________', 'Documentación migratoria, seguro colectivo internacional, plan técnico', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_192_____________', 'Plan logístico internacional, seguro global, certificaciones técnicas', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_193_____________', 'Plan gestión masiva, seguros especiales, certificación infraestructura', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_194_____________', 'Licencia exhibición, plan emergencia, certificación técnica', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_195_____________', 'Licencia distribución, catálogo contenidos, derechos autor', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_196_____________', 'Licencia proyección, catálogo autorizado, permiso municipal', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_197_____________', 'Registro local, inventario videos, permiso comunal', NULL, 'property', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_198_____________', 'Licencia distribución, catálogo productos, derechos comerciales', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_199_____________', 'Acreditación profesional, seguro equipo, certificación técnica', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_200_____________', 'Permiso rodaje, plan filmación, seguro producción', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_201_____________', 'Licencia comercial, registro productos, certificación original', NULL, 'property', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_202_____________', 'Carné artista, programa musical, seguro actuación', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_203_____________', 'Visado artista, seguro internacional, programa detallado', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_204_____________', 'Licencia comercial, seguro equipos, certificación profesional', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_205_____________', 'Identificación profesional, permiso móvil, seguro básico', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_206_____________', 'Licencia imprenta, registro comercial, certificación técnica', NULL, 'property', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_207_____________', 'Permiso instalación, diseño publicitario, seguro responsabilidad', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_208_____________', 'Plano técnico, permiso urbanístico, seguro instalación', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_209_____________', 'Especificaciones técnicas, permiso instalación, certificación seguridad', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_210_____________', 'Diseño panel, permiso básico, ficha técnica', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_211_____________', 'Esquema panel, autorización básica, datos técnicos', NULL, 'authorization', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_212_____________', 'Diseño básico, permiso simple, especificaciones', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_213_____________', 'Formato panel, permiso reducido, datos instalación', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_214_____________', 'Documentación identidad, portfolio artístico, certificación profesional', NULL, 'identity', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_215_____________', 'Copia película, sinopsis detallada, clasificación propuesta', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_216_____________', 'Contrato artistas, plan recaudación, registro contable', NULL, 'property', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_217_____________', 'Documento identidad, ticket entrada, registro visitante', NULL, 'identity', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_218_____________', 'Licencia comercial, registro artesano, certificación local', NULL, 'property', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_219_____________', 'Plan actividad, registro artesano, permiso municipal', NULL, 'property', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_220_____________', 'Inventario obras, seguro objetos, certificación exposición', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_221_____________', 'Diseño rótulo, permiso urbanístico, certificación técnica', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_222_____________', 'Licencia profesional, certificación sanitaria, seguro establecimiento', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_223_____________', 'Permiso comercial, certificado higiene, seguro responsabilidad', NULL, 'certificate', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_224_____________', 'Registro básico, certificación higiene, seguro básico', NULL, 'property', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_225_____________', 'Diseño señalización, permiso municipal, certificación instalación', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_226_____________', 'Solicitud temporal, diseño rótulo, duración prevista', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_227_____________', 'Portfolio artístico, título formación, certificación profesional', NULL, 'academic', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_228_____________', 'Licencia turística, seguro responsabilidad, garantía financiera', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_229_____________', 'Certificación lujo, plan operativo, licencias completas', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_230_____________', 'Certificación superior, plan servicios, licencias hoteleras', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_231_____________', 'Plan operaciones, certificación estándar, permisos básicos', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_232_____________', 'Licencia básica, plan funcionamiento, certificación mínima', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_233_____________', 'Permiso alojamiento, normas básicas, seguro responsabilidad', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_234_____________', 'Documentación técnica, informe evaluación, estándares cumplidos', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_235_____________', 'Licencia restauración, certificación sanitaria, plan operativo', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_236_____________', 'Permiso hostelería, certificado higiene, plan funcionamiento', NULL, 'certificate', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_237_____________', 'Licencia hostelería, certificación sanitaria, plan calidad', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_238_____________', 'Permiso comercial, certificado sanidad, plan operativo', NULL, 'certificate', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_239_____________', 'Licencia premium, plan seguridad, certificación acústica', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_240_____________', 'Permiso hostelería, normas seguridad, control sonido', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_241_____________', 'Licencia básica, permisos locales, normas mínimas', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_242_____________', 'Licencia especial, plan seguridad avanzado, certificación acústica premium', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_243_____________', 'Licencia nocturna, control sonido, plan emergencia', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_244_____________', 'Licencia juego, plan seguridad especial, garantía financiera', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_245_____________', 'Registro máquina, certificación técnica, control fiscal', NULL, 'property', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_246_____________', 'Registro mesa, licencia crupier, control operaciones', NULL, 'property', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_247_____________', 'Licencia juegos azar, certificación máquinas, plan seguridad', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_248_____________', 'Registro máquina, control técnico, certificado operación', NULL, 'certificate', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_249_____________', 'Licencia sorteos, garantía financiera, plan operativo', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_250_____________', 'Declaración premio, identificación ganador, comprobante pago', NULL, 'payment_proof', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_251_____________', 'Permiso sorteo, lista premios, plan organización', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_252_____________', 'Acreditación profesional, plan rodaje, seguro especializado', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_253_____________', 'Registro cineasta, permiso safari, plan grabación', NULL, 'property', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_254_____________', 'Documento identidad, justificante residencia, formulario visita', NULL, 'identity', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_255_____________', 'Pasaporte, visa turística, itinerario visita', NULL, 'identity', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_256_____________', 'Licencia comercial, garantía financiera, plan operativo', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_257_____________', 'Registro comercial, seguro responsabilidad, plan ventas', NULL, 'property', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_258_____________', 'Licencia operador, seguro viajes, certificación profesional', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_259_____________', 'Licencia dual, seguros vehículos, plan comercial', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_260_____________', 'Documento de identidad, certificado de antecedentes penales, certificado de aptitud psicológica', NULL, 'identity', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_261_____________', 'Factura de compra, certificado de origen, permiso de exportación del país de origen', NULL, 'certificate', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_262_____________', 'Licencia de caza, factura de compra, especificaciones técnicas', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_263_____________', 'Licencia vigente, registro del arma, documento de identidad', NULL, 'identity', 12, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_264_____________', 'Registro de armas, identificación propietario, certificados de compra', NULL, 'certificate', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_265_____________', 'Solicitud formal, identificación del solicitante, plan de construcción', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_266_____________', 'Permiso de tala, identificación del solicitante, plan de construcción', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_267_____________', 'Registro pescador, especificaciones embarcación, licencia navegación', NULL, 'property', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_268_____________', 'Certificado navegabilidad, registro embarcación, plan botadura', NULL, 'certificate', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_269_____________', 'Solicitud varada, registro embarcación, plan seguridad', NULL, 'property', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_270_____________', 'Título propiedad, certificado navegabilidad, seguro marítimo', NULL, 'certificate', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_271_____________', 'Especificaciones motor, certificado instalación, inspección técnica', NULL, 'certificate', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_272_____________', 'Registro motor/vela, certificado seguridad, documentación técnica', NULL, 'certificate', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_273_____________', 'Registro cayuco, especificaciones motor, licencia navegación', NULL, 'property', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_274_____________', 'Registro embarcación, certificado propietario, inspección básica', NULL, 'certificate', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_275_____________', 'Certificado tonelaje, documentación técnica, inspección naval', NULL, 'certificate', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_276_____________', 'Solicitud temporal, documentación básica, garantía financiera', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_277_____________', 'Documentación completa, inspección final, certificados vigentes', NULL, 'certificate', 12, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_278_____________', 'Título propiedad, certificado registro, documentación técnica', NULL, 'certificate', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_279_____________', 'Identificación propietario, especificaciones equipo, licencia pesca', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_280_____________', 'Factura motor, especificaciones técnicas, certificado potencia', NULL, 'certificate', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_281_____________', 'Certificado competencia, examen náutico, documentos identidad', NULL, 'identity', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_282_____________', 'Registro embarcación, lista tripulación, certificado navegabilidad', NULL, 'certificate', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_283_____________', 'Lista pasajeros, plan navegación, certificados seguridad', NULL, 'certificate', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_284_____________', 'Certificado experiencia, examen náutico, documentos identidad', NULL, 'identity', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_285_____________', 'Contrato compraventa, documentos identidad, registro anterior', NULL, 'identity', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_286_____________', 'Título propiedad, planos terreno, permisos municipales', NULL, 'academic', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_287_____________', 'Certificado de nacimiento, documento de identidad del tutor legal', NULL, 'identity', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_288_____________', 'Identificación del estudiante', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_289_____________', 'Identificación con foto', NULL, 'photo', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_290_____________', 'Identificación, certificado de notas, certificado médico', NULL, 'certificate', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_291_____________', 'Proyecto educativo, certificados educación y salud personal, permiso local', NULL, 'certificate', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_292_____________', 'Identificación, certificado de notas', NULL, 'certificate', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_293_____________', 'Identificación, certificados de estudios del país origen', NULL, 'certificate', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_294_____________', 'Identificación, certificados de estudios', NULL, 'certificate', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_295_____________', 'Identificación, justificante pérdida documento original', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_296_____________', 'Identificación, certificado de notas, pago derecho a examen', NULL, 'payment_proof', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_297_____________', 'Identificación del estudiante, certificado de notas', NULL, 'certificate', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_298_____________', 'Identificación, certificado de notas, pago derechos de matrícula', NULL, 'payment_proof', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_299_____________', 'Estatutos sociales, acta constitutiva, identificación accionistas, plan de negocio', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_300_____________', 'Escritura constitución, identificación socios, capital social, plan operativo', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_301_____________', 'Plan inversión, estados financieros, garantías bancarias, proyecciones financieras', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_302_____________', 'Identificación personal, plan actividad, registro fiscal, declaración patrimonio', NULL, 'property', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_303_____________', 'Estados bancarios, historial crediticio, balance financiero, certificación bancaria', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_304_____________', 'Identificación remitente, documentación destino, justificación transferencia', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_305_____________', 'Formulario transferencia, identificación bancaria, justificante operación', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_306_____________', 'Nóminas, declaración renta, identificación fiscal', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_307_____________', 'Comprobantes ingresos extranjeros, documentación fiscal, certificados bancarios', NULL, 'payment_proof', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_308_____________', 'Documentación vehículo, identificación propietario, inspección técnica', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_309_____________', 'Documentación actual, justificante residencia, identificación personal', NULL, 'general', 12, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_310_____________', 'Declaraciones fiscales, comprobantes pago, historial tributario', NULL, 'payment_proof', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_311_____________', '- Licencia de importación', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_312_____________', '- Registro mercantil', NULL, 'property', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_313_____________', '- Certificado de autorización del fabricante', NULL, 'certificate', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_314_____________', '- Plan de negocios', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_315_____________', '- Certificados técnicos', NULL, 'certificate', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_316_____________', '- Licencia de operación', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_317_____________', '- Plan técnico de red', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_318_____________', '- Contratos con proveedores de contenido', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_319_____________', '- Estudio de viabilidad', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_320_____________', '- Licencia comercial', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_321_____________', '- Plan de seguridad informática', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_322_____________', '- Contrato ISP', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_323_____________', '- Certificado de equipamiento', NULL, 'certificate', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_324_____________', '- Plano del local', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_325_____________', '- Licencia comercial de primera categoría', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_326_____________', '- Inventario de equipos profesionales', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_327_____________', '- Certificación técnica del personal', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_328_____________', '- Plan de operaciones', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_329_____________', '- Póliza de seguro profesional', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_330_____________', '- Licencia comercial de segunda categoría', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_331_____________', '- Listado de equipos', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_332_____________', '- Certificados de formación del personal', NULL, 'certificate', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_333_____________', '- Plan de servicios', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_334_____________', '- Seguro de responsabilidad civil', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_335_____________', '- Licencia comercial básica', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_336_____________', '- Inventario básico de equipos', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_337_____________', '- Certificado de capacitación básica', NULL, 'certificate', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_338_____________', '- Plan de operación simplificado', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_339_____________', '- Seguro básico', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_340_____________', '- Diseño del cartel', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_341_____________', '- Permiso de ubicación', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_342_____________', '- Certificado de seguridad eléctrica', NULL, 'certificate', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_343_____________', '- Plano de instalación', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_344_____________', '- Estudio de impacto visual', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_345_____________', '- Plano estructural', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_346_____________', '- Diseño de la publicidad', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_347_____________', '- Permiso del propietario', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_348_____________', '- Certificado de conformidad', NULL, 'certificate', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_349_____________', '- Registro del vehículo', NULL, 'property', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_350_____________', '- Fotografías del vehículo', NULL, 'photo', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_351_____________', '- Diseño del mural', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_352_____________', '- Autorización municipal', NULL, 'authorization', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_353_____________', '- Certificado de durabilidad', NULL, 'certificate', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_354_____________', '- Plan de mantenimiento', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_355_____________', '- Contenido del mensaje', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_356_____________', '- Duración prevista', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_357_____________', '- Plan de instalación', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_358_____________', '- Certificado de seguridad', NULL, 'certificate', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_359_____________', '- Material publicitario', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_360_____________', '- Contrato de publicación', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_361_____________', '- Especificaciones técnicas', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_362_____________', '- Prueba de diseño', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_363_____________', '- Calendario de publicación', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_364_____________', '- Permiso de instalación', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_365_____________', '- Certificado eléctrico', NULL, 'certificate', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_366_____________', '- Especificaciones técnicas avanzadas', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_367_____________', '- Permiso especial de instalación', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_368_____________', '- Certificado eléctrico reforzado', NULL, 'certificate', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_369_____________', '- Estudio de impacto ambiental', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_370_____________', '- Plan de seguridad', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_371_____________', '- Plan de medios', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_372_____________', '- Muestras de material', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_373_____________', '- Licencia publicitaria', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_374_____________', '- Calendario de difusión', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_375_____________', '- Contrato de servicios', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_376_____________', '- Material publicitario en B/N', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_377_____________', '- Formulario de solicitud', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_378_____________', '- Comprobante de pago', NULL, 'payment_proof', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_379_____________', '- Autorización del anunciante', NULL, 'authorization', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_380_____________', '- Material publicitario en color', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_381_____________', '- Prueba de color', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_382_____________', '- Material publicitario B/N', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_383_____________', '- Especificaciones de media página', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_384_____________', '- Material publicitario full color', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_385_____________', '- Prueba de color calibrada', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_386_____________', '- Especificaciones de cuarto de página', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_387_____________', '- Material publicitario bicolor', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_388_____________', '- Especificaciones de octavo de página', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_389_____________', '- Material publicitario mixto', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_390_____________', '- Archivo digital de banner', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_391_____________', '- Plan de campaña', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_392_____________', '- Archivo digital HD', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_393_____________', '- Plan de visualización', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_394_____________', '- Archivo de video', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_395_____________', '- Derechos de autor', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_396_____________', '- Archivo digital premium', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_397_____________', '- Plan de exposición', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_398_____________', '- Archivo digital optimizado', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_399_____________', '- Plan de visibilidad', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_400_____________', '- Archivo digital de alta resolución', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_401_____________', '- Estrategia de exposición', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_402_____________', '- Archivo de video HD', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_403_____________', '- Derechos de reproducción', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_404_____________', '- Licencia comercial premium', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_405_____________', '- Inventario detallado', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_406_____________', '- Licencia comercial estándar', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_407_____________', '- Seguro mínimo', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_408_____________', '- Texto de dedicatoria', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_409_____________', '- Identificación del solicitante', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_410_____________', '- Horario preferido', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_411_____________', '- Texto del comunicado', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_412_____________', '- Identificación del emisor', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_413_____________', '- Autorización de difusión', NULL, 'authorization', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_414_____________', '- Duración exacta', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_415_____________', '- Preferencias de horario', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_416_____________', '- Texto del mensaje', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_417_____________', '- Fecha de emisión', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_418_____________', '- Fotografía digital', NULL, 'photo', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_419_____________', '- Texto del anuncio', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_420_____________', '- Autorización de uso de imagen', NULL, 'authorization', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_421_____________', '- Texto del aviso', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_422_____________', '- Conteo de palabras', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_423_____________', '- Preferencia de horario', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_424_____________', '- Plan de emisión', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_425_____________', '- Texto para scroll', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_426_____________', '- Diseño gráfico', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_427_____________', '- Duración solicitada', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_428_____________', '- Plan anual de publicidad', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_429_____________', '- Contrato anual', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_430_____________', '- Calendario de emisiones', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_431_____________', '- Licencia editorial', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_432_____________', '- Plan de negocio', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_433_____________', '- Muestra de contenido', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_434_____________', '- Registro comercial', NULL, 'property', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_435_____________', '- Licencia de prensa', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_436_____________', '- Plan editorial', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_437_____________', '- Estructura organizativa', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_438_____________', '- Plano del kiosco', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_439_____________', '- Contrato de distribución', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_440_____________', '- Licencia de distribución', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_441_____________', '- Plan logístico', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_442_____________', '- Contratos editoriales', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_443_____________', '- Registro de vehículos', NULL, 'property', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_444_____________', '- Licencia profesional', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_445_____________', '- Portfolio de servicios', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_446_____________', '- Registro empresarial', NULL, 'property', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_447_____________', '- Solicitud de matrícula temporal', NULL, 'aircraft', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_448_____________', '- Documento de identidad', NULL, 'identity', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_449_____________', '- Documentación del vehículo', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_450_____________', '- Seguro temporal', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_451_____________', '- Justificante de pago', NULL, 'payment_proof', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_452_____________', '- Solicitud de permiso B', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_453_____________', '- Certificado médico', NULL, 'certificate', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_454_____________', '- Fotografías recientes', NULL, 'photo', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_455_____________', '- Comprobante de formación', NULL, 'payment_proof', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_456_____________', '- Solicitud de permiso B1', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_457_____________', '- Certificado de formación específica', NULL, 'certificate', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_458_____________', '- Solicitud de permiso C', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_459_____________', '- Certificado médico especial', NULL, 'certificate', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_460_____________', '- Certificado de aptitud profesional', NULL, 'certificate', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_461_____________', '- Solicitud de permiso D', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_462_____________', '- Certificado médico profesional', NULL, 'certificate', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_463_____________', '- Certificado de aptitud para transporte de pasajeros', NULL, 'certificate', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_464_____________', '- Solicitud de matrícula definitiva', NULL, 'aircraft', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_465_____________', '- Documentación completa del vehículo', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_466_____________', '- Seguro vigente', NULL, 'general', 12, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_467_____________', '- Certificado técnico', NULL, 'certificate', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_468_____________', '- Solicitud de permiso', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_469_____________', '- Solicitud de permiso E', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_470_____________', '- Certificado de formación de remolque', NULL, 'certificate', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_471_____________', '- Permiso anterior', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_472_____________', '- Certificado médico vigente', NULL, 'certificate', 12, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_473_____________', '- Denuncia de pérdida/robo', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_474_____________', '- Declaración jurada', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_475_____________', '- Fotografía reciente', NULL, 'photo', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_476_____________', '- Permiso anterior (si aplica)', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_477_____________', '- Formulario oficial', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_478_____________', '- Justificante de residencia', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_479_____________', '- Documentación adicional según caso', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_480_____________', '- Solicitud de examen', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_481_____________', '- Certificado de formación', NULL, 'certificate', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_482_____________', '- Permiso caducado', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_483_____________', '- Justificante de retraso', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_484_____________', '- Comprobante de pago con recargo', NULL, 'payment_proof', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_485_____________', '- Justificación del retraso', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_486_____________', '- Permiso original', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_487_____________', '- Traducción oficial', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_488_____________', '- Certificado de validez', NULL, 'certificate', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_489_____________', '- Comprobante de domicilio', NULL, 'payment_proof', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_490_____________', '- Permiso actual', NULL, 'general', 12, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_491_____________', '- Formulario de cambio', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_492_____________', '- Motivo de la certificación', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_493_____________', '- Historial de conducción', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_494_____________', '- Registro de infracciones', NULL, 'property', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_495_____________', '- Certificado de residencia', NULL, 'certificate', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_496_____________', '- Título de propiedad', NULL, 'academic', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_497_____________', '- Plano del terreno', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_498_____________', '- Solicitud de medición', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_499_____________', '- Identificación del propietario', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_500_____________', '- Huellas dactilares', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_501_____________', '- Estatutos de la asociación', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_502_____________', '- Registro de miembros', NULL, 'property', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_503_____________', '- Licencias de vehículos', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_504_____________', '- Seguro colectivo', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_505_____________', '- Licencia industrial', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_506_____________', '- Planos de instalación', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_507_____________', '- Certificados de seguridad', NULL, 'certificate', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_508_____________', '- Estudio ambiental', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_509_____________', '- Certificado sanitario', NULL, 'certificate', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_510_____________', '- Plan de instalaciones', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_511_____________', '- Registro de proveedor', NULL, 'property', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_512_____________', '- Sistema de refrigeración', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_513_____________', '- Licencia de actividad', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_514_____________', '- Medidas de seguridad', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_515_____________', '- Certificado de habitabilidad', NULL, 'certificate', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_516_____________', '- Registro fiscal', NULL, 'property', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_517_____________', '- Solicitud de ubicación', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_518_____________', '- Plano del puesto', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_519_____________', '- Lista de productos', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_520_____________', '- Certificado de proveedor', NULL, 'certificate', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_521_____________', '- Declaración de origen', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_522_____________', '- Certificado de calidad', NULL, 'certificate', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_523_____________', '- Control sanitario', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_524_____________', '- Registro básico', NULL, 'property', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_525_____________', '- Permiso de venta', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_526_____________', '- Registro de productos', NULL, 'property', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_527_____________', '- Plan del local', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_528_____________', '- Seguro de responsabilidad', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_529_____________', '- Seguro obligatorio', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_530_____________', '- Matrícula temporal', NULL, 'aircraft', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_531_____________', '- Inspección técnica', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_532_____________', '- Matrícula temporal caducada', NULL, 'aircraft', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_533_____________', '- Documentación actualizada', NULL, 'general', 12, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_534_____________', '- Solicitud provisional', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_535_____________', '- Justificación de necesidad', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_536_____________', '- Autorización del fabricante', NULL, 'authorization', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_537_____________', '- Seguro especial', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_538_____________', '- Ficha técnica', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_539_____________', '- Plan de pruebas', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_540_____________', '- Denuncia de pérdida', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_541_____________', '- Matrícula original', NULL, 'aircraft', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_542_____________', '- Contrato de compraventa', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_543_____________', '- Documentos de identidad', NULL, 'identity', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_544_____________', '- Permiso de circulación', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_545_____________', '- Seguro actualizado', NULL, 'general', 12, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_546_____________', 'Licencia comercial, certificado de seguridad, registro fiscal', NULL, 'certificate', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_547_____________', 'Licencia mayorista, certificación almacenamiento, permisos especiales', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_548_____________', 'Documentación embarcación, certificados seguridad, permisos navegación', NULL, 'certificate', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_549_____________', 'Licencia comercial minorista, certificación almacenamiento, plan seguridad', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_550_____________', 'Licencia mayorista, certificación depósitos, plan distribución', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_551_____________', 'Documentos constitutivos, certificaciones técnicas, licencias operativas', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_552_____________', 'Solicitud baja, liquidación obligaciones, informe cierre', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_553_____________', 'Justificación retraso, documentación pendiente, comprobante pago', NULL, 'payment_proof', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_554_____________', 'Licencia anterior, inspección instalaciones, certificado seguridad', NULL, 'certificate', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_555_____________', 'Plan operativo, certificación almacenamiento, licencia comercial', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_556_____________', 'Plan distribución, certificación infraestructura, permisos especiales', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_557_____________', 'Proyecto técnico, estudio impacto, permisos construcción', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_558_____________', 'Estudio geológico, plan explotación, evaluación ambiental', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_559_____________', 'Plan extracción, estudio ambiental, permisos locales', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_560_____________', 'Registros producción, mediciones volumen, certificación técnica', NULL, 'property', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_561_____________', 'Control producción, medición volumen, certificados técnicos', NULL, 'certificate', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_562_____________', 'Contrato superficie, plan exploración, documentación técnica', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_563_____________', 'Plan producción, registros operativos, certificaciones técnicas', NULL, 'property', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_564_____________', 'Plan fondeo, certificación naval, permisos marítimos', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_565_____________', 'Plan operativo extendido, certificados técnicos, licencias especiales', NULL, 'certificate', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_566_____________', 'Plan sísmico, certificación equipos, permisos exploración', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_567_____________', 'Programa sísmico extendido, certificaciones avanzadas, licencias especiales', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_568_____________', 'Plan perforación, certificación seguridad, permisos operativos', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_569_____________', 'Proyecto investigación, credenciales técnicas, plan trabajo', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_570_____________', 'Contrato minero, garantías financieras, plan explotación', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_571_____________', 'Declaración recursos, estudio técnico, informe evaluación', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_572_____________', 'Contrato arrendamiento, planos superficie, documentación técnica', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_573_____________', 'Plan explotación, medición superficie, certificación actividad', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_574_____________', 'Documentación del vehículo, DNI propietario, seguro vigente', NULL, 'identity', 12, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_575_____________', 'Licencia comercial, inspección técnica, seguro público', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_576_____________', 'Certificación servicio público, documentación técnica, permisos especiales', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_577_____________', 'Permiso especial transporte, inspección vehículo pesado, certificado profesional', NULL, 'certificate', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_578_____________', 'Licencia turística, seguro especial, documentación vehículo', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_579_____________', 'DNI, comprobante domicilio, documentación personal', NULL, 'identity', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_580_____________', 'Plano catastral, título propiedad, solicitud medición', NULL, 'academic', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_581_____________', 'Título propiedad, plano parcela, certificación catastral', NULL, 'academic', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_582_____________', 'Documentación propiedad, estudio topográfico, planos detallados', NULL, 'property', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_583_____________', 'Estudio completo propiedad, análisis topográfico extensivo, documentación legal', NULL, 'property', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_584_____________', 'Plano situación, documentación catastral, solicitud replanteo', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_585_____________', 'Documentación fiscal, planos técnicos, certificación urbanística', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_586_____________', 'Estudio topográfico, certificación fiscal, documentación urbanística', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_587_____________', 'Estudio completo terreno, valoración fiscal, planos detallados', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_588_____________', 'Estudio técnico completo, documentación legal, certificación fiscal', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_589_____________', 'Plano terreno, título propiedad, solicitud medición', NULL, 'academic', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_590_____________', 'Estudio topográfico, documentación propiedad, planos detallados', NULL, 'property', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_591_____________', 'Estudio completo terreno, documentación legal, análisis técnico', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_592_____________', 'Solicitud impresión, archivo digital, especificaciones formato', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_593_____________', 'Solicitud impresión A3, archivo digital, requisitos técnicos', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_594_____________', 'Archivo plano, especificaciones técnicas, formato digital', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_595_____________', 'Archivo técnico, requisitos impresión, formato digital', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_596_____________', 'Archivo gran formato, especificaciones técnicas, formato digital', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_597_____________', 'Documentación propiedad, fotos bienes, identificación propietario', NULL, 'photo', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_598_____________', 'Documentación completa, inventario detallado, certificados valor', NULL, 'certificate', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_599_____________', 'Documentación exhaustiva, tasación previa, certificados oficiales', NULL, 'certificate', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_600_____________', 'Documentación completa, auditoría previa, certificaciones especiales', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_601_____________', 'Planos terreno, documentación urbanística, certificado catastral', NULL, 'certificate', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_602_____________', 'Documentación completa, estudio urbanístico, certificaciones técnicas', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_603_____________', 'Pasaporte válido, formulario solicitud, documentos justificativos', NULL, 'identity', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_604_____________', 'Pasaporte, justificación estancia, seguro médico', NULL, 'identity', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_605_____________', 'Pasaporte, plan estancia, documentos respaldo', NULL, 'identity', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_606_____________', 'Pasaporte vigente, justificación larga estancia, documentos económicos', NULL, 'identity', 12, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_607_____________', 'Visa actual, justificación prórroga, pasaporte válido', NULL, 'identity', 12, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_608_____________', 'Comprobante residencia, documento identidad, justificante medios', NULL, 'identity', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_609_____________', 'Pasaporte vigente, historial residencia, prueba solvencia económica', NULL, 'identity', 12, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_610_____________', 'Documento identidad, justificación entrada, declaración propósito', NULL, 'identity', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_611_____________', 'Pasaporte, visado expirado, justificación retraso', NULL, 'identity', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_612_____________', 'Solicitud emigración, documentos personales, plan viaje', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_613_____________', 'Documento identidad, certificado residencia, antecedentes policiales', NULL, 'identity', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_614_____________', 'Pasaporte, permiso residencia, antecedentes país origen', NULL, 'identity', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_615_____________', 'Denuncia policial, identificación alternativa, declaración pérdida', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_616_____________', 'Pasaporte, visa temporal, justificación solicitud', NULL, 'identity', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_617_____________', 'Documento original, identificación solicitante, formulario solicitud', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_618_____________', 'Pasaporte, visado destino, contrato trabajo internacional', NULL, 'identity', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_619_____________', 'Certificado nacimiento, foto identidad, huella digital', NULL, 'identity', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_620_____________', 'Denuncia pérdida, identificación alternativa, fotografía reciente', NULL, 'photo', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_621_____________', 'Documento identidad, certificado nacimiento, fotos reglamentarias', NULL, 'identity', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_622_____________', 'Denuncia pérdida, pasaporte anterior, documento identidad', NULL, 'identity', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_623_____________', 'Pasaporte anterior, documento identidad, fotos actualizadas', NULL, 'identity', 12, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_624_____________', 'Pasaporte válido, visado residencia, justificante domicilio', NULL, 'identity', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_625_____________', 'Carnet anterior, historial residencia, documentos actualización', NULL, 'general', 12, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_626_____________', 'Documento identidad, descripción hechos, pruebas disponibles', NULL, 'identity', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_627_____________', 'Acta infracción, identificación infractor, pruebas incidente', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_628_____________', 'Especificaciones técnicas, certificados de conformidad, documentación del fabricante', NULL, 'certificate', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_629_____________', 'Documentos constitutivos, licencias operativas, certificados fiscales', NULL, 'certificate', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_630_____________', 'Licencia importación, registro comercial, documentación aduanera', NULL, 'property', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_631_____________', 'Documento identidad, alta fiscal, plan actividad', NULL, 'identity', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_632_____________', 'Documentación técnica, certificados origen, licencias exportación', NULL, 'certificate', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_633_____________', 'Documentación comercial, licencias comercio exterior, certificados origen', NULL, 'certificate', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_634_____________', 'Documentos modificación, identificación nuevo titular, justificantes cambio', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_635_____________', 'Documentación vehículo, ficha técnica, permiso circulación', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_636_____________', 'Documentación vehículo, certificado carga, permiso transporte', NULL, 'certificate', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_637_____________', 'Licencia transporte pasajeros, inspección técnica, seguro viajeros', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_638_____________', 'Permiso transporte colectivo, certificación técnica, seguro obligatorio', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_639_____________', 'Licencia operador, certificación capacidad, documentación técnica', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_640_____________', 'Certificación transporte, documentación técnica, seguros especiales', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_641_____________', 'Licencia operador, certificados seguridad, seguros pasajeros', NULL, 'certificate', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_642_____________', 'Certificación carga, documentos mercancías, permisos transporte', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_643_____________', 'Licencias múltiples, certificaciones especiales, seguros combinados', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_644_____________', 'Certificación especial, permisos peligrosos, protocolos seguridad', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_645_____________', 'Permiso circulación, certificado peso, documentación carga', NULL, 'certificate', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_646_____________', 'Documento identidad, permiso conducir, registro vehículo', NULL, 'identity', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_647_____________', 'Permiso circulación, certificado técnico, documentación vehículo', NULL, 'certificate', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_648_____________', 'Permiso circulación, ficha técnica, seguro vehículo', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_649_____________', 'Licencia transporte público, permiso circulación, seguro pasajeros', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_650_____________', 'Permiso especial, certificación remolque, documentación técnica', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_651_____________', 'Documentación contenedor, permiso transporte, certificado carga', NULL, 'certificate', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO document_templates (template_code, document_name_es, description_es, category, validity_duration_months, created_at)
VALUES ('DOC_652_____________', 'Permisos especiales, certificación técnica, seguros específicos', NULL, 'general', NULL, NOW())
ON CONFLICT (template_code) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-001' AND dt.template_code = 'DOC_1_______________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-002' AND dt.template_code = 'DOC_2_______________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-003' AND dt.template_code = 'DOC_3_______________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-004' AND dt.template_code = 'DOC_4_______________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-005' AND dt.template_code = 'DOC_5_______________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-006' AND dt.template_code = 'DOC_6_______________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-007' AND dt.template_code = 'DOC_7_______________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-008' AND dt.template_code = 'DOC_8_______________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-009' AND dt.template_code = 'DOC_9_______________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-010' AND dt.template_code = 'DOC_3_______________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-011' AND dt.template_code = 'DOC_10______________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-012' AND dt.template_code = 'DOC_11______________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-013' AND dt.template_code = 'DOC_12______________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-014' AND dt.template_code = 'DOC_13______________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-015' AND dt.template_code = 'DOC_14______________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-016' AND dt.template_code = 'DOC_14______________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-017' AND dt.template_code = 'DOC_14______________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-018' AND dt.template_code = 'DOC_14______________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-019' AND dt.template_code = 'DOC_15______________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-020' AND dt.template_code = 'DOC_16______________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-021' AND dt.template_code = 'DOC_17______________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-022' AND dt.template_code = 'DOC_14______________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-023' AND dt.template_code = 'DOC_14______________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-024' AND dt.template_code = 'DOC_14______________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-025' AND dt.template_code = 'DOC_14______________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-026' AND dt.template_code = 'DOC_14______________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-027' AND dt.template_code = 'DOC_14______________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-028' AND dt.template_code = 'DOC_15______________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-029' AND dt.template_code = 'DOC_18______________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-030' AND dt.template_code = 'DOC_19______________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-031' AND dt.template_code = 'DOC_20______________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-032' AND dt.template_code = 'DOC_21______________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-033' AND dt.template_code = 'DOC_22______________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-034' AND dt.template_code = 'DOC_23______________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-035' AND dt.template_code = 'DOC_24______________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-036' AND dt.template_code = 'DOC_25______________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-037' AND dt.template_code = 'DOC_26______________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-038' AND dt.template_code = 'DOC_27______________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-039' AND dt.template_code = 'DOC_28______________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-040' AND dt.template_code = 'DOC_29______________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-041' AND dt.template_code = 'DOC_30______________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-042' AND dt.template_code = 'DOC_31______________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-043' AND dt.template_code = 'DOC_32______________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-044' AND dt.template_code = 'DOC_33______________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-045' AND dt.template_code = 'DOC_34______________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-046' AND dt.template_code = 'DOC_35______________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-047' AND dt.template_code = 'DOC_36______________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-048' AND dt.template_code = 'DOC_37______________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-049' AND dt.template_code = 'DOC_38______________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-050' AND dt.template_code = 'DOC_39______________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-051' AND dt.template_code = 'DOC_40______________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-052' AND dt.template_code = 'DOC_41______________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-053' AND dt.template_code = 'DOC_42______________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-054' AND dt.template_code = 'DOC_43______________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-055' AND dt.template_code = 'DOC_44______________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-056' AND dt.template_code = 'DOC_45______________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-057' AND dt.template_code = 'DOC_46______________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-058' AND dt.template_code = 'DOC_47______________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-059' AND dt.template_code = 'DOC_48______________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-060' AND dt.template_code = 'DOC_49______________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-061' AND dt.template_code = 'DOC_50______________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-062' AND dt.template_code = 'DOC_51______________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-063' AND dt.template_code = 'DOC_52______________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-064' AND dt.template_code = 'DOC_53______________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-065' AND dt.template_code = 'DOC_54______________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-066' AND dt.template_code = 'DOC_55______________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-067' AND dt.template_code = 'DOC_56______________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-068' AND dt.template_code = 'DOC_57______________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-069' AND dt.template_code = 'DOC_58______________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-070' AND dt.template_code = 'DOC_59______________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-071' AND dt.template_code = 'DOC_60______________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-072' AND dt.template_code = 'DOC_61______________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-073' AND dt.template_code = 'DOC_62______________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-074' AND dt.template_code = 'DOC_63______________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-075' AND dt.template_code = 'DOC_64______________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-076' AND dt.template_code = 'DOC_65______________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-077' AND dt.template_code = 'DOC_66______________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-078' AND dt.template_code = 'DOC_67______________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-079' AND dt.template_code = 'DOC_68______________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-080' AND dt.template_code = 'DOC_69______________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-081' AND dt.template_code = 'DOC_70______________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-082' AND dt.template_code = 'DOC_71______________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-083' AND dt.template_code = 'DOC_72______________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-084' AND dt.template_code = 'DOC_73______________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-085' AND dt.template_code = 'DOC_74______________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-086' AND dt.template_code = 'DOC_75______________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-087' AND dt.template_code = 'DOC_76______________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-088' AND dt.template_code = 'DOC_77______________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-089' AND dt.template_code = 'DOC_78______________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-090' AND dt.template_code = 'DOC_79______________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-091' AND dt.template_code = 'DOC_80______________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-092' AND dt.template_code = 'DOC_81______________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-093' AND dt.template_code = 'DOC_82______________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-094' AND dt.template_code = 'DOC_83______________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-095' AND dt.template_code = 'DOC_84______________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-096' AND dt.template_code = 'DOC_85______________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-097' AND dt.template_code = 'DOC_86______________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-098' AND dt.template_code = 'DOC_87______________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-099' AND dt.template_code = 'DOC_88______________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-100' AND dt.template_code = 'DOC_89______________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-101' AND dt.template_code = 'DOC_90______________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-102' AND dt.template_code = 'DOC_91______________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-103' AND dt.template_code = 'DOC_92______________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-104' AND dt.template_code = 'DOC_93______________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-105' AND dt.template_code = 'DOC_94______________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-106' AND dt.template_code = 'DOC_95______________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-107' AND dt.template_code = 'DOC_96______________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-108' AND dt.template_code = 'DOC_97______________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-109' AND dt.template_code = 'DOC_98______________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-110' AND dt.template_code = 'DOC_99______________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-111' AND dt.template_code = 'DOC_100_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-112' AND dt.template_code = 'DOC_101_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-113' AND dt.template_code = 'DOC_102_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-114' AND dt.template_code = 'DOC_103_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-115' AND dt.template_code = 'DOC_104_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-116' AND dt.template_code = 'DOC_105_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-117' AND dt.template_code = 'DOC_106_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-118' AND dt.template_code = 'DOC_107_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-119' AND dt.template_code = 'DOC_108_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-120' AND dt.template_code = 'DOC_109_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-121' AND dt.template_code = 'DOC_110_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-122' AND dt.template_code = 'DOC_111_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-123' AND dt.template_code = 'DOC_112_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-124' AND dt.template_code = 'DOC_113_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-125' AND dt.template_code = 'DOC_114_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-126' AND dt.template_code = 'DOC_101_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-127' AND dt.template_code = 'DOC_115_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-128' AND dt.template_code = 'DOC_116_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-129' AND dt.template_code = 'DOC_117_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-130' AND dt.template_code = 'DOC_118_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-131' AND dt.template_code = 'DOC_119_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-132' AND dt.template_code = 'DOC_115_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-133' AND dt.template_code = 'DOC_120_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-134' AND dt.template_code = 'DOC_121_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-135' AND dt.template_code = 'DOC_122_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-136' AND dt.template_code = 'DOC_106_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-137' AND dt.template_code = 'DOC_123_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-138' AND dt.template_code = 'DOC_124_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-139' AND dt.template_code = 'DOC_107_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-140' AND dt.template_code = 'DOC_125_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-141' AND dt.template_code = 'DOC_126_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-142' AND dt.template_code = 'DOC_127_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-143' AND dt.template_code = 'DOC_128_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-144' AND dt.template_code = 'DOC_129_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-145' AND dt.template_code = 'DOC_130_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-146' AND dt.template_code = 'DOC_131_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-147' AND dt.template_code = 'DOC_132_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-148' AND dt.template_code = 'DOC_133_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-149' AND dt.template_code = 'DOC_130_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-150' AND dt.template_code = 'DOC_134_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-151' AND dt.template_code = 'DOC_135_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-152' AND dt.template_code = 'DOC_136_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-153' AND dt.template_code = 'DOC_137_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-154' AND dt.template_code = 'DOC_138_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-155' AND dt.template_code = 'DOC_139_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-156' AND dt.template_code = 'DOC_107_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-157' AND dt.template_code = 'DOC_140_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-158' AND dt.template_code = 'DOC_141_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-159' AND dt.template_code = 'DOC_142_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-160' AND dt.template_code = 'DOC_143_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-161' AND dt.template_code = 'DOC_144_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-162' AND dt.template_code = 'DOC_145_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-163' AND dt.template_code = 'DOC_146_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-164' AND dt.template_code = 'DOC_147_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-165' AND dt.template_code = 'DOC_148_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-166' AND dt.template_code = 'DOC_149_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-167' AND dt.template_code = 'DOC_150_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-168' AND dt.template_code = 'DOC_151_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-169' AND dt.template_code = 'DOC_152_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-170' AND dt.template_code = 'DOC_153_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-171' AND dt.template_code = 'DOC_154_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-172' AND dt.template_code = 'DOC_155_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-173' AND dt.template_code = 'DOC_156_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-174' AND dt.template_code = 'DOC_157_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-175' AND dt.template_code = 'DOC_158_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-176' AND dt.template_code = 'DOC_159_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-177' AND dt.template_code = 'DOC_160_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-178' AND dt.template_code = 'DOC_161_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-179' AND dt.template_code = 'DOC_162_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-180' AND dt.template_code = 'DOC_163_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-181' AND dt.template_code = 'DOC_164_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-182' AND dt.template_code = 'DOC_165_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-183' AND dt.template_code = 'DOC_166_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-184' AND dt.template_code = 'DOC_167_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-185' AND dt.template_code = 'DOC_168_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-186' AND dt.template_code = 'DOC_169_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-187' AND dt.template_code = 'DOC_170_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-188' AND dt.template_code = 'DOC_171_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-189' AND dt.template_code = 'DOC_172_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-190' AND dt.template_code = 'DOC_173_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-191' AND dt.template_code = 'DOC_174_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-192' AND dt.template_code = 'DOC_175_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-193' AND dt.template_code = 'DOC_176_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-194' AND dt.template_code = 'DOC_177_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-195' AND dt.template_code = 'DOC_178_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-196' AND dt.template_code = 'DOC_179_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-197' AND dt.template_code = 'DOC_180_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-198' AND dt.template_code = 'DOC_181_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-199' AND dt.template_code = 'DOC_182_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-200' AND dt.template_code = 'DOC_183_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-223' AND dt.template_code = 'DOC_184_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-224' AND dt.template_code = 'DOC_185_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-225' AND dt.template_code = 'DOC_186_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-226' AND dt.template_code = 'DOC_187_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-227' AND dt.template_code = 'DOC_188_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-228' AND dt.template_code = 'DOC_189_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-229' AND dt.template_code = 'DOC_190_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-230' AND dt.template_code = 'DOC_191_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-231' AND dt.template_code = 'DOC_192_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-232' AND dt.template_code = 'DOC_193_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-233' AND dt.template_code = 'DOC_194_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-234' AND dt.template_code = 'DOC_195_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-235' AND dt.template_code = 'DOC_196_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-236' AND dt.template_code = 'DOC_197_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-237' AND dt.template_code = 'DOC_198_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-238' AND dt.template_code = 'DOC_199_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-239' AND dt.template_code = 'DOC_200_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-240' AND dt.template_code = 'DOC_201_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-241' AND dt.template_code = 'DOC_202_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-242' AND dt.template_code = 'DOC_203_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-243' AND dt.template_code = 'DOC_204_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-244' AND dt.template_code = 'DOC_205_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-245' AND dt.template_code = 'DOC_206_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-246' AND dt.template_code = 'DOC_207_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-247' AND dt.template_code = 'DOC_208_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-248' AND dt.template_code = 'DOC_209_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-249' AND dt.template_code = 'DOC_210_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-250' AND dt.template_code = 'DOC_211_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-251' AND dt.template_code = 'DOC_212_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-252' AND dt.template_code = 'DOC_213_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-253' AND dt.template_code = 'DOC_214_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-254' AND dt.template_code = 'DOC_215_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-255' AND dt.template_code = 'DOC_216_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-256' AND dt.template_code = 'DOC_217_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-257' AND dt.template_code = 'DOC_218_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-258' AND dt.template_code = 'DOC_219_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-259' AND dt.template_code = 'DOC_220_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-260' AND dt.template_code = 'DOC_221_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-261' AND dt.template_code = 'DOC_222_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-262' AND dt.template_code = 'DOC_223_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-263' AND dt.template_code = 'DOC_224_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-264' AND dt.template_code = 'DOC_225_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-265' AND dt.template_code = 'DOC_226_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-266' AND dt.template_code = 'DOC_227_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-267' AND dt.template_code = 'DOC_228_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-268' AND dt.template_code = 'DOC_229_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-269' AND dt.template_code = 'DOC_230_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-270' AND dt.template_code = 'DOC_231_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-271' AND dt.template_code = 'DOC_232_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-272' AND dt.template_code = 'DOC_233_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-273' AND dt.template_code = 'DOC_234_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-274' AND dt.template_code = 'DOC_235_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-275' AND dt.template_code = 'DOC_236_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-276' AND dt.template_code = 'DOC_237_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-277' AND dt.template_code = 'DOC_238_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-278' AND dt.template_code = 'DOC_239_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-279' AND dt.template_code = 'DOC_240_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-280' AND dt.template_code = 'DOC_241_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-281' AND dt.template_code = 'DOC_242_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-282' AND dt.template_code = 'DOC_243_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-283' AND dt.template_code = 'DOC_244_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-284' AND dt.template_code = 'DOC_245_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-285' AND dt.template_code = 'DOC_246_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-286' AND dt.template_code = 'DOC_247_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-287' AND dt.template_code = 'DOC_248_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-288' AND dt.template_code = 'DOC_249_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-289' AND dt.template_code = 'DOC_250_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-290' AND dt.template_code = 'DOC_251_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-291' AND dt.template_code = 'DOC_252_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-292' AND dt.template_code = 'DOC_253_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-293' AND dt.template_code = 'DOC_254_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-294' AND dt.template_code = 'DOC_255_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-295' AND dt.template_code = 'DOC_256_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-296' AND dt.template_code = 'DOC_257_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-297' AND dt.template_code = 'DOC_258_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-298' AND dt.template_code = 'DOC_259_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-331' AND dt.template_code = 'DOC_260_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-332' AND dt.template_code = 'DOC_261_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-333' AND dt.template_code = 'DOC_262_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-334' AND dt.template_code = 'DOC_263_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-335' AND dt.template_code = 'DOC_264_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-336' AND dt.template_code = 'DOC_265_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-337' AND dt.template_code = 'DOC_266_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-338' AND dt.template_code = 'DOC_267_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-339' AND dt.template_code = 'DOC_268_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-340' AND dt.template_code = 'DOC_269_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-341' AND dt.template_code = 'DOC_270_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-342' AND dt.template_code = 'DOC_271_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-343' AND dt.template_code = 'DOC_272_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-344' AND dt.template_code = 'DOC_273_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-345' AND dt.template_code = 'DOC_274_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-346' AND dt.template_code = 'DOC_275_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-347' AND dt.template_code = 'DOC_276_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-348' AND dt.template_code = 'DOC_277_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-349' AND dt.template_code = 'DOC_278_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-350' AND dt.template_code = 'DOC_279_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-351' AND dt.template_code = 'DOC_280_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-352' AND dt.template_code = 'DOC_281_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-353' AND dt.template_code = 'DOC_282_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-354' AND dt.template_code = 'DOC_283_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-355' AND dt.template_code = 'DOC_284_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-356' AND dt.template_code = 'DOC_285_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-357' AND dt.template_code = 'DOC_286_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-358' AND dt.template_code = 'DOC_287_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-359' AND dt.template_code = 'DOC_288_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-360' AND dt.template_code = 'DOC_289_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-361' AND dt.template_code = 'DOC_288_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-362' AND dt.template_code = 'DOC_288_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-363' AND dt.template_code = 'DOC_290_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-364' AND dt.template_code = 'DOC_290_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-365' AND dt.template_code = 'DOC_290_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-366' AND dt.template_code = 'DOC_290_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-367' AND dt.template_code = 'DOC_290_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-368' AND dt.template_code = 'DOC_291_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-369' AND dt.template_code = 'DOC_291_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-370' AND dt.template_code = 'DOC_291_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-371' AND dt.template_code = 'DOC_291_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-372' AND dt.template_code = 'DOC_292_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-373' AND dt.template_code = 'DOC_292_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-374' AND dt.template_code = 'DOC_292_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-375' AND dt.template_code = 'DOC_292_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-376' AND dt.template_code = 'DOC_293_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-377' AND dt.template_code = 'DOC_293_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-378' AND dt.template_code = 'DOC_293_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-379' AND dt.template_code = 'DOC_294_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-380' AND dt.template_code = 'DOC_295_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-381' AND dt.template_code = 'DOC_292_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-382' AND dt.template_code = 'DOC_292_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-383' AND dt.template_code = 'DOC_296_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-384' AND dt.template_code = 'DOC_288_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-385' AND dt.template_code = 'DOC_297_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-386' AND dt.template_code = 'DOC_298_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-387' AND dt.template_code = 'DOC_298_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-398' AND dt.template_code = 'DOC_299_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-399' AND dt.template_code = 'DOC_300_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-400' AND dt.template_code = 'DOC_301_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-401' AND dt.template_code = 'DOC_302_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-402' AND dt.template_code = 'DOC_303_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-403' AND dt.template_code = 'DOC_304_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-404' AND dt.template_code = 'DOC_305_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-405' AND dt.template_code = 'DOC_306_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-406' AND dt.template_code = 'DOC_307_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-407' AND dt.template_code = 'DOC_308_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-408' AND dt.template_code = 'DOC_309_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-409' AND dt.template_code = 'DOC_310_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-410' AND dt.template_code = 'DOC_311_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-410' AND dt.template_code = 'DOC_312_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-410' AND dt.template_code = 'DOC_313_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-410' AND dt.template_code = 'DOC_314_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-410' AND dt.template_code = 'DOC_315_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-411' AND dt.template_code = 'DOC_316_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-411' AND dt.template_code = 'DOC_317_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-411' AND dt.template_code = 'DOC_318_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-411' AND dt.template_code = 'DOC_319_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-411' AND dt.template_code = 'DOC_315_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-412' AND dt.template_code = 'DOC_320_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-412' AND dt.template_code = 'DOC_321_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-412' AND dt.template_code = 'DOC_322_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-412' AND dt.template_code = 'DOC_323_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-412' AND dt.template_code = 'DOC_324_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-413' AND dt.template_code = 'DOC_325_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-413' AND dt.template_code = 'DOC_326_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-413' AND dt.template_code = 'DOC_327_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-413' AND dt.template_code = 'DOC_328_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-413' AND dt.template_code = 'DOC_329_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-414' AND dt.template_code = 'DOC_330_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-414' AND dt.template_code = 'DOC_331_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-414' AND dt.template_code = 'DOC_332_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-414' AND dt.template_code = 'DOC_333_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-414' AND dt.template_code = 'DOC_334_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-415' AND dt.template_code = 'DOC_335_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-415' AND dt.template_code = 'DOC_336_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-415' AND dt.template_code = 'DOC_337_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-415' AND dt.template_code = 'DOC_338_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-415' AND dt.template_code = 'DOC_339_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-416' AND dt.template_code = 'DOC_340_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-416' AND dt.template_code = 'DOC_341_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-416' AND dt.template_code = 'DOC_342_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-416' AND dt.template_code = 'DOC_334_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-416' AND dt.template_code = 'DOC_343_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-417' AND dt.template_code = 'DOC_340_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-417' AND dt.template_code = 'DOC_341_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-417' AND dt.template_code = 'DOC_342_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-417' AND dt.template_code = 'DOC_344_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-417' AND dt.template_code = 'DOC_345_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-418' AND dt.template_code = 'DOC_346_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-418' AND dt.template_code = 'DOC_347_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-418' AND dt.template_code = 'DOC_348_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-418' AND dt.template_code = 'DOC_349_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-418' AND dt.template_code = 'DOC_350_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-419' AND dt.template_code = 'DOC_351_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-419' AND dt.template_code = 'DOC_347_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-419' AND dt.template_code = 'DOC_352_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-419' AND dt.template_code = 'DOC_353_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-419' AND dt.template_code = 'DOC_354_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-420' AND dt.template_code = 'DOC_355_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-420' AND dt.template_code = 'DOC_341_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-420' AND dt.template_code = 'DOC_356_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-420' AND dt.template_code = 'DOC_357_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-420' AND dt.template_code = 'DOC_358_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-421' AND dt.template_code = 'DOC_359_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-421' AND dt.template_code = 'DOC_360_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-421' AND dt.template_code = 'DOC_361_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-421' AND dt.template_code = 'DOC_362_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-421' AND dt.template_code = 'DOC_363_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-422' AND dt.template_code = 'DOC_361_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-422' AND dt.template_code = 'DOC_364_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-422' AND dt.template_code = 'DOC_365_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-422' AND dt.template_code = 'DOC_344_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-422' AND dt.template_code = 'DOC_354_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-423' AND dt.template_code = 'DOC_366_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-423' AND dt.template_code = 'DOC_367_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-423' AND dt.template_code = 'DOC_368_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-423' AND dt.template_code = 'DOC_369_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-423' AND dt.template_code = 'DOC_370_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-424' AND dt.template_code = 'DOC_371_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-424' AND dt.template_code = 'DOC_372_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-424' AND dt.template_code = 'DOC_373_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-424' AND dt.template_code = 'DOC_374_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-424' AND dt.template_code = 'DOC_375_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-425' AND dt.template_code = 'DOC_376_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-425' AND dt.template_code = 'DOC_377_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-425' AND dt.template_code = 'DOC_378_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-425' AND dt.template_code = 'DOC_379_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-425' AND dt.template_code = 'DOC_361_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-426' AND dt.template_code = 'DOC_380_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-426' AND dt.template_code = 'DOC_377_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-426' AND dt.template_code = 'DOC_381_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-426' AND dt.template_code = 'DOC_361_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-426' AND dt.template_code = 'DOC_379_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-427' AND dt.template_code = 'DOC_382_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-427' AND dt.template_code = 'DOC_377_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-427' AND dt.template_code = 'DOC_378_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-427' AND dt.template_code = 'DOC_383_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-427' AND dt.template_code = 'DOC_379_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-428' AND dt.template_code = 'DOC_380_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-428' AND dt.template_code = 'DOC_377_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-428' AND dt.template_code = 'DOC_381_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-428' AND dt.template_code = 'DOC_383_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-428' AND dt.template_code = 'DOC_379_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-429' AND dt.template_code = 'DOC_384_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-429' AND dt.template_code = 'DOC_377_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-429' AND dt.template_code = 'DOC_385_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-429' AND dt.template_code = 'DOC_361_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-429' AND dt.template_code = 'DOC_379_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-430' AND dt.template_code = 'DOC_382_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-430' AND dt.template_code = 'DOC_377_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-430' AND dt.template_code = 'DOC_378_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-430' AND dt.template_code = 'DOC_386_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-430' AND dt.template_code = 'DOC_379_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-431' AND dt.template_code = 'DOC_387_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-431' AND dt.template_code = 'DOC_377_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-431' AND dt.template_code = 'DOC_381_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-431' AND dt.template_code = 'DOC_361_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-431' AND dt.template_code = 'DOC_379_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-432' AND dt.template_code = 'DOC_384_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-432' AND dt.template_code = 'DOC_377_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-432' AND dt.template_code = 'DOC_385_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-432' AND dt.template_code = 'DOC_386_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-432' AND dt.template_code = 'DOC_379_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-433' AND dt.template_code = 'DOC_382_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-433' AND dt.template_code = 'DOC_377_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-433' AND dt.template_code = 'DOC_378_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-433' AND dt.template_code = 'DOC_388_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-433' AND dt.template_code = 'DOC_379_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-434' AND dt.template_code = 'DOC_389_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-434' AND dt.template_code = 'DOC_377_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-434' AND dt.template_code = 'DOC_381_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-434' AND dt.template_code = 'DOC_361_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-434' AND dt.template_code = 'DOC_379_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-435' AND dt.template_code = 'DOC_384_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-435' AND dt.template_code = 'DOC_377_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-435' AND dt.template_code = 'DOC_385_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-435' AND dt.template_code = 'DOC_388_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-435' AND dt.template_code = 'DOC_379_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-436' AND dt.template_code = 'DOC_390_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-436' AND dt.template_code = 'DOC_361_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-436' AND dt.template_code = 'DOC_377_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-436' AND dt.template_code = 'DOC_378_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-436' AND dt.template_code = 'DOC_391_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-437' AND dt.template_code = 'DOC_390_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-437' AND dt.template_code = 'DOC_361_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-437' AND dt.template_code = 'DOC_377_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-437' AND dt.template_code = 'DOC_378_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-437' AND dt.template_code = 'DOC_363_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-438' AND dt.template_code = 'DOC_392_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-438' AND dt.template_code = 'DOC_361_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-438' AND dt.template_code = 'DOC_377_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-438' AND dt.template_code = 'DOC_378_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-438' AND dt.template_code = 'DOC_393_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-439' AND dt.template_code = 'DOC_394_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-439' AND dt.template_code = 'DOC_361_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-439' AND dt.template_code = 'DOC_377_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-439' AND dt.template_code = 'DOC_378_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-439' AND dt.template_code = 'DOC_395_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-440' AND dt.template_code = 'DOC_396_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-440' AND dt.template_code = 'DOC_361_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-440' AND dt.template_code = 'DOC_377_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-440' AND dt.template_code = 'DOC_378_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-440' AND dt.template_code = 'DOC_397_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-441' AND dt.template_code = 'DOC_398_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-441' AND dt.template_code = 'DOC_361_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-441' AND dt.template_code = 'DOC_377_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-441' AND dt.template_code = 'DOC_378_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-441' AND dt.template_code = 'DOC_399_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-442' AND dt.template_code = 'DOC_400_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-442' AND dt.template_code = 'DOC_361_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-442' AND dt.template_code = 'DOC_377_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-442' AND dt.template_code = 'DOC_378_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-442' AND dt.template_code = 'DOC_401_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-443' AND dt.template_code = 'DOC_402_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-443' AND dt.template_code = 'DOC_361_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-443' AND dt.template_code = 'DOC_377_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-443' AND dt.template_code = 'DOC_378_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-443' AND dt.template_code = 'DOC_403_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-444' AND dt.template_code = 'DOC_404_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-444' AND dt.template_code = 'DOC_405_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-444' AND dt.template_code = 'DOC_327_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-444' AND dt.template_code = 'DOC_328_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-444' AND dt.template_code = 'DOC_329_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-445' AND dt.template_code = 'DOC_406_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-445' AND dt.template_code = 'DOC_331_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-445' AND dt.template_code = 'DOC_332_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-445' AND dt.template_code = 'DOC_333_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-445' AND dt.template_code = 'DOC_339_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-446' AND dt.template_code = 'DOC_335_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-446' AND dt.template_code = 'DOC_336_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-446' AND dt.template_code = 'DOC_337_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-446' AND dt.template_code = 'DOC_338_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-446' AND dt.template_code = 'DOC_407_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-447' AND dt.template_code = 'DOC_377_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-447' AND dt.template_code = 'DOC_408_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-447' AND dt.template_code = 'DOC_409_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-447' AND dt.template_code = 'DOC_378_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-447' AND dt.template_code = 'DOC_410_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-448' AND dt.template_code = 'DOC_411_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-448' AND dt.template_code = 'DOC_412_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-448' AND dt.template_code = 'DOC_377_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-448' AND dt.template_code = 'DOC_378_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-448' AND dt.template_code = 'DOC_413_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-449' AND dt.template_code = 'DOC_359_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-449' AND dt.template_code = 'DOC_414_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-449' AND dt.template_code = 'DOC_377_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-449' AND dt.template_code = 'DOC_378_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-449' AND dt.template_code = 'DOC_415_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-450' AND dt.template_code = 'DOC_416_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-450' AND dt.template_code = 'DOC_409_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-450' AND dt.template_code = 'DOC_377_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-450' AND dt.template_code = 'DOC_378_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-450' AND dt.template_code = 'DOC_417_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-451' AND dt.template_code = 'DOC_416_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-451' AND dt.template_code = 'DOC_409_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-451' AND dt.template_code = 'DOC_377_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-451' AND dt.template_code = 'DOC_378_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-451' AND dt.template_code = 'DOC_417_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-452' AND dt.template_code = 'DOC_418_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-452' AND dt.template_code = 'DOC_419_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-452' AND dt.template_code = 'DOC_377_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-452' AND dt.template_code = 'DOC_378_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-452' AND dt.template_code = 'DOC_420_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-453' AND dt.template_code = 'DOC_421_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-453' AND dt.template_code = 'DOC_422_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-453' AND dt.template_code = 'DOC_377_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-453' AND dt.template_code = 'DOC_378_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-453' AND dt.template_code = 'DOC_423_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-454' AND dt.template_code = 'DOC_359_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-454' AND dt.template_code = 'DOC_414_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-454' AND dt.template_code = 'DOC_377_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-454' AND dt.template_code = 'DOC_378_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-454' AND dt.template_code = 'DOC_424_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-455' AND dt.template_code = 'DOC_425_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-455' AND dt.template_code = 'DOC_426_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-455' AND dt.template_code = 'DOC_377_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-455' AND dt.template_code = 'DOC_378_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-455' AND dt.template_code = 'DOC_427_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-456' AND dt.template_code = 'DOC_428_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-456' AND dt.template_code = 'DOC_359_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-456' AND dt.template_code = 'DOC_429_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-456' AND dt.template_code = 'DOC_378_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-456' AND dt.template_code = 'DOC_430_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-457' AND dt.template_code = 'DOC_431_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-457' AND dt.template_code = 'DOC_432_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-457' AND dt.template_code = 'DOC_433_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-457' AND dt.template_code = 'DOC_378_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-457' AND dt.template_code = 'DOC_434_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-458' AND dt.template_code = 'DOC_435_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-458' AND dt.template_code = 'DOC_436_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-458' AND dt.template_code = 'DOC_437_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-458' AND dt.template_code = 'DOC_378_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-458' AND dt.template_code = 'DOC_312_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-459' AND dt.template_code = 'DOC_341_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-459' AND dt.template_code = 'DOC_438_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-459' AND dt.template_code = 'DOC_320_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-459' AND dt.template_code = 'DOC_378_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-459' AND dt.template_code = 'DOC_439_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-460' AND dt.template_code = 'DOC_440_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-460' AND dt.template_code = 'DOC_441_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-460' AND dt.template_code = 'DOC_442_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-460' AND dt.template_code = 'DOC_378_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-460' AND dt.template_code = 'DOC_443_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-461' AND dt.template_code = 'DOC_444_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-461' AND dt.template_code = 'DOC_314_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-461' AND dt.template_code = 'DOC_445_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-461' AND dt.template_code = 'DOC_378_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-461' AND dt.template_code = 'DOC_446_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-462' AND dt.template_code = 'DOC_447_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-462' AND dt.template_code = 'DOC_448_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-462' AND dt.template_code = 'DOC_449_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-462' AND dt.template_code = 'DOC_450_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-462' AND dt.template_code = 'DOC_451_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-465' AND dt.template_code = 'DOC_452_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-465' AND dt.template_code = 'DOC_448_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-465' AND dt.template_code = 'DOC_453_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-465' AND dt.template_code = 'DOC_454_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-465' AND dt.template_code = 'DOC_455_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-548' AND dt.template_code = 'DOC_452_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-548' AND dt.template_code = 'DOC_448_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-548' AND dt.template_code = 'DOC_453_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-548' AND dt.template_code = 'DOC_454_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-548' AND dt.template_code = 'DOC_455_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-466' AND dt.template_code = 'DOC_456_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-466' AND dt.template_code = 'DOC_448_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-466' AND dt.template_code = 'DOC_453_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-466' AND dt.template_code = 'DOC_454_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-466' AND dt.template_code = 'DOC_457_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-549' AND dt.template_code = 'DOC_456_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-549' AND dt.template_code = 'DOC_448_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-549' AND dt.template_code = 'DOC_453_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-549' AND dt.template_code = 'DOC_454_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-549' AND dt.template_code = 'DOC_457_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-467' AND dt.template_code = 'DOC_458_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-467' AND dt.template_code = 'DOC_448_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-467' AND dt.template_code = 'DOC_459_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-467' AND dt.template_code = 'DOC_454_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-467' AND dt.template_code = 'DOC_460_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-550' AND dt.template_code = 'DOC_458_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-550' AND dt.template_code = 'DOC_448_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-550' AND dt.template_code = 'DOC_459_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-550' AND dt.template_code = 'DOC_454_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-550' AND dt.template_code = 'DOC_460_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-468' AND dt.template_code = 'DOC_461_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-468' AND dt.template_code = 'DOC_448_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-468' AND dt.template_code = 'DOC_462_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-468' AND dt.template_code = 'DOC_454_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-468' AND dt.template_code = 'DOC_463_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-551' AND dt.template_code = 'DOC_461_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-551' AND dt.template_code = 'DOC_448_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-551' AND dt.template_code = 'DOC_462_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-551' AND dt.template_code = 'DOC_454_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-551' AND dt.template_code = 'DOC_463_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-463' AND dt.template_code = 'DOC_464_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-463' AND dt.template_code = 'DOC_448_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-463' AND dt.template_code = 'DOC_465_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-463' AND dt.template_code = 'DOC_466_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-463' AND dt.template_code = 'DOC_467_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-464' AND dt.template_code = 'DOC_468_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-464' AND dt.template_code = 'DOC_448_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-464' AND dt.template_code = 'DOC_453_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-464' AND dt.template_code = 'DOC_454_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-464' AND dt.template_code = 'DOC_455_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-469' AND dt.template_code = 'DOC_469_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-469' AND dt.template_code = 'DOC_448_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-469' AND dt.template_code = 'DOC_459_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-469' AND dt.template_code = 'DOC_454_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-469' AND dt.template_code = 'DOC_470_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-470' AND dt.template_code = 'DOC_471_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-470' AND dt.template_code = 'DOC_448_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-470' AND dt.template_code = 'DOC_472_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-470' AND dt.template_code = 'DOC_454_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-470' AND dt.template_code = 'DOC_378_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-471' AND dt.template_code = 'DOC_473_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-471' AND dt.template_code = 'DOC_448_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-471' AND dt.template_code = 'DOC_454_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-471' AND dt.template_code = 'DOC_378_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-471' AND dt.template_code = 'DOC_474_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-472' AND dt.template_code = 'DOC_377_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-472' AND dt.template_code = 'DOC_448_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-472' AND dt.template_code = 'DOC_475_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-472' AND dt.template_code = 'DOC_378_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-472' AND dt.template_code = 'DOC_476_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-473' AND dt.template_code = 'DOC_477_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-473' AND dt.template_code = 'DOC_448_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-473' AND dt.template_code = 'DOC_478_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-473' AND dt.template_code = 'DOC_378_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-473' AND dt.template_code = 'DOC_479_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-474' AND dt.template_code = 'DOC_480_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-474' AND dt.template_code = 'DOC_448_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-474' AND dt.template_code = 'DOC_481_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-474' AND dt.template_code = 'DOC_378_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-474' AND dt.template_code = 'DOC_453_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-475' AND dt.template_code = 'DOC_482_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-475' AND dt.template_code = 'DOC_448_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-475' AND dt.template_code = 'DOC_472_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-475' AND dt.template_code = 'DOC_483_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-475' AND dt.template_code = 'DOC_484_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-476' AND dt.template_code = 'DOC_482_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-476' AND dt.template_code = 'DOC_448_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-476' AND dt.template_code = 'DOC_472_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-476' AND dt.template_code = 'DOC_485_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-476' AND dt.template_code = 'DOC_484_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-477' AND dt.template_code = 'DOC_486_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-477' AND dt.template_code = 'DOC_448_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-477' AND dt.template_code = 'DOC_487_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-477' AND dt.template_code = 'DOC_488_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-477' AND dt.template_code = 'DOC_378_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-478' AND dt.template_code = 'DOC_489_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-478' AND dt.template_code = 'DOC_448_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-478' AND dt.template_code = 'DOC_490_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-478' AND dt.template_code = 'DOC_491_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-478' AND dt.template_code = 'DOC_378_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-479' AND dt.template_code = 'DOC_486_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-479' AND dt.template_code = 'DOC_448_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-479' AND dt.template_code = 'DOC_377_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-479' AND dt.template_code = 'DOC_492_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-479' AND dt.template_code = 'DOC_378_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-480' AND dt.template_code = 'DOC_448_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-480' AND dt.template_code = 'DOC_493_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-480' AND dt.template_code = 'DOC_494_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-480' AND dt.template_code = 'DOC_495_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-480' AND dt.template_code = 'DOC_378_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-481' AND dt.template_code = 'DOC_496_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-481' AND dt.template_code = 'DOC_497_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-481' AND dt.template_code = 'DOC_498_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-481' AND dt.template_code = 'DOC_499_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-481' AND dt.template_code = 'DOC_378_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-482' AND dt.template_code = 'DOC_448_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-482' AND dt.template_code = 'DOC_377_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-482' AND dt.template_code = 'DOC_454_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-482' AND dt.template_code = 'DOC_500_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-482' AND dt.template_code = 'DOC_378_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-483' AND dt.template_code = 'DOC_501_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-483' AND dt.template_code = 'DOC_502_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-483' AND dt.template_code = 'DOC_503_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-483' AND dt.template_code = 'DOC_328_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-483' AND dt.template_code = 'DOC_504_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-484' AND dt.template_code = 'DOC_505_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-484' AND dt.template_code = 'DOC_506_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-484' AND dt.template_code = 'DOC_507_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-484' AND dt.template_code = 'DOC_508_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-484' AND dt.template_code = 'DOC_312_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-485' AND dt.template_code = 'DOC_320_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-485' AND dt.template_code = 'DOC_509_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-485' AND dt.template_code = 'DOC_510_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-485' AND dt.template_code = 'DOC_511_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-485' AND dt.template_code = 'DOC_512_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-486' AND dt.template_code = 'DOC_513_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-486' AND dt.template_code = 'DOC_324_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-486' AND dt.template_code = 'DOC_514_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-486' AND dt.template_code = 'DOC_515_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-486' AND dt.template_code = 'DOC_516_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-487' AND dt.template_code = 'DOC_517_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-487' AND dt.template_code = 'DOC_448_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-487' AND dt.template_code = 'DOC_518_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-487' AND dt.template_code = 'DOC_352_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-487' AND dt.template_code = 'DOC_495_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-488' AND dt.template_code = 'DOC_434_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-488' AND dt.template_code = 'DOC_519_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-488' AND dt.template_code = 'DOC_520_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-488' AND dt.template_code = 'DOC_311_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-488' AND dt.template_code = 'DOC_521_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-489' AND dt.template_code = 'DOC_434_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-489' AND dt.template_code = 'DOC_519_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-489' AND dt.template_code = 'DOC_522_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-489' AND dt.template_code = 'DOC_440_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-489' AND dt.template_code = 'DOC_523_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-490' AND dt.template_code = 'DOC_524_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-490' AND dt.template_code = 'DOC_519_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-490' AND dt.template_code = 'DOC_509_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-490' AND dt.template_code = 'DOC_525_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-490' AND dt.template_code = 'DOC_521_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-491' AND dt.template_code = 'DOC_320_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-491' AND dt.template_code = 'DOC_509_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-491' AND dt.template_code = 'DOC_526_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-491' AND dt.template_code = 'DOC_527_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-491' AND dt.template_code = 'DOC_528_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-492' AND dt.template_code = 'DOC_449_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-492' AND dt.template_code = 'DOC_448_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-492' AND dt.template_code = 'DOC_529_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-492' AND dt.template_code = 'DOC_467_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-492' AND dt.template_code = 'DOC_378_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-493' AND dt.template_code = 'DOC_530_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-493' AND dt.template_code = 'DOC_448_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-493' AND dt.template_code = 'DOC_531_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-493' AND dt.template_code = 'DOC_466_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-493' AND dt.template_code = 'DOC_378_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-494' AND dt.template_code = 'DOC_532_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-494' AND dt.template_code = 'DOC_485_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-494' AND dt.template_code = 'DOC_533_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

INSERT INTO service_document_assignments (fiscal_service_id, document_template_id, is_required_expedition, is_required_renewal, display_order, assigned_at)
SELECT fs.id, dt.id, true, false, 1, NOW()
FROM fiscal_services fs, document_templates dt
WHERE fs.service_code = 'T-494' AND dt.template_code = 'DOC_466_____________'
ON CONFLICT (fiscal_service_id, document_template_id) DO NOTHING;

COMMIT;
