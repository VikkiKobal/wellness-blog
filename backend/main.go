package main

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	firebase "firebase.google.com/go/v4"
	"firebase.google.com/go/v4/auth"
	"github.com/gorilla/handlers"
	"github.com/gorilla/mux"
	"github.com/joho/godotenv"
	"google.golang.org/api/option"
)

type Server struct {
	authClient *auth.Client
}

func main() {
	// Load .env file
	err := godotenv.Load()
	if err != nil {
		log.Println("No .env file found, using environment variables")
	}

	// Initialize Database
	initDB()

	// Initialize Firebase
	ctx := context.Background()
	opt := option.WithCredentialsFile("serviceAccountKey.json")
	app, err := firebase.NewApp(ctx, nil, opt)
	if err != nil {
		log.Fatalf("error initializing app: %v\n", err)
	}

	authClient, err := app.Auth(ctx)
	if err != nil {
		log.Fatalf("error getting Auth client: %v\n", err)
	}

	s := &Server{
		authClient: authClient,
	}

	// Setup Router
	r := mux.NewRouter()
	api := r.PathPrefix("/api").Subrouter()

	// Public Routes
	api.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{"status":"ok", "service":"ihg-backend", "time":"` + time.Now().Format(time.RFC3339) + `"}`))
	}).Methods("GET")

	// Articles
	api.HandleFunc("/articles", s.getArticles).Methods("GET")
	api.HandleFunc("/articles/{id}", s.getArticle).Methods("GET")
	
	// Courses
	api.HandleFunc("/courses", s.getCourses).Methods("GET")
	
	// Categories
	api.HandleFunc("/categories", s.getCategories).Methods("GET")
	
	// Projects
	api.HandleFunc("/projects", s.getProjects).Methods("GET")

	// Certificates
	api.HandleFunc("/certificates", s.getCertificates).Methods("GET")

	// Contact
	api.HandleFunc("/contact", s.handleContact).Methods("POST")

	// Admin Routes (Protected)
	admin := api.NewRoute().Subrouter()
	admin.Use(s.AuthMiddleware)

	// Auth check
	api.HandleFunc("/auth/verify", s.verifyToken).Methods("POST")
	
	// Articles Admin
	admin.HandleFunc("/articles", s.createArticle).Methods("POST")
	admin.HandleFunc("/articles/{id}", s.updateArticle).Methods("PUT")
	admin.HandleFunc("/articles/{id}", s.deleteArticle).Methods("DELETE")

	// Courses Admin
	admin.HandleFunc("/courses", s.createCourse).Methods("POST")
	admin.HandleFunc("/courses/{id}", s.updateCourse).Methods("PUT")
	admin.HandleFunc("/courses/{id}", s.deleteCourse).Methods("DELETE")

	// Categories Admin
	admin.HandleFunc("/categories", s.createCategory).Methods("POST")
	admin.HandleFunc("/categories/reorder", s.reorderCategories).Methods("PUT")
	admin.HandleFunc("/categories/{id}", s.updateCategory).Methods("PUT")
	admin.HandleFunc("/categories/{id}", s.deleteCategory).Methods("DELETE")

	// Projects Admin
	admin.HandleFunc("/projects", s.createProject).Methods("POST")
	admin.HandleFunc("/projects/reorder", s.reorderProjects).Methods("PUT")
	admin.HandleFunc("/projects/{id}", s.updateProject).Methods("PUT")
	admin.HandleFunc("/projects/{id}", s.deleteProject).Methods("DELETE")

	// Certificates Admin
	admin.HandleFunc("/certificates", s.createCertificate).Methods("POST")
	admin.HandleFunc("/certificates/reorder", s.reorderCertificates).Methods("PUT")
	admin.HandleFunc("/certificates/{id}", s.updateCertificate).Methods("PUT")
	admin.HandleFunc("/certificates/{id}", s.deleteCertificate).Methods("DELETE")

	// CORS
	originsStr := os.Getenv("CORS_ORIGINS")
	if originsStr == "" {
		originsStr = "http://localhost:4321,http://localhost:3000"
	}
	
	// Split origins by comma and trim whitespace
	originsList := strings.Split(originsStr, ",")
	for i, o := range originsList {
		originsList[i] = strings.TrimSpace(o)
	}
	
	log.Printf("CORS allowed origins: %v", originsList)
	
	corsHandler := handlers.CORS(
		handlers.AllowedOrigins(originsList),
		handlers.AllowedMethods([]string{"GET", "POST", "PUT", "DELETE", "OPTIONS"}),
		handlers.AllowedHeaders([]string{"Content-Type", "Authorization"}),
		handlers.AllowCredentials(),
	)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Server starting on port %s...", port)
	log.Fatal(http.ListenAndServe(":"+port, corsHandler(r)))
}

// verifyToken handler (needed by api.ts)
func (s *Server) verifyToken(w http.ResponseWriter, r *http.Request) {
	var body struct {
		IDToken string `json:"idToken"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	token, err := s.authClient.VerifyIDToken(r.Context(), body.IDToken)
	if err != nil {
		http.Error(w, "Invalid token", http.StatusUnauthorized)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"valid": true,
		"uid":   token.UID,
	})
}
