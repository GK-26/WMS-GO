package api

import (
	"bytes"
	"fmt"
	htmltemplate "html/template"
	"net/http"
	"net/smtp"
	"os"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo/options"
	"wms-backend/internal/db"
)

type EmailNotification struct {
	ID        primitive.ObjectID `json:"id" bson:"_id,omitempty"`
	To        string             `json:"to" bson:"to"`
	Subject   string             `json:"subject" bson:"subject"`
	Body      string             `json:"body" bson:"body"`
	Type      string             `json:"type" bson:"type"`
	Status    string             `json:"status" bson:"status"` // pending, sent, failed
	SentAt    *time.Time         `json:"sentAt" bson:"sentAt,omitempty"`
	CreatedAt time.Time          `json:"createdAt" bson:"createdAt"`
	Error     string             `json:"error" bson:"error,omitempty"`
}

type EmailTemplate struct {
	ID       primitive.ObjectID `json:"id" bson:"_id,omitempty"`
	Name     string             `json:"name" bson:"name"`
	Subject  string             `json:"subject" bson:"subject"`
	Body     string             `json:"body" bson:"body"`
	Type     string             `json:"type" bson:"type"`
	IsActive bool               `json:"isActive" bson:"isActive"`
}

type EmailConfig struct {
	SMTPHost     string
	SMTPPort     int
	SMTPUsername string
	SMTPPassword string
	FromEmail    string
	FromName     string
}

func getEmailConfig() EmailConfig {
	port, _ := strconv.Atoi(os.Getenv("SMTP_PORT"))
	return EmailConfig{
		SMTPHost:     os.Getenv("SMTP_HOST"),
		SMTPPort:     port,
		SMTPUsername: os.Getenv("SMTP_USERNAME"),
		SMTPPassword: os.Getenv("SMTP_PASSWORD"),
		FromEmail:    os.Getenv("FROM_EMAIL"),
		FromName:     os.Getenv("FROM_NAME"),
	}
}

