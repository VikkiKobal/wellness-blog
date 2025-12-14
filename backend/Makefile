.PHONY: run build test clean deps

# Run the server
run:
	go run main.go

# Build the server
build:
	go build -o server main.go

# Run tests
test:
	go test ./...

# Clean build artifacts
clean:
	rm -f server
	rm -f *.exe

# Download dependencies
deps:
	go mod download
	go mod tidy

# Install dependencies
install: deps

# Development mode with auto-reload (requires air: go install github.com/cosmtrek/air@latest)
dev:
	air







