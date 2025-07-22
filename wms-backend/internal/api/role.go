package api

import (
	"context"
	"net/http"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"wms-backend/internal/db"
)

// ListRoles returns all roles
func ListRoles(c *gin.Context) {
	cur, err := db.UserRolesCollection.Find(context.Background(), bson.M{}, nil)
	if err != nil {
		c.JSON(http.StatusInternalServerError, db.ApiResponse{Success: false, Message: "Failed to fetch roles"})
		return
	}
	defer cur.Close(context.Background())

	var roles []db.UserRole
	for cur.Next(context.Background()) {
		var role db.UserRole
		if err := cur.Decode(&role); err == nil {
			roles = append(roles, role)
		}
	}

	c.JSON(http.StatusOK, db.ApiResponse{Success: true, Data: roles, Message: "Roles fetched"})
}

// GetRole returns a role by ID
func GetRole(c *gin.Context) {
	id := c.Param("id")
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, db.ApiResponse{Success: false, Message: "Invalid role ID"})
		return
	}
	var role db.UserRole
	err = db.UserRolesCollection.FindOne(context.Background(), bson.M{"_id": objectID}).Decode(&role)
	if err != nil {
		c.JSON(http.StatusNotFound, db.ApiResponse{Success: false, Message: "Role not found"})
		return
	}
	c.JSON(http.StatusOK, db.ApiResponse{Success: true, Data: role, Message: "Role found"})
}

// CreateRole creates a new role (admin only)
func CreateRole(c *gin.Context) {
	var req db.UserRole
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, db.ApiResponse{Success: false, Message: "Invalid request", Errors: []string{err.Error()}})
		return
	}
	req.ID = primitive.NewObjectID()
	_, err := db.UserRolesCollection.InsertOne(context.Background(), req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, db.ApiResponse{Success: false, Message: "Failed to create role"})
		return
	}
	c.JSON(http.StatusCreated, db.ApiResponse{Success: true, Data: req, Message: "Role created"})
}

// UpdateRole updates an existing role (admin only)
func UpdateRole(c *gin.Context) {
	id := c.Param("id")
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, db.ApiResponse{Success: false, Message: "Invalid role ID"})
		return
	}
	var req db.UserRole
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, db.ApiResponse{Success: false, Message: "Invalid request", Errors: []string{err.Error()}})
		return
	}
	update := bson.M{
		"name": req.Name,
		"description": req.Description,
		"permissions": req.Permissions,
	}
	_, err = db.UserRolesCollection.UpdateOne(context.Background(), bson.M{"_id": objectID}, bson.M{"$set": update})
	if err != nil {
		c.JSON(http.StatusInternalServerError, db.ApiResponse{Success: false, Message: "Failed to update role"})
		return
	}
	c.JSON(http.StatusOK, db.ApiResponse{Success: true, Message: "Role updated"})
}

// DeleteRole deletes a role (admin only)
func DeleteRole(c *gin.Context) {
	id := c.Param("id")
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, db.ApiResponse{Success: false, Message: "Invalid role ID"})
		return
	}

	// Check if role is assigned to any users
	count, err := db.UsersCollection.CountDocuments(context.Background(), bson.M{"roles.id": objectID})
	if err != nil {
		c.JSON(http.StatusInternalServerError, db.ApiResponse{Success: false, Message: "Failed to check role dependencies"})
		return
	}

	if count > 0 {
		c.JSON(http.StatusConflict, db.ApiResponse{Success: false, Message: "Cannot delete role that is assigned to users"})
		return
	}

	// Delete role
	result, err := db.UserRolesCollection.DeleteOne(context.Background(), bson.M{"_id": objectID})
	if err != nil {
		c.JSON(http.StatusInternalServerError, db.ApiResponse{Success: false, Message: "Failed to delete role"})
		return
	}

	if result.DeletedCount == 0 {
		c.JSON(http.StatusNotFound, db.ApiResponse{Success: false, Message: "Role not found"})
		return
	}

	c.JSON(http.StatusOK, db.ApiResponse{Success: true, Message: "Role deleted successfully"})
} 