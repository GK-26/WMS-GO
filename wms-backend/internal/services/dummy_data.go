package services

import (
	"context"
	"fmt"
	"log"
	"strings"
	"time"

	"wms-backend/internal/auth"
	"wms-backend/internal/db"

	"go.mongodb.org/mongo-driver/bson"
)

// AutoSeedData automatically seeds the database with dummy data if collections are empty
func AutoSeedData(ctx context.Context) error {
	log.Println("Checking database for existing data...")

	// Always clear and re-seed users to ensure proper structure
	log.Println("Clearing and re-seeding users to ensure proper data structure...")
	userColl := db.Database.Collection("users")
	_, err := userColl.DeleteMany(ctx, bson.M{})
	if err != nil {
		log.Printf("Warning: Could not clear users collection: %v", err)
	}
	
	if err := insertUsers(ctx); err != nil {
		return fmt.Errorf("error inserting users: %v", err)
	}

	// Check if any data exists in other key collections
	if hasData, err := checkIfDatabaseHasData(ctx); err != nil {
		return fmt.Errorf("error checking database data: %v", err)
	} else if hasData {
		log.Println("Database already contains data, skipping other auto-seed")
		return nil
	}

	log.Println("Database is empty, inserting dummy data...")

	// Insert data in order of dependencies (users already inserted above if needed)

	if err := insertRoles(ctx); err != nil {
		return fmt.Errorf("error inserting roles: %v", err)
	}

	if err := insertProducts(ctx); err != nil {
		return fmt.Errorf("error inserting products: %v", err)
	}

	if err := insertLocations(ctx); err != nil {
		return fmt.Errorf("error inserting locations: %v", err)
	}

	if err := insertInventoryItems(ctx); err != nil {
		return fmt.Errorf("error inserting inventory items: %v", err)
	}

	if err := insertCustomers(ctx); err != nil {
		return fmt.Errorf("error inserting customers: %v", err)
	}

	if err := insertOrders(ctx); err != nil {
		return fmt.Errorf("error inserting orders: %v", err)
	}

	if err := insertTasks(ctx); err != nil {
		return fmt.Errorf("error inserting tasks: %v", err)
	}

	if err := insertWorkers(ctx); err != nil {
		return fmt.Errorf("error inserting workers: %v", err)
	}

	if err := insertShifts(ctx); err != nil {
		return fmt.Errorf("error inserting shifts: %v", err)
	}

	if err := insertCarriers(ctx); err != nil {
		return fmt.Errorf("error inserting carriers: %v", err)
	}

	if err := insertASNs(ctx); err != nil {
		return fmt.Errorf("error inserting ASNs: %v", err)
	}

	if err := insertActivities(ctx); err != nil {
		return fmt.Errorf("error inserting activities: %v", err)
	}

	if err := insertAlerts(ctx); err != nil {
		return fmt.Errorf("error inserting alerts: %v", err)
	}

	log.Println("✅ Dummy data inserted successfully!")
	return nil
}

// checkIfDatabaseHasData checks if any key collections have data
func checkIfDatabaseHasData(ctx context.Context) (bool, error) {
	collections := []string{"products", "locations", "inventory_items"}

	for _, collectionName := range collections {
		count, err := db.Database.Collection(collectionName).CountDocuments(ctx, bson.M{})
		if err != nil {
			return false, err
		}
		if count > 0 {
			return true, nil
		}
	}

	return false, nil
}

