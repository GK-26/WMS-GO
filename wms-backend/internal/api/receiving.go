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

// Receiving Management APIs

// ListASNs returns all ASNs with pagination
func ListASNs(c *gin.Context) {
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
	
	// Find ASNs
	opts := options.Find().SetSkip(int64(skip)).SetLimit(int64(limit)).SetSort(bson.D{{Key: "expected_date", Value: 1}})
	cursor, err := db.ASNsCollection.Find(ctx, filter, opts)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch ASNs"})
		return
	}
	defer cursor.Close(ctx)
	
	var asns []db.ASN
	if err = cursor.All(ctx, &asns); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to decode ASNs"})
		return
	}
	
	// Get total count
	total, err := db.ASNsCollection.CountDocuments(ctx, filter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to count ASNs"})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{
		"data": asns,
		"pagination": gin.H{
			"page":  page,
			"limit": limit,
			"total": total,
		},
	})
}

// GetASN returns a single ASN by ID
func GetASN(c *gin.Context) {
	ctx := context.Background()
	
	id := c.Param("id")
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ASN ID"})
		return
	}
	
	var asn db.ASN
	err = db.ASNsCollection.FindOne(ctx, bson.M{"_id": objectID}).Decode(&asn)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "ASN not found"})
		return
	}
	
	c.JSON(http.StatusOK, asn)
}

// CreateASN creates a new ASN
func CreateASN(c *gin.Context) {
	ctx := context.Background()
	
	var req struct {
		ASNNumber    string     `json:"asn_number" binding:"required"`
		SupplierID   string     `json:"supplier_id" binding:"required"`
		ExpectedDate time.Time  `json:"expected_date" binding:"required"`
		Items        []db.ASNItem `json:"items" binding:"required"`
		Notes        string     `json:"notes"`
	}
	
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	
	// Validate supplier ID
	supplierID, err := primitive.ObjectIDFromHex(req.SupplierID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid supplier ID"})
		return
	}
	
	// Validate items
	for i, item := range req.Items {
		if _, err := primitive.ObjectIDFromHex(item.ProductID.Hex()); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid product ID in item " + string(rune(i))})
			return
		}
		// Initialize received quantity to 0
		req.Items[i].ReceivedQty = 0
		req.Items[i].Status = "pending"
	}
	
	now := time.Now()
	asn := db.ASN{
		ID:           primitive.NewObjectID(),
		ASNNumber:    req.ASNNumber,
		SupplierID:   supplierID,
		ExpectedDate: req.ExpectedDate,
		Status:       "pending",
		Items:        req.Items,
		Notes:        req.Notes,
		CreatedAt:    now,
		UpdatedAt:    now,
	}
	
	_, err = db.ASNsCollection.InsertOne(ctx, asn)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create ASN"})
		return
	}
	
	c.JSON(http.StatusCreated, asn)
}

// UpdateASN updates an existing ASN
func UpdateASN(c *gin.Context) {
	ctx := context.Background()
	
	id := c.Param("id")
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ASN ID"})
		return
	}
	
	var req struct {
		ExpectedDate *time.Time    `json:"expected_date"`
		Status       string        `json:"status"`
		Items        []db.ASNItem  `json:"items"`
		Notes        string        `json:"notes"`
	}
	
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	
	update := bson.M{
		"updated_at": time.Now(),
	}
	
	if req.ExpectedDate != nil {
		update["expected_date"] = *req.ExpectedDate
	}
	if req.Status != "" {
		update["status"] = req.Status
	}
	if req.Items != nil {
		update["items"] = req.Items
	}
	if req.Notes != "" {
		update["notes"] = req.Notes
	}
	
	result := db.ASNsCollection.FindOneAndUpdate(
		ctx,
		bson.M{"_id": objectID},
		bson.M{"$set": update},
		options.FindOneAndUpdate().SetReturnDocument(options.After),
	)
	
	var asn db.ASN
	if err := result.Decode(&asn); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "ASN not found"})
		return
	}
	
	c.JSON(http.StatusOK, asn)
}

// DeleteASN deletes an ASN
func DeleteASN(c *gin.Context) {
	ctx := context.Background()
	
	id := c.Param("id")
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ASN ID"})
		return
	}
	
	result, err := db.ASNsCollection.DeleteOne(ctx, bson.M{"_id": objectID})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete ASN"})
		return
	}
	
	if result.DeletedCount == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "ASN not found"})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{"message": "ASN deleted successfully"})
}

// ReceiveASNItem updates the received quantity for an ASN item
func ReceiveASNItem(c *gin.Context) {
	ctx := context.Background()
	
	asnID := c.Param("id")
	objectID, err := primitive.ObjectIDFromHex(asnID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ASN ID"})
		return
	}
	
	var req struct {
		ProductID   string `json:"product_id" binding:"required"`
		ReceivedQty int    `json:"received_qty" binding:"required"`
	}
	
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	
	productID, err := primitive.ObjectIDFromHex(req.ProductID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid product ID"})
		return
	}
	
	// Update the specific item in the ASN
	update := bson.M{
		"$set": bson.M{
			"items.$.received_qty": req.ReceivedQty,
			"items.$.status":       "received",
			"updated_at":           time.Now(),
		},
	}
	
	// Find the ASN and update the specific item
	filter := bson.M{
		"_id":           objectID,
		"items.product_id": productID,
	}
	
	result := db.ASNsCollection.FindOneAndUpdate(
		ctx,
		filter,
		update,
		options.FindOneAndUpdate().SetReturnDocument(options.After),
	)
	
	var asn db.ASN
	if err := result.Decode(&asn); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "ASN or product not found"})
		return
	}
	
	c.JSON(http.StatusOK, asn)
}

