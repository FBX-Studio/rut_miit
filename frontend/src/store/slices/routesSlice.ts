import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

export interface RouteStop {
  id: number;
  order_id: number;
  customer_name: string;
  delivery_address: string;
  latitude: number;
  longitude: number;
  time_window_start: string;
  time_window_end: string;
  estimated_arrival: string;
  actual_arrival?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  sequence_number: number;
  packages_count: number;
  weight: number;
  special_instructions?: string;
}

export interface Route {
  id: number;
  route_name: string;
  driver_id: number;
  driver_name: string;
  vehicle_id: number;
  vehicle_license_plate: string;
  status: 'pending' | 'active' | 'completed' | 'paused';
  total_distance: number;
  estimated_duration: number;
  actual_start_time?: string;
  actual_end_time?: string;
  estimated_completion?: string;
  total_stops: number;
  completed_stops: number;
  stops: RouteStop[];
  created_at: string;
  updated_at: string;
}

export interface OptimizationRequest {
  orders: number[];
  vehicles: number[];
  drivers: number[];
  optimization_type: 'static' | 'local' | 'emergency';
  constraints?: {
    max_route_duration?: number;
    max_stops_per_route?: number;
    driver_experience_required?: boolean;
  };
}

interface RoutesState {
  routes: Route[];
  activeRoutes: Route[];
  selectedRoute: Route | null;
  loading: boolean;
  optimizing: boolean;
  error: string | null;
  lastOptimization?: string;
  reoptimizationTriggers: {
    route_id: number;
    trigger_type: string;
    severity: 'low' | 'medium' | 'high';
    message: string;
    timestamp: string;
  }[];
}

const initialState: RoutesState = {
  routes: [],
  activeRoutes: [],
  selectedRoute: null,
  loading: false,
  optimizing: false,
  error: null,
  reoptimizationTriggers: [],
};

export const fetchRoutes = createAsyncThunk(
  'routes/fetchRoutes',
  async (params?: { status?: string; date?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.date) queryParams.append('date', params.date);
    
    const response = await fetch(`/api/v1/routes?${queryParams}`);
    if (!response.ok) {
      throw new Error('Failed to fetch routes');
    }
    return response.json();
  }
);

export const fetchActiveRoutes = createAsyncThunk(
  'routes/fetchActiveRoutes',
  async () => {
    const response = await fetch('/api/v1/routes?status=active');
    if (!response.ok) {
      throw new Error('Failed to fetch active routes');
    }
    return response.json();
  }
);

export const fetchRouteById = createAsyncThunk(
  'routes/fetchRouteById',
  async (routeId: number) => {
    const response = await fetch(`/api/v1/routes/${routeId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch route');
    }
    return response.json();
  }
);

export const optimizeRoutes = createAsyncThunk(
  'routes/optimizeRoutes',
  async (request: OptimizationRequest) => {
    const response = await fetch('/api/v1/routes/optimize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to optimize routes');
    }
    
    return response.json();
  }
);

export const reoptimizeRoute = createAsyncThunk(
  'routes/reoptimizeRoute',
  async ({ routeId, type }: { routeId: number; type: 'local' | 'emergency' }) => {
    const response = await fetch(`/api/v1/routes/${routeId}/reoptimize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ optimization_type: type }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to reoptimize route');
    }
    
    return response.json();
  }
);

export const updateRouteStatus = createAsyncThunk(
  'routes/updateRouteStatus',
  async ({ routeId, status }: { routeId: number; status: string }) => {
    const response = await fetch(`/api/v1/routes/${routeId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to update route status');
    }
    
    return response.json();
  }
);

export const updateStopStatus = createAsyncThunk(
  'routes/updateStopStatus',
  async ({ 
    stopId, 
    status, 
    arrivalTime, 
    completionTime, 
    notes 
  }: { 
    stopId: number; 
    status: string;
    arrivalTime?: string;
    completionTime?: string;
    notes?: string;
  }) => {
    const response = await fetch(`/api/v1/route-stops/${stopId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        status,
        arrival_time: arrivalTime,
        completion_time: completionTime,
        notes,
      }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to update stop status');
    }
    
    return response.json();
  }
);

