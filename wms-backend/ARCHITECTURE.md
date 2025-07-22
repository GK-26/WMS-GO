# WMS Backend Architecture

## Overview

This WMS (Warehouse Management System) backend has been refactored to follow **Clean Architecture** principles with **Domain-Driven Design (DDD)** patterns. The architecture promotes separation of concerns, testability, and maintainability.

## Architecture Layers

```
┌─────────────────────────────────────────────────────────────┐
│                    Presentation Layer                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   Handlers  │  │ Middleware  │  │   Routes    │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│                    Application Layer                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │  Services   │  │ Validation  │  │   DTOs      │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│                      Domain Layer                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │  Entities   │  │ Interfaces  │  │   Errors    │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│                  Infrastructure Layer                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │ Repositories│  │  Database   │  │   Logger    │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
└─────────────────────────────────────────────────────────────┘
```

## Directory Structure

```
cmd/
├── server/                 # Application entry point
│   └── main.go            # Main application bootstrap
│
internal/
├── domain/                # Domain layer (business logic core)
│   ├── entities/          # Business entities with methods
│   ├── repositories/      # Repository interfaces
│   ├── services/         # Domain services interfaces
│   └── errors/           # Custom error types
│
├── infrastructure/       # Infrastructure layer
│   ├── database/         # Database connection and setup
│   ├── repositories/     # Concrete repository implementations
│   ├── http/            # HTTP transport layer
│   │   ├── handlers/    # HTTP handlers
│   │   └── routes/      # Route definitions
│   ├── logger/          # Logging implementation
│   ├── validation/      # Input validation
│   └── container/       # Dependency injection container
│
├── auth/                # Authentication utilities
├── config/              # Configuration management
└── middleware/          # HTTP middleware
```

## Key Architecture Principles

### 1. **Dependency Injection**
- Clean separation between layers
- Dependencies injected through constructor functions
- Container manages object lifecycle

### 2. **Repository Pattern**
- Abstracts data access layer
- Interface in domain, implementation in infrastructure
- Enables easy testing with mocks

### 3. **Service Layer**
- Contains business logic
- Orchestrates between repositories
- Handles domain rules and validation

### 4. **Entity-Driven Design**
- Rich domain models with behavior
- Business rules encapsulated in entities
- Value objects for complex types

### 5. **Error Handling**
- Custom error types with HTTP status mapping
- Structured error responses
- Error aggregation for validation

## Core Components

### Entities

Rich domain models that encapsulate business rules:

```go
type User struct {
    ID       primitive.ObjectID
    Username string
    Email    string
    Roles    []string
    // ... other fields
}

func (u *User) HasRole(role string) bool {
    // Business logic encapsulated in entity
}
```

### Repositories

Data access interfaces with concrete implementations:

```go
type UserRepository interface {
    Create(ctx context.Context, user *entities.User) error
    GetByID(ctx context.Context, id primitive.ObjectID) (*entities.User, error)
    // ... other methods
}
```

### Services

Business logic orchestration:

```go
type UserService interface {
    CreateUser(ctx context.Context, req CreateUserRequest) (*entities.User, error)
    AuthenticateUser(ctx context.Context, username, password string) (*entities.User, error)
    // ... other methods
}
```

### Handlers

HTTP transport layer:

```go
type UserHandler struct {
    userService services.UserService
    logger      logger.Logger
}
```

## Error Handling

Structured error system with proper HTTP status mapping:

```go
type AppError struct {
    Type    ErrorType `json:"type"`
    Message string    `json:"message"`
    Details string    `json:"details,omitempty"`
    Field   string    `json:"field,omitempty"`
}
```

## Logging

Structured logging with context support:

```go
logger.Info(ctx, "Creating user", "username", req.Username)
logger.ErrorWithErr(ctx, "Failed to create user", err)
```

## Testing Strategy

### Unit Tests
- Entity business logic
- Service layer validation
- Repository implementations (with mocks)

### Integration Tests
- Handler endpoints
- Database operations
- Authentication flow

### Test Structure
```go
func TestUserService_CreateUser(t *testing.T) {
    repo := newMockUserRepository()
    service := NewUserService(repo, logger)
    // Test implementation
}
```

## Configuration

Environment-based configuration with sensible defaults:

```go
type Config struct {
    Server   ServerConfig
    Database DatabaseConfig
    JWT      JWTConfig
    // ... other config sections
}
```

## Security Features

- **JWT Authentication**: Stateless token-based auth
- **Role-Based Access Control**: Middleware-based authorization
- **Password Security**: bcrypt hashing with strength validation
- **Input Validation**: Comprehensive request validation
- **Error Sanitization**: No sensitive data in error responses

## Performance Considerations

- **Database Indexing**: Optimized queries with proper indexes
- **Connection Pooling**: MongoDB connection management
- **Graceful Shutdown**: Clean resource cleanup
- **Request Timeouts**: Configurable timeout settings

## Development Workflow

1. **Domain First**: Start with entities and business rules
2. **Test-Driven**: Write tests before implementation
3. **Interface Design**: Define contracts before concrete types
4. **Dependency Injection**: Wire components through container

## Benefits of This Architecture

✅ **Testability**: Easy to mock dependencies and write unit tests
✅ **Maintainability**: Clear separation of concerns
✅ **Scalability**: Easy to add new features without breaking existing code
✅ **Flexibility**: Can swap implementations (e.g., database, logger)
✅ **Domain Focus**: Business logic is central and protected
✅ **Error Handling**: Consistent error management across the application

## Migration from Legacy Code

The refactoring addressed several issues from the original architecture:

- **Removed global variables**: Now using dependency injection
- **Separated concerns**: Business logic moved to service layer
- **Added proper testing**: Comprehensive test coverage
- **Improved error handling**: Structured error responses
- **Enhanced logging**: Structured logging with context
- **Fixed naming conventions**: Consistent across codebase

## Running the Application

```bash
# Install dependencies
make deps

# Run tests
make test

# Build application
make build

# Run in development mode
make run

# Run with coverage
make test-coverage
```

This architecture provides a solid foundation for building scalable, maintainable warehouse management systems while following Go best practices and clean architecture principles.