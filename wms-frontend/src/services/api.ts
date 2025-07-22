import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  RegisterRequest,
  AuthResponse,
  ApiResponse,
  PaginatedResponse,
  User,
  Role,
  Product,
  InventoryItem,
  Location,
  Customer,
  Order,
  Task,
  Carrier,
  Shipment,
  ASN,
  QualityCheck,
  Worker,
  Shift,
  Performance,
  DashboardData,
  Activity,
  Alert,
  WorkflowRule,
  Integration,
  SystemStatus,
  CreateProductRequest,
  CreateOrderRequest,
  CreateTaskRequest,
  InventoryFilter,
  OrderFilter,
  TaskFilter,
  LoginRequest,
  FileUpload,
  FileCategory,
  EmailNotification,
  EmailTemplate,
  EmailStats,
} from '../types';

// API Configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api/v1';

// API Client
class ApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.token = localStorage.getItem('token');
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('token', token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('token');
  }

  hasToken(): boolean {
    return !!this.token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      if (response.status === 401) {
        this.clearToken();
        window.location.href = '/login';
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Authentication
  async login(credentials: LoginRequest): Promise<ApiResponse<AuthResponse>> {
    const response = await this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    
    if (response.success && response.data.token) {
      this.setToken(response.data.token);
    }
    
    return response;
  }

  async register(userData: RegisterRequest): Promise<ApiResponse<AuthResponse>> {
    const response = await this.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    
    if (response.success && response.data.token) {
      this.setToken(response.data.token);
    }
    
    return response;
  }

  async refreshToken(): Promise<ApiResponse<{ token: string }>> {
    const response = await this.request<{ token: string }>('/auth/refresh', {
      method: 'POST',
    });
    
    if (response.success && response.data.token) {
      this.setToken(response.data.token);
    }
    
    return response;
  }

  async getProfile(): Promise<ApiResponse<any>> {
    return this.request<any>('/profile');
  }

  // Generic CRUD operations
  async get<T>(endpoint: string, params?: Record<string, any>): Promise<ApiResponse<T>> {
    const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
    return this.request<T>(`${endpoint}${queryString}`);
  }

  async post<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async patch<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
    });
  }
}

// Create API client instance
export const apiClient = new ApiClient(API_BASE_URL);

// React Query Hooks
export const useLogin = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (credentials: RegisterRequest) => apiClient.login(credentials),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
};

export const useRegister = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (userData: RegisterRequest) => apiClient.register(userData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
};

export const useRefreshToken = () => {
  return useMutation({
    mutationFn: () => apiClient.refreshToken(),
  });
};

export const useProfile = () => {
  return useQuery({
    queryKey: ['profile'],
    queryFn: () => apiClient.getProfile(),
    enabled: apiClient.hasToken(),
  });
};

export const logout = () => {
  localStorage.removeItem('token');
  window.location.href = '/login';
};

// User Management
export const useUsers = (params?: Record<string, any>) => {
  return useQuery({
    queryKey: ['users', params],
    queryFn: () => apiClient.get<PaginatedResponse<User>>('/users', params),
  });
};

export const useUser = (id: string) => {
  return useQuery({
    queryKey: ['users', id],
    queryFn: () => apiClient.get<User>(`/users/${id}`),
    enabled: !!id,
  });
};

export const useCreateUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (userData: Partial<User>) => apiClient.post<User>('/users', userData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<User> }) => 
      apiClient.put<User>(`/users/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
};

export const useDeleteUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
};

// Role Management
export const useRoles = (params?: Record<string, any>) => {
  return useQuery({
    queryKey: ['roles', params],
    queryFn: () => apiClient.get<PaginatedResponse<Role>>('/roles', params),
  });
};

export const useRole = (id: string) => {
  return useQuery({
    queryKey: ['roles', id],
    queryFn: () => apiClient.get<Role>(`/roles/${id}`),
    enabled: !!id,
  });
};

export const useCreateRole = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (roleData: Partial<Role>) => apiClient.post<Role>('/roles', roleData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
    },
  });
};

export const useUpdateRole = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Role> }) => 
      apiClient.put<Role>(`/roles/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
    },
  });
};

export const useDeleteRole = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/roles/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
    },
  });
};

// Inventory Management
export const useProducts = (params?: Record<string, any>) => {
  return useQuery({
    queryKey: ['products', params],
    queryFn: () => apiClient.get<PaginatedResponse<Product>>('/products', params),
  });
};

export const useProduct = (id: string) => {
  return useQuery({
    queryKey: ['products', id],
    queryFn: () => apiClient.get<Product>(`/products/${id}`),
    enabled: !!id,
  });
};

