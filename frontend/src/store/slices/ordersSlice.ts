import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

export interface TimeWindow {
  start: string;
  end: string;
}

export interface Order {
  id: number;
  order_number: string;
  customer_id: number;
  customer_name: string;
  customer_phone: string;
  pickup_address: string;
  delivery_address: string;
  pickup_latitude: number;
  pickup_longitude: number;
  delivery_latitude: number;
  delivery_longitude: number;
  pickup_time_window: TimeWindow;
  delivery_time_window: TimeWindow;
  weight: number;
  volume: number;
  packages_count: number;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'assigned' | 'in_transit' | 'delivered' | 'cancelled' | 'failed';
  special_instructions?: string;
  service_time: number; // minutes
  route_id?: number;
  route_stop_id?: number;
  estimated_pickup?: string;
  estimated_delivery?: string;
  actual_pickup?: string;
  actual_delivery?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateOrderRequest {
  customer_id: number;
  pickup_address: string;
  delivery_address: string;
  pickup_time_window: TimeWindow;
  delivery_time_window: TimeWindow;
  weight: number;
  volume: number;
  packages_count: number;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  special_instructions?: string;
  service_time?: number;
}

export interface UpdateOrderRequest {
  id: number;
  pickup_time_window?: TimeWindow;
  delivery_time_window?: TimeWindow;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  special_instructions?: string;
  status?: string;
}

interface OrdersState {
  orders: Order[];
  unassignedOrders: Order[];
  selectedOrder: Order | null;
  loading: boolean;
  creating: boolean;
  updating: boolean;
  error: string | null;
  filters: {
    status?: string;
    priority?: string;
    date_from?: string;
    date_to?: string;
    customer_id?: number;
    route_id?: number;
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const initialState: OrdersState = {
  orders: [],
  unassignedOrders: [],
  selectedOrder: null,
  loading: false,
  creating: false,
  updating: false,
  error: null,
  filters: {},
  pagination: {
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  },
};

// Async thunks
export const fetchOrders = createAsyncThunk(
  'orders/fetchOrders',
  async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    priority?: string;
    date_from?: string;
    date_to?: string;
    customer_id?: number;
    route_id?: number;
  }) => {
    const queryParams = new URLSearchParams();
    
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.status) queryParams.append('status', params.status);
    if (params?.priority) queryParams.append('priority', params.priority);
    if (params?.date_from) queryParams.append('date_from', params.date_from);
    if (params?.date_to) queryParams.append('date_to', params.date_to);
    if (params?.customer_id) queryParams.append('customer_id', params.customer_id.toString());
    if (params?.route_id) queryParams.append('route_id', params.route_id.toString());
    
    const response = await fetch(`/api/v1/orders?${queryParams}`);
    if (!response.ok) {
      throw new Error('Failed to fetch orders');
    }
    return response.json();
  }
);

export const fetchUnassignedOrders = createAsyncThunk(
  'orders/fetchUnassignedOrders',
  async () => {
    const response = await fetch('/api/v1/orders?status=pending');
    if (!response.ok) {
      throw new Error('Failed to fetch unassigned orders');
    }
    return response.json();
  }
);

export const fetchOrderById = createAsyncThunk(
  'orders/fetchOrderById',
  async (orderId: number) => {
    const response = await fetch(`/api/v1/orders/${orderId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch order');
    }
    return response.json();
  }
);

export const createOrder = createAsyncThunk(
  'orders/createOrder',
  async (orderData: CreateOrderRequest) => {
    const response = await fetch('/api/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to create order');
    }
    
    return response.json();
  }
);

export const updateOrder = createAsyncThunk(
  'orders/updateOrder',
  async (orderData: UpdateOrderRequest) => {
    const { id, ...updates } = orderData;
    
    const response = await fetch(`/api/v1/orders/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to update order');
    }
    
    return response.json();
  }
);

