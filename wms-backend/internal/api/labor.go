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

// Labor Management APIs

// ListWorkers returns all workers with pagination
func ListWorkers(c *gin.Context) {
	ctx := context.Background()
	
	// Parse query parameters
	page := GetIntQuery(c, "page", 1)
	limit := GetIntQuery(c, "limit", 10)
	department := c.Query("department")
	isActive := c.Query("is_active")
	
	// Build filter
	filter := bson.M{}
	if department != "" {
		filter["department"] = department
	}
	if isActive != "" {
		filter["is_active"] = isActive == "true"
	}
	
	// Calculate skip
	skip := (page - 1) * limit
	
	// Find workers
	opts := options.Find().SetSkip(int64(skip)).SetLimit(int64(limit)).SetSort(bson.D{{Key: "last_name", Value: 1}, {Key: "first_name", Value: 1}})
	cursor, err := db.WorkersCollection.Find(ctx, filter, opts)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch workers"})
		return
	}
	defer cursor.Close(ctx)
	
	var workers []db.Worker
	if err = cursor.All(ctx, &workers); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to decode workers"})
		return
	}
	
	// Get total count
	total, err := db.WorkersCollection.CountDocuments(ctx, filter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to count workers"})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{
		"data": workers,
		"pagination": gin.H{
			"page":  page,
			"limit": limit,
			"total": total,
		},
	})
}

// GetWorker returns a single worker by ID
func GetWorker(c *gin.Context) {
	ctx := context.Background()
	
	id := c.Param("id")
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid worker ID"})
		return
	}
	
	var worker db.Worker
	err = db.WorkersCollection.FindOne(ctx, bson.M{"_id": objectID}).Decode(&worker)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Worker not found"})
		return
	}
	
	c.JSON(http.StatusOK, worker)
}

// CreateWorker creates a new worker
func CreateWorker(c *gin.Context) {
	ctx := context.Background()
	
	var req struct {
		EmployeeID  string   `json:"employee_id" binding:"required"`
		FirstName   string   `json:"first_name" binding:"required"`
		LastName    string   `json:"last_name" binding:"required"`
		Email       string   `json:"email" binding:"required,email"`
		Phone       string   `json:"phone"`
		Department  string   `json:"department" binding:"required"`
		Position    string   `json:"position" binding:"required"`
		HireDate    time.Time `json:"hire_date" binding:"required"`
		IsActive    bool     `json:"is_active"`
		Skills      []string `json:"skills"`
	}
	
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	
	now := time.Now()
	worker := db.Worker{
		ID:         primitive.NewObjectID(),
		EmployeeID: req.EmployeeID,
		FirstName:  req.FirstName,
		LastName:   req.LastName,
		Email:      req.Email,
		Phone:      req.Phone,
		Department: req.Department,
		Position:   req.Position,
		HireDate:   req.HireDate,
		IsActive:   req.IsActive,
		Skills:     req.Skills,
		CreatedAt:  now,
		UpdatedAt:  now,
	}
	
	_, err := db.WorkersCollection.InsertOne(ctx, worker)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create worker"})
		return
	}
	
	c.JSON(http.StatusCreated, worker)
}

// UpdateWorker updates an existing worker
func UpdateWorker(c *gin.Context) {
	ctx := context.Background()
	
	id := c.Param("id")
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid worker ID"})
		return
	}
	
	var req struct {
		EmployeeID  string   `json:"employee_id"`
		FirstName   string   `json:"first_name"`
		LastName    string   `json:"last_name"`
		Email       string   `json:"email"`
		Phone       string   `json:"phone"`
		Department  string   `json:"department"`
		Position    string   `json:"position"`
		HireDate    *time.Time `json:"hire_date"`
		IsActive    *bool     `json:"is_active"`
		Skills      []string  `json:"skills"`
	}
	
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	
	update := bson.M{
		"updated_at": time.Now(),
	}
	
	if req.EmployeeID != "" {
		update["employee_id"] = req.EmployeeID
	}
	if req.FirstName != "" {
		update["first_name"] = req.FirstName
	}
	if req.LastName != "" {
		update["last_name"] = req.LastName
	}
	if req.Email != "" {
		update["email"] = req.Email
	}
	if req.Phone != "" {
		update["phone"] = req.Phone
	}
	if req.Department != "" {
		update["department"] = req.Department
	}
	if req.Position != "" {
		update["position"] = req.Position
	}
	if req.HireDate != nil {
		update["hire_date"] = *req.HireDate
	}
	if req.IsActive != nil {
		update["is_active"] = *req.IsActive
	}
	if req.Skills != nil {
		update["skills"] = req.Skills
	}
	
	result := db.WorkersCollection.FindOneAndUpdate(
		ctx,
		bson.M{"_id": objectID},
		bson.M{"$set": update},
		options.FindOneAndUpdate().SetReturnDocument(options.After),
	)
	
	var worker db.Worker
	if err := result.Decode(&worker); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Worker not found"})
		return
	}
	
	c.JSON(http.StatusOK, worker)
}