export const useCreateProduct = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (productData: CreateProductRequest) => apiClient.post<Product>('/products', productData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
};

export const useUpdateProduct = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Product> }) => 
      apiClient.put<Product>(`/products/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
};

export const useDeleteProduct = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/products/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
};

export const useInventoryItems = (params?: Record<string, any>) => {
  return useQuery({
    queryKey: ['inventory-items', params],
    queryFn: () => apiClient.get<PaginatedResponse<InventoryItem>>('/inventory-items', params),
  });
};

export const useInventoryItem = (id: string) => {
  return useQuery({
    queryKey: ['inventory-items', id],
    queryFn: () => apiClient.get<InventoryItem>(`/inventory-items/${id}`),
    enabled: !!id,
  });
};

export const useCreateInventoryItem = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (itemData: Partial<InventoryItem>) => apiClient.post<InventoryItem>('/inventory-items', itemData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] });
    },
  });
};

export const useUpdateInventoryItem = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<InventoryItem> }) => 
      apiClient.put<InventoryItem>(`/inventory-items/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] });
    },
  });
};

export const useDeleteInventoryItem = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/inventory-items/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] });
    },
  });
};

export const useLocations = (params?: Record<string, any>) => {
  return useQuery({
    queryKey: ['locations', params],
    queryFn: () => apiClient.get<PaginatedResponse<Location>>('/locations', params),
  });
};

export const useLocation = (id: string) => {
  return useQuery({
    queryKey: ['locations', id],
    queryFn: () => apiClient.get<Location>(`/locations/${id}`),
    enabled: !!id,
  });
};

export const useCreateLocation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (locationData: Partial<Location>) => apiClient.post<Location>('/locations', locationData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
    },
  });
};

export const useUpdateLocation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Location> }) => 
      apiClient.put<Location>(`/locations/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
    },
  });
};

export const useDeleteLocation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/locations/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
    },
  });
};

// Order Management
export const useOrders = (params?: Record<string, any>) => {
  return useQuery({
    queryKey: ['orders', params],
    queryFn: () => apiClient.get<PaginatedResponse<Order>>('/orders', params),
  });
};

export const useOrder = (id: string) => {
  return useQuery({
    queryKey: ['orders', id],
    queryFn: () => apiClient.get<Order>(`/orders/${id}`),
    enabled: !!id,
  });
};

export const useCreateOrder = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (orderData: CreateOrderRequest) => apiClient.post<Order>('/orders', orderData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
};

export const useUpdateOrder = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Order> }) => 
      apiClient.put<Order>(`/orders/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
};

export const useDeleteOrder = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/orders/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
};

export const useCustomers = (params?: Record<string, any>) => {
  return useQuery({
    queryKey: ['customers', params],
    queryFn: () => apiClient.get<PaginatedResponse<Customer>>('/customers', params),
  });
};

export const useCustomer = (id: string) => {
  return useQuery({
    queryKey: ['customers', id],
    queryFn: () => apiClient.get<Customer>(`/customers/${id}`),
    enabled: !!id,
  });
};

export const useCreateCustomer = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (customerData: Partial<Customer>) => apiClient.post<Customer>('/customers', customerData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });
};

export const useUpdateCustomer = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Customer> }) => 
      apiClient.put<Customer>(`/customers/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });
};

export const useDeleteCustomer = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/customers/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });
};

// Task Management
export const useTasks = (params?: Record<string, any>) => {
  return useQuery({
    queryKey: ['tasks', params],
    queryFn: () => apiClient.get<PaginatedResponse<Task>>('/tasks', params),
  });
};

export const useTask = (id: string) => {
  return useQuery({
    queryKey: ['tasks', id],
    queryFn: () => apiClient.get<Task>(`/tasks/${id}`),
    enabled: !!id,
  });
};

export const useCreateTask = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (taskData: CreateTaskRequest) => apiClient.post<Task>('/tasks', taskData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
};

export const useUpdateTask = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Task> }) => 
      apiClient.put<Task>(`/tasks/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
};

export const useDeleteTask = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/tasks/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
};

export const useAssignTask = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, userId }: { id: string; userId: string }) => 
      apiClient.post(`/tasks/${id}/assign`, { userId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
};

export const useStartTask = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => apiClient.post(`/tasks/${id}/start`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
};

export const useCompleteTask = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => apiClient.post(`/tasks/${id}/complete`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
};

// Reports and Analytics
export const useDashboardData = () => {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: () => apiClient.get<DashboardData>('/dashboard'),
  });
};