// insertUsers inserts the predefined users with standardized approach
func insertUsers(ctx context.Context) error {
	userColl := db.Database.Collection("users")

	// Define user data structure with proper roles
	userData := []struct {
		username    string
		email       string
		password    string
		firstName   string
		lastName    string
		roleName    string
		isActive    bool
	}{
		{"superadmin", "superadmin@wms.com", "superadmin123", "Super", "Administrator", "superadmin", true},
		{"admin", "admin@wms.com", "admin123", "System", "Administrator", "admin", true},
		{"manager", "manager@wms.com", "manager123", "Warehouse", "Manager", "manager", true},
		{"worker", "worker@wms.com", "worker123", "Warehouse", "Worker", "worker", true},
		{"testuser", "test@wms.com", "test123", "Test", "User", "test", true},
	}

	var users []interface{}
	for _, user := range userData {
		// Hash password
		hashedPassword, err := auth.HashPassword(user.password)
		if err != nil {
			return fmt.Errorf("error hashing password for user %s: %v", user.username, err)
		}

		// Create a proper role object based on role name
		roleObj := bson.M{
			"name":        user.roleName,
			"description": fmt.Sprintf("%s role with appropriate permissions", strings.Title(user.roleName)),
			"permissions": []bson.M{},
		}
		
		// Add permissions based on role
		switch user.roleName {
		case "superadmin", "admin":
			roleObj["permissions"] = []bson.M{
				{"name": "all", "description": "All permissions", "resource": "*", "action": "*"},
			}
		case "manager":
			roleObj["permissions"] = []bson.M{
				{"name": "inventory_manage", "description": "Manage inventory", "resource": "inventory", "action": "*"},
				{"name": "orders_manage", "description": "Manage orders", "resource": "orders", "action": "*"},
				{"name": "reports_read", "description": "Read reports", "resource": "reports", "action": "read"},
			}
		case "worker":
			roleObj["permissions"] = []bson.M{
				{"name": "inventory_read", "description": "Read inventory", "resource": "inventory", "action": "read"},
				{"name": "tasks_manage", "description": "Manage tasks", "resource": "tasks", "action": "*"},
			}
		case "test":
			roleObj["permissions"] = []bson.M{
				{"name": "inventory_read", "description": "Read inventory", "resource": "inventory", "action": "read"},
				{"name": "orders_read", "description": "Read orders", "resource": "orders", "action": "read"},
			}
		}

		userDoc := bson.M{
			"username":    user.username,
			"email":       user.email,
			"password":    hashedPassword,
			"firstName":   user.firstName,
			"lastName":    user.lastName,
			"roles":       []bson.M{roleObj},
			"permissions": []interface{}{},
			"isActive":    user.isActive,
			"createdAt":   time.Now(),
			"updatedAt":   time.Now(),
		}
		users = append(users, userDoc)
	}

	_, err := userColl.InsertMany(ctx, users)
	if err != nil {
		return err
	}

	log.Printf("✅ %d Users inserted", len(users))
	return nil
}

// insertRoles inserts predefined roles
func insertRoles(ctx context.Context) error {
	roleColl := db.Database.Collection("roles")

	roles := []interface{}{
		bson.M{
			"name":        "superadmin",
			"description": "Super Administrator with full system access",
			"permissions": []string{"*:*"},
			"isActive":    true,
			"createdAt":   time.Now(),
			"updatedAt":   time.Now(),
		},
		bson.M{
			"name":        "admin",
			"description": "Administrator with full access",
			"permissions": []string{"*:*"},
			"isActive":    true,
			"createdAt":   time.Now(),
			"updatedAt":   time.Now(),
		},
		bson.M{
			"name":        "manager",
			"description": "Warehouse Manager with management access",
			"permissions": []string{"inventory:*", "orders:*", "reports:read", "dashboard:read"},
			"isActive":    true,
			"createdAt":   time.Now(),
			"updatedAt":   time.Now(),
		},
		bson.M{
			"name":        "worker",
			"description": "Warehouse Worker with basic access",
			"permissions": []string{"inventory:read", "tasks:*", "dashboard:read"},
			"isActive":    true,
			"createdAt":   time.Now(),
			"updatedAt":   time.Now(),
		},
		bson.M{
			"name":        "test",
			"description": "Test User with read-only access",
			"permissions": []string{"inventory:read", "orders:read", "reports:read", "dashboard:read"},
			"isActive":    true,
			"createdAt":   time.Now(),
			"updatedAt":   time.Now(),
		},
	}

	_, err := roleColl.InsertMany(ctx, roles)
	if err != nil {
		return err
	}

	log.Println("✅ Roles inserted")
	return nil
}

