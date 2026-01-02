package main

import (
	"fmt"
	"net/smtp"
	"os"
)

func sendEmail(to, subject, body, replyTo string) error {
	host := os.Getenv("SMTP_HOST")
	port := os.Getenv("SMTP_PORT")
	user := os.Getenv("SMTP_USER")
	pass := os.Getenv("SMTP_PASS")
	from := os.Getenv("CONTACT_FROM")

	if host == "" || port == "" || user == "" || pass == "" {
		return fmt.Errorf("SMTP configuration is missing")
	}

	if from == "" {
		from = user
	}

	// Message composition
	msg := fmt.Sprintf("From: %s\r\n"+
		"To: %s\r\n"+
		"Subject: %s\r\n"+
		"Reply-To: %s\r\n"+
		"MIME-version: 1.0;\r\n"+
		"Content-Type: text/plain; charset=\"UTF-8\";\r\n"+
		"\r\n"+
		"%s\r\n", from, to, subject, replyTo, body)

	auth := smtp.PlainAuth("", user, pass, host)
	addr := fmt.Sprintf("%s:%s", host, port)

	err := smtp.SendMail(addr, auth, from, []string{to}, []byte(msg))
	if err != nil {
		return err
	}

	return nil
}


