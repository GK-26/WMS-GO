package errors

import (
	"fmt"
	"net/http"
)

type ErrorType string

const (
	ErrorTypeValidation    ErrorType = "VALIDATION_ERROR"
	ErrorTypeNotFound      ErrorType = "NOT_FOUND"
	ErrorTypeUnauthorized  ErrorType = "UNAUTHORIZED"
	ErrorTypeForbidden     ErrorType = "FORBIDDEN"
	ErrorTypeConflict      ErrorType = "CONFLICT"
	ErrorTypeInternal      ErrorType = "INTERNAL_ERROR"
	ErrorTypeBadRequest    ErrorType = "BAD_REQUEST"
	ErrorTypeUnprocessable ErrorType = "UNPROCESSABLE_ENTITY"
)

type AppError struct {
	Type    ErrorType `json:"type"`
	Message string    `json:"message"`
	Details string    `json:"details,omitempty"`
	Field   string    `json:"field,omitempty"`
	Code    string    `json:"code,omitempty"`
}

func (e *AppError) Error() string {
	if e.Details != "" {
		return fmt.Sprintf("%s: %s - %s", e.Type, e.Message, e.Details)
	}
	return fmt.Sprintf("%s: %s", e.Type, e.Message)
}

func (e *AppError) HTTPStatusCode() int {
	switch e.Type {
	case ErrorTypeValidation, ErrorTypeBadRequest:
		return http.StatusBadRequest
	case ErrorTypeNotFound:
		return http.StatusNotFound
	case ErrorTypeUnauthorized:
		return http.StatusUnauthorized
	case ErrorTypeForbidden:
		return http.StatusForbidden
	case ErrorTypeConflict:
		return http.StatusConflict
	case ErrorTypeUnprocessable:
		return http.StatusUnprocessableEntity
	default:
		return http.StatusInternalServerError
	}
}

// Validation errors
func NewValidationError(message, field string) *AppError {
	return &AppError{
		Type:    ErrorTypeValidation,
		Message: message,
		Field:   field,
	}
}

func NewRequiredFieldError(field string) *AppError {
	return &AppError{
		Type:    ErrorTypeValidation,
		Message: fmt.Sprintf("%s is required", field),
		Field:   field,
	}
}

func NewInvalidFieldError(field, reason string) *AppError {
	return &AppError{
		Type:    ErrorTypeValidation,
		Message: fmt.Sprintf("Invalid %s: %s", field, reason),
		Field:   field,
	}
}

// Not found errors
func NewNotFoundError(resource string) *AppError {
	return &AppError{
		Type:    ErrorTypeNotFound,
		Message: fmt.Sprintf("%s not found", resource),
	}
}

func NewUserNotFoundError() *AppError {
	return NewNotFoundError("User")
}

func NewProductNotFoundError() *AppError {
	return NewNotFoundError("Product")
}

func NewOrderNotFoundError() *AppError {
	return NewNotFoundError("Order")
}

func NewTaskNotFoundError() *AppError {
	return NewNotFoundError("Task")
}

// Authorization errors
func NewUnauthorizedError(message string) *AppError {
	return &AppError{
		Type:    ErrorTypeUnauthorized,
		Message: message,
	}
}

func NewInvalidCredentialsError() *AppError {
	return &AppError{
		Type:    ErrorTypeUnauthorized,
		Message: "Invalid credentials",
	}
}

func NewExpiredTokenError() *AppError {
	return &AppError{
		Type:    ErrorTypeUnauthorized,
		Message: "Token has expired",
	}
}

func NewForbiddenError(message string) *AppError {
	return &AppError{
		Type:    ErrorTypeForbidden,
		Message: message,
	}
}

func NewInsufficientPermissionsError() *AppError {
	return &AppError{
		Type:    ErrorTypeForbidden,
		Message: "Insufficient permissions",
	}
}

// Conflict errors
func NewConflictError(message string) *AppError {
	return &AppError{
		Type:    ErrorTypeConflict,
		Message: message,
	}
}

func NewDuplicateError(resource, field string) *AppError {
	return &AppError{
		Type:    ErrorTypeConflict,
		Message: fmt.Sprintf("%s with this %s already exists", resource, field),
		Field:   field,
	}
}

func NewUsernameExistsError() *AppError {
	return NewDuplicateError("User", "username")
}

func NewEmailExistsError() *AppError {
	return NewDuplicateError("User", "email")
}

func NewSKUExistsError() *AppError {
	return NewDuplicateError("Product", "SKU")
}

// Business logic errors
func NewUnprocessableError(message string) *AppError {
	return &AppError{
		Type:    ErrorTypeUnprocessable,
		Message: message,
	}
}

func NewInsufficientStockError(product, available string) *AppError {
	return &AppError{
		Type:    ErrorTypeUnprocessable,
		Message: fmt.Sprintf("Insufficient stock for %s. Available: %s", product, available),
	}
}

func NewTaskAlreadyAssignedError() *AppError {
	return &AppError{
		Type:    ErrorTypeUnprocessable,
		Message: "Task is already assigned to another user",
	}
}

func NewTaskCannotBeCompletedError(reason string) *AppError {
	return &AppError{
		Type:    ErrorTypeUnprocessable,
		Message: fmt.Sprintf("Task cannot be completed: %s", reason),
	}
}

func NewOrderCannotBeCancelledError() *AppError {
	return &AppError{
		Type:    ErrorTypeUnprocessable,
		Message: "Order cannot be cancelled in its current state",
	}
}

// Internal errors
func NewInternalError(message string) *AppError {
	return &AppError{
		Type:    ErrorTypeInternal,
		Message: message,
	}
}

func NewDatabaseError(operation string) *AppError {
	return &AppError{
		Type:    ErrorTypeInternal,
		Message: fmt.Sprintf("Database error during %s", operation),
	}
}

func NewExternalServiceError(service string) *AppError {
	return &AppError{
		Type:    ErrorTypeInternal,
		Message: fmt.Sprintf("External service error: %s", service),
	}
}

// Error list for multiple validation errors
type ErrorList struct {
	Errors []*AppError `json:"errors"`
}

func (e *ErrorList) Error() string {
	if len(e.Errors) == 0 {
		return "No errors"
	}
	if len(e.Errors) == 1 {
		return e.Errors[0].Error()
	}
	return fmt.Sprintf("Multiple errors: %d validation errors", len(e.Errors))
}

func (e *ErrorList) Add(err *AppError) {
	e.Errors = append(e.Errors, err)
}

func (e *ErrorList) HasErrors() bool {
	return len(e.Errors) > 0
}

func (e *ErrorList) HTTPStatusCode() int {
	if len(e.Errors) == 0 {
		return http.StatusOK
	}
	return e.Errors[0].HTTPStatusCode()
}

func NewErrorList() *ErrorList {
	return &ErrorList{
		Errors: make([]*AppError, 0),
	}
}