# WMS Backend Environment Configuration

This document explains how to configure the WMS backend environment variables for different deployment scenarios.

## Quick Start

1. **Setup Development Environment:**
   ```bash
   make env-dev
   ```

2. **Setup Production Environment:**
   ```bash
   make env-prod
   ```

3. **Setup Docker Environment:**
   ```bash
   make env-docker
   ```

4. **Validate Configuration:**
   ```bash
   make env-validate
   ```

5. **View Current Configuration:**
   ```bash
   make env-show
   ```

## Environment Variables

### Server Configuration
| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `8080` | Server port |
| `ENV` | `development` | Environment (development/production) |

### Database Configuration
| Variable | Default | Description |
|----------|---------|-------------|
| `MONGODB_URI` | `mongodb://localhost:27017` | MongoDB connection string |
| `MONGODB_DATABASE` | `wms_db` | Database name |
| `MONGODB_USERNAME` | `` | MongoDB username (if authentication enabled) |
| `MONGODB_PASSWORD` | `` | MongoDB password (if authentication enabled) |
| `MONGODB_AUTH_SOURCE` | `admin` | MongoDB authentication database |

### JWT Configuration
| Variable | Default | Description |
|----------|---------|-------------|
| `JWT_SECRET` | Auto-generated | Secret key for JWT tokens |
| `JWT_EXPIRY` | `24h` | JWT token expiration time |
| `JWT_REFRESH_SECRET` | Auto-generated | Secret key for refresh tokens |
| `JWT_REFRESH_EXPIRY` | `168h` | Refresh token expiration time |

### CORS Configuration
| Variable | Default | Description |
|----------|---------|-------------|
| `ALLOWED_ORIGINS` | `http://localhost:3000,http://localhost:3001` | Comma-separated list of allowed origins |

### Logging Configuration
| Variable | Default | Description |
|----------|---------|-------------|
| `LOG_LEVEL` | `debug` | Log level (debug/info/warn/error) |
| `LOG_FORMAT` | `json` | Log format (json/text) |

### Email Configuration
| Variable | Default | Description |
|----------|---------|-------------|
| `SMTP_HOST` | `smtp.gmail.com` | SMTP server host |
| `SMTP_PORT` | `587` | SMTP server port |
| `SMTP_USERNAME` | `` | SMTP username |
| `SMTP_PASSWORD` | `` | SMTP password |
| `SMTP_FROM` | `noreply@wms.com` | From email address |
| `SMTP_FROM_NAME` | `WMS System` | From name |

### File Upload Configuration
| Variable | Default | Description |
|----------|---------|-------------|
| `UPLOAD_MAX_SIZE` | `10485760` | Maximum file size (10MB) |
| `UPLOAD_ALLOWED_TYPES` | `image/jpeg,image/png,image/gif,application/pdf,text/csv` | Allowed file types |
| `UPLOAD_PATH` | `./uploads` | Upload directory |

### WebSocket Configuration
| Variable | Default | Description |
|----------|---------|-------------|
| `WS_ENABLED` | `true` | Enable WebSocket connections |
| `WS_HEARTBEAT_INTERVAL` | `30s` | WebSocket heartbeat interval |

### Security Configuration
| Variable | Default | Description |
|----------|---------|-------------|
| `BCRYPT_COST` | `12` | Bcrypt hashing cost |
| `SESSION_TIMEOUT` | `30m` | Session timeout |
| `MAX_LOGIN_ATTEMPTS` | `5` | Maximum login attempts |
| `LOCKOUT_DURATION` | `15m` | Account lockout duration |

### API Configuration
| Variable | Default | Description |
|----------|---------|-------------|
| `API_VERSION` | `v1` | API version |
| `API_PREFIX` | `/api` | API prefix |
| `HEALTH_CHECK_ENABLED` | `true` | Enable health check endpoint |

### Development Configuration
| Variable | Default | Description |
|----------|---------|-------------|
| `DEBUG` | `true` | Enable debug mode |
| `HOT_RELOAD` | `true` | Enable hot reload |
| `CORS_DEBUG` | `true` | Enable CORS debug |

## Environment Setup Scripts

The `scripts/env-setup.sh` script provides automated environment configuration:

### Commands

- `./scripts/env-setup.sh dev` - Setup development environment
- `./scripts/env-setup.sh prod` - Setup production environment  
- `./scripts/env-setup.sh docker` - Setup Docker environment
- `./scripts/env-setup.sh validate` - Validate configuration
- `./scripts/env-setup.sh show` - Show current configuration
- `./scripts/env-setup.sh help` - Show help

### Features

- **Automatic JWT Secret Generation**: Generates secure random JWT secrets
- **Environment-Specific Configuration**: Sets appropriate values for dev/prod/docker
- **Configuration Validation**: Checks for required variables and common issues
- **Secure Display**: Hides sensitive values when showing configuration

## Deployment Scenarios

### Development
```bash
make env-dev
make run
```

### Production
```bash
make env-prod
# Edit .env file with production values
make build
./bin/wms-backend
```

### Docker
```bash
make env-docker
make docker-build
make docker-run
```

## Security Best Practices

1. **Never commit `.env` files** - They're already in `.gitignore`
2. **Use strong JWT secrets** - The setup script generates secure secrets
3. **Limit CORS origins** - Only allow necessary domains
4. **Use environment-specific databases** - Separate dev/prod databases
5. **Secure SMTP credentials** - Use app passwords for email services
6. **Regular secret rotation** - Update JWT secrets periodically

## Troubleshooting

### Common Issues

1. **Missing .env file**
   ```bash
   make env-dev  # Creates .env from env.example
   ```

2. **Invalid MongoDB connection**
   - Check if MongoDB is running
   - Verify connection string format
   - Ensure database exists

3. **CORS errors**
   - Add frontend URL to `ALLOWED_ORIGINS`
   - Check for trailing slashes

4. **JWT errors**
   - Ensure `JWT_SECRET` is set
   - Check token expiration settings

### Validation

Always run validation before deployment:
```bash
make env-validate
```

This will check for:
- Required variables
- Default values that should be changed
- Common configuration issues

## Environment File Structure

```
wms-backend/
├── .env                    # Environment variables (not in git)
├── env.example            # Example environment file
├── scripts/
│   └── env-setup.sh      # Environment setup script
└── internal/
    └── config/
        └── config.go      # Configuration loading logic
```

## External Services Integration

The configuration supports future integrations with:

- **Redis**: For caching and sessions
- **Elasticsearch**: For search functionality
- **AWS S3**: For file storage
- **Sentry**: For error monitoring
- **New Relic**: For performance monitoring
- **Datadog**: For metrics and logging

Uncomment and configure these variables as needed for your deployment. 