export const useInventoryReport = (params?: Record<string, any>) => {
  return useQuery({
    queryKey: ['reports', 'inventory', params],
    queryFn: () => apiClient.get('/reports/inventory', params),
  });
};

export const useOrderReport = (params?: Record<string, any>) => {
  return useQuery({
    queryKey: ['reports', 'orders', params],
    queryFn: () => apiClient.get('/reports/orders', params),
  });
};

export const useTaskReport = (params?: Record<string, any>) => {
  return useQuery({
    queryKey: ['reports', 'tasks', params],
    queryFn: () => apiClient.get('/reports/tasks', params),
  });
};

export const useActivities = (params?: Record<string, any>) => {
  return useQuery({
    queryKey: ['activities', params],
    queryFn: () => apiClient.get<PaginatedResponse<Activity>>('/activities', params),
  });
};

export const useCreateActivity = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (activityData: Partial<Activity>) => apiClient.post<Activity>('/activities', activityData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
    },
  });
};

export const useAlerts = (params?: Record<string, any>) => {
  return useQuery({
    queryKey: ['alerts', params],
    queryFn: () => apiClient.get<PaginatedResponse<Alert>>('/alerts', params),
  });
};

export const useCreateAlert = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (alertData: Partial<Alert>) => apiClient.post<Alert>('/alerts', alertData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
  });
};

export const useMarkAlertAsRead = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => apiClient.put(`/alerts/${id}/read`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
  });
};

export const useDeleteAlert = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/alerts/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
  });
};

// Shipping Management
export const useShipments = (params?: Record<string, any>) => {
  return useQuery({
    queryKey: ['shipments', params],
    queryFn: () => apiClient.get<PaginatedResponse<Shipment>>('/shipments', params),
  });
};

export const useShipment = (id: string) => {
  return useQuery({
    queryKey: ['shipments', id],
    queryFn: () => apiClient.get<Shipment>(`/shipments/${id}`),
    enabled: !!id,
  });
};

export const useCreateShipment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (shipmentData: Partial<Shipment>) => apiClient.post<Shipment>('/shipments', shipmentData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shipments'] });
    },
  });
};

export const useUpdateShipment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Shipment> }) => 
      apiClient.put<Shipment>(`/shipments/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shipments'] });
    },
  });
};

export const useDeleteShipment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/shipments/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shipments'] });
    },
  });
};

export const useCarriers = (params?: Record<string, any>) => {
  return useQuery({
    queryKey: ['carriers', params],
    queryFn: () => apiClient.get<PaginatedResponse<Carrier>>('/carriers', params),
  });
};

export const useCarrier = (id: string) => {
  return useQuery({
    queryKey: ['carriers', id],
    queryFn: () => apiClient.get<Carrier>(`/carriers/${id}`),
    enabled: !!id,
  });
};

export const useCreateCarrier = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (carrierData: Partial<Carrier>) => apiClient.post<Carrier>('/carriers', carrierData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['carriers'] });
    },
  });
};

export const useUpdateCarrier = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Carrier> }) => 
      apiClient.put<Carrier>(`/carriers/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['carriers'] });
    },
  });
};

export const useDeleteCarrier = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/carriers/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['carriers'] });
    },
  });
};

// Receiving Management
export const useASNs = (params?: Record<string, any>) => {
  return useQuery({
    queryKey: ['asns', params],
    queryFn: () => apiClient.get<PaginatedResponse<ASN>>('/asns', params),
  });
};

export const useASN = (id: string) => {
  return useQuery({
    queryKey: ['asns', id],
    queryFn: () => apiClient.get<ASN>(`/asns/${id}`),
    enabled: !!id,
  });
};

export const useCreateASN = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (asnData: Partial<ASN>) => apiClient.post<ASN>('/asns', asnData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['asns'] });
    },
  });
};

export const useUpdateASN = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ASN> }) => 
      apiClient.put<ASN>(`/asns/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['asns'] });
    },
  });
};

export const useDeleteASN = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/asns/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['asns'] });
    },
  });
};

export const useReceiveASNItem = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => 
      apiClient.post(`/asns/${id}/receive`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['asns'] });
    },
  });
};

export const useQualityChecks = (params?: Record<string, any>) => {
  return useQuery({
    queryKey: ['quality-checks', params],
    queryFn: () => apiClient.get<PaginatedResponse<QualityCheck>>('/quality-checks', params),
  });
};

export const useQualityCheck = (id: string) => {
  return useQuery({
    queryKey: ['quality-checks', id],
    queryFn: () => apiClient.get<QualityCheck>(`/quality-checks/${id}`),
    enabled: !!id,
  });
};

export const useCreateQualityCheck = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (checkData: Partial<QualityCheck>) => apiClient.post<QualityCheck>('/quality-checks', checkData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quality-checks'] });
    },
  });
};

export const useUpdateQualityCheck = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<QualityCheck> }) => 
      apiClient.put<QualityCheck>(`/quality-checks/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quality-checks'] });
    },
  });
};

