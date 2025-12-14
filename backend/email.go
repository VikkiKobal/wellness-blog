package main

import (
	"crypto/tls"
	"errors"
	"fmt"
	"net"
	"net/smtp"
	"os"
	"strconv"
	"strings"
	"time"
)

type EmailMessage struct {
	From     string
	To       []string
	ReplyTo  string
	Subject  string
	TextBody string
}

func SendEmailFromEnv(msg EmailMessage) error {
	host := strings.TrimSpace(os.Getenv("SMTP_HOST"))
	portStr := strings.TrimSpace(os.Getenv("SMTP_PORT"))
	user := strings.TrimSpace(os.Getenv("SMTP_USER"))
	pass := os.Getenv("SMTP_PASS")
	implicitTLS := parseBool(os.Getenv("SMTP_IMPLICIT_TLS"))
	skipVerify := parseBool(os.Getenv("SMTP_TLS_INSECURE_SKIP_VERIFY"))

	if host == "" {
		return errors.New("SMTP_HOST is required")
	}
	if portStr == "" {
		portStr = "587"
	}
	port, err := strconv.Atoi(portStr)
	if err != nil || port <= 0 || port > 65535 {
		return errors.New("invalid SMTP_PORT")
	}

	// Port 465 is usually implicit TLS.
	if port == 465 && os.Getenv("SMTP_IMPLICIT_TLS") == "" {
		implicitTLS = true
	}

	addr := net.JoinHostPort(host, strconv.Itoa(port))

	tlsCfg := &tls.Config{
		ServerName:         host,
		MinVersion:         tls.VersionTLS12,
		InsecureSkipVerify: skipVerify, // only if you know what you're doing
	}

	var c *smtp.Client
	if implicitTLS {
		conn, err := tls.DialWithDialer(&net.Dialer{Timeout: 10 * time.Second}, "tcp", addr, tlsCfg)
		if err != nil {
			return fmt.Errorf("smtp tls dial: %w", err)
		}
		c, err = smtp.NewClient(conn, host)
		if err != nil {
			return fmt.Errorf("smtp client: %w", err)
		}
	} else {
		conn, err := net.DialTimeout("tcp", addr, 10*time.Second)
		if err != nil {
			return fmt.Errorf("smtp dial: %w", err)
		}
		c, err = smtp.NewClient(conn, host)
		if err != nil {
			return fmt.Errorf("smtp client: %w", err)
		}
		// Upgrade via STARTTLS if supported.
		if ok, _ := c.Extension("STARTTLS"); ok {
			if err := c.StartTLS(tlsCfg); err != nil {
				_ = c.Close()
				return fmt.Errorf("smtp starttls: %w", err)
			}
		}
	}
	defer c.Quit()

	// Authenticate if credentials provided.
	if user != "" || pass != "" {
		if user == "" || pass == "" {
			return errors.New("SMTP_USER and SMTP_PASS must both be set")
		}
		auth := smtp.PlainAuth("", user, pass, host)
		if err := c.Auth(auth); err != nil {
			return fmt.Errorf("smtp auth: %w", err)
		}
	}

	if err := c.Mail(msg.From); err != nil {
		return fmt.Errorf("smtp mail from: %w", err)
	}
	for _, rcpt := range msg.To {
		if err := c.Rcpt(rcpt); err != nil {
			return fmt.Errorf("smtp rcpt to %s: %w", rcpt, err)
		}
	}

	w, err := c.Data()
	if err != nil {
		return fmt.Errorf("smtp data: %w", err)
	}
	defer w.Close()

	raw := buildRFC5322(msg)
	if _, err := w.Write([]byte(raw)); err != nil {
		return fmt.Errorf("smtp write: %w", err)
	}
	return nil
}

func buildRFC5322(msg EmailMessage) string {
	// Minimal RFC 5322 headers; provider will add Message-ID etc.
	var b strings.Builder
	b.WriteString("From: " + msg.From + "\r\n")
	b.WriteString("To: " + strings.Join(msg.To, ", ") + "\r\n")
	if strings.TrimSpace(msg.ReplyTo) != "" {
		b.WriteString("Reply-To: " + strings.TrimSpace(msg.ReplyTo) + "\r\n")
	}
	b.WriteString("Subject: " + sanitizeHeader(msg.Subject) + "\r\n")
	b.WriteString("MIME-Version: 1.0\r\n")
	b.WriteString("Content-Type: text/plain; charset=UTF-8\r\n")
	b.WriteString("Content-Transfer-Encoding: 8bit\r\n")
	b.WriteString("\r\n")
	b.WriteString(msg.TextBody)
	if !strings.HasSuffix(msg.TextBody, "\n") {
		b.WriteString("\n")
	}
	return b.String()
}

func sanitizeHeader(s string) string {
	s = strings.TrimSpace(s)
	s = strings.ReplaceAll(s, "\r", " ")
	s = strings.ReplaceAll(s, "\n", " ")
	if s == "" {
		return "Message"
	}
	return s
}

func parseBool(s string) bool {
	switch strings.ToLower(strings.TrimSpace(s)) {
	case "1", "true", "yes", "y", "on":
		return true
	default:
		return false
	}
}



