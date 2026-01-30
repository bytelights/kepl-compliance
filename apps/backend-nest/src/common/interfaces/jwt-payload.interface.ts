export interface JwtPayload {
  sub: string; // user id
  email: string;
  workspaceId: string;
  role: string;
  iat?: number;
  exp?: number;
}

export interface RequestWithUser extends Request {
  user: JwtPayload;
}
