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

// Reports & Analytics

// GetDashboardData returns dashboard KPIs and summary data
func GetDashboardData(c *gin.Context) {
	ctx := context.Background()

	// Get basic counts
	totalProducts, _ := db.ProductsCollection.CountDocuments(ctx, bson.M{})
	totalOrders, _ := db.OrdersCollection.CountDocuments(ctx, bson.M{})
	totalTasks, _ := db.TasksCollection.CountDocuments(ctx, bson.M{})
	pendingTasks, _ := db.TasksCollection.CountDocuments(ctx, bson.M{"status": "pending"})

	// Get inventory summary
	var inventoryItems []db.InventoryItem
	cur, err := db.InventoryItemsCollection.Find(ctx, bson.M{})
	if err == nil {
		cur.All(ctx, &inventoryItems)
	}

	totalInventoryValue := 0.0
	totalQuantity := 0
	for _, item := range inventoryItems {
		totalQuantity += item.Quantity
		// TODO: Calculate value based on product price
	}

	// Get recent activities
	var activities []db.Activity
	cur, err = db.ActivitiesCollection.Find(ctx, bson.M{})
	if err == nil {
		cur.All(ctx, &activities)
	}

	// Get unread alerts
	var alerts []db.Alert
	cur, err = db.AlertsCollection.Find(ctx, bson.M{"isRead": false})
	if err == nil {
		cur.All(ctx, &alerts)
	}

	// Create KPIs
	kpis := []db.KPI{
		{
			ID:            primitive.NewObjectID(),
			Name:          "Total Products",
			Value:         float64(totalProducts),
			Unit:          "items",
			Trend:         "stable",
			ChangePercent: 0,
			Period:        "day",
		},
		{
			ID:            primitive.NewObjectID(),
			Name:          "Total Orders",
			Value:         float64(totalOrders),
			Unit:          "orders",
			Trend:         "stable",
			ChangePercent: 0,
			Period:        "day",
		},
		{
			ID:            primitive.NewObjectID(),
			Name:          "Pending Tasks",
			Value:         float64(pendingTasks),
			Unit:          "tasks",
			Trend:         "stable",
			ChangePercent: 0,
			Period:        "day",
		},
		{
			ID:            primitive.NewObjectID(),
			Name:          "Total Inventory",
			Value:         float64(totalQuantity),
			Unit:          "units",
			Trend:         "stable",
			ChangePercent: 0,
			Period:        "day",
		},
	}

	dashboardData := map[string]interface{}{
		"kpis":              kpis,
		"recentActivities":  activities,
		"alerts":            alerts,
		"summary": map[string]interface{}{
			"totalProducts":        totalProducts,
			"totalOrders":          totalOrders,
			"totalTasks":           totalTasks,
			"pendingTasks":         pendingTasks,
			"activeTasks":          totalTasks - pendingTasks, // Calculate active tasks
			"totalShipments":       0, // TODO: Calculate from shipments collection
			"lowStockItems":        0, // TODO: Calculate items below reorder point
			"pendingOrders":        0, // TODO: Calculate pending orders
			"totalInventoryValue":  totalInventoryValue,
			"totalInventoryQuantity": totalQuantity,
		},
	}

	c.JSON(http.StatusOK, db.ApiResponse{Success: true, Data: dashboardData, Message: "Dashboard data fetched"})
}

