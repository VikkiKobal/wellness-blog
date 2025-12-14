package main

import (
	"encoding/json"
	"errors"
	"net"
	"net/http"
	"os"
	"strings"
	"sync"
	"time"
)

type ContactRequest struct {
	Name      string `json:"name"`
	Email     string `json:"email"`
	Subject   string `json:"subject"`
	Message   string `json:"message"`
	Website   string `json:"website"`   // honeypot
	CreatedAt int64  `json:"createdAt"` // client timestamp (ms since epoch)
}

type ContactResponse struct {
	Success bool   `json:"success"`
	Message string `json:"message"`
}

// very small in-memory rate limiter: per-IP last N timestamps
var (
	contactMu       sync.Mutex
	contactAttempts = map[string][]time.Time{}
)

func (s *Server) contact(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	var req ContactRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		_ = json.NewEncoder(w).Encode(ContactResponse{Success: false, Message: "Invalid request body"})
		return
	}

	// Honeypot: bots fill hidden fields.
	if strings.TrimSpace(req.Website) != "" {
		w.WriteHeader(http.StatusOK)
		_ = json.NewEncoder(w).Encode(ContactResponse{Success: true, Message: "Message sent"})
		return
	}

	// Basic timing check: too-fast submits are suspicious.
	if req.CreatedAt > 0 {
		created := time.UnixMilli(req.CreatedAt)
		age := time.Since(created)
		if age < 2*time.Second || age > 2*time.Hour {
			w.WriteHeader(http.StatusBadRequest)
			_ = json.NewEncoder(w).Encode(ContactResponse{Success: false, Message: "Please try again"})
			return
		}
	}

	ip := clientIP(r)
	if !allowContactAttempt(ip) {
		w.WriteHeader(http.StatusTooManyRequests)
		_ = json.NewEncoder(w).Encode(ContactResponse{Success: false, Message: "Too many requests. Please try again later."})
		return
	}

	if err := validateContact(req); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		_ = json.NewEncoder(w).Encode(ContactResponse{Success: false, Message: err.Error()})
		return
	}

	to := strings.TrimSpace(os.Getenv("CONTACT_TO"))
	from := strings.TrimSpace(os.Getenv("CONTACT_FROM"))
	if to == "" || from == "" {
		w.WriteHeader(http.StatusInternalServerError)
		_ = json.NewEncoder(w).Encode(ContactResponse{Success: false, Message: "Server not configured for contact email"})
		return
	}

	prefix := strings.TrimSpace(os.Getenv("CONTACT_SUBJECT_PREFIX"))
	subject := strings.TrimSpace(req.Subject)
	if subject == "" {
		subject = "New contact message"
	}
	if prefix != "" {
		subject = prefix + " " + subject
	}

	body := buildContactEmailBody(req, ip, r.UserAgent())

	msg := EmailMessage{
		From:     from,
		To:       []string{to},
		ReplyTo:  req.Email,
		Subject:  subject,
		TextBody: body,
	}

	if err := SendEmailFromEnv(msg); err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		_ = json.NewEncoder(w).Encode(ContactResponse{Success: false, Message: "Failed to send message. Please try again later."})
		return
	}

	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(ContactResponse{Success: true, Message: "Message sent! Thank you."})
}

func validateContact(req ContactRequest) error {
	name := strings.TrimSpace(req.Name)
	email := strings.TrimSpace(req.Email)
	subject := strings.TrimSpace(req.Subject)
	message := strings.TrimSpace(req.Message)

	if name == "" || len(name) < 2 {
		return errors.New("Please enter your name")
	}
	if email == "" || !looksLikeEmail(email) {
		return errors.New("Please enter a valid email")
	}
	if len(subject) > 140 {
		return errors.New("Subject is too long")
	}
	if message == "" || len(message) < 10 {
		return errors.New("Please enter a message (at least 10 characters)")
	}
	if len(message) > 5000 {
		return errors.New("Message is too long")
	}

	// Header injection protection (CR/LF not allowed in headers we use)
	if hasCRLF(name) || hasCRLF(email) || hasCRLF(subject) {
		return errors.New("Invalid characters in input")
	}

	return nil
}

func hasCRLF(s string) bool {
	return strings.Contains(s, "\r") || strings.Contains(s, "\n")
}

func looksLikeEmail(s string) bool {
	// lightweight validation (not RFC strict)
	s = strings.TrimSpace(s)
	if len(s) < 6 || len(s) > 254 {
		return false
	}
	at := strings.IndexByte(s, '@')
	if at <= 0 || at != strings.LastIndexByte(s, '@') {
		return false
	}
	dot := strings.LastIndexByte(s, '.')
	return dot > at+1 && dot < len(s)-1
}

func buildContactEmailBody(req ContactRequest, ip, ua string) string {
	var b strings.Builder
	b.WriteString("New contact message\n\n")
	b.WriteString("Name: " + strings.TrimSpace(req.Name) + "\n")
	b.WriteString("Email: " + strings.TrimSpace(req.Email) + "\n")
	if s := strings.TrimSpace(req.Subject); s != "" {
		b.WriteString("Subject: " + s + "\n")
	}
	b.WriteString("\nMessage:\n")
	b.WriteString(strings.TrimSpace(req.Message))
	b.WriteString("\n\n---\n")
	b.WriteString("IP: " + ip + "\n")
	if ua != "" {
		b.WriteString("User-Agent: " + ua + "\n")
	}
	b.WriteString("Time: " + time.Now().Format(time.RFC3339) + "\n")
	return b.String()
}

func clientIP(r *http.Request) string {
	// If you’re behind a proxy/CDN in prod, you can add X-Forwarded-For parsing here.
	host, _, err := net.SplitHostPort(r.RemoteAddr)
	if err == nil && host != "" {
		return host
	}
	return r.RemoteAddr
}

func allowContactAttempt(ip string) bool {
	if ip == "" {
		ip = "unknown"
	}

	now := time.Now()
	window := 10 * time.Minute
	limit := 5 // 5 messages / 10 minutes / IP

	contactMu.Lock()
	defer contactMu.Unlock()

	// prune
	var kept []time.Time
	for _, t := range contactAttempts[ip] {
		if now.Sub(t) <= window {
			kept = append(kept, t)
		}
	}
	if len(kept) >= limit {
		contactAttempts[ip] = kept
		return false
	}

	kept = append(kept, now)
	contactAttempts[ip] = kept
	return true
}



