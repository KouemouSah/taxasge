#!/bin/bash
# Wrapper bash para check-i18n.js (implementación robusta en Node)
# Uso: bash docs/manual/tools/check-i18n-keys.sh
exec node "$(dirname "$0")/check-i18n.js" "$@"
