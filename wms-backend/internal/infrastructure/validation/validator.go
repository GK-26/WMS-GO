package validation

import (
	"fmt"
	"regexp"
	"strings"
	"unicode"

	"wms-backend/internal/domain/errors"
)

var (
	emailRegex = regexp.MustCompile(`^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`)
	skuRegex   = regexp.MustCompile(`^[A-Z0-9-_]+$`)
)

type Validator struct{}

func New() *Validator {
	return &Validator{}
}

func (v *Validator) ValidateEmail(email string) error {
	if !emailRegex.MatchString(email) {
		return errors.NewInvalidFieldError("email", "invalid email format")
	}
	return nil
}

func (v *Validator) ValidatePassword(password string) error {
	if len(password) < 8 {
		return errors.NewInvalidFieldError("password", "must be at least 8 characters long")
	}

	var (
		hasUpper   bool
		hasLower   bool
		hasNumber  bool
		hasSpecial bool
	)

	for _, char := range password {
		switch {
		case unicode.IsUpper(char):
			hasUpper = true
		case unicode.IsLower(char):
			hasLower = true
		case unicode.IsNumber(char):
			hasNumber = true
		case unicode.IsPunct(char) || unicode.IsSymbol(char):
			hasSpecial = true
		}
	}

	var missing []string
	if !hasUpper {
		missing = append(missing, "uppercase letter")
	}
	if !hasLower {
		missing = append(missing, "lowercase letter")
	}
	if !hasNumber {
		missing = append(missing, "number")
	}
	if !hasSpecial {
		missing = append(missing, "special character")
	}

	if len(missing) > 0 {
		return errors.NewInvalidFieldError("password", 
			fmt.Sprintf("must contain at least one: %s", strings.Join(missing, ", ")))
	}

	return nil
}

func (v *Validator) ValidateRequired(value, fieldName string) error {
	if strings.TrimSpace(value) == "" {
		return errors.NewRequiredFieldError(fieldName)
	}
	return nil
}

func (v *Validator) ValidateLength(value, fieldName string, min, max int) error {
	length := len(strings.TrimSpace(value))
	if length < min {
		return errors.NewInvalidFieldError(fieldName, 
			fmt.Sprintf("must be at least %d characters", min))
	}
	if max > 0 && length > max {
		return errors.NewInvalidFieldError(fieldName, 
			fmt.Sprintf("must be no more than %d characters", max))
	}
	return nil
}

func (v *Validator) ValidateSKU(sku string) error {
	if len(sku) < 3 || len(sku) > 50 {
		return errors.NewInvalidFieldError("sku", "must be between 3 and 50 characters")
	}
	if !skuRegex.MatchString(sku) {
		return errors.NewInvalidFieldError("sku", "can only contain uppercase letters, numbers, hyphens, and underscores")
	}
	return nil
}

func (v *Validator) ValidatePositiveNumber(value int, fieldName string) error {
	if value < 0 {
		return errors.NewInvalidFieldError(fieldName, "cannot be negative")
	}
	return nil
}

func (v *Validator) ValidateEnum(value, fieldName string, validValues []string) error {
	for _, validValue := range validValues {
		if value == validValue {
			return nil
		}
	}
	return errors.NewInvalidFieldError(fieldName, 
		fmt.Sprintf("must be one of: %s", strings.Join(validValues, ", ")))
}

// Batch validation helper
func (v *Validator) ValidateStruct(validationFunc func() *errors.ErrorList) error {
	errorList := validationFunc()
	if errorList.HasErrors() {
		return errorList
	}
	return nil
}