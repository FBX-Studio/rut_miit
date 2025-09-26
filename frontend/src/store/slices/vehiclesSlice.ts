import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

export interface Vehicle {
  id: number;
  license_plate: string;
  model: string;
  capacity: number;
  max_volume: number;
  fuel_type: 'gasoline' | 'diesel' | 'electric' | 'hybrid';
  fuel_consumption: number; // L/100km or kWh/100km
  status: 'available' | 'in_use' | 'maintenance' | 'out_of_service';
  current_location?: {
    latitude: number;
    longitude: number;
    address?: string;
    updated_at: string;
  };
  current_driver_id?: number;
  current_driver_name?: string;
  current_route_id?: number;
  current_route_name?: string;
  maintenance_due?: string;
  last_maintenance?: string;
  odometer: number;
  year: number;
  vin?: string;
  insurance_expiry?: string;
  registration_expiry?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateVehicleRequest {
  license_plate: string;
  model: string;
  capacity: number;
  max_volume: number;
  fuel_type: 'gasoline' | 'diesel' | 'electric' | 'hybrid';
  fuel_consumption: number;
  year: number;
  vin?: string;
  insurance_expiry?: string;
  registration_expiry?: string;
}

export interface UpdateVehicleRequest {
  id: number;
  license_plate?: string;
  model?: string;
  capacity?: number;
  max_volume?: number;
  fuel_type?: 'gasoline' | 'diesel' | 'electric' | 'hybrid';
  fuel_consumption?: number;
  status?: 'available' | 'in_use' | 'maintenance' | 'out_of_service';
  maintenance_due?: string;
  last_maintenance?: string;
  odometer?: number;
  insurance_expiry?: string;
  registration_expiry?: string;
}

export interface VehicleLocation {
  vehicle_id: number;
  latitude: number;
  longitude: number;
  address?: string;
  speed?: number;
  heading?: number;
  timestamp: string;
}

interface VehiclesState {
  vehicles: Vehicle[];
  availableVehicles: Vehicle[];
  selectedVehicle: Vehicle | null;
  loading: boolean;
  creating: boolean;
  updating: boolean;
  error: string | null;
  filters: {
    status?: string;
    fuel_type?: string;
    capacity_min?: number;
    capacity_max?: number;
    maintenance_due?: boolean;
  };
  realTimeLocations: Record<number, VehicleLocation>;
}

const initialState: VehiclesState = {
  vehicles: [],
  availableVehicles: [],
  selectedVehicle: null,
  loading: false,
  creating: false,
  updating: false,
  error: null,
  filters: {},
  realTimeLocations: {},
};

// Async thunks
export const fetchVehicles = createAsyncThunk(
  'vehicles/fetchVehicles',
  async (params?: {
    status?: string;
    fuel_type?: string;
    capacity_min?: number;
    capacity_max?: number;
    maintenance_due?: boolean;
  }) => {
    const queryParams = new URLSearchParams();
    
    if (params?.status) queryParams.append('status', params.status);
    if (params?.fuel_type) queryParams.append('fuel_type', params.fuel_type);
    if (params?.capacity_min) queryParams.append('capacity_min', params.capacity_min.toString());
    if (params?.capacity_max) queryParams.append('capacity_max', params.capacity_max.toString());
    if (params?.maintenance_due) queryParams.append('maintenance_due', params.maintenance_due.toString());
    
    const response = await fetch(`/api/v1/vehicles?${queryParams}`);
    if (!response.ok) {
      throw new Error('Failed to fetch vehicles');
    }
    return response.json();
  }
);

export const fetchAvailableVehicles = createAsyncThunk(
  'vehicles/fetchAvailableVehicles',
  async () => {
    const response = await fetch('/api/v1/vehicles?status=available');
    if (!response.ok) {
      throw new Error('Failed to fetch available vehicles');
    }
    return response.json();
  }
);

export const fetchVehicleById = createAsyncThunk(
  'vehicles/fetchVehicleById',
  async (vehicleId: number) => {
    const response = await fetch(`/api/v1/vehicles/${vehicleId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch vehicle');
    }
    return response.json();
  }
);

export const createVehicle = createAsyncThunk(
  'vehicles/createVehicle',
  async (vehicleData: CreateVehicleRequest) => {
    const response = await fetch('/api/v1/vehicles', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(vehicleData),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to create vehicle');
    }
    
    return response.json();
  }
);

export const updateVehicle = createAsyncThunk(
  'vehicles/updateVehicle',
  async (vehicleData: UpdateVehicleRequest) => {
    const { id, ...updates } = vehicleData;
    
    const response = await fetch(`/api/v1/vehicles/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to update vehicle');
    }
    
    return response.json();
  }
);

export const updateVehicleLocation = createAsyncThunk(
  'vehicles/updateVehicleLocation',
  async (locationData: VehicleLocation) => {
    const response = await fetch(`/api/v1/vehicles/${locationData.vehicle_id}/location`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(locationData),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to update vehicle location');
    }
    
    return response.json();
  }
);

export const scheduleVehicleMaintenance = createAsyncThunk(
  'vehicles/scheduleVehicleMaintenance',
  async ({ vehicleId, maintenanceDate, notes }: { vehicleId: number; maintenanceDate: string; notes?: string }) => {
    const response = await fetch(`/api/v1/vehicles/${vehicleId}/maintenance`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        maintenance_date: maintenanceDate,
        notes,
      }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to schedule maintenance');
    }
    
    return response.json();
  }
);

