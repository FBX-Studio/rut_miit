import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

export interface Customer {
  id: number;
  name: string;
  phone: string;
  email?: string;
  address: string;
  latitude: number;
  longitude: number;
  customer_type: 'individual' | 'business';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  default_time_window_start?: string;
  default_time_window_end?: string;
  special_instructions?: string;
  access_code?: string;
  contact_person?: string;
  delivery_preferences?: {
    preferred_delivery_time?: string;
    avoid_time_ranges?: Array<{ start: string; end: string }>;
    special_requirements?: string[];
    notification_preferences?: {
      sms: boolean;
      email: boolean;
      call: boolean;
    };
  };
  rating: number;
  total_orders: number;
  successful_deliveries: number;
  average_delivery_rating: number;
  last_order_date?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateCustomerRequest {
  name: string;
  phone: string;
  email?: string;
  address: string;
  customer_type: 'individual' | 'business';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  default_time_window_start?: string;
  default_time_window_end?: string;
  special_instructions?: string;
  access_code?: string;
  contact_person?: string;
  delivery_preferences?: Customer['delivery_preferences'];
}

export interface UpdateCustomerRequest {
  id: number;
  name?: string;
  phone?: string;
  email?: string;
  address?: string;
  customer_type?: 'individual' | 'business';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  default_time_window_start?: string;
  default_time_window_end?: string;
  special_instructions?: string;
  access_code?: string;
  contact_person?: string;
  delivery_preferences?: Customer['delivery_preferences'];
}

export interface CustomerFeedback {
  customer_id: number;
  order_id: number;
  rating: number;
  comment?: string;
  delivery_time_rating: number;
  driver_rating: number;
  service_rating: number;
  created_at: string;
}

export interface CustomerStats {
  customer_id: number;
  total_orders: number;
  successful_deliveries: number;
  cancelled_orders: number;
  average_order_value: number;
  average_delivery_time: number;
  preferred_delivery_hours: Record<string, number>;
  most_ordered_items: Array<{ item: string; count: number }>;
  delivery_success_rate: number;
  customer_satisfaction_score: number;
}

interface CustomersState {
  customers: Customer[];
  selectedCustomer: Customer | null;
  loading: boolean;
  creating: boolean;
  updating: boolean;
  error: string | null;
  filters: {
    customer_type?: string;
    priority?: string;
    rating_min?: number;
    has_recent_orders?: boolean;
    search?: string;
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  customerStats: Record<number, CustomerStats>;
  customerFeedback: Record<number, CustomerFeedback[]>;
}

const initialState: CustomersState = {
  customers: [],
  selectedCustomer: null,
  loading: false,
  creating: false,
  updating: false,
  error: null,
  filters: {},
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  },
  customerStats: {},
  customerFeedback: {},
};

// Async thunks
export const fetchCustomers = createAsyncThunk(
  'customers/fetchCustomers',
  async (params?: {
    page?: number;
    limit?: number;
    customer_type?: string;
    priority?: string;
    rating_min?: number;
    has_recent_orders?: boolean;
    search?: string;
  }) => {
    const queryParams = new URLSearchParams();
    
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.customer_type) queryParams.append('customer_type', params.customer_type);
    if (params?.priority) queryParams.append('priority', params.priority);
    if (params?.rating_min) queryParams.append('rating_min', params.rating_min.toString());
    if (params?.has_recent_orders) queryParams.append('has_recent_orders', params.has_recent_orders.toString());
    if (params?.search) queryParams.append('search', params.search);
    
    const response = await fetch(`/api/v1/customers?${queryParams}`);
    if (!response.ok) {
      throw new Error('Failed to fetch customers');
    }
    return response.json();
  }
);

export const fetchCustomerById = createAsyncThunk(
  'customers/fetchCustomerById',
  async (customerId: number) => {
    const response = await fetch(`/api/v1/customers/${customerId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch customer');
    }
    return response.json();
  }
);

export const createCustomer = createAsyncThunk(
  'customers/createCustomer',
  async (customerData: CreateCustomerRequest) => {
    const response = await fetch('/api/v1/customers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(customerData),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to create customer');
    }
    
    return response.json();
  }
);

export const updateCustomer = createAsyncThunk(
  'customers/updateCustomer',
  async (customerData: UpdateCustomerRequest) => {
    const { id, ...updates } = customerData;
    
    const response = await fetch(`/api/v1/customers/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to update customer');
    }
    
    return response.json();
  }
);

