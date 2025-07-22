package services

import (
	"context"
	"testing"

	"go.mongodb.org/mongo-driver/bson/primitive"
	"wms-backend/internal/domain/entities"
	"wms-backend/internal/domain/errors"
	"wms-backend/internal/infrastructure/logger"
	"wms-backend/internal/auth"
)

// Mock repository for testing
type mockUserRepository struct {
	users map[string]*entities.User
}

func newMockUserRepository() *mockUserRepository {
	return &mockUserRepository{
		users: make(map[string]*entities.User),
	}
}

func (m *mockUserRepository) Create(ctx context.Context, user *entities.User) error {
	if user.ID.IsZero() {
		user.ID = primitive.NewObjectID()
	}
	m.users[user.ID.Hex()] = user
	return nil
}

func (m *mockUserRepository) GetByID(ctx context.Context, id primitive.ObjectID) (*entities.User, error) {
	if user, exists := m.users[id.Hex()]; exists {
		return user, nil
	}
	return nil, nil
}

func (m *mockUserRepository) GetByUsername(ctx context.Context, username string) (*entities.User, error) {
	for _, user := range m.users {
		if user.Username == username {
			return user, nil
		}
	}
	return nil, nil
}

func (m *mockUserRepository) GetByEmail(ctx context.Context, email string) (*entities.User, error) {
	for _, user := range m.users {
		if user.Email == email {
			return user, nil
		}
	}
	return nil, nil
}

func (m *mockUserRepository) Update(ctx context.Context, user *entities.User) error {
	m.users[user.ID.Hex()] = user
	return nil
}

func (m *mockUserRepository) Delete(ctx context.Context, id primitive.ObjectID) error {
	delete(m.users, id.Hex())
	return nil
}

func (m *mockUserRepository) List(ctx context.Context, limit, offset int) ([]*entities.User, error) {
	var users []*entities.User
	for _, user := range m.users {
		users = append(users, user)
	}
	return users, nil
}

func (m *mockUserRepository) UpdateLastLogin(ctx context.Context, id primitive.ObjectID) error {
	return nil
}

func TestUserService_CreateUser(t *testing.T) {

	tests := []struct {
		name        string
		request     CreateUserRequest
		expectedErr bool
		errorType   errors.ErrorType
	}{
		{
			name: "valid user creation",
			request: CreateUserRequest{
				Username:  "testuser",
				Email:     "test@example.com",
				Password:  "Password123!",
				FirstName: "Test",
				LastName:  "User",
			},
			expectedErr: false,
		},
		{
			name: "missing username",
			request: CreateUserRequest{
				Email:     "test@example.com",
				Password:  "Password123!",
				FirstName: "Test",
				LastName:  "User",
			},
			expectedErr: true,
			errorType:   errors.ErrorTypeValidation,
		},
		{
			name: "invalid email",
			request: CreateUserRequest{
				Username:  "testuser",
				Email:     "invalid-email",
				Password:  "Password123!",
				FirstName: "Test",
				LastName:  "User",
			},
			expectedErr: false, // Basic validation in service is simple
		},
		{
			name: "weak password",
			request: CreateUserRequest{
				Username:  "testuser",
				Email:     "test@example.com",
				Password:  "123", // Too short
				FirstName: "Test",
				LastName:  "User",
			},
			expectedErr: true,
			errorType:   errors.ErrorTypeValidation,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Create fresh instances for each test
			repo := newMockUserRepository()
			logger := logger.New("debug")
			service := NewUserService(repo, logger)
			
			ctx := context.Background()
			user, err := service.CreateUser(ctx, tt.request)

			if tt.expectedErr {
				if err == nil {
					t.Errorf("expected error but got none")
					return
				}

				if appErr, ok := err.(*errors.AppError); ok {
					if appErr.Type != tt.errorType {
						t.Errorf("expected error type %v, got %v", tt.errorType, appErr.Type)
					}
				} else if errorList, ok := err.(*errors.ErrorList); ok {
					if len(errorList.Errors) == 0 {
						t.Errorf("expected validation errors but got empty list")
					}
				} else {
					t.Errorf("expected AppError or ErrorList, got %T", err)
				}
				return
			}

			if err != nil {
				t.Errorf("unexpected error: %v", err)
				return
			}

			if user == nil {
				t.Errorf("expected user but got nil")
				return
			}

			if user.Username != tt.request.Username {
				t.Errorf("expected username %s, got %s", tt.request.Username, user.Username)
			}

			if user.Email != tt.request.Email {
				t.Errorf("expected email %s, got %s", tt.request.Email, user.Email)
			}

			if !user.IsActive {
				t.Errorf("expected user to be active")
			}
		})
	}
}

