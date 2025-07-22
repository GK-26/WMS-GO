package api

import (
	"context"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo/options"
	"wms-backend/internal/db"
)

// Automation & Integration APIs

// ListWorkflowRules returns all workflow rules with pagination
func ListWorkflowRules(c *gin.Context) {
	ctx := context.Background()
	
	// Parse query parameters
	page := GetIntQuery(c, "page", 1)
	limit := GetIntQuery(c, "limit", 10)
	trigger := c.Query("trigger")
	isActive := c.Query("is_active")
	
	// Build filter
	filter := bson.M{}
	if trigger != "" {
		filter["trigger"] = trigger
	}
	if isActive != "" {
		filter["is_active"] = isActive == "true"
	}
	
	// Calculate skip
	skip := (page - 1) * limit
	
	// Find workflow rules
	opts := options.Find().SetSkip(int64(skip)).SetLimit(int64(limit)).SetSort(bson.D{{Key: "created_at", Value: -1}})
	cursor, err := db.WorkflowRulesCollection.Find(ctx, filter, opts)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch workflow rules"})
		return
	}
	defer cursor.Close(ctx)
	
	var workflowRules []db.WorkflowRule
	if err = cursor.All(ctx, &workflowRules); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to decode workflow rules"})
		return
	}
	
	// Get total count
	total, err := db.WorkflowRulesCollection.CountDocuments(ctx, filter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to count workflow rules"})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{
		"data": workflowRules,
		"pagination": gin.H{
			"page":  page,
			"limit": limit,
			"total": total,
		},
	})
}

// GetWorkflowRule returns a single workflow rule by ID
func GetWorkflowRule(c *gin.Context) {
	ctx := context.Background()
	
	id := c.Param("id")
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid workflow rule ID"})
		return
	}
	
	var workflowRule db.WorkflowRule
	err = db.WorkflowRulesCollection.FindOne(ctx, bson.M{"_id": objectID}).Decode(&workflowRule)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Workflow rule not found"})
		return
	}
	
	c.JSON(http.StatusOK, workflowRule)
}

// CreateWorkflowRule creates a new workflow rule
func CreateWorkflowRule(c *gin.Context) {
	ctx := context.Background()
	
	var req struct {
		Name        string           `json:"name" binding:"required"`
		Description string           `json:"description"`
		Trigger     string           `json:"trigger" binding:"required"`
		Conditions  []db.Condition   `json:"conditions"`
		Actions     []db.Action      `json:"actions" binding:"required"`
		IsActive    bool             `json:"is_active"`
	}
	
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	
	now := time.Now()
	workflowRule := db.WorkflowRule{
		ID:          primitive.NewObjectID(),
		Name:        req.Name,
		Description: req.Description,
		Trigger:     req.Trigger,
		Conditions:  req.Conditions,
		Actions:     req.Actions,
		IsActive:    req.IsActive,
		CreatedAt:   now,
		UpdatedAt:   now,
	}
	
	_, err := db.WorkflowRulesCollection.InsertOne(ctx, workflowRule)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create workflow rule"})
		return
	}
	
	c.JSON(http.StatusCreated, workflowRule)
}

// UpdateWorkflowRule updates an existing workflow rule
func UpdateWorkflowRule(c *gin.Context) {
	ctx := context.Background()
	
	id := c.Param("id")
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid workflow rule ID"})
		return
	}
	
	var req struct {
		Name        string           `json:"name"`
		Description string           `json:"description"`
		Trigger     string           `json:"trigger"`
		Conditions  []db.Condition   `json:"conditions"`
		Actions     []db.Action      `json:"actions"`
		IsActive    *bool            `json:"is_active"`
	}
	
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	
	update := bson.M{
		"updated_at": time.Now(),
	}
	
	if req.Name != "" {
		update["name"] = req.Name
	}
	if req.Description != "" {
		update["description"] = req.Description
	}
	if req.Trigger != "" {
		update["trigger"] = req.Trigger
	}
	if req.Conditions != nil {
		update["conditions"] = req.Conditions
	}
	if req.Actions != nil {
		update["actions"] = req.Actions
	}
	if req.IsActive != nil {
		update["is_active"] = *req.IsActive
	}
	
	result := db.WorkflowRulesCollection.FindOneAndUpdate(
		ctx,
		bson.M{"_id": objectID},
		bson.M{"$set": update},
		options.FindOneAndUpdate().SetReturnDocument(options.After),
	)
	
	var workflowRule db.WorkflowRule
	if err := result.Decode(&workflowRule); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Workflow rule not found"})
		return
	}
	
	c.JSON(http.StatusOK, workflowRule)
}

// DeleteWorkflowRule deletes a workflow rule
func DeleteWorkflowRule(c *gin.Context) {
	ctx := context.Background()
	
	id := c.Param("id")
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid workflow rule ID"})
		return
	}
	
	result, err := db.WorkflowRulesCollection.DeleteOne(ctx, bson.M{"_id": objectID})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete workflow rule"})
		return
	}
	
	if result.DeletedCount == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Workflow rule not found"})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{"message": "Workflow rule deleted successfully"})
}

