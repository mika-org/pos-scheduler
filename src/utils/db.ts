import type { Booking, Barber, Service, Transaction, DbState, BookingStatus, Admin } from '../types';
import { supabase } from './supabase';

// Helper to get relative dates
export const getRelativeDate = (offsetDays: number): string => {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return date.toISOString().split('T')[0];
};

const DEFAULT_BARBERS: Barber[] = [
  {
    id: 'b1',
    name: 'Bagus "The Fade" Prasetyo',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
    role: 'Senior Barber (Fade Specialist)',
    rating: 4.9
  },
  {
    id: 'b2',
    name: 'Samuel "Razor" Wijaya',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
    role: 'Classic Cut & Shave Expert',
    rating: 4.8
  },
  {
    id: 'b3',
    name: 'Alex "Scissors" Santoso',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200',
    role: 'Modern Styling Specialist',
    rating: 4.7
  }
];

const DEFAULT_SERVICES: Service[] = [
  {
    id: 's1',
    name: 'Gentleman\'s Cut',
    price: 65000,
    duration: 35,
    description: 'Cukur rambut premium dengan pijat kepala ringan, keramas, dan aplikasi hair tonic.',
    category: 'haircut'
  },
  {
    id: 's2',
    name: 'Signature Skin Fade',
    price: 85000,
    duration: 45,
    description: 'Cukur gradasi halus (skin fade) presisi tinggi menggunakan clippers & razor.',
    category: 'haircut'
  },
  {
    id: 's3',
    name: 'Royal Beard Shave',
    price: 45000,
    duration: 25,
    description: 'Cukur jenggot premium dengan handuk hangat, minyak cukur khusus, dan aftershave.',
    category: 'beard'
  },
  {
    id: 's4',
    name: 'Hair Spa & Scalp Therapy',
    price: 75000,
    duration: 40,
    description: 'Perawatan kulit kepala mendalam, masker rambut nutrisi, pijat relaksasi leher dan bahu.',
    category: 'spa'
  },
  {
    id: 's5',
    name: 'The Executive Package',
    price: 150000,
    duration: 90,
    description: 'Paket komplet: Potong rambut + Cukur jenggot + Hair Spa + Masker wajah charcoal + Minuman gratis.',
    category: 'package'
  }
];

// LocalStorage Keys
const STORAGE_KEY = 'barbershop_pos_db';

// Safe Storage wrapper to prevent Safari/iOS Private Browsing mode from crashing
const safeStorage = {
  getItem(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      console.warn('LocalStorage is not accessible (Private mode?):', e);
      return null;
    }
  },
  setItem(key: string, value: string): void {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.warn('LocalStorage is not writable (Private mode?):', e);
    }
  },
  removeItem(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.warn('LocalStorage is not writable (Private mode?):', e);
    }
  }
};

// Supabase Connection Status Check
const isSupabaseConfigured = (): boolean => {
  return !!(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY);
};

// ====================================================
// MAPPER FUNCTIONS (JS camelCase <-> PostgreSQL snake_case)
// ====================================================

const mapBookingToDb = (b: Booking) => ({
  id: b.id,
  customer_name: b.customerName,
  customer_phone: b.customerPhone,
  service_id: b.serviceId,
  service_name: b.serviceName,
  price: b.price,
  booking_date: b.bookingDate,
  booking_time: b.bookingTime,
  status: b.status,
  barber_id: b.barberId,
  barber_name: b.barberName,
  notes: b.notes || null,
  created_at: b.createdAt
});

const mapBookingFromDb = (b: any): Booking => ({
  id: b.id,
  customerName: b.customer_name,
  customerPhone: b.customer_phone,
  serviceId: b.service_id,
  serviceName: b.service_name,
  price: Number(b.price),
  bookingDate: b.booking_date,
  bookingTime: b.booking_time,
  status: b.status as BookingStatus,
  barberId: b.barber_id,
  barberName: b.barber_name,
  notes: b.notes || undefined,
  createdAt: b.created_at
});

const mapTransactionToDb = (t: Transaction) => ({
  id: t.id,
  booking_id: t.bookingId || null,
  customer_name: t.customerName,
  services: t.services,
  subtotal: t.subtotal,
  tax: t.tax,
  discount: t.discount,
  total: t.total,
  payment_method: t.paymentMethod,
  transaction_date: t.transactionDate,
  transaction_time: t.transactionTime,
  created_at: t.createdAt
});

