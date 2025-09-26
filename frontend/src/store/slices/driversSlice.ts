import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

export interface Driver {
  id: number;
  name: string;
  phone: string;
  email?: string;
  license_number: string;
  license_category: string;
  license_expiry: string;
  experience_years: number;
  max_orders_per_route: number;
  status: 'available' | 'on_route' | 'break' | 'off_duty' | 'sick_leave';
  current_location?: {
    latitude: number;
    longitude: number;
    address?: string;
    updated_at: string;
  };
  current_vehicle_id?: number;
  current_vehicle_plate?: string;
  current_route_id?: number;
  current_route_name?: string;
  shift_start?: string;
  shift_end?: string;
  break_start?: string;
  break_duration?: number; // minutes
  rating: number;
  total_deliveries: number;
  successful_deliveries: number;
  average_delivery_time: number; // minutes
  fuel_efficiency_score: number;
  customer_rating: number;
  last_active: string;
  created_at: string;
  updated_at: string;
}

export interface CreateDriverRequest {
  name: string;
  phone: string;
  email?: string;
  license_number: string;
  license_category: string;
  license_expiry: string;
  experience_years: number;
  max_orders_per_route?: number;
}

export interface UpdateDriverRequest {
  id: number;
  name?: string;
  phone?: string;
  email?: string;
  license_number?: string;
  license_category?: string;
  license_expiry?: string;
  experience_years?: number;
  max_orders_per_route?: number;
  status?: 'available' | 'on_route' | 'break' | 'off_duty' | 'sick_leave';
}

export interface DriverLocation {
  driver_id: number;
  latitude: number;
  longitude: number;
  address?: string;
  speed?: number;
  heading?: number;
  battery_level?: number;
  timestamp: string;
}

export interface DriverShift {
  driver_id: number;
  shift_start: string;
  shift_end?: string;
  vehicle_id?: number;
  notes?: string;
}

export interface DriverBreak {
  driver_id: number;
  break_start: string;
  break_end?: string;
  break_type: 'lunch' | 'rest' | 'fuel' | 'maintenance' | 'other';
  notes?: string;
}

export interface DriverPerformance {
  driver_id: number;
  date: string;
  total_deliveries: number;
  successful_deliveries: number;
  average_delivery_time: number;
  total_distance: number;
  fuel_consumption: number;
  customer_ratings: number[];
  incidents: number;
  overtime_hours: number;
}

interface DriversState {
  drivers: Driver[];
  availableDrivers: Driver[];
  selectedDriver: Driver | null;
  loading: boolean;
  creating: boolean;
  updating: boolean;
  error: string | null;
  filters: {
    status?: string;
    experience_min?: number;
    license_category?: string;
    rating_min?: number;
    available_for_shift?: boolean;
  };
  realTimeLocations: Record<number, DriverLocation>;
  activeShifts: Record<number, DriverShift>;
  activeBreaks: Record<number, DriverBreak>;
  performance: Record<number, DriverPerformance[]>;
}

const initialState: DriversState = {
  drivers: [],
  availableDrivers: [],
  selectedDriver: null,
  loading: false,
  creating: false,
  updating: false,
  error: null,
  filters: {},
  realTimeLocations: {},
  activeShifts: {},
  activeBreaks: {},
  performance: {},
};

// Async thunks
export const fetchDrivers = createAsyncThunk(
  'drivers/fetchDrivers',
  async (params?: {
    status?: string;
    experience_min?: number;
    license_category?: string;
    rating_min?: number;
    available_for_shift?: boolean;
  }) => {
    const queryParams = new URLSearchParams();
    
    if (params?.status) queryParams.append('status', params.status);
    if (params?.experience_min) queryParams.append('experience_min', params.experience_min.toString());
    if (params?.license_category) queryParams.append('license_category', params.license_category);
    if (params?.rating_min) queryParams.append('rating_min', params.rating_min.toString());
    if (params?.available_for_shift) queryParams.append('available_for_shift', params.available_for_shift.toString());
    
    const response = await fetch(`/api/v1/drivers?${queryParams}`);
    if (!response.ok) {
      throw new Error('Failed to fetch drivers');
    }
    return response.json();
  }
);

