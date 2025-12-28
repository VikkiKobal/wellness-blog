import { onAuthStateChanged, getIdToken } from 'firebase/auth';

console.log('Admin script loading...');

import {
  auth,
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
const categoryCancelBtn = document.getElementById('category-cancel-btn');

// Projects Elements
const projectForm = document.getElementById('project-form') as HTMLFormElement;
const projectsList = document.getElementById('projects-list');
const projectCancelBtn = document.getElementById('project-cancel-btn');
const projectImageUpload = document.getElementById('project-image-upload') as HTMLInputElement;
const projectUploadArea = document.getElementById('project-upload-area');
const projectUploadPlaceholder = document.getElementById('project-upload-placeholder');
const projectImagePreview = document.getElementById('project-image-preview');
const projectRemoveImage = document.getElementById('project-remove-image');
const projectUploadProgress = document.getElementById('project-upload-progress');
const projectProgressFill = document.getElementById('project-progress-fill');
const projectUploadStatus = document.getElementById('project-upload-status');
const projectImageUrl = document.getElementById('project-image-url') as HTMLInputElement;

// Certificates Elements
const certForm = document.getElementById('cert-form') as HTMLFormElement;
const certsList = document.getElementById('certs-list');
const certCancelBtn = document.getElementById('cert-cancel-btn');
const certImageUpload = document.getElementById('cert-image-upload') as HTMLInputElement;
const certUploadArea = document.getElementById('cert-upload-area');
const certUploadPlaceholder = document.getElementById('cert-upload-placeholder');
const certImagePreview = document.getElementById('cert-image-preview');
const certRemoveImage = document.getElementById('cert-remove-image');
const certUploadProgress = document.getElementById('cert-upload-progress');
const certProgressFill = document.getElementById('cert-progress-fill');
const certUploadStatus = document.getElementById('cert-upload-status');
const certImageUrl = document.getElementById('cert-image-url') as HTMLInputElement;

let editingArticleId: string | null = null;
let editingCourseId: string | null = null;
let editingCategoryId: string | null = null;
let editingProjectId: string | null = null;
let editingCertId: string | null = null;

// --- UTILITY FUNCTIONS ---

const showStatus = (message: string, isError = false) => {
  if (statusMessage && loginPanel && !loginPanel.hidden) {
    statusMessage.textContent = message;
    statusMessage.dataset.error = isError ? 'true' : 'false';
    statusMessage.dataset.success = isError ? 'false' : 'true';
    statusMessage.classList.add('show');
    setTimeout(() => statusMessage.classList.remove('show'), 5000);
    return;
  }
  const toast = document.getElementById('status-toast');
  if (!toast) return;
  toast.textContent = message;
  toast.className = `status-toast ${isError ? 'error' : 'success'} show`;
  setTimeout(() => toast.classList.remove('show'), 4000);
};

// --- IMAGE UPLOAD ---

const uploadImage = async (file: File, _folder: string): Promise<string> => {
  try {
    if (file.size > 2 * 1024 * 1024) {
      throw new Error('File too large (max 2MB).');
    }
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  } catch (error: any) {
    throw error;
  }
};

const setupImageUpload = (input: HTMLInputElement | null, area: HTMLElement | null, placeholder: HTMLElement | null, preview: HTMLElement | null, removeBtn: HTMLElement | null, progress: HTMLElement | null, progressFill: HTMLElement | null, status: HTMLElement | null, urlInput: HTMLInputElement | null, folder: string) => {
  if (!input || !area || !placeholder || !preview || !removeBtn || !progress || !progressFill || !status || !urlInput) return;
  
  area.addEventListener('click', (e) => {
    if (e.target !== removeBtn && !removeBtn.contains(e.target as Node)) input.click();
  });

  area.addEventListener('dragover', (e) => { e.preventDefault(); area.classList.add('drag-over'); });
  area.addEventListener('dragleave', () => area.classList.remove('drag-over'));
  area.addEventListener('drop', async (e) => {
    e.preventDefault();
    area.classList.remove('drag-over');
    const file = e.dataTransfer?.files[0];
    if (file && file.type.startsWith('image/')) await handleUpload(file);
  });

  input.addEventListener('change', async () => {
    const file = input.files?.[0];
    if (file) { await handleUpload(file); input.value = ''; }
  });

  removeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    urlInput.value = ''; preview.hidden = true; placeholder.hidden = false; input.value = '';
  });

  const handleUpload = async (file: File) => {
    try {
      placeholder.hidden = true; preview.hidden = true; progress.hidden = false;
      const url = await uploadImage(file, folder);
      urlInput.value = url;
      const previewImg = preview.querySelector('img');
      if (previewImg) previewImg.src = url;
      progress.hidden = true; preview.hidden = false;
      showStatus('✓ Image ready!');
    } catch (e: any) {
      showStatus(`Failed: ${e.message}`, true);
      progress.hidden = true; placeholder.hidden = false;
    }
  };
};