export const useDeleteQualityCheck = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/quality-checks/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quality-checks'] });
    },
  });
};

// Automation and Integration
export const useWorkflowRules = (params?: Record<string, any>) => {
  return useQuery({
    queryKey: ['workflow-rules', params],
    queryFn: () => apiClient.get<PaginatedResponse<WorkflowRule>>('/workflow-rules', params),
  });
};

export const useWorkflowRule = (id: string) => {
  return useQuery({
    queryKey: ['workflow-rules', id],
    queryFn: () => apiClient.get<WorkflowRule>(`/workflow-rules/${id}`),
    enabled: !!id,
  });
};

export const useCreateWorkflowRule = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (ruleData: Partial<WorkflowRule>) => apiClient.post<WorkflowRule>('/workflow-rules', ruleData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflow-rules'] });
    },
  });
};

export const useUpdateWorkflowRule = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<WorkflowRule> }) => 
      apiClient.put<WorkflowRule>(`/workflow-rules/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflow-rules'] });
    },
  });
};

export const useDeleteWorkflowRule = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/workflow-rules/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflow-rules'] });
    },
  });
};

export const useIntegrations = (params?: Record<string, any>) => {
  return useQuery({
    queryKey: ['integrations', params],
    queryFn: () => apiClient.get<PaginatedResponse<Integration>>('/integrations', params),
  });
};

export const useIntegration = (id: string) => {
  return useQuery({
    queryKey: ['integrations', id],
    queryFn: () => apiClient.get<Integration>(`/integrations/${id}`),
    enabled: !!id,
  });
};

export const useCreateIntegration = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (integrationData: Partial<Integration>) => apiClient.post<Integration>('/integrations', integrationData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
    },
  });
};

export const useUpdateIntegration = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Integration> }) => 
      apiClient.put<Integration>(`/integrations/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
    },
  });
};

export const useDeleteIntegration = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/integrations/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
    },
  });
};

export const useSyncIntegration = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => apiClient.post(`/integrations/${id}/sync`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
    },
  });
};

export const useSystemStatus = (params?: Record<string, any>) => {
  return useQuery({
    queryKey: ['system-status', params],
    queryFn: () => apiClient.get<PaginatedResponse<SystemStatus>>('/system-status', params),
  });
};

export const useSystemStatusRecord = (id: string) => {
  return useQuery({
    queryKey: ['system-status', id],
    queryFn: () => apiClient.get<SystemStatus>(`/system-status/${id}`),
    enabled: !!id,
  });
};

export const useCreateSystemStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (statusData: Partial<SystemStatus>) => apiClient.post<SystemStatus>('/system-status', statusData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-status'] });
    },
  });
};

export const useUpdateSystemStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<SystemStatus> }) => 
      apiClient.put<SystemStatus>(`/system-status/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-status'] });
    },
  });
};

export const useDeleteSystemStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/system-status/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-status'] });
    },
  });
};

export const useSystemHealth = () => {
  return useQuery({
    queryKey: ['system-health'],
    queryFn: () => apiClient.get<SystemStatus[]>('/system-health'),
  });
};

// Generic hooks for any endpoint
export const useGet = <T>(endpoint: string, params?: Record<string, any>) => {
  return useQuery({
    queryKey: [endpoint, params],
    queryFn: () => apiClient.get<T>(endpoint, params),
  });
};

export const usePost = <T>(endpoint: string) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: any) => apiClient.post<T>(endpoint, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [endpoint] });
    },
  });
};

export const usePut = <T>(endpoint: string) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: any) => apiClient.put<T>(endpoint, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [endpoint] });
    },
  });
};

export const usePatch = <T>(endpoint: string) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: any) => apiClient.patch<T>(endpoint, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [endpoint] });
    },
  });
};

export const useDelete = <T>(endpoint: string) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: () => apiClient.delete<T>(endpoint),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [endpoint] });
    },
  });
};

// Labor Management
export const useWorkers = (params?: Record<string, any>) => {
  return useQuery({
    queryKey: ['workers', params],
    queryFn: () => apiClient.get<PaginatedResponse<Worker>>('/workers', params),
  });
};

export const useWorker = (id: string) => {
  return useQuery({
    queryKey: ['workers', id],
    queryFn: () => apiClient.get<Worker>(`/workers/${id}`),
    enabled: !!id,
  });
};

export const useCreateWorker = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (workerData: Partial<Worker>) => apiClient.post<Worker>('/workers', workerData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workers'] });
    },
  });
};

export const useUpdateWorker = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Worker> }) => 
      apiClient.put<Worker>(`/workers/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workers'] });
    },
  });
};

