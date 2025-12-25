import { onAuthStateChanged, getIdToken } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import {
  auth,
  storage,
  signInWithGoogle,
  signInWithEmailPassword,
  signOut,
} from '../firebase/firebase';
import * as api from '../utils/api';

// DOM Elements
const loginPanel = document.getElementById('login-panel');
const adminPanel = document.getElementById('admin-panel');
const statusMessage = document.getElementById('status-message');
const emailForm = document.getElementById('email-login-form');
const googleBtn = document.getElementById('google-sign-in');
const signOutBtn = document.getElementById('sign-out-btn');

// Tab Elements
const tabButtons = document.querySelectorAll('.nav-item');
const tabContents = document.querySelectorAll('.tab-content');

// Articles Elements
const articleForm = document.getElementById('article-form') as HTMLFormElement;
const articlesList = document.getElementById('articles-list');
const articleCancelBtn = document.getElementById('article-cancel-btn');
const articleImageUpload = document.getElementById('article-image-upload') as HTMLInputElement;
const articleUploadArea = document.getElementById('article-upload-area');
const articleUploadPlaceholder = document.getElementById('article-upload-placeholder');
const articleImagePreview = document.getElementById('article-image-preview');
const articleRemoveImage = document.getElementById('article-remove-image');
const articleUploadProgress = document.getElementById('article-upload-progress');
const articleProgressFill = document.getElementById('article-progress-fill');
const articleUploadStatus = document.getElementById('article-upload-status');
const articleImageUrl = document.getElementById('article-image-url') as HTMLInputElement;

// Courses Elements
const courseForm = document.getElementById('course-form') as HTMLFormElement;
const coursesList = document.getElementById('courses-list');
const courseCancelBtn = document.getElementById('course-cancel-btn');
const courseImageUpload = document.getElementById('course-image-upload') as HTMLInputElement;
const courseUploadArea = document.getElementById('course-upload-area');
const courseUploadPlaceholder = document.getElementById('course-upload-placeholder');
const courseImagePreview = document.getElementById('course-image-preview');
const courseRemoveImage = document.getElementById('course-remove-image');
const courseUploadProgress = document.getElementById('course-upload-progress');
const courseProgressFill = document.getElementById('course-progress-fill');
const courseUploadStatus = document.getElementById('course-upload-status');
const courseImageUrl = document.getElementById('course-image-url') as HTMLInputElement;

// Categories Elements
const categoryForm = document.getElementById('category-form') as HTMLFormElement;
const categoriesList = document.getElementById('categories-list');

let editingArticleId: string | null = null;
let editingCourseId: string | null = null;

// Utility Functions
const showStatus = (message: string, isError = false) => {
  // Login page status
  if (statusMessage && loginPanel && !loginPanel.hidden) {
    statusMessage.textContent = message;
    statusMessage.dataset.error = isError ? 'true' : 'false';
    statusMessage.dataset.success = isError ? 'false' : 'true';
    statusMessage.classList.add('show');
    setTimeout(() => {
      statusMessage.classList.remove('show');
    }, 5000);
    return;
  }

  // Admin panel toast
  const toast = document.getElementById('status-toast');
  if (!toast) return;
  
  toast.textContent = message;
  toast.className = `status-toast ${isError ? 'error' : 'success'} show`;
  
  setTimeout(() => {
    toast.classList.remove('show');
  }, 4000);
};

const showAdmin = () => {
  if (loginPanel) {
    loginPanel.hidden = true;
    loginPanel.style.display = 'none';
  }
  if (adminPanel) {
    adminPanel.hidden = false;
    adminPanel.style.display = 'flex';
  }
  setTimeout(() => {
    showStatus('✓ Successfully signed in! Welcome to Admin Panel.');
  }, 300);
  
  loadArticles();
  loadCourses();
};

const showLogin = () => {
  if (loginPanel) {
    loginPanel.hidden = false;
    loginPanel.style.display = 'flex';
  }
  if (adminPanel) {
    adminPanel.hidden = true;
    adminPanel.style.display = 'none';
  }
};

// Tab Switching
tabButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const targetTab = button.getAttribute('data-tab');
    tabButtons.forEach((btn) => btn.classList.remove('active'));
    button.classList.add('active');
    tabContents.forEach((content) => content.classList.remove('active'));
    const targetContent = document.getElementById(`${targetTab}-tab`);
    if (targetContent) targetContent.classList.add('active');
  });
});