// --- ARTICLES ---

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
          <div class="article-header"><strong>${article.title}</strong><div class="article-badges">${featuredBadge}<span class="badge badge-category">🏷️ ${article.category || 'Uncategorized'}</span></div></div>
          <p class="article-excerpt">${article.excerpt || 'No excerpt'}</p>
          <div class="content-meta"><span class="content-tag">📅 ${article.date}</span><span class="content-tag">👤 ${article.author || 'Unknown'}</span></div>
        </div>
        <div class="content-actions"><button class="btn-edit" data-id="${article.id}">Edit</button><button class="btn-danger" data-id="${article.id}">Delete</button></div>
      `;
      li.querySelector('.btn-edit')?.addEventListener('click', () => editArticle(article));
      li.querySelector('.btn-danger')?.addEventListener('click', () => article.id && deleteArticle(article.id));
      articlesList.appendChild(li);
    });
  } catch (error) { showStatus('Error loading articles', true); }
};

const saveArticle = async (e: Event) => {
  e.preventDefault();
  if (!auth.currentUser) return;
  const idToken = await getIdToken(auth.currentUser);
  const formData = new FormData(articleForm);
  const articleData: api.Article = {
    id: editingArticleId || undefined,
    title: formData.get('title')?.toString().trim() || '',
    excerpt: '',
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
  } catch (error) { showStatus('Error saving article', true); }
};

const editArticle = (article: api.Article) => {
  editingArticleId = article.id || null;
  (articleForm.elements.namedItem('title') as HTMLInputElement).value = article.title;
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
  if (!confirm('Are you sure?') || !auth.currentUser) return;
  try {
    const idToken = await getIdToken(auth.currentUser);
    await api.deleteArticle(id, idToken);
    showStatus('Article deleted!');
    loadArticles();
  } catch (error) { showStatus('Error deleting article', true); }
};

const resetArticleForm = () => {
  articleForm.reset(); editingArticleId = null;
  if (articleCancelBtn) articleCancelBtn.hidden = true;
  if (articleImageUrl) articleImageUrl.value = '';
  if (articleUploadPlaceholder) articleUploadPlaceholder.hidden = false;
  if (articleImagePreview) articleImagePreview.hidden = true;
};

// --- COURSES ---

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
          <div class="article-header"><strong>${course.title}</strong><div class="article-badges"><span class="badge badge-category">🏷️ ${course.category}</span><span class="badge badge-price">${course.price}</span></div></div>
          <p class="article-excerpt">${course.description || 'No description'}</p>
          <div class="content-meta"><span class="content-tag">📚 ${course.lessons}</span><span class="content-tag">⏱️ ${course.duration}</span></div>
          <div class="course-tags">${course.tags?.map(tag => `<span class="tag-chip">${tag}</span>`).join('') || ''}</div>
        </div>
        <div class="content-actions"><button class="btn-edit" data-id="${course.id}">Edit</button><button class="btn-danger" data-id="${course.id}">Delete</button></div>
      `;
      li.querySelector('.btn-edit')?.addEventListener('click', () => editCourse(course));
      li.querySelector('.btn-danger')?.addEventListener('click', () => course.id && deleteCourse(course.id));
      coursesList.appendChild(li);
    });
  } catch (error) { showStatus('Error loading courses', true); }
};

