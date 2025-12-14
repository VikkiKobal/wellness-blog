import { onAuthStateChanged } from 'firebase/auth';
import {
  auth,
  signInWithGoogle,
  signInWithEmailPassword,
  signOut,
} from '../firebase/firebase';
import { verifyToken } from '../utils/api';

const loginPanel = document.getElementById('login-panel');
const adminPanel = document.getElementById('admin-panel');
const statusMessage = document.getElementById('status-message');
const emailForm = document.getElementById('email-login-form');
const googleBtn = document.getElementById('google-sign-in');
const signOutBtn = document.getElementById('sign-out-btn');
const serviceForm = document.getElementById('service-form');
const serviceList = document.getElementById('service-list');
const cancelEditBtn = document.getElementById('cancel-edit');

const seedServices = [
  { title: 'SEL Coaching', description: 'Individual coaching to center emotional learning and reflective feedback loops.' },
  { title: 'Digital Pedagogy Labs', description: 'Design and test mindful, future-ready digital experiences for educators.' },
  { title: 'Community Convenings', description: 'Facilitated gatherings that bridge research, well-being, and classroom practice.' },
];

let services = [...seedServices];
let editingIndex: number | null = null;

const renderServices = () => {
  if (!serviceList) return;
  serviceList.innerHTML = services
    .map(
      (service, index) => `
        <li>
          <div>
            <strong>${service.title}</strong>
            <p>${service.description}</p>
          </div>
          <button data-edit="${index}" class="ghost tiny">Edit</button>
        </li>
      `
    )
    .join('');
};

const resetForm = () => {
  if (serviceForm instanceof HTMLFormElement) {
    serviceForm.reset();
  }
  editingIndex = null;
  if (cancelEditBtn instanceof HTMLButtonElement) {
    cancelEditBtn.hidden = true;
  }
};

const showStatus = (message: string, isError = false) => {
  if (!statusMessage) return;
  statusMessage.textContent = message;
  statusMessage.dataset.error = isError ? 'true' : 'false';
};

const showAdmin = () => {
  if (loginPanel) loginPanel.hidden = true;
  if (adminPanel) adminPanel.hidden = false;
  showStatus('Welcome, you have admin access.');
};

const showLogin = () => {
  if (loginPanel) loginPanel.hidden = false;
  if (adminPanel) adminPanel.hidden = true;
  showStatus('Please sign in to access the admin tools.', true);
};

onAuthStateChanged(auth, async (user) => {
  if (user) {
    try {
      const token = await user.getIdToken();
      const verification = await verifyToken(token);
      if (verification.valid) {
        showAdmin();
        renderServices();
        return;
      }
    } catch (error) {
      console.error('Verification failed:', error);
    }
    await signOut(auth);
  }
  showLogin();
});

if (emailForm instanceof HTMLFormElement) {
  emailForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData(emailForm);
    const email = formData.get('email')?.toString().trim() || '';
    const password = formData.get('password')?.toString().trim() || '';

    try {
      await signInWithEmailPassword(email, password);
    } catch (error) {
      showStatus('Email sign-in failed. Check credentials.', true);
      console.error('Email sign-in error:', error);
    }
  });
}

if (googleBtn instanceof HTMLButtonElement) {
  googleBtn.addEventListener('click', async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      showStatus('Google sign-in failed. Try again.', true);
      console.error('Google sign-in error:', error);
    }
  });
}

if (signOutBtn instanceof HTMLButtonElement) {
  signOutBtn.addEventListener('click', async () => {
    await signOut(auth);
  });
}

if (serviceForm instanceof HTMLFormElement) {
  serviceForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const formData = new FormData(serviceForm);
    const title = formData.get('title')?.toString().trim();
    const description = formData.get('description')?.toString().trim();
    if (!title || !description) {
      showStatus('Title and description are required.', true);
      return;
    }
    if (editingIndex !== null) {
      services[editingIndex] = { title, description };
      showStatus('Service updated.');
    } else {
      services.unshift({ title, description });
      showStatus('Service added.');
    }
    renderServices();
    resetForm();
  });
}

if (cancelEditBtn instanceof HTMLButtonElement) {
  cancelEditBtn.addEventListener('click', () => {
    resetForm();
  });
}

if (serviceList instanceof HTMLElement) {
  serviceList.addEventListener('click', (event) => {
    const target = event.target;
    if (target instanceof HTMLElement && target.dataset.edit) {
      const index = Number(target.dataset.edit);
      const service = services[index];
      if (!service) return;
      if (!(serviceForm instanceof HTMLFormElement)) return;
      const titleField = serviceForm.elements.namedItem('title');
      const descriptionField = serviceForm.elements.namedItem('description');
      if (titleField instanceof HTMLInputElement) {
        titleField.value = service.title;
      }
      if (descriptionField instanceof HTMLTextAreaElement) {
        descriptionField.value = service.description;
      }
      editingIndex = index;
      if (cancelEditBtn instanceof HTMLButtonElement) {
        cancelEditBtn.hidden = false;
      }
    }
  });
}

renderServices();



