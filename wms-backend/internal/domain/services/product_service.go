package services

import (
	"context"
	"strings"

	"go.mongodb.org/mongo-driver/bson/primitive"
	"wms-backend/internal/domain/entities"
	"wms-backend/internal/domain/errors"
	"wms-backend/internal/domain/repositories"
	"wms-backend/internal/infrastructure/logger"
)

type ProductService interface {
	CreateProduct(ctx context.Context, req CreateProductRequest) (*entities.Product, error)
	GetProductByID(ctx context.Context, id primitive.ObjectID) (*entities.Product, error)
	GetProductBySKU(ctx context.Context, sku string) (*entities.Product, error)
	UpdateProduct(ctx context.Context, id primitive.ObjectID, req UpdateProductRequest) (*entities.Product, error)
	DeleteProduct(ctx context.Context, id primitive.ObjectID) error
	ListProducts(ctx context.Context, limit, offset int) ([]*entities.Product, error)
	SearchProducts(ctx context.Context, query string, limit, offset int) ([]*entities.Product, error)
	GetProductsByCategory(ctx context.Context, category string, limit, offset int) ([]*entities.Product, error)
	GetLowStockProducts(ctx context.Context) ([]*entities.Product, error)
}

type productService struct {
	productRepo repositories.ProductRepository
	logger      logger.Logger
}

func NewProductService(productRepo repositories.ProductRepository, logger logger.Logger) ProductService {
	return &productService{
		productRepo: productRepo,
		logger:      logger,
	}
}

type CreateProductRequest struct {
	SKU                   string                 `json:"sku" validate:"required"`
	Name                  string                 `json:"name" validate:"required,min=1,max=200"`
	Description           string                 `json:"description"`
	Category              string                 `json:"category" validate:"required"`
	Dimensions            entities.Dimensions    `json:"dimensions"`
	IsHazardous           bool                   `json:"isHazardous"`
	RequiresRefrigeration bool                   `json:"requiresRefrigeration"`
	LotTracking           bool                   `json:"lotTracking"`
	SerialTracking        bool                   `json:"serialTracking"`
	MinStockLevel         int                    `json:"minStockLevel"`
	MaxStockLevel         int                    `json:"maxStockLevel"`
	ReorderPoint          int                    `json:"reorderPoint"`
	SupplierID            *primitive.ObjectID    `json:"supplierId,omitempty"`
}

type UpdateProductRequest struct {
	Name                  *string                `json:"name,omitempty" validate:"omitempty,min=1,max=200"`
	Description           *string                `json:"description,omitempty"`
	Category              *string                `json:"category,omitempty"`
	Dimensions            *entities.Dimensions   `json:"dimensions,omitempty"`
	IsHazardous           *bool                  `json:"isHazardous,omitempty"`
	RequiresRefrigeration *bool                  `json:"requiresRefrigeration,omitempty"`
	LotTracking           *bool                  `json:"lotTracking,omitempty"`
	SerialTracking        *bool                  `json:"serialTracking,omitempty"`
	MinStockLevel         *int                   `json:"minStockLevel,omitempty"`
	MaxStockLevel         *int                   `json:"maxStockLevel,omitempty"`
	ReorderPoint          *int                   `json:"reorderPoint,omitempty"`
	SupplierID            *primitive.ObjectID    `json:"supplierId,omitempty"`
}

func (s *productService) CreateProduct(ctx context.Context, req CreateProductRequest) (*entities.Product, error) {
	s.logger.Info(ctx, "Creating new product", "sku", req.SKU)

	// Validate input
	if err := s.validateCreateProductRequest(req); err != nil {
		return nil, err
	}

	// Check if SKU already exists
	existingProduct, err := s.productRepo.GetBySKU(ctx, req.SKU)
	if err != nil {
		s.logger.ErrorWithErr(ctx, "Failed to check existing SKU", err)
		return nil, errors.NewDatabaseError("product creation")
	}
	if existingProduct != nil {
		return nil, errors.NewSKUExistsError()
	}

	// Create product entity
	product := &entities.Product{
		SKU:                   req.SKU,
		Name:                  req.Name,
		Description:           req.Description,
		Category:              req.Category,
		Dimensions:            req.Dimensions,
		IsHazardous:           req.IsHazardous,
		RequiresRefrigeration: req.RequiresRefrigeration,
		LotTracking:           req.LotTracking,
		SerialTracking:        req.SerialTracking,
		MinStockLevel:         req.MinStockLevel,
		MaxStockLevel:         req.MaxStockLevel,
		ReorderPoint:          req.ReorderPoint,
		SupplierID:            req.SupplierID,
	}

	// Save to database
	if err := s.productRepo.Create(ctx, product); err != nil {
		s.logger.ErrorWithErr(ctx, "Failed to create product", err)
		return nil, errors.NewDatabaseError("product creation")
	}

	s.logger.Info(ctx, "Product created successfully", "product_id", product.ID.Hex())
	return product, nil
}

