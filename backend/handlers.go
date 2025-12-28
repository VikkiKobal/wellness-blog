package main

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"time"

	"github.com/gorilla/mux"
	"github.com/lib/pq"
)

// Article Handlers

func (s *Server) getArticles(w http.ResponseWriter, r *http.Request) {
	rows, err := db.Query("SELECT id, title, COALESCE(excerpt, ''), content, COALESCE(author, ''), date, COALESCE(category, ''), featured, COALESCE(image, ''), created_at, updated_at FROM articles ORDER BY date DESC")
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
		
		// Fallback for missing image
		if a.Image == "" {
			a.Image = "/images/blog-1.png"
		}
		
		articles = append(articles, a)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(articles)
}

func (s *Server) getArticle(w http.ResponseWriter, r *http.Request) {
	params := mux.Vars(r)
	id := params["id"]

	var a Article
	var date time.Time
	err := db.QueryRow(
		"SELECT id, title, COALESCE(excerpt, ''), content, COALESCE(author, ''), date, COALESCE(category, ''), featured, COALESCE(image, ''), created_at, updated_at FROM articles WHERE id=$1",
		id,
	).Scan(&a.ID, &a.Title, &a.Excerpt, &a.Content, &a.Author, &date, &a.Category, &a.Featured, &a.Image, &a.CreatedAt, &a.UpdatedAt)

	if err != nil {
		if err == sql.ErrNoRows {
			http.Error(w, "Article not found", http.StatusNotFound)
		} else {
			http.Error(w, err.Error(), http.StatusInternalServerError)
		}
		return
	}

	a.Date = date.Format("2006-01-02")

	// Fallback for missing image
	if a.Image == "" {
		a.Image = "/images/blog-1.png"
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(a)
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
	rows, err := db.Query("SELECT id, title, COALESCE(description, ''), COALESCE(lessons, ''), COALESCE(duration, ''), COALESCE(price, ''), COALESCE(category, ''), tags, COALESCE(image, ''), created_at, updated_at FROM courses ORDER BY created_at DESC")
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
		
		// Fallback for missing image
		if c.Image == "" {
			c.Image = "/images/service-1.png"
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
	rows, err := db.Query("SELECT id, name, type, sort_order FROM categories ORDER BY sort_order ASC, created_at ASC")
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	categories := []Category{}
	for rows.Next() {
		var c Category
		err := rows.Scan(&c.ID, &c.Name, &c.Type, &c.SortOrder)
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
		"INSERT INTO categories (name, type, sort_order) VALUES ($1, $2, (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM categories)) RETURNING id",
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

func (s *Server) reorderCategories(w http.ResponseWriter, r *http.Request) {
	var categoryIDs []string
	if err := json.NewDecoder(r.Body).Decode(&categoryIDs); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	tx, err := db.Begin()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer tx.Rollback()

	for i, id := range categoryIDs {
		_, err := tx.Exec("UPDATE categories SET sort_order = $1 WHERE id = $2", i, id)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
	}

	if err := tx.Commit(); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (s *Server) updateCategory(w http.ResponseWriter, r *http.Request) {
	params := mux.Vars(r)
	id := params["id"]

	var c Category
	if err := json.NewDecoder(r.Body).Decode(&c); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	_, err := db.Exec(
		"UPDATE categories SET name=$1, type=$2 WHERE id=$3",
		c.Name, c.Type, id,
	)

	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (s *Server) deleteCategory(w http.ResponseWriter, r *http.Request) {
	params := mux.Vars(r)
	id := params["id"]

	_, err := db.Exec("DELETE FROM categories WHERE id=$1", id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// Project Handlers

func (s *Server) getProjects(w http.ResponseWriter, r *http.Request) {
	rows, err := db.Query("SELECT id, title, COALESCE(description, ''), COALESCE(detail, ''), COALESCE(link_label, ''), COALESCE(link_href, ''), COALESCE(image, ''), sort_order, created_at, updated_at FROM projects ORDER BY sort_order ASC, created_at DESC")
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	projects := []Project{}
	for rows.Next() {
		var p Project
		err := rows.Scan(&p.ID, &p.Title, &p.Description, &p.Detail, &p.LinkLabel, &p.LinkHref, &p.Image, &p.SortOrder, &p.CreatedAt, &p.UpdatedAt)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		
		// Fallback for missing image
		if p.Image == "" {
			p.Image = "/images/collaboration.jpg"
		}
		
		projects = append(projects, p)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(projects)
}

func (s *Server) createProject(w http.ResponseWriter, r *http.Request) {
	var p Project
	if err := json.NewDecoder(r.Body).Decode(&p); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	err := db.QueryRow(
		"INSERT INTO projects (title, description, detail, link_label, link_href, image, sort_order) VALUES ($1, $2, $3, $4, $5, $6, (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM projects)) RETURNING id, created_at, updated_at",
		p.Title, p.Description, p.Detail, p.LinkLabel, p.LinkHref, p.Image,
	).Scan(&p.ID, &p.CreatedAt, &p.UpdatedAt)

	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(p)
}

func (s *Server) updateProject(w http.ResponseWriter, r *http.Request) {
	params := mux.Vars(r)
	id := params["id"]

	var p Project
	if err := json.NewDecoder(r.Body).Decode(&p); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	_, err := db.Exec(
		"UPDATE projects SET title=$1, description=$2, detail=$3, link_label=$4, link_href=$5, image=$6, updated_at=CURRENT_TIMESTAMP WHERE id=$7",
		p.Title, p.Description, p.Detail, p.LinkLabel, p.LinkHref, p.Image, id,
	)

	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (s *Server) deleteProject(w http.ResponseWriter, r *http.Request) {
	params := mux.Vars(r)
	id := params["id"]

	_, err := db.Exec("DELETE FROM projects WHERE id=$1", id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (s *Server) reorderProjects(w http.ResponseWriter, r *http.Request) {
	var projectIDs []string
	if err := json.NewDecoder(r.Body).Decode(&projectIDs); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	tx, err := db.Begin()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer tx.Rollback()

	for i, id := range projectIDs {
		_, err := tx.Exec("UPDATE projects SET sort_order = $1 WHERE id = $2", i, id)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
	}

	if err := tx.Commit(); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// Certificate Handlers

func (s *Server) getCertificates(w http.ResponseWriter, r *http.Request) {
	rows, err := db.Query("SELECT id, title, issuer, year, COALESCE(image, ''), sort_order, created_at, updated_at FROM certificates ORDER BY sort_order ASC, created_at DESC")
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	certificates := []Certificate{}
	for rows.Next() {
		var c Certificate
		err := rows.Scan(&c.ID, &c.Title, &c.Issuer, &c.Year, &c.Image, &c.SortOrder, &c.CreatedAt, &c.UpdatedAt)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		// Fallback for missing image
		if c.Image == "" {
			c.Image = "/images/blog-1.png"
		}

		certificates = append(certificates, c)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(certificates)
}

func (s *Server) createCertificate(w http.ResponseWriter, r *http.Request) {
	var c Certificate
	if err := json.NewDecoder(r.Body).Decode(&c); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	err := db.QueryRow(
		"INSERT INTO certificates (title, issuer, year, image, sort_order) VALUES ($1, $2, $3, $4, (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM certificates)) RETURNING id, created_at, updated_at",
		c.Title, c.Issuer, c.Year, c.Image,
	).Scan(&c.ID, &c.CreatedAt, &c.UpdatedAt)

	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(c)
}

func (s *Server) updateCertificate(w http.ResponseWriter, r *http.Request) {
	params := mux.Vars(r)
	id := params["id"]

	var c Certificate
	if err := json.NewDecoder(r.Body).Decode(&c); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	_, err := db.Exec(
		"UPDATE certificates SET title=$1, issuer=$2, year=$3, image=$4, updated_at=CURRENT_TIMESTAMP WHERE id=$5",
		c.Title, c.Issuer, c.Year, c.Image, id,
	)

	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (s *Server) deleteCertificate(w http.ResponseWriter, r *http.Request) {
	params := mux.Vars(r)
	id := params["id"]

	_, err := db.Exec("DELETE FROM certificates WHERE id=$1", id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (s *Server) reorderCertificates(w http.ResponseWriter, r *http.Request) {
	var certIDs []string
	if err := json.NewDecoder(r.Body).Decode(&certIDs); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	tx, err := db.Begin()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer tx.Rollback()

	for i, id := range certIDs {
		_, err := tx.Exec("UPDATE certificates SET sort_order = $1 WHERE id = $2", i, id)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
	}

	if err := tx.Commit(); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}





