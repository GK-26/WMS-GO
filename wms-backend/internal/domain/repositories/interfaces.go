package repositories

import (
	"context"

	"go.mongodb.org/mongo-driver/bson/primitive"
	"wms-backend/internal/domain/entities"
)

type UserRepository interface {
	Create(ctx context.Context, user *entities.User) error
	GetByID(ctx context.Context, id primitive.ObjectID) (*entities.User, error)
	GetByUsername(ctx context.Context, username string) (*entities.User, error)
	GetByEmail(ctx context.Context, email string) (*entities.User, error)
	Update(ctx context.Context, user *entities.User) error
	Delete(ctx context.Context, id primitive.ObjectID) error
	List(ctx context.Context, limit, offset int) ([]*entities.User, error)
	UpdateLastLogin(ctx context.Context, id primitive.ObjectID) error
}

type ProductRepository interface {
	Create(ctx context.Context, product *entities.Product) error
	GetByID(ctx context.Context, id primitive.ObjectID) (*entities.Product, error)
	GetBySKU(ctx context.Context, sku string) (*entities.Product, error)
	Update(ctx context.Context, product *entities.Product) error
	Delete(ctx context.Context, id primitive.ObjectID) error
	List(ctx context.Context, limit, offset int) ([]*entities.Product, error)
	Search(ctx context.Context, query string, limit, offset int) ([]*entities.Product, error)
	GetByCategory(ctx context.Context, category string, limit, offset int) ([]*entities.Product, error)
	GetLowStockProducts(ctx context.Context) ([]*entities.Product, error)
}

type InventoryItemRepository interface {
	Create(ctx context.Context, item *entities.InventoryItem) error
	GetByID(ctx context.Context, id primitive.ObjectID) (*entities.InventoryItem, error)
	Update(ctx context.Context, item *entities.InventoryItem) error
	Delete(ctx context.Context, id primitive.ObjectID) error
	List(ctx context.Context, limit, offset int) ([]*entities.InventoryItem, error)
	GetByProductID(ctx context.Context, productID primitive.ObjectID) ([]*entities.InventoryItem, error)
	GetByLocationID(ctx context.Context, locationID primitive.ObjectID) ([]*entities.InventoryItem, error)
	GetByStatus(ctx context.Context, status entities.ItemStatus) ([]*entities.InventoryItem, error)
	GetExpiredItems(ctx context.Context) ([]*entities.InventoryItem, error)
	UpdateQuantity(ctx context.Context, id primitive.ObjectID, quantity int) error
}

type LocationRepository interface {
	Create(ctx context.Context, location *entities.Location) error
	GetByID(ctx context.Context, id primitive.ObjectID) (*entities.Location, error)
	Update(ctx context.Context, location *entities.Location) error
	Delete(ctx context.Context, id primitive.ObjectID) error
	List(ctx context.Context, limit, offset int) ([]*entities.Location, error)
	GetByWarehouse(ctx context.Context, warehouseID primitive.ObjectID) ([]*entities.Location, error)
	GetByType(ctx context.Context, locationType entities.LocationType) ([]*entities.Location, error)
	GetAvailableLocations(ctx context.Context) ([]*entities.Location, error)
}

type OrderRepository interface {
	Create(ctx context.Context, order *entities.Order) error
	GetByID(ctx context.Context, id primitive.ObjectID) (*entities.Order, error)
	GetByOrderNumber(ctx context.Context, orderNumber string) (*entities.Order, error)
	Update(ctx context.Context, order *entities.Order) error
	Delete(ctx context.Context, id primitive.ObjectID) error
	List(ctx context.Context, limit, offset int) ([]*entities.Order, error)
	GetByStatus(ctx context.Context, status entities.OrderStatus) ([]*entities.Order, error)
	GetByCustomer(ctx context.Context, customerID primitive.ObjectID) ([]*entities.Order, error)
	GetOverdueOrders(ctx context.Context) ([]*entities.Order, error)
	GetUrgentOrders(ctx context.Context) ([]*entities.Order, error)
}

type CustomerRepository interface {
	Create(ctx context.Context, customer *entities.Customer) error
	GetByID(ctx context.Context, id primitive.ObjectID) (*entities.Customer, error)
	GetByEmail(ctx context.Context, email string) (*entities.Customer, error)
	Update(ctx context.Context, customer *entities.Customer) error
	Delete(ctx context.Context, id primitive.ObjectID) error
	List(ctx context.Context, limit, offset int) ([]*entities.Customer, error)
	Search(ctx context.Context, query string) ([]*entities.Customer, error)
}

type TaskRepository interface {
	Create(ctx context.Context, task *entities.Task) error
	GetByID(ctx context.Context, id primitive.ObjectID) (*entities.Task, error)
	Update(ctx context.Context, task *entities.Task) error
	Delete(ctx context.Context, id primitive.ObjectID) error
	List(ctx context.Context, limit, offset int) ([]*entities.Task, error)
	GetByAssignee(ctx context.Context, userID primitive.ObjectID) ([]*entities.Task, error)
	GetByStatus(ctx context.Context, status entities.TaskStatus) ([]*entities.Task, error)
	GetByType(ctx context.Context, taskType entities.TaskType) ([]*entities.Task, error)
	GetOverdueTasks(ctx context.Context) ([]*entities.Task, error)
	GetUnassignedTasks(ctx context.Context) ([]*entities.Task, error)
	Assign(ctx context.Context, taskID, userID primitive.ObjectID) error
	Start(ctx context.Context, id primitive.ObjectID) error
	Complete(ctx context.Context, id primitive.ObjectID, notes string) error
}

type RoleRepository interface {
	Create(ctx context.Context, role *entities.Role) error
	GetByID(ctx context.Context, id primitive.ObjectID) (*entities.Role, error)
	GetByName(ctx context.Context, name string) (*entities.Role, error)
	Update(ctx context.Context, role *entities.Role) error
	Delete(ctx context.Context, id primitive.ObjectID) error
	List(ctx context.Context) ([]*entities.Role, error)
}