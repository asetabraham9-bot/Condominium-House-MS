/**
 * PHP API base URL. When unset, use a same-origin path so Vite can proxy to XAMPP in dev
 * (see vite.config.ts). Set VITE_API_BASE_URL in .env if the API lives on another host.
 */
export const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') ||
  '/REALPRO/php_backend/api';

/** Uploaded files live under php_backend/uploads (not under /api). */
export function uploadsPublicUrl(relativePath: string): string {
  const rel = relativePath.replace(/^\/+/, '');
  const backendRoot = API_BASE_URL.replace(/\/api\/?$/, '');
  return `${backendRoot}/uploads/${rel}`;
}
