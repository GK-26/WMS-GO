package db

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// User and Authentication Models
type User struct {
	ID          primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	Username    string             `bson:"username" json:"username"`
	Email       string             `bson:"email" json:"email"`
	FirstName   string             `bson:"firstName" json:"firstName"`
	LastName    string             `bson:"lastName" json:"lastName"`
	Password    string             `bson:"password" json:"-"` // Never return password in JSON
	Roles       []UserRole         `bson:"roles" json:"roles"`
	Permissions []Permission       `bson:"permissions" json:"permissions"`
	IsActive    bool               `bson:"isActive" json:"isActive"`
	LastLogin   *time.Time         `bson:"lastLogin,omitempty" json:"lastLogin,omitempty"`
	CreatedAt   time.Time          `bson:"createdAt" json:"createdAt"`
	UpdatedAt   time.Time          `bson:"updatedAt" json:"updatedAt"`
}

type UserRole struct {
	ID          primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	Name        string             `bson:"name" json:"name"`
	Description string             `bson:"description" json:"description"`
	Permissions []Permission       `bson:"permissions" json:"permissions"`
}

type Permission struct {
	ID          primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	Name        string             `bson:"name" json:"name"`
	Description string             `bson:"description" json:"description"`
	Resource    string             `bson:"resource" json:"resource"`
	Action      string             `bson:"action" json:"action"` // create, read, update, delete, *
}

// Inventory Models
type Product struct {
	ID                    primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	SKU                   string             `bson:"sku" json:"sku"`
	Name                  string             `bson:"name" json:"name"`
	Description           string             `bson:"description" json:"description"`
	Category              string             `bson:"category" json:"category"`
	Dimensions            Dimensions         `bson:"dimensions" json:"dimensions"`
	IsHazardous           bool               `bson:"isHazardous" json:"isHazardous"`
	RequiresRefrigeration bool               `bson:"requiresRefrigeration" json:"requiresRefrigeration"`
	LotTracking           bool               `bson:"lotTracking" json:"lotTracking"`
	SerialTracking        bool               `bson:"serialTracking" json:"serialTracking"`
	MinStockLevel         int                `bson:"minStockLevel" json:"minStockLevel"`
	MaxStockLevel         int                `bson:"maxStockLevel" json:"maxStockLevel"`
	ReorderPoint          int                `bson:"reorderPoint" json:"reorderPoint"`
	SupplierID            *primitive.ObjectID `bson:"supplierId,omitempty" json:"supplierId,omitempty"`
	CreatedAt             time.Time          `bson:"createdAt" json:"createdAt"`
	UpdatedAt             time.Time          `bson:"updatedAt" json:"updatedAt"`
}

type Dimensions struct {
	Length float64 `bson:"length" json:"length"`
	Width  float64 `bson:"width" json:"width"`
	Height float64 `bson:"height" json:"height"`
	Weight float64 `bson:"weight" json:"weight"`
}

type InventoryItem struct {
	ID             primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	ProductID      primitive.ObjectID `bson:"productId" json:"productId"`
	Product        *Product           `bson:"product,omitempty" json:"product,omitempty"`
	Quantity       int                `bson:"quantity" json:"quantity"`
	LocationID     primitive.ObjectID `bson:"locationId" json:"locationId"`
	Location       *Location          `bson:"location,omitempty" json:"location,omitempty"`
	LotNumber      *string            `bson:"lotNumber,omitempty" json:"lotNumber,omitempty"`
	SerialNumber   *string            `bson:"serialNumber,omitempty" json:"serialNumber,omitempty"`
	ExpirationDate *time.Time         `bson:"expirationDate,omitempty" json:"expirationDate,omitempty"`
	Status         string             `bson:"status" json:"status"` // available, reserved, quarantine, damaged
	LastCounted    time.Time          `bson:"lastCounted" json:"lastCounted"`
	CreatedAt      time.Time          `bson:"createdAt" json:"createdAt"`
	UpdatedAt      time.Time          `bson:"updatedAt" json:"updatedAt"`
}

type Location struct {
	ID           primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	Name         string             `bson:"name" json:"name"`
	Type         string             `bson:"type" json:"type"` // zone, aisle, rack, bin
	ParentID     *primitive.ObjectID `bson:"parentId,omitempty" json:"parentId,omitempty"`
	WarehouseID  primitive.ObjectID `bson:"warehouseId" json:"warehouseId"`
	Coordinates  *Coordinates       `bson:"coordinates,omitempty" json:"coordinates,omitempty"`
	Capacity     int                `bson:"capacity" json:"capacity"`
	IsActive     bool               `bson:"isActive" json:"isActive"`
	CreatedAt    time.Time          `bson:"createdAt" json:"createdAt"`
	UpdatedAt    time.Time          `bson:"updatedAt" json:"updatedAt"`
}

