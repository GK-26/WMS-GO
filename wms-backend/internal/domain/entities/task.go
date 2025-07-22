package entities

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Task struct {
	ID                primitive.ObjectID  `bson:"_id,omitempty" json:"id"`
	Type              TaskType            `bson:"type" json:"type"`
	Status            TaskStatus          `bson:"status" json:"status"`
	Priority          Priority            `bson:"priority" json:"priority"`
	AssignedTo        *primitive.ObjectID `bson:"assigned_to,omitempty" json:"assignedTo,omitempty"`
	AssignedToUser    *User               `bson:"assigned_to_user,omitempty" json:"assignedToUser,omitempty"`
	LocationID        primitive.ObjectID  `bson:"location_id" json:"locationId"`
	Location          *Location           `bson:"location,omitempty" json:"location,omitempty"`
	ProductID         *primitive.ObjectID `bson:"product_id,omitempty" json:"productId,omitempty"`
	Product           *Product            `bson:"product,omitempty" json:"product,omitempty"`
	Quantity          *int                `bson:"quantity,omitempty" json:"quantity,omitempty"`
	OrderID           *primitive.ObjectID `bson:"order_id,omitempty" json:"orderId,omitempty"`
	Order             *Order              `bson:"order,omitempty" json:"order,omitempty"`
	EstimatedDuration int                 `bson:"estimated_duration" json:"estimatedDuration"` // in minutes
	ActualDuration    *int                `bson:"actual_duration,omitempty" json:"actualDuration,omitempty"`
	Instructions      string              `bson:"instructions" json:"instructions"`
	Notes             string              `bson:"notes" json:"notes"`
	StartedAt         *time.Time          `bson:"started_at,omitempty" json:"startedAt,omitempty"`
	CompletedAt       *time.Time          `bson:"completed_at,omitempty" json:"completedAt,omitempty"`
	DueDate           *time.Time          `bson:"due_date,omitempty" json:"dueDate,omitempty"`
	CreatedAt         time.Time           `bson:"created_at" json:"createdAt"`
	UpdatedAt         time.Time           `bson:"updated_at" json:"updatedAt"`
}

type TaskType string

const (
	TaskTypePicking   TaskType = "picking"
	TaskTypePacking   TaskType = "packing"
	TaskTypeReceiving TaskType = "receiving"
	TaskTypePutaway   TaskType = "putaway"
	TaskTypeReplenish TaskType = "replenish"
	TaskTypeCounting  TaskType = "counting"
	TaskTypeMovement  TaskType = "movement"
)

type TaskStatus string

const (
	TaskStatusPending    TaskStatus = "pending"
	TaskStatusAssigned   TaskStatus = "assigned"
	TaskStatusInProgress TaskStatus = "in_progress"
	TaskStatusCompleted  TaskStatus = "completed"
	TaskStatusCancelled  TaskStatus = "cancelled"
	TaskStatusOnHold     TaskStatus = "on_hold"
)

func (t *Task) IsOverdue() bool {
	if t.DueDate == nil {
		return false
	}
	return time.Now().After(*t.DueDate) && 
		t.Status != TaskStatusCompleted && 
		t.Status != TaskStatusCancelled
}

func (t *Task) CanBeStarted() bool {
	return t.Status == TaskStatusPending || t.Status == TaskStatusAssigned
}

func (t *Task) CanBeCompleted() bool {
	return t.Status == TaskStatusInProgress
}

func (t *Task) CanBeCancelled() bool {
	return t.Status != TaskStatusCompleted && t.Status != TaskStatusCancelled
}

func (t *Task) IsAssigned() bool {
	return t.AssignedTo != nil
}

func (t *Task) GetActualDurationMinutes() int {
	if t.ActualDuration != nil {
		return *t.ActualDuration
	}
	if t.StartedAt != nil && t.CompletedAt != nil {
		return int(t.CompletedAt.Sub(*t.StartedAt).Minutes())
	}
	return 0
}

func (t *Task) IsEfficient() bool {
	actual := t.GetActualDurationMinutes()
	if actual == 0 {
		return true
	}
	return actual <= t.EstimatedDuration
}