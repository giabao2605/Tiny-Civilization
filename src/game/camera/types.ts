export type CameraMode = 'manual' | 'fit' | 'reset';
export type CameraSnapshot = Readonly<{
  mode: CameraMode;
  zoom: number;
  scrollX: number;
  scrollY: number;
  viewportWidth: number;
  viewportHeight: number;
}>;
export interface WorldCameraControls {
  fit(): void;
  reset(): void;
  zoomBy(factor: number, screenPoint?: { x: number; y: number }): void;
  getCameraSnapshot(): CameraSnapshot;
}
