package entities

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Order struct {
	ID            primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	OrderNumber   string             `bson:"order_number" json:"orderNumber"`
	CustomerID    primitive.ObjectID `bson:"customer_id" json:"customerId"`
	Customer      *Customer          `bson:"customer,omitempty" json:"customer,omitempty"`
	Status        OrderStatus        `bson:"status" json:"status"`
	Priority      Priority           `bson:"priority" json:"priority"`
	OrderType     OrderType          `bson:"order_type" json:"orderType"`
	Items         []OrderItem        `bson:"items" json:"items"`
	TotalQuantity int                `bson:"total_quantity" json:"totalQuantity"`
	TotalValue    float64            `bson:"total_value" json:"totalValue"`
	DueDate       time.Time          `bson:"due_date" json:"dueDate"`
	CreatedAt     time.Time          `bson:"created_at" json:"createdAt"`
	UpdatedAt     time.Time          `bson:"updated_at" json:"updatedAt"`
}

type OrderStatus string

const (
	OrderStatusPending   OrderStatus = "pending"
	OrderStatusConfirmed OrderStatus = "confirmed"
	OrderStatusPicking   OrderStatus = "picking"
	OrderStatusPacked    OrderStatus = "packed"
	OrderStatusShipped   OrderStatus = "shipped"
	OrderStatusDelivered OrderStatus = "delivered"
	OrderStatusCancelled OrderStatus = "cancelled"
)

type Priority string

const (
	PriorityLow    Priority = "low"
	PriorityMedium Priority = "medium"
	PriorityHigh   Priority = "high"
	PriorityUrgent Priority = "urgent"
)

type OrderType string

const (
	OrderTypeStandard OrderType = "standard"
	OrderTypeExpress  OrderType = "express"
	OrderTypeBulk     OrderType = "bulk"
)

type OrderItem struct {
	ID              primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	OrderID         primitive.ObjectID `bson:"order_id" json:"orderId"`
	ProductID       primitive.ObjectID `bson:"product_id" json:"productId"`
	Product         *Product           `bson:"product,omitempty" json:"product,omitempty"`
	Quantity        int                `bson:"quantity" json:"quantity"`
	QuantityPicked  int                `bson:"quantity_picked" json:"quantityPicked"`
	QuantityPacked  int                `bson:"quantity_packed" json:"quantityPacked"`
	QuantityShipped int                `bson:"quantity_shipped" json:"quantityShipped"`
	Status          OrderItemStatus    `bson:"status" json:"status"`
	Priority        Priority           `bson:"priority" json:"priority"`
}

type OrderItemStatus string

const (
	OrderItemStatusPending  OrderItemStatus = "pending"
	OrderItemStatusPicking  OrderItemStatus = "picking"
	OrderItemStatusPicked   OrderItemStatus = "picked"
	OrderItemStatusPacking  OrderItemStatus = "packing"
	OrderItemStatusPacked   OrderItemStatus = "packed"
	OrderItemStatusShipped  OrderItemStatus = "shipped"
)

type Customer struct {
	ID        primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	Name      string             `bson:"name" json:"name"`
	Email     string             `bson:"email" json:"email"`
	Phone     string             `bson:"phone" json:"phone"`
	Address   Address            `bson:"address" json:"address"`
	IsActive  bool               `bson:"is_active" json:"isActive"`
	CreatedAt time.Time          `bson:"created_at" json:"createdAt"`
	UpdatedAt time.Time          `bson:"updated_at" json:"updatedAt"`
}

type Address struct {
	Street  string `bson:"street" json:"street"`
	City    string `bson:"city" json:"city"`
	State   string `bson:"state" json:"state"`
	ZipCode string `bson:"zip_code" json:"zipCode"`
	Country string `bson:"country" json:"country"`
}

func (o *Order) IsOverdue() bool {
	return time.Now().After(o.DueDate) && 
		o.Status != OrderStatusDelivered && 
		o.Status != OrderStatusCancelled
}

func (o *Order) CanBeCancelled() bool {
	return o.Status == OrderStatusPending || o.Status == OrderStatusConfirmed
}

func (o *Order) IsUrgent() bool {
	return o.Priority == PriorityUrgent || o.IsOverdue()
}

func (oi *OrderItem) IsFullyPicked() bool {
	return oi.QuantityPicked >= oi.Quantity
}

func (oi *OrderItem) IsFullyPacked() bool {
	return oi.QuantityPacked >= oi.Quantity
}

func (oi *OrderItem) IsFullyShipped() bool {
	return oi.QuantityShipped >= oi.Quantity
}