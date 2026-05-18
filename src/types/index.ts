export interface Barber {
  id: string;
  name: string;
  avatar: string;
  role: string;
  rating: number;
}

export interface Service {
  id: string;
  name: string;
  price: number;
  duration: number; // in minutes
  description: string;
  category: 'haircut' | 'beard' | 'spa' | 'package';
}

export type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';

export interface Booking {
  id: string;
  customerName: string;
  customerPhone: string;
  serviceId: string;
  serviceName: string;
  price: number;
  bookingDate: string; // YYYY-MM-DD
  bookingTime: string; // HH:MM
  status: BookingStatus;
  barberId: string;
  barberName: string;
  notes?: string;
  createdAt: string;
}

export interface Transaction {
  id: string;
  bookingId?: string;
  customerName: string;
  services: {
    serviceId: string;
    name: string;
    price: number;
  }[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  paymentMethod: 'cash' | 'card' | 'qris';
  transactionDate: string; // YYYY-MM-DD
  transactionTime: string; // HH:MM
  createdAt: string;
}

export interface Admin {
  id: string;
  username: string;
  password?: string;
  role: string;
  createdAt?: string;
}

export interface DbState {
  bookings: Booking[];
  transactions: Transaction[];
  services: Service[];
  barbers: Barber[];
  admins: Admin[];
  config: {
    supabaseUrl: string;
    supabaseAnonKey: string;
    isSupabaseConnected: boolean;
  };
}
