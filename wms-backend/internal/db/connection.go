package db

import (
	"context"
	"log"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
	"wms-backend/internal/config"
)

var (
	Client   *mongo.Client
	Database *mongo.Database
)

// Collections
var (
	UsersCollection           *mongo.Collection
	UserRolesCollection       *mongo.Collection
	PermissionsCollection     *mongo.Collection
	ProductsCollection        *mongo.Collection
	InventoryItemsCollection  *mongo.Collection
	LocationsCollection       *mongo.Collection
	WarehousesCollection      *mongo.Collection
	OrdersCollection          *mongo.Collection
	OrderItemsCollection      *mongo.Collection
	CustomersCollection       *mongo.Collection
	TasksCollection           *mongo.Collection
	KPIsCollection            *mongo.Collection
	ActivitiesCollection      *mongo.Collection
	AlertsCollection          *mongo.Collection
	// Shipping Collections
	ShipmentsCollection       *mongo.Collection
	CarriersCollection        *mongo.Collection
	// Receiving Collections
	ASNsCollection            *mongo.Collection
	QualityChecksCollection   *mongo.Collection
	// Labor Collections
	WorkersCollection         *mongo.Collection
	ShiftsCollection          *mongo.Collection
	PerformanceCollection     *mongo.Collection
	// Automation Collections
	WorkflowRulesCollection   *mongo.Collection
	IntegrationsCollection    *mongo.Collection
	SystemStatusCollection    *mongo.Collection
	// Additional Collections
	EmailNotificationsCollection *mongo.Collection
	EmailTemplatesCollection     *mongo.Collection
	FileUploadsCollection        *mongo.Collection
)

func Connect() error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Set client options
	clientOptions := options.Client().ApplyURI(config.AppConfig.Database.URI)
	
	// Connect to MongoDB
	client, err := mongo.Connect(ctx, clientOptions)
	if err != nil {
		return err
	}

	// Ping the database
	err = client.Ping(ctx, nil)
	if err != nil {
		return err
	}

	Client = client
	Database = client.Database(config.AppConfig.Database.Database)

	// Initialize collections
	InitializeCollections()

	log.Println("Connected to MongoDB!")
	return nil
}

func InitializeCollections() {
	UsersCollection = Database.Collection("users")
	UserRolesCollection = Database.Collection("user_roles")
	PermissionsCollection = Database.Collection("permissions")
	ProductsCollection = Database.Collection("products")
	InventoryItemsCollection = Database.Collection("inventory_items")
	LocationsCollection = Database.Collection("locations")
	WarehousesCollection = Database.Collection("warehouses")
	OrdersCollection = Database.Collection("orders")
	OrderItemsCollection = Database.Collection("order_items")
	CustomersCollection = Database.Collection("customers")
	TasksCollection = Database.Collection("tasks")
	KPIsCollection = Database.Collection("kpis")
	ActivitiesCollection = Database.Collection("activities")
	AlertsCollection = Database.Collection("alerts")
	// Shipping Collections
	ShipmentsCollection = Database.Collection("shipments")
	CarriersCollection = Database.Collection("carriers")
	// Receiving Collections
	ASNsCollection = Database.Collection("asns")
	QualityChecksCollection = Database.Collection("quality_checks")
	// Labor Collections
	WorkersCollection = Database.Collection("workers")
	ShiftsCollection = Database.Collection("shifts")
	PerformanceCollection = Database.Collection("performance")
	// Automation Collections
	WorkflowRulesCollection = Database.Collection("workflow_rules")
	IntegrationsCollection = Database.Collection("integrations")
	SystemStatusCollection = Database.Collection("system_status")
	// Additional Collections
	EmailNotificationsCollection = Database.Collection("email_notifications")
	EmailTemplatesCollection = Database.Collection("email_templates")
	FileUploadsCollection = Database.Collection("file_uploads")
}

func Disconnect() error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if Client != nil {
		return Client.Disconnect(ctx)
	}
	return nil
}

// CreateIndexes creates necessary indexes for better query performance
func CreateIndexes() error {
	ctx := context.Background()

	// Users indexes
	_, err := UsersCollection.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys: bson.D{{Key: "username", Value: 1}},
		Options: options.Index().SetUnique(true),
	})
	if err != nil {
		return err
	}

	_, err = UsersCollection.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys: bson.D{{Key: "email", Value: 1}},
		Options: options.Index().SetUnique(true),
	})
	if err != nil {
		return err
	}

	// Products indexes
	_, err = ProductsCollection.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys: bson.D{{Key: "sku", Value: 1}},
		Options: options.Index().SetUnique(true),
	})
	if err != nil {
		return err
	}

	// Inventory items indexes
	_, err = InventoryItemsCollection.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys: bson.D{{Key: "productId", Value: 1}, {Key: "locationId", Value: 1}},
	})
	if err != nil {
		return err
	}

	// Orders indexes
	_, err = OrdersCollection.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys: bson.D{{Key: "orderNumber", Value: 1}},
		Options: options.Index().SetUnique(true),
	})
	if err != nil {
		return err
	}

	_, err = OrdersCollection.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys: bson.D{{Key: "status", Value: 1}, {Key: "dueDate", Value: 1}},
	})
	if err != nil {
		return err
	}

	// Tasks indexes
	_, err = TasksCollection.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys: bson.D{{Key: "assignedTo", Value: 1}, {Key: "status", Value: 1}},
	})
	if err != nil {
		return err
	}

	log.Println("Database indexes created successfully!")
	return nil
}

// GetCollection returns a collection by name
func GetCollection(name string) *mongo.Collection {
	return Database.Collection(name)
} 