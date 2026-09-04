import path from 'path';
import os from 'os';

export const IS_SERVERLESS = !!process.env.VERCEL || !!process.env.AWS_LAMBDA_FUNCTION_NAME;
export const UPLOAD_DIR = IS_SERVERLESS ? path.join(os.tmpdir(), 'karhari-tube', 'uploads') : path.join(process.cwd(), 'uploads');
export const SOCIAL_VIDEO_DIR = path.join(UPLOAD_DIR, 'social-videos');
export const ALLOWED_AUDIO_TYPES = ['audio/mpeg','audio/mp3','audio/wav','audio/x-wav','audio/flac','audio/x-flac','audio/aac','audio/x-aac'];
export const ALLOWED_IMAGE_TYPES = ['image/jpeg','image/png','image/webp'];
export const MAX_AUDIO_BYTES = 200 * 1024 * 1024;
export const MAX_IMAGE_BYTES = 15 * 1024 * 1024;