// DeleteWorker deletes a worker
func DeleteWorker(c *gin.Context) {
	ctx := context.Background()
	
	id := c.Param("id")
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid worker ID"})
		return
	}
	
	result, err := db.WorkersCollection.DeleteOne(ctx, bson.M{"_id": objectID})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete worker"})
		return
	}
	
	if result.DeletedCount == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Worker not found"})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{"message": "Worker deleted successfully"})
}

// ListShifts returns all shifts with pagination
func ListShifts(c *gin.Context) {
	ctx := context.Background()
	
	// Parse query parameters
	page := GetIntQuery(c, "page", 1)
	limit := GetIntQuery(c, "limit", 10)
	workerID := c.Query("worker_id")
	status := c.Query("status")
	shiftType := c.Query("type")
	
	// Build filter
	filter := bson.M{}
	if workerID != "" {
		workerObjectID, err := primitive.ObjectIDFromHex(workerID)
		if err == nil {
			filter["worker_id"] = workerObjectID
		}
	}
	if status != "" {
		filter["status"] = status
	}
	if shiftType != "" {
		filter["type"] = shiftType
	}
	
	// Calculate skip
	skip := (page - 1) * limit
	
	// Find shifts
	opts := options.Find().SetSkip(int64(skip)).SetLimit(int64(limit)).SetSort(bson.D{{Key: "start_time", Value: -1}})
	cursor, err := db.ShiftsCollection.Find(ctx, filter, opts)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch shifts"})
		return
	}
	defer cursor.Close(ctx)
	
	var shifts []db.Shift
	if err = cursor.All(ctx, &shifts); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to decode shifts"})
		return
	}
	
	// Get total count
	total, err := db.ShiftsCollection.CountDocuments(ctx, filter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to count shifts"})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{
		"data": shifts,
		"pagination": gin.H{
			"page":  page,
			"limit": limit,
			"total": total,
		},
	})
}

// GetShift returns a single shift by ID
func GetShift(c *gin.Context) {
	ctx := context.Background()
	
	id := c.Param("id")
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid shift ID"})
		return
	}
	
	var shift db.Shift
	err = db.ShiftsCollection.FindOne(ctx, bson.M{"_id": objectID}).Decode(&shift)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Shift not found"})
		return
	}
	
	c.JSON(http.StatusOK, shift)
}

// CreateShift creates a new shift
func CreateShift(c *gin.Context) {
	ctx := context.Background()
	
	var req struct {
		WorkerID  string    `json:"worker_id" binding:"required"`
		StartTime time.Time `json:"start_time" binding:"required"`
		EndTime   time.Time `json:"end_time" binding:"required"`
		Type      string    `json:"type" binding:"required"`
		Status    string    `json:"status"`
	}
	
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	
	// Validate worker ID
	workerID, err := primitive.ObjectIDFromHex(req.WorkerID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid worker ID"})
		return
	}
	
	// Set default status if not provided
	if req.Status == "" {
		req.Status = "scheduled"
	}
	
	now := time.Now()
	shift := db.Shift{
		ID:        primitive.NewObjectID(),
		WorkerID:  workerID,
		StartTime: req.StartTime,
		EndTime:   req.EndTime,
		Type:      req.Type,
		Status:    req.Status,
		CreatedAt: now,
		UpdatedAt: now,
	}
	
	_, err = db.ShiftsCollection.InsertOne(ctx, shift)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create shift"})
		return
	}
	
	c.JSON(http.StatusCreated, shift)
}

// UpdateShift updates an existing shift
func UpdateShift(c *gin.Context) {
	ctx := context.Background()
	
	id := c.Param("id")
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid shift ID"})
		return
	}
	
	var req struct {
		StartTime *time.Time `json:"start_time"`
		EndTime   *time.Time `json:"end_time"`
		Type      string     `json:"type"`
		Status    string     `json:"status"`
	}
	
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	
	update := bson.M{
		"updated_at": time.Now(),
	}
	
	if req.StartTime != nil {
		update["start_time"] = *req.StartTime
	}
	if req.EndTime != nil {
		update["end_time"] = *req.EndTime
	}
	if req.Type != "" {
		update["type"] = req.Type
	}
	if req.Status != "" {
		update["status"] = req.Status
	}
	
	result := db.ShiftsCollection.FindOneAndUpdate(
		ctx,
		bson.M{"_id": objectID},
		bson.M{"$set": update},
		options.FindOneAndUpdate().SetReturnDocument(options.After),
	)
	
	var shift db.Shift
	if err := result.Decode(&shift); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Shift not found"})
		return
	}
	
	c.JSON(http.StatusOK, shift)
}

// DeleteShift deletes a shift
func DeleteShift(c *gin.Context) {
	ctx := context.Background()
	
	id := c.Param("id")
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid shift ID"})
		return
	}
	
	result, err := db.ShiftsCollection.DeleteOne(ctx, bson.M{"_id": objectID})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete shift"})
		return
	}
	
	if result.DeletedCount == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Shift not found"})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{"message": "Shift deleted successfully"})
}

