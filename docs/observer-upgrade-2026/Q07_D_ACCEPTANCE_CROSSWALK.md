# Q07-D QA-08 addendum to Q07-A acceptance crosswalk

| Acceptance | Automated evidence | Real-viewing evidence | Product result |
|---|---|---|---|
| Sign of life in 30 real seconds | `director.test.ts` covers 30 seconds virtual scheduling | NOT RUN | PARTIAL |
| At least three categories in 5 real minutes | `q07d.watchability.test.ts` asserts observed-only category reducer; `director.test.ts` virtual 300000ms categories | NOT RUN | PARTIAL |
| Meaningful 20–30 minute sequence | Source audit of ambient, camera and natural simulation fixtures | NOT RUN | NOT RUN |
| Observer/camera comfort | AFK tests and source review | NOT RUN | PARTIAL |

The original `Q07_A_ACCEPTANCE_CROSSWALK.md` QA-08 row remains PARTIAL. This addendum details the newer evidence without rewriting the Q07-A historical baseline. No WATCHABILITY VERIFIED claim. Performance and release gates remain Q07-E/F.
