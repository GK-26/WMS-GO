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

// Shipping Management APIs

// ListShipments returns all shipments with pagination
func ListShipments(c *gin.Context) {
	ctx := context.Background()
	
	// Parse query parameters
	page := GetIntQuery(c, "page", 1)
	limit := GetIntQuery(c, "limit", 10)
	status := c.Query("status")
	
	// Build filter
	filter := bson.M{}
	if status != "" {
		filter["status"] = status
	}
	
	// Calculate skip
	skip := (page - 1) * limit
	
	// Find shipments
	opts := options.Find().SetSkip(int64(skip)).SetLimit(int64(limit)).SetSort(bson.D{{Key: "created_at", Value: -1}})
	cursor, err := db.ShipmentsCollection.Find(ctx, filter, opts)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch shipments"})
		return
	}
	defer cursor.Close(ctx)
	
	var shipments []db.Shipment
	if err = cursor.All(ctx, &shipments); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to decode shipments"})
		return
	}
	
	// Get total count
	total, err := db.ShipmentsCollection.CountDocuments(ctx, filter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to count shipments"})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{
		"data": shipments,
		"pagination": gin.H{
			"page":  page,
			"limit": limit,
			"total": total,
		},
	})
}

// GetShipment returns a single shipment by ID
func GetShipment(c *gin.Context) {
	ctx := context.Background()
	
	id := c.Param("id")
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid shipment ID"})
		return
	}
	
	var shipment db.Shipment
	err = db.ShipmentsCollection.FindOne(ctx, bson.M{"_id": objectID}).Decode(&shipment)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Shipment not found"})
		return
	}
	
	c.JSON(http.StatusOK, shipment)
}

// CreateShipment creates a new shipment
func CreateShipment(c *gin.Context) {
	ctx := context.Background()
	
	var req struct {
		OrderID        string  `json:"order_id" binding:"required"`
		CarrierID      string  `json:"carrier_id" binding:"required"`
		TrackingNumber string  `json:"tracking_number"`
		Weight         float64 `json:"weight"`
		Dimensions     db.Dimensions `json:"dimensions"`
		ShippingCost   float64 `json:"shipping_cost"`
		Notes          string  `json:"notes"`
	}
	
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	
	// Validate order ID
	orderID, err := primitive.ObjectIDFromHex(req.OrderID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid order ID"})
		return
	}
	
	// Validate carrier ID
	carrierID, err := primitive.ObjectIDFromHex(req.CarrierID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid carrier ID"})
		return
	}
	
	// Generate shipment number
	shipmentNumber := generateShipmentNumber()
	
	now := time.Now()
	shipment := db.Shipment{
		ID:             primitive.NewObjectID(),
		ShipmentNumber: shipmentNumber,
		OrderID:        orderID,
		CarrierID:      carrierID,
		Status:         "pending",
		TrackingNumber: req.TrackingNumber,
		Weight:         req.Weight,
		Dimensions:     req.Dimensions,
		ShippingCost:   req.ShippingCost,
		Notes:          req.Notes,
		CreatedAt:      now,
		UpdatedAt:      now,
	}
	
	_, err = db.ShipmentsCollection.InsertOne(ctx, shipment)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create shipment"})
		return
	}
	
	c.JSON(http.StatusCreated, shipment)
}

// UpdateShipment updates an existing shipment
func UpdateShipment(c *gin.Context) {
	ctx := context.Background()
	
	id := c.Param("id")
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid shipment ID"})
		return
	}
	
	var req struct {
		Status         string           `json:"status"`
		TrackingNumber string           `json:"tracking_number"`
		ShippingDate   *time.Time       `json:"shipping_date"`
		DeliveryDate   *time.Time       `json:"delivery_date"`
		Weight         float64          `json:"weight"`
		Dimensions     db.Dimensions    `json:"dimensions"`
		ShippingCost   float64          `json:"shipping_cost"`
		Notes          string           `json:"notes"`
	}
	
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	
	update := bson.M{
		"updated_at": time.Now(),
	}
	
	if req.Status != "" {
		update["status"] = req.Status
	}
	if req.TrackingNumber != "" {
		update["tracking_number"] = req.TrackingNumber
	}
	if req.ShippingDate != nil {
		update["shipping_date"] = req.ShippingDate
	}
	if req.DeliveryDate != nil {
		update["delivery_date"] = req.DeliveryDate
	}
	if req.Weight > 0 {
		update["weight"] = req.Weight
	}
	if req.Dimensions.Length > 0 || req.Dimensions.Width > 0 || req.Dimensions.Height > 0 {
		update["dimensions"] = req.Dimensions
	}
	if req.ShippingCost > 0 {
		update["shipping_cost"] = req.ShippingCost
	}
	if req.Notes != "" {
		update["notes"] = req.Notes
	}
	
	result := db.ShipmentsCollection.FindOneAndUpdate(
		ctx,
		bson.M{"_id": objectID},
		bson.M{"$set": update},
		options.FindOneAndUpdate().SetReturnDocument(options.After),
	)
	
	var shipment db.Shipment
	if err := result.Decode(&shipment); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Shipment not found"})
		return
	}
	
	c.JSON(http.StatusOK, shipment)
}