export const deleteCustomer = createAsyncThunk(
  'customers/deleteCustomer',
  async (customerId: number) => {
    const response = await fetch(`/api/v1/customers/${customerId}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to delete customer');
    }
    
    return customerId;
  }
);

export const fetchCustomerStats = createAsyncThunk(
  'customers/fetchCustomerStats',
  async ({ customerId, startDate, endDate }: { customerId: number; startDate?: string; endDate?: string }) => {
    const queryParams = new URLSearchParams();
    if (startDate) queryParams.append('start_date', startDate);
    if (endDate) queryParams.append('end_date', endDate);
    
    const response = await fetch(`/api/v1/customers/${customerId}/stats?${queryParams}`);
    if (!response.ok) {
      throw new Error('Failed to fetch customer stats');
    }
    const data = await response.json();
    return { customerId, stats: data };
  }
);

export const fetchCustomerFeedback = createAsyncThunk(
  'customers/fetchCustomerFeedback',
  async ({ customerId, limit }: { customerId: number; limit?: number }) => {
    const queryParams = new URLSearchParams();
    if (limit) queryParams.append('limit', limit.toString());
    
    const response = await fetch(`/api/v1/customers/${customerId}/feedback?${queryParams}`);
    if (!response.ok) {
      throw new Error('Failed to fetch customer feedback');
    }
    const data = await response.json();
    return { customerId, feedback: data };
  }
);

export const submitCustomerFeedback = createAsyncThunk(
  'customers/submitCustomerFeedback',
  async (feedbackData: Omit<CustomerFeedback, 'created_at'>) => {
    const response = await fetch('/api/v1/customers/feedback', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(feedbackData),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to submit feedback');
    }
    
    return response.json();
  }
);

export const geocodeCustomerAddress = createAsyncThunk(
  'customers/geocodeCustomerAddress',
  async (address: string) => {
    const response = await fetch('/api/v1/geocode', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ address }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to geocode address');
    }
    
    return response.json();
  }
);

export const searchCustomers = createAsyncThunk(
  'customers/searchCustomers',
  async (query: string) => {
    const response = await fetch(`/api/v1/customers/search?q=${encodeURIComponent(query)}`);
    if (!response.ok) {
      throw new Error('Failed to search customers');
    }
    return response.json();
  }
);

const customersSlice = createSlice({
  name: 'customers',
  initialState,
  reducers: {
    setSelectedCustomer: (state, action: PayloadAction<Customer | null>) => {
      state.selectedCustomer = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    setFilters: (state, action: PayloadAction<Partial<CustomersState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = {};
    },
    setPagination: (state, action: PayloadAction<Partial<CustomersState['pagination']>>) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },
    updateCustomerRealtime: (state, action: PayloadAction<Partial<Customer> & { id: number }>) => {
      const { id, ...updates } = action.payload;
      
      // Update in customers array
      const customerIndex = state.customers.findIndex(customer => customer.id === id);
      if (customerIndex !== -1) {
        state.customers[customerIndex] = { ...state.customers[customerIndex], ...updates };
      }
      
      // Update selected customer if it matches
      if (state.selectedCustomer?.id === id) {
        state.selectedCustomer = { ...state.selectedCustomer, ...updates };
      }
    },
    addCustomer: (state, action: PayloadAction<Customer>) => {
      state.customers.unshift(action.payload);
      state.pagination.total += 1;
    },
    removeCustomer: (state, action: PayloadAction<number>) => {
      const customerId = action.payload;
      
      state.customers = state.customers.filter(customer => customer.id !== customerId);
      state.pagination.total = Math.max(0, state.pagination.total - 1);
      
      if (state.selectedCustomer?.id === customerId) {
        state.selectedCustomer = null;
      }
      
      delete state.customerStats[customerId];
      delete state.customerFeedback[customerId];
    },
    updateCustomerStats: (state, action: PayloadAction<{ customerId: number; stats: Partial<CustomerStats> }>) => {
      const { customerId, stats } = action.payload;
      
      if (state.customerStats[customerId]) {
        state.customerStats[customerId] = { ...state.customerStats[customerId], ...stats };
      } else {
        state.customerStats[customerId] = stats as CustomerStats;
      }
      
      // Update customer totals if available
      const customerIndex = state.customers.findIndex(customer => customer.id === customerId);
      if (customerIndex !== -1 && stats.total_orders !== undefined) {
        state.customers[customerIndex].total_orders = stats.total_orders;
        state.customers[customerIndex].successful_deliveries = stats.successful_deliveries || 0;
      }
    },
    addCustomerFeedback: (state, action: PayloadAction<CustomerFeedback>) => {
      const feedback = action.payload;
      
      if (!state.customerFeedback[feedback.customer_id]) {
        state.customerFeedback[feedback.customer_id] = [];
      }
      
      state.customerFeedback[feedback.customer_id].unshift(feedback);
      
      // Update customer rating
      const customerIndex = state.customers.findIndex(customer => customer.id === feedback.customer_id);
      if (customerIndex !== -1) {
        const allFeedback = state.customerFeedback[feedback.customer_id];
        const averageRating = allFeedback.reduce((sum, f) => sum + f.rating, 0) / allFeedback.length;
        state.customers[customerIndex].average_delivery_rating = Math.round(averageRating * 10) / 10;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch customers
      .addCase(fetchCustomers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCustomers.fulfilled, (state, action) => {
        state.loading = false;
        state.customers = action.payload.items || action.payload;
        
        if (action.payload.pagination) {
          state.pagination = action.payload.pagination;
        }
      })
      .addCase(fetchCustomers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch customers';
      })
      
      // Fetch customer by ID
      .addCase(fetchCustomerById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCustomerById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedCustomer = action.payload;
        
        // Update in customers array if exists
        const customerIndex = state.customers.findIndex(customer => customer.id === action.payload.id);
        if (customerIndex !== -1) {
          state.customers[customerIndex] = action.payload;
        }
      })
      .addCase(fetchCustomerById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch customer';
      })
      
      // Create customer
      .addCase(createCustomer.pending, (state) => {
        state.creating = true;
        state.error = null;
      })
      .addCase(createCustomer.fulfilled, (state, action) => {
        state.creating = false;
        state.customers.unshift(action.payload);
        state.pagination.total += 1;
      })
      .addCase(createCustomer.rejected, (state, action) => {
        state.creating = false;
        state.error = action.error.message || 'Failed to create customer';
      })
      
      // Update customer
      .addCase(updateCustomer.pending, (state) => {
        state.updating = true;
        state.error = null;
      })
      .addCase(updateCustomer.fulfilled, (state, action) => {
        state.updating = false;
        
        const customerIndex = state.customers.findIndex(customer => customer.id === action.payload.id);
        if (customerIndex !== -1) {
          state.customers[customerIndex] = action.payload;
        }
        
        if (state.selectedCustomer?.id === action.payload.id) {
          state.selectedCustomer = action.payload;
        }
      })
      .addCase(updateCustomer.rejected, (state, action) => {
        state.updating = false;
        state.error = action.error.message || 'Failed to update customer';
      })
      
      // Delete customer
      .addCase(deleteCustomer.fulfilled, (state, action) => {
        const customerId = action.payload;
        
        state.customers = state.customers.filter(customer => customer.id !== customerId);
        state.pagination.total = Math.max(0, state.pagination.total - 1);
        
        if (state.selectedCustomer?.id === customerId) {
          state.selectedCustomer = null;
        }
        
        delete state.customerStats[customerId];
        delete state.customerFeedback[customerId];
      })
      
      // Fetch customer stats
      .addCase(fetchCustomerStats.fulfilled, (state, action) => {
        const { customerId, stats } = action.payload;
        state.customerStats[customerId] = stats;
      })
      
      // Fetch customer feedback
      .addCase(fetchCustomerFeedback.fulfilled, (state, action) => {
        const { customerId, feedback } = action.payload;
        state.customerFeedback[customerId] = feedback;
      })
      
      // Submit customer feedback
      .addCase(submitCustomerFeedback.fulfilled, (state, action) => {
        const feedback = action.payload;
        
        if (!state.customerFeedback[feedback.customer_id]) {
          state.customerFeedback[feedback.customer_id] = [];
        }
        
        state.customerFeedback[feedback.customer_id].unshift(feedback);
        
        // Update customer rating
        const customerIndex = state.customers.findIndex(customer => customer.id === feedback.customer_id);
        if (customerIndex !== -1) {
          const allFeedback = state.customerFeedback[feedback.customer_id];
          const averageRating = allFeedback.reduce((sum, f) => sum + f.rating, 0) / allFeedback.length;
          state.customers[customerIndex].average_delivery_rating = Math.round(averageRating * 10) / 10;
        }
      })
      
      // Search customers
      .addCase(searchCustomers.fulfilled, (state, action) => {
        // For search results, we might want to handle them differently
        // For now, we'll just update the customers array
        state.customers = action.payload;
      });
  },
});

export const {
  setSelectedCustomer,
  clearError,
  setFilters,
  clearFilters,
  setPagination,
  updateCustomerRealtime,
  addCustomer,
  removeCustomer,
  updateCustomerStats,
  addCustomerFeedback,
} = customersSlice.actions;

export default customersSlice.reducer;