// Image Upload Functions
const uploadImage = async (file: File, folder: string): Promise<string> => {
  try {
    if (!storage) throw new Error('Firebase Storage is not initialized');
    const timestamp = Date.now();
    const fileName = `${folder}/${timestamp}-${file.name}`;
    const storageRef = ref(storage, fileName);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
  } catch (error) {
    console.error('Upload error:', error);
    throw error;
  }
};

// Articles Functions
const loadArticles = async () => {
  if (!articlesList) return;
  try {
    const articles = await api.getArticles();
    articlesList.innerHTML = '';
    articles.forEach((article) => {
      const li = document.createElement('li');
      li.className = 'article-item';
      const imageUrl = article.image || '/images/blog-1.png';
      const featuredBadge = article.featured ? '<span class="badge badge-featured">⭐ Featured</span>' : '';
      li.innerHTML = `
        <div class="article-preview"><img src="${imageUrl}" alt="${article.title}" class="article-thumbnail" /></div>
        <div class="content-info">
          <div class="article-header">
            <strong>${article.title}</strong>
            <div class="article-badges">${featuredBadge}<span class="badge badge-category">🏷️ ${article.category || 'Uncategorized'}</span></div>
          </div>
          <p class="article-excerpt">${article.excerpt || 'No excerpt'}</p>
          <div class="content-meta"><span class="content-tag">📅 ${article.date}</span><span class="content-tag">👤 ${article.author || 'Unknown'}</span></div>
        </div>
        <div class="content-actions">
          <button class="btn-edit" data-id="${article.id}">Edit</button>
          <button class="btn-danger" data-id="${article.id}">Delete</button>
        </div>
      `;
      li.querySelector('.btn-edit')?.addEventListener('click', () => editArticle(article));
      li.querySelector('.btn-danger')?.addEventListener('click', () => article.id && deleteArticle(article.id));
      articlesList.appendChild(li);
    });
  } catch (error) {
    showStatus('Error loading articles', true);
  }
};

const saveArticle = async (e: Event) => {
  e.preventDefault();
  if (!auth.currentUser) return;
  const idToken = await getIdToken(auth.currentUser);
  const formData = new FormData(articleForm);
  const articleData: api.Article = {
    id: editingArticleId || undefined,
    title: formData.get('title')?.toString().trim() || '',
    excerpt: formData.get('excerpt')?.toString().trim() || '',
    content: formData.get('content')?.toString().trim() || '',
    author: formData.get('author')?.toString().trim() || 'Antonina Devitska',
    date: formData.get('date')?.toString() || '',
    category: formData.get('category')?.toString().trim() || '',
    featured: formData.get('featured') === 'on',
    image: formData.get('image')?.toString().trim() || '/images/blog-1.png',
  };
  try {
    await api.saveArticle(articleData, idToken);
    showStatus(`✓ Article ${editingArticleId ? 'updated' : 'created'} successfully!`);
    resetArticleForm();
    loadArticles();
  } catch (error) {
    showStatus('Error saving article', true);
  }
};