export const useDeleteWorker = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/workers/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workers'] });
    },
  });
};

export const useShifts = (params?: Record<string, any>) => {
  return useQuery({
    queryKey: ['shifts', params],
    queryFn: () => apiClient.get<PaginatedResponse<Shift>>('/shifts', params),
  });
};

export const useShift = (id: string) => {
  return useQuery({
    queryKey: ['shifts', id],
    queryFn: () => apiClient.get<Shift>(`/shifts/${id}`),
    enabled: !!id,
  });
};

export const useCreateShift = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (shiftData: Partial<Shift>) => apiClient.post<Shift>('/shifts', shiftData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
    },
  });
};

export const useUpdateShift = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Shift> }) => 
      apiClient.put<Shift>(`/shifts/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
    },
  });
};

export const useDeleteShift = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/shifts/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
    },
  });
};

export const usePerformance = (params?: Record<string, any>) => {
  return useQuery({
    queryKey: ['performance', params],
    queryFn: () => apiClient.get<PaginatedResponse<Performance>>('/performance', params),
  });
};

export const usePerformanceRecord = (id: string) => {
  return useQuery({
    queryKey: ['performance', id],
    queryFn: () => apiClient.get<Performance>(`/performance/${id}`),
    enabled: !!id,
  });
};

export const useCreatePerformance = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (performanceData: Partial<Performance>) => apiClient.post<Performance>('/performance', performanceData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['performance'] });
    },
  });
};

export const useUpdatePerformance = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Performance> }) => 
      apiClient.put<Performance>(`/performance/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['performance'] });
    },
  });
};

export const useDeletePerformance = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/performance/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['performance'] });
    },
  });
};

// File Management Hooks
export const useFiles = (params?: Record<string, any>) => {
  return useQuery({
    queryKey: ['files', params],
    queryFn: () => apiClient.get<PaginatedResponse<FileUpload>>('/files', params),
  });
};

export const useFile = (id: string) => {
  return useQuery({
    queryKey: ['files', id],
    queryFn: () => apiClient.get<FileUpload>(`/files/${id}`),
    enabled: !!id,
  });
};

export const useFileCategories = () => {
  return useQuery({
    queryKey: ['file-categories'],
    queryFn: () => apiClient.get<FileCategory[]>('/files/categories'),
  });
};

export const useUploadFile = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (formData: FormData) => {
      // For file uploads, we need to send FormData directly
      return fetch(`${apiClient['baseURL']}/files/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      }).then(res => res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files'] });
      queryClient.invalidateQueries({ queryKey: ['file-categories'] });
    },
  });
};

export const useDeleteFile = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/files/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files'] });
      queryClient.invalidateQueries({ queryKey: ['file-categories'] });
    },
  });
};

// Email Notification Hooks
export const useEmailNotifications = (params?: Record<string, any>) => {
  return useQuery({
    queryKey: ['email-notifications', params],
    queryFn: () => apiClient.get<PaginatedResponse<EmailNotification>>('/email/notifications', params),
  });
};

export const useEmailTemplates = () => {
  return useQuery({
    queryKey: ['email-templates'],
    queryFn: () => apiClient.get<EmailTemplate[]>('/email/templates'),
  });
};

export const useEmailStats = () => {
  return useQuery({
    queryKey: ['email-stats'],
    queryFn: () => apiClient.get<EmailStats>('/email/stats'),
  });
};

export const useSendEmail = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: any) => apiClient.post<EmailNotification>('/email/send', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-notifications'] });
      queryClient.invalidateQueries({ queryKey: ['email-stats'] });
    },
  });
};

export const useSendTemplatedEmail = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: any) => apiClient.post<EmailNotification>('/email/send-templated', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-notifications'] });
      queryClient.invalidateQueries({ queryKey: ['email-stats'] });
    },
  });
};

export const useCreateEmailTemplate = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: any) => apiClient.post<EmailTemplate>('/email/templates', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-templates'] });
    },
  });
};