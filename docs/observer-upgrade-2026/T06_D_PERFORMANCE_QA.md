# T06-D performance QA

Physical Windows/PC, audio, 60-120-minute soak: **NOT MEASURED**. Browser Chromium FPS/frame time: **NOT MEASURED**. Node simulation tick benchmark: **NOT RUN**. No performance pass/fail decision possible.

Run headed Chromium with consistent GPU acceleration and 1366x768/1920x1080. Record browser/OS/CPU/GPU/RAM, scenario seed, valid legacy 48x48 fixture where applicable, 96x96, populations 20/50/100, 1x/5x/20x, observer pace 5/10/15, camera modes, effects and diagnostics. At least 3 warmed samples per representative scenario; isolate frame vs tick costs and compare same hardware/browser conditions.
