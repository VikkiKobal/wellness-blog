/**
 * API utility functions for communicating with the Go backend
 */

const API_BASE_URL = import.meta.env.PUBLIC_API_URL || 'http://localhost:8080/api';

export interface User {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
}

export interface VerifyTokenResponse {
  valid: boolean;
  user?: User;
  error?: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: User;
}

/**
 * Verify a Firebase ID token with the backend
 */
export async function verifyToken(idToken: string): Promise<VerifyTokenResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ idToken }),
    });

    if (!response.ok) {
      const error = await response.json();
      return {
        valid: false,
        error: error.error || 'Failed to verify token',
      };
    }

    return await response.json();
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

/**
 * Get user information from the backend using Authorization header
 */
export async function getUser(idToken: string): Promise<User | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/user`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${idToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching user:', error);
    return null;
  }
}

/**
 * Refresh token verification
 */
export async function refreshToken(idToken: string): Promise<AuthResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ idToken }),
    });

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        message: error.error || 'Failed to refresh token',
      };
    }

    return await response.json();
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Network error',
    };
  }
}

/**
 * Health check
 */
export async function healthCheck(): Promise<{ status: string; service: string; time: string } | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    if (!response.ok) {
      return null;
    }
    return await response.json();
  } catch (error) {
    console.error('Health check failed:', error);
    return null;
  }
}






