# Q07-B save-integrity QA

Protected by unchanged existing suites: genuine legacy v5 48×48 format 1 fixture; historical synthetic v6 format 2; current weather v6 format 3; malformed and >8MiB UTF-8 payload rejection, dangling references and atomic coordinator import; governance pending and nextRequestId; frozen 12 SHA-256 T06-C checkpoints.

Additional independent replay/save split on legacy generator and current world is in `src/sim/q07b.replay.test.ts`. The original v5 world migrates to v6 via `parseSave`; this assertion avoids falsely equating changed weather-driven future states with legacy engine future.

**Never regenerate golden 12 expectations or alter compressed legacy fixture to pass tests.** Full suite result must be validated on exact final PR HEAD SHA. Browser-localStorage quota/manual import evidence is Q07-E/manual, NOT RUN.