const saveCourse = async (e: Event) => {
  e.preventDefault();
  if (!auth.currentUser) return;
  const idToken = await getIdToken(auth.currentUser);
  const formData = new FormData(courseForm);
  const courseData: api.Course = {
    id: editingCourseId || undefined,
    title: formData.get('title')?.toString().trim() || '',
    description: formData.get('description')?.toString().trim() || '',
    lessons: formData.get('lessons')?.toString().trim() || '',
    duration: formData.get('duration')?.toString().trim() || '',
    price: formData.get('price')?.toString().trim() || '',
    category: formData.get('category')?.toString().trim() || '',
    tags: formData.get('tags')?.toString().split('\n').map(t => t.trim()).filter(t => t) || [],
    image: formData.get('image')?.toString().trim() || '/images/service-1.png',
  };
  try {
    await api.saveCourse(courseData, idToken);
    showStatus('✓ Course saved!');
    resetCourseForm(); loadCourses();
  } catch (error) { showStatus('Error saving course', true); }
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
  if (!confirm('Are you sure?') || !auth.currentUser) return;
  try {
    const idToken = await getIdToken(auth.currentUser);
    await api.deleteCourse(id, idToken);
    showStatus('Course deleted!'); loadCourses();
  } catch (error) { showStatus('Error deleting course', true); }
};

const resetCourseForm = () => {
  courseForm.reset(); editingCourseId = null;
  if (courseCancelBtn) courseCancelBtn.hidden = true;
  if (courseImageUrl) courseImageUrl.value = '';
  if (courseUploadPlaceholder) courseUploadPlaceholder.hidden = false;
  if (courseImagePreview) courseImagePreview.hidden = true;
};

// --- CATEGORIES ---

const loadCategories = async () => {
  if (!categoriesList) return;
  try {
    const categories = await api.getCategories();
    categoriesList.innerHTML = '';
    categories.forEach((cat, index) => {
      const li = document.createElement('li');
      li.className = 'article-item category-item';
      const upDisabled = index === 0;
      const downDisabled = index === categories.length - 1;
      li.innerHTML = `
        <div class="content-info"><div class="article-header"><strong>${cat.name}</strong><span class="badge badge-category">${cat.type}</span></div></div>
        <div class="content-actions category-actions">
          <div class="reorder-btns">
            <button class="btn-reorder btn-up" ${upDisabled ? 'disabled' : ''}>↑</button>
            <button class="btn-reorder btn-down" ${downDisabled ? 'disabled' : ''}>↓</button>
          </div>
          <button class="btn-edit" data-id="${cat.id}">Edit</button><button class="btn-danger" data-id="${cat.id}">Delete</button>
        </div>
      `;
      li.querySelector('.btn-up')?.addEventListener('click', () => moveCategory(categories, index, -1));
      li.querySelector('.btn-down')?.addEventListener('click', () => moveCategory(categories, index, 1));
      li.querySelector('.btn-edit')?.addEventListener('click', () => editCategory(cat));
      li.querySelector('.btn-danger')?.addEventListener('click', () => cat.id && deleteCategory(cat.id));
      categoriesList.appendChild(li);
    });

    const courseSelect = courseForm.querySelector('select[name="category"]') as HTMLSelectElement;
    if (courseSelect) {
      const courseCats = categories.filter(c => c.type === 'course');
      const val = courseSelect.value;
      courseSelect.innerHTML = '<option value="">Select category</option>' + courseCats.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
      courseSelect.value = val;
    }
  } catch (error) { showStatus('Error categories', true); }
};

const saveCategory = async (e: Event) => {
  e.preventDefault();
  if (!auth.currentUser) return;
  const idToken = await getIdToken(auth.currentUser);
  const formData = new FormData(categoryForm);
  try {
    await api.saveCategory({ id: editingCategoryId || undefined, name: formData.get('name') as string, type: formData.get('type') as any }, idToken);
    showStatus('✓ Category saved!'); resetCategoryForm(); loadCategories();
  } catch (e) { showStatus('Error saving category', true); }
};