type Coordinates struct {
	X float64 `bson:"x" json:"x"`
	Y float64 `bson:"y" json:"y"`
	Z float64 `bson:"z" json:"z"`
}

type Warehouse struct {
	ID        primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	Name      string             `bson:"name" json:"name"`
	Address   Address            `bson:"address" json:"address"`
	Timezone  string             `bson:"timezone" json:"timezone"`
	IsActive  bool               `bson:"isActive" json:"isActive"`
	CreatedAt time.Time          `bson:"createdAt" json:"createdAt"`
	UpdatedAt time.Time          `bson:"updatedAt" json:"updatedAt"`
}

// Order Management Models
type Order struct {
	ID           primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	OrderNumber  string             `bson:"orderNumber" json:"orderNumber"`
	CustomerID   primitive.ObjectID `bson:"customerId" json:"customerId"`
	Customer     *Customer          `bson:"customer,omitempty" json:"customer,omitempty"`
	Status       string             `bson:"status" json:"status"`
	Priority     string             `bson:"priority" json:"priority"` // low, medium, high, urgent
	OrderType    string             `bson:"orderType" json:"orderType"` // standard, express, bulk
	Items        []OrderItem        `bson:"items" json:"items"`
	TotalQuantity int               `bson:"totalQuantity" json:"totalQuantity"`
	TotalValue   float64            `bson:"totalValue" json:"totalValue"`
	DueDate      time.Time          `bson:"dueDate" json:"dueDate"`
	CreatedAt    time.Time          `bson:"createdAt" json:"createdAt"`
	UpdatedAt    time.Time          `bson:"updatedAt" json:"updatedAt"`
}

type OrderItem struct {
	ID             primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	OrderID        primitive.ObjectID `bson:"orderId" json:"orderId"`
	ProductID      primitive.ObjectID `bson:"productId" json:"productId"`
	Product        *Product           `bson:"product,omitempty" json:"product,omitempty"`
	Quantity       int                `bson:"quantity" json:"quantity"`
	QuantityPicked int                `bson:"quantityPicked" json:"quantityPicked"`
	QuantityPacked int                `bson:"quantityPacked" json:"quantityPacked"`
	QuantityShipped int               `bson:"quantityShipped" json:"quantityShipped"`
	Status         string             `bson:"status" json:"status"` // pending, picking, picked, packing, packed, shipped
	Priority       string             `bson:"priority" json:"priority"` // low, medium, high
}

type Customer struct {
	ID        primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	Name      string             `bson:"name" json:"name"`
	Email     string             `bson:"email" json:"email"`
	Phone     string             `bson:"phone" json:"phone"`
	Address   Address            `bson:"address" json:"address"`
	IsActive  bool               `bson:"isActive" json:"isActive"`
}

// Task Management Models
type Task struct {
	ID              primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	Type            string             `bson:"type" json:"type"`
	Status          string             `bson:"status" json:"status"`
	Priority        string             `bson:"priority" json:"priority"` // low, medium, high, urgent
	AssignedTo      *primitive.ObjectID `bson:"assignedTo,omitempty" json:"assignedTo,omitempty"`
	AssignedToUser  *User              `bson:"assignedToUser,omitempty" json:"assignedToUser,omitempty"`
	LocationID      primitive.ObjectID `bson:"locationId" json:"locationId"`
	Location        *Location          `bson:"location,omitempty" json:"location,omitempty"`
	ProductID       *primitive.ObjectID `bson:"productId,omitempty" json:"productId,omitempty"`
	Product         *Product           `bson:"product,omitempty" json:"product,omitempty"`
	Quantity        *int               `bson:"quantity,omitempty" json:"quantity,omitempty"`
	OrderID         *primitive.ObjectID `bson:"orderId,omitempty" json:"orderId,omitempty"`
	Order           *Order             `bson:"order,omitempty" json:"order,omitempty"`
	EstimatedDuration int              `bson:"estimatedDuration" json:"estimatedDuration"` // in minutes
	ActualDuration    *int             `bson:"actualDuration,omitempty" json:"actualDuration,omitempty"`
	StartedAt         *time.Time       `bson:"startedAt,omitempty" json:"startedAt,omitempty"`
	CompletedAt       *time.Time       `bson:"completedAt,omitempty" json:"completedAt,omitempty"`
	CreatedAt         time.Time        `bson:"createdAt" json:"createdAt"`
	UpdatedAt         time.Time        `bson:"updatedAt" json:"updatedAt"`
}

// Common Models
type Address struct {
	Street  string `bson:"street" json:"street"`
	City    string `bson:"city" json:"city"`
	State   string `bson:"state" json:"state"`
	ZipCode string `bson:"zipCode" json:"zipCode"`
	Country string `bson:"country" json:"country"`
}

