package api

import (
	"context"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
	"wms-backend/internal/db"
)

// Product Management

// ListProducts returns a paginated list of products
func ListProducts(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}

	skip := (page - 1) * limit

	filter := bson.M{}
	if search := c.Query("search"); search != "" {
		filter["$or"] = bson.A{
			bson.M{"name": bson.M{"$regex": search, "$options": "i"}},
			bson.M{"sku": bson.M{"$regex": search, "$options": "i"}},
			bson.M{"description": bson.M{"$regex": search, "$options": "i"}},
		}
	}

	if category := c.Query("category"); category != "" {
		filter["category"] = category
	}

	// Get total count
	total, err := db.ProductsCollection.CountDocuments(context.Background(), filter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, db.ApiResponse{Success: false, Message: "Failed to count products"})
		return
	}

	// Get paginated results
	opts := options.Find().SetSkip(int64(skip)).SetLimit(int64(limit)).SetSort(bson.D{{Key: "createdAt", Value: -1}})
	cur, err := db.ProductsCollection.Find(context.Background(), filter, opts)
	if err != nil {
		c.JSON(http.StatusInternalServerError, db.ApiResponse{Success: false, Message: "Failed to fetch products"})
		return
	}
	defer cur.Close(context.Background())

	var products []db.Product
	for cur.Next(context.Background()) {
		var product db.Product
		if err := cur.Decode(&product); err == nil {
			products = append(products, product)
		}
	}

	totalPages := int((total + int64(limit) - 1) / int64(limit))

	c.JSON(http.StatusOK, db.PaginatedResponse{
		Data: products,
		Pagination: db.Pagination{
			Page:       page,
			Limit:      limit,
			Total:      int(total),
			TotalPages: totalPages,
		},
	})
}

// GetProduct returns a product by ID
func GetProduct(c *gin.Context) {
	id := c.Param("id")
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, db.ApiResponse{Success: false, Message: "Invalid product ID"})
		return
	}

	var product db.Product
	err = db.ProductsCollection.FindOne(context.Background(), bson.M{"_id": objectID}).Decode(&product)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			c.JSON(http.StatusNotFound, db.ApiResponse{Success: false, Message: "Product not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, db.ApiResponse{Success: false, Message: "Failed to fetch product"})
		return
	}

	c.JSON(http.StatusOK, db.ApiResponse{Success: true, Data: product})
}

// CreateProduct creates a new product
func CreateProduct(c *gin.Context) {
	var product db.Product
	if err := c.ShouldBindJSON(&product); err != nil {
		c.JSON(http.StatusBadRequest, db.ApiResponse{Success: false, Message: "Invalid request data", Errors: []string{err.Error()}})
		return
	}

	// Validate required fields
	if product.SKU == "" || product.Name == "" {
		c.JSON(http.StatusBadRequest, db.ApiResponse{Success: false, Message: "SKU and name are required"})
		return
	}

	// Check if SKU already exists
	var existingProduct db.Product
	err := db.ProductsCollection.FindOne(context.Background(), bson.M{"sku": product.SKU}).Decode(&existingProduct)
	if err == nil {
		c.JSON(http.StatusConflict, db.ApiResponse{Success: false, Message: "Product with this SKU already exists"})
		return
	}

	// Set timestamps
	product.CreatedAt = time.Now()
	product.UpdatedAt = time.Now()

	// Insert product
	result, err := db.ProductsCollection.InsertOne(context.Background(), product)
	if err != nil {
		c.JSON(http.StatusInternalServerError, db.ApiResponse{Success: false, Message: "Failed to create product"})
		return
	}

	product.ID = result.InsertedID.(primitive.ObjectID)
	c.JSON(http.StatusCreated, db.ApiResponse{Success: true, Data: product, Message: "Product created successfully"})
}

