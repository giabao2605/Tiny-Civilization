# Tiny Civilization

**Tiny Civilization** is a browser-based, pixel-art, autonomous civilization simulator. Watch a small settlement's citizens work, eat, form relationships, trade, argue, govern, and react to crises. The simulation, not scripted cutscenes, generates the history.

> Status: **Planning only**. There is no playable build yet. The roadmap describes intended work, not completed features.

## Read before coding

1. [Master plan](docs/MASTER_PLAN.md): vision, phase gates, scope, architecture and delivery rules.
2. [Simulation contract](docs/SIMULATION_CONTRACT.md): time, state, deterministic rules and invariants.
3. [Phase plans](docs/phases/): one detailed execution plan for each phase (00–08).
4. [Progress tracker](docs/PROGRESS.md): honest status, blockers and next execution step.

## MVP direction

- Single-player, desktop-first, offline-capable after assets load.
- One 48×48 tile settlement, starting with 20 citizens and ultimately aiming for 100.
- React + TypeScript for app UI; Phaser for map rendering; a framework-independent simulation engine.
- No account, backend, multiplayer, paid AI API, or complicated physics in MVP.
- Seeded, inspectable, testable simulation; save/load before release.

## Workflow

Implement one phase at a time: read the phase plan and simulation contract, complete the vertical slice, run tests, demonstrate it in browser, verify acceptance criteria, and only then mark it complete in the progress tracker. Keep features on a branch/PR where practical.

**The project owner reviews design and gameplay decisions.** Planning documents can evolve when actual playtests justify changes; any significant scope change should be explained before implementation.

Source: [GitHub repository](https://github.com/giabao2605/Tiny-Civilization)
