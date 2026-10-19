export type CameraMode = 'manual' | 'fit' | 'reset' | 'follow' | 'afk';
export type CameraSnapshot = Readonly<{
  mode: CameraMode;
  zoom: number;
  scrollX: number;
  scrollY: number;
  viewportWidth: number;
  viewportHeight: number;
  followTargetId: number | null;
  afkEnabled: boolean;
  afkTimeoutMs: number;
  afkTargetKey: string | null;
  reducedMotion: boolean;
}>;
export interface WorldCameraControls {
  fit(): void;
  reset(): void;
  zoomBy(factor: number, screenPoint?: { x: number; y: number }): void;
  followNpc(id: number): boolean;
  startHighlightsTour(): void;
  setAfkEnabled(enabled: boolean): void;
  setAfkTimeoutMs(timeoutMs: number): void;
  noteActivity(): void;
  getCameraSnapshot(): CameraSnapshot;
}
