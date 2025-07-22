package entities

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Product struct {
	ID                    primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	SKU                   string             `bson:"sku" json:"sku"`
	Name                  string             `bson:"name" json:"name"`
	Description           string             `bson:"description" json:"description"`
	Category              string             `bson:"category" json:"category"`
	Dimensions            Dimensions         `bson:"dimensions" json:"dimensions"`
	IsHazardous           bool               `bson:"is_hazardous" json:"isHazardous"`
	RequiresRefrigeration bool               `bson:"requires_refrigeration" json:"requiresRefrigeration"`
	LotTracking           bool               `bson:"lot_tracking" json:"lotTracking"`
	SerialTracking        bool               `bson:"serial_tracking" json:"serialTracking"`
	MinStockLevel         int                `bson:"min_stock_level" json:"minStockLevel"`
	MaxStockLevel         int                `bson:"max_stock_level" json:"maxStockLevel"`
	ReorderPoint          int                `bson:"reorder_point" json:"reorderPoint"`
	SupplierID            *primitive.ObjectID `bson:"supplier_id,omitempty" json:"supplierId,omitempty"`
	CreatedAt             time.Time          `bson:"created_at" json:"createdAt"`
	UpdatedAt             time.Time          `bson:"updated_at" json:"updatedAt"`
}

type Dimensions struct {
	Length float64 `bson:"length" json:"length"`
	Width  float64 `bson:"width" json:"width"`
	Height float64 `bson:"height" json:"height"`
	Weight float64 `bson:"weight" json:"weight"`
}

type InventoryItem struct {
	ID             primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	ProductID      primitive.ObjectID `bson:"product_id" json:"productId"`
	Product        *Product           `bson:"product,omitempty" json:"product,omitempty"`
	Quantity       int                `bson:"quantity" json:"quantity"`
	LocationID     primitive.ObjectID `bson:"location_id" json:"locationId"`
	Location       *Location          `bson:"location,omitempty" json:"location,omitempty"`
	LotNumber      *string            `bson:"lot_number,omitempty" json:"lotNumber,omitempty"`
	SerialNumber   *string            `bson:"serial_number,omitempty" json:"serialNumber,omitempty"`
	ExpirationDate *time.Time         `bson:"expiration_date,omitempty" json:"expirationDate,omitempty"`
	Status         ItemStatus         `bson:"status" json:"status"`
	LastCounted    time.Time          `bson:"last_counted" json:"lastCounted"`
	CreatedAt      time.Time          `bson:"created_at" json:"createdAt"`
	UpdatedAt      time.Time          `bson:"updated_at" json:"updatedAt"`
}

type ItemStatus string

const (
	ItemStatusAvailable  ItemStatus = "available"
	ItemStatusReserved   ItemStatus = "reserved"
	ItemStatusQuarantine ItemStatus = "quarantine"
	ItemStatusDamaged    ItemStatus = "damaged"
)

type Location struct {
	ID          primitive.ObjectID  `bson:"_id,omitempty" json:"id"`
	Name        string              `bson:"name" json:"name"`
	Type        LocationType        `bson:"type" json:"type"`
	ParentID    *primitive.ObjectID `bson:"parent_id,omitempty" json:"parentId,omitempty"`
	WarehouseID primitive.ObjectID  `bson:"warehouse_id" json:"warehouseId"`
	Coordinates *Coordinates        `bson:"coordinates,omitempty" json:"coordinates,omitempty"`
	Capacity    int                 `bson:"capacity" json:"capacity"`
	IsActive    bool                `bson:"is_active" json:"isActive"`
	CreatedAt   time.Time           `bson:"created_at" json:"createdAt"`
	UpdatedAt   time.Time           `bson:"updated_at" json:"updatedAt"`
}

type LocationType string

const (
	LocationTypeZone  LocationType = "zone"
	LocationTypeAisle LocationType = "aisle"
	LocationTypeRack  LocationType = "rack"
	LocationTypeBin   LocationType = "bin"
)

type Coordinates struct {
	X float64 `bson:"x" json:"x"`
	Y float64 `bson:"y" json:"y"`
	Z float64 `bson:"z" json:"z"`
}

func (p *Product) IsLowStock(currentQuantity int) bool {
	return currentQuantity <= p.ReorderPoint
}

func (p *Product) IsOverstock(currentQuantity int) bool {
	return currentQuantity > p.MaxStockLevel
}

func (i *InventoryItem) IsExpired() bool {
	if i.ExpirationDate == nil {
		return false
	}
	return time.Now().After(*i.ExpirationDate)
}

func (i *InventoryItem) IsAvailable() bool {
	return i.Status == ItemStatusAvailable && !i.IsExpired()
}