// UpdateProduct updates a product
func UpdateProduct(c *gin.Context) {
	id := c.Param("id")
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, db.ApiResponse{Success: false, Message: "Invalid product ID"})
		return
	}

	var updateData map[string]interface{}
	if err := c.ShouldBindJSON(&updateData); err != nil {
		c.JSON(http.StatusBadRequest, db.ApiResponse{Success: false, Message: "Invalid request data"})
		return
	}

	// Remove fields that shouldn't be updated
	delete(updateData, "_id")
	delete(updateData, "createdAt")
	updateData["updatedAt"] = time.Now()

	// Check if SKU is being updated and if it already exists
	if sku, exists := updateData["sku"]; exists {
		var existingProduct db.Product
		err := db.ProductsCollection.FindOne(context.Background(), bson.M{"sku": sku, "_id": bson.M{"$ne": objectID}}).Decode(&existingProduct)
		if err == nil {
			c.JSON(http.StatusConflict, db.ApiResponse{Success: false, Message: "Product with this SKU already exists"})
			return
		}
	}

	// Update product
	result, err := db.ProductsCollection.UpdateOne(
		context.Background(),
		bson.M{"_id": objectID},
		bson.M{"$set": updateData},
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, db.ApiResponse{Success: false, Message: "Failed to update product"})
		return
	}

	if result.MatchedCount == 0 {
		c.JSON(http.StatusNotFound, db.ApiResponse{Success: false, Message: "Product not found"})
		return
	}

	c.JSON(http.StatusOK, db.ApiResponse{Success: true, Message: "Product updated successfully"})
}

// DeleteProduct deletes a product
func DeleteProduct(c *gin.Context) {
	id := c.Param("id")
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, db.ApiResponse{Success: false, Message: "Invalid product ID"})
		return
	}

	// Check if product has associated inventory items
	count, err := db.InventoryItemsCollection.CountDocuments(context.Background(), bson.M{"productId": objectID})
	if err != nil {
		c.JSON(http.StatusInternalServerError, db.ApiResponse{Success: false, Message: "Failed to check product dependencies"})
		return
	}

	if count > 0 {
		c.JSON(http.StatusConflict, db.ApiResponse{Success: false, Message: "Cannot delete product with existing inventory items"})
		return
	}

	// Delete product
	result, err := db.ProductsCollection.DeleteOne(context.Background(), bson.M{"_id": objectID})
	if err != nil {
		c.JSON(http.StatusInternalServerError, db.ApiResponse{Success: false, Message: "Failed to delete product"})
		return
	}

	if result.DeletedCount == 0 {
		c.JSON(http.StatusNotFound, db.ApiResponse{Success: false, Message: "Product not found"})
		return
	}

	c.JSON(http.StatusOK, db.ApiResponse{Success: true, Message: "Product deleted successfully"})
}

// Inventory Items Management

// ListInventoryItems returns inventory items
func ListInventoryItems(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}

	skip := (page - 1) * limit

	filter := bson.M{}
	if productID := c.Query("productId"); productID != "" {
		if objectID, err := primitive.ObjectIDFromHex(productID); err == nil {
			filter["productId"] = objectID
		}
	}

	if locationID := c.Query("locationId"); locationID != "" {
		if objectID, err := primitive.ObjectIDFromHex(locationID); err == nil {
			filter["locationId"] = objectID
		}
	}

	if status := c.Query("status"); status != "" {
		filter["status"] = status
	}

	// Get total count
	total, err := db.InventoryItemsCollection.CountDocuments(context.Background(), filter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, db.ApiResponse{Success: false, Message: "Failed to count inventory items"})
		return
	}

	// Get paginated results with product and location details
	pipeline := mongo.Pipeline{
		{{Key: "$match", Value: filter}},
		{{Key: "$lookup", Value: bson.M{
			"from":         "products",
			"localField":   "productId",
			"foreignField": "_id",
			"as":           "product",
		}}},
		{{Key: "$lookup", Value: bson.M{
			"from":         "locations",
			"localField":   "locationId",
			"foreignField": "_id",
			"as":           "location",
		}}},
		{{Key: "$unwind", Value: bson.M{"path": "$product", "preserveNullAndEmptyArrays": true}}},
		{{Key: "$unwind", Value: bson.M{"path": "$location", "preserveNullAndEmptyArrays": true}}},
		{{Key: "$sort", Value: bson.D{{Key: "createdAt", Value: -1}}}},
		{{Key: "$skip", Value: int64(skip)}},
		{{Key: "$limit", Value: int64(limit)}},
	}

	cur, err := db.InventoryItemsCollection.Aggregate(context.Background(), pipeline)
	if err != nil {
		c.JSON(http.StatusInternalServerError, db.ApiResponse{Success: false, Message: "Failed to fetch inventory items"})
		return
	}
	defer cur.Close(context.Background())

	var items []db.InventoryItem
	for cur.Next(context.Background()) {
		var item db.InventoryItem
		if err := cur.Decode(&item); err == nil {
			items = append(items, item)
		}
	}

	totalPages := int((total + int64(limit) - 1) / int64(limit))

	c.JSON(http.StatusOK, db.PaginatedResponse{
		Data: items,
		Pagination: db.Pagination{
			Page:       page,
			Limit:      limit,
			Total:      int(total),
			TotalPages: totalPages,
		},
	})
}

