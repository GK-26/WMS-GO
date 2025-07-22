package services

import (
	"context"
	"strings"

	"go.mongodb.org/mongo-driver/bson/primitive"
	"wms-backend/internal/domain/entities"
	"wms-backend/internal/domain/errors"
	"wms-backend/internal/domain/repositories"
	"wms-backend/internal/infrastructure/logger"
	"wms-backend/internal/auth"
)

type UserService interface {
	CreateUser(ctx context.Context, req CreateUserRequest) (*entities.User, error)
	GetUserByID(ctx context.Context, id primitive.ObjectID) (*entities.User, error)
	GetUserByUsername(ctx context.Context, username string) (*entities.User, error)
	UpdateUser(ctx context.Context, id primitive.ObjectID, req UpdateUserRequest) (*entities.User, error)
	DeleteUser(ctx context.Context, id primitive.ObjectID) error
	ListUsers(ctx context.Context, limit, offset int) ([]*entities.User, error)
	AuthenticateUser(ctx context.Context, username, password string) (*entities.User, error)
	UpdateLastLogin(ctx context.Context, userID primitive.ObjectID) error
}

type userService struct {
	userRepo repositories.UserRepository
	logger   logger.Logger
}

func NewUserService(userRepo repositories.UserRepository, logger logger.Logger) UserService {
	return &userService{
		userRepo: userRepo,
		logger:   logger,
	}
}

type CreateUserRequest struct {
	Username  string   `json:"username" validate:"required,min=3,max=50"`
	Email     string   `json:"email" validate:"required,email"`
	Password  string   `json:"password" validate:"required,min=8"`
	FirstName string   `json:"firstName" validate:"required,min=1,max=50"`
	LastName  string   `json:"lastName" validate:"required,min=1,max=50"`
	Roles     []string `json:"roles"`
}

type UpdateUserRequest struct {
	Email     *string  `json:"email,omitempty" validate:"omitempty,email"`
	FirstName *string  `json:"firstName,omitempty" validate:"omitempty,min=1,max=50"`
	LastName  *string  `json:"lastName,omitempty" validate:"omitempty,min=1,max=50"`
	Roles     []string `json:"roles,omitempty"`
	IsActive  *bool    `json:"isActive,omitempty"`
}

func (s *userService) CreateUser(ctx context.Context, req CreateUserRequest) (*entities.User, error) {
	s.logger.Info(ctx, "Creating new user", "username", req.Username)

	// Validate input
	if err := s.validateCreateUserRequest(req); err != nil {
		return nil, err
	}

	// Check if username already exists
	existingUser, err := s.userRepo.GetByUsername(ctx, req.Username)
	if err != nil {
		s.logger.ErrorWithErr(ctx, "Failed to check existing username", err)
		return nil, errors.NewDatabaseError("user creation")
	}
	if existingUser != nil {
		return nil, errors.NewUsernameExistsError()
	}

	// Check if email already exists
	existingUser, err = s.userRepo.GetByEmail(ctx, req.Email)
	if err != nil {
		s.logger.ErrorWithErr(ctx, "Failed to check existing email", err)
		return nil, errors.NewDatabaseError("user creation")
	}
	if existingUser != nil {
		return nil, errors.NewEmailExistsError()
	}

	// Hash password
	hashedPassword, err := auth.HashPassword(req.Password)
	if err != nil {
		s.logger.ErrorWithErr(ctx, "Failed to hash password", err)
		return nil, errors.NewInternalError("Password processing failed")
	}

	// Set default roles if none provided
	roles := req.Roles
	if len(roles) == 0 {
		roles = []string{"worker"}
	}

	// Create user entity
	user := &entities.User{
		Username:  req.Username,
		Email:     req.Email,
		Password:  hashedPassword,
		FirstName: req.FirstName,
		LastName:  req.LastName,
		Roles:     roles,
		IsActive:  true,
	}

	// Save to database
	if err := s.userRepo.Create(ctx, user); err != nil {
		s.logger.ErrorWithErr(ctx, "Failed to create user", err)
		return nil, errors.NewDatabaseError("user creation")
	}

	s.logger.Info(ctx, "User created successfully", "user_id", user.ID.Hex())
	return user, nil
}

func (s *userService) GetUserByID(ctx context.Context, id primitive.ObjectID) (*entities.User, error) {
	user, err := s.userRepo.GetByID(ctx, id)
	if err != nil {
		s.logger.ErrorWithErr(ctx, "Failed to get user by ID", err)
		return nil, errors.NewDatabaseError("user retrieval")
	}
	if user == nil {
		return nil, errors.NewUserNotFoundError()
	}
	return user, nil
}

func (s *userService) GetUserByUsername(ctx context.Context, username string) (*entities.User, error) {
	user, err := s.userRepo.GetByUsername(ctx, username)
	if err != nil {
		s.logger.ErrorWithErr(ctx, "Failed to get user by username", err)
		return nil, errors.NewDatabaseError("user retrieval")
	}
	if user == nil {
		return nil, errors.NewUserNotFoundError()
	}
	return user, nil
}