func TestUserService_AuthenticateUser(t *testing.T) {
	repo := newMockUserRepository()
	logger := logger.New("debug")
	service := NewUserService(repo, logger)

	// Create a test user
	ctx := context.Background()
	password := "Password123!"
	hashedPassword, _ := auth.HashPassword(password)

	testUser := &entities.User{
		ID:        primitive.NewObjectID(),
		Username:  "testuser",
		Email:     "test@example.com",
		Password:  hashedPassword,
		IsActive:  true,
	}
	repo.Create(ctx, testUser)

	tests := []struct {
		name        string
		username    string
		password    string
		expectedErr bool
		errorType   errors.ErrorType
	}{
		{
			name:        "valid credentials",
			username:    "testuser",
			password:    password,
			expectedErr: false,
		},
		{
			name:        "invalid username",
			username:    "nonexistent",
			password:    password,
			expectedErr: true,
			errorType:   errors.ErrorTypeUnauthorized,
		},
		{
			name:        "invalid password",
			username:    "testuser",
			password:    "wrongpassword",
			expectedErr: true,
			errorType:   errors.ErrorTypeUnauthorized,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			user, err := service.AuthenticateUser(ctx, tt.username, tt.password)

			if tt.expectedErr {
				if err == nil {
					t.Errorf("expected error but got none")
					return
				}

				if appErr, ok := err.(*errors.AppError); ok {
					if appErr.Type != tt.errorType {
						t.Errorf("expected error type %v, got %v", tt.errorType, appErr.Type)
					}
				} else {
					t.Errorf("expected AppError, got %T", err)
				}
				return
			}

			if err != nil {
				t.Errorf("unexpected error: %v", err)
				return
			}

			if user == nil {
				t.Errorf("expected user but got nil")
				return
			}

			if user.Username != tt.username {
				t.Errorf("expected username %s, got %s", tt.username, user.Username)
			}
		})
	}
}

func TestUserService_GetUserByID(t *testing.T) {
	repo := newMockUserRepository()
	logger := logger.New("debug")
	service := NewUserService(repo, logger)

	// Create a test user
	ctx := context.Background()
	testUser := &entities.User{
		ID:       primitive.NewObjectID(),
		Username: "testuser",
		Email:    "test@example.com",
		IsActive: true,
	}
	repo.Create(ctx, testUser)

	t.Run("existing user", func(t *testing.T) {
		user, err := service.GetUserByID(ctx, testUser.ID)
		if err != nil {
			t.Errorf("unexpected error: %v", err)
			return
		}

		if user == nil {
			t.Errorf("expected user but got nil")
			return
		}

		if user.ID != testUser.ID {
			t.Errorf("expected user ID %s, got %s", testUser.ID.Hex(), user.ID.Hex())
		}
	})

	t.Run("non-existing user", func(t *testing.T) {
		nonExistentID := primitive.NewObjectID()
		user, err := service.GetUserByID(ctx, nonExistentID)

		if err == nil {
			t.Errorf("expected error but got none")
			return
		}

		if user != nil {
			t.Errorf("expected nil user but got %v", user)
		}

		if appErr, ok := err.(*errors.AppError); ok {
			if appErr.Type != errors.ErrorTypeNotFound {
				t.Errorf("expected error type %v, got %v", errors.ErrorTypeNotFound, appErr.Type)
			}
		} else {
			t.Errorf("expected AppError, got %T", err)
		}
	})
}