const editArticle = (article: api.Article) => {
  editingArticleId = article.id || null;
  (articleForm.elements.namedItem('title') as HTMLInputElement).value = article.title;
  (articleForm.elements.namedItem('excerpt') as HTMLTextAreaElement).value = article.excerpt;
  (articleForm.elements.namedItem('content') as HTMLTextAreaElement).value = article.content;
  (articleForm.elements.namedItem('author') as HTMLInputElement).value = article.author;
  (articleForm.elements.namedItem('date') as HTMLInputElement).value = article.date;
  (articleForm.elements.namedItem('category') as HTMLInputElement).value = article.category || '';
  (articleForm.elements.namedItem('featured') as HTMLInputElement).checked = article.featured;
  if (articleImageUrl) articleImageUrl.value = article.image;
  if (article.image && articleImagePreview && articleUploadPlaceholder) {
    const previewImg = articleImagePreview.querySelector('img');
    if (previewImg) { previewImg.src = article.image; articleUploadPlaceholder.hidden = true; articleImagePreview.hidden = false; }
  }
  if (articleCancelBtn) articleCancelBtn.hidden = false;
  articleForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

const deleteArticle = async (id: string) => {
  if (!confirm('Are you sure you want to delete this article?') || !auth.currentUser) return;
  try {
    const idToken = await getIdToken(auth.currentUser);
    await api.deleteArticle(id, idToken);
    showStatus('Article deleted successfully!');
    loadArticles();
  } catch (error) {
    showStatus('Error deleting article', true);
  }
};

const resetArticleForm = () => {
  articleForm.reset();
  editingArticleId = null;
  if (articleCancelBtn) articleCancelBtn.hidden = true;
  if (articleImageUrl) articleImageUrl.value = '';
  if (articleUploadPlaceholder) articleUploadPlaceholder.hidden = false;
  if (articleImagePreview) articleImagePreview.hidden = true;
};

// Courses Functions
const loadCourses = async () => {
  if (!coursesList) return;
  try {
    const courses = await api.getCourses();
    coursesList.innerHTML = '';
    courses.forEach((course) => {
      const li = document.createElement('li');
      li.className = 'article-item';
      const imageUrl = course.image || '/images/service-1.png';
      li.innerHTML = `
        <div class="article-preview"><img src="${imageUrl}" alt="${course.title}" class="article-thumbnail" /></div>
        <div class="content-info">
          <div class="article-header">
            <strong>${course.title}</strong>
            <div class="article-badges"><span class="badge badge-category">🏷️ ${course.category}</span><span class="badge badge-price">${course.price}</span></div>
          </div>
          <p class="article-excerpt">${course.description || 'No description'}</p>
          <div class="content-meta"><span class="content-tag">📚 ${course.lessons}</span><span class="content-tag">⏱️ ${course.duration}</span></div>
          <div class="course-tags">${course.tags?.map(tag => `<span class="tag-chip">${tag}</span>`).join('') || ''}</div>
        </div>
        <div class="content-actions">
          <button class="btn-edit" data-id="${course.id}">Edit</button>
          <button class="btn-danger" data-id="${course.id}">Delete</button>
        </div>
      `;
      li.querySelector('.btn-edit')?.addEventListener('click', () => editCourse(course));
      li.querySelector('.btn-danger')?.addEventListener('click', () => course.id && deleteCourse(course.id));
      coursesList.appendChild(li);
    });
  } catch (error) {
    showStatus('Error loading courses', true);
  }
};

const saveCourse = async (e: Event) => {
  e.preventDefault();
  if (!auth.currentUser) return;
  const idToken = await getIdToken(auth.currentUser);
  const formData = new FormData(courseForm);
  const tags = formData.get('tags')?.toString().split('\n').map(t => t.trim()).filter(t => t) || [];
  
  const courseData: api.Course = {
    id: editingCourseId || undefined,
    title: formData.get('title')?.toString().trim() || '',
    description: formData.get('description')?.toString().trim() || '',
    lessons: formData.get('lessons')?.toString().trim() || '',
    duration: formData.get('duration')?.toString().trim() || '',
    price: formData.get('price')?.toString().trim() || '',
    category: formData.get('category')?.toString().trim() || '',
    tags: tags,
    image: formData.get('image')?.toString().trim() || '/images/service-1.png',
  };
  try {
    await api.saveCourse(courseData, idToken);
    showStatus(`✓ Course ${editingCourseId ? 'updated' : 'created'} successfully!`);
    resetCourseForm();
    loadCourses();
  } catch (error) {
    showStatus('Error saving course', true);
  }
};

const editCourse = (course: api.Course) => {
  editingCourseId = course.id || null;
  (courseForm.elements.namedItem('title') as HTMLInputElement).value = course.title;
  (courseForm.elements.namedItem('description') as HTMLTextAreaElement).value = course.description;
  (courseForm.elements.namedItem('lessons') as HTMLInputElement).value = course.lessons;
  (courseForm.elements.namedItem('duration') as HTMLInputElement).value = course.duration;
  (courseForm.elements.namedItem('price') as HTMLInputElement).value = course.price;
  (courseForm.elements.namedItem('category') as HTMLSelectElement).value = course.category;
  (courseForm.elements.namedItem('tags') as HTMLTextAreaElement).value = course.tags?.join('\n') || '';
  if (courseImageUrl) courseImageUrl.value = course.image;
  if (course.image && courseImagePreview && courseUploadPlaceholder) {
    const previewImg = courseImagePreview.querySelector('img');
    if (previewImg) { previewImg.src = course.image; courseUploadPlaceholder.hidden = true; courseImagePreview.hidden = false; }
  }
  if (courseCancelBtn) courseCancelBtn.hidden = false;
  courseForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

const deleteCourse = async (id: string) => {
  if (!confirm('Are you sure you want to delete this course?') || !auth.currentUser) return;
  try {
    const idToken = await getIdToken(auth.currentUser);
    await api.deleteCourse(id, idToken);
    showStatus('Course deleted successfully!');
    loadCourses();
  } catch (error) {
    showStatus('Error deleting course', true);
  }
};

const resetCourseForm = () => {
  courseForm.reset();
  editingCourseId = null;
  if (courseCancelBtn) courseCancelBtn.hidden = true;
  if (courseImageUrl) courseImageUrl.value = '';
  if (courseUploadPlaceholder) courseUploadPlaceholder.hidden = false;
  if (courseImagePreview) courseImagePreview.hidden = true;
};

const setupImageUpload = (input: HTMLInputElement | null, area: HTMLElement | null, placeholder: HTMLElement | null, preview: HTMLElement | null, removeBtn: HTMLElement | null, progress: HTMLElement | null, progressFill: HTMLElement | null, status: HTMLElement | null, urlInput: HTMLInputElement | null, folder: string) => {
  if (!input || !area || !placeholder || !preview || !removeBtn || !progress || !progressFill || !status || !urlInput) return;
  area.addEventListener('click', (e) => { if (e.target !== removeBtn && !removeBtn.contains(e.target as Node)) input.click(); });
  input.addEventListener('change', async () => { const file = input.files?.[0]; if (file) handleUpload(file); });
  const handleUpload = async (file: File) => {
    try {
      placeholder.hidden = true; progress.hidden = false;
      const url = await uploadImage(file, folder);
      urlInput.value = url;
      const previewImg = preview.querySelector('img');
      if (previewImg) previewImg.src = url;
      progress.hidden = true; preview.hidden = false;
      showStatus('✓ Image uploaded!');
    } catch (e) { showStatus('Upload failed', true); progress.hidden = true; placeholder.hidden = false; }
  };
};

setupImageUpload(articleImageUpload, articleUploadArea, articleUploadPlaceholder, articleImagePreview, articleRemoveImage, articleUploadProgress, articleProgressFill, articleUploadStatus, articleImageUrl, 'articles');
setupImageUpload(courseImageUpload, courseUploadArea, courseUploadPlaceholder, courseImagePreview, courseRemoveImage, courseUploadProgress, courseProgressFill, courseUploadStatus, courseImageUrl, 'courses');

onAuthStateChanged(auth, (user) => { if (user) { showAdmin(); loadCategories(); } else showLogin(); });
emailForm?.addEventListener('submit', async (e) => { e.preventDefault(); const formData = new FormData(emailForm as HTMLFormElement); try { await signInWithEmailPassword(formData.get('email') as string, formData.get('password') as string); } catch (e) { showStatus('Login failed', true); } });
googleBtn?.addEventListener('click', signInWithGoogle);
signOutBtn?.addEventListener('click', () => signOut(auth));
articleForm?.addEventListener('submit', saveArticle);
articleCancelBtn?.addEventListener('click', resetArticleForm);
courseForm?.addEventListener('submit', saveCourse);
courseCancelBtn?.addEventListener('click', resetCourseForm);

// Categories Functions
const loadCategories = async () => {
  if (!categoriesList) return;
  try {
    const categories = await api.getCategories();
    categoriesList.innerHTML = '';
    categories.forEach((cat) => {
      const li = document.createElement('li');
      li.className = 'article-item';
      li.style.padding = '15px 20px';
      li.innerHTML = `
        <div class="content-info">
          <strong>${cat.name}</strong>
          <span class="badge badge-category">${cat.type}</span>
        </div>
      `;
      categoriesList.appendChild(li);
    });
  } catch (error) {
    showStatus('Error loading categories', true);
  }
};

categoryForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!auth.currentUser) return;
  const idToken = await getIdToken(auth.currentUser);
  const formData = new FormData(categoryForm);
  const categoryData: api.Category = {
    name: formData.get('name') as string,
    type: formData.get('type') as 'blog' | 'course'
  };
  try {
    await api.saveCategory(categoryData, idToken);
    showStatus('✓ Category saved!');
    categoryForm.reset();
    loadCategories();
  } catch (e) {
    showStatus('Error saving category', true);
  }
});

// Update showAdmin to include loadCategories
const originalShowAdmin = showAdmin;
(window as any).showAdmin = () => {
  originalShowAdmin();
  loadCategories();
};

