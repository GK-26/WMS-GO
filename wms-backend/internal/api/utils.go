package api

import (
	"strconv"
	"github.com/gin-gonic/gin"
)

// getIntQuery parses an int query param with a default value
func GetIntQuery(c *gin.Context, key string, defaultValue int) int {
	if v := c.Query(key); v != "" {
		if n, err := strconv.Atoi(v); err == nil {
			return n
		}
	}
	return defaultValue
} 