# Q07-E save safety

Reader supports legacy v5 format 1, historical v6 pre-weather format 2 and current v6 weather format 3. Existing `t06c.integrity.test.ts` covers v5→v6 continuity, format-2 hydration, tampered RNG, byte-counted 8 MiB limit, pending command validation and atomic coordinator rejection. New `q07e.atomic.test.ts` expands rejection across 20/50/100 NPC and tests current v6 split replay.

Cases included: malformed JSON, unsupported engine, corrupted RNG, invalid market cash, dangling home, invalid command, oversized payload. Tests assert unchanged live snapshot, paused/speed state and re-export after every rejected import. These tests do not prove localStorage quota behavior; storage is handled separately by app-level code and requires actual execution or targeted test. **Verification status: SUBMITTED, pending exact-head Fast CI.**
