package api

import (
	"context"
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"wms-backend/internal/auth"
	"wms-backend/internal/db"
)

// ListUsers returns a paginated list of users
func ListUsers(c *gin.Context) {
	page := 1
	limit := 20
	if p := c.Query("page"); p != "" {
		fmt.Sscanf(p, "%d", &page)
	}
	if l := c.Query("limit"); l != "" {
		fmt.Sscanf(l, "%d", &limit)
	}
	_ = (page - 1) * limit // skip variable for future pagination implementation

	filter := bson.M{}
	cur, err := db.UsersCollection.Find(context.Background(), filter, nil)
	if err != nil {
		c.JSON(http.StatusInternalServerError, db.ApiResponse{Success: false, Message: "Failed to fetch users"})
		return
	}
	defer cur.Close(context.Background())

	var users []db.User
	for cur.Next(context.Background()) {
		var user db.User
		if err := cur.Decode(&user); err == nil {
			users = append(users, user)
		}
	}

	c.JSON(http.StatusOK, db.PaginatedResponse{
		Data: users,
		Pagination: db.Pagination{
			Page:  page,
			Limit: limit,
			Total: len(users),
			TotalPages: 1, // TODO: implement real pagination
		},
	})
}

// GetUser returns a user by ID
func GetUser(c *gin.Context) {
	id := c.Param("id")
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, db.ApiResponse{Success: false, Message: "Invalid user ID"})
		return
	}
	var user db.User
	err = db.UsersCollection.FindOne(context.Background(), bson.M{"_id": objectID}).Decode(&user)
	if err != nil {
		c.JSON(http.StatusNotFound, db.ApiResponse{Success: false, Message: "User not found"})
		return
	}
	c.JSON(http.StatusOK, db.ApiResponse{Success: true, Data: user, Message: "User found"})
}

// CreateUser creates a new user
func CreateUser(c *gin.Context) {
	var req struct {
		Username    string   `json:"username" binding:"required"`
		Email       string   `json:"email" binding:"required,email"`
		Password    string   `json:"password" binding:"required"`
		FirstName   string   `json:"firstName" binding:"required"`
		LastName    string   `json:"lastName" binding:"required"`
		RoleNames   []string `json:"roles" binding:"required"`
		IsActive    bool     `json:"isActive"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, db.ApiResponse{Success: false, Message: "Invalid request", Errors: []string{err.Error()}})
		return
	}

	// Validate password strength
	if err := auth.ValidatePasswordStrength(req.Password); err != nil {
		c.JSON(http.StatusBadRequest, db.ApiResponse{Success: false, Message: "Password validation failed", Errors: []string{err.Error()}})
		return
	}

	// Check for unique username/email
	var existing db.User
	err := db.UsersCollection.FindOne(context.Background(), bson.M{"username": req.Username}).Decode(&existing)
	if err == nil {
		c.JSON(http.StatusConflict, db.ApiResponse{Success: false, Message: "Username already exists"})
		return
	}
	err = db.UsersCollection.FindOne(context.Background(), bson.M{"email": req.Email}).Decode(&existing)
	if err == nil {
		c.JSON(http.StatusConflict, db.ApiResponse{Success: false, Message: "Email already exists"})
		return
	}

	// Hash password
	hash, err := auth.HashPassword(req.Password)
	if err != nil {
		c.JSON(http.StatusInternalServerError, db.ApiResponse{Success: false, Message: "Failed to hash password"})
		return
	}

	// Lookup roles
	var roles []db.UserRole
	for _, roleName := range req.RoleNames {
		var role db.UserRole
		err := db.UserRolesCollection.FindOne(context.Background(), bson.M{"name": roleName}).Decode(&role)
		if err != nil {
			c.JSON(http.StatusBadRequest, db.ApiResponse{Success: false, Message: "Role not found: " + roleName})
			return
		}
		roles = append(roles, role)
	}

	now := time.Now()
	user := db.User{
		ID:          primitive.NewObjectID(),
		Username:    req.Username,
		Email:       req.Email,
		Password:    hash,
		FirstName:   req.FirstName,
		LastName:    req.LastName,
		Roles:       roles,
		IsActive:    req.IsActive,
		CreatedAt:   now,
		UpdatedAt:   now,
	}
	_, err = db.UsersCollection.InsertOne(context.Background(), user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, db.ApiResponse{Success: false, Message: "Failed to create user"})
		return
	}
	c.JSON(http.StatusCreated, db.ApiResponse{Success: true, Data: user, Message: "User created"})
}

// UpdateUser updates a user
func UpdateUser(c *gin.Context) {
	id := c.Param("id")
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, db.ApiResponse{Success: false, Message: "Invalid user ID"})
		return
	}
	var req struct {
		Email       string   `json:"email" binding:"required,email"`
		FirstName   string   `json:"firstName" binding:"required"`
		LastName    string   `json:"lastName" binding:"required"`
		Password    string   `json:"password"`
		RoleNames   []string `json:"roles"`
		IsActive    bool     `json:"isActive"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, db.ApiResponse{Success: false, Message: "Invalid request", Errors: []string{err.Error()}})
		return
	}

	// Check for unique email (if changed)
	var existing db.User
	err = db.UsersCollection.FindOne(context.Background(), bson.M{"email": req.Email, "_id": bson.M{"$ne": objectID}}).Decode(&existing)
	if err == nil {
		c.JSON(http.StatusConflict, db.ApiResponse{Success: false, Message: "Email already exists"})
		return
	}

	update := bson.M{
		"email":     req.Email,
		"firstName": req.FirstName,
		"lastName":  req.LastName,
		"isActive":  req.IsActive,
		"updatedAt": time.Now(),
	}

	// Update password if provided
	if req.Password != "" {
		if err := auth.ValidatePasswordStrength(req.Password); err != nil {
			c.JSON(http.StatusBadRequest, db.ApiResponse{Success: false, Message: "Password validation failed", Errors: []string{err.Error()}})
			return
		}
		hash, err := auth.HashPassword(req.Password)
		if err != nil {
			c.JSON(http.StatusInternalServerError, db.ApiResponse{Success: false, Message: "Failed to hash password"})
			return
		}
		update["password"] = hash
	}

	// Update roles if provided
	if req.RoleNames != nil {
		var roles []db.UserRole
		for _, roleName := range req.RoleNames {
			var role db.UserRole
			err := db.UserRolesCollection.FindOne(context.Background(), bson.M{"name": roleName}).Decode(&role)
			if err != nil {
				c.JSON(http.StatusBadRequest, db.ApiResponse{Success: false, Message: "Role not found: " + roleName})
				return
			}
			roles = append(roles, role)
		}
		update["roles"] = roles
	}

	_, err = db.UsersCollection.UpdateOne(context.Background(), bson.M{"_id": objectID}, bson.M{"$set": update})
	if err != nil {
		c.JSON(http.StatusInternalServerError, db.ApiResponse{Success: false, Message: "Failed to update user"})
		return
	}
	c.JSON(http.StatusOK, db.ApiResponse{Success: true, Message: "User updated"})
}

