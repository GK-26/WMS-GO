package api

import (
	"context"
	"log"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"wms-backend/internal/auth"
	"wms-backend/internal/db"
	"wms-backend/internal/domain/entities"
)

type LoginRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

type RegisterRequest struct {
	Username  string `json:"username" binding:"required"`
	Email     string `json:"email" binding:"required,email"`
	Password  string `json:"password" binding:"required"`
	FirstName string `json:"firstName" binding:"required"`
	LastName  string `json:"lastName" binding:"required"`
}

type AuthResponse struct {
	Token string    `json:"token"`
	User  *db.User  `json:"user"`
}

// Login handles user authentication
func Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, db.ApiResponse{
			Success: false,
			Message: "Invalid request data",
			Errors:  []string{err.Error()},
		})
		return
	}

	// Find user by username
	var user db.User
	err := db.UsersCollection.FindOne(context.Background(), bson.M{"username": req.Username}).Decode(&user)
	if err != nil {
		log.Printf("Login failed - user not found: %s, error: %v", req.Username, err)
		c.JSON(http.StatusUnauthorized, db.ApiResponse{
			Success: false,
			Message: "Invalid credentials",
		})
		return
	}
	
	log.Printf("Login attempt for user: %s, found user: %+v", req.Username, user.Username)

	// Check if user is active
	if !user.IsActive {
		c.JSON(http.StatusUnauthorized, db.ApiResponse{
			Success: false,
			Message: "Account is deactivated",
		})
		return
	}

	// Verify password
	if !auth.CheckPassword(req.Password, user.Password) {
		log.Printf("Login failed - invalid password for user: %s", req.Username)
		c.JSON(http.StatusUnauthorized, db.ApiResponse{
			Success: false,
			Message: "Invalid credentials",
		})
		return
	}
	
	log.Printf("Login successful for user: %s", req.Username)

	// Convert db.User to entities.User for JWT generation
	entityUser := &entities.User{
		ID:        user.ID,
		Username:  user.Username,
		Email:     user.Email,
		FirstName: user.FirstName,
		LastName:  user.LastName,
		Roles:     []string{}, // Convert from []UserRole to []string if needed
		IsActive:  user.IsActive,
		CreatedAt: user.CreatedAt,
		UpdatedAt: user.UpdatedAt,
	}

	// Extract role names if user has roles
	for _, role := range user.Roles {
		entityUser.Roles = append(entityUser.Roles, role.Name)
	}

	// Generate JWT token
	token, err := auth.GenerateToken(entityUser)
	if err != nil {
		c.JSON(http.StatusInternalServerError, db.ApiResponse{
			Success: false,
			Message: "Failed to generate token",
		})
		return
	}

	// Update last login
	now := time.Now()
	_, err = db.UsersCollection.UpdateOne(
		context.Background(),
		bson.M{"_id": user.ID},
		bson.M{"$set": bson.M{"lastLogin": now}},
	)
	if err != nil {
		// Log error but don't fail the login
		// In production, you might want to log this
	}

	// Return response
	c.JSON(http.StatusOK, db.ApiResponse{
		Success: true,
		Message: "Login successful",
		Data: AuthResponse{
			Token: token,
			User:  &user,
		},
	})
}

