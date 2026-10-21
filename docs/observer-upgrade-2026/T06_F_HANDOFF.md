# T06-F handoff / Plan 06 closure boundary
Preflight T06-E main merge + exact-sha CI PASS. One targeted Web Audio asynchronous teardown race fixed with regression; lifecycle, ambient, renderer ownership and coordinator source audited. No gameplay or save changes, no deployment and no merge.

Gate for CODE VERIFIED: confirm GitHub Fast CI completed/success on the exact PR final HEAD (audit, typecheck, lint, Vitest, build). Gate for LOCAL PC RELIABILITY VERIFIED: conduct the documented optional desktop smoke on real PC; currently NOT RUN. Memory/FPS/soak NOT MEASURED. Remaining risks: asynchronous browser/WebGL driver disposal and extended repeated real-browser remount are not proven by Node unit tests.

Preserve deterministic simulation and legacy save formats. Review Draft PR, do not merge without owner approval.
