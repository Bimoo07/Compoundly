// Diisi saat build oleh vite.config.js (define). Fallback dipakai bila file
// ini dijalankan di luar Vite.
export const APP_VERSION = typeof __APP_VERSION__ !== "undefined" ? __APP_VERSION__ : "dev";
export const APP_COMMIT = typeof __APP_COMMIT__ !== "undefined" ? __APP_COMMIT__ : "dev";
export const APP_BUILD_DATE = typeof __APP_BUILD_DATE__ !== "undefined" ? __APP_BUILD_DATE__ : "";