const editCategory = (cat: api.Category) => {
  editingCategoryId = cat.id || null;
  (categoryForm.elements.namedItem('name') as HTMLInputElement).value = cat.name;
  (categoryForm.elements.namedItem('type') as HTMLSelectElement).value = cat.type;
  if (categoryCancelBtn) categoryCancelBtn.hidden = false;
  categoryForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

const deleteCategory = async (id: string) => {
  if (!confirm('Are you sure?') || !auth.currentUser) return;
  try {
    const idToken = await getIdToken(auth.currentUser);
    await api.deleteCategory(id, idToken);
    showStatus('Deleted!'); loadCategories();
  } catch (e) { showStatus('Error', true); }
};

const resetCategoryForm = () => { categoryForm.reset(); editingCategoryId = null; if (categoryCancelBtn) categoryCancelBtn.hidden = true; };

const moveCategory = async (categories: api.Category[], index: number, direction: number) => {
  if (!auth.currentUser) return;
  const newIndex = index + direction;
  if (newIndex < 0 || newIndex >= categories.length) return;
  const temp = categories[index]; categories[index] = categories[newIndex]; categories[newIndex] = temp;
  const idToken = await getIdToken(auth.currentUser);
  try { await api.reorderCategories(categories.map(c => c.id!).filter(id => id), idToken); loadCategories(); } catch (e) { showStatus('Error reorder', true); }
};

// --- PROJECTS ---

const loadProjects = async () => {
  if (!projectsList) return;
  try {
    const projects = await api.getProjects();
    projectsList.innerHTML = '';
    projects.forEach((project, index) => {
      const li = document.createElement('li');
      li.className = 'article-item';
      const upDisabled = index === 0;
      const downDisabled = index === projects.length - 1;
      li.innerHTML = `
        <div class="article-preview"><img src="${project.image || '/images/collaboration.jpg'}" class="article-thumbnail" /></div>
        <div class="content-info"><strong>${project.title}</strong><p class="article-excerpt">${project.description || ''}</p></div>
        <div class="content-actions">
          <div class="reorder-btns"><button class="btn-reorder btn-up" ${upDisabled ? 'disabled' : ''}>↑</button><button class="btn-reorder btn-down" ${downDisabled ? 'disabled' : ''}>↓</button></div>
          <button class="btn-edit" data-id="${project.id}">Edit</button><button class="btn-danger" data-id="${project.id}">Delete</button>
        </div>
      `;
      li.querySelector('.btn-up')?.addEventListener('click', () => moveProject(projects, index, -1));
      li.querySelector('.btn-down')?.addEventListener('click', () => moveProject(projects, index, 1));
      li.querySelector('.btn-edit')?.addEventListener('click', () => editProject(project));
      li.querySelector('.btn-danger')?.addEventListener('click', () => project.id && deleteProject(project.id));
      projectsList.appendChild(li);
    });
  } catch (error) { showStatus('Error loading projects', true); }
};

const saveProject = async (e: Event) => {
  e.preventDefault();
  if (!auth.currentUser) return;
  const idToken = await getIdToken(auth.currentUser);
  const formData = new FormData(projectForm);
  const projectData: api.Project = {
    id: editingProjectId || undefined,
    title: formData.get('title')?.toString().trim() || '',
    description: formData.get('description')?.toString().trim() || '',
    detail: formData.get('detail')?.toString().trim() || '',
    linkLabel: formData.get('linkLabel')?.toString().trim() || '',
    linkHref: formData.get('linkHref')?.toString().trim() || '',
    image: formData.get('image')?.toString().trim() || '',
  };
  try {
    await api.saveProject(projectData, idToken);
    showStatus('✓ Project saved!'); resetProjectForm(); loadProjects();
  } catch (error) { showStatus('Error saving project', true); }
};

const editProject = (project: api.Project) => {
  editingProjectId = project.id || null;
  (projectForm.elements.namedItem('title') as HTMLInputElement).value = project.title;
  (projectForm.elements.namedItem('description') as HTMLTextAreaElement).value = project.description;
  (projectForm.elements.namedItem('detail') as HTMLTextAreaElement).value = project.detail;
  (projectForm.elements.namedItem('linkLabel') as HTMLInputElement).value = project.linkLabel;
  (projectForm.elements.namedItem('linkHref') as HTMLInputElement).value = project.linkHref;
  if (projectImageUrl) projectImageUrl.value = project.image;
  if (project.image && projectImagePreview && projectUploadPlaceholder) {
    const previewImg = projectImagePreview.querySelector('img');
    if (previewImg) { previewImg.src = project.image; projectUploadPlaceholder.hidden = true; projectImagePreview.hidden = false; }
  }
  if (projectCancelBtn) projectCancelBtn.hidden = false;
  projectForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

const deleteProject = async (id: string) => {
  if (!confirm('Are you sure?') || !auth.currentUser) return;
  try {
    const idToken = await getIdToken(auth.currentUser);
    await api.deleteProject(id, idToken);
    showStatus('Deleted!'); loadProjects();
  } catch (error) { showStatus('Error', true); }
};

const resetProjectForm = () => {
  projectForm.reset(); editingProjectId = null;
  if (projectCancelBtn) projectCancelBtn.hidden = true;
  if (projectImageUrl) projectImageUrl.value = '';
  if (projectUploadPlaceholder) projectUploadPlaceholder.hidden = false;
  if (projectImagePreview) projectImagePreview.hidden = true;
};

const moveProject = async (projects: api.Project[], index: number, direction: number) => {
  if (!auth.currentUser) return;
  const newIndex = index + direction;
  if (newIndex < 0 || newIndex >= projects.length) return;
  const temp = projects[index]; projects[index] = projects[newIndex]; projects[newIndex] = temp;
  const idToken = await getIdToken(auth.currentUser);
  try { await api.reorderProjects(projects.map(p => p.id!).filter(id => id), idToken); loadProjects(); } catch (e) { showStatus('Error', true); }
};

// --- CERTIFICATES ---

const loadCertificates = async () => {
  if (!certsList) return;
  try {
    const certs = await api.getCertificates();
    certsList.innerHTML = '';
    certs.forEach((cert, index) => {
      const li = document.createElement('li');
      li.className = 'article-item';
      const upDisabled = index === 0;
      const downDisabled = index === certs.length - 1;
      li.innerHTML = `
        <div class="article-preview"><img src="${cert.image || '/images/blog-1.png'}" class="article-thumbnail" /></div>
        <div class="content-info">
          <strong>${cert.title}</strong>
          <p class="article-excerpt">${cert.issuer} • ${cert.year}</p>
        </div>
        <div class="content-actions">
          <div class="reorder-btns">
            <button class="btn-reorder btn-up" ${upDisabled ? 'disabled' : ''}>↑</button>
            <button class="btn-reorder btn-down" ${downDisabled ? 'disabled' : ''}>↓</button>
          </div>
          <button class="btn-edit" data-id="${cert.id}">Edit</button>
          <button class="btn-danger" data-id="${cert.id}">Delete</button>
        </div>
      `;
      li.querySelector('.btn-up')?.addEventListener('click', () => moveCertificate(certs, index, -1));
      li.querySelector('.btn-down')?.addEventListener('click', () => moveCertificate(certs, index, 1));
      li.querySelector('.btn-edit')?.addEventListener('click', () => editCertificate(cert));
      li.querySelector('.btn-danger')?.addEventListener('click', () => cert.id && deleteCertificate(cert.id));
      certsList.appendChild(li);
    });
  } catch (error) { showStatus('Error loading certificates', true); }
};

const saveCertificate = async (e: Event) => {
  e.preventDefault();
  if (!auth.currentUser) return;
  const idToken = await getIdToken(auth.currentUser);
  const formData = new FormData(certForm);
  const certData: api.Certificate = {
    id: editingCertId || undefined,
    title: formData.get('title')?.toString().trim() || '',
    issuer: formData.get('issuer')?.toString().trim() || '',
    year: formData.get('year')?.toString().trim() || '',
    image: formData.get('image')?.toString().trim() || '',
  };
  try {
    await api.saveCertificate(certData, idToken);
    showStatus('✓ Certificate saved!');
    resetCertForm();
    loadCertificates();
  } catch (error) { showStatus('Error saving certificate', true); }
};

const editCertificate = (cert: api.Certificate) => {
  editingCertId = cert.id || null;
  (certForm.elements.namedItem('title') as HTMLInputElement).value = cert.title;
  (certForm.elements.namedItem('issuer') as HTMLInputElement).value = cert.issuer;
  (certForm.elements.namedItem('year') as HTMLInputElement).value = cert.year;
  if (certImageUrl) certImageUrl.value = cert.image;
  if (cert.image && certImagePreview && certUploadPlaceholder) {
    const previewImg = certImagePreview.querySelector('img');
    if (previewImg) { previewImg.src = cert.image; certUploadPlaceholder.hidden = true; certImagePreview.hidden = false; }
  }
  if (certCancelBtn) certCancelBtn.hidden = false;
  certForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

const deleteCertificate = async (id: string) => {
  if (!confirm('Are you sure?') || !auth.currentUser) return;
  try {
    const idToken = await getIdToken(auth.currentUser);
    await api.deleteCertificate(id, idToken);
    showStatus('Deleted!');
    loadCertificates();
  } catch (error) { showStatus('Error', true); }
};

const resetCertForm = () => {
  certForm.reset();
  editingCertId = null;
  if (certCancelBtn) certCancelBtn.hidden = true;
  if (certImageUrl) certImageUrl.value = '';
  if (certUploadPlaceholder) certUploadPlaceholder.hidden = false;
  if (certImagePreview) certImagePreview.hidden = true;
};

const moveCertificate = async (certs: api.Certificate[], index: number, direction: number) => {
  if (!auth.currentUser) return;
  const newIndex = index + direction;
  if (newIndex < 0 || newIndex >= certs.length) return;
  const temp = certs[index]; certs[index] = certs[newIndex]; certs[newIndex] = temp;
  const idToken = await getIdToken(auth.currentUser);
  try {
    await api.reorderCertificates(certs.map(c => c.id!).filter(id => id), idToken);
    loadCertificates();
  } catch (e) { showStatus('Error', true); }
};

// --- AUTH & INITIALIZATION ---

const showAdmin = () => {
  if (loginPanel) { loginPanel.hidden = true; loginPanel.style.display = 'none'; }
  if (adminPanel) { adminPanel.hidden = false; adminPanel.style.display = 'flex'; }
  loadArticles(); loadCourses(); loadProjects(); loadCategories(); loadCertificates();
};

const showLogin = () => {
  if (loginPanel) { loginPanel.hidden = false; loginPanel.style.display = 'flex'; }
  if (adminPanel) { adminPanel.hidden = true; adminPanel.style.display = 'none'; }
};

// Initialization and Listeners
setupImageUpload(articleImageUpload, articleUploadArea, articleUploadPlaceholder, articleImagePreview, articleRemoveImage, articleUploadProgress, articleProgressFill, articleUploadStatus, articleImageUrl, 'articles');
setupImageUpload(courseImageUpload, courseUploadArea, courseUploadPlaceholder, courseImagePreview, courseRemoveImage, courseUploadProgress, courseProgressFill, courseUploadStatus, courseImageUrl, 'courses');
setupImageUpload(projectImageUpload, projectUploadArea, projectUploadPlaceholder, projectImagePreview, projectRemoveImage, projectUploadProgress, projectProgressFill, projectUploadStatus, projectImageUrl, 'projects');
setupImageUpload(certImageUpload, certUploadArea, certUploadPlaceholder, certImagePreview, certRemoveImage, certUploadProgress, certProgressFill, certUploadStatus, certImageUrl, 'certificates');

tabButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const targetTab = button.getAttribute('data-tab');
    tabButtons.forEach((btn) => btn.classList.remove('active'));
    button.classList.add('active');
    tabContents.forEach((content) => content.classList.remove('active'));
    document.getElementById(`${targetTab}-tab`)?.classList.add('active');
    if (window.innerWidth <= 1024) {
      document.getElementById('admin-sidebar')?.classList.remove('open');
      document.getElementById('sidebar-overlay')?.classList.remove('active');
    }
  });
});