export const fetchAvailableDrivers = createAsyncThunk(
  'drivers/fetchAvailableDrivers',
  async () => {
    const response = await fetch('/api/v1/drivers?status=available');
    if (!response.ok) {
      throw new Error('Failed to fetch available drivers');
    }
    return response.json();
  }
);

export const fetchDriverById = createAsyncThunk(
  'drivers/fetchDriverById',
  async (driverId: number) => {
    const response = await fetch(`/api/v1/drivers/${driverId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch driver');
    }
    return response.json();
  }
);

export const createDriver = createAsyncThunk(
  'drivers/createDriver',
  async (driverData: CreateDriverRequest) => {
    const response = await fetch('/api/v1/drivers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(driverData),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to create driver');
    }
    
    return response.json();
  }
);

export const updateDriver = createAsyncThunk(
  'drivers/updateDriver',
  async (driverData: UpdateDriverRequest) => {
    const { id, ...updates } = driverData;
    
    const response = await fetch(`/api/v1/drivers/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to update driver');
    }
    
    return response.json();
  }
);

export const updateDriverLocation = createAsyncThunk(
  'drivers/updateDriverLocation',
  async (locationData: DriverLocation) => {
    const response = await fetch(`/api/v1/drivers/${locationData.driver_id}/location`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(locationData),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to update driver location');
    }
    
    return response.json();
  }
);

export const startDriverShift = createAsyncThunk(
  'drivers/startDriverShift',
  async (shiftData: DriverShift) => {
    const response = await fetch(`/api/v1/drivers/${shiftData.driver_id}/shift/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(shiftData),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to start shift');
    }
    
    return response.json();
  }
);

export const endDriverShift = createAsyncThunk(
  'drivers/endDriverShift',
  async ({ driverId, shiftEnd, notes }: { driverId: number; shiftEnd: string; notes?: string }) => {
    const response = await fetch(`/api/v1/drivers/${driverId}/shift/end`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        shift_end: shiftEnd,
        notes,
      }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to end shift');
    }
    
    return response.json();
  }
);

export const startDriverBreak = createAsyncThunk(
  'drivers/startDriverBreak',
  async (breakData: DriverBreak) => {
    const response = await fetch(`/api/v1/drivers/${breakData.driver_id}/break/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(breakData),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to start break');
    }
    
    return response.json();
  }
);

export const endDriverBreak = createAsyncThunk(
  'drivers/endDriverBreak',
  async ({ driverId, breakEnd, notes }: { driverId: number; breakEnd: string; notes?: string }) => {
    const response = await fetch(`/api/v1/drivers/${driverId}/break/end`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        break_end: breakEnd,
        notes,
      }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to end break');
    }
    
    return response.json();
  }
);

export const fetchDriverPerformance = createAsyncThunk(
  'drivers/fetchDriverPerformance',
  async ({ driverId, startDate, endDate }: { driverId: number; startDate: string; endDate: string }) => {
    const response = await fetch(`/api/v1/drivers/${driverId}/performance?start_date=${startDate}&end_date=${endDate}`);
    if (!response.ok) {
      throw new Error('Failed to fetch driver performance');
    }
    const data = await response.json();
    return { driverId, performance: data };
  }
);

export const assignDriverToVehicle = createAsyncThunk(
  'drivers/assignDriverToVehicle',
  async ({ driverId, vehicleId }: { driverId: number; vehicleId: number }) => {
    const response = await fetch(`/api/v1/drivers/${driverId}/assign-vehicle`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ vehicle_id: vehicleId }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to assign vehicle');
    }
    
    return response.json();
  }
);