func (s *productService) GetProductByID(ctx context.Context, id primitive.ObjectID) (*entities.Product, error) {
	product, err := s.productRepo.GetByID(ctx, id)
	if err != nil {
		s.logger.ErrorWithErr(ctx, "Failed to get product by ID", err)
		return nil, errors.NewDatabaseError("product retrieval")
	}
	if product == nil {
		return nil, errors.NewProductNotFoundError()
	}
	return product, nil
}

func (s *productService) GetProductBySKU(ctx context.Context, sku string) (*entities.Product, error) {
	product, err := s.productRepo.GetBySKU(ctx, sku)
	if err != nil {
		s.logger.ErrorWithErr(ctx, "Failed to get product by SKU", err)
		return nil, errors.NewDatabaseError("product retrieval")
	}
	if product == nil {
		return nil, errors.NewProductNotFoundError()
	}
	return product, nil
}

func (s *productService) UpdateProduct(ctx context.Context, id primitive.ObjectID, req UpdateProductRequest) (*entities.Product, error) {
	s.logger.Info(ctx, "Updating product", "product_id", id.Hex())

	// Get existing product
	product, err := s.GetProductByID(ctx, id)
	if err != nil {
		return nil, err
	}

	// Validate input
	if err := s.validateUpdateProductRequest(req); err != nil {
		return nil, err
	}

	// Update fields if provided
	if req.Name != nil {
		product.Name = *req.Name
	}
	if req.Description != nil {
		product.Description = *req.Description
	}
	if req.Category != nil {
		product.Category = *req.Category
	}
	if req.Dimensions != nil {
		product.Dimensions = *req.Dimensions
	}
	if req.IsHazardous != nil {
		product.IsHazardous = *req.IsHazardous
	}
	if req.RequiresRefrigeration != nil {
		product.RequiresRefrigeration = *req.RequiresRefrigeration
	}
	if req.LotTracking != nil {
		product.LotTracking = *req.LotTracking
	}
	if req.SerialTracking != nil {
		product.SerialTracking = *req.SerialTracking
	}
	if req.MinStockLevel != nil {
		product.MinStockLevel = *req.MinStockLevel
	}
	if req.MaxStockLevel != nil {
		product.MaxStockLevel = *req.MaxStockLevel
	}
	if req.ReorderPoint != nil {
		product.ReorderPoint = *req.ReorderPoint
	}
	if req.SupplierID != nil {
		product.SupplierID = req.SupplierID
	}

	// Save updated product
	if err := s.productRepo.Update(ctx, product); err != nil {
		s.logger.ErrorWithErr(ctx, "Failed to update product", err)
		return nil, errors.NewDatabaseError("product update")
	}

	s.logger.Info(ctx, "Product updated successfully", "product_id", id.Hex())
	return product, nil
}

func (s *productService) DeleteProduct(ctx context.Context, id primitive.ObjectID) error {
	s.logger.Info(ctx, "Deleting product", "product_id", id.Hex())

	// Check if product exists
	_, err := s.GetProductByID(ctx, id)
	if err != nil {
		return err
	}

	// TODO: Check if product is referenced in inventory items, orders, etc.
	// This would prevent deletion of products that are in use

	// Delete product
	if err := s.productRepo.Delete(ctx, id); err != nil {
		s.logger.ErrorWithErr(ctx, "Failed to delete product", err)
		return errors.NewDatabaseError("product deletion")
	}

	s.logger.Info(ctx, "Product deleted successfully", "product_id", id.Hex())
	return nil
}

