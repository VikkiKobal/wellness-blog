# Galactic Giant - Personal Wellbeing Blog

A modern personal blog built with Astro and a Go backend, featuring Firebase authentication and a comprehensive admin panel for content management.

## Project Structure

```text
/
├── backend/              # Go backend server
│   ├── main.go          # Main server file
│   ├── middleware.go    # Authentication middleware
│   ├── go.mod           # Go dependencies
│   └── README.md        # Backend setup guide
├── public/              # Static assets
├── src/
│   ├── components/      # Astro components
│   ├── content/         # Content collections (articles)
│   ├── firebase/        # Firebase client config
│   ├── layouts/         # Page layouts
│   ├── pages/           # Route pages
│   │   └── admin.astro  # Admin panel
│   ├── scripts/         # TypeScript scripts
│   │   └── admin.ts     # Admin panel logic
│   └── utils/           # Utility functions (API client)
├── ADMIN_GUIDE.md       # Admin panel user guide
├── FIREBASE_SETUP.md    # Firebase setup instructions
└── package.json
```

## Setup

### Frontend (Astro)

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   Create a `.env` file in the root directory:
   ```env
   PUBLIC_FIREBASE_API_KEY=your-api-key
   PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   PUBLIC_FIREBASE_PROJECT_ID=your-project-id
   PUBLIC_FIREBASE_APP_ID=your-app-id
   PUBLIC_API_URL=http://localhost:8080/api
   ```

3. **Run the development server:**
   ```bash
   npm run dev
   ```

### Backend (Go)

See [backend/README.md](./backend/README.md) for detailed setup instructions.

Quick start:
1. Install Go (https://go.dev/dl/)
2. Set up Firebase service account key
3. Configure environment variables
4. Run: `cd backend && go run main.go`

## Commands

### Frontend
| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Build your production site to `./dist/`          |
| `npm run preview`         | Preview your build locally, before deploying     |

### Backend
| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `cd backend && go run main.go` | Start the backend server |
| `cd backend && make run`  | Start server (using Makefile) |
| `cd backend && make build` | Build the server binary |

## Authentication

The project uses Firebase Authentication with a Go backend for token verification:

1. **Client-side:** Users sign in via Firebase (Google, Email/Password, etc.)
2. **Server-side:** The Go backend verifies Firebase ID tokens
3. **API:** Protected endpoints use the verified tokens

See `src/components/AuthExample.astro` for an example implementation.

## Admin Panel

The admin panel (`/admin`) provides a comprehensive interface for managing blog content:

### Features:
- **Blog Articles Management**
  - Create, edit, and delete articles
  - Markdown support for rich content
  - Image upload to Firebase Storage
  - Categories and featured articles
  
-  **Courses Management**
  - Create, edit, and delete courses
  - Multiple categories support
  - Custom tags for target audience
  - Image upload functionality

### Quick Start:

1. **Set up Firebase:**
   - Follow instructions in [FIREBASE_SETUP.md](./FIREBASE_SETUP.md)
   - Enable Authentication, Firestore, and Storage
   - Create an admin user

2. **Access the admin panel:**
   ```
   http://localhost:4321/admin
   ```

3. **Sign in:**
   - Use Email/Password or Google authentication
   - Only authenticated users can access the panel

4. **Manage content:**
   - See [ADMIN_GUIDE.md](./ADMIN_GUIDE.md) for detailed instructions

### Data Storage:

The admin panel uses Firebase Firestore for data storage:
- **Collection: `articles`** - Blog articles with markdown content
- **Collection: `courses`** - Course information with categories and tags
- **Storage: `articles/` and `courses/`** - Uploaded images

## API Endpoints

- `GET /api/health` - Health check
- `POST /api/auth/verify` - Verify Firebase ID token
- `GET /api/auth/user` - Get user info (requires Authorization header)
- `POST /api/auth/refresh` - Refresh token verification

See [backend/README.md](./backend/README.md) for full API documentation.

## Want to learn more?

- [Astro Documentation](https://docs.astro.build)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Go Documentation](https://go.dev/doc/)
