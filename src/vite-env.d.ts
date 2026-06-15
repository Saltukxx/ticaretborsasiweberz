/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_SAME_ORIGIN_API?: string;
  readonly VITE_SITE_URL?: string;
  readonly VITE_ALLOW_INDEXING?: string;
  readonly VITE_GA_MEASUREMENT_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