// SendEmail sends an email notification
func SendEmail(c *gin.Context) {
	var request struct {
		To      string            `json:"to" binding:"required,email"`
		Subject string            `json:"subject" binding:"required"`
		Body    string            `json:"body" binding:"required"`
		Type    string            `json:"type"`
		Data    map[string]string `json:"data"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Create email notification record
	notification := EmailNotification{
		ID:        primitive.NewObjectID(),
		To:        request.To,
		Subject:   request.Subject,
		Body:      request.Body,
		Type:      request.Type,
		Status:    "pending",
		CreatedAt: time.Now(),
	}

	// Save to database
	collection := db.GetCollection("email_notifications")
	_, err := collection.InsertOne(c.Request.Context(), notification)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save email notification"})
		return
	}

	// Send email in background
	go func() {
		if err := sendEmailNotification(notification); err != nil {
			// Update status to failed
			collection.UpdateOne(
				c.Request.Context(),
				bson.M{"_id": notification.ID},
				bson.M{"$set": bson.M{
					"status": "failed",
					"error":  err.Error(),
				}},
			)
		} else {
			// Update status to sent
			now := time.Now()
			collection.UpdateOne(
				c.Request.Context(),
				bson.M{"_id": notification.ID},
				bson.M{"$set": bson.M{
					"status": "sent",
					"sentAt": &now,
				}},
			)
		}
	}()

	c.JSON(http.StatusOK, gin.H{
		"message": "Email queued for sending",
		"id":      notification.ID,
	})
}

// sendEmailNotification actually sends the email
func sendEmailNotification(notification EmailNotification) error {
	config := getEmailConfig()

	// Check if email configuration is available
	if config.SMTPHost == "" || config.SMTPUsername == "" || config.SMTPPassword == "" {
		return fmt.Errorf("email configuration not available")
	}

	// Create email message
	from := fmt.Sprintf("%s <%s>", config.FromName, config.FromEmail)
	to := []string{notification.To}
	subject := notification.Subject

	// Create email headers
	headers := make(map[string]string)
	headers["From"] = from
	headers["To"] = notification.To
	headers["Subject"] = subject
	headers["MIME-Version"] = "1.0"
	headers["Content-Type"] = "text/html; charset=UTF-8"

	// Build email message
	var message bytes.Buffer
	for key, value := range headers {
		message.WriteString(fmt.Sprintf("%s: %s\r\n", key, value))
	}
	message.WriteString("\r\n")
	message.WriteString(notification.Body)

	// Send email
	auth := smtp.PlainAuth("", config.SMTPUsername, config.SMTPPassword, config.SMTPHost)
	addr := fmt.Sprintf("%s:%d", config.SMTPHost, config.SMTPPort)

	return smtp.SendMail(addr, auth, config.FromEmail, to, message.Bytes())
}

// GetEmailNotifications retrieves email notifications with pagination
func GetEmailNotifications(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	status := c.Query("status")
	typeFilter := c.Query("type")

	skip := (page - 1) * limit

	// Build filter
	filter := bson.M{}
	if status != "" {
		filter["status"] = status
	}
	if typeFilter != "" {
		filter["type"] = typeFilter
	}

	// Get total count
	collection := db.GetCollection("email_notifications")
	total, err := collection.CountDocuments(c.Request.Context(), filter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to count notifications"})
		return
	}

	// Get notifications with pagination
	findOptions := options.Find()
	findOptions.SetSkip(int64(skip))
	findOptions.SetLimit(int64(limit))
	findOptions.SetSort(bson.D{{Key: "createdAt", Value: -1}})
	
	cursor, err := collection.Find(c.Request.Context(), filter, findOptions)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve notifications"})
		return
	}
	defer cursor.Close(c.Request.Context())

	var notifications []EmailNotification
	if err = cursor.All(c.Request.Context(), &notifications); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to decode notifications"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"notifications": notifications,
		"pagination": gin.H{
			"page":  page,
			"limit": limit,
			"total": total,
			"pages": (int(total) + limit - 1) / limit,
		},
	})
}

// GetEmailTemplates retrieves email templates
func GetEmailTemplates(c *gin.Context) {
	collection := db.GetCollection("email_templates")
	
	filter := bson.M{"isActive": true}
	cursor, err := collection.Find(c.Request.Context(), filter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve templates"})
		return
	}
	defer cursor.Close(c.Request.Context())

	var templates []EmailTemplate
	if err = cursor.All(c.Request.Context(), &templates); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to decode templates"})
		return
	}

	c.JSON(http.StatusOK, templates)
}

// CreateEmailTemplate creates a new email template
func CreateEmailTemplate(c *gin.Context) {
	var template EmailTemplate
	if err := c.ShouldBindJSON(&template); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	template.ID = primitive.NewObjectID()
	template.IsActive = true

	collection := db.GetCollection("email_templates")
	_, err := collection.InsertOne(c.Request.Context(), template)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create template"})
		return
	}

	c.JSON(http.StatusCreated, template)
}

// SendTemplatedEmail sends an email using a template
func SendTemplatedEmail(c *gin.Context) {
	var request struct {
		To       string            `json:"to" binding:"required,email"`
		Template string            `json:"template" binding:"required"`
		Data     map[string]string `json:"data"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get template
	collection := db.GetCollection("email_templates")
	var template EmailTemplate
	err := collection.FindOne(c.Request.Context(), bson.M{
		"name":     request.Template,
		"isActive": true,
	}).Decode(&template)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Template not found"})
		return
	}

	// Parse template
	tmpl, err := htmltemplate.New("email").Parse(template.Body)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse template"})
		return
	}

	// Execute template
	var body bytes.Buffer
	if err := tmpl.Execute(&body, request.Data); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to execute template"})
		return
	}

	// Create email notification
	notification := EmailNotification{
		ID:        primitive.NewObjectID(),
		To:        request.To,
		Subject:   template.Subject,
		Body:      body.String(),
		Type:      template.Type,
		Status:    "pending",
		CreatedAt: time.Now(),
	}

	// Save to database
	notificationCollection := db.GetCollection("email_notifications")
	_, err = notificationCollection.InsertOne(c.Request.Context(), notification)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save email notification"})
		return
	}

	// Send email in background
	go func() {
		if err := sendEmailNotification(notification); err != nil {
			// Update status to failed
			notificationCollection.UpdateOne(
				c.Request.Context(),
				bson.M{"_id": notification.ID},
				bson.M{"$set": bson.M{
					"status": "failed",
					"error":  err.Error(),
				}},
			)
		} else {
			// Update status to sent
			now := time.Now()
			notificationCollection.UpdateOne(
				c.Request.Context(),
				bson.M{"_id": notification.ID},
				bson.M{"$set": bson.M{
					"status": "sent",
					"sentAt": &now,
				}},
			)
		}
	}()

	c.JSON(http.StatusOK, gin.H{
		"message": "Templated email queued for sending",
		"id":      notification.ID,
	})
}

// GetEmailStats retrieves email statistics
func GetEmailStats(c *gin.Context) {
	collection := db.GetCollection("email_notifications")
	
	// Get total count
	total, err := collection.CountDocuments(c.Request.Context(), bson.M{})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to count notifications"})
		return
	}

	// Get sent count
	sent, err := collection.CountDocuments(c.Request.Context(), bson.M{"status": "sent"})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to count sent notifications"})
		return
	}

	// Get failed count
	failed, err := collection.CountDocuments(c.Request.Context(), bson.M{"status": "failed"})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to count failed notifications"})
		return
	}

	// Get pending count
	pending, err := collection.CountDocuments(c.Request.Context(), bson.M{"status": "pending"})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to count pending notifications"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"total":   total,
		"sent":    sent,
		"failed":  failed,
		"pending": pending,
		"successRate": func() float64 {
			if total == 0 {
				return 0
			}
			return float64(sent) / float64(total) * 100
		}(),
	})
} 