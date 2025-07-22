package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"
	"wms-backend/internal/api"
	"wms-backend/internal/config"
	"wms-backend/internal/db"
	"wms-backend/internal/middleware"
	"wms-backend/internal/services"
)

func main() {
	// Load configuration
	config.Load()

	// Set Gin mode based on environment
	if config.AppConfig.Server.Env == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	// Connect to database
	if err := db.Connect(); err != nil {
		log.Fatal("Failed to connect to database:", err)
	}
	defer db.Disconnect()

	// Create indexes
	if err := db.CreateIndexes(); err != nil {
		log.Fatal("Failed to create database indexes:", err)
	}

	// Auto-seed dummy data if database is empty
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	
	if err := services.AutoSeedData(ctx); err != nil {
		log.Printf("Warning: Failed to auto-seed dummy data: %v", err)
		// Don't fail the startup, just log the warning
	}

	// Initialize router
	router := gin.Default()

	// Add middleware
	router.Use(middleware.CORSMiddleware())
	router.Use(gin.Logger())
	router.Use(gin.Recovery())

	// Health check endpoint
	router.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status":  "ok",
			"message": "WMS Backend is running",
			"time":    time.Now().Format(time.RFC3339),
		})
	})

	// API routes
	apiV1 := router.Group("/api/v1")
	{
		// Auth routes (public)
		auth := apiV1.Group("/auth")
		{
			auth.POST("/login", api.Login)
			auth.POST("/register", api.Register)
			auth.POST("/refresh", api.RefreshToken)
		}

		// Protected routes
		protected := apiV1.Group("/")
		protected.Use(middleware.AuthMiddleware())
		{
			// User routes
			protected.GET("/profile", api.GetProfile)

			// User management (admin only)
			admin := protected.Group("")
			admin.Use(middleware.RoleMiddleware("admin"))
			{
				admin.GET("/users", api.ListUsers)
				admin.GET("/users/:id", api.GetUser)
				admin.POST("/users", api.CreateUser)
				admin.PUT("/users/:id", api.UpdateUser)
				admin.DELETE("/users/:id", api.DeleteUser)

				admin.GET("/roles", api.ListRoles)
				admin.GET("/roles/:id", api.GetRole)
				admin.POST("/roles", api.CreateRole)
				admin.PUT("/roles/:id", api.UpdateRole)
				admin.DELETE("/roles/:id", api.DeleteRole)
			}

			// Inventory management (admin and manager)
			inventory := protected.Group("")
			inventory.Use(middleware.RoleMiddleware("admin", "manager"))
			{
				// Products
				inventory.GET("/products", api.ListProducts)
				inventory.GET("/products/:id", api.GetProduct)
				inventory.POST("/products", api.CreateProduct)
				inventory.PUT("/products/:id", api.UpdateProduct)
				inventory.DELETE("/products/:id", api.DeleteProduct)

				// Inventory items
				inventory.GET("/inventory-items", api.ListInventoryItems)
				inventory.GET("/inventory-items/:id", api.GetInventoryItem)
				inventory.POST("/inventory-items", api.CreateInventoryItem)
				inventory.PUT("/inventory-items/:id", api.UpdateInventoryItem)
				inventory.DELETE("/inventory-items/:id", api.DeleteInventoryItem)

				// Locations
				inventory.GET("/locations", api.ListLocations)
				inventory.GET("/locations/:id", api.GetLocation)
				inventory.POST("/locations", api.CreateLocation)
				inventory.PUT("/locations/:id", api.UpdateLocation)
				inventory.DELETE("/locations/:id", api.DeleteLocation)
			}

			// Order management (admin and manager)
			orders := protected.Group("")
			orders.Use(middleware.RoleMiddleware("admin", "manager"))
			{
				// Orders
				orders.GET("/orders", api.ListOrders)
				orders.GET("/orders/:id", api.GetOrder)
				orders.POST("/orders", api.CreateOrder)
				orders.PUT("/orders/:id", api.UpdateOrder)
				orders.DELETE("/orders/:id", api.DeleteOrder)

				// Customers
				orders.GET("/customers", api.ListCustomers)
				orders.GET("/customers/:id", api.GetCustomer)
				orders.POST("/customers", api.CreateCustomer)
				orders.PUT("/customers/:id", api.UpdateCustomer)
				orders.DELETE("/customers/:id", api.DeleteCustomer)
			}

			// Task management (admin, manager, and worker)
			tasks := protected.Group("")
			tasks.Use(middleware.RoleMiddleware("admin", "manager", "worker"))
			{
				tasks.GET("/tasks", api.ListTasks)
				tasks.GET("/tasks/:id", api.GetTask)
				tasks.POST("/tasks", api.CreateTask)
				tasks.PUT("/tasks/:id", api.UpdateTask)
				tasks.DELETE("/tasks/:id", api.DeleteTask)
				tasks.POST("/tasks/:id/assign", api.AssignTask)
				tasks.POST("/tasks/:id/start", api.StartTask)
				tasks.POST("/tasks/:id/complete", api.CompleteTask)
			}

			// Reports and analytics (admin and manager)
			reports := protected.Group("")
			reports.Use(middleware.RoleMiddleware("admin", "manager"))
			{
				reports.GET("/dashboard", api.GetDashboardData)
				reports.GET("/reports/inventory", api.GetInventoryReport)
				reports.GET("/reports/orders", api.GetOrderReport)
				reports.GET("/reports/tasks", api.GetTaskReport)
				reports.GET("/activities", api.ListActivities)
				reports.POST("/activities", api.CreateActivity)
				reports.GET("/alerts", api.ListAlerts)
				reports.POST("/alerts", api.CreateAlert)
				reports.PUT("/alerts/:id/read", api.MarkAlertAsRead)
				reports.DELETE("/alerts/:id", api.DeleteAlert)
			}

			// Shipping Management (admin, manager, and worker)
			shipping := protected.Group("")
			shipping.Use(middleware.RoleMiddleware("admin", "manager", "worker"))
			{
				shipping.GET("/shipments", api.ListShipments)
				shipping.GET("/shipments/:id", api.GetShipment)
				shipping.POST("/shipments", api.CreateShipment)
				shipping.PUT("/shipments/:id", api.UpdateShipment)
				shipping.DELETE("/shipments/:id", api.DeleteShipment)
				
				shipping.GET("/carriers", api.ListCarriers)
				shipping.GET("/carriers/:id", api.GetCarrier)
				shipping.POST("/carriers", api.CreateCarrier)
				shipping.PUT("/carriers/:id", api.UpdateCarrier)
				shipping.DELETE("/carriers/:id", api.DeleteCarrier)
			}

			// Receiving Management (admin, manager, and worker)
			receiving := protected.Group("")
			receiving.Use(middleware.RoleMiddleware("admin", "manager", "worker"))
			{
				receiving.GET("/asns", api.ListASNs)
				receiving.GET("/asns/:id", api.GetASN)
				receiving.POST("/asns", api.CreateASN)
				receiving.PUT("/asns/:id", api.UpdateASN)
				receiving.DELETE("/asns/:id", api.DeleteASN)
				receiving.POST("/asns/:id/receive", api.ReceiveASNItem)
				
				receiving.GET("/quality-checks", api.ListQualityChecks)
				receiving.GET("/quality-checks/:id", api.GetQualityCheck)
				receiving.POST("/quality-checks", api.CreateQualityCheck)
				receiving.PUT("/quality-checks/:id", api.UpdateQualityCheck)
				receiving.DELETE("/quality-checks/:id", api.DeleteQualityCheck)
			}

			// Labor Management (admin and manager)
			labor := protected.Group("")
			labor.Use(middleware.RoleMiddleware("admin", "manager"))
			{
				labor.GET("/workers", api.ListWorkers)
				labor.GET("/workers/:id", api.GetWorker)
				labor.POST("/workers", api.CreateWorker)
				labor.PUT("/workers/:id", api.UpdateWorker)
				labor.DELETE("/workers/:id", api.DeleteWorker)
				
				labor.GET("/shifts", api.ListShifts)
				labor.GET("/shifts/:id", api.GetShift)
				labor.POST("/shifts", api.CreateShift)
				labor.PUT("/shifts/:id", api.UpdateShift)
				labor.DELETE("/shifts/:id", api.DeleteShift)
				
				labor.GET("/performance", api.ListPerformance)
				labor.GET("/performance/:id", api.GetPerformance)
				labor.POST("/performance", api.CreatePerformance)
				labor.PUT("/performance/:id", api.UpdatePerformance)
				labor.DELETE("/performance/:id", api.DeletePerformance)
			}

			// Automation & Integration (admin only)
			automation := protected.Group("")
			automation.Use(middleware.RoleMiddleware("admin"))
			{
				automation.GET("/workflow-rules", api.ListWorkflowRules)
				automation.GET("/workflow-rules/:id", api.GetWorkflowRule)
				automation.POST("/workflow-rules", api.CreateWorkflowRule)
				automation.PUT("/workflow-rules/:id", api.UpdateWorkflowRule)
				automation.DELETE("/workflow-rules/:id", api.DeleteWorkflowRule)
				
				automation.GET("/integrations", api.ListIntegrations)
				automation.GET("/integrations/:id", api.GetIntegration)
				automation.POST("/integrations", api.CreateIntegration)
				automation.PUT("/integrations/:id", api.UpdateIntegration)
				automation.DELETE("/integrations/:id", api.DeleteIntegration)
				automation.POST("/integrations/:id/sync", api.SyncIntegration)
				
				automation.GET("/system-status", api.ListSystemStatus)
				automation.GET("/system-status/:id", api.GetSystemStatus)
				automation.POST("/system-status", api.CreateSystemStatus)
				automation.PUT("/system-status/:id", api.UpdateSystemStatus)
				automation.DELETE("/system-status/:id", api.DeleteSystemStatus)
				automation.GET("/health", api.GetSystemHealth)
			}
		}
	}

	// Create server
	srv := &http.Server{
		Addr:    ":" + config.AppConfig.Server.Port,
		Handler: router,
	}

	// Start server in a goroutine
	go func() {
		log.Printf("Starting server on port %s", config.AppConfig.Server.Port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Failed to start server: %v", err)
		}
	}()

	// Wait for interrupt signal to gracefully shutdown the server
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	log.Println("Shutting down server...")

	// Give outstanding requests a deadline for completion
	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer shutdownCancel()

	if err := srv.Shutdown(shutdownCtx); err != nil {
		log.Fatal("Server forced to shutdown:", err)
	}

	log.Println("Server exited")
} 