// DeleteUser deletes a user
func DeleteUser(c *gin.Context) {
	id := c.Param("id")
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, db.ApiResponse{Success: false, Message: "Invalid user ID"})
		return
	}
	_, err = db.UsersCollection.DeleteOne(context.Background(), bson.M{"_id": objectID})
	if err != nil {
		c.JSON(http.StatusInternalServerError, db.ApiResponse{Success: false, Message: "Failed to delete user"})
		return
	}
	c.JSON(http.StatusOK, db.ApiResponse{Success: true, Message: "User deleted"})
}



// UpdateProfile updates the current user's profile
func UpdateProfile(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, db.ApiResponse{Success: false, Message: "Unauthorized"})
		return
	}
	objectID, err := primitive.ObjectIDFromHex(userID.(string))
	if err != nil {
		c.JSON(http.StatusBadRequest, db.ApiResponse{Success: false, Message: "Invalid user ID"})
		return
	}
	var req struct {
		Email     string `json:"email" binding:"required,email"`
		FirstName string `json:"firstName" binding:"required"`
		LastName  string `json:"lastName" binding:"required"`
		Password  string `json:"password"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, db.ApiResponse{Success: false, Message: "Invalid request", Errors: []string{err.Error()}})
		return
	}

	update := bson.M{
		"email":     req.Email,
		"firstName": req.FirstName,
		"lastName":  req.LastName,
		"updatedAt": time.Now(),
	}
	if req.Password != "" {
		if err := auth.ValidatePasswordStrength(req.Password); err != nil {
			c.JSON(http.StatusBadRequest, db.ApiResponse{Success: false, Message: "Password validation failed", Errors: []string{err.Error()}})
			return
		}
		hash, err := auth.HashPassword(req.Password)
		if err != nil {
			c.JSON(http.StatusInternalServerError, db.ApiResponse{Success: false, Message: "Failed to hash password"})
			return
		}
		update["password"] = hash
	}
	_, err = db.UsersCollection.UpdateOne(context.Background(), bson.M{"_id": objectID}, bson.M{"$set": update})
	if err != nil {
		c.JSON(http.StatusInternalServerError, db.ApiResponse{Success: false, Message: "Failed to update profile"})
		return
	}
	c.JSON(http.StatusOK, db.ApiResponse{Success: true, Message: "Profile updated"})
} 