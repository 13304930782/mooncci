export const videoClassOptions = [
  { code: 'software-24-7', label: '软件24-7' },
  { code: 'software-24-8', label: '软件24-8' },
  { code: 'software-24-9', label: '软件24-9' },
  { code: 'software-24-10', label: '软件24-10' },
] as const;

export type VideoClassCode = typeof videoClassOptions[number]['code'];

export function getVideoClassLabel(code?: string | null) {
  return videoClassOptions.find((item) => item.code === code)?.label || '';
}

export function isVideoClassCode(value?: string | null): value is VideoClassCode {
  return videoClassOptions.some((item) => item.code === value);
}
