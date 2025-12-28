package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"strings"
)

// AuthMiddleware verifies Firebase ID token from Authorization header and checks for admin rights
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

		// SECURITY: Strict Admin Verification
		userEmail := ""
		if email, ok := decodedToken.Claims["email"].(string); ok {
			userEmail = strings.ToLower(strings.TrimSpace(email))
		}

		if userEmail == "" {
			log.Printf("Security alert: No email claim in token for UID: %s", decodedToken.UID)
			http.Error(w, "Unauthorized: Email verification required", http.StatusForbidden)
			return
		}

		adminEmailsStr := os.Getenv("ADMIN_EMAILS")
		if adminEmailsStr == "" {
			log.Println("CRITICAL: ADMIN_EMAILS environment variable is NOT SET. Denying all admin requests.")
			http.Error(w, "Server configuration error: Admin list missing", http.StatusForbidden)
			return
		}

		isAdmin := false
		allowedList := strings.Split(adminEmailsStr, ",")
		for _, email := range allowedList {
			if strings.ToLower(strings.TrimSpace(email)) == userEmail {
				isAdmin = true
				break
			}
		}

		if !isAdmin {
			log.Printf("Access DENIED: User %s tried to perform an admin action", userEmail)
			http.Error(w, "Access denied: You do not have administrator privileges", http.StatusForbidden)
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








