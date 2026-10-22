# Q07-E soak and lifecycle

Real 60–120 minute PC soak: **NOT RUN**. T=0/15/60/120 resource samples: **NOT MEASURED**. No claims about sustained memory trends, actual FPS, GPU usage or leaks. Source audit finds coordinator lease release and interval/visibility listener teardown in `livingCoordinator.ts`; this is static source evidence, not measurement. Audio, ambient, Phaser scene remount and tab-hide stress remain runtime acceptance gaps. Virtual tick replay is not a real-time soak.