// GetInventoryReport returns inventory analytics
func GetInventoryReport(c *gin.Context) {
	ctx := context.Background()

	// Get inventory by status
	availableCount, _ := db.InventoryItemsCollection.CountDocuments(ctx, bson.M{"status": "available"})
	reservedCount, _ := db.InventoryItemsCollection.CountDocuments(ctx, bson.M{"status": "reserved"})
	quarantineCount, _ := db.InventoryItemsCollection.CountDocuments(ctx, bson.M{"status": "quarantine"})
	damagedCount, _ := db.InventoryItemsCollection.CountDocuments(ctx, bson.M{"status": "damaged"})

	// Get low stock items
	var lowStockItems []db.InventoryItem
	cur, err := db.InventoryItemsCollection.Find(ctx, bson.M{})
	if err == nil {
		cur.All(ctx, &lowStockItems)
	}

	// TODO: Filter low stock items based on product minStockLevel

	// Get inventory by location
	var locationStats []bson.M
	pipeline := []bson.M{
		{"$group": bson.M{
			"_id": "$locationId",
			"totalQuantity": bson.M{"$sum": "$quantity"},
			"itemCount":     bson.M{"$sum": 1},
		}},
	}
	cur, err = db.InventoryItemsCollection.Aggregate(ctx, pipeline)
	if err == nil {
		cur.All(ctx, &locationStats)
	}

	report := map[string]interface{}{
		"statusBreakdown": map[string]int64{
			"available":  availableCount,
			"reserved":   reservedCount,
			"quarantine": quarantineCount,
			"damaged":    damagedCount,
		},
		"lowStockItems":   lowStockItems,
		"locationStats":   locationStats,
		"totalItems":      availableCount + reservedCount + quarantineCount + damagedCount,
	}

	c.JSON(http.StatusOK, db.ApiResponse{Success: true, Data: report, Message: "Inventory report generated"})
}

// GetOrderReport returns order analytics
func GetOrderReport(c *gin.Context) {
	ctx := context.Background()

	// Get orders by status
	pendingCount, _ := db.OrdersCollection.CountDocuments(ctx, bson.M{"status": "pending"})
	confirmedCount, _ := db.OrdersCollection.CountDocuments(ctx, bson.M{"status": "confirmed"})
pickingCount, _ := db.OrdersCollection.CountDocuments(ctx, bson.M{"status": "picking"})
pickedCount, _ := db.OrdersCollection.CountDocuments(ctx, bson.M{"status": "picked"})
packingCount, _ := db.OrdersCollection.CountDocuments(ctx, bson.M{"status": "packing"})
packedCount, _ := db.OrdersCollection.CountDocuments(ctx, bson.M{"status": "packed"})
shippedCount, _ := db.OrdersCollection.CountDocuments(ctx, bson.M{"status": "shipped"})
deliveredCount, _ := db.OrdersCollection.CountDocuments(ctx, bson.M{"status": "delivered"})
cancelledCount, _ := db.OrdersCollection.CountDocuments(ctx, bson.M{"status": "cancelled"})

	// Get orders by priority
	lowPriorityCount, _ := db.OrdersCollection.CountDocuments(ctx, bson.M{"priority": "low"})
	mediumPriorityCount, _ := db.OrdersCollection.CountDocuments(ctx, bson.M{"priority": "medium"})
	highPriorityCount, _ := db.OrdersCollection.CountDocuments(ctx, bson.M{"priority": "high"})
	urgentPriorityCount, _ := db.OrdersCollection.CountDocuments(ctx, bson.M{"priority": "urgent"})

	// Get recent orders
	var recentOrders []db.Order
	cur, err := db.OrdersCollection.Find(ctx, bson.M{})
	if err == nil {
		cur.All(ctx, &recentOrders)
	}

	report := map[string]interface{}{
		"statusBreakdown": map[string]int64{
			"pending":   pendingCount,
			"confirmed": confirmedCount,
			"picking":   pickingCount,
			"picked":    pickedCount,
			"packing":   packingCount,
			"packed":    packedCount,
			"shipped":   shippedCount,
			"delivered": deliveredCount,
			"cancelled": cancelledCount,
		},
		"priorityBreakdown": map[string]int64{
			"low":    lowPriorityCount,
			"medium": mediumPriorityCount,
			"high":   highPriorityCount,
			"urgent": urgentPriorityCount,
		},
		"recentOrders": recentOrders,
		"totalOrders":  pendingCount + confirmedCount + pickingCount + pickedCount + packingCount + packedCount + shippedCount + deliveredCount + cancelledCount,
	}

	c.JSON(http.StatusOK, db.ApiResponse{Success: true, Data: report, Message: "Order report generated"})
}

