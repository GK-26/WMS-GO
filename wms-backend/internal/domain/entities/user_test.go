package entities

import (
	"testing"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

func TestUser_HasRole(t *testing.T) {
	user := &User{
		ID:       primitive.NewObjectID(),
		Username: "testuser",
		Roles:    []string{"admin", "manager"},
	}

	tests := []struct {
		name     string
		role     string
		expected bool
	}{
		{
			name:     "user has admin role",
			role:     "admin",
			expected: true,
		},
		{
			name:     "user has manager role",
			role:     "manager",
			expected: true,
		},
		{
			name:     "user does not have worker role",
			role:     "worker",
			expected: false,
		},
		{
			name:     "empty role",
			role:     "",
			expected: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := user.HasRole(tt.role)
			if result != tt.expected {
				t.Errorf("HasRole(%s) = %v, want %v", tt.role, result, tt.expected)
			}
		})
	}
}

func TestUser_IsAdmin(t *testing.T) {
	tests := []struct {
		name     string
		roles    []string
		expected bool
	}{
		{
			name:     "user is admin",
			roles:    []string{"admin", "manager"},
			expected: true,
		},
		{
			name:     "user is not admin",
			roles:    []string{"manager", "worker"},
			expected: false,
		},
		{
			name:     "user has no roles",
			roles:    []string{},
			expected: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			user := &User{
				ID:       primitive.NewObjectID(),
				Username: "testuser",
				Roles:    tt.roles,
			}

			result := user.IsAdmin()
			if result != tt.expected {
				t.Errorf("IsAdmin() = %v, want %v", result, tt.expected)
			}
		})
	}
}

func TestUser_CanManageInventory(t *testing.T) {
	tests := []struct {
		name     string
		roles    []string
		expected bool
	}{
		{
			name:     "admin can manage inventory",
			roles:    []string{"admin"},
			expected: true,
		},
		{
			name:     "manager can manage inventory",
			roles:    []string{"manager"},
			expected: true,
		},
		{
			name:     "admin and manager can manage inventory",
			roles:    []string{"admin", "manager"},
			expected: true,
		},
		{
			name:     "worker cannot manage inventory",
			roles:    []string{"worker"},
			expected: false,
		},
		{
			name:     "user with no roles cannot manage inventory",
			roles:    []string{},
			expected: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			user := &User{
				ID:       primitive.NewObjectID(),
				Username: "testuser",
				Roles:    tt.roles,
			}

			result := user.CanManageInventory()
			if result != tt.expected {
				t.Errorf("CanManageInventory() = %v, want %v", result, tt.expected)
			}
		})
	}
}