// API Response Models
type ApiResponse struct {
	Data    interface{} `json:"data"`
	Message string      `json:"message"`
	Success bool        `json:"success"`
	Errors  []string    `json:"errors,omitempty"`
}

type PaginatedResponse struct {
	Data       interface{} `json:"data"`
	Pagination Pagination  `json:"pagination"`
}

type Pagination struct {
	Page       int `json:"page"`
	Limit      int `json:"limit"`
	Total      int `json:"total"`
	TotalPages int `json:"totalPages"`
}

// Analytics Models
type KPI struct {
	ID           primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	Name         string             `bson:"name" json:"name"`
	Value        float64            `bson:"value" json:"value"`
	Unit         string             `bson:"unit" json:"unit"`
	Trend        string             `bson:"trend" json:"trend"` // up, down, stable
	ChangePercent float64           `bson:"changePercent" json:"changePercent"`
	Target       *float64           `bson:"target,omitempty" json:"target,omitempty"`
	Period       string             `bson:"period" json:"period"` // hour, day, week, month
}

type Activity struct {
	ID          primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	Type        string             `bson:"type" json:"type"`
	Description string             `bson:"description" json:"description"`
	UserID      primitive.ObjectID `bson:"userId" json:"userId"`
	User        *User              `bson:"user,omitempty" json:"user,omitempty"`
	Timestamp   time.Time          `bson:"timestamp" json:"timestamp"`
	Metadata    map[string]interface{} `bson:"metadata,omitempty" json:"metadata,omitempty"`
}

type Alert struct {
	ID        primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	Type      string             `bson:"type" json:"type"` // info, warning, error, success
	Title     string             `bson:"title" json:"title"`
	Message   string             `bson:"message" json:"message"`
	Severity  string             `bson:"severity" json:"severity"` // low, medium, high, critical
	IsRead    bool               `bson:"isRead" json:"isRead"`
	CreatedAt time.Time          `bson:"createdAt" json:"createdAt"`
} 

// Shipping Models
type Shipment struct {
	ID          primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	ShipmentNumber string          `bson:"shipment_number" json:"shipment_number"`
	OrderID     primitive.ObjectID `bson:"order_id" json:"order_id"`
	CarrierID   primitive.ObjectID `bson:"carrier_id" json:"carrier_id"`
	Status      string             `bson:"status" json:"status"` // pending, shipped, delivered, cancelled
	TrackingNumber string          `bson:"tracking_number" json:"tracking_number"`
	ShippingDate *time.Time        `bson:"shipping_date" json:"shipping_date"`
	DeliveryDate *time.Time        `bson:"delivery_date" json:"delivery_date"`
	Weight      float64            `bson:"weight" json:"weight"`
	Dimensions  Dimensions         `bson:"dimensions" json:"dimensions"`
	ShippingCost float64           `bson:"shipping_cost" json:"shipping_cost"`
	Notes       string             `bson:"notes" json:"notes"`
	CreatedAt   time.Time          `bson:"created_at" json:"created_at"`
	UpdatedAt   time.Time          `bson:"updated_at" json:"updated_at"`
}

type Carrier struct {
	ID          primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	Name        string             `bson:"name" json:"name"`
	Code        string             `bson:"code" json:"code"`
	ContactInfo ContactInfo        `bson:"contact_info" json:"contact_info"`
	Services    []string           `bson:"services" json:"services"` // ground, air, express, etc.
	IsActive    bool               `bson:"is_active" json:"is_active"`
	CreatedAt   time.Time          `bson:"created_at" json:"created_at"`
	UpdatedAt   time.Time          `bson:"updated_at" json:"updated_at"`
}

type ContactInfo struct {
	Name  string `bson:"name" json:"name"`
	Email string `bson:"email" json:"email"`
	Phone string `bson:"phone" json:"phone"`
}

// Receiving Models
type ASN struct {
	ID              primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	ASNNumber       string             `bson:"asn_number" json:"asn_number"`
	SupplierID      primitive.ObjectID `bson:"supplier_id" json:"supplier_id"`
	ExpectedDate    time.Time          `bson:"expected_date" json:"expected_date"`
	Status          string             `bson:"status" json:"status"` // pending, received, cancelled
	Items           []ASNItem          `bson:"items" json:"items"`
	Notes           string             `bson:"notes" json:"notes"`
	CreatedAt       time.Time          `bson:"created_at" json:"created_at"`
	UpdatedAt       time.Time          `bson:"updated_at" json:"updated_at"`
}

type ASNItem struct {
	ProductID   primitive.ObjectID `bson:"product_id" json:"product_id"`
	Quantity    int                `bson:"quantity" json:"quantity"`
	ReceivedQty int                `bson:"received_qty" json:"received_qty"`
	Status      string             `bson:"status" json:"status"` // pending, received, rejected
}