// GetTaskReport returns task analytics
func GetTaskReport(c *gin.Context) {
	ctx := context.Background()

	// Get tasks by status
	pendingCount, _ := db.TasksCollection.CountDocuments(ctx, bson.M{"status": "pending"})
	assignedCount, _ := db.TasksCollection.CountDocuments(ctx, bson.M{"status": "assigned"})
	inProgressCount, _ := db.TasksCollection.CountDocuments(ctx, bson.M{"status": "in_progress"})
	completedCount, _ := db.TasksCollection.CountDocuments(ctx, bson.M{"status": "completed"})
	cancelledCount, _ := db.TasksCollection.CountDocuments(ctx, bson.M{"status": "cancelled"})
	failedCount, _ := db.TasksCollection.CountDocuments(ctx, bson.M{"status": "failed"})

	// Get tasks by type
	receivingCount, _ := db.TasksCollection.CountDocuments(ctx, bson.M{"type": "receiving"})
	putawayCount, _ := db.TasksCollection.CountDocuments(ctx, bson.M{"type": "putaway"})
	pickingCount, _ := db.TasksCollection.CountDocuments(ctx, bson.M{"type": "picking"})
	packingCount, _ := db.TasksCollection.CountDocuments(ctx, bson.M{"type": "packing"})
	shippingCount, _ := db.TasksCollection.CountDocuments(ctx, bson.M{"type": "shipping"})
	cycleCountCount, _ := db.TasksCollection.CountDocuments(ctx, bson.M{"type": "cycle_count"})
	inventoryAdjustmentCount, _ := db.TasksCollection.CountDocuments(ctx, bson.M{"type": "inventory_adjustment"})

	// Get tasks by priority
	lowPriorityCount, _ := db.TasksCollection.CountDocuments(ctx, bson.M{"priority": "low"})
	mediumPriorityCount, _ := db.TasksCollection.CountDocuments(ctx, bson.M{"priority": "medium"})
	highPriorityCount, _ := db.TasksCollection.CountDocuments(ctx, bson.M{"priority": "high"})
	urgentPriorityCount, _ := db.TasksCollection.CountDocuments(ctx, bson.M{"priority": "urgent"})

	report := map[string]interface{}{
		"statusBreakdown": map[string]int64{
			"pending":     pendingCount,
			"assigned":    assignedCount,
			"in_progress": inProgressCount,
			"completed":   completedCount,
			"cancelled":   cancelledCount,
			"failed":      failedCount,
		},
		"typeBreakdown": map[string]int64{
			"receiving":            receivingCount,
			"putaway":             putawayCount,
			"picking":             pickingCount,
			"packing":             packingCount,
			"shipping":            shippingCount,
			"cycle_count":         cycleCountCount,
			"inventory_adjustment": inventoryAdjustmentCount,
		},
		"priorityBreakdown": map[string]int64{
			"low":    lowPriorityCount,
			"medium": mediumPriorityCount,
			"high":   highPriorityCount,
			"urgent": urgentPriorityCount,
		},
		"totalTasks": pendingCount + assignedCount + inProgressCount + completedCount + cancelledCount + failedCount,
	}

	c.JSON(http.StatusOK, db.ApiResponse{Success: true, Data: report, Message: "Task report generated"})
}

// Activity Management

// ListActivities returns all activities with filtering
func ListActivities(c *gin.Context) {
	filter := bson.M{}
	if activityType := c.Query("type"); activityType != "" {
		filter["type"] = activityType
	}
	if userID := c.Query("userId"); userID != "" {
		if objectID, err := primitive.ObjectIDFromHex(userID); err == nil {
			filter["userId"] = objectID
		}
	}

	cur, err := db.ActivitiesCollection.Find(context.Background(), filter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, db.ApiResponse{Success: false, Message: "Failed to fetch activities"})
		return
	}
	defer cur.Close(context.Background())

	var activities []db.Activity
	for cur.Next(context.Background()) {
		var activity db.Activity
		if err := cur.Decode(&activity); err == nil {
			// Load user details
			if activity.UserID != primitive.NilObjectID {
				var user db.User
				if err := db.UsersCollection.FindOne(context.Background(), bson.M{"_id": activity.UserID}).Decode(&user); err == nil {
					activity.User = &user
				}
			}
			activities = append(activities, activity)
		}
	}

	c.JSON(http.StatusOK, db.ApiResponse{Success: true, Data: activities, Message: "Activities fetched"})
}

