package api

import (
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
	"wms-backend/internal/db"
)

type FileUpload struct {
	ID          primitive.ObjectID `json:"id" bson:"_id,omitempty"`
	Filename    string             `json:"filename" bson:"filename"`
	OriginalName string            `json:"originalName" bson:"originalName"`
	Size        int64              `json:"size" bson:"size"`
	ContentType string             `json:"contentType" bson:"contentType"`
	Path        string             `json:"path" bson:"path"`
	UploadedBy  primitive.ObjectID `json:"uploadedBy" bson:"uploadedBy"`
	UploadedAt  time.Time          `json:"uploadedAt" bson:"uploadedAt"`
	Category    string             `json:"category" bson:"category"`
	Description string             `json:"description" bson:"description"`
}

// UploadFile handles file upload
func UploadFile(c *gin.Context) {
	// Get user ID from context
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Parse multipart form
	err := c.Request.ParseMultipartForm(32 << 20) // 32MB max
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to parse form"})
		return
	}

	// Get file from form
	file, header, err := c.Request.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No file provided"})
		return
	}
	defer file.Close()

	// Get category and description from form
	category := c.PostForm("category")
	description := c.PostForm("description")

	// Create uploads directory if it doesn't exist
	uploadsDir := "./uploads"
	if err := os.MkdirAll(uploadsDir, 0755); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create uploads directory"})
		return
	}

	// Generate unique filename
	timestamp := time.Now().Unix()
	filename := fmt.Sprintf("%d_%s", timestamp, header.Filename)
	filepath := filepath.Join(uploadsDir, filename)

	// Create file on disk
	dst, err := os.Create(filepath)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create file"})
		return
	}
	defer dst.Close()

	// Copy file content
	_, err = io.Copy(dst, file)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save file"})
		return
	}

	// Create file upload record
	userObjID, _ := primitive.ObjectIDFromHex(userID.(string))
	fileUpload := FileUpload{
		ID:          primitive.NewObjectID(),
		Filename:    filename,
		OriginalName: header.Filename,
		Size:        header.Size,
		ContentType: header.Header.Get("Content-Type"),
		Path:        filepath,
		UploadedBy:  userObjID,
		UploadedAt:  time.Now(),
		Category:    category,
		Description: description,
	}

	// Save to database
	collection := db.GetCollection("file_uploads")
	_, err = collection.InsertOne(c.Request.Context(), fileUpload)
	if err != nil {
		// Clean up file if database insert fails
		os.Remove(filepath)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save file record"})
		return
	}

	c.JSON(http.StatusCreated, fileUpload)
}

// GetFiles retrieves all file uploads with pagination
func GetFiles(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	category := c.Query("category")

	skip := (page - 1) * limit

	// Build filter
	filter := bson.M{}
	if category != "" {
		filter["category"] = category
	}

	// Get total count
	collection := db.GetCollection("file_uploads")
	total, err := collection.CountDocuments(c.Request.Context(), filter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to count files"})
		return
	}

	// Get files with pagination
	findOptions := options.Find()
	findOptions.SetSkip(int64(skip))
	findOptions.SetLimit(int64(limit))
	findOptions.SetSort(bson.D{{Key: "uploadedAt", Value: -1}})
	
	cursor, err := collection.Find(c.Request.Context(), filter, findOptions)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve files"})
		return
	}
	defer cursor.Close(c.Request.Context())

	var files []FileUpload
	if err = cursor.All(c.Request.Context(), &files); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to decode files"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"files": files,
		"pagination": gin.H{
			"page":  page,
			"limit": limit,
			"total": total,
			"pages": (int(total) + limit - 1) / limit,
		},
	})
}

// GetFile retrieves a specific file upload
func GetFile(c *gin.Context) {
	id := c.Param("id")
	objID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid file ID"})
		return
	}

	collection := db.GetCollection("file_uploads")
	var fileUpload FileUpload
	err = collection.FindOne(c.Request.Context(), bson.M{"_id": objID}).Decode(&fileUpload)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			c.JSON(http.StatusNotFound, gin.H{"error": "File not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve file"})
		}
		return
	}

	c.JSON(http.StatusOK, fileUpload)
}

// DownloadFile serves a file for download
func DownloadFile(c *gin.Context) {
	id := c.Param("id")
	objID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid file ID"})
		return
	}

	collection := db.GetCollection("file_uploads")
	var fileUpload FileUpload
	err = collection.FindOne(c.Request.Context(), bson.M{"_id": objID}).Decode(&fileUpload)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			c.JSON(http.StatusNotFound, gin.H{"error": "File not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve file"})
		}
		return
	}

	// Check if file exists on disk
	if _, err := os.Stat(fileUpload.Path); os.IsNotExist(err) {
		c.JSON(http.StatusNotFound, gin.H{"error": "File not found on disk"})
		return
	}

	// Set headers for download
	c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=%s", fileUpload.OriginalName))
	c.Header("Content-Type", fileUpload.ContentType)
	c.Header("Content-Length", fmt.Sprintf("%d", fileUpload.Size))

	// Serve file
	c.File(fileUpload.Path)
}

// DeleteFile deletes a file upload
func DeleteFile(c *gin.Context) {
	id := c.Param("id")
	objID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid file ID"})
		return
	}

	collection := db.GetCollection("file_uploads")
	
	// Get file record first
	var fileUpload FileUpload
	err = collection.FindOne(c.Request.Context(), bson.M{"_id": objID}).Decode(&fileUpload)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			c.JSON(http.StatusNotFound, gin.H{"error": "File not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve file"})
		}
		return
	}

	// Delete from database
	_, err = collection.DeleteOne(c.Request.Context(), bson.M{"_id": objID})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete file record"})
		return
	}

	// Delete file from disk
	if err := os.Remove(fileUpload.Path); err != nil {
		// Log error but don't fail the request since DB record is deleted
		fmt.Printf("Warning: Failed to delete file from disk: %v\n", err)
	}

	c.JSON(http.StatusOK, gin.H{"message": "File deleted successfully"})
}

// GetFileCategories retrieves all file categories
func GetFileCategories(c *gin.Context) {
	collection := db.GetCollection("file_uploads")
	
	pipeline := mongo.Pipeline{
		{{Key: "$group", Value: bson.M{
			"_id": "$category",
			"count": bson.M{"$sum": 1},
		}}},
		{{Key: "$sort", Value: bson.M{"_id": 1}}},
	}

	cursor, err := collection.Aggregate(c.Request.Context(), pipeline)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve categories"})
		return
	}
	defer cursor.Close(c.Request.Context())

	var categories []gin.H
	if err = cursor.All(c.Request.Context(), &categories); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to decode categories"})
		return
	}

	c.JSON(http.StatusOK, categories)
} 