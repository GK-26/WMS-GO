package main

import (
	"context"
	"log"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"wms-backend/internal/auth"
	"wms-backend/internal/config"
	"wms-backend/internal/db"
)

func main() {
	// Load configuration
	config.Load()

	// Connect to database
	if err := db.Connect(); err != nil {
		log.Fatal("Failed to connect to database:", err)
	}
	defer db.Disconnect()

	// Create indexes
	if err := db.CreateIndexes(); err != nil {
		log.Fatal("Failed to create database indexes:", err)
	}

	// Seed data
	if err := seedData(); err != nil {
		log.Fatal("Failed to seed data:", err)
	}

	log.Println("Database seeded successfully!")
}

func seedData() error {
	ctx := context.Background()

	// Check if data already exists
	count, err := db.UsersCollection.CountDocuments(ctx, bson.M{})
	if err != nil {
		return err
	}

	if count > 0 {
		log.Println("Database already contains data, skipping seed")
		return nil
	}

	// Create default roles
	adminRole := db.UserRole{
		ID:          primitive.NewObjectID(),
		Name:        "admin",
		Description: "System administrator with full access",
		Permissions: []db.Permission{
			{ID: primitive.NewObjectID(), Name: "all", Description: "All permissions", Resource: "*", Action: "*"},
		},
	}

	managerRole := db.UserRole{
		ID:          primitive.NewObjectID(),
		Name:        "manager",
		Description: "Warehouse manager with management access",
		Permissions: []db.Permission{
			{ID: primitive.NewObjectID(), Name: "inventory_manage", Description: "Manage inventory", Resource: "inventory", Action: "*"},
			{ID: primitive.NewObjectID(), Name: "orders_manage", Description: "Manage orders", Resource: "orders", Action: "*"},
			{ID: primitive.NewObjectID(), Name: "reports_view", Description: "View reports", Resource: "reports", Action: "read"},
		},
	}

	workerRole := db.UserRole{
		ID:          primitive.NewObjectID(),
		Name:        "worker",
		Description: "Warehouse worker with basic access",
		Permissions: []db.Permission{
			{ID: primitive.NewObjectID(), Name: "inventory_read", Description: "Read inventory", Resource: "inventory", Action: "read"},
			{ID: primitive.NewObjectID(), Name: "tasks_manage", Description: "Manage assigned tasks", Resource: "tasks", Action: "*"},
		},
	}

	// Insert roles
	_, err = db.UserRolesCollection.InsertMany(ctx, []interface{}{
		adminRole,
		managerRole,
		workerRole,
	})
	if err != nil {
		return err
	}

	// Create default users
	now := time.Now()

	// Admin user
	adminPassword, err := auth.HashPassword("admin123")
	if err != nil {
		return err
	}

	adminUser := db.User{
		ID:        primitive.NewObjectID(),
		Username:  "admin",
		Email:     "admin@wms.com",
		Password:  adminPassword,
		FirstName: "System",
		LastName:  "Administrator",
		Roles:     []db.UserRole{adminRole},
		IsActive:  true,
		CreatedAt: now,
		UpdatedAt: now,
	}

	// Manager user
	managerPassword, err := auth.HashPassword("manager123")
	if err != nil {
		return err
	}

	managerUser := db.User{
		ID:        primitive.NewObjectID(),
		Username:  "manager",
		Email:     "manager@wms.com",
		Password:  managerPassword,
		FirstName: "John",
		LastName:  "Manager",
		Roles:     []db.UserRole{managerRole},
		IsActive:  true,
		CreatedAt: now,
		UpdatedAt: now,
	}

	// Worker user
	workerPassword, err := auth.HashPassword("worker123")
	if err != nil {
		return err
	}

	workerUser := db.User{
		ID:        primitive.NewObjectID(),
		Username:  "worker",
		Email:     "worker@wms.com",
		Password:  workerPassword,
		FirstName: "Jane",
		LastName:  "Worker",
		Roles:     []db.UserRole{workerRole},
		IsActive:  true,
		CreatedAt: now,
		UpdatedAt: now,
	}

	// Insert users
	_, err = db.UsersCollection.InsertMany(ctx, []interface{}{
		adminUser,
		managerUser,
		workerUser,
	})
	if err != nil {
		return err
	}

	// Create sample warehouse
	warehouse := db.Warehouse{
		ID:   primitive.NewObjectID(),
		Name: "Main Warehouse",
		Address: db.Address{
			Street:  "123 Warehouse St",
			City:    "Industrial City",
			State:   "CA",
			ZipCode: "90210",
			Country: "USA",
		},
		Timezone:  "America/Los_Angeles",
		IsActive:  true,
		CreatedAt: now,
		UpdatedAt: now,
	}

	_, err = db.WarehousesCollection.InsertOne(ctx, warehouse)
	if err != nil {
		return err
	}

	// Create sample locations
	zoneA := db.Location{
		ID:          primitive.NewObjectID(),
		Name:        "Zone A",
		Type:        "zone",
		WarehouseID: warehouse.ID,
		Capacity:    1000,
		IsActive:    true,
	}

	aisleA1 := db.Location{
		ID:          primitive.NewObjectID(),
		Name:        "Aisle A1",
		Type:        "aisle",
		ParentID:    &zoneA.ID,
		WarehouseID: warehouse.ID,
		Capacity:    500,
		IsActive:    true,
	}

	rackA1R1 := db.Location{
		ID:          primitive.NewObjectID(),
		Name:        "Rack A1-R1",
		Type:        "rack",
		ParentID:    &aisleA1.ID,
		WarehouseID: warehouse.ID,
		Capacity:    100,
		IsActive:    true,
	}

	binA1R1B1 := db.Location{
		ID:          primitive.NewObjectID(),
		Name:        "Bin A1-R1-B1",
		Type:        "bin",
		ParentID:    &rackA1R1.ID,
		WarehouseID: warehouse.ID,
		Capacity:    50,
		IsActive:    true,
	}

	_, err = db.LocationsCollection.InsertMany(ctx, []interface{}{
		zoneA,
		aisleA1,
		rackA1R1,
		binA1R1B1,
	})
	if err != nil {
		return err
	}

	// Create sample products
	product1 := db.Product{
		ID:          primitive.NewObjectID(),
		SKU:         "PROD-001",
		Name:        "Sample Product 1",
		Description: "This is a sample product for testing",
		Category:    "Electronics",
		Dimensions: db.Dimensions{
			Length: 10.0,
			Width:  5.0,
			Height: 2.0,
			Weight: 0.5,
		},
		IsHazardous:           false,
		RequiresRefrigeration: false,
		LotTracking:           false,
		SerialTracking:        false,
		MinStockLevel:         10,
		MaxStockLevel:         100,
		ReorderPoint:          20,
		CreatedAt:             now,
		UpdatedAt:             now,
	}

	product2 := db.Product{
		ID:          primitive.NewObjectID(),
		SKU:         "PROD-002",
		Name:        "Sample Product 2",
		Description: "Another sample product for testing",
		Category:    "Clothing",
		Dimensions: db.Dimensions{
			Length: 15.0,
			Width:  10.0,
			Height: 3.0,
			Weight: 0.3,
		},
		IsHazardous:           false,
		RequiresRefrigeration: false,
		LotTracking:           true,
		SerialTracking:        false,
		MinStockLevel:         5,
		MaxStockLevel:         50,
		ReorderPoint:          10,
		CreatedAt:             now,
		UpdatedAt:             now,
	}

	_, err = db.ProductsCollection.InsertMany(ctx, []interface{}{
		product1,
		product2,
	})
	if err != nil {
		return err
	}

	// Create sample inventory items
	inventory1 := db.InventoryItem{
		ID:         primitive.NewObjectID(),
		ProductID:  product1.ID,
		Quantity:   25,
		LocationID: binA1R1B1.ID,
		Status:     "available",
		LastCounted: now,
		CreatedAt:   now,
		UpdatedAt:   now,
	}

	inventory2 := db.InventoryItem{
		ID:         primitive.NewObjectID(),
		ProductID:  product2.ID,
		Quantity:   15,
		LocationID: binA1R1B1.ID,
		Status:     "available",
		LastCounted: now,
		CreatedAt:   now,
		UpdatedAt:   now,
	}

	_, err = db.InventoryItemsCollection.InsertMany(ctx, []interface{}{
		inventory1,
		inventory2,
	})
	if err != nil {
		return err
	}

	log.Println("Default users created:")
	log.Println("- Admin: admin/admin123")
	log.Println("- Manager: manager/manager123")
	log.Println("- Worker: worker/worker123")

	return nil
} 