// ListIntegrations returns all integrations with pagination
func ListIntegrations(c *gin.Context) {
	ctx := context.Background()
	
	// Parse query parameters
	page := GetIntQuery(c, "page", 1)
	limit := GetIntQuery(c, "limit", 10)
	integrationType := c.Query("type")
	isActive := c.Query("is_active")
	
	// Build filter
	filter := bson.M{}
	if integrationType != "" {
		filter["type"] = integrationType
	}
	if isActive != "" {
		filter["is_active"] = isActive == "true"
	}
	
	// Calculate skip
	skip := (page - 1) * limit
	
	// Find integrations
	opts := options.Find().SetSkip(int64(skip)).SetLimit(int64(limit)).SetSort(bson.D{{Key: "name", Value: 1}})
	cursor, err := db.IntegrationsCollection.Find(ctx, filter, opts)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch integrations"})
		return
	}
	defer cursor.Close(ctx)
	
	var integrations []db.Integration
	if err = cursor.All(ctx, &integrations); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to decode integrations"})
		return
	}
	
	// Get total count
	total, err := db.IntegrationsCollection.CountDocuments(ctx, filter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to count integrations"})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{
		"data": integrations,
		"pagination": gin.H{
			"page":  page,
			"limit": limit,
			"total": total,
		},
	})
}

// GetIntegration returns a single integration by ID
func GetIntegration(c *gin.Context) {
	ctx := context.Background()
	
	id := c.Param("id")
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid integration ID"})
		return
	}
	
	var integration db.Integration
	err = db.IntegrationsCollection.FindOne(ctx, bson.M{"_id": objectID}).Decode(&integration)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Integration not found"})
		return
	}
	
	c.JSON(http.StatusOK, integration)
}

// CreateIntegration creates a new integration
func CreateIntegration(c *gin.Context) {
	ctx := context.Background()
	
	var req struct {
		Name     string            `json:"name" binding:"required"`
		Type     string            `json:"type" binding:"required"`
		Config   map[string]string `json:"config" binding:"required"`
		IsActive bool              `json:"is_active"`
	}
	
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	
	now := time.Now()
	integration := db.Integration{
		ID:        primitive.NewObjectID(),
		Name:      req.Name,
		Type:      req.Type,
		Config:    req.Config,
		IsActive:  req.IsActive,
		LastSync:  nil,
		CreatedAt: now,
		UpdatedAt: now,
	}
	
	_, err := db.IntegrationsCollection.InsertOne(ctx, integration)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create integration"})
		return
	}
	
	c.JSON(http.StatusCreated, integration)
}

// UpdateIntegration updates an existing integration
func UpdateIntegration(c *gin.Context) {
	ctx := context.Background()
	
	id := c.Param("id")
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid integration ID"})
		return
	}
	
	var req struct {
		Name     string            `json:"name"`
		Type     string            `json:"type"`
		Config   map[string]string `json:"config"`
		IsActive *bool             `json:"is_active"`
	}
	
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	
	update := bson.M{
		"updated_at": time.Now(),
	}
	
	if req.Name != "" {
		update["name"] = req.Name
	}
	if req.Type != "" {
		update["type"] = req.Type
	}
	if req.Config != nil {
		update["config"] = req.Config
	}
	if req.IsActive != nil {
		update["is_active"] = *req.IsActive
	}
	
	result := db.IntegrationsCollection.FindOneAndUpdate(
		ctx,
		bson.M{"_id": objectID},
		bson.M{"$set": update},
		options.FindOneAndUpdate().SetReturnDocument(options.After),
	)
	
	var integration db.Integration
	if err := result.Decode(&integration); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Integration not found"})
		return
	}
	
	c.JSON(http.StatusOK, integration)
}

// DeleteIntegration deletes an integration
func DeleteIntegration(c *gin.Context) {
	ctx := context.Background()
	
	id := c.Param("id")
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid integration ID"})
		return
	}
	
	result, err := db.IntegrationsCollection.DeleteOne(ctx, bson.M{"_id": objectID})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete integration"})
		return
	}
	
	if result.DeletedCount == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Integration not found"})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{"message": "Integration deleted successfully"})
}

// SyncIntegration triggers a sync for an integration
func SyncIntegration(c *gin.Context) {
	ctx := context.Background()
	
	id := c.Param("id")
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid integration ID"})
		return
	}
	
	// Update last sync time
	now := time.Now()
	update := bson.M{
		"last_sync":  now,
		"updated_at": now,
	}
	
	result := db.IntegrationsCollection.FindOneAndUpdate(
		ctx,
		bson.M{"_id": objectID},
		bson.M{"$set": update},
		options.FindOneAndUpdate().SetReturnDocument(options.After),
	)
	
	var integration db.Integration
	if err := result.Decode(&integration); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Integration not found"})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{
		"message": "Integration sync triggered successfully",
		"integration": integration,
	})
}

