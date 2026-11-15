export interface HealthResponse {
  ok: boolean;
  service: string;
  db: 'connected' | 'connecting' | 'disconnected';
  environment: string;
  timestamp: string;
}

export interface ApiSuccessResponse<T> {
  ok: true;
  data: T;
}

export interface ApiErrorResponse {
  ok: false;
  error: {
    code: string;
    message: string;
  };
}
