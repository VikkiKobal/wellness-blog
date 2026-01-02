package main

import (
	"database/sql"
	"log"
	"os"
	"time"

	_ "github.com/lib/pq"
)

var db *sql.DB

func initDB() {
	connStr := os.Getenv("DATABASE_URL")
	if connStr == "" {
		log.Fatal("DATABASE_URL environment variable is required")
	}

	var err error
	db, err = sql.Open("postgres", connStr)
	if err != nil {
		log.Fatalf("Error opening database: %v", err)
	}

	// Ping to verify connection
	err = db.Ping()
	if err != nil {
		log.Fatalf("Error connecting to the database: %v", err)
	}

	log.Println("Successfully connected to database")

	// Create tables if they don't exist
	createTables()

	// Migration: Add sort_order to categories if it doesn't exist
	_, _ = db.Exec("ALTER TABLE categories ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0")
}

func createTables() {
	queries := []string{
		`CREATE TABLE IF NOT EXISTS categories (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			name TEXT NOT NULL,
			type TEXT NOT NULL, -- 'blog' or 'course'
			sort_order INTEGER DEFAULT 0,
			created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
		)`,
		`CREATE TABLE IF NOT EXISTS articles (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			title TEXT NOT NULL,
			excerpt TEXT,
			content TEXT NOT NULL,
			author TEXT,
			date DATE,
			category TEXT,
			featured BOOLEAN DEFAULT false,
			image TEXT,
			created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
			updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
		)`,
		`CREATE TABLE IF NOT EXISTS courses (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			title TEXT NOT NULL,
			description TEXT,
			lessons TEXT,
			duration TEXT,
			price TEXT,
			category TEXT,
			tags TEXT[], -- array of strings
			image TEXT,
			created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
			updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
		)`,
		`CREATE TABLE IF NOT EXISTS projects (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			title TEXT NOT NULL,
			description TEXT,
			detail TEXT,
			link_label TEXT,
			link_href TEXT,
			image TEXT,
			sort_order INTEGER DEFAULT 0,
			created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
			updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
		)`,
		`CREATE TABLE IF NOT EXISTS certificates (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			title TEXT NOT NULL,
			issuer TEXT NOT NULL,
			year TEXT NOT NULL,
			image TEXT,
			sort_order INTEGER DEFAULT 0,
			created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
			updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
		)`,
	}

	for _, q := range queries {
		_, err := db.Exec(q)
		if err != nil {
			log.Fatalf("Error creating table: %v", err)
		}
	}
}

type Article struct {
	ID        string    `json:"id"`
	Title     string    `json:"title"`
	Excerpt   string    `json:"excerpt"`
	Content   string    `json:"content"`
	Author    string    `json:"author"`
	Date      string    `json:"date"`
	Category  string    `json:"category"`
	Featured  bool      `json:"featured"`
	Image     string    `json:"image"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

type Course struct {
	ID          string    `json:"id"`
	Title       string    `json:"title"`
	Description string    `json:"description"`
	Lessons     string    `json:"lessons"`
	Duration    string    `json:"duration"`
	EnrollLink  string    `json:"enrollLink"`
	Category    string    `json:"category"`
	Tags        []string  `json:"tags"`
	Image       string    `json:"image"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
}

type Category struct {
	ID        string `json:"id"`
	Name      string `json:"name"`
	Type      string `json:"type"`
	SortOrder int    `json:"sort_order"`
}

type Project struct {
	ID          string    `json:"id"`
	Title       string    `json:"title"`
	Description string    `json:"description"`
	Detail      string    `json:"detail"`
	LinkLabel   string    `json:"linkLabel"`
	LinkHref    string    `json:"linkHref"`
	Image       string    `json:"image"`
	SortOrder   int       `json:"sort_order"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
}

type Certificate struct {
	ID        string    `json:"id"`
	Title     string    `json:"title"`
	Issuer    string    `json:"issuer"`
	Year      string    `json:"year"`
	Image     string    `json:"image"`
	SortOrder int       `json:"sort_order"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}




