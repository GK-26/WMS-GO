package auth

import (
	"golang.org/x/crypto/bcrypt"
)

// HashPassword creates a bcrypt hash of the password
func HashPassword(password string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	return string(bytes), err
}

// CheckPassword compares a password with its hash
func CheckPassword(password, hash string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
	return err == nil
}

// ValidatePasswordStrength checks if a password meets minimum requirements
func ValidatePasswordStrength(password string) error {
	if len(password) < 8 {
		return ErrPasswordTooShort
	}

	// Check for basic complexity
	hasUpper, hasLower, hasNumber, hasSpecial := false, false, false, false
	
	for _, char := range password {
		switch {
		case char >= 'A' && char <= 'Z':
			hasUpper = true
		case char >= 'a' && char <= 'z':
			hasLower = true
		case char >= '0' && char <= '9':
			hasNumber = true
		case char >= 33 && char <= 126: // printable special characters
			if !((char >= '0' && char <= '9') || (char >= 'A' && char <= 'Z') || (char >= 'a' && char <= 'z')) {
				hasSpecial = true
			}
		}
	}

	if !hasUpper {
		return ErrPasswordMissingUppercase
	}
	if !hasLower {
		return ErrPasswordMissingLowercase
	}
	if !hasNumber {
		return ErrPasswordMissingNumber
	}
	if !hasSpecial {
		return ErrPasswordMissingSpecial
	}
	
	return nil
}

// Common password validation errors
var (
	ErrPasswordTooShort         = &PasswordError{Message: "Password must be at least 8 characters long"}
	ErrPasswordMissingUppercase = &PasswordError{Message: "Password must contain at least one uppercase letter"}
	ErrPasswordMissingLowercase = &PasswordError{Message: "Password must contain at least one lowercase letter"}
	ErrPasswordMissingNumber    = &PasswordError{Message: "Password must contain at least one number"}
	ErrPasswordMissingSpecial   = &PasswordError{Message: "Password must contain at least one special character"}
)

type PasswordError struct {
	Message string
}

func (e *PasswordError) Error() string {
	return e.Message
} 