const mapTransactionFromDb = (t: any): Transaction => ({
  id: t.id,
  bookingId: t.booking_id || undefined,
  customerName: t.customer_name,
  services: typeof t.services === 'string' ? JSON.parse(t.services) : t.services,
  subtotal: Number(t.subtotal),
  tax: Number(t.tax),
  discount: Number(t.discount),
  total: Number(t.total),
  paymentMethod: t.payment_method,
  transactionDate: t.transaction_date,
  transactionTime: t.transaction_time,
  createdAt: t.created_at
});

// Check database initialization
export const initializeDb = (): DbState => {
  const localData = safeStorage.getItem(STORAGE_KEY);
  if (localData) {
    try {
      const parsed = JSON.parse(localData) as DbState;
      
      // Clean up legacy dummy mock records from browser cache
      if (parsed.bookings) {
        parsed.bookings = parsed.bookings.filter(b => !['bk-1', 'bk-2', 'bk-3', 'bk-4', 'bk-5', 'bk-6', 'bk-7', 'bk-8'].includes(b.id));
      }
      if (parsed.transactions) {
        parsed.transactions = parsed.transactions.filter(t => !['tr-1', 'tr-2'].includes(t.id));
      }

      // Ensure barbers, services and admins exist and merge config
      parsed.barbers = parsed.barbers?.length ? parsed.barbers : DEFAULT_BARBERS;
      parsed.services = parsed.services?.length ? parsed.services : DEFAULT_SERVICES;
      parsed.admins = parsed.admins?.length ? parsed.admins : [
        { id: 'adm-1', username: 'admin', role: 'admin' }
      ];
      parsed.config = {
        supabaseUrl: import.meta.env.VITE_SUPABASE_URL || '',
        supabaseAnonKey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '',
        isSupabaseConnected: isSupabaseConfigured()
      };
      safeStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
      return parsed;
    } catch (e) {
      console.error('Error parsing local storage, reinitializing', e);
    }
  }

  const newState: DbState = {
    bookings: [],
    transactions: [],
    services: DEFAULT_SERVICES,
    barbers: DEFAULT_BARBERS,
    admins: [
      { id: 'adm-1', username: 'admin', role: 'admin' }
    ],
    config: {
      supabaseUrl: import.meta.env.VITE_SUPABASE_URL || '',
      supabaseAnonKey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '',
      isSupabaseConnected: isSupabaseConfigured()
    }
  };

  safeStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
  return newState;
};

