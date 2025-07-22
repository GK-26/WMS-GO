package api

import (
	"context"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"wms-backend/internal/db"
)

// Task Management

// ListTasks returns all tasks with filtering options
func ListTasks(c *gin.Context) {
	filter := bson.M{}
	if taskType := c.Query("type"); taskType != "" {
		filter["type"] = taskType
	}
	if status := c.Query("status"); status != "" {
		filter["status"] = status
	}
	if priority := c.Query("priority"); priority != "" {
		filter["priority"] = priority
	}
	if assignedTo := c.Query("assignedTo"); assignedTo != "" {
		if objectID, err := primitive.ObjectIDFromHex(assignedTo); err == nil {
			filter["assignedTo"] = objectID
		}
	}

	cur, err := db.TasksCollection.Find(context.Background(), filter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, db.ApiResponse{Success: false, Message: "Failed to fetch tasks"})
		return
	}
	defer cur.Close(context.Background())

	var tasks []db.Task
	for cur.Next(context.Background()) {
		var task db.Task
		if err := cur.Decode(&task); err == nil {
			// Load assigned user details
			if task.AssignedTo != nil {
				var user db.User
				if err := db.UsersCollection.FindOne(context.Background(), bson.M{"_id": *task.AssignedTo}).Decode(&user); err == nil {
					task.AssignedToUser = &user
				}
			}

			// Load location details
			if task.LocationID != primitive.NilObjectID {
				var location db.Location
				if err := db.LocationsCollection.FindOne(context.Background(), bson.M{"_id": task.LocationID}).Decode(&location); err == nil {
					task.Location = &location
				}
			}

			// Load product details
			if task.ProductID != nil {
				var product db.Product
				if err := db.ProductsCollection.FindOne(context.Background(), bson.M{"_id": *task.ProductID}).Decode(&product); err == nil {
					task.Product = &product
				}
			}

			// Load order details
			if task.OrderID != nil {
				var order db.Order
				if err := db.OrdersCollection.FindOne(context.Background(), bson.M{"_id": *task.OrderID}).Decode(&order); err == nil {
					task.Order = &order
				}
			}

			tasks = append(tasks, task)
		}
	}

	c.JSON(http.StatusOK, db.ApiResponse{Success: true, Data: tasks, Message: "Tasks fetched"})
}

// GetTask returns a task by ID
func GetTask(c *gin.Context) {
	id := c.Param("id")
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, db.ApiResponse{Success: false, Message: "Invalid task ID"})
		return
	}

	var task db.Task
	err = db.TasksCollection.FindOne(context.Background(), bson.M{"_id": objectID}).Decode(&task)
	if err != nil {
		c.JSON(http.StatusNotFound, db.ApiResponse{Success: false, Message: "Task not found"})
		return
	}

	// Load related data
	if task.AssignedTo != nil {
		var user db.User
		if err := db.UsersCollection.FindOne(context.Background(), bson.M{"_id": *task.AssignedTo}).Decode(&user); err == nil {
			task.AssignedToUser = &user
		}
	}

	if task.LocationID != primitive.NilObjectID {
		var location db.Location
		if err := db.LocationsCollection.FindOne(context.Background(), bson.M{"_id": task.LocationID}).Decode(&location); err == nil {
			task.Location = &location
		}
	}

	if task.ProductID != nil {
		var product db.Product
		if err := db.ProductsCollection.FindOne(context.Background(), bson.M{"_id": *task.ProductID}).Decode(&product); err == nil {
			task.Product = &product
		}
	}

	if task.OrderID != nil {
		var order db.Order
		if err := db.OrdersCollection.FindOne(context.Background(), bson.M{"_id": *task.OrderID}).Decode(&order); err == nil {
			task.Order = &order
		}
	}

	c.JSON(http.StatusOK, db.ApiResponse{Success: true, Data: task, Message: "Task found"})
}

// CreateTask creates a new task
func CreateTask(c *gin.Context) {
	var req db.Task
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, db.ApiResponse{Success: false, Message: "Invalid request", Errors: []string{err.Error()}})
		return
	}

	// Validate location exists
	if req.LocationID != primitive.NilObjectID {
		var location db.Location
		err := db.LocationsCollection.FindOne(context.Background(), bson.M{"_id": req.LocationID}).Decode(&location)
		if err != nil {
			c.JSON(http.StatusBadRequest, db.ApiResponse{Success: false, Message: "Location not found"})
			return
		}
	}

	// Validate assigned user exists if provided
	if req.AssignedTo != nil {
		var user db.User
		err := db.UsersCollection.FindOne(context.Background(), bson.M{"_id": *req.AssignedTo}).Decode(&user)
		if err != nil {
			c.JSON(http.StatusBadRequest, db.ApiResponse{Success: false, Message: "Assigned user not found"})
			return
		}
	}

	req.ID = primitive.NewObjectID()
	req.Status = "pending"
	req.CreatedAt = time.Now()
	req.UpdatedAt = time.Now()

	_, err := db.TasksCollection.InsertOne(context.Background(), req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, db.ApiResponse{Success: false, Message: "Failed to create task"})
		return
	}

	c.JSON(http.StatusCreated, db.ApiResponse{Success: true, Data: req, Message: "Task created"})
}

