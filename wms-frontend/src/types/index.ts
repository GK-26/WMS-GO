// User and Authentication Types
export interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: UserRole[];
  permissions: Permission[];
  isActive: boolean;
  lastLogin?: Date;
}

export interface UserRole {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
}

export interface Permission {
  id: string;
  name: string;
  description: string;
  resource: string;
  action: 'create' | 'read' | 'update' | 'delete';
}

// Inventory Types
export interface Product {
  id: string;
  sku: string;
  name: string;
  description: string;
  category: string;
  dimensions: {
    length: number;
    width: number;
    height: number;
    weight: number;
  };
  isHazardous: boolean;
  requiresRefrigeration: boolean;
  lotTracking: boolean;
  serialTracking: boolean;
  minStockLevel: number;
  maxStockLevel: number;
  reorderPoint: number;
  supplierId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface InventoryItem {
  id: string;
  productId: string;
  product: Product;
  quantity: number;
  locationId: string;
  location: Location;
  lotNumber?: string;
  serialNumber?: string;
  expirationDate?: Date;
  status: 'available' | 'reserved' | 'quarantine' | 'damaged';
  lastCounted: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Location {
  id: string;
  name: string;
  type: 'zone' | 'aisle' | 'rack' | 'bin';
  parentId?: string;
  warehouseId: string;
  coordinates?: {
    x: number;
    y: number;
    z: number;
  };
  capacity: number;
  isActive: boolean;
}

export interface Warehouse {
  id: string;
  name: string;
  address: Address;
  timezone: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Order Management Types
export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  customer: Customer;
  status: OrderStatus;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  orderType: 'standard' | 'express' | 'bulk';
  items: OrderItem[];
  totalQuantity: number;
  totalValue: number;
  dueDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  product: Product;
  quantity: number;
  quantityPicked: number;
  quantityPacked: number;
  quantityShipped: number;
  status: 'pending' | 'picking' | 'picked' | 'packing' | 'packed' | 'shipped';
  priority: 'low' | 'medium' | 'high';
}

export type OrderStatus = 
  | 'pending'
  | 'confirmed'
  | 'picking'
  | 'picked'
  | 'packing'
  | 'packed'
  | 'shipping'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: Address;
  isActive: boolean;
}

// Task Management Types
export interface Task {
  id: string;
  type: TaskType;
  status: TaskStatus;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedTo?: string;
  assignedToUser?: User;
  locationId: string;
  location: Location;
  productId?: string;
  product?: Product;
  quantity?: number;
  orderId?: string;
  order?: Order;
  estimatedDuration: number; // in minutes
  actualDuration?: number;
  startedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type TaskType = 
  | 'receiving'
  | 'putaway'
  | 'picking'
  | 'packing'
  | 'shipping'
  | 'cycle_count'
  | 'inventory_adjustment';

export type TaskStatus = 
  | 'pending'
  | 'assigned'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'failed';

// Common Types
export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

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

// KPI and Analytics Types
export interface KPI {
  id: string;
  name: string;
  value: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  changePercent: number;
  target?: number;
  period: 'hour' | 'day' | 'week' | 'month';
}

export interface DashboardData {
  kpis: KPI[];
  recentActivity: Activity[];
  alerts: Alert[];
  charts: ChartData[];
}

export interface Activity {
  id: string;
  type: string;
  description: string;
  userId: string;
  user: User;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface Alert {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  isRead: boolean;
  createdAt: Date;
}

export interface ChartData {
  id: string;
  type: 'line' | 'bar' | 'pie' | 'area';
  title: string;
  data: any[];
  options?: Record<string, any>;
} 