// Main Db Manager
export const db = {
  getState(): DbState {
    return initializeDb();
  },

  saveState(state: DbState) {
    safeStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  },

  // ====================================================
  // SUPABASE CLOUD SYNC OPERATIONS (PULL/PUSH)
  // ====================================================

  /**
   * Pulls the absolute source-of-truth records from Supabase cloud database
   * and synchronizes it with the local localStorage cache.
   */
  async syncFromSupabase(): Promise<DbState | null> {
    if (!isSupabaseConfigured()) return null;

    try {
      // 1. Fetch Barbers
      const { data: dbBarbers, error: errBarbers } = await supabase
        .from('barbers')
        .select('*');

      // 2. Fetch Services
      const { data: dbServices, error: errServices } = await supabase
        .from('services')
        .select('*');

      // 3. Fetch Bookings
      const { data: dbBookings, error: errBookings } = await supabase
        .from('bookings')
        .select('*')
        .order('booking_date', { ascending: false })
        .order('booking_time', { ascending: false });

      // 4. Fetch Transactions
      const { data: dbTransactions, error: errTransactions } = await supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false });

      // 5. Fetch Admins
      const { data: dbAdmins, error: errAdmins } = await supabase
        .from('admins')
        .select('*');

      if (errBarbers || errServices || errBookings || errTransactions || errAdmins) {
        console.warn('Sync warnings (Tables might not be initialized yet in Supabase):', {
          errBarbers, errServices, errBookings, errTransactions, errAdmins
        });
        return null;
      }

      const currentState = this.getState();

      // Map Supabase rows back to application CamelCase types
      const mappedBarbers: Barber[] = dbBarbers && dbBarbers.length ? dbBarbers.map((b: any) => ({
        id: b.id,
        name: b.name,
        avatar: b.avatar,
        role: b.role,
        rating: Number(b.rating)
      })) : currentState.barbers;

      const mappedServices: Service[] = dbServices && dbServices.length ? dbServices.map((s: any) => ({
        id: s.id,
        name: s.name,
        price: Number(s.price),
        duration: Number(s.duration),
        description: s.description,
        category: s.category
      })) : currentState.services;

      const mappedAdmins: Admin[] = dbAdmins && dbAdmins.length ? dbAdmins.map((a: any) => ({
        id: a.id,
        username: a.username,
        role: a.role || 'admin',
        createdAt: a.created_at
      })) : currentState.admins;

      const mappedBookings: Booking[] = dbBookings ? dbBookings.map(mapBookingFromDb) : [];
      const mappedTransactions: Transaction[] = dbTransactions ? dbTransactions.map(mapTransactionFromDb) : [];

      const syncedState: DbState = {
        bookings: mappedBookings.length ? mappedBookings : currentState.bookings,
        transactions: mappedTransactions.length ? mappedTransactions : currentState.transactions,
        services: mappedServices,
        barbers: mappedBarbers,
        admins: mappedAdmins,
        config: {
          supabaseUrl: import.meta.env.VITE_SUPABASE_URL || '',
          supabaseAnonKey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '',
          isSupabaseConnected: true
        }
      };

      this.saveState(syncedState);
      return syncedState;
    } catch (e) {
      console.error('Failed to sync database state with Supabase:', e);
      return null;
    }
  },

  // BOOKINGS ACTIONS
  getBookings(): Booking[] {
    return this.getState().bookings;
  },

  saveBooking(booking: Omit<Booking, 'id' | 'createdAt'>): Booking {
    const state = this.getState();
    const newBooking: Booking = {
      ...booking,
      id: 'bk-' + Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString()
    };
    
    state.bookings.unshift(newBooking);
    this.saveState(state);

    // Background push to Supabase
    if (isSupabaseConfigured()) {
      supabase
        .from('bookings')
        .insert([mapBookingToDb(newBooking)])
        .then(({ error }) => {
          if (error) console.error('Failed to insert booking in Supabase:', error);
        });
    }

    return newBooking;
  },

  updateBookingStatus(id: string, status: BookingStatus, notes?: string): Booking | null {
    const state = this.getState();
    const index = state.bookings.findIndex(b => b.id === id);
    
    if (index !== -1) {
      state.bookings[index].status = status;
      if (notes !== undefined) {
        state.bookings[index].notes = notes;
      }
      this.saveState(state);

      // Background update to Supabase
      if (isSupabaseConfigured()) {
        const updatePayload: Record<string, any> = { status };
        if (notes !== undefined) {
          updatePayload.notes = notes;
        }

        supabase
          .from('bookings')
          .update(updatePayload)
          .eq('id', id)
          .then(({ error }) => {
            if (error) console.error('Failed to update booking status in Supabase:', error);
          });
      }

      return state.bookings[index];
    }
    return null;
  },

  deleteBooking(id: string): boolean {
    const state = this.getState();
    const index = state.bookings.findIndex(b => b.id === id);
    if (index !== -1) {
      state.bookings.splice(index, 1);
      this.saveState(state);

      // Background delete from Supabase
      if (isSupabaseConfigured()) {
        supabase
          .from('bookings')
          .delete()
          .eq('id', id)
          .then(({ error }) => {
            if (error) console.error('Failed to delete booking in Supabase:', error);
          });
      }

      return true;
    }
    return false;
  },

  // TRANSACTIONS ACTIONS (POS)
  getTransactions(): Transaction[] {
    return this.getState().transactions;
  },

  saveTransaction(transaction: Omit<Transaction, 'id' | 'createdAt' | 'transactionDate' | 'transactionTime'>): Transaction {
    const state = this.getState();
    const now = new Date();
    const newTransaction: Transaction = {
      ...transaction,
      id: 'tr-' + Math.random().toString(36).substr(2, 9),
      transactionDate: now.toISOString().split('T')[0],
      transactionTime: now.toTimeString().split(' ')[0].substring(0, 5),
      createdAt: now.toISOString()
    };

    // If this transaction was from a booking, complete the booking locally
    if (transaction.bookingId) {
      const bIndex = state.bookings.findIndex(b => b.id === transaction.bookingId);
      if (bIndex !== -1) {
        state.bookings[bIndex].status = 'completed';
      }
    }

    state.transactions.unshift(newTransaction);
    this.saveState(state);

    // Background pushes to Supabase
    if (isSupabaseConfigured()) {
      // 1. Save transaction
      supabase
        .from('transactions')
        .insert([mapTransactionToDb(newTransaction)])
        .then(({ error }) => {
          if (error) console.error('Failed to insert transaction in Supabase:', error);
        });

      // 2. Complete the related booking
      if (transaction.bookingId) {
        supabase
          .from('bookings')
          .update({ status: 'completed' })
          .eq('id', transaction.bookingId)
          .then(({ error }) => {
            if (error) console.error('Failed to complete booking status in Supabase:', error);
          });
      }
    }

    return newTransaction;
  },

  // SERVICES & BARBERS
  getServices(): Service[] {
    return this.getState().services;
  },

  saveService(service: Service): Service {
    const state = this.getState();
    const index = state.services.findIndex(s => s.id === service.id);
    if (index !== -1) {
      state.services[index] = service;
    } else {
      state.services.push(service);
    }
    this.saveState(state);

    if (isSupabaseConfigured()) {
      supabase
        .from('services')
        .upsert([{
          id: service.id,
          name: service.name,
          price: service.price,
          duration: service.duration,
          description: service.description,
          category: service.category
        }])
        .then(({ error }) => {
          if (error) console.error('Failed to upsert service on Supabase:', error);
        });
    }
    return service;
  },

  deleteService(id: string): boolean {
    const state = this.getState();
    const index = state.services.findIndex(s => s.id === id);
    if (index !== -1) {
      state.services.splice(index, 1);
      this.saveState(state);

      if (isSupabaseConfigured()) {
        supabase
          .from('services')
          .delete()
          .eq('id', id)
          .then(({ error }) => {
            if (error) console.error('Failed to delete service on Supabase:', error);
          });
      }
      return true;
    }
    return false;
  },

  getBarbers(): Barber[] {
    return this.getState().barbers;
  },

  saveBarber(barber: Barber): Barber {
    const state = this.getState();
    const index = state.barbers.findIndex(b => b.id === barber.id);
    if (index !== -1) {
      state.barbers[index] = barber;
    } else {
      state.barbers.push(barber);
    }
    this.saveState(state);

    if (isSupabaseConfigured()) {
      supabase
        .from('barbers')
        .upsert([{
          id: barber.id,
          name: barber.name,
          avatar: barber.avatar,
          role: barber.role,
          rating: barber.rating
        }])
        .then(({ error }) => {
          if (error) console.error('Failed to upsert barber on Supabase:', error);
        });
    }
    return barber;
  },

  deleteBarber(id: string): boolean {
    const state = this.getState();
    const index = state.barbers.findIndex(b => b.id === id);
    if (index !== -1) {
      state.barbers.splice(index, 1);
      this.saveState(state);

      if (isSupabaseConfigured()) {
        supabase
          .from('barbers')
          .delete()
          .eq('id', id)
          .then(({ error }) => {
            if (error) console.error('Failed to delete barber on Supabase:', error);
          });
      }
      return true;
    }
    return false;
  },

  // ADMIN USERS ACTIONS
  getAdmins(): Admin[] {
    return this.getState().admins || [];
  },

  saveAdmin(admin: Admin): Admin {
    const state = this.getState();
    if (!state.admins) {
      state.admins = [];
    }
    const index = state.admins.findIndex(a => a.id === admin.id);
    if (index !== -1) {
      state.admins[index] = admin;
    } else {
      state.admins.push(admin);
    }
    this.saveState(state);

    if (isSupabaseConfigured()) {
      const payload: any = {
        id: admin.id,
        username: admin.username,
        role: admin.role
      };
      if (admin.password) {
        payload.password = admin.password;
      }
      
      supabase
        .from('admins')
        .upsert([payload])
        .then(({ error }) => {
          if (error) console.error('Failed to upsert admin on Supabase:', error);
        });
    }
    return admin;
  },

  deleteAdmin(id: string): boolean {
    const state = this.getState();
    if (!state.admins) return false;
    const index = state.admins.findIndex(a => a.id === id);
    if (index !== -1) {
      state.admins.splice(index, 1);
      this.saveState(state);

      if (isSupabaseConfigured()) {
        supabase
          .from('admins')
          .delete()
          .eq('id', id)
          .then(({ error }) => {
            if (error) console.error('Failed to delete admin on Supabase:', error);
          });
      }
      return true;
    }
    return false;
  },

  // CONFIGURATION & CLOUD SYNC EXPORTS
  exportToJson(): string {
    const state = this.getState();
    return JSON.stringify(state, null, 2);
  },

  importFromJson(jsonStr: string): boolean {
    try {
      const parsed = JSON.parse(jsonStr) as DbState;
      if (Array.isArray(parsed.bookings) && Array.isArray(parsed.transactions)) {
        parsed.config = {
          supabaseUrl: import.meta.env.VITE_SUPABASE_URL || '',
          supabaseAnonKey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '',
          isSupabaseConnected: isSupabaseConfigured()
        };
        this.saveState(parsed);

        // Optional: Batch insert imported data to Supabase if connected
        if (isSupabaseConfigured()) {
          // Upload all bookings
          const dbBookings = parsed.bookings.map(mapBookingToDb);
          supabase.from('bookings').upsert(dbBookings).then(({ error }) => {
            if (error) console.error('Supabase import bookings upsert error:', error);
          });

          // Upload all transactions
          const dbTransactions = parsed.transactions.map(mapTransactionToDb);
          supabase.from('transactions').upsert(dbTransactions).then(({ error }) => {
            if (error) console.error('Supabase import transactions upsert error:', error);
          });
        }

        return true;
      }
    } catch (e) {
      console.error('Failed to import JSON data:', e);
    }
    return false;
  },

  resetDatabase(): void {
    safeStorage.removeItem(STORAGE_KEY);
    initializeDb();

    // Optionally truncate supabase tables in development if desired.
    // We leave cloud tables intact to protect active data and only reset the local cache.
  }
};