// insertProducts inserts sample products using standardized approach
func insertProducts(ctx context.Context) error {
	productColl := db.Database.Collection("products")

	// Define product templates with variations
	productTemplates := []struct {
		name        string
		description string
		category    string
		brand       string
		unitOfMeasure string
		baseCost    float64
		basePrice   float64
		lotTracking bool
		serialTracking bool
		quantities  struct {
			min     int
			max     int
			reorder int
		}
		dimensions struct {
			length float64
			width  float64
			height float64
			weight float64
		}
	}{
		{"Laptop Computer", "High-performance laptop for business use", "Electronics", "TechCorp", "pcs", 800.0, 1200.0, true, true, struct{min, max, reorder int}{5, 100, 10}, struct{length, width, height, weight float64}{35, 24, 2, 2.5}},
		{"Wireless Mouse", "Ergonomic wireless mouse", "Electronics", "TechCorp", "pcs", 15.0, 25.0, false, false, struct{min, max, reorder int}{20, 500, 50}, struct{length, width, height, weight float64}{12, 6, 3, 0.1}},
		{"Office Chair", "Ergonomic office chair with lumbar support", "Furniture", "ComfortCo", "pcs", 150.0, 250.0, true, false, struct{min, max, reorder int}{3, 50, 8}, struct{length, width, height, weight float64}{60, 60, 120, 15.0}},
		{"Printer Paper", "A4 printer paper, 80gsm, 500 sheets", "Office Supplies", "PaperCo", "pack", 8.0, 12.0, false, false, struct{min, max, reorder int}{10, 200, 25}, struct{length, width, height, weight float64}{30, 21, 5, 2.5}},
		{"LED Monitor", "24-inch LED monitor, 1920x1080 resolution", "Electronics", "DisplayTech", "pcs", 120.0, 180.0, true, true, struct{min, max, reorder int}{5, 100, 12}, struct{length, width, height, weight float64}{55, 8, 35, 4.0}},
		{"Keyboard", "Mechanical keyboard with RGB lighting", "Electronics", "TechCorp", "pcs", 45.0, 75.0, false, true, struct{min, max, reorder int}{15, 200, 30}, struct{length, width, height, weight float64}{45, 15, 3, 1.2}},
		{"Desk Lamp", "LED desk lamp with adjustable brightness", "Office Supplies", "LightCo", "pcs", 25.0, 40.0, false, false, struct{min, max, reorder int}{10, 100, 20}, struct{length, width, height, weight float64}{20, 20, 50, 2.0}},
		{"Storage Box", "Plastic storage box with lid", "Storage", "BoxCorp", "pcs", 12.0, 20.0, true, false, struct{min, max, reorder int}{25, 300, 75}, struct{length, width, height, weight float64}{40, 30, 25, 1.5}},
	}

	var products []interface{}
	for i, template := range productTemplates {
		// Generate multiple variations of each product
		for j := 0; j < 2; j++ {
			skuNumber := fmt.Sprintf("SKU%04d", i*10+(j+1))
			variation := ""
			if j > 0 {
				variation = fmt.Sprintf(" - Model %d", j+1)
			}

			productDoc := bson.M{
				"sku":                   skuNumber,
				"name":                  template.name + variation,
				"description":           template.description,
				"category":              template.category,
				"brand":                 template.brand,
				"dimensions":            bson.M{
					"length": template.dimensions.length,
					"width":  template.dimensions.width,
					"height": template.dimensions.height,
					"weight": template.dimensions.weight,
				},
				"unitOfMeasure":         template.unitOfMeasure,
				"minQuantity":           template.quantities.min,
				"maxQuantity":           template.quantities.max,
				"reorderPoint":          template.quantities.reorder,
				"cost":                  template.baseCost * (1 + float64(j)*0.1),
				"price":                 template.basePrice * (1 + float64(j)*0.1),
				"isActive":              true,
				"isHazardous":           false,
				"requiresRefrigeration": false,
				"lotTracking":           template.lotTracking,
				"serialTracking":        template.serialTracking,
				"createdAt":             time.Now(),
				"updatedAt":             time.Now(),
			}
			products = append(products, productDoc)
		}
	}

	_, err := productColl.InsertMany(ctx, products)
	if err != nil {
		return err
	}

	log.Printf("✅ %d Products inserted", len(products))
	return nil
}

// insertLocations inserts warehouse locations using standardized approach
func insertLocations(ctx context.Context) error {
	locationColl := db.Database.Collection("locations")

	// Define zone structure
	zones := []string{"A", "B", "C"}
	racks := 3
	levels := 4

	var locations []interface{}

	// Generate storage locations using loops
	for _, zone := range zones {
		for rack := 1; rack <= racks; rack++ {
			for level := 1; level <= levels; level++ {
				code := fmt.Sprintf("%s-%02d-%02d", zone, rack, level)
				name := fmt.Sprintf("Aisle %s, Rack %d, Level %d", zone, rack, level)
				capacity := 100 + (level-1)*25 // Higher levels have more capacity

				locationDoc := bson.M{
					"code":        code,
					"name":        name,
					"type":        "bin",
					"capacity":    capacity,
					"isActive":    true,
					"coordinates": bson.M{
						"x": int(zone[0]) - 64, // A=1, B=2, C=3
						"y": rack,
						"z": level,
					},
					"warehouseId": "warehouse1",
					"createdAt":   time.Now(),
					"updatedAt":   time.Now(),
				}
				locations = append(locations, locationDoc)
			}
		}
	}

	// Add special purpose locations
	specialLocations := []struct {
		code     string
		name     string
		ltype    string
		capacity int
		x, y, z  int
	}{
		{"RECV-01", "Receiving Dock 1", "dock", 1000, 0, 0, 0},
		{"RECV-02", "Receiving Dock 2", "dock", 1000, 0, 0, 1},
		{"SHIP-01", "Shipping Dock 1", "dock", 1000, 10, 0, 0},
		{"SHIP-02", "Shipping Dock 2", "dock", 1000, 10, 0, 1},
		{"QC-01", "Quality Control Station 1", "workstation", 50, 5, 5, 0},
		{"QC-02", "Quality Control Station 2", "workstation", 50, 5, 5, 1},
	}

	for _, special := range specialLocations {
		locationDoc := bson.M{
			"code":        special.code,
			"name":        special.name,
			"type":        special.ltype,
			"capacity":    special.capacity,
			"isActive":    true,
			"coordinates": bson.M{"x": special.x, "y": special.y, "z": special.z},
			"warehouseId": "warehouse1",
			"createdAt":   time.Now(),
			"updatedAt":   time.Now(),
		}
		locations = append(locations, locationDoc)
	}

	_, err := locationColl.InsertMany(ctx, locations)
	if err != nil {
		return err
	}

	log.Printf("✅ %d Locations inserted", len(locations))
	return nil
}

