package api

import (
	"context"
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"wms-backend/internal/db"
)

// Order Management

// ListOrders returns a paginated list of orders
func ListOrders(c *gin.Context) {
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
	if status := c.Query("status"); status != "" {
		filter["status"] = status
	}
	if priority := c.Query("priority"); priority != "" {
		filter["priority"] = priority
	}
	if orderType := c.Query("orderType"); orderType != "" {
		filter["orderType"] = orderType
	}

	cur, err := db.OrdersCollection.Find(context.Background(), filter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, db.ApiResponse{Success: false, Message: "Failed to fetch orders"})
		return
	}
	defer cur.Close(context.Background())

	var orders []db.Order
	for cur.Next(context.Background()) {
		var order db.Order
		if err := cur.Decode(&order); err == nil {
			// Load customer details
			if order.CustomerID != primitive.NilObjectID {
				var customer db.Customer
				if err := db.CustomersCollection.FindOne(context.Background(), bson.M{"_id": order.CustomerID}).Decode(&customer); err == nil {
					order.Customer = &customer
				}
			}
			orders = append(orders, order)
		}
	}

	c.JSON(http.StatusOK, db.PaginatedResponse{
		Data: orders,
		Pagination: db.Pagination{
			Page:       page,
			Limit:      limit,
			Total:      len(orders),
			TotalPages: 1, // TODO: implement real pagination
		},
	})
}

// GetOrder returns an order by ID
func GetOrder(c *gin.Context) {
	id := c.Param("id")
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, db.ApiResponse{Success: false, Message: "Invalid order ID"})
		return
	}

	var order db.Order
	err = db.OrdersCollection.FindOne(context.Background(), bson.M{"_id": objectID}).Decode(&order)
	if err != nil {
		c.JSON(http.StatusNotFound, db.ApiResponse{Success: false, Message: "Order not found"})
		return
	}

	// Load customer details
	if order.CustomerID != primitive.NilObjectID {
		var customer db.Customer
		if err := db.CustomersCollection.FindOne(context.Background(), bson.M{"_id": order.CustomerID}).Decode(&customer); err == nil {
			order.Customer = &customer
		}
	}

	c.JSON(http.StatusOK, db.ApiResponse{Success: true, Data: order, Message: "Order found"})
}

// CreateOrder creates a new order
func CreateOrder(c *gin.Context) {
	var req db.Order
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, db.ApiResponse{Success: false, Message: "Invalid request", Errors: []string{err.Error()}})
		return
	}

	// Validate customer exists
	if req.CustomerID != primitive.NilObjectID {
		var customer db.Customer
		err := db.CustomersCollection.FindOne(context.Background(), bson.M{"_id": req.CustomerID}).Decode(&customer)
		if err != nil {
			c.JSON(http.StatusBadRequest, db.ApiResponse{Success: false, Message: "Customer not found"})
			return
		}
	}

	// Generate order number
	req.OrderNumber = generateOrderNumber()
	req.ID = primitive.NewObjectID()
	req.Status = "pending"
	req.CreatedAt = time.Now()
	req.UpdatedAt = time.Now()

	// Calculate totals
	req.TotalQuantity = 0
	req.TotalValue = 0
	for i := range req.Items {
		req.Items[i].ID = primitive.NewObjectID()
		req.Items[i].OrderID = req.ID
		req.Items[i].Status = "pending"
		req.TotalQuantity += req.Items[i].Quantity
		// TODO: Calculate value based on product price
	}

	_, err := db.OrdersCollection.InsertOne(context.Background(), req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, db.ApiResponse{Success: false, Message: "Failed to create order"})
		return
	}

	c.JSON(http.StatusCreated, db.ApiResponse{Success: true, Data: req, Message: "Order created"})
}

// UpdateOrder updates an existing order
func UpdateOrder(c *gin.Context) {
	id := c.Param("id")
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, db.ApiResponse{Success: false, Message: "Invalid order ID"})
		return
	}

	var req db.Order
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, db.ApiResponse{Success: false, Message: "Invalid request", Errors: []string{err.Error()}})
		return
	}

	update := bson.M{
		"status":        req.Status,
		"priority":      req.Priority,
		"orderType":     req.OrderType,
		"dueDate":       req.DueDate,
		"items":         req.Items,
		"totalQuantity": req.TotalQuantity,
		"totalValue":    req.TotalValue,
		"updatedAt":     time.Now(),
	}

	_, err = db.OrdersCollection.UpdateOne(context.Background(), bson.M{"_id": objectID}, bson.M{"$set": update})
	if err != nil {
		c.JSON(http.StatusInternalServerError, db.ApiResponse{Success: false, Message: "Failed to update order"})
		return
	}

	c.JSON(http.StatusOK, db.ApiResponse{Success: true, Message: "Order updated"})
}