// GetInventoryItem returns an inventory item by ID
func GetInventoryItem(c *gin.Context) {
	id := c.Param("id")
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, db.ApiResponse{Success: false, Message: "Invalid inventory item ID"})
		return
	}

	pipeline := mongo.Pipeline{
		{{Key: "$match", Value: bson.M{"_id": objectID}}},
		{{Key: "$lookup", Value: bson.M{
			"from":         "products",
			"localField":   "productId",
			"foreignField": "_id",
			"as":           "product",
		}}},
		{{Key: "$lookup", Value: bson.M{
			"from":         "locations",
			"localField":   "locationId",
			"foreignField": "_id",
			"as":           "location",
		}}},
		{{Key: "$unwind", Value: bson.M{"path": "$product", "preserveNullAndEmptyArrays": true}}},
		{{Key: "$unwind", Value: bson.M{"path": "$location", "preserveNullAndEmptyArrays": true}}},
	}

	cur, err := db.InventoryItemsCollection.Aggregate(context.Background(), pipeline)
	if err != nil {
		c.JSON(http.StatusInternalServerError, db.ApiResponse{Success: false, Message: "Failed to fetch inventory item"})
		return
	}
	defer cur.Close(context.Background())

	if cur.Next(context.Background()) {
		var item db.InventoryItem
		if err := cur.Decode(&item); err != nil {
			c.JSON(http.StatusInternalServerError, db.ApiResponse{Success: false, Message: "Failed to decode inventory item"})
			return
		}
		c.JSON(http.StatusOK, db.ApiResponse{Success: true, Data: item})
		return
	}

	c.JSON(http.StatusNotFound, db.ApiResponse{Success: false, Message: "Inventory item not found"})
}

// CreateInventoryItem creates a new inventory item
func CreateInventoryItem(c *gin.Context) {
	var item db.InventoryItem
	if err := c.ShouldBindJSON(&item); err != nil {
		c.JSON(http.StatusBadRequest, db.ApiResponse{Success: false, Message: "Invalid request data", Errors: []string{err.Error()}})
		return
	}

	// Validate required fields
	if item.ProductID.IsZero() || item.LocationID.IsZero() {
		c.JSON(http.StatusBadRequest, db.ApiResponse{Success: false, Message: "Product ID and Location ID are required"})
		return
	}

	// Check if product exists
	var product db.Product
	err := db.ProductsCollection.FindOne(context.Background(), bson.M{"_id": item.ProductID}).Decode(&product)
	if err != nil {
		c.JSON(http.StatusBadRequest, db.ApiResponse{Success: false, Message: "Product not found"})
		return
	}

	// Check if location exists
	var location db.Location
	err = db.LocationsCollection.FindOne(context.Background(), bson.M{"_id": item.LocationID}).Decode(&location)
	if err != nil {
		c.JSON(http.StatusBadRequest, db.ApiResponse{Success: false, Message: "Location not found"})
		return
	}

	// Set timestamps
	item.CreatedAt = time.Now()
	item.UpdatedAt = time.Now()
	item.LastCounted = time.Now()

	// Insert inventory item
	result, err := db.InventoryItemsCollection.InsertOne(context.Background(), item)
	if err != nil {
		c.JSON(http.StatusInternalServerError, db.ApiResponse{Success: false, Message: "Failed to create inventory item"})
		return
	}

	item.ID = result.InsertedID.(primitive.ObjectID)
	c.JSON(http.StatusCreated, db.ApiResponse{Success: true, Data: item, Message: "Inventory item created successfully"})
}

