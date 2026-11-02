/// <reference types="vite/client" />

interface ImportMetaEnv {
  /**
   * The base URL for the backend REST API (e.g. http://localhost:3000/api/v1)
   */
  readonly VITE_API_BASE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

