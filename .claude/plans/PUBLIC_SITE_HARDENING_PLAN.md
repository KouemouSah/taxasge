# Plan: Public Site Hardening & UX Overhaul

## Context
Audit complet du site public FACIL. Score: 6.2/10. 4 phases d'amelioration.

## Phase 1 - Securite & Bugs Critiques
- [x] 1.1 Remplacer eval() dans calculateur par parser safe (Function constructor sandboxe)
- [x] 1.2 Sanitizer dangerouslySetInnerHTML avec DOMPurify (ministry detail)
- [x] 1.3 Rate limiting Redis sur endpoints publics (/search, /stats, /service)
- [x] 1.4 Header search button: redirect vers /services avec focus search
- [x] 1.5 Aria-labels accessibilite (header, search, view toggles)
- [x] 1.6 Error messages: ne pas exposer details internes (DB errors -> generic msg)

## Phase 2 - Performance Backend
- [ ] 2.1 Parallelize service detail (asyncio.gather 6 queries)
- [ ] 2.2 Unifier search: fiscal_services/search-db -> utiliser MV comme homepage
- [ ] 2.3 Trigger refresh MV sur UPDATE fiscal_services (PG notify ou post-update)
- [ ] 2.4 Service detail: view_count increment async (fire-and-forget)

## Phase 3 - UX/Mobile
- [ ] 3.1 Filtres mobile: drawer/sheet au lieu de 5 selects en ligne
- [ ] 3.2 Skeleton loading: services cards, detail, ministries
- [ ] 3.3 CTA "Solicitar" sur service detail -> lien vers wizard
- [ ] 3.4 Debounce search sur ministries page
- [ ] 3.5 Services: reduire ITEMS_PER_PAGE 18->12 pour mobile
- [ ] 3.6 Service detail: error retry button

## Phase 4 - SEO & Accessibilite
- [ ] 4.1 JSON-LD: Organization (homepage), BreadcrumbList (toutes pages)
- [ ] 4.2 OG meta tags per page (og:title, og:description, og:image)
- [ ] 4.3 Canonical tags multilingues
- [ ] 4.4 Skip-to-content link
- [ ] 4.5 Keyboard navigation: cards focusable, enter = click

## Files Modified
Phase 1: calculateur/page.tsx, ministere/[id]/page.tsx, homepage_routes.py, Header.tsx, services/page.tsx
Phase 2: service_details_repository.py, homepage_routes.py, search_repository.py
Phase 3: services/page.tsx, services/[id]/page.tsx, ministere/page.tsx
Phase 4: layout.tsx (public), page.tsx (all public pages)
