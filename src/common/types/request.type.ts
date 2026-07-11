export interface RequestWithId extends Request {
  requestId: string;
}

export interface CurrentUserPayload {
  userId: string;
  sessionId: string;
}

export interface AuthenticatedRequest extends RequestWithId {
  user: CurrentUserPayload;
}

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: Date;
}

export interface UserWithCredentials extends UserProfile {
  passwordHash: string;
}

export interface SessionInfo {
  id: string;
  token: string;
  expiresAt: Date;
}

export interface SessionPayload {
  userId: string;
  sessionId: string;
}

export interface LoginResult {
  user: Pick<UserProfile, 'id' | 'email' | 'firstName' | 'lastName'>;
  session: SessionInfo;
}
