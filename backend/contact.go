package main

import (
	"encoding/json"
	"log"
	"net/http"
	"os"
	"time"
)

type ContactRequest struct {
	Name      string `json:"name"`
	Email     string `json:"email"`
	Subject   string `json:"subject"`
	Message   string `json:"message"`
	Website   string `json:"website"` // Honeypot
	CreatedAt int64  `json:"createdAt"`
}

func (s *Server) handleContact(w http.ResponseWriter, r *http.Request) {
	var req ContactRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	// 1. Honeypot check
	if req.Website != "" {
		log.Printf("Bot detected (honeypot): %s", req.Email)
		// Return success to confuse the bot
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": true,
			"message": "Message sent! Thank you.",
		})
		return
	}

	// 2. Timing check (too fast = bot)
	if time.Now().UnixMilli()-req.CreatedAt < 2000 {
		log.Printf("Bot suspected (too fast): %s", req.Email)
		http.Error(w, "Too fast. Please wait a moment.", http.StatusTooManyRequests)
		return
	}

	// 3. Basic validation
	if req.Name == "" || req.Email == "" || req.Message == "" {
		http.Error(w, "Missing required fields", http.StatusBadRequest)
		return
	}

	// 4. Send Email
	to := os.Getenv("CONTACT_TO")
	if to == "" {
		to = "devitska.education@gmail.com" // Default fallback
	}

	subject := "New Contact Form Message: " + req.Subject
	if req.Subject == "" {
		subject = "New Contact Form Message from " + req.Name
	}

	body := "Name: " + req.Name + "\n" +
		"Email: " + req.Email + "\n" +
		"Subject: " + req.Subject + "\n\n" +
		"Message:\n" + req.Message

	err := sendEmail(to, subject, body, req.Email)
	if err != nil {
		log.Printf("Error sending email: %v", err)
		http.Error(w, "Failed to send message. Please try again later.", http.StatusInternalServerError)
		return
	}

	// 5. Success response
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"message": "Message sent! Thank you.",
	})
}


