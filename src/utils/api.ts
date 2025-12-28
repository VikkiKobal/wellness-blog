/**
 * API utility functions for communicating with the Go backend
 */

const API_BASE_URL = import.meta.env.PUBLIC_API_URL || 'http://localhost:8080/api';

export interface User {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
}

export interface VerifyTokenResponse {
  valid: boolean;
  user?: User;
  error?: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: User;
}

/**
 * Verify a Firebase ID token with the backend
 */
export async function verifyToken(idToken: string): Promise<VerifyTokenResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ idToken }),
    });

    if (!response.ok) {
      const error = await response.json();
      return {
        valid: false,
        error: error.error || 'Failed to verify token',
      };
    }

    return await response.json();
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

/**
 * Get user information from the backend using Authorization header
 */
export async function getUser(idToken: string): Promise<User | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/user`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${idToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching user:', error);
    return null;
  }
}

/**
 * Refresh token verification
 */
export async function refreshToken(idToken: string): Promise<AuthResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ idToken }),
    });

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        message: error.error || 'Failed to refresh token',
      };
    }

    return await response.json();
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Network error',
    };
  }
}

/**
 * Health check
 */
export async function healthCheck(): Promise<{ status: string; service: string; time: string } | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    if (!response.ok) {
      return null;
    }
    return await response.json();
  } catch (error) {
    console.error('Health check failed:', error);
    return null;
  }
}

// Article types and functions
export interface Article {
  id?: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  date: string;
  category: string;
  featured: boolean;
  image: string;
  createdAt?: string;
  updatedAt?: string;
}

export async function getArticles(): Promise<Article[]> {
  const response = await fetch(`${API_BASE_URL}/articles`);
  if (!response.ok) throw new Error('Failed to fetch articles');
  return await response.json();
}

export async function getArticle(id: string): Promise<Article> {
  const response = await fetch(`${API_BASE_URL}/articles/${id}`);
  if (!response.ok) {
    if (response.status === 404) throw new Error('Article not found');
    throw new Error('Failed to fetch article');
  }
  return await response.json();
}

export async function saveArticle(article: Article, idToken: string): Promise<Article> {
  const method = article.id ? 'PUT' : 'POST';
  const url = article.id ? `${API_BASE_URL}/articles/${article.id}` : `${API_BASE_URL}/articles`;
  
  const response = await fetch(url, {
    method,
    headers: {
      'Authorization': `Bearer ${idToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(article),
  });

  if (!response.ok) throw new Error('Failed to save article');
  if (method === 'PUT') return article;
  return await response.json();
}

export async function deleteArticle(id: string, idToken: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/articles/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${idToken}`,
    },
  });

  if (!response.ok) throw new Error('Failed to delete article');
}

// Course types and functions
export interface Course {
  id?: string;
  title: string;
  description: string;
  lessons: string;
  duration: string;
  price: string;
  category: string;
  tags: string[];
  image: string;
  createdAt?: string;
  updatedAt?: string;
}

export async function getCourses(): Promise<Course[]> {
  const response = await fetch(`${API_BASE_URL}/courses`);
  if (!response.ok) throw new Error('Failed to fetch courses');
  return await response.json();
}

export async function saveCourse(course: Course, idToken: string): Promise<Course> {
  const method = course.id ? 'PUT' : 'POST';
  const url = course.id ? `${API_BASE_URL}/courses/${course.id}` : `${API_BASE_URL}/courses`;
  
  const response = await fetch(url, {
    method,
    headers: {
      'Authorization': `Bearer ${idToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(course),
  });

  if (!response.ok) throw new Error('Failed to save course');
  if (method === 'PUT') return course;
  return await response.json();
}

export async function deleteCourse(id: string, idToken: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/courses/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${idToken}`,
    },
  });

  if (!response.ok) throw new Error('Failed to delete course');
}

// Category types and functions
export interface Category {
  id?: string;
  name: string;
  type: 'blog' | 'course';
  sort_order?: number;
}

export async function getCategories(): Promise<Category[]> {
  const response = await fetch(`${API_BASE_URL}/categories`);
  if (!response.ok) throw new Error('Failed to fetch categories');
  return await response.json();
}

export async function reorderCategories(categoryIDs: string[], idToken: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/categories/reorder`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${idToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(categoryIDs),
  });

  if (!response.ok) throw new Error('Failed to reorder categories');
}

export async function saveCategory(category: Category, idToken: string): Promise<Category> {
  const method = category.id ? 'PUT' : 'POST';
  const url = category.id ? `${API_BASE_URL}/categories/${category.id}` : `${API_BASE_URL}/categories`;

  const response = await fetch(url, {
    method,
    headers: {
      'Authorization': `Bearer ${idToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(category),
  });

  if (!response.ok) throw new Error('Failed to save category');
  if (method === 'PUT') return category;
  return await response.json();
}

export async function deleteCategory(id: string, idToken: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/categories/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${idToken}`,
    },
  });

  if (!response.ok) throw new Error('Failed to delete category');
}

// Project types and functions
export interface Project {
  id?: string;
  title: string;
  description: string;
  detail: string;
  linkLabel: string;
  linkHref: string;
  image: string;
  sort_order?: number;
  createdAt?: string;
  updatedAt?: string;
}

export async function getProjects(): Promise<Project[]> {
  const response = await fetch(`${API_BASE_URL}/projects`);
  if (!response.ok) throw new Error('Failed to fetch projects');
  return await response.json();
}

export async function saveProject(project: Project, idToken: string): Promise<Project> {
  const method = project.id ? 'PUT' : 'POST';
  const url = project.id ? `${API_BASE_URL}/projects/${project.id}` : `${API_BASE_URL}/projects`;
  
  const response = await fetch(url, {
    method,
    headers: {
      'Authorization': `Bearer ${idToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(project),
  });

  if (!response.ok) throw new Error('Failed to save project');
  if (method === 'PUT') return project;
  return await response.json();
}

export async function deleteProject(id: string, idToken: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/projects/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${idToken}`,
    },
  });

  if (!response.ok) throw new Error('Failed to delete project');
}

export async function reorderProjects(projectIDs: string[], idToken: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/projects/reorder`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${idToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(projectIDs),
  });

  if (!response.ok) throw new Error('Failed to reorder projects');
}

// Certificate types and functions
export interface Certificate {
  id?: string;
  title: string;
  issuer: string;
  year: string;
  image: string;
  sort_order?: number;
  createdAt?: string;
  updatedAt?: string;
}

export async function getCertificates(): Promise<Certificate[]> {
  const response = await fetch(`${API_BASE_URL}/certificates`);
  if (!response.ok) throw new Error('Failed to fetch certificates');
  return await response.json();
}

export async function saveCertificate(certificate: Certificate, idToken: string): Promise<Certificate> {
  const method = certificate.id ? 'PUT' : 'POST';
  const url = certificate.id ? `${API_BASE_URL}/certificates/${certificate.id}` : `${API_BASE_URL}/certificates`;
  
  const response = await fetch(url, {
    method,
    headers: {
      'Authorization': `Bearer ${idToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(certificate),
  });

  if (!response.ok) throw new Error('Failed to save certificate');
  if (method === 'PUT') return certificate;
  return await response.json();
}

export async function deleteCertificate(id: string, idToken: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/certificates/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${idToken}`,
    },
  });

  if (!response.ok) throw new Error('Failed to delete certificate');
}

export async function reorderCertificates(certIDs: string[], idToken: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/certificates/reorder`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${idToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(certIDs),
  });

  if (!response.ok) throw new Error('Failed to reorder certificates');
}