// insertInventoryItems inserts sample inventory items using standardized approach
func insertInventoryItems(ctx context.Context) error {
	inventoryColl := db.Database.Collection("inventory_items")

	// Define inventory distribution pattern
	productLocationMap := []struct {
		productSKU string
		locationCode string
		baseQuantity int
		lotPrefix string
		monthsToExpiry int
		status string
	}{
		{"SKU0001", "A-01-01", 25, "LT", 6, "available"},
		{"SKU0002", "A-01-02", 150, "LT", 12, "available"},
		{"SKU0011", "A-02-01", 20, "LT", 6, "available"},
		{"SKU0021", "B-01-01", 8, "LT", 24, "available"},
		{"SKU0031", "B-02-01", 75, "LT", 12, "available"},
		{"SKU0041", "B-03-01", 15, "LT", 12, "available"},
		{"SKU0051", "C-01-01", 35, "LT", 18, "available"},
		{"SKU0061", "C-01-02", 45, "LT", 9, "reserved"},
		{"SKU0071", "C-02-01", 12, "LT", 15, "available"},
	}

	var inventoryItems []interface{}
	for i, mapping := range productLocationMap {
		// Generate multiple inventory records per product with slight variations
		for j := 0; j < 2; j++ {
			lotNumber := fmt.Sprintf("%s%03d-%02d", mapping.lotPrefix, i+1, j+1)
			quantity := mapping.baseQuantity
			if j > 0 {
				quantity = quantity / 2 // Split inventory across lots
			}
			
			expiryDate := time.Now().AddDate(0, mapping.monthsToExpiry+(j*2), 0)
			status := mapping.status
			if j > 0 && mapping.status == "reserved" {
				status = "available" // Vary status
			}

			inventoryDoc := bson.M{
				"productId":  mapping.productSKU,
				"locationId": mapping.locationCode,
				"quantity":   quantity,
				"lotNumber":  lotNumber,
				"expiryDate": expiryDate,
				"status":     status,
				"createdAt":  time.Now().AddDate(0, 0, -(j+1)*10), // Staggered creation dates
				"updatedAt":  time.Now(),
			}
			inventoryItems = append(inventoryItems, inventoryDoc)
		}
	}

	_, err := inventoryColl.InsertMany(ctx, inventoryItems)
	if err != nil {
		return err
	}

	log.Printf("✅ %d Inventory items inserted", len(inventoryItems))
	return nil
}

