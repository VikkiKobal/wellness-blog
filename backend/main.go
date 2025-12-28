package main

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"firebase.google.com/go/v4"
	"firebase.google.com/go/v4/auth"
	"github.com/gorilla/handlers"
	"github.com/gorilla/mux"
	"github.com/joho/godotenv"
	"google.golang.org/api/option"
)	


type Server struct {
	firebaseApp *firebase.App
	authClient  *auth.Client
}

type SignInRequest struct {
	IDToken string `json:"idToken"`
}

type SignUpRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
	Name     string `json:"name,omitempty"`
}

type AuthResponse struct {
	Success bool   `json:"success"`
	Message string `json:"message"`
	Token   string `json:"token,omitempty"`
	User    *User  `json:"user,omitempty"`
}

type User struct {
	UID         string `json:"uid"`
	Email       string `json:"email"`
	DisplayName string `json:"displayName,omitempty"`
	PhotoURL    string `json:"photoURL,omitempty"`
}

type VerifyTokenRequest struct {
	IDToken string `json:"idToken"`
}

type VerifyTokenResponse struct {
	Valid bool   `json:"valid"`
	User  *User  `json:"user,omitempty"`
	Error string `json:"error,omitempty"`
}

func main() {
	// Load environment variables
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using environment variables")
	}

	// Initialize Firebase
	ctx := context.Background()

	// 1. ВИПРАВЛЕНО: Правильне використання опції Service Account
	sa := option.WithCredentialsFile("serviceAccountKey.json")

	// 2. ВИПРАВЛЕНО: Передаємо nil для конфігурації, а потім опцію sa
	app, err := firebase.NewApp(ctx, nil, sa)
	if err != nil {
		log.Fatalf("Error initializing Firebase app: %v", err)
	}
	// --------------------------------------------------------

	// 3. ВИПРАВЛЕНО: Оголошення authClient тепер використовується
	authClient, err := app.Auth(ctx)
	if err != nil {
		log.Fatalf("Error getting Auth client: %v", err)
	}

	server := &Server{
		firebaseApp: app,
		authClient:  authClient,
	}

	// Initialize Database
	initDB()

	// Setup router
	router := mux.NewRouter()

	// API routes
	api := router.PathPrefix("/api").Subrouter()
	api.HandleFunc("/health", healthCheck).Methods("GET")
	api.HandleFunc("/auth/verify", server.verifyToken).Methods("POST")
	api.HandleFunc("/auth/user", server.getUser).Methods("GET")
	api.HandleFunc("/auth/refresh", server.refreshToken).Methods("POST")
	api.HandleFunc("/contact", server.contact).Methods("POST")

	// Article Routes
	api.HandleFunc("/articles", server.getArticles).Methods("GET")
	api.HandleFunc("/articles/{id}", server.getArticle).Methods("GET")
	api.HandleFunc("/articles", server.AuthMiddleware(server.createArticle)).Methods("POST")
	api.HandleFunc("/articles/{id}", server.AuthMiddleware(server.updateArticle)).Methods("PUT")
	api.HandleFunc("/articles/{id}", server.AuthMiddleware(server.deleteArticle)).Methods("DELETE")

	// Course Routes
	api.HandleFunc("/courses", server.getCourses).Methods("GET")
	api.HandleFunc("/courses", server.AuthMiddleware(server.createCourse)).Methods("POST")
	api.HandleFunc("/courses/{id}", server.AuthMiddleware(server.updateCourse)).Methods("PUT")
	api.HandleFunc("/courses/{id}", server.AuthMiddleware(server.deleteCourse)).Methods("DELETE")

	// Category Routes
	api.HandleFunc("/categories", server.getCategories).Methods("GET")
	api.HandleFunc("/categories/reorder", server.AuthMiddleware(server.reorderCategories)).Methods("PUT")
	api.HandleFunc("/categories", server.AuthMiddleware(server.createCategory)).Methods("POST")
	api.HandleFunc("/categories/{id}", server.AuthMiddleware(server.updateCategory)).Methods("PUT")
	api.HandleFunc("/categories/{id}", server.AuthMiddleware(server.deleteCategory)).Methods("DELETE")

	// Project Routes
	api.HandleFunc("/projects", server.getProjects).Methods("GET")
	api.HandleFunc("/projects", server.AuthMiddleware(server.createProject)).Methods("POST")
	api.HandleFunc("/projects/reorder", server.AuthMiddleware(server.reorderProjects)).Methods("PUT")
	api.HandleFunc("/projects/{id}", server.AuthMiddleware(server.updateProject)).Methods("PUT")
	api.HandleFunc("/projects/{id}", server.AuthMiddleware(server.deleteProject)).Methods("DELETE")

	// Certificate Routes
	api.HandleFunc("/certificates", server.getCertificates).Methods("GET")
	api.HandleFunc("/certificates", server.AuthMiddleware(server.createCertificate)).Methods("POST")
	api.HandleFunc("/certificates/reorder", server.AuthMiddleware(server.reorderCertificates)).Methods("PUT")
	api.HandleFunc("/certificates/{id}", server.AuthMiddleware(server.updateCertificate)).Methods("PUT")
	api.HandleFunc("/certificates/{id}", server.AuthMiddleware(server.deleteCertificate)).Methods("DELETE")

	// CORS middleware
	allowedOrigins := []string{"http://localhost:4321", "http://localhost:3000"}
	if v := strings.TrimSpace(os.Getenv("CORS_ORIGINS")); v != "" {
		parts := strings.Split(v, ",")
		origins := make([]string, 0, len(parts))
		for _, p := range parts {
			if s := strings.TrimSpace(p); s != "" {
				origins = append(origins, s)
			}
		}
		if len(origins) > 0 {
			allowedOrigins = origins
		}
	}

	corsHandler := handlers.CORS(
		handlers.AllowedOrigins(allowedOrigins),
		handlers.AllowedMethods([]string{"GET", "POST", "PUT", "DELETE", "OPTIONS"}),
		handlers.AllowedHeaders([]string{"Content-Type", "Authorization"}),
		handlers.AllowCredentials(),
	)(router)

	// Start server
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Server starting on port %s", port)
	log.Fatal(http.ListenAndServe(":"+port, corsHandler))
}

