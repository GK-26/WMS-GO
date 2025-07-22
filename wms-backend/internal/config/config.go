package config

import (
	"log"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/joho/godotenv"
)

type Config struct {
	Server   ServerConfig
	Database DatabaseConfig
	JWT      JWTConfig
	CORS     CORSConfig
	Logging  LoggingConfig
	Email    EmailConfig
	Upload   UploadConfig
	WebSocket WebSocketConfig
	Security SecurityConfig
	API      APIConfig
}

type ServerConfig struct {
	Port string
	Env  string
}

type DatabaseConfig struct {
	URI        string
	Database   string
	Username   string
	Password   string
	AuthSource string
}

type JWTConfig struct {
	Secret        string
	Expiry        time.Duration
	RefreshSecret string
	RefreshExpiry time.Duration
}

type CORSConfig struct {
	AllowedOrigins []string
}

type LoggingConfig struct {
	Level  string
	Format string
}

type EmailConfig struct {
	Host     string
	Port     int
	Username string
	Password string
	From     string
	FromName string
}

type UploadConfig struct {
	MaxSize      int64
	AllowedTypes []string
	Path         string
}

type WebSocketConfig struct {
	Enabled           bool
	HeartbeatInterval time.Duration
}

type SecurityConfig struct {
	BcryptCost       int
	SessionTimeout   time.Duration
	MaxLoginAttempts int
	LockoutDuration  time.Duration
}

type APIConfig struct {
	Version            string
	Prefix             string
	HealthCheckEnabled bool
}

var AppConfig *Config

func Load() {
	// Load .env file if it exists
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using environment variables")
	}

	AppConfig = &Config{
		Server: ServerConfig{
			Port: getEnv("PORT", "8080"),
			Env:  getEnv("ENV", "development"),
		},
		Database: DatabaseConfig{
			URI:        getEnv("MONGODB_URI", "mongodb://localhost:27017"),
			Database:   getEnv("MONGODB_DATABASE", "wms_db"),
			Username:   getEnv("MONGODB_USERNAME", ""),
			Password:   getEnv("MONGODB_PASSWORD", ""),
			AuthSource: getEnv("MONGODB_AUTH_SOURCE", "admin"),
		},
		JWT: JWTConfig{
			Secret:        getEnv("JWT_SECRET", "your-super-secret-jwt-key-change-in-production"),
			Expiry:        getEnvAsDuration("JWT_EXPIRY", 24*time.Hour),
			RefreshSecret: getEnv("JWT_REFRESH_SECRET", "your-refresh-secret-key-change-in-production"),
			RefreshExpiry: getEnvAsDuration("JWT_REFRESH_EXPIRY", 168*time.Hour),
		},
		CORS: CORSConfig{
			AllowedOrigins: getEnvAsSlice("ALLOWED_ORIGINS", []string{"http://localhost:3000", "http://localhost:3001"}),
		},
		Logging: LoggingConfig{
			Level:  getEnv("LOG_LEVEL", "debug"),
			Format: getEnv("LOG_FORMAT", "json"),
		},
		Email: EmailConfig{
			Host:     getEnv("SMTP_HOST", "smtp.gmail.com"),
			Port:     getEnvAsInt("SMTP_PORT", 587),
			Username: getEnv("SMTP_USERNAME", ""),
			Password: getEnv("SMTP_PASSWORD", ""),
			From:     getEnv("SMTP_FROM", "noreply@wms.com"),
			FromName: getEnv("SMTP_FROM_NAME", "WMS System"),
		},
		Upload: UploadConfig{
			MaxSize:      getEnvAsInt64("UPLOAD_MAX_SIZE", 10485760), // 10MB
			AllowedTypes: getEnvAsSlice("UPLOAD_ALLOWED_TYPES", []string{"image/jpeg", "image/png", "image/gif", "application/pdf", "text/csv"}),
			Path:         getEnv("UPLOAD_PATH", "./uploads"),
		},
		WebSocket: WebSocketConfig{
			Enabled:           getEnvAsBool("WS_ENABLED", true),
			HeartbeatInterval: getEnvAsDuration("WS_HEARTBEAT_INTERVAL", 30*time.Second),
		},
		Security: SecurityConfig{
			BcryptCost:       getEnvAsInt("BCRYPT_COST", 12),
			SessionTimeout:   getEnvAsDuration("SESSION_TIMEOUT", 30*time.Minute),
			MaxLoginAttempts: getEnvAsInt("MAX_LOGIN_ATTEMPTS", 5),
			LockoutDuration:  getEnvAsDuration("LOCKOUT_DURATION", 15*time.Minute),
		},
		API: APIConfig{
			Version:            getEnv("API_VERSION", "v1"),
			Prefix:             getEnv("API_PREFIX", "/api"),
			HealthCheckEnabled: getEnvAsBool("HEALTH_CHECK_ENABLED", true),
		},
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func getEnvAsInt(key string, defaultValue int) int {
	if value := os.Getenv(key); value != "" {
		if intValue, err := strconv.Atoi(value); err == nil {
			return intValue
		}
	}
	return defaultValue
}

func getEnvAsDuration(key string, defaultValue time.Duration) time.Duration {
	if value := os.Getenv(key); value != "" {
		if duration, err := time.ParseDuration(value); err == nil {
			return duration
		}
	}
	return defaultValue
}

func getEnvAsSlice(key string, defaultValue []string) []string {
	if value := os.Getenv(key); value != "" {
		// Parse comma-separated values
		// Split by comma and trim whitespace
		values := strings.Split(value, ",")
		for i, v := range values {
			values[i] = strings.TrimSpace(v)
		}
		return values
	}
	return defaultValue
}

func getEnvAsInt64(key string, defaultValue int64) int64 {
	if value := os.Getenv(key); value != "" {
		if intValue, err := strconv.ParseInt(value, 10, 64); err == nil {
			return intValue
		}
	}
	return defaultValue
}

func getEnvAsBool(key string, defaultValue bool) bool {
	if value := os.Getenv(key); value != "" {
		if boolValue, err := strconv.ParseBool(value); err == nil {
			return boolValue
		}
	}
	return defaultValue
} 