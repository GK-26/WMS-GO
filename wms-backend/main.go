package main

import (
	"context"
	"log"
	"net/http"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"

	"wms-backend/internal/api"
	"wms-backend/internal/config"
	"wms-backend/internal/db"
	"wms-backend/internal/services"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true // Allow all origins for development
	},
}

// WebSocket connection manager
type ConnectionManager struct {
	clients    map[*websocket.Conn]bool
	broadcast  chan interface{}
	register   chan *websocket.Conn
	unregister chan *websocket.Conn
}

func NewConnectionManager() *ConnectionManager {
	return &ConnectionManager{
		clients:    make(map[*websocket.Conn]bool),
		broadcast:  make(chan interface{}),
		register:   make(chan *websocket.Conn),
		unregister: make(chan *websocket.Conn),
	}
}

func (cm *ConnectionManager) Start() {
	for {
		select {
		case client := <-cm.register:
			cm.clients[client] = true
		case client := <-cm.unregister:
			if _, ok := cm.clients[client]; ok {
				delete(cm.clients, client)
				client.Close()
			}
		case message := <-cm.broadcast:
			for client := range cm.clients {
				err := client.WriteJSON(message)
				if err != nil {
					log.Printf("Error broadcasting message: %v", err)
					client.Close()
					delete(cm.clients, client)
				}
			}
		}
	}
}

func (cm *ConnectionManager) Broadcast(message interface{}) {
	cm.broadcast <- message
}