const routesSlice = createSlice({
  name: 'routes',
  initialState,
  reducers: {
    setSelectedRoute: (state, action: PayloadAction<Route | null>) => {
      state.selectedRoute = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    addReoptimizationTrigger: (state, action) => {
      state.reoptimizationTriggers.unshift(action.payload);
      if (state.reoptimizationTriggers.length > 50) {
        state.reoptimizationTriggers = state.reoptimizationTriggers.slice(0, 50);
      }
    },
    updateRouteRealtime: (state, action: PayloadAction<Partial<Route> & { id: number }>) => {
      const { id, ...updates } = action.payload;
      
      const routeIndex = state.routes.findIndex(route => route.id === id);
      if (routeIndex !== -1) {
        state.routes[routeIndex] = { ...state.routes[routeIndex], ...updates };
      }
      
      const activeRouteIndex = state.activeRoutes.findIndex(route => route.id === id);
      if (activeRouteIndex !== -1) {
        state.activeRoutes[activeRouteIndex] = { ...state.activeRoutes[activeRouteIndex], ...updates };
      }
      
      if (state.selectedRoute?.id === id) {
        state.selectedRoute = { ...state.selectedRoute, ...updates };
      }
    },
    updateStopRealtime: (state, action: PayloadAction<{ routeId: number; stopId: number; updates: Partial<RouteStop> }>) => {
      const { routeId, stopId, updates } = action.payload;
      
      const updateStopInRoute = (route: Route) => {
        const stopIndex = route.stops.findIndex(stop => stop.id === stopId);
        if (stopIndex !== -1) {
          route.stops[stopIndex] = { ...route.stops[stopIndex], ...updates };
          
          route.completed_stops = route.stops.filter(stop => stop.status === 'completed').length;
        }
      };
      
      const routeIndex = state.routes.findIndex(route => route.id === routeId);
      if (routeIndex !== -1) {
        updateStopInRoute(state.routes[routeIndex]);
      }
      
      const activeRouteIndex = state.activeRoutes.findIndex(route => route.id === routeId);
      if (activeRouteIndex !== -1) {
        updateStopInRoute(state.activeRoutes[activeRouteIndex]);
      }
      
      if (state.selectedRoute?.id === routeId) {
        updateStopInRoute(state.selectedRoute);
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchRoutes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRoutes.fulfilled, (state, action) => {
        state.loading = false;
        state.routes = action.payload;
      })
      .addCase(fetchRoutes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch routes';
      })
      
      .addCase(fetchActiveRoutes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchActiveRoutes.fulfilled, (state, action) => {
        state.loading = false;
        state.activeRoutes = action.payload;
      })
      .addCase(fetchActiveRoutes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch active routes';
      })
      
      .addCase(fetchRouteById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRouteById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedRoute = action.payload;
        
        const routeIndex = state.routes.findIndex(route => route.id === action.payload.id);
        if (routeIndex !== -1) {
          state.routes[routeIndex] = action.payload;
        }
      })
      .addCase(fetchRouteById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch route';
      })
      
      .addCase(optimizeRoutes.pending, (state) => {
        state.optimizing = true;
        state.error = null;
      })
      .addCase(optimizeRoutes.fulfilled, (state, action) => {
        state.optimizing = false;
        state.routes = action.payload.routes || [];
        state.lastOptimization = new Date().toISOString();
      })
      .addCase(optimizeRoutes.rejected, (state, action) => {
        state.optimizing = false;
        state.error = action.error.message || 'Failed to optimize routes';
      })
      
      .addCase(reoptimizeRoute.pending, (state) => {
        state.optimizing = true;
        state.error = null;
      })
      .addCase(reoptimizeRoute.fulfilled, (state, action) => {
        state.optimizing = false;
        
        const routeIndex = state.routes.findIndex(route => route.id === action.payload.id);
        if (routeIndex !== -1) {
          state.routes[routeIndex] = action.payload;
        }
        
        const activeRouteIndex = state.activeRoutes.findIndex(route => route.id === action.payload.id);
        if (activeRouteIndex !== -1) {
          state.activeRoutes[activeRouteIndex] = action.payload;
        }
        
        if (state.selectedRoute?.id === action.payload.id) {
          state.selectedRoute = action.payload;
        }
      })
      .addCase(reoptimizeRoute.rejected, (state, action) => {
        state.optimizing = false;
        state.error = action.error.message || 'Failed to reoptimize route';
      })
      
      .addCase(updateRouteStatus.fulfilled, (state, action) => {
        const routeIndex = state.routes.findIndex(route => route.id === action.payload.id);
        if (routeIndex !== -1) {
          state.routes[routeIndex] = action.payload;
        }
        
        const activeRouteIndex = state.activeRoutes.findIndex(route => route.id === action.payload.id);
        if (activeRouteIndex !== -1) {
          state.activeRoutes[activeRouteIndex] = action.payload;
        }
        
        if (state.selectedRoute?.id === action.payload.id) {
          state.selectedRoute = action.payload;
        }
      })
      
      .addCase(updateStopStatus.fulfilled, (state, action) => {
        const { route_id, ...stopData } = action.payload;
        
        const updateStopInRoute = (route: Route) => {
          const stopIndex = route.stops.findIndex(stop => stop.id === stopData.id);
          if (stopIndex !== -1) {
            route.stops[stopIndex] = { ...route.stops[stopIndex], ...stopData };
            route.completed_stops = route.stops.filter(stop => stop.status === 'completed').length;
          }
        };
        
        const routeIndex = state.routes.findIndex(route => route.id === route_id);
        if (routeIndex !== -1) {
          updateStopInRoute(state.routes[routeIndex]);
        }
        
        const activeRouteIndex = state.activeRoutes.findIndex(route => route.id === route_id);
        if (activeRouteIndex !== -1) {
          updateStopInRoute(state.activeRoutes[activeRouteIndex]);
        }
        
        if (state.selectedRoute?.id === route_id) {
          updateStopInRoute(state.selectedRoute!);
        }
      });
  },
});

export const {
  setSelectedRoute,
  clearError,
  addReoptimizationTrigger,
  updateRouteRealtime,
  updateStopRealtime,
} = routesSlice.actions;

export default routesSlice.reducer;