// UpdateTask updates an existing task
func UpdateTask(c *gin.Context) {
	id := c.Param("id")
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, db.ApiResponse{Success: false, Message: "Invalid task ID"})
		return
	}

	var req db.Task
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, db.ApiResponse{Success: false, Message: "Invalid request", Errors: []string{err.Error()}})
		return
	}

	update := bson.M{
		"type":              req.Type,
		"status":            req.Status,
		"priority":          req.Priority,
		"assignedTo":        req.AssignedTo,
		"locationId":        req.LocationID,
		"productId":         req.ProductID,
		"quantity":          req.Quantity,
		"orderId":           req.OrderID,
		"estimatedDuration": req.EstimatedDuration,
		"actualDuration":    req.ActualDuration,
		"startedAt":         req.StartedAt,
		"completedAt":       req.CompletedAt,
		"updatedAt":         time.Now(),
	}

	_, err = db.TasksCollection.UpdateOne(context.Background(), bson.M{"_id": objectID}, bson.M{"$set": update})
	if err != nil {
		c.JSON(http.StatusInternalServerError, db.ApiResponse{Success: false, Message: "Failed to update task"})
		return
	}

	c.JSON(http.StatusOK, db.ApiResponse{Success: true, Message: "Task updated"})
}

// DeleteTask deletes a task
func DeleteTask(c *gin.Context) {
	id := c.Param("id")
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, db.ApiResponse{Success: false, Message: "Invalid task ID"})
		return
	}

	// Check if task can be deleted (not in progress)
	var task db.Task
	err = db.TasksCollection.FindOne(context.Background(), bson.M{"_id": objectID}).Decode(&task)
	if err != nil {
		c.JSON(http.StatusNotFound, db.ApiResponse{Success: false, Message: "Task not found"})
		return
	}

	if task.Status == "in_progress" || task.Status == "completed" {
		c.JSON(http.StatusConflict, db.ApiResponse{Success: false, Message: "Cannot delete task that is in progress or completed"})
		return
	}

	_, err = db.TasksCollection.DeleteOne(context.Background(), bson.M{"_id": objectID})
	if err != nil {
		c.JSON(http.StatusInternalServerError, db.ApiResponse{Success: false, Message: "Failed to delete task"})
		return
	}

	c.JSON(http.StatusOK, db.ApiResponse{Success: true, Message: "Task deleted"})
}

// AssignTask assigns a task to a user
func AssignTask(c *gin.Context) {
	taskID := c.Param("id")
	objectID, err := primitive.ObjectIDFromHex(taskID)
	if err != nil {
		c.JSON(http.StatusBadRequest, db.ApiResponse{Success: false, Message: "Invalid task ID"})
		return
	}

	var req struct {
		AssignedTo string `json:"assignedTo"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, db.ApiResponse{Success: false, Message: "Invalid request", Errors: []string{err.Error()}})
		return
	}

	userID, err := primitive.ObjectIDFromHex(req.AssignedTo)
	if err != nil {
		c.JSON(http.StatusBadRequest, db.ApiResponse{Success: false, Message: "Invalid user ID"})
		return
	}

	// Validate user exists
	var user db.User
	err = db.UsersCollection.FindOne(context.Background(), bson.M{"_id": userID}).Decode(&user)
	if err != nil {
		c.JSON(http.StatusBadRequest, db.ApiResponse{Success: false, Message: "User not found"})
		return
	}

	update := bson.M{
		"assignedTo": userID,
		"status":     "assigned",
		"updatedAt":  time.Now(),
	}

	_, err = db.TasksCollection.UpdateOne(context.Background(), bson.M{"_id": objectID}, bson.M{"$set": update})
	if err != nil {
		c.JSON(http.StatusInternalServerError, db.ApiResponse{Success: false, Message: "Failed to assign task"})
		return
	}

	c.JSON(http.StatusOK, db.ApiResponse{Success: true, Message: "Task assigned successfully"})
}

// StartTask starts a task
func StartTask(c *gin.Context) {
	taskID := c.Param("id")
	objectID, err := primitive.ObjectIDFromHex(taskID)
	if err != nil {
		c.JSON(http.StatusBadRequest, db.ApiResponse{Success: false, Message: "Invalid task ID"})
		return
	}

	now := time.Now()
	update := bson.M{
		"status":     "in_progress",
		"startedAt":  now,
		"updatedAt":  now,
	}

	_, err = db.TasksCollection.UpdateOne(context.Background(), bson.M{"_id": objectID}, bson.M{"$set": update})
	if err != nil {
		c.JSON(http.StatusInternalServerError, db.ApiResponse{Success: false, Message: "Failed to start task"})
		return
	}

	c.JSON(http.StatusOK, db.ApiResponse{Success: true, Message: "Task started successfully"})
}

// CompleteTask completes a task
func CompleteTask(c *gin.Context) {
	taskID := c.Param("id")
	objectID, err := primitive.ObjectIDFromHex(taskID)
	if err != nil {
		c.JSON(http.StatusBadRequest, db.ApiResponse{Success: false, Message: "Invalid task ID"})
		return
	}

	var req struct {
		ActualDuration int `json:"actualDuration"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, db.ApiResponse{Success: false, Message: "Invalid request", Errors: []string{err.Error()}})
		return
	}

	now := time.Now()
	update := bson.M{
		"status":         "completed",
		"completedAt":    now,
		"actualDuration": req.ActualDuration,
		"updatedAt":      now,
	}

	_, err = db.TasksCollection.UpdateOne(context.Background(), bson.M{"_id": objectID}, bson.M{"$set": update})
	if err != nil {
		c.JSON(http.StatusInternalServerError, db.ApiResponse{Success: false, Message: "Failed to complete task"})
		return
	}

	c.JSON(http.StatusOK, db.ApiResponse{Success: true, Message: "Task completed successfully"})
} 