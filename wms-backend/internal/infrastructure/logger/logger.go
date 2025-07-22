package logger

import (
	"context"
	"log/slog"
	"os"
	"time"

	"wms-backend/internal/domain/errors"
)

type Logger interface {
	Debug(ctx context.Context, msg string, args ...any)
	Info(ctx context.Context, msg string, args ...any)
	Warn(ctx context.Context, msg string, args ...any)
	Error(ctx context.Context, msg string, args ...any)
	ErrorWithErr(ctx context.Context, msg string, err error, args ...any)
	With(args ...any) Logger
}

type logger struct {
	slog *slog.Logger
}

func New(level string) Logger {
	var logLevel slog.Level
	switch level {
	case "debug":
		logLevel = slog.LevelDebug
	case "info":
		logLevel = slog.LevelInfo
	case "warn":
		logLevel = slog.LevelWarn
	case "error":
		logLevel = slog.LevelError
	default:
		logLevel = slog.LevelInfo
	}

	opts := &slog.HandlerOptions{
		Level: logLevel,
		AddSource: true,
	}

	handler := slog.NewJSONHandler(os.Stdout, opts)
	sl := slog.New(handler)

	return &logger{slog: sl}
}

func (l *logger) Debug(ctx context.Context, msg string, args ...any) {
	l.slog.DebugContext(ctx, msg, args...)
}

func (l *logger) Info(ctx context.Context, msg string, args ...any) {
	l.slog.InfoContext(ctx, msg, args...)
}

func (l *logger) Warn(ctx context.Context, msg string, args ...any) {
	l.slog.WarnContext(ctx, msg, args...)
}

func (l *logger) Error(ctx context.Context, msg string, args ...any) {
	l.slog.ErrorContext(ctx, msg, args...)
}

func (l *logger) ErrorWithErr(ctx context.Context, msg string, err error, args ...any) {
	// Add error details to the log
	allArgs := append(args, "error", err.Error())
	
	// If it's an AppError, add more details
	if appErr, ok := err.(*errors.AppError); ok {
		allArgs = append(allArgs, 
			"error_type", appErr.Type,
			"error_code", appErr.Code,
			"error_field", appErr.Field,
		)
	}
	
	l.slog.ErrorContext(ctx, msg, allArgs...)
}

func (l *logger) With(args ...any) Logger {
	return &logger{slog: l.slog.With(args...)}
}

// Helper functions for structured logging
func WithUserID(userID string) slog.Attr {
	return slog.String("user_id", userID)
}

func WithRequestID(requestID string) slog.Attr {
	return slog.String("request_id", requestID)
}

func WithDuration(d time.Duration) slog.Attr {
	return slog.Duration("duration", d)
}

func WithError(err error) slog.Attr {
	if appErr, ok := err.(*errors.AppError); ok {
		return slog.Group("error",
			slog.String("message", appErr.Message),
			slog.String("type", string(appErr.Type)),
			slog.String("code", appErr.Code),
			slog.String("field", appErr.Field),
		)
	}
	return slog.String("error", err.Error())
}

func WithOperation(operation string) slog.Attr {
	return slog.String("operation", operation)
}

func WithResource(resource string) slog.Attr {
	return slog.String("resource", resource)
}