// UpdateInventoryItem updates an inventory item
func UpdateInventoryItem(c *gin.Context) {
	id := c.Param("id")
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, db.ApiResponse{Success: false, Message: "Invalid inventory item ID"})
		return
	}

	var updateData map[string]interface{}
	if err := c.ShouldBindJSON(&updateData); err != nil {
		c.JSON(http.StatusBadRequest, db.ApiResponse{Success: false, Message: "Invalid request data"})
		return
	}

	// Remove fields that shouldn't be updated
	delete(updateData, "_id")
	delete(updateData, "createdAt")
	updateData["updatedAt"] = time.Now()

	// Update inventory item
	result, err := db.InventoryItemsCollection.UpdateOne(
		context.Background(),
		bson.M{"_id": objectID},
		bson.M{"$set": updateData},
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, db.ApiResponse{Success: false, Message: "Failed to update inventory item"})
		return
	}

	if result.MatchedCount == 0 {
		c.JSON(http.StatusNotFound, db.ApiResponse{Success: false, Message: "Inventory item not found"})
		return
	}

	c.JSON(http.StatusOK, db.ApiResponse{Success: true, Message: "Inventory item updated successfully"})
}

// DeleteInventoryItem deletes an inventory item
func DeleteInventoryItem(c *gin.Context) {
	id := c.Param("id")
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, db.ApiResponse{Success: false, Message: "Invalid inventory item ID"})
		return
	}

	// Delete inventory item
	result, err := db.InventoryItemsCollection.DeleteOne(context.Background(), bson.M{"_id": objectID})
	if err != nil {
		c.JSON(http.StatusInternalServerError, db.ApiResponse{Success: false, Message: "Failed to delete inventory item"})
		return
	}

	if result.DeletedCount == 0 {
		c.JSON(http.StatusNotFound, db.ApiResponse{Success: false, Message: "Inventory item not found"})
		return
	}

	c.JSON(http.StatusOK, db.ApiResponse{Success: true, Message: "Inventory item deleted successfully"})
}

// Location Management

// ListLocations returns all locations
func ListLocations(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}

	skip := (page - 1) * limit

	filter := bson.M{}
	if locationType := c.Query("type"); locationType != "" {
		filter["type"] = locationType
	}

	if warehouseID := c.Query("warehouseId"); warehouseID != "" {
		if objectID, err := primitive.ObjectIDFromHex(warehouseID); err == nil {
			filter["warehouseId"] = objectID
		}
	}

	if isActive := c.Query("isActive"); isActive != "" {
		if active, err := strconv.ParseBool(isActive); err == nil {
			filter["isActive"] = active
		}
	}

	// Get total count
	total, err := db.LocationsCollection.CountDocuments(context.Background(), filter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, db.ApiResponse{Success: false, Message: "Failed to count locations"})
		return
	}

	// Get paginated results
	opts := options.Find().SetSkip(int64(skip)).SetLimit(int64(limit)).SetSort(bson.D{{Key: "name", Value: 1}})
	cur, err := db.LocationsCollection.Find(context.Background(), filter, opts)
	if err != nil {
		c.JSON(http.StatusInternalServerError, db.ApiResponse{Success: false, Message: "Failed to fetch locations"})
		return
	}
	defer cur.Close(context.Background())

	var locations []db.Location
	for cur.Next(context.Background()) {
		var location db.Location
		if err := cur.Decode(&location); err == nil {
			locations = append(locations, location)
		}
	}

	totalPages := int((total + int64(limit) - 1) / int64(limit))

	c.JSON(http.StatusOK, db.PaginatedResponse{
		Data: locations,
		Pagination: db.Pagination{
			Page:       page,
			Limit:      limit,
			Total:      int(total),
			TotalPages: totalPages,
		},
	})
}

// GetLocation returns a location by ID
func GetLocation(c *gin.Context) {
	id := c.Param("id")
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, db.ApiResponse{Success: false, Message: "Invalid location ID"})
		return
	}

	var location db.Location
	err = db.LocationsCollection.FindOne(context.Background(), bson.M{"_id": objectID}).Decode(&location)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			c.JSON(http.StatusNotFound, db.ApiResponse{Success: false, Message: "Location not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, db.ApiResponse{Success: false, Message: "Failed to fetch location"})
		return
	}

	c.JSON(http.StatusOK, db.ApiResponse{Success: true, Data: location})
}