// Register handles user registration
func Register(c *gin.Context) {
	var req RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, db.ApiResponse{
			Success: false,
			Message: "Invalid request data",
			Errors:  []string{err.Error()},
		})
		return
	}

	// Validate password strength
	if err := auth.ValidatePasswordStrength(req.Password); err != nil {
		c.JSON(http.StatusBadRequest, db.ApiResponse{
			Success: false,
			Message: "Password validation failed",
			Errors:  []string{err.Error()},
		})
		return
	}

	// Check if username already exists
	var existingUser db.User
	err := db.UsersCollection.FindOne(context.Background(), bson.M{"username": req.Username}).Decode(&existingUser)
	if err == nil {
		c.JSON(http.StatusConflict, db.ApiResponse{
			Success: false,
			Message: "Username already exists",
		})
		return
	}

	// Check if email already exists
	err = db.UsersCollection.FindOne(context.Background(), bson.M{"email": req.Email}).Decode(&existingUser)
	if err == nil {
		c.JSON(http.StatusConflict, db.ApiResponse{
			Success: false,
			Message: "Email already exists",
		})
		return
	}

	// Hash password
	hashedPassword, err := auth.HashPassword(req.Password)
	if err != nil {
		c.JSON(http.StatusInternalServerError, db.ApiResponse{
			Success: false,
			Message: "Failed to process password",
		})
		return
	}

	// Create user
	now := time.Now()
	user := db.User{
		ID:        primitive.NewObjectID(),
		Username:  req.Username,
		Email:     req.Email,
		Password:  hashedPassword,
		FirstName: req.FirstName,
		LastName:  req.LastName,
		IsActive:  true,
		CreatedAt: now,
		UpdatedAt: now,
	}

	// Insert user into database
	_, err = db.UsersCollection.InsertOne(context.Background(), user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, db.ApiResponse{
			Success: false,
			Message: "Failed to create user",
		})
		return
	}

	// Convert db.User to entities.User for JWT generation
	entityUser := &entities.User{
		ID:        user.ID,
		Username:  user.Username,
		Email:     user.Email,
		FirstName: user.FirstName,
		LastName:  user.LastName,
		Roles:     []string{}, // New user has no roles initially
		IsActive:  user.IsActive,
		CreatedAt: user.CreatedAt,
		UpdatedAt: user.UpdatedAt,
	}

	// Generate JWT token
	token, err := auth.GenerateToken(entityUser)
	if err != nil {
		c.JSON(http.StatusInternalServerError, db.ApiResponse{
			Success: false,
			Message: "Failed to generate token",
		})
		return
	}

	c.JSON(http.StatusCreated, db.ApiResponse{
		Success: true,
		Message: "User registered successfully",
		Data: AuthResponse{
			Token: token,
			User:  &user,
		},
	})
}

// RefreshToken handles token refresh
func RefreshToken(c *gin.Context) {
	authHeader := c.GetHeader("Authorization")
	if authHeader == "" {
		c.JSON(http.StatusBadRequest, db.ApiResponse{
			Success: false,
			Message: "Authorization header required",
		})
		return
	}

	// Extract token from header
	tokenString := authHeader
	if len(authHeader) > 7 && authHeader[:7] == "Bearer " {
		tokenString = authHeader[7:]
	}

	// Refresh the token
	newToken, err := auth.RefreshToken(tokenString)
	if err != nil {
		c.JSON(http.StatusUnauthorized, db.ApiResponse{
			Success: false,
			Message: "Invalid or expired token",
		})
		return
	}

	c.JSON(http.StatusOK, db.ApiResponse{
		Success: true,
		Message: "Token refreshed successfully",
		Data: gin.H{
			"token": newToken,
		},
	})
}

// GetProfile returns the current user's profile
func GetProfile(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, db.ApiResponse{
			Success: false,
			Message: "User not authenticated",
		})
		return
	}

	// Convert string ID to ObjectID
	objectID, err := primitive.ObjectIDFromHex(userID.(string))
	if err != nil {
		c.JSON(http.StatusBadRequest, db.ApiResponse{
			Success: false,
			Message: "Invalid user ID",
		})
		return
	}

	// Find user
	var user db.User
	err = db.UsersCollection.FindOne(context.Background(), bson.M{"_id": objectID}).Decode(&user)
	if err != nil {
		c.JSON(http.StatusNotFound, db.ApiResponse{
			Success: false,
			Message: "User not found",
		})
		return
	}

	c.JSON(http.StatusOK, db.ApiResponse{
		Success: true,
		Message: "Profile retrieved successfully",
		Data:    &user,
	})
} 