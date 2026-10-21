# T06-F resource cleanup and ownership
Confirmed issue: WeatherAudio pending `AudioContext.resume()` crossed React unmount cleanup. Previous code could dereference a nulled context and increment a false unlock failure. Guard the captured resource across the async boundary and add delayed-resume regression.

Audited without modifications: coordinator interval/visibility callback, GameCanvas rAF/ResizeObserver/Phaser game, scene input/camera/AFK timers, textures and weather particles, ambient descriptor registries, audio loop/voice teardown. Their code has explicit cleanup paths. No arbitrary cache eviction, renderer rewrite or speculative GC fixes were made.

Memory/FPS: NOT MEASURED; WebGL/GPU retention and repeated desktop scene remount require manual verification. Valid caches, GC lag and real leaks must not be conflated.