// CreateLocation creates a new location
func CreateLocation(c *gin.Context) {
	var location db.Location
	if err := c.ShouldBindJSON(&location); err != nil {
		c.JSON(http.StatusBadRequest, db.ApiResponse{Success: false, Message: "Invalid request data", Errors: []string{err.Error()}})
		return
	}

	// Validate required fields
	if location.Name == "" || location.Type == "" || location.WarehouseID.IsZero() {
		c.JSON(http.StatusBadRequest, db.ApiResponse{Success: false, Message: "Name, type, and warehouse ID are required"})
		return
	}

	// Check if location name already exists in the warehouse
	var existingLocation db.Location
	err := db.LocationsCollection.FindOne(context.Background(), bson.M{
		"name":        location.Name,
		"warehouseId": location.WarehouseID,
	}).Decode(&existingLocation)
	if err == nil {
		c.JSON(http.StatusConflict, db.ApiResponse{Success: false, Message: "Location with this name already exists in the warehouse"})
		return
	}

	// Set timestamps
	location.CreatedAt = time.Now()
	location.UpdatedAt = time.Now()

	// Insert location
	result, err := db.LocationsCollection.InsertOne(context.Background(), location)
	if err != nil {
		c.JSON(http.StatusInternalServerError, db.ApiResponse{Success: false, Message: "Failed to create location"})
		return
	}

	location.ID = result.InsertedID.(primitive.ObjectID)
	c.JSON(http.StatusCreated, db.ApiResponse{Success: true, Data: location, Message: "Location created successfully"})
}

// UpdateLocation updates a location
func UpdateLocation(c *gin.Context) {
	id := c.Param("id")
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, db.ApiResponse{Success: false, Message: "Invalid location ID"})
		return
	}

	var updateData map[string]interface{}
	if err := c.ShouldBindJSON(&updateData); err != nil {
		c.JSON(http.StatusBadRequest, db.ApiResponse{Success: false, Message: "Invalid request data"})
		return
	}

	// Remove fields that shouldn't be updated
	delete(updateData, "_id")
	delete(updateData, "createdAt")
	updateData["updatedAt"] = time.Now()

	// Update location
	result, err := db.LocationsCollection.UpdateOne(
		context.Background(),
		bson.M{"_id": objectID},
		bson.M{"$set": updateData},
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, db.ApiResponse{Success: false, Message: "Failed to update location"})
		return
	}

	if result.MatchedCount == 0 {
		c.JSON(http.StatusNotFound, db.ApiResponse{Success: false, Message: "Location not found"})
		return
	}

	c.JSON(http.StatusOK, db.ApiResponse{Success: true, Message: "Location updated successfully"})
}

// DeleteLocation deletes a location
func DeleteLocation(c *gin.Context) {
	id := c.Param("id")
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, db.ApiResponse{Success: false, Message: "Invalid location ID"})
		return
	}

	// Check if location has associated inventory items
	count, err := db.InventoryItemsCollection.CountDocuments(context.Background(), bson.M{"locationId": objectID})
	if err != nil {
		c.JSON(http.StatusInternalServerError, db.ApiResponse{Success: false, Message: "Failed to check location dependencies"})
		return
	}

	if count > 0 {
		c.JSON(http.StatusConflict, db.ApiResponse{Success: false, Message: "Cannot delete location with existing inventory items"})
		return
	}

	// Delete location
	result, err := db.LocationsCollection.DeleteOne(context.Background(), bson.M{"_id": objectID})
	if err != nil {
		c.JSON(http.StatusInternalServerError, db.ApiResponse{Success: false, Message: "Failed to delete location"})
		return
	}

	if result.DeletedCount == 0 {
		c.JSON(http.StatusNotFound, db.ApiResponse{Success: false, Message: "Location not found"})
		return
	}

	c.JSON(http.StatusOK, db.ApiResponse{Success: true, Message: "Location deleted successfully"})
} 