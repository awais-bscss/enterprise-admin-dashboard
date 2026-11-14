export interface HealthResponse {
  ok: boolean;
  service: string;
  db: 'connected' | 'connecting' | 'disconnected';
  environment: string;
  timestamp: string;
  probeCookieSet?: boolean;
}

export interface ApiErrorResponse {
  ok: false;
  error: {
    code: string;
    message: string;
  };
}