// SQL Schema for Supabase
export const SUPABASE_SQL_SCHEMA = `-- SQL SCHEMA UNTUK BARBERSHOP POS SCHEDULER
-- Jalankan kode ini di SQL Editor Supabase Anda.

-- 1. Tabel Barbers
CREATE TABLE IF NOT EXISTS barbers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  avatar TEXT,
  role TEXT,
  rating NUMERIC DEFAULT 5.0
);

-- 2. Tabel Services
CREATE TABLE IF NOT EXISTS services (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price NUMERIC NOT NULL,
  duration INTEGER NOT NULL,
  description TEXT,
  category TEXT
);

-- 3. Tabel Bookings
CREATE TABLE IF NOT EXISTS bookings (
  id TEXT PRIMARY KEY,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  service_id TEXT REFERENCES services(id),
  service_name TEXT NOT NULL,
  price NUMERIC NOT NULL,
  booking_date DATE NOT NULL,
  booking_time TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled', 'no_show')),
  barber_id TEXT REFERENCES barbers(id),
  barber_name TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Tabel Transactions (POS)
CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  booking_id TEXT REFERENCES bookings(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  services JSONB NOT NULL,
  subtotal NUMERIC NOT NULL,
  tax NUMERIC NOT NULL,
  discount NUMERIC DEFAULT 0,
  total NUMERIC NOT NULL,
  payment_method TEXT CHECK (payment_method IN ('cash', 'card', 'qris')),
  transaction_date DATE NOT NULL,
  transaction_time TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Tabel Admins (Otentikasi khusus JWT)
CREATE TABLE IF NOT EXISTS admins (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT DEFAULT 'admin',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Masukkan Data Awal (Seed Data)
INSERT INTO barbers (id, name, avatar, role, rating) VALUES
('b1', 'Bagus "The Fade" Prasetyo', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200', 'Senior Barber (Fade Specialist)', 4.9),
('b2', 'Samuel "Razor" Wijaya', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200', 'Classic Cut & Shave Expert', 4.8),
('b3', 'Alex "Scissors" Santoso', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200', 'Modern Styling Specialist', 4.7)
ON CONFLICT (id) DO NOTHING;

INSERT INTO services (id, name, price, duration, description, category) VALUES
('s1', 'Gentleman\'s Cut', 65000, 35, 'Cukur rambut premium dengan pijat kepala ringan, keramas, dan aplikasi hair tonic.', 'haircut'),
('s2', 'Signature Skin Fade', 85000, 45, 'Cukur gradasi halus (skin fade) presisi tinggi menggunakan clippers & razor.', 'haircut'),
('s3', 'Royal Beard Shave', 45000, 25, 'Cukur jenggot premium dengan handuk hangat, minyak cukur khusus, dan aftershave.', 'beard'),
('s4', 'Hair Spa & Scalp Therapy', 75000, 40, 'Perawatan kulit kepala mendalam, masker rambut nutrisi, pijat relaksasi leher dan bahu.', 'spa'),
('s5', 'The Executive Package', 150000, 90, 'Paket komplet: Potong rambut + Cukur jenggot + Hair Spa + Masker wajah charcoal + Minuman gratis.', 'package')
ON CONFLICT (id) DO NOTHING;

INSERT INTO admins (id, username, password, role) VALUES
('adm-1', 'admin', '$2b$10$F9QomOKVMLCgwKLBRN582OkRX36NNJZ.Htk6bPuMHBbIqzvmlv.lG', 'super_admin')
ON CONFLICT (username) DO NOTHING;
`;
