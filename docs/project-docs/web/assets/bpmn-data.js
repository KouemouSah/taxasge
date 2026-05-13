window.BPMN_DATA = {
  "meta": {
    "version": "2.0",
    "source": "03-BPMN_PROCESSES.md + bpmn/*.mmd",
    "generated": "2026-05-11",
    "total_diagrams": 17
  },
  "workflows": [
    {
      "id": "01-declaration-iva",
      "number": "01",
      "name": "Déclaration fiscale IVA",
      "category": "process",
      "objective": "Permettre à un contribuable de soumettre sa déclaration TVA (IVA Destajo ou IVA Real), la faire valider par la DGI et obtenir un avis de paiement.",
      "actors": [
        "citizen",
        "business",
        "dgi_agent",
        "transverse"
      ],
      "actor_labels": [
        "Citoyen / Business",
        "Système Facil",
        "Agent DGI"
      ],
      "mermaid_file": "../bpmn/01-declaration-iva.mmd",
      "status": "implemented",
      "volume": "90% du volume déclarations",
      "sla": "Décision < 10 jours ouvrés",
      "kpis": [
        "Taux acceptation",
        "Durée moyenne review",
        "Taux amendement"
      ],
      "tables": [
        "tax_declarations",
        "declaration_iva_details",
        "declaration_corrections",
        "workflow_transitions"
      ],
      "enums": [
        "declaration_status_enum",
        "declaration_type_enum (34)"
      ],
      "code_refs": [
        "packages/backend/app/modules/declarations/services/declaration_service.py",
        "packages/backend/app/modules/declarations/models/declaration.py",
        "packages/backend/app/modules/declarations/api/declaration_routes.py"
      ],
      "linked_user_stories": [
        "US-002",
        "US-009",
        "US-012",
        "US-014"
      ],
      "mermaid_content": "%% ==========================================================================\n%% PROCESSUS BPMN — Déclaration fiscale IVA (Impuesto sobre el Valor Añadido)\n%% Statut: IMPLEMENTÉ (90% du volume déclarations)\n%% Référence code: packages/backend/app/modules/declarations/\n%%   - services/declaration_service.py\n%%   - models/declaration.py (DeclarationStatus, DeclarationType)\n%%   - api/declaration_routes.py\n%% Tables: tax_declarations, declaration_iva_details\n%% ==========================================================================\nflowchart TD\n    Start([Début — fin de période fiscale]) --> Choix{Type contribuable}\n\n    subgraph Citoyen_Business\n      Choix -->|Personne physique| Connect1[Connexion + 2FA]\n      Choix -->|Entreprise / Comptable| Connect2[Connexion + 2FA + sélection société]\n      Connect1 --> Form[Saisie formulaire IVA]\n      Connect2 --> Form\n      Form --> Type{Type IVA?}\n      Type -->|IVA Destajo| Destajo[Saisie chiffre affaires forfaitaire]\n      Type -->|IVA Real| Real[Saisie ventes + achats détaillés]\n      Destajo --> Calcul\n      Real --> Calcul\n    end\n\n    subgraph Système_Facil\n      Calcul[Calcul automatique base imposable + TVA]\n      Calcul --> Save[Sauvegarde brouillon - status=DRAFT]\n      Save --> Submit{Soumettre?}\n      Submit -->|Non| End1([Reste en DRAFT])\n      Submit -->|Oui| Validate[Validation Pydantic + règles fiscales]\n      Validate -->|Erreur| FormError[Retour erreurs au formulaire]\n      FormError --> Form\n      Validate -->|OK| StatusSub[status=SUBMITTED + audit_log]\n      StatusSub --> Auto[Auto-assignment via assignment_service]\n      Auto --> Notif[Notification multi-canal email + push]\n    end\n\n    subgraph Agent_DGI\n      Notif --> AssignAgent[Agent reçoit dans agent_work_queue]\n      AssignAgent --> Lock[Lock dossier via assignments table]\n      Lock --> Status1[status=PROCESSING]\n      Status1 --> Review[Review déclaration + pièces jointes]\n      Review --> Decision{Décision?}\n      Decision -->|Conforme| Accept[status=ACCEPTED]\n      Decision -->|Non conforme| Reject[status=REJECTED + motif]\n      Decision -->|Demande correction| Corr[status=AMENDED + commentaires]\n    end\n\n    subgraph Système_Post\n      Accept --> NotifAccept[Notif citoyen + génération avis paiement]\n      Reject --> NotifReject[Notif citoyen + recours possible]\n      Corr --> NotifCorr[Notif citoyen pour amendement]\n      NotifAccept --> AuditFinal[audit_logs append append-only]\n      NotifReject --> AuditFinal\n      NotifCorr --> AuditFinal\n    end\n\n    AuditFinal --> End2([Fin processus déclaration])\n\n    style Start fill:#90EE90\n    style End1 fill:#FFD700\n    style End2 fill:#FF6B6B\n    style Decision fill:#FFA500\n    style Type fill:#FFA500\n    style Submit fill:#FFA500\n    style Choix fill:#FFA500\n"
    },
    {
      "id": "02-inspection-field-payment",
      "number": "02",
      "name": "Inspection terrain + paiement collecte",
      "category": "process",
      "objective": "Permettre à un agent municipal en mission d'inspecter un commerce, constater les obligations dues et encaisser le paiement sur place avec validation supervisor.",
      "actors": [
        "dgi_agent",
        "supervisor",
        "transverse"
      ],
      "actor_labels": [
        "Agent Inspector",
        "Système Facil",
        "Supervisor"
      ],
      "mermaid_file": "../bpmn/02-inspection-field-payment.mmd",
      "status": "partial",
      "volume": "100+ agents concurrents validé en charge synthétique",
      "sla": "Lock hold < 150ms, transaction < 800ms",
      "kpis": [
        "Concurrence soutenable",
        "UniqueViolation rate",
        "Supervisor validation < 4h"
      ],
      "tables": [
        "commercial_licenses",
        "license_obligations",
        "field_inspections",
        "service_payments",
        "service_requests",
        "license_compliance_events"
      ],
      "enums": [
        "payment_workflow_status (17)",
        "inspection_status_enum"
      ],
      "code_refs": [
        "packages/backend/app/modules/inspections/services/collection_service.py",
        "packages/backend/app/modules/inspections/services/inspection_service.py",
        "packages/backend/app/modules/inspections/services/mission_auto_assigner.py"
      ],
      "linked_user_stories": [
        "US-016"
      ],
      "mermaid_content": "%% ==========================================================================\n%% PROCESSUS BPMN — Inspection terrain + Paiement collecte sur place\n%% Statut: IMPLEMENTÉ (workflow le plus complexe — bundle commercial license)\n%% Référence code: packages/backend/app/modules/inspections/services/collection_service.py\n%% Lock ordering canonique (CLAUDE.md):\n%%   1. commercial_licenses (FOR UPDATE — root)\n%%   2. service_requests (INSERT optimiste, partial UNIQUE index)\n%%   3. license_obligations (UPDATE batch)\n%%   4. service_payments (INSERT)\n%% Timeouts transaction: lock_timeout=3s, statement_timeout=5s\n%% ==========================================================================\nflowchart TD\n    Start([Début — agent en mission terrain]) --> Auth\n\n    subgraph Agent_Inspector_Mobile\n      Auth[Authentification + 2FA + scope OMS]\n      Auth --> SelectMission[Sélection mission assignée]\n      SelectMission --> SelectCompany[Sélection commerce inspecté]\n      SelectCompany --> ScanLicense[Scan/saisie licence + cycle fiscal]\n      ScanLicense --> ListObl[Affichage obligations license_obligations]\n      ListObl --> SelectObl[Sélection obligations à payer]\n      SelectObl --> Method{Méthode?}\n      Method -->|Mobile Money| Phone[Saisie numéro téléphone]\n      Method -->|Cash| Receipt[Préparation reçu papier]\n      Phone --> Confirm[Confirmation montant total]\n      Receipt --> Confirm\n      Confirm --> Submit[POST /inspections/collect]\n    end\n\n    subgraph Système_Facil_Transaction\n      Submit --> ValOwn[OWASP A01: agent_id == inspection.agent_id?]\n      ValOwn -->|Non| Err1[403 Forbidden]\n      ValOwn -->|Oui| ValDouble[OWASP A04: payment_collected déjà true?]\n      ValDouble -->|Oui| Err2[Erreur double paiement]\n      ValDouble -->|Non| TxStart[BEGIN TRANSACTION]\n      TxStart --> SetTimeout[SET LOCAL lock_timeout=3s, statement_timeout=5s]\n      SetTimeout --> ValObl[Validation obligations payable + scope OMS]\n      ValObl --> ValAmount[OWASP A03: somme amount + penalty == reçu?]\n      ValAmount -->|Non| Rollback1[ROLLBACK + erreur]\n      ValAmount -->|Oui| Lock1[1 SELECT commercial_licenses FOR UPDATE]\n      Lock1 --> FindOwner[Recherche company_owner via user_company_roles]\n      FindOwner --> Lazy[2 INSERT or REUSE service_request 1:1]\n      Lazy -->|UniqueViolation| Recovery[SELECT existing par commercial_license_id]\n      Lazy -->|OK| InsertSP[3 INSERT service_payment workflow_status=field_collected]\n      Recovery --> InsertSP\n      InsertSP --> UpdObl[4 UPDATE license_obligations SET status=payment_pending]\n      UpdObl --> UpdInsp[UPDATE field_inspections payment_collected=true]\n      UpdInsp --> Audit[INSERT license_compliance_events event=payment_initiated]\n      Audit --> Commit[COMMIT TRANSACTION]\n    end\n\n    subgraph Post_Transaction\n      Commit --> EventBus[EventBus.PAYMENT_CASH_PENDING fire-and-forget]\n      EventBus --> AuditLog[INSERT audit_logs FIELD_COLLECTION best-effort]\n      AuditLog --> NotifSup[Notification supervisor pour validation]\n    end\n\n    subgraph Supervisor\n      NotifSup --> SupReview[Supervisor review reçu + matching]\n      SupReview --> SupDec{Validation?}\n      SupDec -->|Approuvé| Validate[POST /inspections/reconcile/supervisor/id/validate]\n      SupDec -->|Rejeté| Reject[Rollback obligations vers pending]\n      Validate --> OnPaid[LicenseService.on_payment_completed]\n      OnPaid --> ObPaid[license_obligations.status=paid]\n      ObPaid --> RouteMin[Routing montants vers ministères concernés]\n    end\n\n    RouteMin --> End1([Fin — paiement validé])\n    Reject --> End2([Fin — paiement rejeté])\n    Err1 --> EndErr([Fin erreur])\n    Err2 --> EndErr\n    Rollback1 --> EndErr\n\n    style Start fill:#90EE90\n    style End1 fill:#90EE90\n    style End2 fill:#FFD700\n    style EndErr fill:#FF6B6B\n    style Lock1 fill:#FFB6C1\n    style Lazy fill:#FFB6C1\n    style InsertSP fill:#FFB6C1\n    style UpdObl fill:#FFB6C1\n    style ValOwn fill:#FFA500\n    style ValAmount fill:#FFA500\n    style ValDouble fill:#FFA500\n    style Method fill:#FFA500\n    style SupDec fill:#FFA500\n"
    },
    {
      "id": "03-citizen-service-request",
      "number": "03",
      "name": "Demande de service citoyen",
      "category": "process",
      "objective": "Permettre à un citoyen de demander un service administratif (passeport, résidence, permis conduire, etc.) à travers un wizard multi-étapes avec upload, paiement et délivrance.",
      "actors": [
        "citizen",
        "dgi_agent",
        "transverse"
      ],
      "actor_labels": [
        "Citoyen",
        "Système Facil",
        "Agent Entité (CNEDOGE/EXTRANJERIA/DGT/ONRC/MINFP)"
      ],
      "mermaid_file": "../bpmn/03-citizen-service-request.mmd",
      "status": "implemented",
      "volume": "28 workflows enregistrés (passeport 5, résidence 2, vehiculo 7, contrato 7, conducir 5, función pública 5, bundle 1)",
      "sla": "Décision < 5 jours ouvrés",
      "kpis": [
        "Taux complétion par workflow_code",
        "Taux DOCS_REQUESTED",
        "Taux EXPIRED"
      ],
      "tables": [
        "service_requests",
        "uploaded_files",
        "assignments",
        "agent_work_queue",
        "appointments"
      ],
      "enums": [
        "service_request_status_enum (19)",
        "service_request_priority_enum",
        "workflow_code (28)"
      ],
      "code_refs": [
        "packages/backend/app/modules/service_requests/services/service_request_service.py",
        "packages/backend/app/modules/service_requests/services/workflow_engine.py",
        "packages/backend/app/modules/service_requests/workflows/"
      ],
      "linked_user_stories": [
        "US-004",
        "US-006",
        "US-013",
        "US-014"
      ],
      "mermaid_content": "%% ==========================================================================\n%% PROCESSUS BPMN — Demande de service citoyen (passeport, résidence, conducir, etc.)\n%% Statut: IMPLEMENTÉ (28 workflows enregistrés via WorkflowEngine)\n%% Référence code: packages/backend/app/modules/service_requests/services/\n%%   - service_request_service.py\n%%   - workflow_engine.py\n%%   - workflows/*.py (pasaporte_workflow_v2, conducir_workflow, etc.)\n%% Tables: service_requests, uploaded_files, document_processing_queue\n%% ==========================================================================\nflowchart TD\n    Start([Citoyen — Démarrage demande]) --> Browse\n\n    subgraph Citoyen\n      Browse[Navigue catalogue 850+ services]\n      Browse --> Select[Sélection service ex: passeport]\n      Select --> Wizard[Wizard de saisie multi-étapes]\n      Wizard --> Step0[Étape 0: identification + type solicitud]\n      Step0 --> Step1[Étape 1: upload documents requis]\n      Step1 --> Preview[Preview extraction OCR/AI]\n      Preview --> CheckExt{Extraction correcte?}\n      CheckExt -->|Non| EditExt[Correction manuelle des champs]\n      CheckExt -->|Oui| Step2[Étape 2: revue formulaire]\n      EditExt --> Step2\n      Step2 --> Step3[Étape 3: paiement timbres si requis]\n      Step3 --> Step4[Étape 4: confirmation finale]\n    end\n\n    subgraph Système_Facil\n      Step4 --> CreateSR[create_request — INSERT service_requests status=DRAFT]\n      CreateSR --> ValidateDocs[Validation documents requis présents]\n      ValidateDocs -->|Manquants| MissDocs[status=DOCUMENTS_REQUIRED]\n      MissDocs --> Notif1[Notif citoyen]\n      ValidateDocs -->|OK| HasTimbres{Tarif timbres > 0?}\n      HasTimbres -->|Oui| StTPending[status=TIMBRES_PENDING]\n      HasTimbres -->|Non| StSubmitted[status=SUBMITTED]\n      StTPending --> WaitTimbre[Attente paiement timbres]\n      WaitTimbre --> Paid[status=TIMBRES_PAID]\n      Paid --> StSubmitted\n      StSubmitted --> AutoAssign[Auto-assignment AutoAssignmentService]\n      AutoAssign --> Queue[Insert agent_work_queue + assignments]\n    end\n\n    subgraph Agent_Entité\n      Queue --> AgentReceive[Agent reçoit dans dashboard work_queue]\n      AgentReceive --> AgentLock[status=UNDER_REVIEW + assigned_to]\n      AgentLock --> AgentReview[Agent review documents + données]\n      AgentReview --> AgentDec{Décision?}\n      AgentDec -->|OK| StValid[status=DOSSIER_VALIDE]\n      AgentDec -->|Docs manquants| ReqDoc[status=DOCUMENTS_REQUIRED + agent_work_queue.status=waiting_documents]\n      AgentDec -->|Rejeté| StRej[status=REJECTED + motif]\n      AgentDec -->|Escalade| StEsc[status=UNDER_REVIEW + escalation_level]\n    end\n\n    subgraph Phase_Paiement\n      StValid --> NotaCheck{Requires nota_ingreso?}\n      NotaCheck -->|Oui| StNotaPending[status=PENDING_NOTA_INGRESO]\n      NotaCheck -->|Non| StPayPending[status=PAYMENT_PENDING]\n      StNotaPending --> NotaUp[Upload nota par contribuable]\n      NotaUp --> StNotaUp[status=NOTA_UPLOADED]\n      StNotaUp --> StPayPending\n      StPayPending --> Pay[Paiement BANGE / cash / virement]\n      Pay --> StPaid[status=PAID]\n    end\n\n    subgraph Final\n      StPaid --> NeedCita{Requires appointment?}\n      NeedCita -->|Oui| Cita[status=CITA_SCHEDULED + agenda]\n      NeedCita -->|Non| InProg[status=IN_PROGRESS]\n      Cita --> InProg\n      InProg --> Issue[Émission document final + PDF + Firebase + vault]\n      Issue --> StComp[status=COMPLETED]\n      StComp --> NotifFin[Notification + email avec PJ]\n    end\n\n    NotifFin --> End([Fin — service délivré])\n    StRej --> EndKO([Fin — rejeté, recours possible])\n    Notif1 --> Step1\n\n    style Start fill:#90EE90\n    style End fill:#90EE90\n    style EndKO fill:#FFD700\n    style AgentDec fill:#FFA500\n    style CheckExt fill:#FFA500\n    style HasTimbres fill:#FFA500\n    style NotaCheck fill:#FFA500\n    style NeedCita fill:#FFA500\n"
    },
    {
      "id": "04-payment-bange",
      "number": "04",
      "name": "Paiement BANGE Mobile Money",
      "category": "process",
      "objective": "Encaisser un paiement via la plateforme mobile money BANGE, avec confirmation par webhook signé HMAC SHA-256.",
      "actors": [
        "citizen",
        "transverse",
        "ministry_agent"
      ],
      "actor_labels": [
        "Citoyen",
        "Frontend",
        "Backend",
        "BANGE Gateway externe",
        "Webhook handler",
        "PDF Receipt Service"
      ],
      "mermaid_file": "../bpmn/04-payment-bange.mmd",
      "status": "implemented",
      "volume": "Gateway principal mobile money",
      "sla": "Webhook < 5 min après initiation",
      "kpis": [
        "Taux succès paiement",
        "Time-to-receipt-PDF",
        "Taux PAYMENT_EXPIRED"
      ],
      "tables": [
        "payments",
        "service_payments",
        "bank_transactions",
        "payment_receipts"
      ],
      "enums": [
        "payment_status_enum",
        "payment_method_enum",
        "payment_workflow_status"
      ],
      "code_refs": [
        "packages/backend/app/modules/payments/services/bange_service.py",
        "packages/backend/app/modules/payments/services/gateways/bange_gateway.py",
        "packages/backend/app/modules/payments/services/processors/bange_processor.py",
        "packages/backend/app/modules/payments/services/receipt_service.py"
      ],
      "linked_user_stories": [
        "US-003",
        "US-004",
        "US-007",
        "US-010",
        "US-018",
        "US-032"
      ],
      "mermaid_content": "%% ==========================================================================\n%% PROCESSUS BPMN — Paiement via BANGE Mobile Money (Bank of Africa Equatorial Guinea)\n%% Statut: IMPLEMENTÉ (gateway BANGE + processor + webhook handler)\n%% Référence code: packages/backend/app/modules/payments/services/\n%%   - bange_service.py (wrapper)\n%%   - gateways/bange_gateway.py\n%%   - processors/bange_processor.py\n%% Tables: payments, service_payments, bank_transactions, payment_receipts\n%% ==========================================================================\nsequenceDiagram\n    autonumber\n    actor Citoyen\n    participant Frontend as Frontend Next.js\n    participant Backend as Backend FastAPI\n    participant DB as PostgreSQL\n    participant BANGE as BANGE Gateway externe\n    participant Webhook as Webhook handler\n    participant PDF as PDF Receipt Service\n\n    Citoyen->>Frontend: Choisit BANGE Mobile Money\n    Frontend->>Backend: POST /api/v1/payments avec service_request_id\n    Backend->>DB: SELECT service_request + montant\n    Backend->>DB: INSERT payments status=pending\n    Backend->>DB: INSERT service_payments workflow_status=submitted\n    Backend->>BANGE: BANGEGateway.create_payment amount, ref, callback_url\n    BANGE-->>Backend: payment_url + external_id\n    Backend->>DB: UPDATE payments external_id\n    Backend-->>Frontend: payment_url\n    Frontend-->>Citoyen: Redirect vers BANGE app/USSD\n\n    Citoyen->>BANGE: Saisit PIN mobile money\n    BANGE->>BANGE: Débit compte mobile money\n    BANGE->>Webhook: POST /api/v1/webhooks/bange signature HMAC\n    Webhook->>Webhook: verify_webhook_signature HMAC SHA256\n    alt Signature invalide\n        Webhook-->>BANGE: 401 Unauthorized\n    end\n    Webhook->>DB: SELECT payment WHERE external_id\n    alt Payment introuvable ou déjà traité\n        Webhook-->>BANGE: 200 OK idempotent\n    end\n    Webhook->>DB: UPDATE payments status=completed\n    Webhook->>DB: UPDATE service_payments workflow_status=auto_approved\n    Webhook->>DB: INSERT bank_transactions\n    Webhook->>DB: UPDATE service_requests status=PAID\n    Webhook->>PDF: generate_and_store_receipt\n    PDF->>PDF: PDF + QR code + verification token\n    PDF->>DB: INSERT payment_receipts\n    PDF->>DB: register_document_in_vault\n    Webhook->>Backend: EventBus.PAYMENT_COMPLETED\n    Backend->>Backend: Email avec reçu PJ + push mobile\n    Backend->>Backend: AutoAssignmentService.assign_to_next_step\n    Webhook-->>BANGE: 200 OK\n\n    Citoyen->>Frontend: Retour return_url\n    Frontend->>Backend: GET /api/v1/payments/id/status\n    Backend->>DB: SELECT payment status\n    Backend-->>Frontend: status=completed + receipt_url\n    Frontend-->>Citoyen: Confirmation + lien reçu PDF\n"
    },
    {
      "id": "05-agent-assignment",
      "number": "05",
      "name": "Auto-assignment d'un dossier à un agent",
      "category": "process",
      "objective": "Sélectionner automatiquement le meilleur agent disponible selon des règles + scoring multi-critères + LLM en tie-breaker.",
      "actors": [
        "transverse",
        "dgi_agent",
        "supervisor"
      ],
      "actor_labels": [
        "Système Facil (AutoAssignmentService)",
        "Gemini IA (feature flag)"
      ],
      "mermaid_file": "../bpmn/05-agent-assignment.mmd",
      "status": "implemented",
      "volume": "Scoring 5 critères + LLM optionnel",
      "sla": "< 5s décision",
      "kpis": [
        "Score moyen affecté",
        "Taux LLM tie-breaker",
        "Taux waiting pool"
      ],
      "tables": [
        "assignments",
        "assignment_rules",
        "agent_workloads",
        "agent_work_queue",
        "agent_workflow_proficiency",
        "agent_profiles"
      ],
      "enums": [
        "assignment_status_enum",
        "assignment_method",
        "agent_availability_enum",
        "workload_status_enum"
      ],
      "code_refs": [
        "packages/backend/app/modules/assignment/services/auto_assignment_service.py",
        "packages/backend/app/modules/assignment/services/rules_engine.py",
        "packages/backend/app/modules/assignment/services/llm_routing_service.py",
        "packages/backend/app/modules/assignment/services/workload_rebalance_service.py"
      ],
      "linked_user_stories": [
        "US-011",
        "US-012",
        "US-015",
        "US-020",
        "US-021",
        "US-027"
      ],
      "mermaid_content": "%% ==========================================================================\n%% PROCESSUS BPMN — Auto-assignment d'un dossier à un agent (multi-criteria scoring)\n%% Statut: IMPLEMENTÉ (avec LLM-augmented routing en feature flag)\n%% Référence code: packages/backend/app/modules/assignment/services/\n%%   - auto_assignment_service.py\n%%   - rules_engine.py\n%%   - llm_routing_service.py\n%% Tables: assignments, agent_workloads, agent_work_queue, agent_workflow_proficiency\n%% ==========================================================================\nflowchart TD\n    Start([Trigger — nouveau dossier à assigner]) --> Input\n\n    Input[Inputs: item_id, item_type, workflow_code, entity_code, entity_location_id, complexity_score]\n    Input --> Resolve{Entity resolved?}\n    Resolve -->|entity_code fourni| EntityCode[Lookup entity_id depuis entities table]\n    Resolve -->|workflow_code seul| Workflow[Lookup entity via workflow_code fallback]\n    EntityCode --> Available\n    Workflow --> Available\n\n    Available[get_available_agents — filtre entity_id + entity_location_id + max_workload_pct]\n    Available --> CheckAvail{Agents disponibles?}\n    CheckAvail -->|Aucun| LogWarn[Log WARNING + return None]\n    LogWarn --> EndKO([Fin — pas d assignation])\n\n    CheckAvail -->|Oui| Rules[RulesEngine.select_best_agent]\n    Rules --> RuleHit{Règle explicite trouvée?}\n    RuleHit -->|Oui| Selected[agent_profile_id sélectionné]\n    RuleHit -->|Non| Score[Multi-criteria scoring]\n\n    subgraph Scoring_Algorithm\n      Score --> S1[1. Workload 30 pct — capacity_percentage inversé]\n      S1 --> S2[2. Success rate 25 pct — success_rate proficiency]\n      S2 --> S3[3. Specialization 20 pct — workflow in agent.specializations]\n      S3 --> S4[4. Site match 15 pct — entity_location_id égal]\n      S4 --> S5[5. Speed 10 pct — avg_processing_hours inversé]\n      S5 --> Total[Score total = somme pondérée]\n      Total --> Penalty{complexity ≥ seuil ET success_rate < seuil?}\n      Penalty -->|Oui| Underperf[Penalty * ANOMALY_UNDERPERFORMER_PENALTY]\n      Penalty -->|Non| Sort\n      Underperf --> Sort\n      Sort[Tri par score DESC, tie-breaker current_assignments ASC]\n    end\n\n    Sort --> LLMCheck{Gap top1-top2 < threshold ET FEATURE_LLM_ROUTING?}\n    LLMCheck -->|Oui| LLM[LLMRoutingService — Gemini contextual reasoning]\n    LLMCheck -->|Non| Selected\n    LLM --> LLMPick{LLM accepte top1?}\n    LLMPick -->|Oui| Selected\n    LLMPick -->|Non, override| LLMOverride[agent_profile_id = LLM choice]\n    LLMOverride --> Selected\n\n    Selected --> CreateAss[INSERT assignments method=AUTO]\n    CreateAss --> SyncQueue[UPDATE agent_work_queue SET assigned_to = user_id]\n    SyncQueue --> UpdLoad[UPDATE agent_workloads.current_assignments + 1]\n    UpdLoad --> Notif[EventBus + notification agent + email]\n    Notif --> End([Fin — agent assigné])\n\n    style Start fill:#90EE90\n    style End fill:#90EE90\n    style EndKO fill:#FFD700\n    style Resolve fill:#FFA500\n    style CheckAvail fill:#FFA500\n    style RuleHit fill:#FFA500\n    style Penalty fill:#FFA500\n    style LLMCheck fill:#FFA500\n    style LLMPick fill:#FFA500\n    style LLM fill:#E6E6FA\n"
    },
    {
      "id": "06-document-validation-ocr",
      "number": "06",
      "name": "Validation document avec OCR + Gemini AI",
      "category": "process",
      "objective": "Extraire automatiquement les données structurées d'un document uploadé via OCR Tesseract + Gemini, permettre la révision citoyen, puis upload final Firebase.",
      "actors": [
        "citizen",
        "transverse"
      ],
      "actor_labels": [
        "Citoyen",
        "Frontend",
        "Backend",
        "Gemini IA",
        "Firebase Storage"
      ],
      "mermaid_file": "../bpmn/06-document-validation-ocr.mmd",
      "status": "implemented",
      "volume": "Pattern PREVIEW + VALIDATE (économie storage)",
      "sla": "< 30s extraction",
      "kpis": [
        "Confidence moyenne",
        "Taux manual_review",
        "Cost XAF par doc"
      ],
      "tables": [
        "uploaded_files",
        "document_processing_queue",
        "ocr_extraction_results",
        "form_templates",
        "ai_call_metrics"
      ],
      "enums": [
        "extraction_status_enum",
        "processing_status_enum"
      ],
      "code_refs": [
        "packages/backend/app/modules/documents/services/ocr_service.py",
        "packages/backend/app/modules/service_requests/services/gemini_document_processor.py",
        "packages/backend/app/modules/service_requests/services/preview_cache.py",
        "packages/backend/app/core/ai_telemetry.py"
      ],
      "linked_user_stories": [
        "US-029"
      ],
      "mermaid_content": "%% ==========================================================================\n%% PROCESSUS BPMN — Validation document avec OCR + Gemini AI\n%% Statut: IMPLEMENTÉ (Tesseract + Gemini Document Processor + preview cache)\n%% Référence code:\n%%   - packages/backend/app/modules/documents/services/ocr_service.py\n%%   - packages/backend/app/modules/service_requests/services/gemini_document_processor.py\n%%   - packages/backend/app/modules/service_requests/services/preview_cache.py\n%% Tables: uploaded_files, document_processing_queue, ocr_extraction_results\n%% Pattern: PREVIEW puis VALIDATE — extraction avant upload Firebase\n%% ==========================================================================\nflowchart TD\n    Start([Citoyen upload document]) --> Validate\n\n    subgraph Frontend\n      Validate[Validation côté client: type, taille max 10MB]\n      Validate --> Send[POST /service-requests/id/documents/preview multipart]\n    end\n\n    subgraph Backend_Préprocessing\n      Send --> CheckOwner[Vérification ownership service_request]\n      CheckOwner --> CheckMime[Validation MIME type allowed PDF/JPG/PNG/WEBP]\n      CheckMime --> CheckMagic[Validation magic bytes vs MIME déclaré]\n      CheckMagic -->|Mismatch| Err1[400 Bad Request — fichier corrompu]\n      CheckMagic -->|OK| GetSchema[Récupération extraction_schema_key depuis workflow]\n    end\n\n    subgraph Extraction_Pipeline\n      GetSchema --> SchemaExist{Schema défini pour ce doc?}\n      SchemaExist -->|Non| OCROnly[OCR Tesseract seul — texte brut]\n      SchemaExist -->|Oui| Gemini[gemini_document_processor.process]\n\n      Gemini --> GemConfig[GenerationConfig: response_mime_type=application/json]\n      GemConfig --> GemCall[Vertex AI Gemini 2.0 Flash + traced_generate_sync]\n      GemCall --> GemValid{JSON valide + schema match?}\n      GemValid -->|Non| Retry[Retry max 2x avec prompt variant]\n      Retry -->|Échec| Fallback[Fallback OCR Tesseract]\n      GemValid -->|Oui| Extract[Champs extraits + confidence par champ]\n      Retry -->|Succès| Extract\n      Fallback --> Extract\n\n      Extract --> Risk[Risk analysis cross-document si frontend_extractions]\n      Risk --> ConfCheck{Confidence > seuil?}\n      ConfCheck -->|Oui auto| StatusOK[extraction_status = success]\n      ConfCheck -->|Non| StatusReview[extraction_status = manual_review]\n      StatusOK --> Cache\n      StatusReview --> Cache\n    end\n\n    subgraph Preview_Cache\n      Cache[Stockage preview_cache Redis ou in-memory + token]\n      Cache --> Resp[Réponse: extraction + confidence + needs_review]\n      Resp --> CitReview[Citoyen révise champs extraits]\n      CitReview --> Edit{Modifications nécessaires?}\n      Edit -->|Oui| EditFields[Édition manuelle des champs]\n      Edit -->|Non| ConfirmOK[Confirmation finale]\n      EditFields --> ConfirmOK\n    end\n\n    subgraph Validate_Upload\n      ConfirmOK --> SendV[POST /service-requests/id/documents/validate]\n      SendV --> Firebase[Upload Firebase Storage user_documents/...]\n      Firebase --> InsertDoc[INSERT uploaded_files + record document]\n      InsertDoc --> InsertExt[INSERT ocr_extraction_results JSONB]\n      InsertExt --> Audit[audit_logs DOCUMENT_UPLOADED]\n      Audit --> CheckAll[_check_completion: tous documents requis fournis?]\n      CheckAll -->|Oui| StatusUpdate[service_request.status=SUBMITTED]\n      CheckAll -->|Non| Wait[status=DOCUMENTS_REQUIRED]\n    end\n\n    StatusUpdate --> End([Fin — document validé])\n    Wait --> End2([Fin — attente autres documents])\n    Err1 --> EndErr([Fin erreur])\n\n    style Start fill:#90EE90\n    style End fill:#90EE90\n    style End2 fill:#FFD700\n    style EndErr fill:#FF6B6B\n    style SchemaExist fill:#FFA500\n    style GemValid fill:#FFA500\n    style ConfCheck fill:#FFA500\n    style Edit fill:#FFA500\n    style CheckAll fill:#FFA500\n    style Gemini fill:#E6E6FA\n    style GemCall fill:#E6E6FA\n"
    },
    {
      "id": "07-recours-administratif",
      "number": "07",
      "name": "Recours administratif",
      "category": "process",
      "objective": "Permettre à un contribuable de contester une décision défavorable via un recours hiérarchique en commission de recours.",
      "actors": [
        "citizen",
        "transverse"
      ],
      "actor_labels": [
        "Citoyen",
        "Système",
        "Commission de recours"
      ],
      "mermaid_file": "../bpmn/07-recours-administratif.mmd",
      "status": "planned",
      "volume": "Non implémenté V1",
      "sla": "Décision < 60 jours (cible V1.1)",
      "kpis": [
        "Taux recours sur rejets",
        "Taux décision favorable"
      ],
      "tables": [
        "appeals (à créer)",
        "appeal_documents (à créer)",
        "appeal_decisions (à créer)"
      ],
      "enums": [
        "appeal_status_enum (à créer)"
      ],
      "code_refs": [
        "À créer dans packages/backend/app/modules/appeals/"
      ],
      "linked_user_stories": [],
      "mermaid_content": "%% ==========================================================================\n%% PROCESSUS BPMN — Recours administratif (réclamation contre rejet/sanction)\n%% Statut: PLANIFIÉ (recherche `recours|recurso|appeal|apela` dans modules\n%%   ne donne aucun module dédié — seulement mentions ponctuelles)\n%% Référence cible: future module `appeals` ou extension `declarations`\n%% Tables cibles: appeals (à créer), appeal_documents, appeal_decisions\n%% NOTE HONNÊTE: ce diagramme représente le workflow CIBLE pour Facil V1.1,\n%% PAS l'implémentation actuelle. Les enums declaration_status_enum\n%% n'incluent PAS d'état \"en recours\".\n%% ==========================================================================\nflowchart TD\n    Start([Citoyen — décision défavorable reçue]) --> Eligible\n\n    subgraph Citoyen\n      Eligible{Décision éligible recours?}\n      Eligible -->|Délai dépassé > 30j| Forclos[Recours forclos]\n      Forclos --> EndKO([Fin — irrecevable])\n      Eligible -->|Délai OK| Form[Formulaire recours: motif + pièces justificatives]\n      Form --> Submit[Soumission via /appeals POST — PLANIFIÉ]\n    end\n\n    subgraph Système_Cible\n      Submit --> Create[INSERT appeals status=submitted — PLANIFIÉ]\n      Create --> AutoAssign[Auto-assignment vers commission recours]\n      AutoAssign --> NotifSup[Notification superviseur entité concernée]\n    end\n\n    subgraph Commission_Recours\n      NotifSup --> Review[Examen dossier original + nouveau motif]\n      Review --> ReqExtra{Documents complémentaires?}\n      ReqExtra -->|Oui| ReqDoc[Demande de pièces additionnelles]\n      ReqDoc --> WaitDoc[Attente citoyen]\n      WaitDoc --> Review\n      ReqExtra -->|Non| Hearing{Audition requise?}\n      Hearing -->|Oui| Cita[Programmation audition]\n      Cita --> Audition[Tenue audition]\n      Audition --> Deliberate\n      Hearing -->|Non| Deliberate\n      Deliberate[Délibération + rapport motivé]\n      Deliberate --> Decision{Décision?}\n      Decision -->|Acceptation totale| Annul[Annulation décision initiale + remboursement éventuel]\n      Decision -->|Acceptation partielle| Modify[Modification décision initiale]\n      Decision -->|Rejet| Confirm[Confirmation décision initiale]\n    end\n\n    subgraph Post_Décision\n      Annul --> NotifCit[Notification citoyen + PDF décision motivée]\n      Modify --> NotifCit\n      Confirm --> NotifCit\n      NotifCit --> Audit[audit_logs APPEAL_DECISION]\n      Audit --> Recours2{Recours hiérarchique possible?}\n      Recours2 -->|Oui dans 60j| Hierarc[Voie tribunal administratif — HORS PLATEFORME]\n      Recours2 -->|Non| End([Fin — décision définitive])\n      Hierarc --> End\n    end\n\n    style Start fill:#90EE90\n    style End fill:#90EE90\n    style EndKO fill:#FFD700\n    style Eligible fill:#FFA500\n    style ReqExtra fill:#FFA500\n    style Hearing fill:#FFA500\n    style Decision fill:#FFA500\n    style Recours2 fill:#FFA500\n    style Submit fill:#FFE4B5\n    style Create fill:#FFE4B5\n    style AutoAssign fill:#FFE4B5\n\n    %% Légende: blocs en orange clair = PLANIFIÉ (non implémenté)\n"
    },
    {
      "id": "08-bundle-payment-licence",
      "number": "08",
      "name": "Bundle Payment Licence Commerciale",
      "category": "process",
      "objective": "Permettre à un entrepreneur autonomo de payer en une seule transaction l'ensemble de ses obligations fiscales annuelles liées à sa licence commerciale.",
      "actors": [
        "business",
        "transverse",
        "ministry_agent"
      ],
      "actor_labels": [
        "Citoyen entrepreneur",
        "Système Facil",
        "Caissier Tesoro (si cash)"
      ],
      "mermaid_file": "../bpmn/08-bundle-payment-licence.mmd",
      "status": "partial",
      "volume": "Workflow BUNDLE_PAYMENT, entité TESORO",
      "sla": "Décision instantanée (calcul)",
      "kpis": [
        "Mode A vs B ratio",
        "Montant moyen",
        "Taux complétion annuelle"
      ],
      "tables": [
        "commercial_licenses",
        "license_obligations",
        "bundle_items",
        "service_payments",
        "license_compliance_events"
      ],
      "enums": [
        "payment_workflow_status",
        "obligation_status_enum"
      ],
      "code_refs": [
        "packages/backend/app/modules/service_requests/workflows/bundle_payment_workflow.py",
        ".claude/plans/design_bundle_workflow.md"
      ],
      "linked_user_stories": [
        "US-010"
      ],
      "mermaid_content": "%% ==========================================================================\n%% PROCESSUS BPMN — Bundle Payment Licence Commerciale (paiement obligations annuelles)\n%% Statut: IMPLEMENTÉ (workflow BUNDLE_PAYMENT, entité TESORO)\n%% Référence code: packages/backend/app/modules/service_requests/workflows/bundle_payment_workflow.py\n%% Plan détail: .claude/plans/design_bundle_workflow.md\n%% Particularités vs workflows standard:\n%%   - Tarif DYNAMIQUE (bundle_items × zone pricing)\n%%   - 1 service_payment pour N obligations multi-entités\n%%   - Pas d'appointment requis\n%%   - Document conditionnel (uniquement nouvelles entreprises)\n%%   - Récurrence annuelle\n%% Tables: commercial_licenses, license_obligations, bundle_items, service_payments\n%% ==========================================================================\nflowchart TD\n    Start([Citoyen entrepreneur autonomo — démarrage paiement annuel]) --> Step0\n\n    subgraph Step0_Identification\n      Step0[Étape 0: company_identification SELECTION]\n      Step0 --> Search[Recherche société par NIF/RUC]\n      Search --> Found{Société trouvée?}\n      Found -->|Oui — déjà enregistrée| LoadHist[Chargement historique licence]\n      Found -->|Non — nouvelle| TriggerNew[Trigger upload certificado padrón]\n    end\n\n    subgraph Step1_Document_Conditional\n      TriggerNew --> Step1[Étape 1: document_upload DOCUMENT_UPLOAD]\n      Step1 --> UpPad[Upload Certificado de Padrón Municipal]\n      UpPad --> ExtractAI[Extraction Gemini: NIF, raison sociale, zone, activité]\n      ExtractAI --> ReviewExt[Citoyen valide extraction]\n      ReviewExt --> CreateCompany[INSERT companies + commercial_licenses status=draft]\n    end\n\n    subgraph Step2_Obligations\n      CreateCompany --> Step2\n      LoadHist --> Step2\n      Step2[Étape 2: obligations_review FORM_REVIEW]\n      Step2 --> CalcDyn[Calcul tarif DYNAMIQUE: bundle_items × zone × année fiscale]\n      CalcDyn --> ListObl[Liste obligations: TESORO + AYUNTAMIENTO + CAMARA_COMERCIO + ministères]\n      ListObl --> ModeChoice{Mode paiement?}\n      ModeChoice -->|Mode A — Tout en une fois| ModeA[Sélection toutes obligations]\n      ModeChoice -->|Mode B — Sélectif| ModeB[Sélection obligations partielles]\n      ModeA --> TotalCalc[Calcul total + pénalités si overdue]\n      ModeB --> TotalCalc\n    end\n\n    subgraph Step3_Payment\n      TotalCalc --> Step3[Étape 3: payment PAYMENT]\n      Step3 --> MethodChoice{Méthode?}\n      MethodChoice -->|BANGE Mobile Money| BANGE[Voir bpmn 04-payment-bange]\n      MethodChoice -->|Cash en agence| Cash[Génération nota ingreso pour caisse]\n      MethodChoice -->|Virement bancaire| Wire[Affichage IBAN + référence unique]\n\n      BANGE --> AfterPay[Webhook ou validation manuelle]\n      Cash --> CashierVal[Validation par caissier Tesoro]\n      Wire --> ReconCheck[Réconciliation auto via treasury_reconciliation_service]\n\n      AfterPay --> Distribute\n      CashierVal --> Distribute\n      ReconCheck --> Distribute\n\n      Distribute[Distribution montants vers ministères concernés via license_compliance_events]\n    end\n\n    subgraph Step4_Confirmation\n      Distribute --> Step4[Étape 4: confirmation CONFIRMATION]\n      Step4 --> UpdObl[UPDATE license_obligations.status=paid]\n      UpdObl --> UpdLic[UPDATE commercial_licenses.status=active + valid_until = year + 1]\n      UpdLic --> GenPDF[Génération attestation paiement PDF]\n      GenPDF --> Vault[register_document_in_vault]\n      Vault --> NotifCit[Email + push: licence valide jusqu au DD/MM/YYYY]\n    end\n\n    NotifCit --> End([Fin — licence renouvelée])\n\n    style Start fill:#90EE90\n    style End fill:#90EE90\n    style Found fill:#FFA500\n    style ModeChoice fill:#FFA500\n    style MethodChoice fill:#FFA500\n    style CalcDyn fill:#FFB6C1\n    style Distribute fill:#FFB6C1\n"
    },
    {
      "id": "09-2fa-authentication",
      "number": "09",
      "name": "Authentification 2FA TOTP",
      "category": "process",
      "objective": "Sécuriser l'accès aux comptes via une seconde couche d'authentification basée sur TOTP RFC 6238.",
      "actors": [
        "transverse"
      ],
      "actor_labels": [
        "Utilisateur",
        "Frontend",
        "Backend",
        "Authenticator App",
        "Email Service"
      ],
      "mermaid_file": "../bpmn/09-2fa-authentication.mmd",
      "status": "implemented",
      "volume": "Sécurité critique tous rôles agents",
      "sla": "Login < 2s",
      "kpis": [
        "Taux activation 2FA",
        "Taux backup_code usage",
        "Échecs LOGIN"
      ],
      "tables": [
        "users.totp_secret_encrypted",
        "users.totp_enabled",
        "users.backup_codes_hashed",
        "sessions",
        "refresh_tokens"
      ],
      "enums": [
        "user_role_enum",
        "user_status_enum"
      ],
      "code_refs": [
        "packages/backend/app/modules/auth/services/two_factor_service.py",
        "packages/backend/app/modules/auth/services/auth_service.py",
        "packages/backend/app/modules/auth/services/jwt_service.py",
        "packages/backend/app/modules/auth/api/two_factor_routes.py"
      ],
      "linked_user_stories": [
        "US-001",
        "US-008",
        "US-023"
      ],
      "mermaid_content": "%% ==========================================================================\n%% PROCESSUS BPMN — Authentification 2FA TOTP (RFC 6238)\n%% Statut: IMPLEMENTÉ (TwoFactorService — pyotp + Fernet encryption)\n%% Référence code: packages/backend/app/modules/auth/services/\n%%   - two_factor_service.py\n%%   - auth_service.py\n%%   - jwt_service.py\n%%   - session_service.py\n%% Tables: users.totp_secret_encrypted, users.totp_enabled, sessions, refresh_tokens\n%% ==========================================================================\nsequenceDiagram\n    autonumber\n    actor User\n    participant Web as Frontend Next.js\n    participant API as Backend FastAPI\n    participant DB as PostgreSQL\n    participant Auth as Authenticator App Google/Authy\n    participant Email as Email Service\n    participant Audit as audit_logs\n\n    Note over User,Audit: PHASE A — Login initial avec mot de passe\n    User->>Web: Saisit email + mot de passe\n    Web->>API: POST /api/v1/auth/login\n    API->>DB: SELECT users WHERE email\n    API->>API: bcrypt.verify password 12 rounds\n    alt Mot de passe invalide\n        API->>Audit: LOGIN_FAILED + IP + UA\n        API-->>Web: 401 Unauthorized\n    end\n    API->>DB: SELECT totp_enabled WHERE user_id\n    alt 2FA non activé\n        API->>API: jwt_service.create_access_token 30min\n        API->>API: create_refresh_token 30j\n        API->>DB: INSERT sessions + refresh_tokens\n        API->>Audit: LOGIN_SUCCESS\n        API-->>Web: access_token + refresh_token\n    else 2FA activé\n        API->>API: Génère challenge_token courte durée 5min\n        API-->>Web: requires_2fa=true + challenge_token\n        Web-->>User: Affiche écran code TOTP 6 chiffres\n\n        Note over User,Auth: PHASE B — Validation code TOTP\n        User->>Auth: Ouvre app authenticator\n        Auth-->>User: Affiche code 6 chiffres TTL 30s\n        User->>Web: Saisit code + valide\n        Web->>API: POST /api/v1/auth/2fa/verify avec challenge_token + code\n        API->>API: jwt_service.verify challenge_token\n        API->>DB: SELECT totp_secret_encrypted\n        API->>API: Fernet.decrypt secret\n        API->>API: pyotp.TOTP.verify code, valid_window=1\n        alt Code invalide\n            API->>Audit: 2FA_FAILED\n            API-->>Web: 401 + remaining_attempts\n        else Code valide\n            API->>API: jwt_service.create_access_token 30min\n            API->>API: create_refresh_token 30j\n            API->>DB: INSERT sessions + refresh_tokens\n            API->>Audit: LOGIN_SUCCESS_2FA\n            API-->>Web: access_token + refresh_token\n            Web-->>User: Redirect dashboard\n        end\n    end\n\n    Note over User,Audit: PHASE C — Setup initial 2FA optionnel après login\n    User->>Web: Settings — Activer 2FA\n    Web->>API: POST /api/v1/auth/2fa/setup\n    API->>API: pyotp.random_base32 secret\n    API->>API: Génère QR code SVG otpauth://totp/Facil:user@email?secret=...\n    API->>API: Fernet.encrypt secret avec TOTP_ENCRYPTION_KEY\n    API->>DB: UPDATE users SET totp_secret_encrypted, totp_enabled=false en attente confirmation\n    API-->>Web: qr_code_svg + manual_secret\n    Web-->>User: Affiche QR + secret texte\n    User->>Auth: Scan QR ou saisie manuelle\n    User->>Web: Saisit code de confirmation\n    Web->>API: POST /api/v1/auth/2fa/enable + code\n    API->>API: pyotp.TOTP.verify code\n    alt Code valide\n        API->>DB: UPDATE users SET totp_enabled=true\n        API->>API: Génère 10 backup_codes hashés bcrypt\n        API->>DB: INSERT users.backup_codes_hashed\n        API->>Email: Envoi email confirmation 2FA activé\n        API->>Audit: 2FA_ENABLED\n        API-->>Web: success + backup_codes affichés une seule fois\n        Web-->>User: Affiche codes de récupération à imprimer\n    end\n"
    },
    {
      "id": "10-payment-reconciliation",
      "number": "10",
      "name": "Réconciliation Trésor",
      "category": "process",
      "objective": "Associer automatiquement les transactions bancaires reçues avec les service_payments correspondants, déclencher la complétion et alerter sur les anomalies.",
      "actors": [
        "ministry_agent",
        "supervisor",
        "transverse"
      ],
      "actor_labels": [
        "Système (cron quotidien)",
        "Agent Trésor analyste",
        "Supervisor Trésor"
      ],
      "mermaid_file": "../bpmn/10-payment-reconciliation.mmd",
      "status": "implemented",
      "volume": "SQL LATERAL JOIN O(n × log m), scoring 4 niveaux",
      "sla": "Auto-match score >= 80 → 100% auto",
      "kpis": [
        "Taux auto-match",
        "Anomalies par pattern (1-4)",
        "Write-off rate"
      ],
      "tables": [
        "bank_transactions",
        "service_payments",
        "payment_validation_audit"
      ],
      "enums": [
        "bank_transaction_status",
        "payment_workflow_status"
      ],
      "code_refs": [
        "packages/backend/app/modules/service_requests/services/treasury_reconciliation_service.py",
        "packages/backend/app/modules/service_requests/services/treasury_anomaly_service.py",
        "packages/backend/app/modules/service_requests/services/treasury_analyst_service.py",
        "packages/backend/app/modules/service_requests/services/treasury_export_service.py"
      ],
      "linked_user_stories": [
        "US-017",
        "US-018",
        "US-019",
        "US-032"
      ],
      "mermaid_content": "%% ==========================================================================\n%% PROCESSUS BPMN — Réconciliation Trésor (matching automatique transactions bancaires ↔ paiements)\n%% Statut: IMPLEMENTÉ (treasury_reconciliation_service avec scoring SQL LATERAL JOIN)\n%% Référence code: packages/backend/app/modules/service_requests/services/\n%%   - treasury_reconciliation_service.py\n%%   - treasury_anomaly_service.py\n%%   - treasury_analyst_service.py\n%% Tables: bank_transactions, service_payments, payment_validation_audit\n%% Algo scoring SQL: 100 pts ref exacte / 80 pts montant exact / 60 pts ±1% same day / 40 pts ±5% ±3j\n%% Auto-match threshold: ≥ 80 pts\n%% ==========================================================================\nflowchart TD\n    Start([Cron quotidien — POST /cron/treasury-reconciliation]) --> FetchBank\n\n    subgraph Source_Bancaire\n      FetchBank[Import bank_transactions via webhook BANGE/Ecobank/Mastercard ou CSV manuel]\n      FetchBank --> Filter[Filter status=unreconciled + date < J-30]\n    end\n\n    subgraph Scoring_SQL\n      Filter --> Scoring[SQL LATERAL JOIN — top 10 candidats par bank_transaction]\n      Scoring --> CalcScore[Calcul score par paire]\n      CalcScore --> S100{Référence exacte?}\n      S100 -->|Oui| Pts100[+100 pts — bank_reference == payment_reference]\n      S100 -->|Non| S80\n      S80{Montant + currency exact?}\n      S80 -->|Oui| Pts80[+80 pts]\n      S80 -->|Non| S60\n      S60{Montant ±1% ET same day?}\n      S60 -->|Oui| Pts60[+60 pts]\n      S60 -->|Non| S40\n      S40{Montant ±5% ET ±3j?}\n      S40 -->|Oui| Pts40[+40 pts]\n      S40 -->|Non| Pts0[0 pts — ignoré]\n\n      Pts100 --> Top3\n      Pts80 --> Top3\n      Pts60 --> Top3\n      Pts40 --> Top3\n      Top3[ROW_NUMBER PARTITION BY transaction LIMIT 3]\n    end\n\n    subgraph Auto_Match_Decision\n      Top3 --> Threshold{Top1 score ≥ 80?}\n      Threshold -->|Oui — auto-match| AutoMatch[UPDATE bank_transactions.service_payment_id]\n      Threshold -->|Non — manuel| ToManual[INSERT reconciliation_candidates pour analyste]\n\n      AutoMatch --> UpdSP[UPDATE service_payments status=completed + workflow_status=completed]\n      UpdSP --> UpdSR[UPDATE service_requests status=PAID]\n      UpdSR --> Audit[INSERT payment_validation_audit method=auto_match + score]\n      Audit --> EventBus[EventBus.PAYMENT_RECONCILED]\n      EventBus --> Notif[Email contribuable + génération reçu PDF + vault]\n    end\n\n    subgraph Manual_Review_Treasury\n      ToManual --> AnalystUI[Affichage candidats top3 dans dashboard analyste Trésor]\n      AnalystUI --> AnalystDec{Décision analyste?}\n      AnalystDec -->|Match top1| ManualMatch[Match manuel + score raison]\n      AnalystDec -->|Match autre| AltMatch[Sélection candidat alternatif]\n      AnalystDec -->|Aucun match| Investigate[Investigation — flag anomalie]\n      AnalystDec -->|Doublon banque| MarkDup[Mark duplicate transaction]\n\n      ManualMatch --> UpdSP\n      AltMatch --> UpdSP\n      Investigate --> Anomaly[treasury_anomaly_service détection patterns]\n      Anomaly --> AlertSup[Alerte superviseur Trésor + email]\n      MarkDup --> EndDup([Fin — doublon ignoré])\n    end\n\n    subgraph Anomaly_Detection\n      Anomaly --> A1[Pattern 1: montants identiques répétés < 5min]\n      Anomaly --> A2[Pattern 2: bank_transaction sans payment correspondant > 30j]\n      Anomaly --> A3[Pattern 3: payment validé mais pas de bank_transaction]\n      Anomaly --> A4[Pattern 4: écart de change suspect]\n      A1 --> RaiseFlag[Raise anomaly_flag dans dashboard]\n      A2 --> RaiseFlag\n      A3 --> RaiseFlag\n      A4 --> RaiseFlag\n    end\n\n    Notif --> End([Fin — paiement réconcilié])\n    AlertSup --> EndAnom([Fin — escalade anomalie])\n\n    style Start fill:#90EE90\n    style End fill:#90EE90\n    style EndAnom fill:#FF6B6B\n    style EndDup fill:#FFD700\n    style Threshold fill:#FFA500\n    style AnalystDec fill:#FFA500\n    style S100 fill:#FFA500\n    style S80 fill:#FFA500\n    style S60 fill:#FFA500\n    style S40 fill:#FFA500\n    style Scoring fill:#E6E6FA\n    style CalcScore fill:#E6E6FA\n"
    },
    {
      "id": "11-c4-context",
      "number": "11",
      "name": "C4 Niveau 1 — Contexte global",
      "category": "architecture",
      "objective": "Qui interagit avec Facil et avec quels systèmes externes ?",
      "actors": [
        "transverse"
      ],
      "actor_labels": [
        "7 acteurs humains",
        "17 systèmes externes (paiement/IA/infra/comm/gov)"
      ],
      "mermaid_file": "../bpmn/11-c4-context.mmd",
      "status": "implemented",
      "volume": "Vue contextuelle complète",
      "sla": "—",
      "kpis": [],
      "tables": [],
      "enums": [],
      "code_refs": [],
      "linked_user_stories": [
        "US-005"
      ],
      "mermaid_content": "%% C4 — Niveau 1 (Context) — Facil\n%% Référence : C4 model de Simon Brown — https://c4model.com\n%% Audience : décideurs, bailleurs, intégrateurs externes\n%% Convention : Facil au centre, acteurs externes en périphérie, intégrations tierces étiquetées par protocole\n\nflowchart TB\n    %% Personas (acteurs humains)\n    Citoyen[\"👤 Citoyen / Contribuable<br/>Personne physique GE<br/>(es / fr / en)\"]\n    Business[\"🏢 Business / Comptable<br/>Représentant entreprise<br/>ou cabinet comptable\"]\n    AgentTerrain[\"🛂 Agent Inspector<br/>Mobile Android tablet<br/>Mission terrain Ayuntamiento / MIN_*\"]\n    AgentEntite[\"🏛️ Agent Entité Administrative<br/>CNEDOGE / EXTRANJERIA / DGT /<br/>ONRC / MINFP / MIN_*\"]\n    AgentTresor[\"💰 Agent Trésor public<br/>DGT — Réconciliation<br/>+ analyse anomalies\"]\n    Superviseur[\"👁️ Superviseur<br/>Validation 2e niveau<br/>+ reassignment\"]\n    Admin[\"⚙️ Admin Plateforme<br/>RBAC + menus + observabilité\"]\n\n    %% Système central\n    Facil([\"🏛️ Facil<br/>Plateforme de transformation<br/>digitale fiscale GE<br/>(MVP avancé pre-launch)\"])\n\n    %% Systèmes externes — Paiement\n    BANGE[\"💳 BANGE<br/>Mobile Money Gateway<br/>(webhook HMAC SHA-256)\"]\n    Ecobank[\"💳 Ecobank Pay<br/>Gateway carte / virement<br/>(à valider sandbox)\"]\n    Mastercard[\"💳 Mastercard Gateway<br/>3DS authentication<br/>(à valider sandbox)\"]\n    GETESA[\"📱 GETESA USSD<br/>Opérateur GE *123#<br/>(canal sans data)\"]\n    MUNI[\"📱 MUNI USSD<br/>Opérateur GE *456#<br/>(canal sans data)\"]\n\n    %% Systèmes externes — IA\n    Gemini[\"🧠 Vertex AI Gemini 2.0 Flash<br/>RAG + OCR + classification<br/>(traced_generate_sync)\"]\n    Embedding[\"🔡 Vertex AI Embeddings<br/>text-embedding-005<br/>(pgvector RAG chatbot)\"]\n\n    %% Systèmes externes — Infrastructure\n    Supabase[\"🗄️ Supabase / PostgreSQL<br/>77 tables + 25 enums<br/>+ Storage documents\"]\n    Upstash[\"⚡ Upstash Redis<br/>HybridCache TLS<br/>(5 instances + ratelimit)\"]\n    Firebase[\"🌐 Firebase Hosting<br/>+ Firebase Storage<br/>(PDFs reçus signés)\"]\n    CloudRun[\"☁️ Google Cloud Run<br/>FastAPI backend stateless<br/>(scale-to-zero)\"]\n    GrafanaCloud[\"📊 Grafana Cloud<br/>Loki + Tempo + Prometheus<br/>+ AI + Security Observability\"]\n    GoogleSecretMgr[\"🔐 Google Secret Manager<br/>Tokens / API keys<br/>(rotation auditée)\"]\n\n    %% Systèmes externes — Communication\n    SMTP[\"📧 SMTP Provider<br/>SendGrid / Mailgun<br/>(emails templates)\"]\n    SMSGw[\"📲 SMS Gateway<br/>Segments 160 char<br/>(via opérateurs locaux)\"]\n    FCM[\"🔔 Firebase Cloud Messaging<br/>+ APNs natifs<br/>(push mobile data-only)\"]\n    WhatsApp[\"💬 WhatsApp Business API<br/>(webhook_configurations)\"]\n\n    %% Systèmes externes — Gouvernement / partenaires futurs\n    SYDONIA[\"🛃 SYDONIA Douanes<br/>(intégration future V1.1)\"]\n    BOE[\"📜 BOE Journal Officiel GE<br/>(référencement V1.1)\"]\n    CUT[\"💼 CUT — Cuenta Única del Tesoro<br/>(intégration future V1.1)\"]\n    ADIGE[\"🇬🇶 ADIGE Agenda Digital GE<br/>(brique d'exécution V1.1)\"]\n\n    %% Connexions humains → Facil\n    Citoyen -->|\"HTTPS / Next.js<br/>+ JWT + 2FA TOTP\"| Facil\n    Business -->|\"HTTPS / Web SSO<br/>+ user_company_roles\"| Facil\n    AgentTerrain -->|\"HTTPS / Expo mobile<br/>+ JWT 30min + offline sync\"| Facil\n    AgentEntite -->|\"HTTPS / Web admin<br/>+ permission_required\"| Facil\n    AgentTresor -->|\"HTTPS / Web admin<br/>+ dashboard analyste\"| Facil\n    Superviseur -->|\"HTTPS / Web admin<br/>+ supervisor role\"| Facil\n    Admin -->|\"HTTPS / Web admin<br/>+ admin role\"| Facil\n\n    %% Connexions Facil → systèmes externes paiement\n    Facil -->|\"REST API + webhook HMAC<br/>(idempotency external_id)\"| BANGE\n    Facil -.->|\"REST API (gateway prêt)\"| Ecobank\n    Facil -.->|\"REST API (gateway prêt)\"| Mastercard\n    Facil -->|\"USSD push session\"| GETESA\n    Facil -->|\"USSD push session\"| MUNI\n\n    %% Connexions Facil → IA\n    Facil -->|\"gRPC + REST<br/>response_mime_type=JSON<br/>+ retry 2x\"| Gemini\n    Facil -->|\"REST embeddings<br/>+ pgvector cosine\"| Embedding\n\n    %% Connexions Facil → infrastructure\n    Facil -->|\"asyncpg pool<br/>+ pg_advisory_lock\"| Supabase\n    Facil -->|\"redis-py TLS<br/>+ in-memory fallback\"| Upstash\n    Facil -->|\"PDFs reçus<br/>+ firebase-admin SDK\"| Firebase\n    CloudRun ==> Facil\n    Facil -->|\"OTLP gateway EU<br/>+ Sentry bridge\"| GrafanaCloud\n    Facil -->|\"--set-secrets pattern\"| GoogleSecretMgr\n\n    %% Connexions Facil → communication\n    Facil -->|\"SMTP TLS\"| SMTP\n    Facil -->|\"HTTP API\"| SMSGw\n    Facil -->|\"FCM data-only<br/>+ APNs natifs\"| FCM\n    Facil -->|\"webhook signed\"| WhatsApp\n\n    %% Connexions Facil → gouvernement (futurs V1.1)\n    Facil -.->|\"Roadmap V1.1<br/>Phase douanes\"| SYDONIA\n    Facil -.->|\"Roadmap V1.1<br/>Phase BOE\"| BOE\n    Facil -.->|\"Roadmap V1.1<br/>Agrégation flux\"| CUT\n    Facil -.->|\"Roadmap V1.1<br/>Brique exécution\"| ADIGE\n\n    %% Styling\n    classDef person fill:#08427B,stroke:#052E56,color:#fff\n    classDef system fill:#1168BD,stroke:#0B4884,color:#fff\n    classDef external fill:#999999,stroke:#666666,color:#fff\n    classDef future fill:#cccccc,stroke:#999999,color:#333,stroke-dasharray: 5 5\n\n    class Citoyen,Business,AgentTerrain,AgentEntite,AgentTresor,Superviseur,Admin person\n    class Facil system\n    class BANGE,Ecobank,Mastercard,GETESA,MUNI,Gemini,Embedding,Supabase,Upstash,Firebase,CloudRun,GrafanaCloud,GoogleSecretMgr,SMTP,SMSGw,FCM,WhatsApp external\n    class SYDONIA,BOE,CUT,ADIGE future\n"
    },
    {
      "id": "12-c4-containers",
      "number": "12",
      "name": "C4 Niveau 2 — Containers déployables",
      "category": "architecture",
      "objective": "Quels containers déployables existent et comment communiquent-ils ?",
      "actors": [
        "transverse"
      ],
      "actor_labels": [
        "5 frontaux applicatifs",
        "8 containers backend logiques",
        "Couche données Supabase + Redis + Firebase"
      ],
      "mermaid_file": "../bpmn/12-c4-containers.mmd",
      "status": "implemented",
      "volume": "13 containers logiques",
      "sla": "—",
      "kpis": [],
      "tables": [],
      "enums": [],
      "code_refs": [],
      "linked_user_stories": [],
      "mermaid_content": "%% C4 — Niveau 2 (Containers) — Facil\n%% Référence : https://c4model.com — containers = unités déployables indépendamment\n%% Audience : architectes, équipes intégration, DevOps\n\nflowchart TB\n    %% Personas (résumés)\n    User[\"👤 Utilisateurs<br/>Citoyens / Business / Agents / Admin\"]\n    AgentField[\"📱 Agent terrain<br/>+ Inspecteur\"]\n\n    %% Frontaux applicatifs\n    subgraph Frontends[\"Frontaux applicatifs\"]\n        WebApp[\"🌐 Web Citizen App<br/><b>Next.js 14 + React 18</b><br/>TypeScript + Tailwind + Shadcn/UI<br/>i18n es/fr/en — App Router\"]\n        WebAdmin[\"⚙️ Web Admin / Agent Console<br/><b>Next.js 14</b><br/>42 modules frontend<br/>Dashboards par rôle\"]\n        MobileApp[\"📱 Mobile Citizen App<br/><b>Expo / React Native</b><br/>i18n + push FCM/APNs<br/>(Play Store rejected gov 2026-05-08)\"]\n        InspectorApp[\"📲 Inspector Tablet App<br/><b>Expo native</b><br/>Mission terrain offline<br/>+ field receipt printing\"]\n        ChatbotWidget[\"💬 Chatbot Widget<br/>Embeddable React<br/>RAG Gemini + pgvector\"]\n    end\n\n    %% Backend FastAPI\n    subgraph BackendLayer[\"Backend applicatif (Cloud Run, stateless)\"]\n        APIGateway[\"🚦 FastAPI API Gateway<br/><b>app/main.py</b><br/>31 routers + CORS + middleware<br/>Pure ASGI request_telemetry\"]\n        WorkflowEngine[\"⚙️ Workflow Engine<br/>28 workflows + state machines<br/>workflow_transitions append\"]\n        Backend[\"🐍 Backend Services<br/><b>Python 3.11 + asyncpg</b><br/>31 modules métier (3-tier)<br/>Pydantic v2 strict\"]\n        Scheduler[\"⏰ Cron Scheduler<br/><b>app/core/scheduler.py</b><br/>10+ crons enregistrés<br/>pg_advisory_lock\"]\n        EventBus[\"📡 EventBus interne<br/>fire-and-forget asyncio.create_task<br/>+ WeakSet tracking\"]\n        AIRuntime[\"🧠 AI Runtime Wrapper<br/><b>app/core/ai_telemetry.py</b><br/>traced_generate_sync<br/>+ circuit breaker Vertex\"]\n        AISecurity[\"🛡️ AI Security Filter<br/><b>app/core/ai_security.py</b><br/>14 patterns injection<br/>EN/FR/ES + base64 decode\"]\n    end\n\n    %% Data tier\n    subgraph DataTier[\"Couche données (managée Supabase)\"]\n        Postgres[\"🗄️ PostgreSQL 15<br/><b>Supabase</b><br/>77 tables + 25 enums<br/>pg_advisory_lock + RLS<br/>pgvector RAG\"]\n        Storage[\"📁 Supabase Storage<br/>Uploads citoyens<br/>(quarantine + scan)\"]\n        Migrations[\"🧬 Migrations versionnées<br/>packages/backend/database/migrations<br/>schema_migrations + pg_advisory_lock\"]\n    end\n\n    %% Cache + sessions\n    subgraph CacheTier[\"Cache + temps réel\"]\n        Redis[\"⚡ Upstash Redis (TLS)<br/>HybridCache 5 instances<br/>+ rate limit + preview_cache\"]\n        InMemFallback[\"💾 In-Memory Fallback<br/>LRU TTL 4096 cap<br/>(si Redis down)\"]\n    end\n\n    %% Documents\n    subgraph DocsTier[\"Documents générés\"]\n        FirebaseStorage[\"☁️ Firebase Storage<br/>PDFs reçus + certificats<br/>+ register_document_in_vault\"]\n        Vault[\"🔒 Documents Vault<br/>verify_token + QR<br/>user_documents table\"]\n    end\n\n    %% Observabilité\n    subgraph ObsTier[\"Observabilité production\"]\n        Grafana[\"📊 Grafana Cloud<br/>Stack Loki + Tempo + Prometheus<br/>OTLP gateway EU west 3\"]\n        Sentry[\"🐞 Sentry bridge<br/>(via OTLP)<br/>Erreurs front + back\"]\n        AlertManager[\"🚨 Alertmanager<br/>5 alertes IA + 3 alertes Sécurité<br/>+ deploy/health\"]\n    end\n\n    %% Intégrations externes\n    subgraph ExtPayment[\"Intégrations paiement\"]\n        BANGEGw[\"BANGE Mobile Money\"]\n        EcobankGw[\"Ecobank Pay\"]\n        MCGw[\"Mastercard Gateway\"]\n        USSDGw[\"USSD GETESA / MUNI\"]\n    end\n\n    subgraph ExtAI[\"Intégrations IA Google\"]\n        Vertex[\"Vertex AI Gemini 2.0\"]\n        VertexEmb[\"Vertex AI Embeddings\"]\n    end\n\n    subgraph ExtComm[\"Intégrations communication\"]\n        SMTPExt[\"SMTP Provider\"]\n        SMSExt[\"SMS Gateway\"]\n        FCMExt[\"FCM / APNs\"]\n        WAExt[\"WhatsApp Business\"]\n    end\n\n    %% Connexions utilisateurs\n    User --> WebApp\n    User --> WebAdmin\n    User --> MobileApp\n    User --> ChatbotWidget\n    AgentField --> InspectorApp\n\n    %% Frontends → Backend\n    WebApp -->|\"HTTPS REST<br/>+ JWT bearer\"| APIGateway\n    WebAdmin -->|\"HTTPS REST<br/>+ permission_required\"| APIGateway\n    MobileApp -->|\"HTTPS REST<br/>+ device_tokens FCM\"| APIGateway\n    InspectorApp -->|\"HTTPS REST<br/>+ offline queue sync\"| APIGateway\n    ChatbotWidget -->|\"WebSocket + REST<br/>(RAG calls)\"| APIGateway\n\n    %% API Gateway interne\n    APIGateway --> Backend\n    APIGateway --> WorkflowEngine\n    APIGateway --> AIRuntime\n    APIGateway --> AISecurity\n    Backend --> WorkflowEngine\n    Backend --> EventBus\n    AIRuntime --> AISecurity\n    Scheduler -.->|\"cron trigger<br/>+ pg_advisory_lock\"| Backend\n\n    %% Backend → data\n    Backend -->|\"asyncpg pool<br/>+ parameterized $1...$N\"| Postgres\n    Backend -->|\"redis-py TLS\"| Redis\n    Redis -.->|\"fallback\"| InMemFallback\n    Backend -->|\"PUT signed URL\"| Storage\n    Backend -->|\"firebase-admin<br/>+ atomicity PDF+vault\"| FirebaseStorage\n    FirebaseStorage --> Vault\n    Migrations -.->|\"CI deploy<br/>schema_migrations tracking\"| Postgres\n\n    %% Backend → IA\n    AIRuntime --> Vertex\n    AIRuntime --> VertexEmb\n    Backend --> AIRuntime\n\n    %% Backend → comm\n    Backend --> SMTPExt\n    Backend --> SMSExt\n    Backend --> FCMExt\n    Backend --> WAExt\n\n    %% Backend → paiement\n    Backend --> BANGEGw\n    Backend -.-> EcobankGw\n    Backend -.-> MCGw\n    Backend --> USSDGw\n\n    %% Webhooks entrants\n    BANGEGw -.->|\"webhook HMAC SHA-256<br/>+ idempotency\"| APIGateway\n    EcobankGw -.->|\"webhook signed\"| APIGateway\n    WAExt -.->|\"webhook events\"| APIGateway\n\n    %% Observabilité\n    Backend -->|\"OTLP traces<br/>spans + metrics\"| Grafana\n    APIGateway -->|\"request_telemetry<br/>sampling adaptatif\"| Grafana\n    AIRuntime -->|\"ai_call_metrics<br/>cost XAF + p95\"| Grafana\n    Grafana --> AlertManager\n    AlertManager -.->|\"webhook ops\"| Backend\n    Backend -.->|\"errors\"| Sentry\n    Sentry --> Grafana\n\n    %% Styling\n    classDef frontend fill:#62A5C0,stroke:#3B7A93,color:#fff\n    classDef backend fill:#1168BD,stroke:#0B4884,color:#fff\n    classDef datalayer fill:#438DD5,stroke:#2E6295,color:#fff\n    classDef cache fill:#F2A23B,stroke:#C57E1F,color:#fff\n    classDef obs fill:#9B6CCC,stroke:#6F4A99,color:#fff\n    classDef ext fill:#999999,stroke:#666666,color:#fff\n    classDef ai fill:#E6E6FA,stroke:#9B6CCC,color:#333\n\n    class WebApp,WebAdmin,MobileApp,InspectorApp,ChatbotWidget frontend\n    class APIGateway,Backend,WorkflowEngine,Scheduler,EventBus backend\n    class Postgres,Storage,Migrations,FirebaseStorage,Vault datalayer\n    class Redis,InMemFallback cache\n    class Grafana,Sentry,AlertManager obs\n    class AIRuntime,AISecurity ai\n    class BANGEGw,EcobankGw,MCGw,USSDGw,Vertex,VertexEmb,SMTPExt,SMSExt,FCMExt,WAExt ext\n"
    },
    {
      "id": "13-c4-components-backend",
      "number": "13",
      "name": "C4 Niveau 3 — Composants backend",
      "category": "architecture",
      "objective": "Quels modules métier existent dans le backend et comment dépendent-ils les uns des autres ?",
      "actors": [
        "transverse"
      ],
      "actor_labels": [
        "31 modules métier groupés en 8 domaines + cross-cutting"
      ],
      "mermaid_file": "../bpmn/13-c4-components-backend.mmd",
      "status": "implemented",
      "volume": "31 modules backend + 8 fichiers app/core/",
      "sla": "—",
      "kpis": [],
      "tables": [],
      "enums": [],
      "code_refs": [],
      "linked_user_stories": [],
      "mermaid_content": "%% C4 — Niveau 3 (Components) — Backend Facil\n%% Zoom dans le container \"Backend Services\" : 31 modules métier groupés par domaine\n%% Source : packages/backend/app/modules/ (ls verified 2026-05-11)\n%% Référence : https://c4model.com\n\nflowchart TB\n    APIIn[\"📥 FastAPI Gateway<br/>31 routers registered<br/>app/main.py\"]:::gateway\n\n    %% Domaine 1 — Identité & Sécurité\n    subgraph Identity[\"🛡️ Identité, Auth, RBAC (5 modules)\"]\n        ModAuth[\"🔐 auth<br/>JWT + 2FA TOTP + bcrypt<br/>sessions / refresh_tokens\"]\n        ModUsers[\"👥 users<br/>CRUD comptes + profils<br/>device_tokens (FCM)\"]\n        ModPerm[\"🗝️ permissions<br/>50+ permissions RBAC<br/>role_permissions / overrides\"]\n        ModVerified[\"✅ verified_identifiers<br/>email / phone verification<br/>+ pending_registrations\"]\n        ModLegal[\"📜 legal<br/>CGU / RGPD-like / disclosure<br/>multilingue\"]\n    end\n\n    %% Domaine 2 — Catalogue de services\n    subgraph Catalog[\"📚 Catalogue & Référentiels (6 modules)\"]\n        ModFiscalSvc[\"💼 fiscal_services<br/>850+ services + 28 types declarations<br/>service_keywords + categories\"]\n        ModCities[\"🏙️ cities<br/>Districts + provinces GE<br/>Geo IDs\"]\n        ModEntLoc[\"📍 entity_locations<br/>Sites physiques agents<br/>+ Routing site scope\"]\n        ModTranslations[\"🌐 translations<br/>i18n unified table<br/>ENUMs / UI / forms\"]\n        ModHomepage[\"🏠 homepage<br/>Sections dynamiques<br/>+ user_favorites\"]\n        ModEnrich[\"✨ enrichment<br/>Données enrichies catalogue<br/>+ recherche sémantique\"]\n    end\n\n    %% Domaine 3 — Workflow Core\n    subgraph WorkflowCore[\"⚙️ Workflow Core (4 modules)\"]\n        ModServReq[\"📋 service_requests<br/>WorkflowEngine + 28 workflows<br/>+ gemini_document_processor\"]\n        ModDecl[\"📊 declarations<br/>20+ types fiscaux GE<br/>+ workflow_transitions\"]\n        ModAssign[\"🎯 assignment<br/>Auto-assignment 5-criteria<br/>+ LLM tie-breaker\"]\n        ModBatch[\"📦 batch_requests<br/>Imports massifs Excel<br/>import_batches / items\"]\n    end\n\n    %% Domaine 4 — Treasury & Paiement\n    subgraph Treasury[\"💰 Trésor & Paiements (3 modules)\"]\n        ModPayments[\"💳 payments<br/>Gateways BANGE/Ecobank/MC/USSD<br/>+ processors + receipts PDF\"]\n        ModTreasury[\"📥 treasury<br/>Réconciliation auto<br/>+ anomaly detection\"]\n        ModInspect[\"🛂 inspections<br/>Field collection 100+ agents<br/>+ Lock ordering canonique\"]\n    end\n\n    %% Domaine 5 — Documents & IA\n    subgraph DocAI[\"📄 Documents & IA (3 modules)\"]\n        ModDocs[\"📑 documents<br/>OCR Tesseract + queue<br/>+ form_templates\"]\n        ModUserDocs[\"📂 user_documents<br/>Vault citoyen<br/>+ verify_token + QR\"]\n        ModChatbot[\"💬 chatbot<br/>RAG Gemini + pgvector<br/>README_RAG.md détails\"]\n    end\n\n    %% Domaine 6 — Communication & Support\n    subgraph Comms[\"📡 Communication & Support (3 modules)\"]\n        ModComms[\"📨 communications<br/>Email/SMS/Push/USSD/WA<br/>communication_provider_settings\"]\n        ModWebhooks[\"🔗 webhooks<br/>Webhook entrants + log<br/>webhook_configurations\"]\n        ModSupport[\"🎫 support<br/>Tickets + messages + catégories<br/>+ attachments\"]\n    end\n\n    %% Domaine 7 — Companies & Funcionario\n    subgraph Companies[\"🏢 Companies & Fonction publique (3 modules)\"]\n        ModCompanies[\"🏢 companies<br/>CRUD entreprises<br/>+ user_company_roles\"]\n        ModAccount[\"🧮 accountant<br/>Cabinets comptables<br/>+ délégations\"]\n        ModFunc[\"👔 funcionario<br/>Workflows fonction publique<br/>5 types funcionario_*\"]\n    end\n\n    %% Domaine 8 — Agents & Dashboards\n    subgraph Operations[\"🎛️ Opérations agents & supervision (4 modules)\"]\n        ModAgents[\"👮 agents<br/>agent_profiles + workloads<br/>+ workflow_proficiency\"]\n        ModDashboards[\"📊 dashboards<br/>Widgets par rôle<br/>+ Looker MV wrappers\"]\n        ModMenuConf[\"🧭 menu_config<br/>Workflow-based ou JSON<br/>+ workflow_menu_mapping\"]\n        ModAdmin[\"⚙️ admin<br/>RBAC config + audit_log review<br/>+ system_rules dynamic\"]\n    end\n\n    %% Module transverse\n    ModShared[\"🔧 shared<br/>Utilitaires transverses<br/>(non métier)\"]:::shared\n\n    %% Core cross-cutting (pas un module mais cité)\n    subgraph CoreCC[\"🔩 Core cross-cutting\"]\n        Cache[\"app/core/cache.py<br/>HybridCache 5 instances\"]\n        AICore[\"app/core/ai_telemetry.py<br/>+ ai_security.py\"]\n        Sched[\"app/core/scheduler.py<br/>cron registration\"]\n        Secrets[\"app/core/secrets.py<br/>Google Secret Manager\"]\n        ReqTel[\"app/core/request_telemetry_middleware.py<br/>pure ASGI sampling\"]\n        GeoIP[\"app/core/geoip.py<br/>MaxMind GeoLite2\"]\n        UAParser[\"app/core/user_agent_parser.py<br/>lru_cache 4096\"]\n    end\n\n    %% Connexions API → modules par domaine\n    APIIn --> Identity\n    APIIn --> Catalog\n    APIIn --> WorkflowCore\n    APIIn --> Treasury\n    APIIn --> DocAI\n    APIIn --> Comms\n    APIIn --> Companies\n    APIIn --> Operations\n\n    %% Dépendances inter-modules clés\n    ModServReq -->|\"orchestrate\"| ModAssign\n    ModServReq -->|\"upload + extract\"| ModDocs\n    ModServReq -->|\"trigger payment\"| ModPayments\n    ModInspect -->|\"lock ordering<br/>FOR UPDATE root\"| ModPayments\n    ModInspect -->|\"close obligations\"| ModServReq\n    ModPayments -->|\"webhook events\"| ModTreasury\n    ModDecl -->|\"auto-assign\"| ModAssign\n    ModAssign -.->|\"LLM tie-breaker\"| AICore\n    ModDocs -.->|\"Gemini processor\"| AICore\n    ModChatbot -.->|\"RAG + embeddings\"| AICore\n    ModComms -.->|\"templates\"| ModAuth\n    ModAuth -->|\"verify\"| ModVerified\n    ModUsers -->|\"permissions\"| ModPerm\n    ModCompanies -->|\"roles\"| ModUsers\n    ModAccount -->|\"délégation\"| ModCompanies\n    ModFunc -->|\"workflows\"| ModServReq\n    ModAdmin -->|\"config dynamique\"| ModPerm\n    ModAdmin -->|\"menu config\"| ModMenuConf\n    ModDashboards -->|\"widgets\"| ModAgents\n    ModBatch -->|\"imports\"| ModFiscalSvc\n\n    %% Cross-cutting connections\n    Identity -.-> Cache\n    WorkflowCore -.-> Cache\n    Catalog -.-> Cache\n    APIIn -.-> ReqTel\n    ReqTel -.-> GeoIP\n    ReqTel -.-> UAParser\n    APIIn -.-> Secrets\n    WorkflowCore -.-> Sched\n\n    %% Styling\n    classDef gateway fill:#1168BD,stroke:#0B4884,color:#fff\n    classDef identity fill:#08427B,stroke:#052E56,color:#fff\n    classDef catalog fill:#62A5C0,stroke:#3B7A93,color:#fff\n    classDef wf fill:#438DD5,stroke:#2E6295,color:#fff\n    classDef treasury fill:#2D936C,stroke:#1A6048,color:#fff\n    classDef docai fill:#E6E6FA,stroke:#9B6CCC,color:#333\n    classDef comms fill:#F2A23B,stroke:#C57E1F,color:#fff\n    classDef companies fill:#9B6CCC,stroke:#6F4A99,color:#fff\n    classDef ops fill:#C25450,stroke:#823633,color:#fff\n    classDef shared fill:#666666,stroke:#333333,color:#fff\n    classDef core fill:#FFB6C1,stroke:#C25C75,color:#333\n\n    class ModAuth,ModUsers,ModPerm,ModVerified,ModLegal identity\n    class ModFiscalSvc,ModCities,ModEntLoc,ModTranslations,ModHomepage,ModEnrich catalog\n    class ModServReq,ModDecl,ModAssign,ModBatch wf\n    class ModPayments,ModTreasury,ModInspect treasury\n    class ModDocs,ModUserDocs,ModChatbot docai\n    class ModComms,ModWebhooks,ModSupport comms\n    class ModCompanies,ModAccount,ModFunc companies\n    class ModAgents,ModDashboards,ModMenuConf,ModAdmin ops\n    class Cache,AICore,Sched,Secrets,ReqTel,GeoIP,UAParser core\n"
    },
    {
      "id": "14-deployment-architecture",
      "number": "14",
      "name": "Architecture de déploiement multi-environnement",
      "category": "architecture",
      "objective": "DEV / STAGING / PRODUCTION + CI/CD GitHub Actions (6 étapes)",
      "actors": [
        "transverse"
      ],
      "actor_labels": [
        "3 environnements (dev/staging/prod)",
        "CI/CD GitHub Actions"
      ],
      "mermaid_file": "../bpmn/14-deployment-architecture.mmd",
      "status": "implemented",
      "volume": "Cloud Run + Firebase Hosting + Supabase + Upstash + Grafana",
      "sla": "—",
      "kpis": [],
      "tables": [],
      "enums": [],
      "code_refs": [
        ".github/workflows/"
      ],
      "linked_user_stories": [],
      "mermaid_content": "%% Déploiement multi-environnement Facil\n%% CI/CD GitHub Actions → Cloud Run / Firebase / Supabase / Grafana Cloud\n%% Source : .github/workflows/ + CLAUDE.md règle #1 (NEVER manual gcloud)\n\nflowchart LR\n    %% Source control\n    Dev[\"👨‍💻 Développeur<br/>solo @ libressai@gmail.com\"]\n    GitHub[\"🐙 GitHub Repo<br/>taxasge / develop branch<br/>+ feature/** + main\"]\n\n    %% CI Pipeline\n    subgraph CICD[\"GitHub Actions CI/CD\"]\n        CILint[\"🧹 CI Lint + Type-check<br/>flake8 / mypy strict / black<br/>tsc --noEmit / eslint\"]\n        CITest[\"🧪 CI Tests<br/>pytest backend<br/>+ jest frontend + e2e\"]\n        CIBuild[\"📦 CI Build<br/>Docker backend<br/>+ Next.js frontend\"]\n        CIDeploy[\"🚀 CI Deploy<br/>Cloud Run (backend)<br/>+ Firebase Hosting (web)\"]\n        CIMobile[\"📱 EAS Mobile Build<br/>preview / production<br/>(.aab + .ipa)\"]\n        CIOpenAPI[\"🔍 OpenAPI drift<br/>openapi-types check<br/>auto-fail si désync\"]\n    end\n\n    %% Environments\n    subgraph EnvDev[\"Environment : DEV (local)\"]\n        DevDocker[\"🐳 docker-local stack<br/>FastAPI + Postgres + Redis<br/>deploy/init.py wizard\"]\n        DevDB[\"🗄️ Postgres local<br/>ou Supabase dev project\"]\n    end\n\n    subgraph EnvStaging[\"Environment : STAGING\"]\n        StgBackend[\"☁️ Cloud Run<br/>taxasge-backend-staging<br/>scale 0..N + 1G RAM\"]\n        StgWeb[\"🌐 Firebase Hosting<br/>taxasge-staging<br/>+ preview channels\"]\n        StgDB[\"🗄️ Supabase Staging<br/>schema_migrations sync\"]\n        StgRedis[\"⚡ Upstash Redis (staging)\"]\n    end\n\n    subgraph EnvProd[\"Environment : PRODUCTION (MVP avancé pre-launch)\"]\n        ProdBackend[\"☁️ Cloud Run<br/>taxasge-backend-prod<br/>+ --set-secrets pattern\"]\n        ProdWeb[\"🌐 Firebase Hosting<br/>taxasge-prod<br/>+ CSP middleware + next.config\"]\n        ProdDB[\"🗄️ Supabase Production<br/>+ pg_advisory_lock + RLS\"]\n        ProdRedis[\"⚡ Upstash Redis (prod TLS)\"]\n        ProdFCM[\"🔔 Firebase Cloud Messaging<br/>+ APNs natifs prod\"]\n    end\n\n    %% Cross-environment infra\n    subgraph SharedInfra[\"Infra partagée\"]\n        SecretMgr[\"🔐 Google Secret Manager<br/>tokens rotation auditée<br/>roles/secretmanager.secretAccessor\"]\n        ArtifactReg[\"📦 Artifact Registry<br/>Docker images backend\"]\n        GrafanaCld[\"📊 Grafana Cloud (EU west 3)<br/>Loki + Tempo + Mimir<br/>OTLP gateway + 5 dashboards\"]\n        VertexAI[\"🧠 Vertex AI (europe-west)<br/>Gemini 2.0 Flash + embedding-005<br/>+ Sentry bridge\"]\n    end\n\n    %% Flux dev → git\n    Dev -->|\"git push develop<br/>JAMAIS build manuel gcloud\"| GitHub\n    GitHub --> CILint\n    CILint --> CITest\n    CITest --> CIBuild\n    CIBuild --> CIOpenAPI\n    CIBuild --> CIDeploy\n    CIBuild --> CIMobile\n\n    %% Deploy targets\n    CIDeploy -->|\"if branch == develop<br/>+ packages/backend changes\"| StgBackend\n    CIDeploy -->|\"if branch == develop<br/>+ packages/web changes\"| StgWeb\n    CIDeploy -->|\"manual approve<br/>+ tag release\"| ProdBackend\n    CIDeploy -->|\"manual approve<br/>+ tag release\"| ProdWeb\n\n    %% Backend → Data\n    StgBackend --> StgDB\n    StgBackend --> StgRedis\n    ProdBackend --> ProdDB\n    ProdBackend --> ProdRedis\n    ProdBackend --> ProdFCM\n\n    %% Secrets injection\n    SecretMgr -.->|\"--set-secrets\"| StgBackend\n    SecretMgr -.->|\"--set-secrets\"| ProdBackend\n    ArtifactReg -.->|\"image pull\"| StgBackend\n    ArtifactReg -.->|\"image pull\"| ProdBackend\n\n    %% Migrations\n    CIDeploy -->|\"schema_migrations<br/>+ pg_advisory_lock<br/>migrations refacto Phase A→H\"| StgDB\n    CIDeploy -->|\"schema_migrations<br/>(production guarded)\"| ProdDB\n\n    %% Observabilité\n    StgBackend -->|\"OTLP\"| GrafanaCld\n    ProdBackend -->|\"OTLP\"| GrafanaCld\n    StgWeb -.->|\"Sentry frontend\"| GrafanaCld\n    ProdWeb -.->|\"Sentry frontend\"| GrafanaCld\n\n    %% AI calls\n    StgBackend -->|\"AI traced calls\"| VertexAI\n    ProdBackend -->|\"AI traced calls\"| VertexAI\n\n    %% Dev local\n    DevDocker --> DevDB\n    Dev --> DevDocker\n\n    %% Styling\n    classDef dev fill:#62A5C0,stroke:#3B7A93,color:#fff\n    classDef ci fill:#F2A23B,stroke:#C57E1F,color:#fff\n    classDef staging fill:#9B6CCC,stroke:#6F4A99,color:#fff\n    classDef prod fill:#C25450,stroke:#823633,color:#fff\n    classDef shared fill:#2D936C,stroke:#1A6048,color:#fff\n\n    class Dev,DevDocker,DevDB dev\n    class CILint,CITest,CIBuild,CIDeploy,CIMobile,CIOpenAPI ci\n    class StgBackend,StgWeb,StgDB,StgRedis staging\n    class ProdBackend,ProdWeb,ProdDB,ProdRedis,ProdFCM prod\n    class SecretMgr,ArtifactReg,GrafanaCld,VertexAI shared\n"
    },
    {
      "id": "15-global-state-machine",
      "number": "15",
      "name": "État machine globale",
      "category": "state-machine",
      "objective": "Vue agrégée de tous les états possibles d'un dossier dans Facil, du DRAFT à l'archivage final, en incluant les sous-machines paiement, rendez-vous, réconciliation et recours.",
      "actors": [
        "transverse"
      ],
      "actor_labels": [
        "12 super-états couvrant tous les workflows"
      ],
      "mermaid_file": "../bpmn/15-global-state-machine.mmd",
      "status": "partial",
      "volume": "12 super-états (initiation/timbres/soumission/routing/review/paiement/RDV/exécution/réconciliation/recours/archivage/terminaux)",
      "sla": "—",
      "kpis": [],
      "tables": [
        "audit_logs",
        "workflow_transitions"
      ],
      "enums": [],
      "code_refs": [],
      "linked_user_stories": [],
      "mermaid_content": "%% État machine GLOBAL d'un dossier Facil (vue agrégée multi-workflow)\n%% Couvre service_request + tax_declaration + service_payment + assignment + appointment\n%% De la soumission citoyen à l'archivage / recours\n\nstateDiagram-v2\n    [*] --> Idle: Citoyen / Business connecté\n\n    state \"📝 Initiation\" as Init {\n        Idle --> Drafting: Démarrage wizard\n        Drafting --> Drafting: Auto-save partielle\n        Drafting --> ValidationLocal: Soumission préliminaire\n        ValidationLocal --> Drafting: Erreurs Pydantic\n    }\n\n    state \"🏛️ Timbres fiscaux\" as Stamps {\n        ValidationLocal --> Stamping: requires_timbres == true\n        Stamping --> StampsPaying: Choix paiement timbres\n        StampsPaying --> StampsPaid: Webhook OK\n        StampsPaying --> StampsFailed: Webhook KO\n        StampsFailed --> Stamping: Retry citoyen\n    }\n\n    state \"📨 Soumission\" as Submission {\n        ValidationLocal --> Submitted: requires_timbres == false\n        StampsPaid --> Submitted: Auto\n        Submitted --> AutoAssigning: EventBus déclenche AutoAssignmentService\n    }\n\n    state \"🎯 Assignment + Queue\" as Routing {\n        AutoAssigning --> Assigned: Match agent_profile<br/>(location scope absolu)\n        AutoAssigning --> WaitingPool: Aucun agent disponible<br/>(visible supervisor)\n        WaitingPool --> Assigned: Supervisor assigne manuel\n        Assigned --> InReview: Agent ouvre dossier<br/>(locks par assignment)\n    }\n\n    state \"👁️ Revue agent\" as Review {\n        InReview --> DocsRequested: Docs manquants<br/>(work_queue=waiting_documents)\n        DocsRequested --> ReUploaded: Citoyen ré-upload\n        ReUploaded --> InReview: Auto\n        InReview --> Approved: Décision OK\n        InReview --> Rejected: Décision KO\n        InReview --> Escalated: Doute / complexité\n        Escalated --> SupervisorReview: Supervisor prend\n        SupervisorReview --> Approved: Validé\n        SupervisorReview --> Rejected: Rejeté\n        SupervisorReview --> AdminReview: Escalation 2e niveau\n    }\n\n    state \"💰 Paiement principal\" as Payment {\n        Approved --> NotaIngresoPending: requires_nota_ingreso\n        NotaIngresoPending --> NotaUploaded: Upload citoyen\n        NotaUploaded --> PaymentPending: Validation auto\n        Approved --> PaymentPending: !requires_nota_ingreso\n        PaymentPending --> PaymentProcessing: Paiement initié\n        PaymentProcessing --> Paid: Webhook BANGE/Ecobank OK\n        PaymentProcessing --> PaymentFailed: Webhook KO ou timeout\n        PaymentFailed --> PaymentPending: Retry citoyen\n        PaymentProcessing --> PaymentExpired: > 30 min sans webhook\n    }\n\n    state \"📅 Rendez-vous\" as Appointment {\n        Paid --> CitaScheduled: requires_appointment\n        Paid --> InProgress: !requires_appointment\n        CitaScheduled --> InProgress: Citoyen présent\n        CitaScheduled --> Expired: No-show + délai\n    }\n\n    state \"🎁 Exécution + Délivrance\" as Execution {\n        InProgress --> DocumentGenerated: Agent émet document\n        DocumentGenerated --> PDFInVault: Firebase upload<br/>+ register_document_in_vault\n        PDFInVault --> NotifiedCitizen: Email + push<br/>+ verify_token\n        NotifiedCitizen --> Completed: Citoyen consulte\n    }\n\n    state \"💼 Réconciliation Trésor\" as Recon {\n        Paid --> AwaitingReconciliation: bank_transactions reçue\n        AwaitingReconciliation --> ReconciledAuto: Score >= 80 pts\n        AwaitingReconciliation --> ReconciledManual: Score < 80<br/>analyste valide\n        AwaitingReconciliation --> Anomaly: Pattern 1-4 détecté\n        Anomaly --> ReconciledManual: Analyste résout\n        Anomaly --> WriteOffNeeded: Supervisor décide\n    }\n\n    state \"⚖️ Recours (PLANIFIÉ V1.1)\" as Appeals {\n        Rejected --> AppealFiled: Citoyen dépose recours\n        AppealFiled --> AppealReview: Commission analyse\n        AppealReview --> AppealApproved: Décision favorable\n        AppealReview --> AppealConfirmed: Décision défavorable confirmée\n        AppealApproved --> InReview: Réintégrer workflow\n        AppealConfirmed --> ArchivedRejected: Terminal\n    }\n\n    state \"🗄️ Archivage\" as Archive {\n        Completed --> Archived: > 12 mois<br/>+ obligation légale conservation\n        AppealConfirmed --> ArchivedRejected\n        Expired --> ArchivedExpired\n        Cancelled --> ArchivedCancelled\n    }\n\n    %% Transitions transverses\n    Drafting --> Cancelled: Citoyen abandonne<br/>(manual)\n    PaymentExpired --> Expired\n    PaymentFailed --> Cancelled: Citoyen abandonne\n    DocsRequested --> Expired: > 30j sans réponse\n    CitaScheduled --> Cancelled: Citoyen annule\n\n    %% Terminaux\n    Archived --> [*]\n    ArchivedRejected --> [*]\n    ArchivedExpired --> [*]\n    ArchivedCancelled --> [*]\n    Cancelled --> [*]\n    WriteOffNeeded --> [*]\n    Completed --> [*]\n    ReconciledAuto --> [*]\n    ReconciledManual --> [*]\n\n    note right of Routing\n        Location scope absolu :\n        pas de re-routage cross-site\n        (Règle mémoire #20)\n    end note\n\n    note right of Review\n        Tout passage = audit_logs\n        + workflow_transitions\n        (append-only)\n    end note\n\n    note right of Recon\n        Réconciliation Trésor\n        peut tourner en // de l'exécution\n        (cron + dashboard analyste)\n    end note\n\n    note right of Appeals\n        Recours administratif :\n        📋 PLANIFIÉ Facil V1.1\n        (proc 7, doc BPMN)\n    end note\n"
    },
    {
      "id": "16-workflow-citizen-end-to-end",
      "number": "16",
      "name": "Workflow Citoyen end-to-end",
      "category": "cross-functional",
      "objective": "Cross-functional swimlane — parcours citoyen complet de l'onboarding au support post-délivrance.",
      "actors": [
        "citizen",
        "transverse",
        "dgi_agent",
        "ministry_agent"
      ],
      "actor_labels": [
        "Citoyen",
        "Système",
        "Agent Entité",
        "Trésor"
      ],
      "mermaid_file": "../bpmn/16-workflow-citizen-end-to-end.mmd",
      "status": "implemented",
      "volume": "10 étapes synthétisées + recours (V1.1)",
      "sla": "—",
      "kpis": [],
      "tables": [],
      "enums": [],
      "code_refs": [],
      "linked_user_stories": [
        "US-001",
        "US-002",
        "US-003",
        "US-004",
        "US-006",
        "US-007"
      ],
      "mermaid_content": "%% Parcours citoyen END-TO-END (vue cross-functional swimlane)\n%% De la création de compte au support post-livraison\n%% Cible : démonstration bailleurs + investisseurs + gov GE\n\nflowchart TB\n    Start([🚀 Citoyen découvre Facil<br/>Web / Mobile / Bouche-à-oreille]):::start\n\n    subgraph S0[\"📝 0. Onboarding\"]\n        Reg[\"Création compte<br/>Email + tel + ID national\"]\n        Verif[\"Vérification email + SMS<br/>pending_registrations<br/>15 min expiry\"]\n        TOTP[\"Activation 2FA TOTP<br/>(optionnelle pour citoyen,<br/>obligatoire pour agents)\"]\n    end\n\n    subgraph S1[\"🔍 1. Découverte service\"]\n        Catalog[\"Recherche catalogue<br/>850+ services<br/>+ service_keywords\"]\n        Chat[\"Chatbot RAG Gemini<br/>Assistance 24/7<br/>multilingue es/fr/en\"]\n        Detail[\"Page détail service<br/>+ procédure + documents requis<br/>+ tarif estimé\"]\n    end\n\n    subgraph S2[\"📋 2. Demande de service\"]\n        Wizard[\"Wizard multi-étapes<br/>(28 workflows possibles)\"]\n        Upload[\"Upload documents<br/>PREVIEW + VALIDATE pattern\"]\n        OCR[\"OCR Tesseract<br/>+ Gemini extraction<br/>response_mime_type=JSON\"]\n        Review[\"Citoyen révise champs<br/>extraits (confidence < seuil)\"]\n        Submit[\"Soumission service_request<br/>status=SUBMITTED\"]\n    end\n\n    subgraph S3[\"🏛️ 3. Timbres fiscaux (si requis)\"]\n        StampsPay[\"Paiement timbres<br/>BANGE / USSD / cash\"]\n        StampsOK[\"Timbres validés<br/>service_request → SUBMITTED\"]\n    end\n\n    subgraph S4[\"🎯 4. Traitement administratif\"]\n        Auto[\"Auto-assignment<br/>5 critères + LLM tie-breaker\"]\n        AgentRev[\"Agent entité analyse<br/>(CNEDOGE / DGT / etc.)\"]\n        DocsReq[\"Si docs manquants<br/>→ Citoyen notifié<br/>(email + push)\"]\n        Decision[\"Décision agent<br/>Approve / Reject / Escalate\"]\n    end\n\n    subgraph S5[\"💳 5. Paiement principal\"]\n        PayChoice[\"Choix mode paiement<br/>BANGE / Ecobank / Mastercard<br/>USSD / Cash caissier\"]\n        PayInit[\"Initiation paiement<br/>payment_workflow_status<br/>= processing\"]\n        PayWebhook[\"Webhook signed HMAC<br/>idempotency external_id\"]\n        PayOK[\"Paiement validé<br/>service_payments<br/>+ payment_receipts PDF\"]\n    end\n\n    subgraph S6[\"📅 6. Rendez-vous physique (si applicable)\"]\n        BookCita[\"Réservation slot<br/>+ entity_location_id<br/>+ calendar widget\"]\n        Present[\"Présence citoyen<br/>+ check-in mobile\"]\n    end\n\n    subgraph S7[\"🎁 7. Délivrance\"]\n        Process[\"Agent finalise<br/>+ document généré\"]\n        PDFVault[\"PDF upload Firebase<br/>+ register_document_in_vault<br/>+ verify_token QR\"]\n        Notify[\"Notifications multi-canal<br/>Email + SMS + Push + WA\"]\n        Download[\"Citoyen télécharge<br/>PDF signé QR vérifiable\"]\n    end\n\n    subgraph S8[\"📊 8. Suivi & vérification\"]\n        History[\"Historique demandes<br/>tableau de bord citoyen\"]\n        QRVerify[\"Vérification QR publique<br/>verify_token immutable\"]\n        Recurring[\"Récurrence annuelle<br/>(bundle licence ex.)\"]\n    end\n\n    subgraph S9[\"🎫 9. Support post-délivrance\"]\n        Ticket[\"Création ticket support<br/>support_tickets + messages\"]\n        Reply[\"Agent support répond<br/>+ attachments\"]\n        Resolved[\"Ticket résolu<br/>+ satisfaction\"]\n    end\n\n    subgraph S10[\"⚖️ 10. Recours (📋 PLANIFIÉ V1.1)\"]\n        AppealForm[\"Formulaire recours<br/>(post-rejet)\"]\n        Commission[\"Commission de recours<br/>30j délai\"]\n        DecisionRec[\"Décision recours<br/>favorable / défavorable\"]\n    end\n\n    End([🏁 Service livré + dossier archivé]):::endNode\n    AppealsEnd([⚖️ Recours résolu]):::endNode\n\n    %% Flux principal\n    Start --> Reg --> Verif --> TOTP --> Catalog\n    Catalog --> Chat\n    Catalog --> Detail\n    Chat --> Detail\n    Detail --> Wizard --> Upload --> OCR --> Review --> Submit\n\n    Submit -->|\"requires_timbres\"| StampsPay --> StampsOK --> Auto\n    Submit -->|\"!requires_timbres\"| Auto\n\n    Auto --> AgentRev\n    AgentRev -->|\"docs manquants\"| DocsReq --> Upload\n    AgentRev --> Decision\n\n    Decision -->|\"approved\"| PayChoice\n    Decision -->|\"rejected\"| AppealForm\n    AppealForm --> Commission --> DecisionRec\n    DecisionRec -->|\"favorable\"| AgentRev\n    DecisionRec -->|\"défavorable\"| AppealsEnd\n\n    PayChoice --> PayInit --> PayWebhook --> PayOK\n\n    PayOK -->|\"requires_appointment\"| BookCita --> Present --> Process\n    PayOK -->|\"!requires_appointment\"| Process\n\n    Process --> PDFVault --> Notify --> Download\n    Download --> History\n    History --> QRVerify\n    History --> Ticket\n    Ticket --> Reply --> Resolved\n    Resolved --> History\n    History --> Recurring\n    Recurring -.->|\"prochaine période\"| Catalog\n    History --> End\n\n    %% Styling\n    classDef start fill:#90EE90,stroke:#2D936C,color:#1A6048\n    classDef endNode fill:#90EE90,stroke:#2D936C,color:#1A6048\n    classDef stamps fill:#F2A23B,stroke:#C57E1F,color:#fff\n    classDef pay fill:#2D936C,stroke:#1A6048,color:#fff\n    classDef appeal fill:#C25450,stroke:#823633,color:#fff,stroke-dasharray: 5 5\n\n    class S3 stamps\n    class S5 pay\n    class S10 appeal\n"
    },
    {
      "id": "17-pattern-lock-ordering",
      "number": "17",
      "name": "Pattern Lock Ordering (concurrence)",
      "category": "pattern",
      "objective": "Sequence diagram du pattern lock ordering canonique pour 100+ agents concurrents (bundle / field payment).",
      "actors": [
        "dgi_agent",
        "transverse"
      ],
      "actor_labels": [
        "2 agents concurrents",
        "PostgreSQL",
        "Service de collection"
      ],
      "mermaid_file": "../bpmn/17-pattern-lock-ordering.mmd",
      "status": "implemented",
      "volume": "4 niveaux de lock canonique (commercial_licenses → service_requests → license_obligations → service_payments)",
      "sla": "Lock hold < 150ms",
      "kpis": [
        "UniqueViolation recovery rate"
      ],
      "tables": [
        "commercial_licenses",
        "service_requests",
        "license_obligations",
        "service_payments"
      ],
      "enums": [],
      "code_refs": [
        "packages/backend/app/modules/inspections/services/collection_service.py",
        ".claude/plans/INSPECTION_BUNDLE_P1_DETAIL.md"
      ],
      "linked_user_stories": [
        "US-016"
      ],
      "mermaid_content": "%% Pattern transverse : Lock ordering pour 100+ agents concurrents\n%% Source : CLAUDE.md « Lock Ordering — Bundle / Field Payment »\n%% Référence code : packages/backend/app/modules/inspections/services/collection_service.py\n%% Plan : .claude/plans/INSPECTION_BUNDLE_P1_DETAIL.md\n\nsequenceDiagram\n    autonumber\n\n    participant A1 as 👮 Agent A<br/>(terrain)\n    participant A2 as 👮 Agent B<br/>(terrain)\n    participant API as 🚦 FastAPI\n    participant TX as 🔄 Transaction<br/>asyncpg\n    participant CL as 🗄️ commercial_licenses\n    participant SR as 🗄️ service_requests\n    participant LO as 🗄️ license_obligations\n    participant SP as 🗄️ service_payments\n    participant EB as 📡 EventBus\n    participant AL as 📜 audit_logs\n\n    Note over A1,AL: Scénario : 2 agents tentent de collecter le paiement<br/>de la MÊME commercial_license simultanément\n\n    %% Agent A initie\n    A1->>API: POST /inspections/collect-field-payment<br/>(license_id=42, amount=350000)\n    API->>TX: BEGIN TRANSACTION\n    TX->>TX: SET LOCAL lock_timeout = '3s'\n    TX->>TX: SET LOCAL statement_timeout = '5s'\n\n    Note over TX: 🔒 LOCK 1 — ROOT lock<br/>(seul lock explicite)\n    TX->>CL: SELECT * FROM commercial_licenses<br/>WHERE id = 42 FOR UPDATE\n    CL-->>TX: ✅ Lock acquis par A\n\n    %% Agent B essaie en parallèle\n    A2->>API: POST /inspections/collect-field-payment<br/>(license_id=42, amount=350000)\n    API->>TX: BEGIN TRANSACTION (B)\n    Note over TX: SET LOCAL lock_timeout = '3s'\n    TX->>CL: SELECT * FROM commercial_licenses<br/>WHERE id = 42 FOR UPDATE\n    Note over CL: ⏳ Agent B attend...<br/>(lock détenu par A)\n\n    %% Agent A continue\n    Note over TX: 🔒 LOCK 2 — INSERT optimistic\n    TX->>SR: INSERT INTO service_requests<br/>(commercial_license_id=42, ...)\n    Note over SR: Partial UNIQUE index<br/>idx_sr_commercial_license_unique<br/>(pas de FOR UPDATE)\n    SR-->>TX: ✅ INSERT OK (id=789)\n\n    Note over TX: 🔒 LOCK 3 — UPDATE batch\n    TX->>LO: UPDATE license_obligations<br/>SET status='payment_pending'<br/>WHERE license_id=42 AND status='due'\n    LO-->>TX: ✅ 5 obligations lockées + updated\n\n    Note over TX: 🔒 LOCK 4 — INSERT final\n    TX->>SP: INSERT INTO service_payments<br/>(service_request_id=789, ...)<br/>workflow_status='field_collected'\n    SP-->>TX: ✅ INSERT OK (id=1234)\n\n    TX->>TX: COMMIT\n    TX->>API: ✅ Transaction A committed\n    API->>A1: 200 OK + receipt PDF\n    Note over TX: 🔓 Locks libérés\n\n    %% Effets post-transaction\n    par Audit + EventBus (fire-and-forget)\n        API->>AL: INSERT audit_logs<br/>(PAYMENT_VALIDATED, agent_id=A)\n        API->>EB: publish(payment.collected)<br/>asyncio.create_task\n        EB-->>API: routing ministères + notifications\n    end\n\n    %% Agent B reprend\n    Note over CL: Agent B reçoit le lock<br/>(libéré par A)\n    CL-->>TX: ✅ Lock acquis par B\n\n    %% Agent B essaie INSERT service_requests\n    TX->>SR: INSERT INTO service_requests<br/>(commercial_license_id=42, ...)\n    Note over SR: ❌ UniqueViolationError<br/>idx_sr_commercial_license_unique\n    SR-->>TX: 23505 unique_violation\n\n    %% Recovery déterministe (PAS de retry/backoff)\n    Note over TX,SR: Recovery pattern :<br/>try/except UniqueViolationError\n    TX->>SR: SELECT id FROM service_requests<br/>WHERE commercial_license_id = 42<br/>LIMIT 1\n    SR-->>TX: id=789 (existant créé par A)\n\n    Note over TX: 🔒 LOCK 3 — UPDATE batch (B retry)\n    TX->>LO: UPDATE license_obligations<br/>SET status='payment_pending'<br/>WHERE license_id=42 AND status='due'\n    LO-->>TX: ✅ 0 rows (déjà updated par A)\n\n    TX->>TX: Check : 0 obligations updated\n    TX->>TX: ROLLBACK ou COMMIT (idempotent)\n    TX->>API: ⚠️ Already collected by A\n    API->>A2: 409 Conflict<br/>\"Payment already collected\"\n\n    Note over A1,AL: ✅ Aucune race condition<br/>✅ Aucun double paiement<br/>✅ Lock libéré rapidement (lock_timeout=3s)<br/>✅ Recovery déterministe sans retry/backoff\n"
    }
  ],
  "categories": [
    {
      "id": "process",
      "name": "Processus métier (10)",
      "color": "#1F4E79"
    },
    {
      "id": "architecture",
      "name": "Architecture C4 (4)",
      "color": "#0B7A6E"
    },
    {
      "id": "state-machine",
      "name": "État machine (1)",
      "color": "#6E45A1"
    },
    {
      "id": "cross-functional",
      "name": "Cross-functional (1)",
      "color": "#B5651C"
    },
    {
      "id": "pattern",
      "name": "Pattern transverse (1)",
      "color": "#B02A6F"
    }
  ]
};