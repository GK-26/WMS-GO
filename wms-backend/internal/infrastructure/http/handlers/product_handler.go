package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"wms-backend/internal/domain/entities"
	"wms-backend/internal/domain/errors"
	"wms-backend/internal/domain/services"
	"wms-backend/internal/infrastructure/logger"
)

type ProductHandler struct {
	productService services.ProductService
	logger         logger.Logger
}

func NewProductHandler(productService services.ProductService, logger logger.Logger) *ProductHandler {
	return &ProductHandler{
		productService: productService,
		logger:         logger,
	}
}

func (h *ProductHandler) ListProducts(c *gin.Context) {
	// Parse query parameters
	limitStr := c.DefaultQuery("limit", "20")
	offsetStr := c.DefaultQuery("offset", "0")
	query := c.Query("search")
	category := c.Query("category")

	limit, err := strconv.Atoi(limitStr)
	if err != nil || limit <= 0 {
		limit = 20
	}

	offset, err := strconv.Atoi(offsetStr)
	if err != nil || offset < 0 {
		offset = 0
	}

	var products []*entities.Product

	// Handle different query types
	if query != "" {
		products, err = h.productService.SearchProducts(c.Request.Context(), query, limit, offset)
	} else if category != "" {
		products, err = h.productService.GetProductsByCategory(c.Request.Context(), category, limit, offset)
	} else {
		products, err = h.productService.ListProducts(c.Request.Context(), limit, offset)
	}

	if err != nil {
		h.respondWithError(c, err)
		return
	}

	h.respondWithSuccess(c, http.StatusOK, "Products retrieved successfully", products)
}

func (h *ProductHandler) GetProduct(c *gin.Context) {
	id, err := primitive.ObjectIDFromHex(c.Param("id"))
	if err != nil {
		h.respondWithError(c, errors.NewValidationError("Invalid product ID", "id"))
		return
	}

	product, err := h.productService.GetProductByID(c.Request.Context(), id)
	if err != nil {
		h.respondWithError(c, err)
		return
	}

	h.respondWithSuccess(c, http.StatusOK, "Product retrieved successfully", product)
}

func (h *ProductHandler) GetProductBySKU(c *gin.Context) {
	sku := c.Param("sku")
	if sku == "" {
		h.respondWithError(c, errors.NewValidationError("SKU is required", "sku"))
		return
	}

	product, err := h.productService.GetProductBySKU(c.Request.Context(), sku)
	if err != nil {
		h.respondWithError(c, err)
		return
	}

	h.respondWithSuccess(c, http.StatusOK, "Product retrieved successfully", product)
}

func (h *ProductHandler) CreateProduct(c *gin.Context) {
	var req services.CreateProductRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.respondWithError(c, errors.NewValidationError("Invalid request data", ""))
		return
	}

	product, err := h.productService.CreateProduct(c.Request.Context(), req)
	if err != nil {
		h.respondWithError(c, err)
		return
	}

	h.respondWithSuccess(c, http.StatusCreated, "Product created successfully", product)
}

func (h *ProductHandler) UpdateProduct(c *gin.Context) {
	id, err := primitive.ObjectIDFromHex(c.Param("id"))
	if err != nil {
		h.respondWithError(c, errors.NewValidationError("Invalid product ID", "id"))
		return
	}

	var req services.UpdateProductRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		h.respondWithError(c, errors.NewValidationError("Invalid request data", ""))
		return
	}

	product, err := h.productService.UpdateProduct(c.Request.Context(), id, req)
	if err != nil {
		h.respondWithError(c, err)
		return
	}

	h.respondWithSuccess(c, http.StatusOK, "Product updated successfully", product)
}

func (h *ProductHandler) DeleteProduct(c *gin.Context) {
	id, err := primitive.ObjectIDFromHex(c.Param("id"))
	if err != nil {
		h.respondWithError(c, errors.NewValidationError("Invalid product ID", "id"))
		return
	}

	err = h.productService.DeleteProduct(c.Request.Context(), id)
	if err != nil {
		h.respondWithError(c, err)
		return
	}

	h.respondWithSuccess(c, http.StatusOK, "Product deleted successfully", nil)
}

func (h *ProductHandler) GetLowStockProducts(c *gin.Context) {
	products, err := h.productService.GetLowStockProducts(c.Request.Context())
	if err != nil {
		h.respondWithError(c, err)
		return
	}

	h.respondWithSuccess(c, http.StatusOK, "Low stock products retrieved successfully", products)
}

func (h *ProductHandler) respondWithError(c *gin.Context, err error) {
	if appErr, ok := err.(*errors.AppError); ok {
		c.JSON(appErr.HTTPStatusCode(), gin.H{
			"success": false,
			"error":   appErr,
		})
		return
	}

	if errorList, ok := err.(*errors.ErrorList); ok {
		c.JSON(errorList.HTTPStatusCode(), gin.H{
			"success": false,
			"errors":  errorList.Errors,
		})
		return
	}

	// Unknown error
	h.logger.ErrorWithErr(c.Request.Context(), "Unknown error occurred", err)
	c.JSON(http.StatusInternalServerError, gin.H{
		"success": false,
		"error": gin.H{
			"type":    "INTERNAL_ERROR",
			"message": "An unexpected error occurred",
		},
	})
}

func (h *ProductHandler) respondWithSuccess(c *gin.Context, statusCode int, message string, data interface{}) {
	response := gin.H{
		"success": true,
		"message": message,
	}

	if data != nil {
		response["data"] = data
	}

	c.JSON(statusCode, response)
}