// insertCustomers inserts sample customers using standardized approach
func insertCustomers(ctx context.Context) error {
	customerColl := db.Database.Collection("customers")

	// Define customer templates
	customerTemplates := []struct {
		name     string
		email    string
		street   string
		city     string
		state    string
		zip      string
	}{
		{"Acme Corporation", "orders@acme.com", "123 Business St", "New York", "NY", "10001"},
		{"TechStart Inc", "purchasing@techstart.com", "456 Innovation Ave", "San Francisco", "CA", "94102"},
		{"Global Solutions Ltd", "procurement@globalsolutions.com", "789 Corporate Blvd", "Chicago", "IL", "60601"},
		{"MegaCorp Industries", "supply@megacorp.com", "321 Enterprise Way", "Los Angeles", "CA", "90210"},
		{"DataFlow Systems", "logistics@dataflow.com", "654 Tech Park Dr", "Austin", "TX", "73301"},
		{"Prime Manufacturing", "purchasing@prime.com", "987 Industrial Blvd", "Detroit", "MI", "48201"},
		{"NextGen Retail", "orders@nextgen.com", "147 Commerce St", "Seattle", "WA", "98101"},
	}

	var customers []interface{}
	for i, template := range customerTemplates {
		phoneNumber := fmt.Sprintf("+1-555-%04d", 1000+(i+1)*100)
		
		customerDoc := bson.M{
			"name":  template.name,
			"email": template.email,
			"phone": phoneNumber,
			"address": bson.M{
				"street": template.street,
				"city":   template.city,
				"state":  template.state,
				"zip":    template.zip,
			},
			"isActive":  true,
			"createdAt": time.Now(),
			"updatedAt": time.Now(),
		}
		customers = append(customers, customerDoc)
	}

	_, err := customerColl.InsertMany(ctx, customers)
	if err != nil {
		return err
	}

	log.Printf("✅ %d Customers inserted", len(customers))
	return nil
}

// insertOrders inserts sample orders using standardized approach
func insertOrders(ctx context.Context) error {
	orderColl := db.Database.Collection("orders")

	// Define order templates with different statuses and scenarios
	orderTemplates := []struct {
		customer    string
		status      string
		daysAgo     int
		deliveryDays int
		items       []struct {
			sku      string
			qty      int
			price    float64
		}
	}{
		{"Acme Corporation", "pending", 7, 3, []struct{sku string; qty int; price float64}{{"SKU0001", 5, 1200.0}, {"SKU0021", 20, 27.5}}},
		{"TechStart Inc", "processing", 3, 5, []struct{sku string; qty int; price float64}{{"SKU0031", 3, 275.0}, {"SKU0051", 8, 198.0}}},
		{"Global Solutions Ltd", "shipped", 10, 2, []struct{sku string; qty int; price float64}{{"SKU0011", 10, 1320.0}, {"SKU0061", 15, 82.5}}},
		{"MegaCorp Industries", "delivered", 15, -5, []struct{sku string; qty int; price float64}{{"SKU0041", 25, 13.2}, {"SKU0071", 5, 44.0}}},
		{"DataFlow Systems", "cancelled", 20, 0, []struct{sku string; qty int; price float64}{{"SKU0002", 50, 25.0}}},
		{"Prime Manufacturing", "pending", 2, 7, []struct{sku string; qty int; price float64}{{"SKU0001", 2, 1200.0}, {"SKU0031", 4, 275.0}, {"SKU0051", 6, 198.0}}},
		{"NextGen Retail", "processing", 1, 4, []struct{sku string; qty int; price float64}{{"SKU0021", 30, 27.5}, {"SKU0061", 12, 82.5}}},
	}

	var orders []interface{}
	for i, template := range orderTemplates {
		orderNumber := fmt.Sprintf("ORD-2024-%03d", i+1)
		
		// Calculate total amount
		totalAmount := 0.0
		var orderItems []bson.M
		for _, item := range template.items {
			itemTotal := float64(item.qty) * item.price
			totalAmount += itemTotal
			orderItems = append(orderItems, bson.M{
				"productId": item.sku,
				"quantity":  item.qty,
				"price":     item.price,
			})
		}

		orderDate := time.Now().AddDate(0, 0, -template.daysAgo)
		expectedDelivery := time.Now().AddDate(0, 0, template.deliveryDays)
		
		orderDoc := bson.M{
			"orderNumber":      orderNumber,
			"customerId":       template.customer,
			"status":           template.status,
			"items":            orderItems,
			"totalAmount":      totalAmount,
			"orderDate":        orderDate,
			"expectedDelivery": expectedDelivery,
			"createdAt":        orderDate,
			"updatedAt":        time.Now(),
		}
		orders = append(orders, orderDoc)
	}

	_, err := orderColl.InsertMany(ctx, orders)
	if err != nil {
		return err
	}

	log.Printf("✅ %d Orders inserted", len(orders))
	return nil
}

