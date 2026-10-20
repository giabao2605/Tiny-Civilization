/** Narrow, optional scene-to-React bridge. Never holds an AudioContext in Phaser. */
import type { AmbientActorDescriptor, AmbientTransition } from '../ambient/director';
import type { AudioViewport } from './soundModel';

export type AmbientAudioBridge = Readonly<{
  transitions: (changes: readonly AmbientTransition[], actors: readonly AmbientActorDescriptor[],
    viewport: AudioViewport) => void;
  viewport: (viewport: AudioViewport) => void;
  reset: () => void;
  /** Optional, read-only diagnostics for opt-in local profiling only. */
  diagnostics?: () => object | null;
}>;
