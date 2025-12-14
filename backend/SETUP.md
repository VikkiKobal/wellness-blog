# Backend Setup Guide

## Step 1: Install Go

1. Download Go from https://go.dev/dl/
2. Install it following the instructions for your operating system
3. Verify installation:
   ```bash
   go version
   ```

## Step 2: Set Up Firebase Service Account

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Project Settings** (gear icon) > **Service Accounts**
4. Click **Generate New Private Key**
5. Save the downloaded JSON file as `firebase-service-account.json` in the `backend/` directory

## Step 3: Configure Environment

1. Copy the example environment file:
   ```bash
   cp config.example.env .env
   ```

2. Edit `.env` and update:
   - `GOOGLE_APPLICATION_CREDENTIALS`: Path to your `firebase-service-account.json`
   - `PORT`: Server port (default: 8080)
   - `FIREBASE_PROJECT_ID`: Your Firebase project ID (optional)

## Step 4: Install Dependencies

```bash
cd backend
go mod download
go mod tidy
```

## Step 5: Run the Server

```bash
go run main.go
```

Or using Make:
```bash
make run
```

The server will start on `http://localhost:8080`

## Step 6: Test the API

```bash
# Health check
curl http://localhost:8080/api/health
```

## Troubleshooting

### "go: command not found"
- Make sure Go is installed and added to your PATH
- Restart your terminal after installation

### "Error initializing Firebase app"
- Check that `firebase-service-account.json` exists and is valid
- Verify `GOOGLE_APPLICATION_CREDENTIALS` in `.env` points to the correct file

### CORS errors
- Update `AllowedOrigins` in `main.go` to include your frontend URL
- Or set `CORS_ORIGINS` environment variable