// DeleteShipment deletes a shipment
func DeleteShipment(c *gin.Context) {
	ctx := context.Background()
	
	id := c.Param("id")
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid shipment ID"})
		return
	}
	
	result, err := db.ShipmentsCollection.DeleteOne(ctx, bson.M{"_id": objectID})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete shipment"})
		return
	}
	
	if result.DeletedCount == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Shipment not found"})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{"message": "Shipment deleted successfully"})
}

// ListCarriers returns all carriers
func ListCarriers(c *gin.Context) {
	ctx := context.Background()
	
	// Parse query parameters
	page := GetIntQuery(c, "page", 1)
	limit := GetIntQuery(c, "limit", 10)
	isActive := c.Query("is_active")
	
	// Build filter
	filter := bson.M{}
	if isActive != "" {
		filter["is_active"] = isActive == "true"
	}
	
	// Calculate skip
	skip := (page - 1) * limit
	
	// Find carriers
	opts := options.Find().SetSkip(int64(skip)).SetLimit(int64(limit)).SetSort(bson.D{{Key: "name", Value: 1}})
	cursor, err := db.CarriersCollection.Find(ctx, filter, opts)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch carriers"})
		return
	}
	defer cursor.Close(ctx)
	
	var carriers []db.Carrier
	if err = cursor.All(ctx, &carriers); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to decode carriers"})
		return
	}
	
	// Get total count
	total, err := db.CarriersCollection.CountDocuments(ctx, filter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to count carriers"})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{
		"data": carriers,
		"pagination": gin.H{
			"page":  page,
			"limit": limit,
			"total": total,
		},
	})
}

// GetCarrier returns a single carrier by ID
func GetCarrier(c *gin.Context) {
	ctx := context.Background()
	
	id := c.Param("id")
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid carrier ID"})
		return
	}
	
	var carrier db.Carrier
	err = db.CarriersCollection.FindOne(ctx, bson.M{"_id": objectID}).Decode(&carrier)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Carrier not found"})
		return
	}
	
	c.JSON(http.StatusOK, carrier)
}

// CreateCarrier creates a new carrier
func CreateCarrier(c *gin.Context) {
	ctx := context.Background()
	
	var req struct {
		Name        string      `json:"name" binding:"required"`
		Code        string      `json:"code" binding:"required"`
		ContactInfo db.ContactInfo `json:"contact_info"`
		Services    []string    `json:"services"`
		IsActive    bool        `json:"is_active"`
	}
	
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	
	now := time.Now()
	carrier := db.Carrier{
		ID:          primitive.NewObjectID(),
		Name:        req.Name,
		Code:        req.Code,
		ContactInfo: req.ContactInfo,
		Services:    req.Services,
		IsActive:    req.IsActive,
		CreatedAt:   now,
		UpdatedAt:   now,
	}
	
	_, err := db.CarriersCollection.InsertOne(ctx, carrier)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create carrier"})
		return
	}
	
	c.JSON(http.StatusCreated, carrier)
}

// UpdateCarrier updates an existing carrier
func UpdateCarrier(c *gin.Context) {
	ctx := context.Background()
	
	id := c.Param("id")
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid carrier ID"})
		return
	}
	
	var req struct {
		Name        string      `json:"name"`
		Code        string      `json:"code"`
		ContactInfo db.ContactInfo `json:"contact_info"`
		Services    []string    `json:"services"`
		IsActive    *bool       `json:"is_active"`
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
	if req.Code != "" {
		update["code"] = req.Code
	}
	if req.ContactInfo.Name != "" || req.ContactInfo.Email != "" || req.ContactInfo.Phone != "" {
		update["contact_info"] = req.ContactInfo
	}
	if req.Services != nil {
		update["services"] = req.Services
	}
	if req.IsActive != nil {
		update["is_active"] = *req.IsActive
	}
	
	result := db.CarriersCollection.FindOneAndUpdate(
		ctx,
		bson.M{"_id": objectID},
		bson.M{"$set": update},
		options.FindOneAndUpdate().SetReturnDocument(options.After),
	)
	
	var carrier db.Carrier
	if err := result.Decode(&carrier); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Carrier not found"})
		return
	}
	
	c.JSON(http.StatusOK, carrier)
}

// DeleteCarrier deletes a carrier
func DeleteCarrier(c *gin.Context) {
	ctx := context.Background()
	
	id := c.Param("id")
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid carrier ID"})
		return
	}
	
	result, err := db.CarriersCollection.DeleteOne(ctx, bson.M{"_id": objectID})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete carrier"})
		return
	}
	
	if result.DeletedCount == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Carrier not found"})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{"message": "Carrier deleted successfully"})
}

// Helper function to generate shipment number
func generateShipmentNumber() string {
	return "SH" + time.Now().Format("20060102150405")
} 