// insertTasks inserts sample tasks using standardized approach
func insertTasks(ctx context.Context) error {
	taskColl := db.Database.Collection("tasks")

	// Define task templates with different types and priorities
	taskTemplates := []struct {
		taskType    string
		status      string
		priority    string
		assignedTo  string
		daysAgo     int
	}{
		{"picking", "assigned", "high", "John Smith", 1},
		{"receiving", "pending", "medium", "", 0},
		{"putaway", "in_progress", "low", "Sarah Johnson", 2},
		{"quality_check", "completed", "high", "Mike Davis", 3},
		{"shipping", "assigned", "medium", "Lisa Garcia", 1},
		{"cycle_count", "pending", "low", "", 0},
		{"replenishment", "in_progress", "medium", "David Wilson", 1},
		{"picking", "completed", "high", "Jennifer Taylor", 4},
		{"receiving", "assigned", "medium", "Tom Anderson", 2},
		{"maintenance", "pending", "low", "", 0},
	}

	var tasks []interface{}
	for i, template := range taskTemplates {
		taskID := fmt.Sprintf("TSK-%04d", i+1)
		orderID := ""
		locationID := ""
		
		// Assign relevant order/location based on task type
		switch template.taskType {
		case "picking":
			orderID = fmt.Sprintf("ORD-2024-%03d", (i%3)+1)
			locationID = fmt.Sprintf("A-%02d-%02d", (i%2)+1, (i%3)+1)
		case "receiving":
			locationID = fmt.Sprintf("RECV-%02d", (i%2)+1)
		case "shipping":
			orderID = fmt.Sprintf("ORD-2024-%03d", (i%3)+1)
			locationID = fmt.Sprintf("SHIP-%02d", (i%2)+1)
		case "quality_check":
			locationID = fmt.Sprintf("QC-%02d", (i%2)+1)
		default:
			locationID = fmt.Sprintf("A-%02d-%02d", (i%3)+1, (i%2)+1)
		}

		title := fmt.Sprintf("%s Task #%d", strings.Title(strings.ReplaceAll(template.taskType, "_", " ")), i+1)
		description := fmt.Sprintf("Perform %s operation", strings.ReplaceAll(template.taskType, "_", " "))
		
		if orderID != "" {
			title = fmt.Sprintf("%s for Order %s", title, orderID)
			description = fmt.Sprintf("%s for order %s", description, orderID)
		}

		taskDoc := bson.M{
			"taskId":      taskID,
			"title":       title,
			"description": description,
			"type":        template.taskType,
			"status":      template.status,
			"priority":    template.priority,
			"assignedTo":  template.assignedTo,
			"orderId":     orderID,
			"locationId":  locationID,
			"createdAt":   time.Now().AddDate(0, 0, -template.daysAgo),
			"updatedAt":   time.Now(),
		}
		tasks = append(tasks, taskDoc)
	}

	_, err := taskColl.InsertMany(ctx, tasks)
	if err != nil {
		return err
	}

	log.Printf("✅ %d Tasks inserted", len(tasks))
	return nil
}

// insertWorkers inserts sample workers using standardized approach
func insertWorkers(ctx context.Context) error {
	workerColl := db.Database.Collection("workers")

	// Define worker templates with different roles and departments
	workerTemplates := []struct {
		firstName   string
		lastName    string
		position    string
		department  string
		hyreYears   int
	}{
		{"John", "Smith", "Warehouse Associate", "Operations", 1},
		{"Sarah", "Johnson", "Forklift Operator", "Operations", 2},
		{"Mike", "Davis", "Quality Inspector", "Quality Control", 3},
		{"Emily", "Brown", "Warehouse Supervisor", "Operations", 4},
		{"David", "Wilson", "Inventory Specialist", "Inventory", 2},
		{"Lisa", "Garcia", "Shipping Clerk", "Shipping", 1},
		{"Tom", "Anderson", "Receiving Clerk", "Receiving", 3},
		{"Jennifer", "Taylor", "Order Picker", "Operations", 1},
		{"Robert", "Martinez", "Loading Dock Worker", "Shipping", 2},
		{"Amy", "Thompson", "Data Entry Clerk", "Administration", 1},
	}

	var workers []interface{}
	for i, template := range workerTemplates {
		fullName := fmt.Sprintf("%s %s", template.firstName, template.lastName)
		email := fmt.Sprintf("%s.%s@wms.com", strings.ToLower(template.firstName), strings.ToLower(template.lastName))
		phone := fmt.Sprintf("+1-555-%04d", 4000+(i+1)*100)
		hireDate := time.Now().AddDate(-template.hyreYears, 0, 0)

		workerDoc := bson.M{
			"name":       fullName,
			"email":      email,
			"phone":      phone,
			"position":   template.position,
			"department": template.department,
			"isActive":   true,
			"hireDate":   hireDate,
			"createdAt":  time.Now(),
			"updatedAt":  time.Now(),
		}
		workers = append(workers, workerDoc)
	}

	_, err := workerColl.InsertMany(ctx, workers)
	if err != nil {
		return err
	}

	log.Printf("✅ %d Workers inserted", len(workers))
	return nil
}

