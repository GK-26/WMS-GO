.PHONY: build run test clean deps dev

# Build the application
build:
	go build -o bin/wms-backend cmd/server/main.go

# Run the application
run:
	go run cmd/server/main.go

# Run in development mode with hot reload (requires air)
dev:
	air

# Install dependencies
deps:
	go mod download
	go mod tidy

# Run tests
test:
	go test ./...

# Run tests with coverage
test-coverage:
	go test -coverprofile=coverage.out ./...
	go tool cover -html=coverage.out

# Clean build artifacts
clean:
	rm -rf bin/
	rm -f coverage.out

# Install development tools
install-tools:
	go install github.com/cosmtrek/air@latest
	go install github.com/swaggo/swag/cmd/swag@latest

# Generate API documentation
docs:
	swag init -g cmd/server/main.go

# Docker commands
docker-build:
	docker build -t wms-backend .

docker-run:
	docker run -p 8080:8080 --env-file .env wms-backend

# Database commands
db-seed:
	go run scripts/seed.go

# Lint and format
lint:
	golangci-lint run

format:
	go fmt ./...

# Environment management
env-dev:
	./scripts/env-setup.sh dev

env-prod:
	./scripts/env-setup.sh prod

env-docker:
	./scripts/env-setup.sh docker

env-validate:
	./scripts/env-setup.sh validate

env-show:
	./scripts/env-setup.sh show

# Help
help:
	@echo "Available commands:"
	@echo "  build        - Build the application"
	@echo "  run          - Run the application"
	@echo "  dev          - Run with hot reload (requires air)"
	@echo "  deps         - Install dependencies"
	@echo "  test         - Run tests"
	@echo "  test-coverage - Run tests with coverage"
	@echo "  clean        - Clean build artifacts"
	@echo "  install-tools - Install development tools"
	@echo "  docs         - Generate API documentation"
	@echo "  docker-build - Build Docker image"
	@echo "  docker-run   - Run Docker container"
	@echo "  db-seed      - Seed database with sample data"
	@echo "  lint         - Run linter"
	@echo "  format       - Format code"
	@echo ""
	@echo "Environment management:"
	@echo "  env-dev      - Setup development environment"
	@echo "  env-prod     - Setup production environment"
	@echo "  env-docker   - Setup Docker environment"
	@echo "  env-validate - Validate environment configuration"
	@echo "  env-show     - Show current environment variables" 