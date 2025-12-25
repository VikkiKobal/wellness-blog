package main

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/gorilla/mux"
	"github.com/lib/pq"
)

// Article Handlers

func (s *Server) getArticles(w http.ResponseWriter, r *http.Request) {
	rows, err := db.Query("SELECT id, title, excerpt, content, author, date, category, featured, image, created_at, updated_at FROM articles ORDER BY date DESC")
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	articles := []Article{}
	for rows.Next() {
		var a Article
		var date time.Time
		err := rows.Scan(&a.ID, &a.Title, &a.Excerpt, &a.Content, &a.Author, &date, &a.Category, &a.Featured, &a.Image, &a.CreatedAt, &a.UpdatedAt)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		a.Date = date.Format("2006-01-02")
		articles = append(articles, a)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(articles)
}

func (s *Server) createArticle(w http.ResponseWriter, r *http.Request) {
	var a Article
	if err := json.NewDecoder(r.Body).Decode(&a); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	err := db.QueryRow(
		"INSERT INTO articles (title, excerpt, content, author, date, category, featured, image) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id, created_at, updated_at",
		a.Title, a.Excerpt, a.Content, a.Author, a.Date, a.Category, a.Featured, a.Image,
	).Scan(&a.ID, &a.CreatedAt, &a.UpdatedAt)

	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(a)
}

func (s *Server) updateArticle(w http.ResponseWriter, r *http.Request) {
	params := mux.Vars(r)
	id := params["id"]

	var a Article
	if err := json.NewDecoder(r.Body).Decode(&a); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	_, err := db.Exec(
		"UPDATE articles SET title=$1, excerpt=$2, content=$3, author=$4, date=$5, category=$6, featured=$7, image=$8, updated_at=CURRENT_TIMESTAMP WHERE id=$9",
		a.Title, a.Excerpt, a.Content, a.Author, a.Date, a.Category, a.Featured, a.Image, id,
	)

	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (s *Server) deleteArticle(w http.ResponseWriter, r *http.Request) {
	params := mux.Vars(r)
	id := params["id"]

	_, err := db.Exec("DELETE FROM articles WHERE id=$1", id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// Course Handlers

func (s *Server) getCourses(w http.ResponseWriter, r *http.Request) {
	rows, err := db.Query("SELECT id, title, description, lessons, duration, price, category, tags, image, created_at, updated_at FROM courses ORDER BY created_at DESC")
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	courses := []Course{}
	for rows.Next() {
		var c Course
		err := rows.Scan(&c.ID, &c.Title, &c.Description, &c.Lessons, &c.Duration, &c.Price, &c.Category, pq.Array(&c.Tags), &c.Image, &c.CreatedAt, &c.UpdatedAt)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		courses = append(courses, c)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(courses)
}

func (s *Server) createCourse(w http.ResponseWriter, r *http.Request) {
	var c Course
	if err := json.NewDecoder(r.Body).Decode(&c); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	err := db.QueryRow(
		"INSERT INTO courses (title, description, lessons, duration, price, category, tags, image) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id, created_at, updated_at",
		c.Title, c.Description, c.Lessons, c.Duration, c.Price, c.Category, pq.Array(c.Tags), c.Image,
	).Scan(&c.ID, &c.CreatedAt, &c.UpdatedAt)

	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(c)
}

func (s *Server) updateCourse(w http.ResponseWriter, r *http.Request) {
	params := mux.Vars(r)
	id := params["id"]

	var c Course
	if err := json.NewDecoder(r.Body).Decode(&c); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	_, err := db.Exec(
		"UPDATE courses SET title=$1, description=$2, lessons=$3, duration=$4, price=$5, category=$6, tags=$7, image=$8, updated_at=CURRENT_TIMESTAMP WHERE id=$9",
		c.Title, c.Description, c.Lessons, c.Duration, c.Price, c.Category, pq.Array(c.Tags), c.Image, id,
	)

	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (s *Server) deleteCourse(w http.ResponseWriter, r *http.Request) {
	params := mux.Vars(r)
	id := params["id"]

	_, err := db.Exec("DELETE FROM courses WHERE id=$1", id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// Category Handlers

func (s *Server) getCategories(w http.ResponseWriter, r *http.Request) {
	rows, err := db.Query("SELECT id, name, type FROM categories")
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	categories := []Category{}
	for rows.Next() {
		var c Category
		err := rows.Scan(&c.ID, &c.Name, &c.Type)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		categories = append(categories, c)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(categories)
}

func (s *Server) createCategory(w http.ResponseWriter, r *http.Request) {
	var c Category
	if err := json.NewDecoder(r.Body).Decode(&c); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	err := db.QueryRow(
		"INSERT INTO categories (name, type) VALUES ($1, $2) RETURNING id",
		c.Name, c.Type,
	).Scan(&c.ID)

	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(c)
}