// ListSystemStatus returns all system status records with pagination
func ListSystemStatus(c *gin.Context) {
	ctx := context.Background()
	
	// Parse query parameters
	page := GetIntQuery(c, "page", 1)
	limit := GetIntQuery(c, "limit", 10)
	component := c.Query("component")
	status := c.Query("status")
	
	// Build filter
	filter := bson.M{}
	if component != "" {
		filter["component"] = component
	}
	if status != "" {
		filter["status"] = status
	}
	
	// Calculate skip
	skip := (page - 1) * limit
	
	// Find system status records
	opts := options.Find().SetSkip(int64(skip)).SetLimit(int64(limit)).SetSort(bson.D{{Key: "last_check", Value: -1}})
	cursor, err := db.SystemStatusCollection.Find(ctx, filter, opts)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch system status"})
		return
	}
	defer cursor.Close(ctx)
	
	var systemStatus []db.SystemStatus
	if err = cursor.All(ctx, &systemStatus); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to decode system status"})
		return
	}
	
	// Get total count
	total, err := db.SystemStatusCollection.CountDocuments(ctx, filter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to count system status"})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{
		"data": systemStatus,
		"pagination": gin.H{
			"page":  page,
			"limit": limit,
			"total": total,
		},
	})
}

// GetSystemStatus returns a single system status record by ID
func GetSystemStatus(c *gin.Context) {
	ctx := context.Background()
	
	id := c.Param("id")
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid system status ID"})
		return
	}
	
	var systemStatus db.SystemStatus
	err = db.SystemStatusCollection.FindOne(ctx, bson.M{"_id": objectID}).Decode(&systemStatus)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "System status not found"})
		return
	}
	
	c.JSON(http.StatusOK, systemStatus)
}

// CreateSystemStatus creates a new system status record
func CreateSystemStatus(c *gin.Context) {
	ctx := context.Background()
	
	var req struct {
		Component string `json:"component" binding:"required"`
		Status    string `json:"status" binding:"required"`
		Message   string `json:"message"`
	}
	
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	
	now := time.Now()
	systemStatus := db.SystemStatus{
		ID:        primitive.NewObjectID(),
		Component: req.Component,
		Status:    req.Status,
		Message:   req.Message,
		LastCheck: now,
		CreatedAt: now,
		UpdatedAt: now,
	}
	
	_, err := db.SystemStatusCollection.InsertOne(ctx, systemStatus)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create system status"})
		return
	}
	
	c.JSON(http.StatusCreated, systemStatus)
}

// UpdateSystemStatus updates an existing system status record
func UpdateSystemStatus(c *gin.Context) {
	ctx := context.Background()
	
	id := c.Param("id")
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid system status ID"})
		return
	}
	
	var req struct {
		Component string `json:"component"`
		Status    string `json:"status"`
		Message   string `json:"message"`
	}
	
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	
	now := time.Now()
	update := bson.M{
		"last_check": now,
		"updated_at": now,
	}
	
	if req.Component != "" {
		update["component"] = req.Component
	}
	if req.Status != "" {
		update["status"] = req.Status
	}
	if req.Message != "" {
		update["message"] = req.Message
	}
	
	result := db.SystemStatusCollection.FindOneAndUpdate(
		ctx,
		bson.M{"_id": objectID},
		bson.M{"$set": update},
		options.FindOneAndUpdate().SetReturnDocument(options.After),
	)
	
	var systemStatus db.SystemStatus
	if err := result.Decode(&systemStatus); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "System status not found"})
		return
	}
	
	c.JSON(http.StatusOK, systemStatus)
}

// DeleteSystemStatus deletes a system status record
func DeleteSystemStatus(c *gin.Context) {
	ctx := context.Background()
	
	id := c.Param("id")
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid system status ID"})
		return
	}
	
	result, err := db.SystemStatusCollection.DeleteOne(ctx, bson.M{"_id": objectID})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete system status"})
		return
	}
	
	if result.DeletedCount == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "System status not found"})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{"message": "System status deleted successfully"})
}

// GetSystemHealth returns overall system health status
func GetSystemHealth(c *gin.Context) {
	ctx := context.Background()
	
	// Get all system status records
	cursor, err := db.SystemStatusCollection.Find(ctx, bson.M{})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch system health"})
		return
	}
	defer cursor.Close(ctx)
	
	var systemStatus []db.SystemStatus
	if err = cursor.All(ctx, &systemStatus); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to decode system health"})
		return
	}
	
	// Calculate overall health
	healthy := 0
	warning := 0
	error := 0
	
	for _, status := range systemStatus {
		switch status.Status {
		case "healthy":
			healthy++
		case "warning":
			warning++
		case "error":
			error++
		}
	}
	
	total := len(systemStatus)
	overallStatus := "healthy"
	if error > 0 {
		overallStatus = "error"
	} else if warning > 0 {
		overallStatus = "warning"
	}
	
	c.JSON(http.StatusOK, gin.H{
		"overall_status": overallStatus,
		"components": gin.H{
			"total":    total,
			"healthy":  healthy,
			"warning":  warning,
			"error":    error,
		},
		"details": systemStatus,
	})
} 