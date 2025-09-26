import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

export interface Event {
  id: number;
  event_type: 'route_created' | 'route_started' | 'route_completed' | 'route_cancelled' | 
              'stop_arrived' | 'stop_completed' | 'stop_failed' | 'stop_skipped' |
              'delivery_successful' | 'delivery_failed' | 'delivery_delayed' |
              'reoptimization_triggered' | 'reoptimization_completed' |
              'driver_break_started' | 'driver_break_ended' | 'driver_shift_started' | 'driver_shift_ended' |
              'vehicle_maintenance' | 'vehicle_breakdown' | 'traffic_delay' | 'weather_delay' |
              'customer_unavailable' | 'address_not_found' | 'access_denied' |
              'system_error' | 'api_error' | 'optimization_failed';
  severity: 'info' | 'warning' | 'error' | 'critical';
  status: 'new' | 'acknowledged' | 'resolved' | 'ignored';
  title: string;
  description: string;
  metadata?: Record<string, any>;
  route_id?: number;
  route_name?: string;
  stop_id?: number;
  stop_address?: string;
  order_id?: number;
  order_number?: string;
  driver_id?: number;
  driver_name?: string;
  vehicle_id?: number;
  vehicle_plate?: string;
  customer_id?: number;
  customer_name?: string;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  estimated_delay?: number; // minutes
  actual_delay?: number; // minutes
  resolution_notes?: string;
  resolved_by?: string;
  resolved_at?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateEventRequest {
  event_type: Event['event_type'];
  severity: Event['severity'];
  title: string;
  description: string;
  metadata?: Record<string, any>;
  route_id?: number;
  stop_id?: number;
  order_id?: number;
  driver_id?: number;
  vehicle_id?: number;
  customer_id?: number;
  location?: Event['location'];
  estimated_delay?: number;
}

export interface UpdateEventRequest {
  id: number;
  status?: Event['status'];
  resolution_notes?: string;
  actual_delay?: number;
}

export interface EventFilter {
  event_type?: string[];
  severity?: string[];
  status?: string[];
  route_id?: number;
  driver_id?: number;
  vehicle_id?: number;
  customer_id?: number;
  date_from?: string;
  date_to?: string;
  search?: string;
}

export interface EventStats {
  total_events: number;
  events_by_type: Record<string, number>;
  events_by_severity: Record<string, number>;
  events_by_status: Record<string, number>;
  recent_events_count: number;
  critical_events_count: number;
  unresolved_events_count: number;
  average_resolution_time: number; // minutes
}

interface EventsState {
  events: Event[];
  recentEvents: Event[];
  criticalEvents: Event[];
  selectedEvent: Event | null;
  loading: boolean;
  creating: boolean;
  updating: boolean;
  error: string | null;
  filters: EventFilter;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  stats: EventStats | null;
  realTimeEvents: Event[];
  notifications: {
    show: boolean;
    count: number;
    lastEventId?: number;
  };
}

const initialState: EventsState = {
  events: [],
  recentEvents: [],
  criticalEvents: [],
  selectedEvent: null,
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
  stats: null,
  realTimeEvents: [],
  notifications: {
    show: false,
    count: 0,
  },
};

// Async thunks
export const fetchEvents = createAsyncThunk(
  'events/fetchEvents',
  async (params?: EventFilter & { page?: number; limit?: number }) => {
    const queryParams = new URLSearchParams();
    
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.event_type?.length) queryParams.append('event_type', params.event_type.join(','));
    if (params?.severity?.length) queryParams.append('severity', params.severity.join(','));
    if (params?.status?.length) queryParams.append('status', params.status.join(','));
    if (params?.route_id) queryParams.append('route_id', params.route_id.toString());
    if (params?.driver_id) queryParams.append('driver_id', params.driver_id.toString());
    if (params?.vehicle_id) queryParams.append('vehicle_id', params.vehicle_id.toString());
    if (params?.customer_id) queryParams.append('customer_id', params.customer_id.toString());
    if (params?.date_from) queryParams.append('date_from', params.date_from);
    if (params?.date_to) queryParams.append('date_to', params.date_to);
    if (params?.search) queryParams.append('search', params.search);
    
    const response = await fetch(`/api/v1/events?${queryParams}`);
    if (!response.ok) {
      throw new Error('Failed to fetch events');
    }
    return response.json();
  }
);

export const fetchRecentEvents = createAsyncThunk(
  'events/fetchRecentEvents',
  async (limit: number = 10) => {
    const response = await fetch(`/api/v1/events/recent?limit=${limit}`);
    if (!response.ok) {
      throw new Error('Failed to fetch recent events');
    }
    return response.json();
  }
);

