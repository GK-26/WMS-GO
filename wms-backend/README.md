# WMS Backend

A Go-based backend for the Warehouse Management System (WMS) built with Gin framework and MongoDB.

## Features

- **Authentication & Authorization**: JWT-based authentication with role-based access control
- **User Management**: Complete user CRUD operations with role management
- **Inventory Management**: Product and inventory tracking
- **Order Management**: Order processing and fulfillment
- **Task Management**: Warehouse task assignment and tracking
- **RESTful API**: Clean, documented REST endpoints
- **MongoDB Integration**: NoSQL database with proper indexing
- **Docker Support**: Containerized deployment
- **CORS Support**: Cross-origin resource sharing for frontend integration

## Tech Stack

- **Language**: Go 1.23+
- **Framework**: Gin (HTTP web framework)
- **Database**: MongoDB
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcrypt
- **Containerization**: Docker
- **Documentation**: Swagger/OpenAPI (planned)

## Prerequisites

- Go 1.23 or higher
- MongoDB 4.4 or higher
- Docker (optional)

## Quick Start

### 1. Clone and Setup

```bash
cd wms-backend
go mod tidy
```

### 2. Environment Configuration

Copy the example environment file and configure it:

```bash
cp env.example .env
```

Edit `.env` with your configuration:

```env
# Server Configuration
PORT=8080
ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017
MONGODB_DATABASE=wms_db

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRY=24h

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001

# Logging
LOG_LEVEL=debug
```

### 3. Start MongoDB

**Local MongoDB:**
```bash
# Start MongoDB service
sudo systemctl start mongod

# Or using Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

### 4. Seed Database

```bash
make db-seed
```

This creates default users:
- **Admin**: `admin/admin123`
- **Manager**: `manager/manager123`
- **Worker**: `worker/worker123`

### 5. Run the Application

**Development mode:**
```bash
make run
```

**Production build:**
```bash
make build
./bin/wms-backend
```

**With hot reload (requires air):**
```bash
make install-tools
make dev
```

## API Endpoints

### Authentication

- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/refresh` - Refresh JWT token
- `GET /api/v1/profile` - Get user profile (protected)

### Health Check

- `GET /health` - Application health status

## API Usage Examples

### Login

```bash
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }'
```

### Get Profile (with authentication)

```bash
curl -X GET http://localhost:8080/api/v1/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Project Structure

```
wms-backend/
├── cmd/
│   └── main.go              # Application entry point
├── internal/
│   ├── api/                 # HTTP handlers
│   │   └── auth.go         # Authentication endpoints
│   ├── auth/               # Authentication logic
│   │   ├── jwt.go          # JWT token management
│   │   └── password.go     # Password hashing
│   ├── config/             # Configuration management
│   │   └── config.go       # Environment configuration
│   ├── db/                 # Database layer
│   │   ├── connection.go   # MongoDB connection
│   │   └── models.go       # Data models
│   └── middleware/         # HTTP middleware
│       ├── auth.go         # Authentication middleware
│       └── cors.go         # CORS middleware
├── scripts/
│   └── seed.go             # Database seeding
├── Dockerfile              # Docker configuration
├── Makefile                # Build and development commands
├── go.mod                  # Go module dependencies
└── README.md               # This file
```

## Development

### Available Make Commands

```bash
make help                    # Show all available commands
make deps                    # Install dependencies
make build                   # Build the application
make run                     # Run the application
make dev                     # Run with hot reload
make test                    # Run tests
make test-coverage           # Run tests with coverage
make clean                   # Clean build artifacts
make docker-build            # Build Docker image
make docker-run              # Run Docker container
make db-seed                 # Seed database
make lint                    # Run linter
make format                  # Format code
```

### Adding New Endpoints

1. Create handler functions in `internal/api/`
2. Add routes in `cmd/main.go`
3. Add middleware for authentication/authorization as needed
4. Update models in `internal/db/models.go` if needed

### Database Migrations

The application uses MongoDB which is schema-less, but you can:

1. Add new fields to models in `internal/db/models.go`
2. Update the seeding script in `scripts/seed.go`
3. Create migration scripts if needed for data transformation

## Docker Deployment

### Build Image

```bash
make docker-build
```

### Run Container

```bash
make docker-run
```

### Docker Compose (recommended for development)

Create a `docker-compose.yml`:

```yaml
version: '3.8'
services:
  mongodb:
    image: mongo:latest
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db
    environment:
      MONGO_INITDB_DATABASE: wms_db

  wms-backend:
    build: .
    ports:
      - "8080:8080"
    depends_on:
      - mongodb
    environment:
      MONGODB_URI: mongodb://mongodb:27017
      MONGODB_DATABASE: wms_db
      JWT_SECRET: your-secret-key
      ALLOWED_ORIGINS: http://localhost:3000

volumes:
  mongodb_data:
```

Run with:
```bash
docker-compose up -d
```

## Testing

```bash
# Run all tests
make test

# Run tests with coverage
make test-coverage

# Run specific test file
go test ./internal/api -v
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `8080` |
| `ENV` | Environment (development/production) | `development` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017` |
| `MONGODB_DATABASE` | Database name | `wms_db` |
| `JWT_SECRET` | JWT signing secret | `your-super-secret-jwt-key-change-in-production` |
| `JWT_EXPIRY` | JWT token expiry | `24h` |
| `ALLOWED_ORIGINS` | CORS allowed origins | `http://localhost:3000` |
| `LOG_LEVEL` | Logging level | `debug` |

## Security Considerations

- Change the default JWT secret in production
- Use HTTPS in production
- Implement rate limiting for API endpoints
- Add input validation and sanitization
- Use environment variables for sensitive data
- Regularly update dependencies

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run tests and ensure they pass
6. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For questions or issues, please contact the development team or create an issue in the repository. 