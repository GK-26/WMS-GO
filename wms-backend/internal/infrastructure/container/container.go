package container

import (
	"go.mongodb.org/mongo-driver/mongo"
	"wms-backend/internal/domain/repositories"
	"wms-backend/internal/domain/services"
	"wms-backend/internal/infrastructure/http/handlers"
	"wms-backend/internal/infrastructure/logger"
	mongoRepos "wms-backend/internal/infrastructure/repositories"
)

type Container struct {
	// Infrastructure
	Logger logger.Logger
	DB     *mongo.Database

	// Repositories
	UserRepo    repositories.UserRepository
	ProductRepo repositories.ProductRepository
	OrderRepo   repositories.OrderRepository

	// Services
	UserService    services.UserService
	ProductService services.ProductService

	// Handlers
	UserHandler    *handlers.UserHandler
	ProductHandler *handlers.ProductHandler
}

func NewContainer(db *mongo.Database, logLevel string) *Container {
	c := &Container{
		DB:     db,
		Logger: logger.New(logLevel),
	}

	c.initRepositories()
	c.initServices()
	c.initHandlers()

	return c
}

func (c *Container) initRepositories() {
	c.UserRepo = mongoRepos.NewUserRepository(c.DB)
	c.ProductRepo = mongoRepos.NewProductRepository(c.DB)
	c.OrderRepo = mongoRepos.NewOrderRepository(c.DB)
}

func (c *Container) initServices() {
	c.UserService = services.NewUserService(c.UserRepo, c.Logger)
	c.ProductService = services.NewProductService(c.ProductRepo, c.Logger)
}

func (c *Container) initHandlers() {
	c.UserHandler = handlers.NewUserHandler(c.UserService, c.Logger)
	c.ProductHandler = handlers.NewProductHandler(c.ProductService, c.Logger)
}