func main() {
	// Load configuration
	config.Load()

	// Connect to MongoDB
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	client, err := mongo.Connect(ctx, options.Client().ApplyURI(config.AppConfig.Database.URI))
	if err != nil {
		log.Fatal(err)
	}
	defer client.Disconnect(ctx)

	// Ping the database
	err = client.Ping(ctx, nil)
	if err != nil {
		log.Fatal(err)
	}

	// Initialize database connection
	db.Client = client
	db.Database = client.Database(config.AppConfig.Database.Database)
	db.InitializeCollections()

	// Create database indexes
	if err := db.CreateIndexes(); err != nil {
		log.Printf("Failed to create database indexes: %v", err)
	}

	// Auto-seed database with dummy data if collections are empty
	if err := services.AutoSeedData(ctx); err != nil {
		log.Printf("Failed to auto-seed database: %v", err)
	}

	// Initialize connection manager for WebSocket
	cm := NewConnectionManager()
	go cm.Start()

	// Set Gin mode
	gin.SetMode(gin.DebugMode)

	// Create router
	router := gin.Default()

	// CORS configuration
	router.Use(cors.New(cors.Config{
		AllowOrigins:     config.AppConfig.CORS.AllowedOrigins,
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization", "X-CSRF-Token", "Cache-Control", "X-Requested-With"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	// WebSocket endpoint
	router.GET("/ws", func(c *gin.Context) {
		conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
		if err != nil {
			log.Printf("WebSocket upgrade failed: %v", err)
			return
		}

		cm.register <- conn

		// Handle WebSocket messages
		go func() {
			defer func() {
				cm.unregister <- conn
			}()

			for {
				// Read message (we'll use this for authentication later)
				_, message, err := conn.ReadMessage()
				if err != nil {
					log.Printf("WebSocket read error: %v", err)
					break
				}
				log.Printf("WebSocket message: %s", message)
			}
		}()
	})

	// Health check endpoint
	if config.AppConfig.API.HealthCheckEnabled {
		router.GET("/health", func(c *gin.Context) {
			c.JSON(200, gin.H{
				"status":    "healthy",
				"timestamp": time.Now().UTC(),
				"version":   "1.0.0",
				"database":  "connected",
				"config": gin.H{
					"env":     config.AppConfig.Server.Env,
					"port":    config.AppConfig.Server.Port,
					"api_ver": config.AppConfig.API.Version,
				},
			})
		})
	}

	// API routes
	apiGroup := router.Group(config.AppConfig.API.Prefix + "/" + config.AppConfig.API.Version)
	{
		// Public routes (no auth required for now)
		// Email notification management
		emailGroup := apiGroup.Group("/email")
		{
			emailGroup.POST("/send", api.SendEmail)
			emailGroup.POST("/send-templated", api.SendTemplatedEmail)
			emailGroup.GET("/notifications", api.GetEmailNotifications)
			emailGroup.GET("/templates", api.GetEmailTemplates)
			emailGroup.POST("/templates", api.CreateEmailTemplate)
			emailGroup.GET("/stats", api.GetEmailStats)
		}

		// File upload management
		filesGroup := apiGroup.Group("/files")
		{
			filesGroup.GET("", api.GetFiles)
			filesGroup.GET("/categories", api.GetFileCategories)
			filesGroup.GET("/:id", api.GetFile)
			filesGroup.POST("/upload", api.UploadFile)
			filesGroup.GET("/:id/download", api.DownloadFile)
			filesGroup.DELETE("/:id", api.DeleteFile)
		}

		// Role management
		rolesGroup := apiGroup.Group("/roles")
		{
			rolesGroup.GET("", api.ListRoles)
			rolesGroup.GET("/:id", api.GetRole)
			rolesGroup.POST("", api.CreateRole)
			rolesGroup.PUT("/:id", api.UpdateRole)
		}

		// Task management
		tasksGroup := apiGroup.Group("/tasks")
		{
			tasksGroup.GET("", api.ListTasks)
			tasksGroup.GET("/:id", api.GetTask)
			tasksGroup.POST("", api.CreateTask)
			tasksGroup.PUT("/:id", api.UpdateTask)
			tasksGroup.DELETE("/:id", api.DeleteTask)
		}

		// Order management
		ordersGroup := apiGroup.Group("/orders")
		{
			ordersGroup.GET("", api.ListOrders)
			ordersGroup.GET("/:id", api.GetOrder)
			ordersGroup.POST("", api.CreateOrder)
			ordersGroup.PUT("/:id", api.UpdateOrder)
			ordersGroup.DELETE("/:id", api.DeleteOrder)

			ordersGroup.GET("/customers", api.ListCustomers)
			ordersGroup.GET("/customers/:id", api.GetCustomer)
			ordersGroup.POST("/customers", api.CreateCustomer)
			ordersGroup.PUT("/customers/:id", api.UpdateCustomer)
			ordersGroup.DELETE("/customers/:id", api.DeleteCustomer)
		}

		// Reports and analytics
		reportsGroup := apiGroup.Group("/reports")
		{
			reportsGroup.GET("/dashboard", api.GetDashboardData)
			reportsGroup.GET("/inventory", api.GetInventoryReport)
			reportsGroup.GET("/orders", api.GetOrderReport)
			reportsGroup.GET("/tasks", api.GetTaskReport)
			reportsGroup.GET("/activities", api.ListActivities)
			reportsGroup.GET("/alerts", api.ListAlerts)
		}

		// Shipping management
		shippingGroup := apiGroup.Group("/shipping")
		{
			shippingGroup.GET("/shipments", api.ListShipments)
			shippingGroup.GET("/shipments/:id", api.GetShipment)
			shippingGroup.POST("/shipments", api.CreateShipment)
			shippingGroup.PUT("/shipments/:id", api.UpdateShipment)
			shippingGroup.DELETE("/shipments/:id", api.DeleteShipment)

			shippingGroup.GET("/carriers", api.ListCarriers)
			shippingGroup.GET("/carriers/:id", api.GetCarrier)
			shippingGroup.POST("/carriers", api.CreateCarrier)
			shippingGroup.PUT("/carriers/:id", api.UpdateCarrier)
			shippingGroup.DELETE("/carriers/:id", api.DeleteCarrier)
		}

		// Receiving management
		receivingGroup := apiGroup.Group("/receiving")
		{
			receivingGroup.GET("/asns", api.ListASNs)
			receivingGroup.GET("/asns/:id", api.GetASN)
			receivingGroup.POST("/asns", api.CreateASN)
			receivingGroup.PUT("/asns/:id", api.UpdateASN)
			receivingGroup.DELETE("/asns/:id", api.DeleteASN)

			receivingGroup.GET("/quality-checks", api.ListQualityChecks)
			receivingGroup.GET("/quality-checks/:id", api.GetQualityCheck)
			receivingGroup.POST("/quality-checks", api.CreateQualityCheck)
			receivingGroup.PUT("/quality-checks/:id", api.UpdateQualityCheck)
			receivingGroup.DELETE("/quality-checks/:id", api.DeleteQualityCheck)
		}

		// Labor management
		laborGroup := apiGroup.Group("/labor")
		{
			laborGroup.GET("/workers", api.ListWorkers)
			laborGroup.GET("/workers/:id", api.GetWorker)
			laborGroup.POST("/workers", api.CreateWorker)
			laborGroup.PUT("/workers/:id", api.UpdateWorker)
			laborGroup.DELETE("/workers/:id", api.DeleteWorker)

			laborGroup.GET("/shifts", api.ListShifts)
			laborGroup.GET("/shifts/:id", api.GetShift)
			laborGroup.POST("/shifts", api.CreateShift)
			laborGroup.PUT("/shifts/:id", api.UpdateShift)
			laborGroup.DELETE("/shifts/:id", api.DeleteShift)

			laborGroup.GET("/performance", api.ListPerformance)
			laborGroup.GET("/performance/:id", api.GetPerformance)
			laborGroup.POST("/performance", api.CreatePerformance)
			laborGroup.PUT("/performance/:id", api.UpdatePerformance)
			laborGroup.DELETE("/performance/:id", api.DeletePerformance)
		}

		// Automation and integration
		automationGroup := apiGroup.Group("/automation")
		{
			automationGroup.GET("/workflow-rules", api.ListWorkflowRules)
			automationGroup.GET("/workflow-rules/:id", api.GetWorkflowRule)
			automationGroup.POST("/workflow-rules", api.CreateWorkflowRule)
			automationGroup.PUT("/workflow-rules/:id", api.UpdateWorkflowRule)
			automationGroup.DELETE("/workflow-rules/:id", api.DeleteWorkflowRule)

			automationGroup.GET("/integrations", api.ListIntegrations)
			automationGroup.GET("/integrations/:id", api.GetIntegration)
			automationGroup.POST("/integrations", api.CreateIntegration)
			automationGroup.PUT("/integrations/:id", api.UpdateIntegration)
			automationGroup.DELETE("/integrations/:id", api.DeleteIntegration)

			automationGroup.GET("/system-status", api.ListSystemStatus)
		}
	}

	// Start server
	log.Printf("Server starting on port %s", config.AppConfig.Server.Port)
	log.Fatal(router.Run(":" + config.AppConfig.Server.Port))
}
