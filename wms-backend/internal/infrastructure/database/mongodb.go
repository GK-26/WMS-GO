package database

import (
	"context"
	"fmt"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
	"wms-backend/internal/config"
)

type MongoDB struct {
	Client   *mongo.Client
	Database *mongo.Database
}

func NewMongoDB(cfg *config.Config) (*MongoDB, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Set client options
	clientOptions := options.Client().ApplyURI(cfg.Database.URI)

	// Connect to MongoDB
	client, err := mongo.Connect(ctx, clientOptions)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to MongoDB: %w", err)
	}

	// Ping the database
	if err = client.Ping(ctx, nil); err != nil {
		return nil, fmt.Errorf("failed to ping MongoDB: %w", err)
	}

	database := client.Database(cfg.Database.Database)

	db := &MongoDB{
		Client:   client,
		Database: database,
	}

	// Create indexes
	if err := db.createIndexes(); err != nil {
		return nil, fmt.Errorf("failed to create indexes: %w", err)
	}

	return db, nil
}

func (db *MongoDB) Close() error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if db.Client != nil {
		return db.Client.Disconnect(ctx)
	}
	return nil
}

func (db *MongoDB) createIndexes() error {
	ctx := context.Background()

	// Users indexes
	userIndexes := []mongo.IndexModel{
		{
			Keys:    bson.D{{Key: "username", Value: 1}},
			Options: options.Index().SetUnique(true),
		},
		{
			Keys:    bson.D{{Key: "email", Value: 1}},
			Options: options.Index().SetUnique(true),
		},
	}

	if _, err := db.Database.Collection("users").Indexes().CreateMany(ctx, userIndexes); err != nil {
		return fmt.Errorf("failed to create user indexes: %w", err)
	}

	// Products indexes
	productIndexes := []mongo.IndexModel{
		{
			Keys:    bson.D{{Key: "sku", Value: 1}},
			Options: options.Index().SetUnique(true),
		},
		{
			Keys: bson.D{{Key: "category", Value: 1}},
		},
		{
			Keys: bson.D{{Key: "name", Value: "text"}, {Key: "description", Value: "text"}},
		},
	}

	if _, err := db.Database.Collection("products").Indexes().CreateMany(ctx, productIndexes); err != nil {
		return fmt.Errorf("failed to create product indexes: %w", err)
	}

	// Orders indexes
	orderIndexes := []mongo.IndexModel{
		{
			Keys:    bson.D{{Key: "order_number", Value: 1}},
			Options: options.Index().SetUnique(true),
		},
		{
			Keys: bson.D{{Key: "status", Value: 1}, {Key: "due_date", Value: 1}},
		},
		{
			Keys: bson.D{{Key: "customer_id", Value: 1}},
		},
	}

	if _, err := db.Database.Collection("orders").Indexes().CreateMany(ctx, orderIndexes); err != nil {
		return fmt.Errorf("failed to create order indexes: %w", err)
	}

	// Inventory items indexes
	inventoryIndexes := []mongo.IndexModel{
		{
			Keys: bson.D{{Key: "product_id", Value: 1}, {Key: "location_id", Value: 1}},
		},
		{
			Keys: bson.D{{Key: "status", Value: 1}},
		},
		{
			Keys: bson.D{{Key: "expiration_date", Value: 1}},
		},
	}

	if _, err := db.Database.Collection("inventory_items").Indexes().CreateMany(ctx, inventoryIndexes); err != nil {
		return fmt.Errorf("failed to create inventory indexes: %w", err)
	}

	// Tasks indexes
	taskIndexes := []mongo.IndexModel{
		{
			Keys: bson.D{{Key: "assigned_to", Value: 1}, {Key: "status", Value: 1}},
		},
		{
			Keys: bson.D{{Key: "status", Value: 1}, {Key: "priority", Value: 1}},
		},
		{
			Keys: bson.D{{Key: "due_date", Value: 1}},
		},
	}

	if _, err := db.Database.Collection("tasks").Indexes().CreateMany(ctx, taskIndexes); err != nil {
		return fmt.Errorf("failed to create task indexes: %w", err)
	}

	return nil
}