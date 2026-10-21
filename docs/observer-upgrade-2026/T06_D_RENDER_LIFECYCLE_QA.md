# T06-D — Render lifecycle QA

Source audit: GameCanvas destroys Phaser instances at remount, disconnects ResizeObserver, cancels animation frames and deletes optional diagnostics closure. WorldScene shutdown unsubscribes input, visibility and reduced-motion listeners; disposes weather/ambient objects and generated lighting textures. Forest culling adds an array of static tree handles and last camera bounds, both cleared on scene shutdown. Visibility checks never create new textures or destroy sprites during zoom/follow/pan.

Fast `forestCulling.test.ts` covers camera scroll/zoom bounds, margin, hide-and-return and non-square viewport, with no browser/GPU installation.

Earlier, the optional full Chromium T06-D run [#39531644418](https://github.com/giabao2605/Tiny-Civilization/actions/runs/39531644418) completed SUCCESS before the owner opted out of browser benchmarking. Its dedicated tests/workflow are now removed to keep CI fast. It is not physical-PC leak certification.

Browser lifecycle soak, real GPU resources and audio listening: NOT MEASURED. No assertion that a real-device visual acceptance was performed.
