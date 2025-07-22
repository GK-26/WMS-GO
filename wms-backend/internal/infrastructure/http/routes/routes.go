package routes

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"wms-backend/internal/infrastructure/container"
	"wms-backend/internal/middleware"
)

func SetupRoutes(container *container.Container) *gin.Engine {
	router := gin.New()

	// Add middleware
	router.Use(gin.Logger())
	router.Use(gin.Recovery())
	router.Use(middleware.CORSMiddleware())

	// Health check endpoint
	router.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status":    "healthy",
			"timestamp": time.Now().UTC(),
			"version":   "2.0.0",
			"service":   "WMS Backend",
		})
	})

	// API routes
	apiV1 := router.Group("/api/v1")
	{
		// Auth routes (public)
		auth := apiV1.Group("/auth")
		{
			auth.POST("/login", container.UserHandler.Login)
			auth.POST("/register", container.UserHandler.Register)
			auth.POST("/refresh", container.UserHandler.RefreshToken)
		}

		// Protected routes
		protected := apiV1.Group("/")
		protected.Use(middleware.AuthMiddleware())
		{
			// Profile route
			protected.GET("/profile", container.UserHandler.GetProfile)

			// User management (admin only)
			admin := protected.Group("")
			admin.Use(middleware.RoleMiddleware("admin"))
			{
				admin.GET("/users", container.UserHandler.ListUsers)
				admin.GET("/users/:id", container.UserHandler.GetUser)
				admin.POST("/users", container.UserHandler.CreateUser)
				admin.PUT("/users/:id", container.UserHandler.UpdateUser)
				admin.DELETE("/users/:id", container.UserHandler.DeleteUser)
			}

			// Product management (admin and manager)
			inventory := protected.Group("")
			inventory.Use(middleware.RoleMiddleware("admin", "manager"))
			{
				inventory.GET("/products", container.ProductHandler.ListProducts)
				inventory.GET("/products/:id", container.ProductHandler.GetProduct)
				inventory.GET("/products/sku/:sku", container.ProductHandler.GetProductBySKU)
				inventory.POST("/products", container.ProductHandler.CreateProduct)
				inventory.PUT("/products/:id", container.ProductHandler.UpdateProduct)
				inventory.DELETE("/products/:id", container.ProductHandler.DeleteProduct)
				inventory.GET("/products/low-stock", container.ProductHandler.GetLowStockProducts)
			}

			// TODO: Add more route groups for orders, tasks, etc.
		}
	}

	return router
}