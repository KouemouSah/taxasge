"""
Menu Config Constants
Centralized constants for form_data column discovery and flattening.

These constants are shared between:
- display_config_repository.py (SQL column discovery)
- agent_routes._extract_preview_data() (Python data transformation)

@date 2026-02-02
"""

from typing import List, Set

# Keys to flatten (nested objects with useful data for display)
# Example: dip.natural_de → dip_natural_de
NESTED_KEYS_TO_FLATTEN: List[str] = ['dip', 'pasaporte_antiguo']

# Keys to completely exclude (binary/complex data not useful for display)
EXCLUDE_KEYS: Set[str] = {'photo_carnet'}

# Internal filter keys (used for filtering, not for display as columns)
# These are workflow sub-type indicators
INTERNAL_FILTER_KEYS: Set[str] = {'sub_type', 'is_minor', 'solicitud_type', 'motivo'}

# Combined exclusion set for SQL queries
SQL_EXCLUDE_KEYS: Set[str] = EXCLUDE_KEYS | INTERNAL_FILTER_KEYS
