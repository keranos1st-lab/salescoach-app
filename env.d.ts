declare namespace NodeJS {
  interface ProcessEnv {
    WORMSOFT_API_URL?: string;
    WORMSOFT_API_KEY?: string;
    WORMSOFT_MODEL?: string;
    NEXT_PUBLIC_SUPABASE_URL?: string;
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?: string;
    SUPABASE_SERVICE_ROLE_KEY?: string;
    SUPABASE_STORAGE_CALLS_BUCKET?: string;
  }
}
