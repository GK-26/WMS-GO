# WMS User Credentials and Access Levels

## Available Users

### 1. Super Administrator (Full Access)
- **Username:** `superadmin`
- **Password:** `superadmin123`
- **Email:** superadmin@wms.com
- **Access:** Complete system access to all modules
- **Permissions:** All CRUD operations on all resources

### 2. Administrator (Full Access)
- **Username:** `admin`
- **Password:** `admin123`
- **Email:** admin@wms.com
- **Access:** Full access to all modules
- **Permissions:** All CRUD operations on all resources

### 3. Manager (Management Access)
- **Username:** `manager`
- **Password:** `manager123`
- **Email:** manager@wms.com
- **Access:** Inventory management, order management, reports viewing
- **Permissions:** 
  - Inventory: Full access
  - Orders: Full access
  - Reports: Read only

### 4. Worker (Basic Access)
- **Username:** `worker`
- **Password:** `worker123`
- **Email:** worker@wms.com
- **Access:** Basic inventory reading and task management
- **Permissions:**
  - Inventory: Read only
  - Tasks: Full access

### 5. Test User (Limited Access)
- **Username:** `testuser`
- **Password:** `test123`
- **Email:** test@wms.com
- **Access:** Limited read-only access for demonstration
- **Permissions:**
  - Inventory: Read only
  - Orders: Read only
  - Reports: Read only

## Module Access Summary

| Module | Super Admin | Admin | Manager | Worker | Test User |
|--------|-------------|-------|---------|--------|-----------|
| Dashboard | ✅ | ✅ | ✅ | ✅ | ✅ |
| Inventory Management | ✅ | ✅ | ✅ | 👁️ | 👁️ |
| Order Fulfillment | ✅ | ✅ | ✅ | ❌ | 👁️ |
| Receiving | ✅ | ✅ | ❌ | ❌ | ❌ |
| Shipping | ✅ | ✅ | ❌ | ❌ | ❌ |
| Labor Management | ✅ | ✅ | ❌ | ❌ | ❌ |
| Automation | ✅ | ✅ | ❌ | ❌ | ❌ |
| Reports & Analytics | ✅ | ✅ | 👁️ | ❌ | 👁️ |
| Configuration | ✅ | ✅ | ❌ | ❌ | ❌ |

**Legend:**
- ✅ Full access (Create, Read, Update, Delete)
- 👁️ Read-only access
- ❌ No access

## Testing Different Access Levels

1. **For Full System Access:** Use `superadmin` or `admin`
2. **For Management Access:** Use `manager`
3. **For Basic Worker Access:** Use `worker`
4. **For Limited Read-Only Access:** Use `testuser`

## Backend API Testing

You can test the API endpoints using curl:

```bash
# Login
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "superadmin", "password": "superadmin123"}'

# Use the returned token for authenticated requests
curl -X GET http://localhost:8080/api/v1/users \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Frontend Testing

1. Open http://localhost:3000 in your browser
2. Login with any of the above credentials
3. Navigate through different modules to see role-based access control in action
4. Try accessing restricted areas to see permission enforcement

## Notes

- All users are pre-seeded in the database
- The permission system checks both user-specific permissions and role-based permissions
- Wildcard permissions (`*:*`) grant access to all resources and actions
- The frontend navigation automatically shows/hides menu items based on user permissions 