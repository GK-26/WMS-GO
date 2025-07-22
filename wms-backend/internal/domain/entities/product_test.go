package entities

import (
	"testing"
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

func TestProduct_IsLowStock(t *testing.T) {
	product := &Product{
		ID:           primitive.NewObjectID(),
		SKU:          "TEST-001",
		Name:         "Test Product",
		ReorderPoint: 10,
	}

	tests := []struct {
		name            string
		currentQuantity int
		expected        bool
	}{
		{
			name:            "quantity below reorder point",
			currentQuantity: 5,
			expected:        true,
		},
		{
			name:            "quantity equal to reorder point",
			currentQuantity: 10,
			expected:        true,
		},
		{
			name:            "quantity above reorder point",
			currentQuantity: 15,
			expected:        false,
		},
		{
			name:            "zero quantity",
			currentQuantity: 0,
			expected:        true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := product.IsLowStock(tt.currentQuantity)
			if result != tt.expected {
				t.Errorf("IsLowStock(%d) = %v, want %v", tt.currentQuantity, result, tt.expected)
			}
		})
	}
}

func TestProduct_IsOverstock(t *testing.T) {
	product := &Product{
		ID:            primitive.NewObjectID(),
		SKU:           "TEST-001",
		Name:          "Test Product",
		MaxStockLevel: 100,
	}

	tests := []struct {
		name            string
		currentQuantity int
		expected        bool
	}{
		{
			name:            "quantity below max stock level",
			currentQuantity: 50,
			expected:        false,
		},
		{
			name:            "quantity equal to max stock level",
			currentQuantity: 100,
			expected:        false,
		},
		{
			name:            "quantity above max stock level",
			currentQuantity: 150,
			expected:        true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := product.IsOverstock(tt.currentQuantity)
			if result != tt.expected {
				t.Errorf("IsOverstock(%d) = %v, want %v", tt.currentQuantity, result, tt.expected)
			}
		})
	}
}

func TestInventoryItem_IsExpired(t *testing.T) {
	now := time.Now()
	pastDate := now.Add(-24 * time.Hour)
	futureDate := now.Add(24 * time.Hour)

	tests := []struct {
		name           string
		expirationDate *time.Time
		expected       bool
	}{
		{
			name:           "item is expired",
			expirationDate: &pastDate,
			expected:       true,
		},
		{
			name:           "item is not expired",
			expirationDate: &futureDate,
			expected:       false,
		},
		{
			name:           "item has no expiration date",
			expirationDate: nil,
			expected:       false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			item := &InventoryItem{
				ID:             primitive.NewObjectID(),
				ProductID:      primitive.NewObjectID(),
				ExpirationDate: tt.expirationDate,
			}

			result := item.IsExpired()
			if result != tt.expected {
				t.Errorf("IsExpired() = %v, want %v", result, tt.expected)
			}
		})
	}
}

func TestInventoryItem_IsAvailable(t *testing.T) {
	now := time.Now()
	pastDate := now.Add(-24 * time.Hour)
	futureDate := now.Add(24 * time.Hour)

	tests := []struct {
		name           string
		status         ItemStatus
		expirationDate *time.Time
		expected       bool
	}{
		{
			name:           "available item not expired",
			status:         ItemStatusAvailable,
			expirationDate: &futureDate,
			expected:       true,
		},
		{
			name:           "available item expired",
			status:         ItemStatusAvailable,
			expirationDate: &pastDate,
			expected:       false,
		},
		{
			name:           "reserved item not expired",
			status:         ItemStatusReserved,
			expirationDate: &futureDate,
			expected:       false,
		},
		{
			name:           "available item no expiration",
			status:         ItemStatusAvailable,
			expirationDate: nil,
			expected:       true,
		},
		{
			name:           "damaged item",
			status:         ItemStatusDamaged,
			expirationDate: &futureDate,
			expected:       false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			item := &InventoryItem{
				ID:             primitive.NewObjectID(),
				ProductID:      primitive.NewObjectID(),
				Status:         tt.status,
				ExpirationDate: tt.expirationDate,
			}

			result := item.IsAvailable()
			if result != tt.expected {
				t.Errorf("IsAvailable() = %v, want %v", result, tt.expected)
			}
		})
	}
}