export const unassignDriverFromVehicle = createAsyncThunk(
  'drivers/unassignDriverFromVehicle',
  async (driverId: number) => {
    const response = await fetch(`/api/v1/drivers/${driverId}/unassign-vehicle`, {
      method: 'POST',
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to unassign vehicle');
    }
    
    return response.json();
  }
);

export const deleteDriver = createAsyncThunk(
  'drivers/deleteDriver',
  async (driverId: number) => {
    const response = await fetch(`/api/v1/drivers/${driverId}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to delete driver');
    }
    
    return driverId;
  }
);

const driversSlice = createSlice({
  name: 'drivers',
  initialState,
  reducers: {
    setSelectedDriver: (state, action: PayloadAction<Driver | null>) => {
      state.selectedDriver = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    setFilters: (state, action: PayloadAction<Partial<DriversState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = {};
    },
    updateDriverRealtime: (state, action: PayloadAction<Partial<Driver> & { id: number }>) => {
      const { id, ...updates } = action.payload;
      
      // Update in drivers array
      const driverIndex = state.drivers.findIndex(driver => driver.id === id);
      if (driverIndex !== -1) {
        state.drivers[driverIndex] = { ...state.drivers[driverIndex], ...updates };
      }
      
      // Update in availableDrivers array
      const availableIndex = state.availableDrivers.findIndex(driver => driver.id === id);
      if (availableIndex !== -1) {
        if (updates.status === 'available') {
          state.availableDrivers[availableIndex] = { ...state.availableDrivers[availableIndex], ...updates };
        } else {
          // Remove from available if status changed
          state.availableDrivers.splice(availableIndex, 1);
        }
      } else if (updates.status === 'available') {
        // Add to available if status changed to available
        const fullDriver = state.drivers.find(driver => driver.id === id);
        if (fullDriver) {
          state.availableDrivers.push({ ...fullDriver, ...updates });
        }
      }
      
      // Update selected driver if it matches
      if (state.selectedDriver?.id === id) {
        state.selectedDriver = { ...state.selectedDriver, ...updates };
      }
    },
    updateDriverLocationRealtime: (state, action: PayloadAction<DriverLocation>) => {
      const locationData = action.payload;
      
      // Update real-time locations
      state.realTimeLocations[locationData.driver_id] = locationData;
      
      // Update driver current_location
      const driverIndex = state.drivers.findIndex(driver => driver.id === locationData.driver_id);
      if (driverIndex !== -1) {
        state.drivers[driverIndex].current_location = {
          latitude: locationData.latitude,
          longitude: locationData.longitude,
          address: locationData.address,
          updated_at: locationData.timestamp,
        };
        state.drivers[driverIndex].last_active = locationData.timestamp;
      }
      
      // Update selected driver if it matches
      if (state.selectedDriver?.id === locationData.driver_id) {
        state.selectedDriver.current_location = {
          latitude: locationData.latitude,
          longitude: locationData.longitude,
          address: locationData.address,
          updated_at: locationData.timestamp,
        };
        state.selectedDriver.last_active = locationData.timestamp;
      }
    },
    setActiveShift: (state, action: PayloadAction<DriverShift>) => {
      const shiftData = action.payload;
      state.activeShifts[shiftData.driver_id] = shiftData;
      
      // Update driver shift times
      const driverIndex = state.drivers.findIndex(driver => driver.id === shiftData.driver_id);
      if (driverIndex !== -1) {
        state.drivers[driverIndex].shift_start = shiftData.shift_start;
        state.drivers[driverIndex].shift_end = shiftData.shift_end;
      }
    },
    clearActiveShift: (state, action: PayloadAction<number>) => {
      const driverId = action.payload;
      delete state.activeShifts[driverId];
      
      // Clear driver shift times
      const driverIndex = state.drivers.findIndex(driver => driver.id === driverId);
      if (driverIndex !== -1) {
        state.drivers[driverIndex].shift_start = undefined;
        state.drivers[driverIndex].shift_end = undefined;
      }
    },
    setActiveBreak: (state, action: PayloadAction<DriverBreak>) => {
      const breakData = action.payload;
      state.activeBreaks[breakData.driver_id] = breakData;
      
      // Update driver break times
      const driverIndex = state.drivers.findIndex(driver => driver.id === breakData.driver_id);
      if (driverIndex !== -1) {
        state.drivers[driverIndex].break_start = breakData.break_start;
      }
    },
    clearActiveBreak: (state, action: PayloadAction<number>) => {
      const driverId = action.payload;
      delete state.activeBreaks[driverId];
      
      // Clear driver break times
      const driverIndex = state.drivers.findIndex(driver => driver.id === driverId);
      if (driverIndex !== -1) {
        state.drivers[driverIndex].break_start = undefined;
      }
    },
    addDriver: (state, action: PayloadAction<Driver>) => {
      state.drivers.unshift(action.payload);
      if (action.payload.status === 'available') {
        state.availableDrivers.unshift(action.payload);
      }
    },
    removeDriver: (state, action: PayloadAction<number>) => {
      const driverId = action.payload;
      
      state.drivers = state.drivers.filter(driver => driver.id !== driverId);
      state.availableDrivers = state.availableDrivers.filter(driver => driver.id !== driverId);
      
      if (state.selectedDriver?.id === driverId) {
        state.selectedDriver = null;
      }
      
      delete state.realTimeLocations[driverId];
      delete state.activeShifts[driverId];
      delete state.activeBreaks[driverId];
      delete state.performance[driverId];
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch drivers
      .addCase(fetchDrivers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDrivers.fulfilled, (state, action) => {
        state.loading = false;
        state.drivers = action.payload;
      })
      .addCase(fetchDrivers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch drivers';
      })
      
      // Fetch available drivers
      .addCase(fetchAvailableDrivers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAvailableDrivers.fulfilled, (state, action) => {
        state.loading = false;
        state.availableDrivers = action.payload;
      })
      .addCase(fetchAvailableDrivers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch available drivers';
      })
      
      // Fetch driver by ID
      .addCase(fetchDriverById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDriverById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedDriver = action.payload;
        
        // Update in drivers array if exists
        const driverIndex = state.drivers.findIndex(driver => driver.id === action.payload.id);
        if (driverIndex !== -1) {
          state.drivers[driverIndex] = action.payload;
        }
      })
      .addCase(fetchDriverById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch driver';
      })
      
      // Create driver
      .addCase(createDriver.pending, (state) => {
        state.creating = true;
        state.error = null;
      })
      .addCase(createDriver.fulfilled, (state, action) => {
        state.creating = false;
        state.drivers.unshift(action.payload);
        
        if (action.payload.status === 'available') {
          state.availableDrivers.unshift(action.payload);
        }
      })
      .addCase(createDriver.rejected, (state, action) => {
        state.creating = false;
        state.error = action.error.message || 'Failed to create driver';
      })
      
      // Update driver
      .addCase(updateDriver.pending, (state) => {
        state.updating = true;
        state.error = null;
      })
      .addCase(updateDriver.fulfilled, (state, action) => {
        state.updating = false;
        
        const driverIndex = state.drivers.findIndex(driver => driver.id === action.payload.id);
        if (driverIndex !== -1) {
          state.drivers[driverIndex] = action.payload;
        }
        
        const availableIndex = state.availableDrivers.findIndex(driver => driver.id === action.payload.id);
        if (availableIndex !== -1) {
          if (action.payload.status === 'available') {
            state.availableDrivers[availableIndex] = action.payload;
          } else {
            state.availableDrivers.splice(availableIndex, 1);
          }
        } else if (action.payload.status === 'available') {
          state.availableDrivers.push(action.payload);
        }
        
        if (state.selectedDriver?.id === action.payload.id) {
          state.selectedDriver = action.payload;
        }
      })
      .addCase(updateDriver.rejected, (state, action) => {
        state.updating = false;
        state.error = action.error.message || 'Failed to update driver';
      })
      
      // Start shift
      .addCase(startDriverShift.fulfilled, (state, action) => {
        const { driver_id, ...shiftData } = action.payload;
        state.activeShifts[driver_id] = action.payload;
        
        const driverIndex = state.drivers.findIndex(driver => driver.id === driver_id);
        if (driverIndex !== -1) {
          state.drivers[driverIndex].status = 'available';
          state.drivers[driverIndex].shift_start = shiftData.shift_start;
        }
      })
      
      // End shift
      .addCase(endDriverShift.fulfilled, (state, action) => {
        const { driver_id } = action.payload;
        delete state.activeShifts[driver_id];
        
        const driverIndex = state.drivers.findIndex(driver => driver.id === driver_id);
        if (driverIndex !== -1) {
          state.drivers[driverIndex].status = 'off_duty';
          state.drivers[driverIndex].shift_end = action.payload.shift_end;
        }
      })
      
      // Start break
      .addCase(startDriverBreak.fulfilled, (state, action) => {
        const { driver_id } = action.payload;
        state.activeBreaks[driver_id] = action.payload;
        
        const driverIndex = state.drivers.findIndex(driver => driver.id === driver_id);
        if (driverIndex !== -1) {
          state.drivers[driverIndex].status = 'break';
          state.drivers[driverIndex].break_start = action.payload.break_start;
        }
      })
      
      // End break
      .addCase(endDriverBreak.fulfilled, (state, action) => {
        const { driver_id } = action.payload;
        delete state.activeBreaks[driver_id];
        
        const driverIndex = state.drivers.findIndex(driver => driver.id === driver_id);
        if (driverIndex !== -1) {
          state.drivers[driverIndex].status = 'available';
          state.drivers[driverIndex].break_start = undefined;
        }
      })
      
      // Fetch performance
      .addCase(fetchDriverPerformance.fulfilled, (state, action) => {
        const { driverId, performance } = action.payload;
        state.performance[driverId] = performance;
      })
      
      // Assign vehicle
      .addCase(assignDriverToVehicle.fulfilled, (state, action) => {
        const driverIndex = state.drivers.findIndex(driver => driver.id === action.payload.id);
        if (driverIndex !== -1) {
          state.drivers[driverIndex] = action.payload;
        }
        
        if (state.selectedDriver?.id === action.payload.id) {
          state.selectedDriver = action.payload;
        }
      })
      
      // Unassign vehicle
      .addCase(unassignDriverFromVehicle.fulfilled, (state, action) => {
        const driverIndex = state.drivers.findIndex(driver => driver.id === action.payload.id);
        if (driverIndex !== -1) {
          state.drivers[driverIndex] = action.payload;
        }
        
        if (state.selectedDriver?.id === action.payload.id) {
          state.selectedDriver = action.payload;
        }
      })
      
      // Delete driver
      .addCase(deleteDriver.fulfilled, (state, action) => {
        const driverId = action.payload;
        
        state.drivers = state.drivers.filter(driver => driver.id !== driverId);
        state.availableDrivers = state.availableDrivers.filter(driver => driver.id !== driverId);
        
        if (state.selectedDriver?.id === driverId) {
          state.selectedDriver = null;
        }
        
        delete state.realTimeLocations[driverId];
        delete state.activeShifts[driverId];
        delete state.activeBreaks[driverId];
        delete state.performance[driverId];
      });
  },
});

export const {
  setSelectedDriver,
  clearError,
  setFilters,
  clearFilters,
  updateDriverRealtime,
  updateDriverLocationRealtime,
  setActiveShift,
  clearActiveShift,
  setActiveBreak,
  clearActiveBreak,
  addDriver,
  removeDriver,
} = driversSlice.actions;

export default driversSlice.reducer;