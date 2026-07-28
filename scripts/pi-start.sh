#!/usr/bin/env bash
# Back-compat: npm run start:pi → same as ./start
exec "$(cd "$(dirname "$0")" && pwd)/dash.sh" start