func (s *productService) ListProducts(ctx context.Context, limit, offset int) ([]*entities.Product, error) {
	products, err := s.productRepo.List(ctx, limit, offset)
	if err != nil {
		s.logger.ErrorWithErr(ctx, "Failed to list products", err)
		return nil, errors.NewDatabaseError("product listing")
	}
	return products, nil
}

func (s *productService) SearchProducts(ctx context.Context, query string, limit, offset int) ([]*entities.Product, error) {
	if strings.TrimSpace(query) == "" {
		return s.ListProducts(ctx, limit, offset)
	}

	products, err := s.productRepo.Search(ctx, query, limit, offset)
	if err != nil {
		s.logger.ErrorWithErr(ctx, "Failed to search products", err)
		return nil, errors.NewDatabaseError("product search")
	}
	return products, nil
}

func (s *productService) GetProductsByCategory(ctx context.Context, category string, limit, offset int) ([]*entities.Product, error) {
	products, err := s.productRepo.GetByCategory(ctx, category, limit, offset)
	if err != nil {
		s.logger.ErrorWithErr(ctx, "Failed to get products by category", err)
		return nil, errors.NewDatabaseError("product retrieval")
	}
	return products, nil
}

func (s *productService) GetLowStockProducts(ctx context.Context) ([]*entities.Product, error) {
	products, err := s.productRepo.GetLowStockProducts(ctx)
	if err != nil {
		s.logger.ErrorWithErr(ctx, "Failed to get low stock products", err)
		return nil, errors.NewDatabaseError("product retrieval")
	}
	return products, nil
}

func (s *productService) validateCreateProductRequest(req CreateProductRequest) error {
	errorList := errors.NewErrorList()

	// SKU validation
	if strings.TrimSpace(req.SKU) == "" {
		errorList.Add(errors.NewRequiredFieldError("sku"))
	}

	// Name validation
	if strings.TrimSpace(req.Name) == "" {
		errorList.Add(errors.NewRequiredFieldError("name"))
	} else if len(req.Name) > 200 {
		errorList.Add(errors.NewInvalidFieldError("name", "must be less than 200 characters"))
	}

	// Category validation
	if strings.TrimSpace(req.Category) == "" {
		errorList.Add(errors.NewRequiredFieldError("category"))
	}

	// Stock level validation
	if req.MinStockLevel < 0 {
		errorList.Add(errors.NewInvalidFieldError("minStockLevel", "cannot be negative"))
	}
	if req.MaxStockLevel < 0 {
		errorList.Add(errors.NewInvalidFieldError("maxStockLevel", "cannot be negative"))
	}
	if req.ReorderPoint < 0 {
		errorList.Add(errors.NewInvalidFieldError("reorderPoint", "cannot be negative"))
	}
	if req.MaxStockLevel > 0 && req.MinStockLevel > req.MaxStockLevel {
		errorList.Add(errors.NewInvalidFieldError("minStockLevel", "cannot be greater than maxStockLevel"))
	}

	if errorList.HasErrors() {
		return errorList
	}

	return nil
}

func (s *productService) validateUpdateProductRequest(req UpdateProductRequest) error {
	errorList := errors.NewErrorList()

	// Name validation
	if req.Name != nil && (strings.TrimSpace(*req.Name) == "" || len(*req.Name) > 200) {
		errorList.Add(errors.NewInvalidFieldError("name", "must be between 1 and 200 characters"))
	}

	// Category validation
	if req.Category != nil && strings.TrimSpace(*req.Category) == "" {
		errorList.Add(errors.NewInvalidFieldError("category", "cannot be empty"))
	}

	// Stock level validation
	if req.MinStockLevel != nil && *req.MinStockLevel < 0 {
		errorList.Add(errors.NewInvalidFieldError("minStockLevel", "cannot be negative"))
	}
	if req.MaxStockLevel != nil && *req.MaxStockLevel < 0 {
		errorList.Add(errors.NewInvalidFieldError("maxStockLevel", "cannot be negative"))
	}
	if req.ReorderPoint != nil && *req.ReorderPoint < 0 {
		errorList.Add(errors.NewInvalidFieldError("reorderPoint", "cannot be negative"))
	}

	if errorList.HasErrors() {
		return errorList
	}

	return nil
}