const sidebar = document.getElementById('admin-sidebar');
const overlay = document.getElementById('sidebar-overlay');
document.getElementById('mobile-menu-toggle')?.addEventListener('click', () => { sidebar?.classList.add('open'); overlay?.classList.add('active'); });
document.getElementById('sidebar-close')?.addEventListener('click', () => { sidebar?.classList.remove('open'); overlay?.classList.remove('active'); });
overlay?.addEventListener('click', () => { sidebar?.classList.remove('open'); overlay?.classList.remove('active'); });

googleBtn?.addEventListener('click', async () => { try { await signInWithGoogle(); } catch (e) { showStatus('Login failed', true); } });
emailForm?.addEventListener('submit', async (e) => { e.preventDefault(); const formData = new FormData(emailForm as HTMLFormElement); try { await signInWithEmailPassword(formData.get('email') as string, formData.get('password') as string); } catch (e) { showStatus('Login failed', true); } });
signOutBtn?.addEventListener('click', () => signOut(auth));

articleForm?.addEventListener('submit', saveArticle);
articleCancelBtn?.addEventListener('click', resetArticleForm);
courseForm?.addEventListener('submit', saveCourse);
courseCancelBtn?.addEventListener('click', resetCourseForm);
categoryForm?.addEventListener('submit', saveCategory);
categoryCancelBtn?.addEventListener('click', resetCategoryForm);
projectForm?.addEventListener('submit', saveProject);
projectCancelBtn?.addEventListener('click', resetProjectForm);
certForm?.addEventListener('submit', saveCertificate);
certCancelBtn?.addEventListener('click', resetCertForm);

onAuthStateChanged(auth, (user) => { if (user) showAdmin(); else showLogin(); });
