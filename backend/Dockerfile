# Build stage
FROM golang:1.24-alpine AS builder

WORKDIR /app

# Install dependencies
COPY go.mod go.sum ./
RUN go mod download

# Copy source code
COPY . .

# Build the application
RUN go build -o server .

# Final stage
FROM alpine:latest

WORKDIR /app

# Copy binary from builder
COPY --from=builder /app/server .
# Copy firebase credentials if they exist
COPY --from=builder /app/serviceAccountKey.json* .

EXPOSE 8080

CMD ["./server"]



