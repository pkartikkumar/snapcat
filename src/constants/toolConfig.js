export const TABS = {
  RESIZE: 'resize',
  COMPRESS: 'compress',
  CONVERT: 'convert',
  TRANSPARENT: 'transparent',
  PDF: 'pdf',
  EDITOR: 'editor',
  HTML_TO_IMAGE: 'html-to-image',
  WATERMARK: 'watermark',
  AI_GENERATE: 'ai-generate',
};

export const ACCEPTED_IMAGE_TYPES = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/avif',
  'image/svg+xml',
  'image/gif',
  '.heic',
  '.heif'
].join(',');