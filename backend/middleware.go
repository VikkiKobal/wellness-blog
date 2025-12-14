package main

import (
	"context"
	"net/http"
	"strings"
)

// AuthMiddleware verifies Firebase ID token from Authorization header
func (s *Server) AuthMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			http.Error(w, "Authorization header is required", http.StatusUnauthorized)
			return
		}

		// Extract token from "Bearer <token>"
		token := authHeader
		if len(authHeader) > 7 && authHeader[:7] == "Bearer " {
			token = authHeader[7:]
		}

		// Verify token
		ctx := r.Context()
		decodedToken, err := s.authClient.VerifyIDToken(ctx, token)
		if err != nil {
			http.Error(w, "Invalid token: "+err.Error(), http.StatusUnauthorized)
			return
		}

		// Add user ID to context
		ctx = context.WithValue(ctx, "userID", decodedToken.UID)
		ctx = context.WithValue(ctx, "token", decodedToken)

		next(w, r.WithContext(ctx))
	}
}

// OptionalAuthMiddleware allows requests with or without authentication
func (s *Server) OptionalAuthMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		authHeader := r.Header.Get("Authorization")
		if authHeader != "" {
			token := strings.TrimPrefix(authHeader, "Bearer ")
			if token != "" {
				ctx := r.Context()
				decodedToken, err := s.authClient.VerifyIDToken(ctx, token)
				if err == nil {
					ctx = context.WithValue(ctx, "userID", decodedToken.UID)
					ctx = context.WithValue(ctx, "token", decodedToken)
					r = r.WithContext(ctx)
				}
			}
		}
		next(w, r)
	}
}







