// ── User domain model ────────────────────────────────────────

export type Role = 'user' | 'admin';

export interface User {
  id: string;
  username: string;
  passwordHash: string;
  role: Role;
  createdAt: Date;
}

// ── Auth request types ───────────────────────────────────────

export interface RegisterRequest {
  username: string;
  password: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

// ── Auth response types ──────────────────────────────────────

export interface UserProfile {
  username: string;
  role: Role;
  createdAt: string; // ISO 8601
}

export interface MessageResponse {
  message: string;
}

export interface ErrorResponse {
  error: string;
}

// ── JWT ──────────────────────────────────────────────────────

export interface JwtPayload {
  sub: string;       // user id (UUID v4)
  username: string;
  role: Role;
  iat?: number;
  exp?: number;
}