// ListQualityChecks returns all quality checks with pagination
func ListQualityChecks(c *gin.Context) {
	ctx := context.Background()
	
	// Parse query parameters
	page := GetIntQuery(c, "page", 1)
	limit := GetIntQuery(c, "limit", 10)
	status := c.Query("status")
	asnID := c.Query("asn_id")
	
	// Build filter
	filter := bson.M{}
	if status != "" {
		filter["status"] = status
	}
	if asnID != "" {
		asnObjectID, err := primitive.ObjectIDFromHex(asnID)
		if err == nil {
			filter["asn_id"] = asnObjectID
		}
	}
	
	// Calculate skip
	skip := (page - 1) * limit
	
	// Find quality checks
	opts := options.Find().SetSkip(int64(skip)).SetLimit(int64(limit)).SetSort(bson.D{{Key: "created_at", Value: -1}})
	cursor, err := db.QualityChecksCollection.Find(ctx, filter, opts)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch quality checks"})
		return
	}
	defer cursor.Close(ctx)
	
	var qualityChecks []db.QualityCheck
	if err = cursor.All(ctx, &qualityChecks); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to decode quality checks"})
		return
	}
	
	// Get total count
	total, err := db.QualityChecksCollection.CountDocuments(ctx, filter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to count quality checks"})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{
		"data": qualityChecks,
		"pagination": gin.H{
			"page":  page,
			"limit": limit,
			"total": total,
		},
	})
}

// GetQualityCheck returns a single quality check by ID
func GetQualityCheck(c *gin.Context) {
	ctx := context.Background()
	
	id := c.Param("id")
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid quality check ID"})
		return
	}
	
	var qualityCheck db.QualityCheck
	err = db.QualityChecksCollection.FindOne(ctx, bson.M{"_id": objectID}).Decode(&qualityCheck)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Quality check not found"})
		return
	}
	
	c.JSON(http.StatusOK, qualityCheck)
}

// CreateQualityCheck creates a new quality check
func CreateQualityCheck(c *gin.Context) {
	ctx := context.Background()
	
	var req struct {
		ASNID       string `json:"asn_id" binding:"required"`
		ProductID   string `json:"product_id" binding:"required"`
		InspectorID string `json:"inspector_id" binding:"required"`
		Notes       string `json:"notes"`
	}
	
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	
	// Validate ASN ID
	asnID, err := primitive.ObjectIDFromHex(req.ASNID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ASN ID"})
		return
	}
	
	// Validate product ID
	productID, err := primitive.ObjectIDFromHex(req.ProductID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid product ID"})
		return
	}
	
	// Validate inspector ID
	inspectorID, err := primitive.ObjectIDFromHex(req.InspectorID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid inspector ID"})
		return
	}
	
	now := time.Now()
	qualityCheck := db.QualityCheck{
		ID:          primitive.NewObjectID(),
		ASNID:       asnID,
		ProductID:   productID,
		InspectorID: inspectorID,
		Status:      "pending",
		Result:      "",
		Notes:       req.Notes,
		CreatedAt:   now,
		UpdatedAt:   now,
	}
	
	_, err = db.QualityChecksCollection.InsertOne(ctx, qualityCheck)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create quality check"})
		return
	}
	
	c.JSON(http.StatusCreated, qualityCheck)
}

// UpdateQualityCheck updates an existing quality check
func UpdateQualityCheck(c *gin.Context) {
	ctx := context.Background()
	
	id := c.Param("id")
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid quality check ID"})
		return
	}
	
	var req struct {
		Status string `json:"status"`
		Result string `json:"result"`
		Notes  string `json:"notes"`
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
	if req.Result != "" {
		update["result"] = req.Result
	}
	if req.Notes != "" {
		update["notes"] = req.Notes
	}
	
	result := db.QualityChecksCollection.FindOneAndUpdate(
		ctx,
		bson.M{"_id": objectID},
		bson.M{"$set": update},
		options.FindOneAndUpdate().SetReturnDocument(options.After),
	)
	
	var qualityCheck db.QualityCheck
	if err := result.Decode(&qualityCheck); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Quality check not found"})
		return
	}
	
	c.JSON(http.StatusOK, qualityCheck)
}

// DeleteQualityCheck deletes a quality check
func DeleteQualityCheck(c *gin.Context) {
	ctx := context.Background()
	
	id := c.Param("id")
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid quality check ID"})
		return
	}
	
	result, err := db.QualityChecksCollection.DeleteOne(ctx, bson.M{"_id": objectID})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete quality check"})
		return
	}
	
	if result.DeletedCount == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Quality check not found"})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{"message": "Quality check deleted successfully"})
} 