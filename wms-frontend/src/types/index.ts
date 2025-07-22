// Base types
export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

// User and Authentication
export interface User extends BaseEntity {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
  lastLogin?: Date;
}

export interface Role extends BaseEntity {
  name: string;
  description: string;
  permissions: string[];
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

// Inventory Management
export interface Product extends BaseEntity {
  sku: string;
  name: string;
  description: string;
  category: string;
  brand: string;
  dimensions: {
    length: number;
    width: number;
    height: number;
    weight: number;
  };
  unitOfMeasure: string;
  minQuantity: number;
  maxQuantity: number;
  reorderPoint: number;
  cost: number;
  price: number;
  isActive: boolean;
  // Added fields for advanced inventory
  isHazardous: boolean;
  requiresRefrigeration: boolean;
  lotTracking: boolean;
  serialTracking: boolean;
}

export interface InventoryItem extends BaseEntity {
  productId: string;
  locationId: string;
  quantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  status: 'available' | 'reserved' | 'damaged' | 'quarantine';
  lotNumber?: string;
  expiryDate?: Date;
  lastCounted: Date;
  product?: Product;
  location?: Location;
}

export interface Location extends BaseEntity {
  code: string;
  name: string;
  type: 'zone' | 'aisle' | 'rack' | 'shelf' | 'bin' | 'pallet_position' | 'dock' | 'staging_area';
  parentLocationId?: string;
  capacity: number;
  isActive: boolean;
  coordinates?: {
    x: number;
    y: number;
    z: number;
  };
  warehouseId: string;
}

// Order Management
export interface Customer extends BaseEntity {
  code: string;
  name: string;
  email: string;
  phone: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  contactInfo: {
    name: string;
    email: string;
    phone: string;
  };
  isActive: boolean;
}

export interface Order extends BaseEntity {
  orderNumber: string;
  customerId: string;
  status: 'pending' | 'processing' | 'picking' | 'packing' | 'shipped' | 'delivered' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  orderDate: Date;
  requiredDate: Date;
  shippedDate?: Date;
  totalAmount: number;
  notes?: string;
  customer?: Customer;
  items?: OrderItem[];
}

export interface OrderItem extends BaseEntity {
  orderId: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  product?: Product;
}

// Task Management
export interface Task extends BaseEntity {
  taskNumber: string;
  type: 'picking' | 'packing' | 'receiving' | 'shipping' | 'cycle_count' | 'putaway';
  status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedTo?: string;
  assignedAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
  dueDate: Date;
  estimatedDuration: number; // in minutes
  actualDuration?: number;
  locationId?: string;
  orderId?: string;
  shipmentId?: string;
  notes?: string;
  items?: TaskItem[];
}

export interface TaskItem extends BaseEntity {
  taskId: string;
  productId: string;
  quantity: number;
  completedQuantity: number;
  product?: Product;
}

// Shipping Management
export interface Carrier extends BaseEntity {
  name: string;
  code: string;
  contactInfo: {
    name: string;
    email: string;
    phone: string;
    address: string;
  };
  services: string[];
  isActive: boolean;
}

export interface Shipment extends BaseEntity {
  shipmentNumber: string;
  orderId?: string;
  carrierId: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  shippingDate: Date;
  estimatedDeliveryDate: Date;
  actualDeliveryDate?: Date;
  trackingNumber?: string;
  shippingCost: number;
  weight: number;
  dimensions: {
    length: number;
    width: number;
    height: number;
  };
  fromAddress: {
    name: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  toAddress: {
    name: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  notes?: string;
  carrier?: Carrier;
  items?: ShipmentItem[];
}

export interface ShipmentItem extends BaseEntity {
  shipmentId: string;
  productId: string;
  quantity: number;
  product?: Product;
}

// Receiving Management
export interface ASN extends BaseEntity {
  asnNumber: string;
  supplierId: string;
  expectedArrivalDate: Date;
  actualArrivalDate?: Date;
  status: 'pending' | 'received' | 'partially_received' | 'cancelled';
  totalItems: number;
  receivedItems: number;
  notes?: string;
  items?: ASNItem[];
}

export interface ASNItem extends BaseEntity {
  asnId: string;
  productId: string;
  expectedQuantity: number;
  receivedQuantity: number;
  product?: Product;
}

export interface QualityCheck extends BaseEntity {
  checkNumber: string;
  asnId?: string;
  productId: string;
  type: 'incoming' | 'outgoing' | 'periodic';
  status: 'pending' | 'in_progress' | 'passed' | 'failed' | 'quarantine';
  inspectorId?: string;
  checkDate: Date;
  result?: {
    passed: boolean;
    defects: string[];
    notes: string;
  };
  product?: Product;
}

// Labor Management
export interface Worker extends BaseEntity {
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  department: string;
  position: string;
  hireDate: Date;
  isActive: boolean;
  skills: string[];
  hourlyRate: number;
}

export interface Shift extends BaseEntity {
  workerId: string;
  date: Date;
  startTime: string;
  endTime: string;
  breakDuration: number; // in minutes
  status: 'scheduled' | 'in_progress' | 'completed' | 'absent';
  notes?: string;
  worker?: Worker;
}

export interface Performance extends BaseEntity {
  workerId: string;
  date: Date;
  tasksCompleted: number;
  tasksAssigned: number;
  efficiency: number; // percentage
  accuracy: number; // percentage
  hoursWorked: number;
  notes?: string;
  worker?: Worker;
}

// Reports and Analytics
export interface DashboardData {
  summary: {
    totalProducts: number;
    totalOrders: number;
    totalTasks: number;
    totalShipments: number;
    lowStockItems: number;
    pendingOrders: number;
    activeTasks: number;
    totalInventoryValue: number;
    totalInventoryQuantity: number;
    pendingTasks: number;
  };
  recentActivities: Activity[];
  alerts: Alert[];
  kpis: any[];
}

export interface Activity extends BaseEntity {
  type: 'order_created' | 'task_assigned' | 'shipment_shipped' | 'inventory_updated' | 'user_login';
  userId?: string;
  entityType: string;
  entityId: string;
  description: string;
  metadata?: Record<string, any>;
  user?: User;
}

export interface Alert extends BaseEntity {
  type: 'low_stock' | 'overdue_order' | 'system_error' | 'security_breach';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  isRead: boolean;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, any>;
}

// Automation and Integration
export interface WorkflowRule extends BaseEntity {
  name: string;
  description: string;
  trigger: string;
  conditions: Record<string, any>;
  actions: Record<string, any>[];
  isActive: boolean;
  priority: number;
}

export interface Integration extends BaseEntity {
  name: string;
  type: 'erp' | 'crm' | 'accounting' | 'shipping' | 'custom';
  provider: string;
  config: Record<string, any>;
  status: 'active' | 'inactive' | 'error';
  lastSync?: Date;
  isActive: boolean;
}

export interface SystemStatus extends BaseEntity {
  component: string;
  status: 'healthy' | 'warning' | 'error' | 'offline';
  message: string;
  lastCheck: Date;
  responseTime?: number;
  metadata?: Record<string, any>;
}

// API Response types
export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
  errors?: string[];
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Form types
export interface CreateProductRequest {
  sku: string;
  name: string;
  description: string;
  category: string;
  brand: string;
  dimensions: {
    length: number;
    width: number;
    height: number;
    weight: number;
  };
  unitOfMeasure: string;
  minQuantity: number;
  maxQuantity: number;
  reorderPoint: number;
  cost: number;
  price: number;
}

export interface CreateOrderRequest {
  customerId: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  requiredDate: Date;
  notes?: string;
  items: {
    productId: string;
    quantity: number;
    unitPrice: number;
  }[];
}

export interface CreateTaskRequest {
  type: 'picking' | 'packing' | 'receiving' | 'shipping' | 'cycle_count' | 'putaway';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate: Date;
  estimatedDuration: number;
  locationId?: string;
  orderId?: string;
  shipmentId?: string;
  notes?: string;
  items: {
    productId: string;
    quantity: number;
  }[];
}

// Filter and search types
export interface InventoryFilter {
  category?: string;
  status?: string;
  location?: string;
  lowStock?: boolean;
  search?: string;
}

export interface OrderFilter {
  status?: string;
  priority?: string;
  customerId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
}

export interface TaskFilter {
  type?: string;
  status?: string;
  priority?: string;
  assignedTo?: string;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
}

// File Management
export interface FileUpload extends BaseEntity {
  filename: string;
  originalName: string;
  size: number;
  contentType: string;
  path: string;
  uploadedBy: string;
  uploadedAt: Date;
  category: string;
  description: string;
}

export interface FileCategory {
  _id: string;
  count: number;
}

// Email Notifications
export interface EmailNotification extends BaseEntity {
  to: string;
  subject: string;
  body: string;
  type: string;
  status: 'pending' | 'sent' | 'failed';
  sentAt?: Date;
  error?: string;
}

export interface EmailTemplate extends BaseEntity {
  name: string;
  subject: string;
  body: string;
  type: string;
  isActive: boolean;
}

export interface EmailStats {
  total: number;
  sent: number;
  failed: number;
  pending: number;
  successRate: number;
} 