// insertShifts inserts sample shifts
func insertShifts(ctx context.Context) error {
	shiftColl := db.Database.Collection("shifts")

	shifts := []interface{}{
		bson.M{
			"name":       "Morning Shift",
			"startTime":  "06:00",
			"endTime":    "14:00",
			"daysOfWeek": []string{"monday", "tuesday", "wednesday", "thursday", "friday"},
			"isActive":   true,
			"createdAt":  time.Now(),
			"updatedAt":  time.Now(),
		},
		bson.M{
			"name":       "Afternoon Shift",
			"startTime":  "14:00",
			"endTime":    "22:00",
			"daysOfWeek": []string{"monday", "tuesday", "wednesday", "thursday", "friday"},
			"isActive":   true,
			"createdAt":  time.Now(),
			"updatedAt":  time.Now(),
		},
		bson.M{
			"name":       "Night Shift",
			"startTime":  "22:00",
			"endTime":    "06:00",
			"daysOfWeek": []string{"monday", "tuesday", "wednesday", "thursday", "friday"},
			"isActive":   true,
			"createdAt":  time.Now(),
			"updatedAt":  time.Now(),
		},
	}

	_, err := shiftColl.InsertMany(ctx, shifts)
	if err != nil {
		return err
	}

	log.Println("✅ Shifts inserted")
	return nil
}

// insertCarriers inserts sample carriers
func insertCarriers(ctx context.Context) error {
	carrierColl := db.Database.Collection("carriers")

	carriers := []interface{}{
		bson.M{
			"name":          "FastShip Express",
			"code":          "FSE",
			"contactPerson": "Jane Wilson",
			"phone":         "+1-555-0707",
			"email":         "dispatch@fastship.com",
			"isActive":      true,
			"createdAt":     time.Now(),
			"updatedAt":     time.Now(),
		},
		bson.M{
			"name":          "Reliable Logistics",
			"code":          "RL",
			"contactPerson": "Tom Brown",
			"phone":         "+1-555-0808",
			"email":         "operations@reliablelogistics.com",
			"isActive":      true,
			"createdAt":     time.Now(),
			"updatedAt":     time.Now(),
		},
	}

	_, err := carrierColl.InsertMany(ctx, carriers)
	if err != nil {
		return err
	}

	log.Println("✅ Carriers inserted")
	return nil
}

// insertASNs inserts sample ASNs (Advanced Shipping Notices)
func insertASNs(ctx context.Context) error {
	asnColl := db.Database.Collection("asns")

	asns := []interface{}{
		bson.M{
			"asnNumber":    "ASN-2024-001",
			"supplierId":   "TechCorp",
			"expectedDate": time.Now().AddDate(0, 0, 2),
			"status":       "pending",
			"items": []bson.M{
				{"productId": "SKU0001", "quantity": 10, "expectedQuantity": 10},
				{"productId": "SKU0002", "quantity": 50, "expectedQuantity": 50},
			},
			"createdAt": time.Now(),
			"updatedAt": time.Now(),
		},
	}

	_, err := asnColl.InsertMany(ctx, asns)
	if err != nil {
		return err
	}

	log.Println("✅ ASNs inserted")
	return nil
}

// insertActivities inserts sample activities using standardized approach
func insertActivities(ctx context.Context) error {
	activityColl := db.Database.Collection("activities")

	// Define activity templates for realistic system activity
	activityTemplates := []struct {
		activityType string
		userId       string
		daysAgo      int
		relatedId    string
		entityType   string
	}{
		{"order_created", "admin", 7, "ORD-2024-001", "order"},
		{"task_assigned", "manager", 6, "TSK-0001", "task"},
		{"inventory_updated", "worker", 5, "SKU0001", "product"},
		{"user_login", "admin", 1, "admin", "user"},
		{"order_shipped", "manager", 4, "ORD-2024-003", "order"},
		{"task_completed", "worker", 3, "TSK-0004", "task"},
		{"product_added", "admin", 8, "SKU0071", "product"},
		{"location_updated", "manager", 2, "A-03-02", "location"},
		{"quality_check", "worker", 1, "QC-001", "quality"},
		{"shipment_received", "worker", 2, "ASN-2024-001", "asn"},
		{"alert_generated", "system", 1, "ALT-001", "alert"},
		{"report_generated", "manager", 3, "RPT-001", "report"},
	}

	var activities []interface{}
	for _, template := range activityTemplates {
		// Generate multiple activities for each template
		for j := 0; j < 2; j++ {
			daysOffset := template.daysAgo + j
			timestamp := time.Now().AddDate(0, 0, -daysOffset)
			
			description := generateActivityDescription(template.activityType, template.relatedId, j)
			
			activityDoc := bson.M{
				"type":        template.activityType,
				"description": description,
				"userId":      template.userId,
				"relatedId":   template.relatedId,
				"entityType":  template.entityType,
				"timestamp":   timestamp,
				"createdAt":   timestamp,
			}
			activities = append(activities, activityDoc)
		}
	}

	_, err := activityColl.InsertMany(ctx, activities)
	if err != nil {
		return err
	}

	log.Printf("✅ %d Activities inserted", len(activities))
	return nil
}

