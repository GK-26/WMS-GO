package entities

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type User struct {
	ID          primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	Username    string             `bson:"username" json:"username"`
	Email       string             `bson:"email" json:"email"`
	FirstName   string             `bson:"first_name" json:"firstName"`
	LastName    string             `bson:"last_name" json:"lastName"`
	Password    string             `bson:"password" json:"-"`
	Roles       []string           `bson:"roles" json:"roles"`
	IsActive    bool               `bson:"is_active" json:"isActive"`
	LastLogin   *time.Time         `bson:"last_login,omitempty" json:"lastLogin,omitempty"`
	CreatedAt   time.Time          `bson:"created_at" json:"createdAt"`
	UpdatedAt   time.Time          `bson:"updated_at" json:"updatedAt"`
}

type Role struct {
	ID          primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	Name        string             `bson:"name" json:"name"`
	Description string             `bson:"description" json:"description"`
	Permissions []string           `bson:"permissions" json:"permissions"`
	CreatedAt   time.Time          `bson:"created_at" json:"createdAt"`
	UpdatedAt   time.Time          `bson:"updated_at" json:"updatedAt"`
}

func (u *User) HasRole(role string) bool {
	for _, r := range u.Roles {
		if r == role {
			return true
		}
	}
	return false
}

func (u *User) IsAdmin() bool {
	return u.HasRole("admin")
}

func (u *User) CanManageInventory() bool {
	return u.HasRole("admin") || u.HasRole("manager")
}