package repositories

import (
	"context"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
	"wms-backend/internal/domain/entities"
	"wms-backend/internal/domain/repositories"
)

type orderRepository struct {
	collection *mongo.Collection
}

func NewOrderRepository(db *mongo.Database) repositories.OrderRepository {
	return &orderRepository{
		collection: db.Collection("orders"),
	}
}

func (r *orderRepository) Create(ctx context.Context, order *entities.Order) error {
	order.ID = primitive.NewObjectID()
	order.CreatedAt = time.Now()
	order.UpdatedAt = time.Now()
	
	_, err := r.collection.InsertOne(ctx, order)
	return err
}

func (r *orderRepository) GetByID(ctx context.Context, id primitive.ObjectID) (*entities.Order, error) {
	var order entities.Order
	err := r.collection.FindOne(ctx, bson.M{"_id": id}).Decode(&order)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, nil
		}
		return nil, err
	}
	return &order, nil
}

func (r *orderRepository) GetByOrderNumber(ctx context.Context, orderNumber string) (*entities.Order, error) {
	var order entities.Order
	err := r.collection.FindOne(ctx, bson.M{"order_number": orderNumber}).Decode(&order)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, nil
		}
		return nil, err
	}
	return &order, nil
}

func (r *orderRepository) Update(ctx context.Context, order *entities.Order) error {
	order.UpdatedAt = time.Now()
	
	filter := bson.M{"_id": order.ID}
	update := bson.M{"$set": order}
	
	_, err := r.collection.UpdateOne(ctx, filter, update)
	return err
}

func (r *orderRepository) Delete(ctx context.Context, id primitive.ObjectID) error {
	_, err := r.collection.DeleteOne(ctx, bson.M{"_id": id})
	return err
}

func (r *orderRepository) List(ctx context.Context, limit, offset int) ([]*entities.Order, error) {
	opts := options.Find().
		SetLimit(int64(limit)).
		SetSkip(int64(offset)).
		SetSort(bson.D{{Key: "created_at", Value: -1}})
	
	cursor, err := r.collection.Find(ctx, bson.M{}, opts)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var orders []*entities.Order
	for cursor.Next(ctx) {
		var order entities.Order
		if err := cursor.Decode(&order); err != nil {
			return nil, err
		}
		orders = append(orders, &order)
	}

	return orders, cursor.Err()
}

func (r *orderRepository) GetByStatus(ctx context.Context, status entities.OrderStatus) ([]*entities.Order, error) {
	filter := bson.M{"status": status}
	opts := options.Find().SetSort(bson.D{{Key: "created_at", Value: -1}})
	
	cursor, err := r.collection.Find(ctx, filter, opts)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var orders []*entities.Order
	for cursor.Next(ctx) {
		var order entities.Order
		if err := cursor.Decode(&order); err != nil {
			return nil, err
		}
		orders = append(orders, &order)
	}

	return orders, cursor.Err()
}

func (r *orderRepository) GetByCustomer(ctx context.Context, customerID primitive.ObjectID) ([]*entities.Order, error) {
	filter := bson.M{"customer_id": customerID}
	opts := options.Find().SetSort(bson.D{{Key: "created_at", Value: -1}})
	
	cursor, err := r.collection.Find(ctx, filter, opts)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var orders []*entities.Order
	for cursor.Next(ctx) {
		var order entities.Order
		if err := cursor.Decode(&order); err != nil {
			return nil, err
		}
		orders = append(orders, &order)
	}

	return orders, cursor.Err()
}

func (r *orderRepository) GetOverdueOrders(ctx context.Context) ([]*entities.Order, error) {
	now := time.Now()
	filter := bson.M{
		"due_date": bson.M{"$lt": now},
		"status": bson.M{
			"$nin": []entities.OrderStatus{
				entities.OrderStatusDelivered,
				entities.OrderStatusCancelled,
			},
		},
	}
	
	opts := options.Find().SetSort(bson.D{{Key: "due_date", Value: 1}})
	cursor, err := r.collection.Find(ctx, filter, opts)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var orders []*entities.Order
	for cursor.Next(ctx) {
		var order entities.Order
		if err := cursor.Decode(&order); err != nil {
			return nil, err
		}
		orders = append(orders, &order)
	}

	return orders, cursor.Err()
}

func (r *orderRepository) GetUrgentOrders(ctx context.Context) ([]*entities.Order, error) {
	filter := bson.M{
		"$or": []bson.M{
			{"priority": entities.PriorityUrgent},
			{
				"due_date": bson.M{"$lt": time.Now()},
				"status": bson.M{
					"$nin": []entities.OrderStatus{
						entities.OrderStatusDelivered,
						entities.OrderStatusCancelled,
					},
				},
			},
		},
	}
	
	opts := options.Find().SetSort(bson.D{{Key: "due_date", Value: 1}})
	cursor, err := r.collection.Find(ctx, filter, opts)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var orders []*entities.Order
	for cursor.Next(ctx) {
		var order entities.Order
		if err := cursor.Decode(&order); err != nil {
			return nil, err
		}
		orders = append(orders, &order)
	}

	return orders, cursor.Err()
}