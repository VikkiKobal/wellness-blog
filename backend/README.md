# Galactic Giant Backend

Go backend server with Firebase authentication for the Astro frontend.

## Prerequisites

- Go 1.21 or higher
- Firebase project with Authentication enabled
- Firebase service account key (JSON file)

## Setup

1. **Install dependencies:**
   ```bash
   cd backend
   go mod download
   ```

2. **Set up Firebase:**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Select your project
   - Go to Project Settings > Service Accounts
   - Click "Generate New Private Key"
   - Save the JSON file as `firebase-service-account.json` in the `backend/` directory

3. **Configure environment variables:**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and set:
   - `GOOGLE_APPLICATION_CREDENTIALS` to the path of your service account JSON file
   - `PORT` (default: 8080)
   - `FIREBASE_PROJECT_ID` (optional, if using Application Default Credentials)

4. **Run the server:**
   ```bash
   go run main.go
   ```

   Or build and run:
   ```bash
   go build -o server main.go
   ./server
   ```

## API Endpoints

### Health Check
- **GET** `/api/health`
  - Returns server status

### Authentication

#### Verify Token
- **POST** `/api/auth/verify`
  - Request body:
    ```json
    {
      "idToken": "firebase-id-token"
    }
    ```
  - Response:
    ```json
    {
      "valid": true,
      "user": {
        "uid": "user-id",
        "email": "user@example.com",
        "displayName": "User Name",
        "photoURL": "https://..."
      }
    }
    ```

#### Get User
- **GET** `/api/auth/user`
  - Headers: `Authorization: Bearer <firebase-id-token>`
  - Response:
    ```json
    {
      "uid": "user-id",
      "email": "user@example.com",
      "displayName": "User Name",
      "photoURL": "https://..."
    }
    ```

#### Refresh Token
- **POST** `/api/auth/refresh`
  - Request body:
    ```json
    {
      "idToken": "firebase-id-token"
    }
    ```
  - Response:
    ```json
    {
      "success": true,
      "message": "Token is valid",
      "user": { ... }
    }
    ```

## Frontend Integration

In your Astro frontend, you can call these endpoints after getting a Firebase ID token:

```typescript
// After user signs in with Firebase
const user = auth.currentUser;
const idToken = await user?.getIdToken();

// Verify token with backend
const response = await fetch('http://localhost:8080/api/auth/verify', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ idToken }),
});

const data = await response.json();
```

## CORS

The server is configured to accept requests from:
- `http://localhost:4321` (Astro dev server)
- `http://localhost:3000` (alternative dev port)

To add more origins, update the `AllowedOrigins` in `main.go` or use environment variables.

## Security Notes

- Never commit `firebase-service-account.json` to version control
- Keep your `.env` file secure
- Use environment variables in production
- The backend verifies Firebase tokens server-side for additional security