// DeleteOrder deletes an order
func DeleteOrder(c *gin.Context) {
	id := c.Param("id")
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, db.ApiResponse{Success: false, Message: "Invalid order ID"})
		return
	}

	// Check if order can be deleted (not in progress)
	var order db.Order
	err = db.OrdersCollection.FindOne(context.Background(), bson.M{"_id": objectID}).Decode(&order)
	if err != nil {
		c.JSON(http.StatusNotFound, db.ApiResponse{Success: false, Message: "Order not found"})
		return
	}

	if order.Status != "pending" && order.Status != "cancelled" {
		c.JSON(http.StatusConflict, db.ApiResponse{Success: false, Message: "Cannot delete order that is in progress"})
		return
	}

	_, err = db.OrdersCollection.DeleteOne(context.Background(), bson.M{"_id": objectID})
	if err != nil {
		c.JSON(http.StatusInternalServerError, db.ApiResponse{Success: false, Message: "Failed to delete order"})
		return
	}

	c.JSON(http.StatusOK, db.ApiResponse{Success: true, Message: "Order deleted"})
}

// Customer Management

// ListCustomers returns all customers
func ListCustomers(c *gin.Context) {
	filter := bson.M{}
	if isActive := c.Query("isActive"); isActive != "" {
		filter["isActive"] = isActive == "true"
	}

	cur, err := db.CustomersCollection.Find(context.Background(), filter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, db.ApiResponse{Success: false, Message: "Failed to fetch customers"})
		return
	}
	defer cur.Close(context.Background())

	var customers []db.Customer
	for cur.Next(context.Background()) {
		var customer db.Customer
		if err := cur.Decode(&customer); err == nil {
			customers = append(customers, customer)
		}
	}

	c.JSON(http.StatusOK, db.ApiResponse{Success: true, Data: customers, Message: "Customers fetched"})
}

// GetCustomer returns a customer by ID
func GetCustomer(c *gin.Context) {
	id := c.Param("id")
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, db.ApiResponse{Success: false, Message: "Invalid customer ID"})
		return
	}

	var customer db.Customer
	err = db.CustomersCollection.FindOne(context.Background(), bson.M{"_id": objectID}).Decode(&customer)
	if err != nil {
		c.JSON(http.StatusNotFound, db.ApiResponse{Success: false, Message: "Customer not found"})
		return
	}

	c.JSON(http.StatusOK, db.ApiResponse{Success: true, Data: customer, Message: "Customer found"})
}

// CreateCustomer creates a new customer
func CreateCustomer(c *gin.Context) {
	var req db.Customer
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, db.ApiResponse{Success: false, Message: "Invalid request", Errors: []string{err.Error()}})
		return
	}

	req.ID = primitive.NewObjectID()

	_, err := db.CustomersCollection.InsertOne(context.Background(), req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, db.ApiResponse{Success: false, Message: "Failed to create customer"})
		return
	}

	c.JSON(http.StatusCreated, db.ApiResponse{Success: true, Data: req, Message: "Customer created"})
}

// UpdateCustomer updates an existing customer
func UpdateCustomer(c *gin.Context) {
	id := c.Param("id")
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, db.ApiResponse{Success: false, Message: "Invalid customer ID"})
		return
	}

	var req db.Customer
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, db.ApiResponse{Success: false, Message: "Invalid request", Errors: []string{err.Error()}})
		return
	}

	update := bson.M{
		"name":     req.Name,
		"email":    req.Email,
		"phone":    req.Phone,
		"address":  req.Address,
		"isActive": req.IsActive,
	}

	_, err = db.CustomersCollection.UpdateOne(context.Background(), bson.M{"_id": objectID}, bson.M{"$set": update})
	if err != nil {
		c.JSON(http.StatusInternalServerError, db.ApiResponse{Success: false, Message: "Failed to update customer"})
		return
	}

	c.JSON(http.StatusOK, db.ApiResponse{Success: true, Message: "Customer updated"})
}

// DeleteCustomer deletes a customer
func DeleteCustomer(c *gin.Context) {
	id := c.Param("id")
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, db.ApiResponse{Success: false, Message: "Invalid customer ID"})
		return
	}

	// Check if customer has orders
	count, err := db.OrdersCollection.CountDocuments(context.Background(), bson.M{"customerId": objectID})
	if err != nil {
		c.JSON(http.StatusInternalServerError, db.ApiResponse{Success: false, Message: "Failed to check customer usage"})
		return
	}

	if count > 0 {
		c.JSON(http.StatusConflict, db.ApiResponse{Success: false, Message: "Cannot delete customer with existing orders"})
		return
	}

	_, err = db.CustomersCollection.DeleteOne(context.Background(), bson.M{"_id": objectID})
	if err != nil {
		c.JSON(http.StatusInternalServerError, db.ApiResponse{Success: false, Message: "Failed to delete customer"})
		return
	}

	c.JSON(http.StatusOK, db.ApiResponse{Success: true, Message: "Customer deleted"})
}

// Helper function to generate order number
func generateOrderNumber() string {
	return fmt.Sprintf("ORD-%s", time.Now().Format("20060102-150405"))
} 