func healthCheck(w http.ResponseWriter, r *http.Request) {
	json.NewEncoder(w).Encode(map[string]string{
		"status":  "ok",
		"service": "galactic-giant-backend",
		"time":    time.Now().Format(time.RFC3339),
	})
}

// verifyToken verifies a Firebase ID token
func (s *Server) verifyToken(w http.ResponseWriter, r *http.Request) {
	var req VerifyTokenRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if req.IDToken == "" {
		http.Error(w, "ID token is required", http.StatusBadRequest)
		return
	}

	ctx := r.Context()
	token, err := s.authClient.VerifyIDToken(ctx, req.IDToken)
	if err != nil {
		response := VerifyTokenResponse{
			Valid: false,
			Error: err.Error(),
		}
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(response)
		return
	}

	// Get user record
	user, err := s.authClient.GetUser(ctx, token.UID)
	if err != nil {
		response := VerifyTokenResponse{
			Valid: false,
			Error: "Failed to get user: " + err.Error(),
		}
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(response)
		return
	}

	response := VerifyTokenResponse{
		Valid: true,
		User: &User{
			UID:         user.UID,
			Email:       user.Email,
			DisplayName: user.DisplayName,
			PhotoURL:    user.PhotoURL,
		},
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// getUser gets user information from Authorization header
func (s *Server) getUser(w http.ResponseWriter, r *http.Request) {
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

	ctx := r.Context()
	decodedToken, err := s.authClient.VerifyIDToken(ctx, token)
	if err != nil {
		http.Error(w, "Invalid token: "+err.Error(), http.StatusUnauthorized)
		return
	}

	user, err := s.authClient.GetUser(ctx, decodedToken.UID)
	if err != nil {
		http.Error(w, "Failed to get user: "+err.Error(), http.StatusInternalServerError)
		return
	}

	response := User{
		UID:         user.UID,
		Email:       user.Email,
		DisplayName: user.DisplayName,
		PhotoURL:    user.PhotoURL,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// refreshToken handles token refresh (client-side Firebase handles this, but we can verify)
func (s *Server) refreshToken(w http.ResponseWriter, r *http.Request) {
	var req VerifyTokenRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Verify the token
	ctx := r.Context()
	token, err := s.authClient.VerifyIDToken(ctx, req.IDToken)
	if err != nil {
		http.Error(w, "Invalid token: "+err.Error(), http.StatusUnauthorized)
		return
	}

	// Get user info
	user, err := s.authClient.GetUser(ctx, token.UID)
	if err != nil {
		http.Error(w, "Failed to get user: "+err.Error(), http.StatusInternalServerError)
		return
	}

	response := AuthResponse{
		Success: true,
		Message: "Token is valid",
		User: &User{
			UID:         user.UID,
			Email:       user.Email,
			DisplayName: user.DisplayName,
			PhotoURL:    user.PhotoURL,
		},
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}