export const completeVehicleMaintenance = createAsyncThunk(
  'vehicles/completeVehicleMaintenance',
  async ({ vehicleId, completionDate, notes, odometer }: { 
    vehicleId: number; 
    completionDate: string; 
    notes?: string;
    odometer?: number;
  }) => {
    const response = await fetch(`/api/v1/vehicles/${vehicleId}/maintenance/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        completion_date: completionDate,
        notes,
        odometer,
      }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to complete maintenance');
    }
    
    return response.json();
  }
);

export const deleteVehicle = createAsyncThunk(
  'vehicles/deleteVehicle',
  async (vehicleId: number) => {
    const response = await fetch(`/api/v1/vehicles/${vehicleId}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to delete vehicle');
    }
    
    return vehicleId;
  }
);

const vehiclesSlice = createSlice({
  name: 'vehicles',
  initialState,
  reducers: {
    setSelectedVehicle: (state, action: PayloadAction<Vehicle | null>) => {
      state.selectedVehicle = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    setFilters: (state, action: PayloadAction<Partial<VehiclesState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = {};
    },
    updateVehicleRealtime: (state, action: PayloadAction<Partial<Vehicle> & { id: number }>) => {
      const { id, ...updates } = action.payload;
      
      // Update in vehicles array
      const vehicleIndex = state.vehicles.findIndex(vehicle => vehicle.id === id);
      if (vehicleIndex !== -1) {
        state.vehicles[vehicleIndex] = { ...state.vehicles[vehicleIndex], ...updates };
      }
      
      // Update in availableVehicles array
      const availableIndex = state.availableVehicles.findIndex(vehicle => vehicle.id === id);
      if (availableIndex !== -1) {
        if (updates.status === 'available') {
          state.availableVehicles[availableIndex] = { ...state.availableVehicles[availableIndex], ...updates };
        } else {
          // Remove from available if status changed
          state.availableVehicles.splice(availableIndex, 1);
        }
      } else if (updates.status === 'available') {
        // Add to available if status changed to available
        const fullVehicle = state.vehicles.find(vehicle => vehicle.id === id);
        if (fullVehicle) {
          state.availableVehicles.push({ ...fullVehicle, ...updates });
        }
      }
      
      // Update selected vehicle if it matches
      if (state.selectedVehicle?.id === id) {
        state.selectedVehicle = { ...state.selectedVehicle, ...updates };
      }
    },
    updateVehicleLocationRealtime: (state, action: PayloadAction<VehicleLocation>) => {
      const locationData = action.payload;
      
      // Update real-time locations
      state.realTimeLocations[locationData.vehicle_id] = locationData;
      
      // Update vehicle current_location
      const vehicleIndex = state.vehicles.findIndex(vehicle => vehicle.id === locationData.vehicle_id);
      if (vehicleIndex !== -1) {
        state.vehicles[vehicleIndex].current_location = {
          latitude: locationData.latitude,
          longitude: locationData.longitude,
          address: locationData.address,
          updated_at: locationData.timestamp,
        };
      }
      
      // Update selected vehicle if it matches
      if (state.selectedVehicle?.id === locationData.vehicle_id) {
        state.selectedVehicle.current_location = {
          latitude: locationData.latitude,
          longitude: locationData.longitude,
          address: locationData.address,
          updated_at: locationData.timestamp,
        };
      }
    },
    addVehicle: (state, action: PayloadAction<Vehicle>) => {
      state.vehicles.unshift(action.payload);
      if (action.payload.status === 'available') {
        state.availableVehicles.unshift(action.payload);
      }
    },
    removeVehicle: (state, action: PayloadAction<number>) => {
      const vehicleId = action.payload;
      
      state.vehicles = state.vehicles.filter(vehicle => vehicle.id !== vehicleId);
      state.availableVehicles = state.availableVehicles.filter(vehicle => vehicle.id !== vehicleId);
      
      if (state.selectedVehicle?.id === vehicleId) {
        state.selectedVehicle = null;
      }
      
      delete state.realTimeLocations[vehicleId];
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch vehicles
      .addCase(fetchVehicles.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchVehicles.fulfilled, (state, action) => {
        state.loading = false;
        state.vehicles = action.payload;
      })
      .addCase(fetchVehicles.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch vehicles';
      })
      
      // Fetch available vehicles
      .addCase(fetchAvailableVehicles.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAvailableVehicles.fulfilled, (state, action) => {
        state.loading = false;
        state.availableVehicles = action.payload;
      })
      .addCase(fetchAvailableVehicles.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch available vehicles';
      })
      
      // Fetch vehicle by ID
      .addCase(fetchVehicleById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchVehicleById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedVehicle = action.payload;
        
        // Update in vehicles array if exists
        const vehicleIndex = state.vehicles.findIndex(vehicle => vehicle.id === action.payload.id);
        if (vehicleIndex !== -1) {
          state.vehicles[vehicleIndex] = action.payload;
        }
      })
      .addCase(fetchVehicleById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch vehicle';
      })
      
      // Create vehicle
      .addCase(createVehicle.pending, (state) => {
        state.creating = true;
        state.error = null;
      })
      .addCase(createVehicle.fulfilled, (state, action) => {
        state.creating = false;
        state.vehicles.unshift(action.payload);
        
        if (action.payload.status === 'available') {
          state.availableVehicles.unshift(action.payload);
        }
      })
      .addCase(createVehicle.rejected, (state, action) => {
        state.creating = false;
        state.error = action.error.message || 'Failed to create vehicle';
      })
      
      // Update vehicle
      .addCase(updateVehicle.pending, (state) => {
        state.updating = true;
        state.error = null;
      })
      .addCase(updateVehicle.fulfilled, (state, action) => {
        state.updating = false;
        
        const vehicleIndex = state.vehicles.findIndex(vehicle => vehicle.id === action.payload.id);
        if (vehicleIndex !== -1) {
          state.vehicles[vehicleIndex] = action.payload;
        }
        
        const availableIndex = state.availableVehicles.findIndex(vehicle => vehicle.id === action.payload.id);
        if (availableIndex !== -1) {
          if (action.payload.status === 'available') {
            state.availableVehicles[availableIndex] = action.payload;
          } else {
            state.availableVehicles.splice(availableIndex, 1);
          }
        } else if (action.payload.status === 'available') {
          state.availableVehicles.push(action.payload);
        }
        
        if (state.selectedVehicle?.id === action.payload.id) {
          state.selectedVehicle = action.payload;
        }
      })
      .addCase(updateVehicle.rejected, (state, action) => {
        state.updating = false;
        state.error = action.error.message || 'Failed to update vehicle';
      })
      
      // Update vehicle location
      .addCase(updateVehicleLocation.fulfilled, (state, action) => {
        const { vehicle_id, ...locationData } = action.payload;
        
        state.realTimeLocations[vehicle_id] = action.payload;
        
        const vehicleIndex = state.vehicles.findIndex(vehicle => vehicle.id === vehicle_id);
        if (vehicleIndex !== -1) {
          state.vehicles[vehicleIndex].current_location = {
            latitude: locationData.latitude,
            longitude: locationData.longitude,
            address: locationData.address,
            updated_at: locationData.timestamp,
          };
        }
        
        if (state.selectedVehicle?.id === vehicle_id) {
          state.selectedVehicle!.current_location = {
            latitude: locationData.latitude,
            longitude: locationData.longitude,
            address: locationData.address,
            updated_at: locationData.timestamp,
          };
        }
      })
      
      // Schedule maintenance
      .addCase(scheduleVehicleMaintenance.fulfilled, (state, action) => {
        const vehicleIndex = state.vehicles.findIndex(vehicle => vehicle.id === action.payload.id);
        if (vehicleIndex !== -1) {
          state.vehicles[vehicleIndex] = action.payload;
        }
        
        if (state.selectedVehicle?.id === action.payload.id) {
          state.selectedVehicle = action.payload;
        }
      })
      
      // Complete maintenance
      .addCase(completeVehicleMaintenance.fulfilled, (state, action) => {
        const vehicleIndex = state.vehicles.findIndex(vehicle => vehicle.id === action.payload.id);
        if (vehicleIndex !== -1) {
          state.vehicles[vehicleIndex] = action.payload;
        }
        
        // Add back to available if status changed
        if (action.payload.status === 'available') {
          const availableIndex = state.availableVehicles.findIndex(vehicle => vehicle.id === action.payload.id);
          if (availableIndex === -1) {
            state.availableVehicles.push(action.payload);
          }
        }
        
        if (state.selectedVehicle?.id === action.payload.id) {
          state.selectedVehicle = action.payload;
        }
      })
      
      // Delete vehicle
      .addCase(deleteVehicle.fulfilled, (state, action) => {
        const vehicleId = action.payload;
        
        state.vehicles = state.vehicles.filter(vehicle => vehicle.id !== vehicleId);
        state.availableVehicles = state.availableVehicles.filter(vehicle => vehicle.id !== vehicleId);
        
        if (state.selectedVehicle?.id === vehicleId) {
          state.selectedVehicle = null;
        }
        
        delete state.realTimeLocations[vehicleId];
      });
  },
});

export const {
  setSelectedVehicle,
  clearError,
  setFilters,
  clearFilters,
  updateVehicleRealtime,
  updateVehicleLocationRealtime,
  addVehicle,
  removeVehicle,
} = vehiclesSlice.actions;

export default vehiclesSlice.reducer;