export const updateOrderTimeWindow = createAsyncThunk(
  'orders/updateOrderTimeWindow',
  async ({ 
    orderId, 
    timeWindowStart, 
    timeWindowEnd, 
    customerVerified = false 
  }: { 
    orderId: number; 
    timeWindowStart: string; 
    timeWindowEnd: string;
    customerVerified?: boolean;
  }) => {
    const response = await fetch(`/api/v1/orders/${orderId}/time-window`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        time_window_start: timeWindowStart,
        time_window_end: timeWindowEnd,
        customer_verified: customerVerified,
      }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to update time window');
    }
    
    return response.json();
  }
);

export const cancelOrder = createAsyncThunk(
  'orders/cancelOrder',
  async ({ orderId, reason }: { orderId: number; reason?: string }) => {
    const response = await fetch(`/api/v1/orders/${orderId}/cancel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ reason }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to cancel order');
    }
    
    return response.json();
  }
);

export const bulkUpdateOrders = createAsyncThunk(
  'orders/bulkUpdateOrders',
  async ({ orderIds, updates }: { orderIds: number[]; updates: Partial<Order> }) => {
    const response = await fetch('/api/v1/orders/bulk-update', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        order_ids: orderIds,
        updates,
      }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to bulk update orders');
    }
    
    return response.json();
  }
);

const ordersSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    setSelectedOrder: (state, action: PayloadAction<Order | null>) => {
      state.selectedOrder = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    setFilters: (state, action: PayloadAction<Partial<OrdersState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = {};
    },
    setPagination: (state, action: PayloadAction<Partial<OrdersState['pagination']>>) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },
    updateOrderRealtime: (state, action: PayloadAction<Partial<Order> & { id: number }>) => {
      const { id, ...updates } = action.payload;
      
      // Update in orders array
      const orderIndex = state.orders.findIndex(order => order.id === id);
      if (orderIndex !== -1) {
        state.orders[orderIndex] = { ...state.orders[orderIndex], ...updates };
      }
      
      // Update in unassignedOrders array
      const unassignedIndex = state.unassignedOrders.findIndex(order => order.id === id);
      if (unassignedIndex !== -1) {
        if (updates.status === 'assigned') {
          // Remove from unassigned if now assigned
          state.unassignedOrders.splice(unassignedIndex, 1);
        } else {
          state.unassignedOrders[unassignedIndex] = { ...state.unassignedOrders[unassignedIndex], ...updates };
        }
      } else if (updates.status === 'pending') {
        // Add to unassigned if status changed to pending
        const fullOrder = state.orders.find(order => order.id === id);
        if (fullOrder) {
          state.unassignedOrders.push({ ...fullOrder, ...updates });
        }
      }
      
      // Update selected order if it matches
      if (state.selectedOrder?.id === id) {
        state.selectedOrder = { ...state.selectedOrder, ...updates };
      }
    },
    addOrder: (state, action: PayloadAction<Order>) => {
      state.orders.unshift(action.payload);
      if (action.payload.status === 'pending') {
        state.unassignedOrders.unshift(action.payload);
      }
      state.pagination.total += 1;
    },
    removeOrder: (state, action: PayloadAction<number>) => {
      const orderId = action.payload;
      
      state.orders = state.orders.filter(order => order.id !== orderId);
      state.unassignedOrders = state.unassignedOrders.filter(order => order.id !== orderId);
      
      if (state.selectedOrder?.id === orderId) {
        state.selectedOrder = null;
      }
      
      state.pagination.total = Math.max(0, state.pagination.total - 1);
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch orders
      .addCase(fetchOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.orders = action.payload.orders || action.payload;
        
        if (action.payload.pagination) {
          state.pagination = action.payload.pagination;
        }
      })
      .addCase(fetchOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch orders';
      })
      
      // Fetch unassigned orders
      .addCase(fetchUnassignedOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUnassignedOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.unassignedOrders = action.payload.orders || action.payload;
      })
      .addCase(fetchUnassignedOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch unassigned orders';
      })
      
      // Fetch order by ID
      .addCase(fetchOrderById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOrderById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedOrder = action.payload;
        
        // Update in orders array if exists
        const orderIndex = state.orders.findIndex(order => order.id === action.payload.id);
        if (orderIndex !== -1) {
          state.orders[orderIndex] = action.payload;
        }
      })
      .addCase(fetchOrderById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch order';
      })
      
      // Create order
      .addCase(createOrder.pending, (state) => {
        state.creating = true;
        state.error = null;
      })
      .addCase(createOrder.fulfilled, (state, action) => {
        state.creating = false;
        state.orders.unshift(action.payload);
        
        if (action.payload.status === 'pending') {
          state.unassignedOrders.unshift(action.payload);
        }
        
        state.pagination.total += 1;
      })
      .addCase(createOrder.rejected, (state, action) => {
        state.creating = false;
        state.error = action.error.message || 'Failed to create order';
      })
      
      // Update order
      .addCase(updateOrder.pending, (state) => {
        state.updating = true;
        state.error = null;
      })
      .addCase(updateOrder.fulfilled, (state, action) => {
        state.updating = false;
        
        const orderIndex = state.orders.findIndex(order => order.id === action.payload.id);
        if (orderIndex !== -1) {
          state.orders[orderIndex] = action.payload;
        }
        
        const unassignedIndex = state.unassignedOrders.findIndex(order => order.id === action.payload.id);
        if (unassignedIndex !== -1) {
          if (action.payload.status === 'assigned') {
            state.unassignedOrders.splice(unassignedIndex, 1);
          } else {
            state.unassignedOrders[unassignedIndex] = action.payload;
          }
        }
        
        if (state.selectedOrder?.id === action.payload.id) {
          state.selectedOrder = action.payload;
        }
      })
      .addCase(updateOrder.rejected, (state, action) => {
        state.updating = false;
        state.error = action.error.message || 'Failed to update order';
      })
      
      // Update order time window
      .addCase(updateOrderTimeWindow.fulfilled, (state, action) => {
        const orderIndex = state.orders.findIndex(order => order.id === action.payload.id);
        if (orderIndex !== -1) {
          state.orders[orderIndex] = action.payload;
        }
        
        const unassignedIndex = state.unassignedOrders.findIndex(order => order.id === action.payload.id);
        if (unassignedIndex !== -1) {
          state.unassignedOrders[unassignedIndex] = action.payload;
        }
        
        if (state.selectedOrder?.id === action.payload.id) {
          state.selectedOrder = action.payload;
        }
      })
      
      // Cancel order
      .addCase(cancelOrder.fulfilled, (state, action) => {
        const orderIndex = state.orders.findIndex(order => order.id === action.payload.id);
        if (orderIndex !== -1) {
          state.orders[orderIndex] = action.payload;
        }
        
        // Remove from unassigned orders
        state.unassignedOrders = state.unassignedOrders.filter(order => order.id !== action.payload.id);
        
        if (state.selectedOrder?.id === action.payload.id) {
          state.selectedOrder = action.payload;
        }
      })
      
      // Bulk update orders
      .addCase(bulkUpdateOrders.fulfilled, (state, action) => {
        const updatedOrders = action.payload;
        
        updatedOrders.forEach((updatedOrder: Order) => {
          const orderIndex = state.orders.findIndex(order => order.id === updatedOrder.id);
          if (orderIndex !== -1) {
            state.orders[orderIndex] = updatedOrder;
          }
          
          const unassignedIndex = state.unassignedOrders.findIndex(order => order.id === updatedOrder.id);
          if (unassignedIndex !== -1) {
            if (updatedOrder.status === 'assigned') {
              state.unassignedOrders.splice(unassignedIndex, 1);
            } else {
              state.unassignedOrders[unassignedIndex] = updatedOrder;
            }
          }
        });
      });
  },
});

export const {
  setSelectedOrder,
  clearError,
  setFilters,
  clearFilters,
  setPagination,
  updateOrderRealtime,
  addOrder,
  removeOrder,
} = ordersSlice.actions;

export default ordersSlice.reducer;