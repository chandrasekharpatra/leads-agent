declare module '#auth-utils' {
  interface User {
    userId: string;
  }

  interface UserSession {
    expiresAt: number;
  }

  interface SecureSessionData {
    token: string;
  }
}

export {}