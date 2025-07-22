import { toast } from 'react-toastify';

export interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: string;
}

export interface WebSocketEvent {
  type: 'order_created' | 'order_updated' | 'task_assigned' | 'inventory_updated' | 'alert' | 'notification';
  data: any;
}

class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private listeners: Map<string, ((data: any) => void)[]> = new Map();
  private isConnecting = false;

  constructor() {
    this.connect();
  }

  private connect() {
    if (this.isConnecting || this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    this.isConnecting = true;
    const token = localStorage.getItem('token');
    
    if (!token) {
      console.log('No token available, skipping WebSocket connection');
      this.isConnecting = false;
      return;
    }

    try {
      this.ws = new WebSocket(`ws://localhost:8080/ws?token=${token}`);

      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        toast.success('Real-time updates connected');
      };

      this.ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.ws.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason);
        this.isConnecting = false;
        
        if (!event.wasClean && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.scheduleReconnect();
        } else {
          toast.error('Real-time updates disconnected');
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.isConnecting = false;
      };

    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
      this.isConnecting = false;
    }
  }

  private scheduleReconnect() {
    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    console.log(`Scheduling WebSocket reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);
    
    setTimeout(() => {
      this.connect();
    }, delay);
  }

  private handleMessage(message: WebSocketMessage) {
    console.log('WebSocket message received:', message);

    // Handle different message types
    switch (message.type) {
      case 'order_created':
        this.notifyListeners('order_created', message.data);
        toast.info(`New order received: ${message.data.orderNumber}`);
        break;
      
      case 'order_updated':
        this.notifyListeners('order_updated', message.data);
        toast.info(`Order updated: ${message.data.orderNumber}`);
        break;
      
      case 'task_assigned':
        this.notifyListeners('task_assigned', message.data);
        toast.info(`New task assigned: ${message.data.taskType}`);
        break;
      
      case 'inventory_updated':
        this.notifyListeners('inventory_updated', message.data);
        toast.info(`Inventory updated: ${message.data.productName}`);
        break;
      
      case 'alert':
        this.notifyListeners('alert', message.data);
        toast.warning(`Alert: ${message.data.message}`);
        break;
      
      case 'notification':
        this.notifyListeners('notification', message.data);
        toast.info(message.data.message);
        break;
      
      default:
        console.log('Unknown message type:', message.type);
    }
  }

  private notifyListeners(eventType: string, data: any) {
    const listeners = this.listeners.get(eventType);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(data);
        } catch (error) {
          console.error('Error in WebSocket listener:', error);
        }
      });
    }
  }

  public subscribe(eventType: string, callback: (data: any) => void) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }
    this.listeners.get(eventType)!.push(callback);

    // Return unsubscribe function
    return () => {
      const listeners = this.listeners.get(eventType);
      if (listeners) {
        const index = listeners.indexOf(callback);
        if (index > -1) {
          listeners.splice(index, 1);
        }
      }
    };
  }

  public send(message: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket is not connected');
    }
  }

  public disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  public isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  public reconnect() {
    this.disconnect();
    this.reconnectAttempts = 0;
    this.connect();
  }
}

// Create singleton instance
const websocketService = new WebSocketService();

export default websocketService; 