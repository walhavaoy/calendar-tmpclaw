# Learned Rules Consolidation

**Date:** 2026-04-27
**Before:** 140 rules (massive duplication)
**After:** 29 canonical rules (zero duplication, full semantic coverage)

## Mapping: Original Rule Numbers → Canonical Rule

| Canonical # | Theme | Original Rules Consolidated |
|---|---|---|
| 1 | PRIORITY 0 — main check + fast-exit | 1, 16, 46–55, 59, 61, 73, 81, 83, 125, 132 |
| 2 | Scope check — out-of-domain | 2, 22 |
| 3 | Git workflow | 3 |
| 4 | Build & version | 4, 60, 130 |
| 5 | Branch verification before finish | 45, 85–89, 91–98, 100, 102–104, 106–109, 111, 113–114, 116, 118–122, 124, 126–129, 131, 133–140 |
| 6 | Scope discipline | 12, 82, 90, 94, 97, 99, 101, 105, 110, 112, 115, 117, 123 |
| 7 | Rename & refactor | 31, 57, 58, 62, 63, 65–72 |
| 8 | Cross-cutting changes | 74, 76, 78 |
| 9 | MFE code patterns | 5, 79, 84 |
| 10 | MFE lifecycle & DOM | 6 |
| 11 | MFE cross-bundle & manifest | 7 |
| 12 | CRD & Helm conventions | 8, 21, 26, 34 |
| 13 | K8s client & naming | 9 |
| 14 | Security patterns | 10, 41, 43 |
| 15 | Async & cleanup safety | 11 |
| 16 | Event handler hygiene | 13 |
| 17 | Removal & cleanup sweeps | 14, 80 |
| 18 | Build failure handling | 15, 27, 77 |
| 19 | Verification tasks | 17 |
| 20 | Frontend/backend integration | 18, 19 |
| 21 | Deletion & file safety | 24, 32, 33 |
| 22 | Code style & error handling | 25, 29, 42, 44 |
| 23 | Runtime & Dockerfile changes | 23 |
| 24 | Code duplication & sibling consistency | 36, 56 |
| 25 | Taskmaster API auth | 75 |
| 26 | AC verification | 20, 109 |
| 27 | Flutter patterns | 37, 38 |
| 28 | Android/Gradle builds | 39, 40 |
| 29 | CSS & UI patterns | 28, 30, 64, 68 |

## Reduction Summary

- **~50 rules** about "empty branch verification before finish" → **1 canonical rule** (#5)
- **~20 rules** about "check main before starting" → merged into **PRIORITY 0** (#1)
- **~13 rules** about "scope discipline / no scope creep" → **1 canonical rule** (#6)
- **~12 rules** about "rename grep all occurrences" → **1 canonical rule** (#7)
- Remaining unique rules preserved 1:1 or merged with closely related topics
