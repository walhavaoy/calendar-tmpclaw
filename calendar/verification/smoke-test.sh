#!/usr/bin/env bash
# Calendar Phase 6 — Smoke Test & Verification Script
# Runs all 8 acceptance criteria checks and reports pass/fail.
# Usage: bash calendar/verification/smoke-test.sh
set -euo pipefail

NAMESPACE="tmpclaw"
CALENDAR_URL="https://calendar.tmpclaw.io"
SHELL_URL="https://shell.calendar.tmpclaw.io"
PASS=0
FAIL=0
RESULTS=""

check() {
  local num="$1" name="$2" result="$3" detail="$4"
  if [ "$result" = "PASS" ]; then
    PASS=$((PASS + 1))
  else
    FAIL=$((FAIL + 1))
  fi
  RESULTS="${RESULTS}| ${num} | ${name} | ${result} | ${detail} |\n"
}

echo "=== Calendar Phase 6 Smoke Test ==="
echo "Date: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo ""

# Check 1: GET /healthz -> {status:'ok'}
HEALTHZ_CODE=$(curl -s -o /tmp/healthz_body -w "%{http_code}" --max-time 10 "${CALENDAR_URL}/healthz" 2>/dev/null || echo "000")
HEALTHZ_BODY=$(cat /tmp/healthz_body 2>/dev/null || echo "no response")
if [ "$HEALTHZ_CODE" = "200" ] && echo "$HEALTHZ_BODY" | grep -q '"status".*"ok"'; then
  check 1 "GET /healthz returns {status:'ok'}" "PASS" "HTTP ${HEALTHZ_CODE}: ${HEALTHZ_BODY}"
else
  check 1 "GET /healthz returns {status:'ok'}" "FAIL" "HTTP ${HEALTHZ_CODE}: ${HEALTHZ_BODY}"
fi

# Check 2: Pods calendar + calendar-shell Running
CAL_PODS=$(kubectl get pods -n "$NAMESPACE" -l app=calendar --no-headers 2>/dev/null | grep -c "Running" || echo "0")
SHELL_PODS=$(kubectl get pods -n "$NAMESPACE" -l app=calendar-shell --no-headers 2>/dev/null | grep -c "Running" || echo "0")
if [ "$CAL_PODS" -gt 0 ] && [ "$SHELL_PODS" -gt 0 ]; then
  check 2 "Pods: calendar + calendar-shell Running" "PASS" "calendar=${CAL_PODS}, calendar-shell=${SHELL_PODS}"
else
  check 2 "Pods: calendar + calendar-shell Running" "FAIL" "calendar=${CAL_PODS}, calendar-shell=${SHELL_PODS}"
fi

# Check 3: IngressRoute: two calendar entries
INGRESS_COUNT=$(kubectl get ingressroute -n "$NAMESPACE" -o name 2>/dev/null | grep -ci "calendar" || echo "0")
if [ "$INGRESS_COUNT" -ge 2 ]; then
  check 3 "IngressRoute: two calendar entries" "PASS" "Found ${INGRESS_COUNT} calendar IngressRoutes"
else
  check 3 "IngressRoute: two calendar entries" "FAIL" "Found ${INGRESS_COUNT} calendar IngressRoutes"
fi

# Check 4: TLS: https://calendar.tmpclaw.io -> 200
TLS_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "${CALENDAR_URL}/" 2>/dev/null || echo "000")
if [ "$TLS_CODE" = "200" ]; then
  check 4 "TLS: ${CALENDAR_URL} -> 200" "PASS" "HTTP ${TLS_CODE}"
else
  check 4 "TLS: ${CALENDAR_URL} -> 200" "FAIL" "HTTP ${TLS_CODE}"
fi

# Check 5: Shell: https://shell.calendar.tmpclaw.io -> 200
SHELL_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "${SHELL_URL}/" 2>/dev/null || echo "000")
if [ "$SHELL_CODE" = "200" ]; then
  check 5 "Shell: ${SHELL_URL} -> 200" "PASS" "HTTP ${SHELL_CODE}"
else
  check 5 "Shell: ${SHELL_URL} -> 200" "FAIL" "HTTP ${SHELL_CODE}"
fi

# Check 6: DB: cal_calendars table with Family row
DB_CHECK=$(kubectl exec -n "$NAMESPACE" deploy/postgres -- psql -U postgres -tAc \
  "SELECT count(*) FROM information_schema.tables WHERE table_name='cal_calendars';" 2>/dev/null || echo "error")
FAMILY_CHECK="n/a"
if [ "$DB_CHECK" = "1" ]; then
  FAMILY_CHECK=$(kubectl exec -n "$NAMESPACE" deploy/postgres -- psql -U postgres -tAc \
    "SELECT count(*) FROM cal_calendars WHERE name='Family';" 2>/dev/null || echo "error")
fi
if [ "$DB_CHECK" = "1" ] && [ "$FAMILY_CHECK" -gt 0 ] 2>/dev/null; then
  check 6 "DB: cal_calendars table with Family row" "PASS" "table exists, Family row count=${FAMILY_CHECK}"
else
  check 6 "DB: cal_calendars table with Family row" "FAIL" "table_exists=${DB_CHECK}, family_row=${FAMILY_CHECK}"
fi

# Check 7: data-testid attributes in HTML
HTML_BODY=$(curl -s --max-time 10 "${CALENDAR_URL}/" 2>/dev/null || echo "")
TESTID_COUNT=$(echo "$HTML_BODY" | grep -co 'data-testid' || echo "0")
if [ "$TESTID_COUNT" -gt 0 ]; then
  check 7 "data-testid attributes in HTML" "PASS" "Found ${TESTID_COUNT} data-testid attributes"
else
  check 7 "data-testid attributes in HTML" "FAIL" "Found ${TESTID_COUNT} data-testid attributes (no HTML served)"
fi

# Check 8: Mobile CSS @media max-width:768px
CSS_CHECK=$(curl -s --max-time 10 "${CALENDAR_URL}/" 2>/dev/null || echo "")
MEDIA_COUNT=$(echo "$CSS_CHECK" | grep -co 'max-width.*768' || echo "0")
if [ "$MEDIA_COUNT" -gt 0 ]; then
  check 8 "Mobile CSS @media max-width:768px" "PASS" "Found ${MEDIA_COUNT} responsive breakpoints"
else
  # Also check linked CSS files
  CSS_URLS=$(echo "$CSS_CHECK" | grep -oP 'href="[^"]*\.css"' | head -5 || true)
  check 8 "Mobile CSS @media max-width:768px" "FAIL" "No responsive breakpoints found (no CSS served)"
fi

echo ""
echo "| # | Check | Result | Detail |"
echo "|---|-------|--------|--------|"
echo -e "$RESULTS"
echo ""
echo "=== Summary: ${PASS}/8 PASS, ${FAIL}/8 FAIL ==="
if [ "$FAIL" -gt 0 ]; then
  echo "VERDICT: BLOCKED — not all checks pass"
  exit 1
else
  echo "VERDICT: ALL CHECKS PASS"
  exit 0
fi