export const fetchCriticalEvents = createAsyncThunk(
  'events/fetchCriticalEvents',
  async () => {
    const response = await fetch('/api/v1/events?severity=critical,error&status=new,acknowledged');
    if (!response.ok) {
      throw new Error('Failed to fetch critical events');
    }
    return response.json();
  }
);

export const fetchEventById = createAsyncThunk(
  'events/fetchEventById',
  async (eventId: number) => {
    const response = await fetch(`/api/v1/events/${eventId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch event');
    }
    return response.json();
  }
);

export const createEvent = createAsyncThunk(
  'events/createEvent',
  async (eventData: CreateEventRequest) => {
    const response = await fetch('/api/v1/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(eventData),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to create event');
    }
    
    return response.json();
  }
);

export const updateEvent = createAsyncThunk(
  'events/updateEvent',
  async (eventData: UpdateEventRequest) => {
    const { id, ...updates } = eventData;
    
    const response = await fetch(`/api/v1/events/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to update event');
    }
    
    return response.json();
  }
);

export const acknowledgeEvent = createAsyncThunk(
  'events/acknowledgeEvent',
  async (eventId: number) => {
    const response = await fetch(`/api/v1/events/${eventId}/acknowledge`, {
      method: 'POST',
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to acknowledge event');
    }
    
    return response.json();
  }
);

export const resolveEvent = createAsyncThunk(
  'events/resolveEvent',
  async ({ eventId, resolutionNotes, actualDelay }: { 
    eventId: number; 
    resolutionNotes?: string; 
    actualDelay?: number;
  }) => {
    const response = await fetch(`/api/v1/events/${eventId}/resolve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        resolution_notes: resolutionNotes,
        actual_delay: actualDelay,
      }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to resolve event');
    }
    
    return response.json();
  }
);

export const bulkUpdateEvents = createAsyncThunk(
  'events/bulkUpdateEvents',
  async ({ eventIds, updates }: { eventIds: number[]; updates: Partial<UpdateEventRequest> }) => {
    const response = await fetch('/api/v1/events/bulk-update', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        event_ids: eventIds,
        updates,
      }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to bulk update events');
    }
    
    return response.json();
  }
);

export const fetchEventStats = createAsyncThunk(
  'events/fetchEventStats',
  async (params?: { date_from?: string; date_to?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.date_from) queryParams.append('date_from', params.date_from);
    if (params?.date_to) queryParams.append('date_to', params.date_to);
    
    const response = await fetch(`/api/v1/events/stats?${queryParams}`);
    if (!response.ok) {
      throw new Error('Failed to fetch event stats');
    }
    return response.json();
  }
);

export const deleteEvent = createAsyncThunk(
  'events/deleteEvent',
  async (eventId: number) => {
    const response = await fetch(`/api/v1/events/${eventId}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to delete event');
    }
    
    return eventId;
  }
);

const eventsSlice = createSlice({
  name: 'events',
  initialState,
  reducers: {
    setSelectedEvent: (state, action: PayloadAction<Event | null>) => {
      state.selectedEvent = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    setFilters: (state, action: PayloadAction<Partial<EventFilter>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = {};
    },
    setPagination: (state, action: PayloadAction<Partial<EventsState['pagination']>>) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },
    addRealTimeEvent: (state, action: PayloadAction<Event>) => {
      const newEvent = action.payload;
      
      // Add to real-time events (keep only last 100)
      state.realTimeEvents.unshift(newEvent);
      if (state.realTimeEvents.length > 100) {
        state.realTimeEvents = state.realTimeEvents.slice(0, 100);
      }
      
      // Add to main events list if it matches current filters
      state.events.unshift(newEvent);
      
      // Add to recent events (keep only last 20)
      state.recentEvents.unshift(newEvent);
      if (state.recentEvents.length > 20) {
        state.recentEvents = state.recentEvents.slice(0, 20);
      }
      
      // Add to critical events if critical
      if (newEvent.severity === 'critical' || newEvent.severity === 'error') {
        state.criticalEvents.unshift(newEvent);
        if (state.criticalEvents.length > 50) {
          state.criticalEvents = state.criticalEvents.slice(0, 50);
        }
      }
      
      // Update notifications
      state.notifications.count += 1;
      state.notifications.lastEventId = newEvent.id;
      
      // Auto-show notifications for critical events
      if (newEvent.severity === 'critical') {
        state.notifications.show = true;
      }
      
      // Update pagination total
      state.pagination.total += 1;
    },
    updateEventRealtime: (state, action: PayloadAction<Partial<Event> & { id: number }>) => {
      const { id, ...updates } = action.payload;
      
      // Update in all arrays
      const updateEventInArray = (events: Event[]) => {
        const eventIndex = events.findIndex(event => event.id === id);
        if (eventIndex !== -1) {
          events[eventIndex] = { ...events[eventIndex], ...updates };
        }
      };
      
      updateEventInArray(state.events);
      updateEventInArray(state.recentEvents);
      updateEventInArray(state.criticalEvents);
      updateEventInArray(state.realTimeEvents);
      
      // Update selected event if it matches
      if (state.selectedEvent?.id === id) {
        state.selectedEvent = { ...state.selectedEvent, ...updates };
      }
      
      // Remove from critical events if resolved
      if (updates.status === 'resolved' || updates.status === 'ignored') {
        state.criticalEvents = state.criticalEvents.filter(event => event.id !== id);
      }
    },
    removeEvent: (state, action: PayloadAction<number>) => {
      const eventId = action.payload;
      
      state.events = state.events.filter(event => event.id !== eventId);
      state.recentEvents = state.recentEvents.filter(event => event.id !== eventId);
      state.criticalEvents = state.criticalEvents.filter(event => event.id !== eventId);
      state.realTimeEvents = state.realTimeEvents.filter(event => event.id !== eventId);
      
      if (state.selectedEvent?.id === eventId) {
        state.selectedEvent = null;
      }
      
      state.pagination.total = Math.max(0, state.pagination.total - 1);
    },
    markNotificationsAsRead: (state) => {
      state.notifications.show = false;
      state.notifications.count = 0;
    },
    showNotifications: (state) => {
      state.notifications.show = true;
    },
    hideNotifications: (state) => {
      state.notifications.show = false;
    },
    clearRealTimeEvents: (state) => {
      state.realTimeEvents = [];
    },
    bulkAcknowledgeEvents: (state, action: PayloadAction<number[]>) => {
      const eventIds = action.payload;
      
      const updateStatus = (events: Event[]) => {
        events.forEach(event => {
          if (eventIds.includes(event.id)) {
            event.status = 'acknowledged';
            event.updated_at = new Date().toISOString();
          }
        });
      };
      
      updateStatus(state.events);
      updateStatus(state.recentEvents);
      updateStatus(state.criticalEvents);
      updateStatus(state.realTimeEvents);
      
      if (state.selectedEvent && eventIds.includes(state.selectedEvent.id)) {
        state.selectedEvent.status = 'acknowledged';
        state.selectedEvent.updated_at = new Date().toISOString();
      }
    },
    bulkResolveEvents: (state, action: PayloadAction<{ eventIds: number[]; resolutionNotes?: string }>) => {
      const { eventIds, resolutionNotes } = action.payload;
      const now = new Date().toISOString();
      
      const updateStatus = (events: Event[]) => {
        events.forEach(event => {
          if (eventIds.includes(event.id)) {
            event.status = 'resolved';
            event.resolved_at = now;
            event.resolution_notes = resolutionNotes;
            event.updated_at = now;
          }
        });
      };
      
      updateStatus(state.events);
      updateStatus(state.recentEvents);
      updateStatus(state.realTimeEvents);
      
      // Remove from critical events
      state.criticalEvents = state.criticalEvents.filter(event => !eventIds.includes(event.id));
      
      if (state.selectedEvent && eventIds.includes(state.selectedEvent.id)) {
        state.selectedEvent.status = 'resolved';
        state.selectedEvent.resolved_at = now;
        state.selectedEvent.resolution_notes = resolutionNotes;
        state.selectedEvent.updated_at = now;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch events
      .addCase(fetchEvents.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEvents.fulfilled, (state, action) => {
        state.loading = false;
        state.events = action.payload.items || action.payload;
        
        if (action.payload.pagination) {
          state.pagination = action.payload.pagination;
        }
      })
      .addCase(fetchEvents.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch events';
      })
      
      // Fetch recent events
      .addCase(fetchRecentEvents.fulfilled, (state, action) => {
        state.recentEvents = action.payload;
      })
      
      // Fetch critical events
      .addCase(fetchCriticalEvents.fulfilled, (state, action) => {
        state.criticalEvents = action.payload.items || action.payload;
      })
      
      // Fetch event by ID
      .addCase(fetchEventById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEventById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedEvent = action.payload;
        
        // Update in events array if exists
        const eventIndex = state.events.findIndex(event => event.id === action.payload.id);
        if (eventIndex !== -1) {
          state.events[eventIndex] = action.payload;
        }
      })
      .addCase(fetchEventById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch event';
      })
      
      // Create event
      .addCase(createEvent.pending, (state) => {
        state.creating = true;
        state.error = null;
      })
      .addCase(createEvent.fulfilled, (state, action) => {
        state.creating = false;
        
        const newEvent = action.payload;
        
        state.events.unshift(newEvent);
        state.recentEvents.unshift(newEvent);
        
        if (newEvent.severity === 'critical' || newEvent.severity === 'error') {
          state.criticalEvents.unshift(newEvent);
        }
        
        state.pagination.total += 1;
      })
      .addCase(createEvent.rejected, (state, action) => {
        state.creating = false;
        state.error = action.error.message || 'Failed to create event';
      })
      
      // Update event
      .addCase(updateEvent.pending, (state) => {
        state.updating = true;
        state.error = null;
      })
      .addCase(updateEvent.fulfilled, (state, action) => {
        state.updating = false;
        
        const updatedEvent = action.payload;
        
        // Update in all arrays
        const updateEventInArray = (events: Event[]) => {
          const eventIndex = events.findIndex(event => event.id === updatedEvent.id);
          if (eventIndex !== -1) {
            events[eventIndex] = updatedEvent;
          }
        };
        
        updateEventInArray(state.events);
        updateEventInArray(state.recentEvents);
        updateEventInArray(state.criticalEvents);
        updateEventInArray(state.realTimeEvents);
        
        if (state.selectedEvent?.id === updatedEvent.id) {
          state.selectedEvent = updatedEvent;
        }
        
        // Remove from critical events if resolved
        if (updatedEvent.status === 'resolved' || updatedEvent.status === 'ignored') {
          state.criticalEvents = state.criticalEvents.filter(event => event.id !== updatedEvent.id);
        }
      })
      .addCase(updateEvent.rejected, (state, action) => {
        state.updating = false;
        state.error = action.error.message || 'Failed to update event';
      })
      
      // Acknowledge event
      .addCase(acknowledgeEvent.fulfilled, (state, action) => {
        const updatedEvent = action.payload;
        
        const updateEventInArray = (events: Event[]) => {
          const eventIndex = events.findIndex(event => event.id === updatedEvent.id);
          if (eventIndex !== -1) {
            events[eventIndex] = updatedEvent;
          }
        };
        
        updateEventInArray(state.events);
        updateEventInArray(state.recentEvents);
        updateEventInArray(state.criticalEvents);
        updateEventInArray(state.realTimeEvents);
        
        if (state.selectedEvent?.id === updatedEvent.id) {
          state.selectedEvent = updatedEvent;
        }
      })
      
      // Resolve event
      .addCase(resolveEvent.fulfilled, (state, action) => {
        const resolvedEvent = action.payload;
        
        const updateEventInArray = (events: Event[]) => {
          const eventIndex = events.findIndex(event => event.id === resolvedEvent.id);
          if (eventIndex !== -1) {
            events[eventIndex] = resolvedEvent;
          }
        };
        
        updateEventInArray(state.events);
        updateEventInArray(state.recentEvents);
        updateEventInArray(state.realTimeEvents);
        
        // Remove from critical events
        state.criticalEvents = state.criticalEvents.filter(event => event.id !== resolvedEvent.id);
        
        if (state.selectedEvent?.id === resolvedEvent.id) {
          state.selectedEvent = resolvedEvent;
        }
      })
      
      // Bulk update events
      .addCase(bulkUpdateEvents.fulfilled, (state, action) => {
        const updatedEvents = action.payload;
        
        updatedEvents.forEach((updatedEvent: Event) => {
          const updateEventInArray = (events: Event[]) => {
            const eventIndex = events.findIndex(event => event.id === updatedEvent.id);
            if (eventIndex !== -1) {
              events[eventIndex] = updatedEvent;
            }
          };
          
          updateEventInArray(state.events);
          updateEventInArray(state.recentEvents);
          updateEventInArray(state.criticalEvents);
          updateEventInArray(state.realTimeEvents);
          
          if (state.selectedEvent?.id === updatedEvent.id) {
            state.selectedEvent = updatedEvent;
          }
        });
      })
      
      // Fetch event stats
      .addCase(fetchEventStats.fulfilled, (state, action) => {
        state.stats = action.payload;
      })
      
      // Delete event
      .addCase(deleteEvent.fulfilled, (state, action) => {
        const eventId = action.payload;
        
        state.events = state.events.filter(event => event.id !== eventId);
        state.recentEvents = state.recentEvents.filter(event => event.id !== eventId);
        state.criticalEvents = state.criticalEvents.filter(event => event.id !== eventId);
        state.realTimeEvents = state.realTimeEvents.filter(event => event.id !== eventId);
        
        if (state.selectedEvent?.id === eventId) {
          state.selectedEvent = null;
        }
        
        state.pagination.total = Math.max(0, state.pagination.total - 1);
      });
  },
});

export const {
  setSelectedEvent,
  clearError,
  setFilters,
  clearFilters,
  setPagination,
  addRealTimeEvent,
  updateEventRealtime,
  removeEvent,
  markNotificationsAsRead,
  showNotifications,
  hideNotifications,
  clearRealTimeEvents,
  bulkAcknowledgeEvents,
  bulkResolveEvents,
} = eventsSlice.actions;

export default eventsSlice.reducer;