type QualityCheck struct {
	ID          primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	ASNID       primitive.ObjectID `bson:"asn_id" json:"asn_id"`
	ProductID   primitive.ObjectID `bson:"product_id" json:"product_id"`
	InspectorID primitive.ObjectID `bson:"inspector_id" json:"inspector_id"`
	Status      string             `bson:"status" json:"status"` // pending, passed, failed
	Result      string             `bson:"result" json:"result"` // pass, fail, conditional
	Notes       string             `bson:"notes" json:"notes"`
	CreatedAt   time.Time          `bson:"created_at" json:"created_at"`
	UpdatedAt   time.Time          `bson:"updated_at" json:"updated_at"`
}

// Labor Management Models
type Worker struct {
	ID          primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	EmployeeID  string             `bson:"employee_id" json:"employee_id"`
	FirstName   string             `bson:"first_name" json:"first_name"`
	LastName    string             `bson:"last_name" json:"last_name"`
	Email       string             `bson:"email" json:"email"`
	Phone       string             `bson:"phone" json:"phone"`
	Department  string             `bson:"department" json:"department"`
	Position    string             `bson:"position" json:"position"`
	HireDate    time.Time          `bson:"hire_date" json:"hire_date"`
	IsActive    bool               `bson:"is_active" json:"is_active"`
	Skills      []string           `bson:"skills" json:"skills"`
	CreatedAt   time.Time          `bson:"created_at" json:"created_at"`
	UpdatedAt   time.Time          `bson:"updated_at" json:"updated_at"`
}

type Shift struct {
	ID          primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	WorkerID    primitive.ObjectID `bson:"worker_id" json:"worker_id"`
	StartTime   time.Time          `bson:"start_time" json:"start_time"`
	EndTime     time.Time          `bson:"end_time" json:"end_time"`
	Type        string             `bson:"type" json:"type"` // morning, afternoon, night
	Status      string             `bson:"status" json:"status"` // scheduled, active, completed, cancelled
	CreatedAt   time.Time          `bson:"created_at" json:"created_at"`
	UpdatedAt   time.Time          `bson:"updated_at" json:"updated_at"`
}

type Performance struct {
	ID          primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	WorkerID    primitive.ObjectID `bson:"worker_id" json:"worker_id"`
	Date        time.Time          `bson:"date" json:"date"`
	TasksCompleted int             `bson:"tasks_completed" json:"tasks_completed"`
	HoursWorked float64            `bson:"hours_worked" json:"hours_worked"`
	Efficiency  float64            `bson:"efficiency" json:"efficiency"` // percentage
	Accuracy    float64            `bson:"accuracy" json:"accuracy"`     // percentage
	CreatedAt   time.Time          `bson:"created_at" json:"created_at"`
	UpdatedAt   time.Time          `bson:"updated_at" json:"updated_at"`
}

// Automation Models
type WorkflowRule struct {
	ID          primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	Name        string             `bson:"name" json:"name"`
	Description string             `bson:"description" json:"description"`
	Trigger     string             `bson:"trigger" json:"trigger"` // event type
	Conditions  []Condition        `bson:"conditions" json:"conditions"`
	Actions     []Action           `bson:"actions" json:"actions"`
	IsActive    bool               `bson:"is_active" json:"is_active"`
	CreatedAt   time.Time          `bson:"created_at" json:"created_at"`
	UpdatedAt   time.Time          `bson:"updated_at" json:"updated_at"`
}

type Condition struct {
	Field    string `bson:"field" json:"field"`
	Operator string `bson:"operator" json:"operator"` // equals, not_equals, greater_than, etc.
	Value    string `bson:"value" json:"value"`
}

type Action struct {
	Type    string                 `bson:"type" json:"type"` // create_task, send_notification, update_status
	Params  map[string]interface{} `bson:"params" json:"params"`
}

type Integration struct {
	ID          primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	Name        string             `bson:"name" json:"name"`
	Type        string             `bson:"type" json:"type"` // erp, tms, oms, etc.
	Config      map[string]string  `bson:"config" json:"config"`
	IsActive    bool               `bson:"is_active" json:"is_active"`
	LastSync    *time.Time         `bson:"last_sync" json:"last_sync"`
	CreatedAt   time.Time          `bson:"created_at" json:"created_at"`
	UpdatedAt   time.Time          `bson:"updated_at" json:"updated_at"`
}

type SystemStatus struct {
	ID          primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	Component   string             `bson:"component" json:"component"`
	Status      string             `bson:"status" json:"status"` // healthy, warning, error
	Message     string             `bson:"message" json:"message"`
	LastCheck   time.Time          `bson:"last_check" json:"last_check"`
	CreatedAt   time.Time          `bson:"created_at" json:"created_at"`
	UpdatedAt   time.Time          `bson:"updated_at" json:"updated_at"`
} 