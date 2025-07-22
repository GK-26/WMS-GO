package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"wms-backend/internal/domain/errors"
	"wms-backend/internal/domain/services"
	"wms-backend/internal/infrastructure/logger"
	"wms-backend/internal/auth"
)

type UserHandler struct {
	userService services.UserService
	logger      logger.Logger
}

func NewUserHandler(userService services.UserService, logger logger.Logger) *UserHandler {
	return &UserHandler{
		userService: userService,
		logger:      logger,
	}
}

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
	Token string      `json:"token"`
	User  interface{} `json:"user"`
}

func (h *UserHandler) Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.respondWithError(c, errors.NewValidationError("Invalid request data", ""))
		return
	}

	// Authenticate user
	user, err := h.userService.AuthenticateUser(c.Request.Context(), req.Username, req.Password)
	if err != nil {
		h.respondWithError(c, err)
		return
	}

	// Generate JWT token
	token, err := auth.GenerateToken(user)
	if err != nil {
		h.logger.ErrorWithErr(c.Request.Context(), "Failed to generate token", err)
		h.respondWithError(c, errors.NewInternalError("Failed to generate token"))
		return
	}

	// Update last login
	_ = h.userService.UpdateLastLogin(c.Request.Context(), user.ID)

	h.respondWithSuccess(c, http.StatusOK, "Login successful", AuthResponse{
		Token: token,
		User:  user,
	})
}

func (h *UserHandler) Register(c *gin.Context) {
	var req RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.respondWithError(c, errors.NewValidationError("Invalid request data", ""))
		return
	}

	// Create user
	createReq := services.CreateUserRequest{
		Username:  req.Username,
		Email:     req.Email,
		Password:  req.Password,
		FirstName: req.FirstName,
		LastName:  req.LastName,
		Roles:     []string{"worker"}, // Default role
	}

	user, err := h.userService.CreateUser(c.Request.Context(), createReq)
	if err != nil {
		h.respondWithError(c, err)
		return
	}

	// Generate JWT token
	token, err := auth.GenerateToken(user)
	if err != nil {
		h.logger.ErrorWithErr(c.Request.Context(), "Failed to generate token", err)
		h.respondWithError(c, errors.NewInternalError("Failed to generate token"))
		return
	}

	h.respondWithSuccess(c, http.StatusCreated, "User registered successfully", AuthResponse{
		Token: token,
		User:  user,
	})
}

func (h *UserHandler) RefreshToken(c *gin.Context) {
	authHeader := c.GetHeader("Authorization")
	if authHeader == "" {
		h.respondWithError(c, errors.NewUnauthorizedError("Authorization header required"))
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
		h.respondWithError(c, errors.NewUnauthorizedError("Invalid or expired token"))
		return
	}

	h.respondWithSuccess(c, http.StatusOK, "Token refreshed successfully", gin.H{
		"token": newToken,
	})
}

func (h *UserHandler) GetProfile(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		h.respondWithError(c, errors.NewUnauthorizedError("User not authenticated"))
		return
	}

	// Convert string ID to ObjectID
	objectID, err := primitive.ObjectIDFromHex(userID.(string))
	if err != nil {
		h.respondWithError(c, errors.NewValidationError("Invalid user ID", "userID"))
		return
	}

	// Get user
	user, err := h.userService.GetUserByID(c.Request.Context(), objectID)
	if err != nil {
		h.respondWithError(c, err)
		return
	}

	h.respondWithSuccess(c, http.StatusOK, "Profile retrieved successfully", user)
}

func (h *UserHandler) ListUsers(c *gin.Context) {
	// Parse query parameters
	limitStr := c.DefaultQuery("limit", "20")
	offsetStr := c.DefaultQuery("offset", "0")

	limit, err := strconv.Atoi(limitStr)
	if err != nil || limit <= 0 {
		limit = 20
	}

	offset, err := strconv.Atoi(offsetStr)
	if err != nil || offset < 0 {
		offset = 0
	}

	// Get users
	users, err := h.userService.ListUsers(c.Request.Context(), limit, offset)
	if err != nil {
		h.respondWithError(c, err)
		return
	}

	h.respondWithSuccess(c, http.StatusOK, "Users retrieved successfully", users)
}

func (h *UserHandler) GetUser(c *gin.Context) {
	id, err := primitive.ObjectIDFromHex(c.Param("id"))
	if err != nil {
		h.respondWithError(c, errors.NewValidationError("Invalid user ID", "id"))
		return
	}

	user, err := h.userService.GetUserByID(c.Request.Context(), id)
	if err != nil {
		h.respondWithError(c, err)
		return
	}

	h.respondWithSuccess(c, http.StatusOK, "User retrieved successfully", user)
}

func (h *UserHandler) CreateUser(c *gin.Context) {
	var req services.CreateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.respondWithError(c, errors.NewValidationError("Invalid request data", ""))
		return
	}

	user, err := h.userService.CreateUser(c.Request.Context(), req)
	if err != nil {
		h.respondWithError(c, err)
		return
	}

	h.respondWithSuccess(c, http.StatusCreated, "User created successfully", user)
}

func (h *UserHandler) UpdateUser(c *gin.Context) {
	id, err := primitive.ObjectIDFromHex(c.Param("id"))
	if err != nil {
		h.respondWithError(c, errors.NewValidationError("Invalid user ID", "id"))
		return
	}

	var req services.UpdateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.respondWithError(c, errors.NewValidationError("Invalid request data", ""))
		return
	}

	user, err := h.userService.UpdateUser(c.Request.Context(), id, req)
	if err != nil {
		h.respondWithError(c, err)
		return
	}

	h.respondWithSuccess(c, http.StatusOK, "User updated successfully", user)
}

func (h *UserHandler) DeleteUser(c *gin.Context) {
	id, err := primitive.ObjectIDFromHex(c.Param("id"))
	if err != nil {
		h.respondWithError(c, errors.NewValidationError("Invalid user ID", "id"))
		return
	}

	err = h.userService.DeleteUser(c.Request.Context(), id)
	if err != nil {
		h.respondWithError(c, err)
		return
	}

	h.respondWithSuccess(c, http.StatusOK, "User deleted successfully", nil)
}

func (h *UserHandler) respondWithError(c *gin.Context, err error) {
	if appErr, ok := err.(*errors.AppError); ok {
		c.JSON(appErr.HTTPStatusCode(), gin.H{
			"success": false,
			"error":   appErr,
		})
		return
	}

	if errorList, ok := err.(*errors.ErrorList); ok {
		c.JSON(errorList.HTTPStatusCode(), gin.H{
			"success": false,
			"errors":  errorList.Errors,
		})
		return
	}

	// Unknown error
	h.logger.ErrorWithErr(c.Request.Context(), "Unknown error occurred", err)
	c.JSON(http.StatusInternalServerError, gin.H{
		"success": false,
		"error": gin.H{
			"type":    "INTERNAL_ERROR",
			"message": "An unexpected error occurred",
		},
	})
}

func (h *UserHandler) respondWithSuccess(c *gin.Context, statusCode int, message string, data interface{}) {
	response := gin.H{
		"success": true,
		"message": message,
	}

	if data != nil {
		response["data"] = data
	}

	c.JSON(statusCode, response)
}