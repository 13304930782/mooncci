export const videoTrainingSessionOptions = [
  { code: 'training-1', label: '综训1' },
  { code: 'training-2', label: '综训2' },
] as const;

export type VideoTrainingSessionCode = typeof videoTrainingSessionOptions[number]['code'];

export function getVideoTrainingSessionLabel(code?: string | null) {
  return videoTrainingSessionOptions.find((item) => item.code === code)?.label || '';
}

export function isVideoTrainingSessionCode(value?: string | null): value is VideoTrainingSessionCode {
  return videoTrainingSessionOptions.some((item) => item.code === value);
}