// generateActivityDescription creates contextual descriptions for activities
func generateActivityDescription(activityType, relatedId string, variant int) string {
	switch activityType {
	case "order_created":
		if variant == 0 {
			return fmt.Sprintf("Order %s created by customer", relatedId)
		}
		return fmt.Sprintf("Order %s received and processed", relatedId)
	case "task_assigned":
		if variant == 0 {
			return fmt.Sprintf("Task %s assigned to warehouse worker", relatedId)
		}
		return fmt.Sprintf("Task %s reassigned due to priority change", relatedId)
	case "inventory_updated":
		if variant == 0 {
			return fmt.Sprintf("Inventory levels updated for product %s", relatedId)
		}
		return fmt.Sprintf("Stock adjustment made for product %s", relatedId)
	case "user_login":
		if variant == 0 {
			return fmt.Sprintf("User %s logged into the system", relatedId)
		}
		return fmt.Sprintf("User %s accessed dashboard", relatedId)
	default:
		return fmt.Sprintf("%s performed on %s", strings.ReplaceAll(activityType, "_", " "), relatedId)
	}
}

// insertAlerts inserts sample alerts using standardized approach
func insertAlerts(ctx context.Context) error {
	alertColl := db.Database.Collection("alerts")

	// Define alert templates with different types and severities
	alertTemplates := []struct {
		alertType string
		title     string
		message   string
		severity  string
		relatedId string
		daysAgo   int
		isRead    bool
	}{
		{"low_stock", "Low Stock Alert", "Product is below reorder point", "warning", "SKU0031", 1, false},
		{"order_delayed", "Order Delay Alert", "Order is behind schedule", "info", "ORD-2024-001", 2, false},
		{"system_error", "System Error", "Database connection timeout", "error", "SYS-001", 1, true},
		{"quality_issue", "Quality Alert", "Quality check failed for incoming goods", "critical", "QC-001", 3, false},
		{"capacity_warning", "Storage Capacity Alert", "Warehouse location approaching capacity limit", "warning", "A-01-01", 2, true},
		{"task_overdue", "Task Overdue Alert", "Assigned task is past due date", "error", "TSK-0002", 1, false},
		{"security_breach", "Security Alert", "Unauthorized access attempt detected", "critical", "SEC-001", 4, true},
		{"maintenance_due", "Maintenance Alert", "Equipment maintenance is due", "info", "EQP-001", 5, false},
		{"shipment_delayed", "Shipment Alert", "Expected shipment is delayed", "warning", "ASN-2024-001", 1, false},
		{"inventory_discrepancy", "Inventory Alert", "Inventory count mismatch detected", "error", "INV-001", 2, true},
	}

	var alerts []interface{}
	for i, template := range alertTemplates {
		// Create variations of each alert type
		for j := 0; j < 2; j++ {
			alertId := fmt.Sprintf("ALT-%03d-%d", i+1, j+1)
			message := template.message
			if template.relatedId != "" {
				message = fmt.Sprintf("%s - %s", message, template.relatedId)
			}
			
			// Vary some properties for the second variant
			isRead := template.isRead
			if j == 1 {
				isRead = !isRead // Toggle read status for variant
			}
			
			createdAt := time.Now().AddDate(0, 0, -(template.daysAgo + j))

			alertDoc := bson.M{
				"alertId":    alertId,
				"type":       template.alertType,
				"title":      template.title,
				"message":    message,
				"severity":   template.severity,
				"isRead":     isRead,
				"relatedId":  template.relatedId,
				"createdAt":  createdAt,
				"updatedAt":  createdAt,
			}
			alerts = append(alerts, alertDoc)
		}
	}

	_, err := alertColl.InsertMany(ctx, alerts)
	if err != nil {
		return err
	}

	log.Printf("✅ %d Alerts inserted", len(alerts))
	return nil
}

// Legacy function for backward compatibility
func InsertDummyData(ctx context.Context) error {
	return AutoSeedData(ctx)
}