// ListPerformance returns all performance records with pagination
func ListPerformance(c *gin.Context) {
	ctx := context.Background()
	
	// Parse query parameters
	page := GetIntQuery(c, "page", 1)
	limit := GetIntQuery(c, "limit", 10)
	workerID := c.Query("worker_id")
	startDate := c.Query("start_date")
	endDate := c.Query("end_date")
	
	// Build filter
	filter := bson.M{}
	if workerID != "" {
		workerObjectID, err := primitive.ObjectIDFromHex(workerID)
		if err == nil {
			filter["worker_id"] = workerObjectID
		}
	}
	if startDate != "" && endDate != "" {
		start, err := time.Parse("2006-01-02", startDate)
		if err == nil {
			end, err := time.Parse("2006-01-02", endDate)
			if err == nil {
				filter["date"] = bson.M{
					"$gte": start,
					"$lte": end,
				}
			}
		}
	}
	
	// Calculate skip
	skip := (page - 1) * limit
	
	// Find performance records
	opts := options.Find().SetSkip(int64(skip)).SetLimit(int64(limit)).SetSort(bson.D{{Key: "date", Value: -1}})
	cursor, err := db.PerformanceCollection.Find(ctx, filter, opts)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch performance records"})
		return
	}
	defer cursor.Close(ctx)
	
	var performance []db.Performance
	if err = cursor.All(ctx, &performance); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to decode performance records"})
		return
	}
	
	// Get total count
	total, err := db.PerformanceCollection.CountDocuments(ctx, filter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to count performance records"})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{
		"data": performance,
		"pagination": gin.H{
			"page":  page,
			"limit": limit,
			"total": total,
		},
	})
}

// GetPerformance returns a single performance record by ID
func GetPerformance(c *gin.Context) {
	ctx := context.Background()
	
	id := c.Param("id")
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid performance ID"})
		return
	}
	
	var performance db.Performance
	err = db.PerformanceCollection.FindOne(ctx, bson.M{"_id": objectID}).Decode(&performance)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Performance record not found"})
		return
	}
	
	c.JSON(http.StatusOK, performance)
}

// CreatePerformance creates a new performance record
func CreatePerformance(c *gin.Context) {
	ctx := context.Background()
	
	var req struct {
		WorkerID        string  `json:"worker_id" binding:"required"`
		Date            time.Time `json:"date" binding:"required"`
		TasksCompleted  int     `json:"tasks_completed"`
		HoursWorked     float64 `json:"hours_worked"`
		Efficiency      float64 `json:"efficiency"`
		Accuracy        float64 `json:"accuracy"`
	}
	
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	
	// Validate worker ID
	workerID, err := primitive.ObjectIDFromHex(req.WorkerID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid worker ID"})
		return
	}
	
	now := time.Now()
	performance := db.Performance{
		ID:             primitive.NewObjectID(),
		WorkerID:       workerID,
		Date:           req.Date,
		TasksCompleted: req.TasksCompleted,
		HoursWorked:    req.HoursWorked,
		Efficiency:     req.Efficiency,
		Accuracy:       req.Accuracy,
		CreatedAt:      now,
		UpdatedAt:      now,
	}
	
	_, err = db.PerformanceCollection.InsertOne(ctx, performance)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create performance record"})
		return
	}
	
	c.JSON(http.StatusCreated, performance)
}

// UpdatePerformance updates an existing performance record
func UpdatePerformance(c *gin.Context) {
	ctx := context.Background()
	
	id := c.Param("id")
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid performance ID"})
		return
	}
	
	var req struct {
		Date           *time.Time `json:"date"`
		TasksCompleted *int       `json:"tasks_completed"`
		HoursWorked    *float64   `json:"hours_worked"`
		Efficiency     *float64   `json:"efficiency"`
		Accuracy       *float64   `json:"accuracy"`
	}
	
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	
	update := bson.M{
		"updated_at": time.Now(),
	}
	
	if req.Date != nil {
		update["date"] = *req.Date
	}
	if req.TasksCompleted != nil {
		update["tasks_completed"] = *req.TasksCompleted
	}
	if req.HoursWorked != nil {
		update["hours_worked"] = *req.HoursWorked
	}
	if req.Efficiency != nil {
		update["efficiency"] = *req.Efficiency
	}
	if req.Accuracy != nil {
		update["accuracy"] = *req.Accuracy
	}
	
	result := db.PerformanceCollection.FindOneAndUpdate(
		ctx,
		bson.M{"_id": objectID},
		bson.M{"$set": update},
		options.FindOneAndUpdate().SetReturnDocument(options.After),
	)
	
	var performance db.Performance
	if err := result.Decode(&performance); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Performance record not found"})
		return
	}
	
	c.JSON(http.StatusOK, performance)
}

// DeletePerformance deletes a performance record
func DeletePerformance(c *gin.Context) {
	ctx := context.Background()
	
	id := c.Param("id")
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid performance ID"})
		return
	}
	
	result, err := db.PerformanceCollection.DeleteOne(ctx, bson.M{"_id": objectID})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete performance record"})
		return
	}
	
	if result.DeletedCount == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Performance record not found"})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{"message": "Performance record deleted successfully"})
} 