// CreateActivity creates a new activity log
func CreateActivity(c *gin.Context) {
	var req db.Activity
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, db.ApiResponse{Success: false, Message: "Invalid request", Errors: []string{err.Error()}})
		return
	}

	req.ID = primitive.NewObjectID()
	req.Timestamp = time.Now()

	_, err := db.ActivitiesCollection.InsertOne(context.Background(), req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, db.ApiResponse{Success: false, Message: "Failed to create activity"})
		return
	}

	c.JSON(http.StatusCreated, db.ApiResponse{Success: true, Data: req, Message: "Activity created"})
}

// Alert Management

// ListAlerts returns all alerts with filtering
func ListAlerts(c *gin.Context) {
	filter := bson.M{}
	if alertType := c.Query("type"); alertType != "" {
		filter["type"] = alertType
	}
	if severity := c.Query("severity"); severity != "" {
		filter["severity"] = severity
	}
	if isRead := c.Query("isRead"); isRead != "" {
		filter["isRead"] = isRead == "true"
	}

	cur, err := db.AlertsCollection.Find(context.Background(), filter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, db.ApiResponse{Success: false, Message: "Failed to fetch alerts"})
		return
	}
	defer cur.Close(context.Background())

	var alerts []db.Alert
	for cur.Next(context.Background()) {
		var alert db.Alert
		if err := cur.Decode(&alert); err == nil {
			alerts = append(alerts, alert)
		}
	}

	c.JSON(http.StatusOK, db.ApiResponse{Success: true, Data: alerts, Message: "Alerts fetched"})
}

// CreateAlert creates a new alert
func CreateAlert(c *gin.Context) {
	var req db.Alert
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, db.ApiResponse{Success: false, Message: "Invalid request", Errors: []string{err.Error()}})
		return
	}

	req.ID = primitive.NewObjectID()
	req.CreatedAt = time.Now()

	_, err := db.AlertsCollection.InsertOne(context.Background(), req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, db.ApiResponse{Success: false, Message: "Failed to create alert"})
		return
	}

	c.JSON(http.StatusCreated, db.ApiResponse{Success: true, Data: req, Message: "Alert created"})
}

// MarkAlertAsRead marks an alert as read
func MarkAlertAsRead(c *gin.Context) {
	id := c.Param("id")
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, db.ApiResponse{Success: false, Message: "Invalid alert ID"})
		return
	}

	update := bson.M{
		"isRead": true,
	}

	_, err = db.AlertsCollection.UpdateOne(context.Background(), bson.M{"_id": objectID}, bson.M{"$set": update})
	if err != nil {
		c.JSON(http.StatusInternalServerError, db.ApiResponse{Success: false, Message: "Failed to mark alert as read"})
		return
	}

	c.JSON(http.StatusOK, db.ApiResponse{Success: true, Message: "Alert marked as read"})
}

// DeleteAlert deletes an alert
func DeleteAlert(c *gin.Context) {
	id := c.Param("id")
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, db.ApiResponse{Success: false, Message: "Invalid alert ID"})
		return
	}

	_, err = db.AlertsCollection.DeleteOne(context.Background(), bson.M{"_id": objectID})
	if err != nil {
		c.JSON(http.StatusInternalServerError, db.ApiResponse{Success: false, Message: "Failed to delete alert"})
		return
	}

	c.JSON(http.StatusOK, db.ApiResponse{Success: true, Message: "Alert deleted"})
} 