func (s *userService) UpdateUser(ctx context.Context, id primitive.ObjectID, req UpdateUserRequest) (*entities.User, error) {
	s.logger.Info(ctx, "Updating user", "user_id", id.Hex())

	// Get existing user
	user, err := s.GetUserByID(ctx, id)
	if err != nil {
		return nil, err
	}

	// Update fields if provided
	if req.Email != nil {
		// Check if email is already taken by another user
		existingUser, err := s.userRepo.GetByEmail(ctx, *req.Email)
		if err != nil {
			s.logger.ErrorWithErr(ctx, "Failed to check existing email", err)
			return nil, errors.NewDatabaseError("user update")
		}
		if existingUser != nil && existingUser.ID != id {
			return nil, errors.NewEmailExistsError()
		}
		user.Email = *req.Email
	}

	if req.FirstName != nil {
		user.FirstName = *req.FirstName
	}

	if req.LastName != nil {
		user.LastName = *req.LastName
	}

	if req.Roles != nil {
		user.Roles = req.Roles
	}

	if req.IsActive != nil {
		user.IsActive = *req.IsActive
	}

	// Save updated user
	if err := s.userRepo.Update(ctx, user); err != nil {
		s.logger.ErrorWithErr(ctx, "Failed to update user", err)
		return nil, errors.NewDatabaseError("user update")
	}

	s.logger.Info(ctx, "User updated successfully", "user_id", id.Hex())
	return user, nil
}

func (s *userService) DeleteUser(ctx context.Context, id primitive.ObjectID) error {
	s.logger.Info(ctx, "Deleting user", "user_id", id.Hex())

	// Check if user exists
	_, err := s.GetUserByID(ctx, id)
	if err != nil {
		return err
	}

	// Delete user
	if err := s.userRepo.Delete(ctx, id); err != nil {
		s.logger.ErrorWithErr(ctx, "Failed to delete user", err)
		return errors.NewDatabaseError("user deletion")
	}

	s.logger.Info(ctx, "User deleted successfully", "user_id", id.Hex())
	return nil
}

func (s *userService) ListUsers(ctx context.Context, limit, offset int) ([]*entities.User, error) {
	users, err := s.userRepo.List(ctx, limit, offset)
	if err != nil {
		s.logger.ErrorWithErr(ctx, "Failed to list users", err)
		return nil, errors.NewDatabaseError("user listing")
	}
	return users, nil
}

func (s *userService) AuthenticateUser(ctx context.Context, username, password string) (*entities.User, error) {
	s.logger.Info(ctx, "Authenticating user", "username", username)

	// Get user by username
	user, err := s.userRepo.GetByUsername(ctx, username)
	if err != nil {
		s.logger.ErrorWithErr(ctx, "Failed to get user for authentication", err)
		return nil, errors.NewDatabaseError("authentication")
	}
	if user == nil {
		return nil, errors.NewInvalidCredentialsError()
	}

	// Check if user is active
	if !user.IsActive {
		return nil, errors.NewUnauthorizedError("Account is deactivated")
	}

	// Verify password
	if !auth.CheckPassword(password, user.Password) {
		return nil, errors.NewInvalidCredentialsError()
	}

	s.logger.Info(ctx, "User authenticated successfully", "user_id", user.ID.Hex())
	return user, nil
}

func (s *userService) UpdateLastLogin(ctx context.Context, userID primitive.ObjectID) error {
	if err := s.userRepo.UpdateLastLogin(ctx, userID); err != nil {
		s.logger.ErrorWithErr(ctx, "Failed to update last login", err)
		// Don't return error as this is not critical
	}
	return nil
}

func (s *userService) validateCreateUserRequest(req CreateUserRequest) error {
	errorList := errors.NewErrorList()

	// Username validation
	if strings.TrimSpace(req.Username) == "" {
		errorList.Add(errors.NewRequiredFieldError("username"))
	} else if len(req.Username) < 3 || len(req.Username) > 50 {
		errorList.Add(errors.NewInvalidFieldError("username", "must be between 3 and 50 characters"))
	}

	// Email validation
	if strings.TrimSpace(req.Email) == "" {
		errorList.Add(errors.NewRequiredFieldError("email"))
	}

	// Password validation
	if err := auth.ValidatePasswordStrength(req.Password); err != nil {
		errorList.Add(errors.NewValidationError(err.Error(), "password"))
	}

	// First name validation
	if strings.TrimSpace(req.FirstName) == "" {
		errorList.Add(errors.NewRequiredFieldError("firstName"))
	}

	// Last name validation
	if strings.TrimSpace(req.LastName) == "" {
		errorList.Add(errors.NewRequiredFieldError("lastName"))
	}

	if errorList.HasErrors() {
		return errorList
	}

	return nil
}