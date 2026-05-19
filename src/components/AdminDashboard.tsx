import React, { useState, useMemo } from 'react';
import {
  LayoutDashboard, Calendar, CreditCard, Plus, Trash2, Check,
  AlertTriangle, Download, Upload, Database, LogOut, Home, DollarSign,
  UserCheck, RefreshCw, Ban, CheckSquare, Scissors, Users, FileText
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip,
  Cell, PieChart, Pie
} from 'recharts';
import type { Booking, Service, Barber, Transaction, BookingStatus, Admin } from '../types';
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Badge, Input, Select, TextArea, Dialog } from './ui/CustomComponents';
import { SUPABASE_SQL_SCHEMA } from '../utils/db';
import confetti from 'canvas-confetti';
import bcrypt from 'bcryptjs';

interface AdminDashboardProps {
  bookings: Booking[];
  transactions: Transaction[];
  services: Service[];
  barbers: Barber[];
  admins?: Admin[];
  adminUser?: { id: string; username: string; role: string };
  isSupabaseConnected: boolean;
  onAddBooking: (booking: Omit<Booking, 'id' | 'createdAt' | 'status'>) => void;
  onUpdateStatus: (id: string, status: BookingStatus, notes?: string) => void;
  onDeleteBooking: (id: string) => void;
  onAddTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt' | 'transactionDate' | 'transactionTime'>) => void;
  onImportDb: (jsonStr: string) => boolean;
  onExportDb: () => string;
  onResetDb: () => void;
  onLogout: () => void;
  onNavigate: (view: 'landing' | 'login' | 'dashboard') => void;
  addToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  onSaveService: (service: Service) => void;
  onDeleteService: (id: string) => void;
  onSaveBarber: (barber: Barber) => void;
  onDeleteBarber: (id: string) => void;
  onSaveAdmin?: (admin: Admin) => void;
  onDeleteAdmin?: (id: string) => void;
}

type TabType = 'overview' | 'bookings' | 'violators' | 'transactions' | 'database' | 'content' | 'admins';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  bookings,
  transactions,
  services,
  barbers,
  admins = [],
  adminUser,
  isSupabaseConnected,
  onAddBooking,
  onUpdateStatus,
  onDeleteBooking,
  onAddTransaction,
  onImportDb,
  onExportDb,
  onResetDb,
  onLogout,
  onNavigate,
  addToast,
  onSaveService,
  onDeleteService,
  onSaveBarber,
  onDeleteBarber,
  onSaveAdmin,
  onDeleteAdmin
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  
  // Modals state
  const [isManualBookingOpen, setIsManualBookingOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [selectedCheckoutBooking, setSelectedCheckoutBooking] = useState<Booking | null>(null);

  // Checkbox lists for additional services during POS checkout
  const [checkoutAddons, setCheckoutAddons] = useState<string[]>([]);
  const [checkoutDiscount, setCheckoutDiscount] = useState<number>(0);
  const [checkoutPaymentMethod, setCheckoutPaymentMethod] = useState<'cash' | 'card' | 'qris'>('qris');

  // CMS Modals & Forms state
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [serviceFormData, setServiceFormData] = useState({
    name: '',
    price: 65000,
    duration: 30,
    description: '',
    category: 'haircut' as 'haircut' | 'beard' | 'spa' | 'package'
  });

  const [isBarberModalOpen, setIsBarberModalOpen] = useState(false);
  const [editingBarber, setEditingBarber] = useState<Barber | null>(null);
  const [barberFormData, setBarberFormData] = useState({
    name: '',
    role: '',
    rating: 4.8,
    avatar: ''
  });

  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<Admin | null>(null);
  const [adminFormData, setAdminFormData] = useState({
    username: '',
    password: '',
    role: 'admin'
  });

  // Safeguard tab access based on roles
  React.useEffect(() => {
    if (adminUser && adminUser.role !== 'super_admin') {
      if (activeTab === 'database' || activeTab === 'admins') {
        setActiveTab('overview');
      }
    }
  }, [activeTab, adminUser]);

  const handleOpenServiceModal = (service?: Service) => {
    if (service) {
      setEditingService(service);
      setServiceFormData({
        name: service.name,
        price: service.price,
        duration: service.duration,
        description: service.description,
        category: service.category
      });
    } else {
      setEditingService(null);
      setServiceFormData({
        name: '',
        price: 65000,
        duration: 30,
        description: '',
        category: 'haircut'
      });
    }
    setIsServiceModalOpen(true);
  };

  const handleServiceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const id = editingService ? editingService.id : 's-' + Math.random().toString(36).substr(2, 9);
    const service: Service = {
      id,
      name: serviceFormData.name,
      price: serviceFormData.price,
      duration: serviceFormData.duration,
      description: serviceFormData.description,
      category: serviceFormData.category
    };

    onSaveService(service);
    setIsServiceModalOpen(false);
    addToast(editingService ? 'Layanan berhasil diperbarui!' : 'Layanan baru berhasil ditambahkan!', 'success');
  };

  const handleDeleteServiceClick = (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus layanan ini dari katalog menu barbershop?')) {
      onDeleteService(id);
      addToast('Layanan berhasil dihapus dari katalog.', 'info');
    }
  };

  const handleOpenBarberModal = (barber?: Barber) => {
    if (barber) {
      setEditingBarber(barber);
      setBarberFormData({
        name: barber.name,
        role: barber.role,
        rating: barber.rating,
        avatar: barber.avatar
      });
    } else {
      setEditingBarber(null);
      setBarberFormData({
        name: '',
        role: '',
        rating: 4.8,
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200'
      });
    }
    setIsBarberModalOpen(true);
  };

  const handleBarberSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const id = editingBarber ? editingBarber.id : 'b-' + Math.random().toString(36).substr(2, 9);
    const barber: Barber = {
      id,
      name: barberFormData.name,
      role: barberFormData.role,
      rating: barberFormData.rating,
      avatar: barberFormData.avatar
    };

    onSaveBarber(barber);
    setIsBarberModalOpen(false);
    addToast(editingBarber ? 'Profil barber berhasil diperbarui!' : 'Staff barber baru berhasil ditambahkan!', 'success');
  };

  const handleDeleteBarberClick = (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus staff barber ini dari tim barbershop?')) {
      onDeleteBarber(id);
      addToast('Staff barber berhasil dihapus.', 'info');
    }
  };

  const handleOpenAdminModal = (admin?: Admin) => {
    if (admin) {
      setEditingAdmin(admin);
      setAdminFormData({
        username: admin.username,
        password: '',
        role: admin.role
      });
    } else {
      setEditingAdmin(null);
      setAdminFormData({
        username: '',
        password: '',
        role: 'admin'
      });
    }
    setIsAdminModalOpen(true);
  };

  const handleAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminFormData.username.trim()) {
      addToast('Username wajib diisi', 'error');
      return;
    }

    if (!editingAdmin && !adminFormData.password.trim()) {
      addToast('Password wajib diisi untuk admin baru', 'error');
      return;
    }

    let hashedPassword = undefined;
    if (adminFormData.password.trim()) {
      hashedPassword = bcrypt.hashSync(adminFormData.password.trim(), 10);
    }

    const admin: Admin = {
      id: editingAdmin ? editingAdmin.id : 'adm-' + Math.random().toString(36).substr(2, 9),
      username: adminFormData.username.trim(),
      role: adminFormData.role,
      ...(hashedPassword ? { password: hashedPassword } : {})
    };

    if (onSaveAdmin) {
      onSaveAdmin(admin);
      setIsAdminModalOpen(false);
      addToast(editingAdmin ? 'Akun Admin berhasil diperbarui!' : 'Akun Admin baru berhasil ditambahkan!', 'success');
    }
  };

  const handleDeleteAdminClick = (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus akun admin ini?')) {
      if (onDeleteAdmin) {
        onDeleteAdmin(id);
        addToast('Akun Admin berhasil dihapus.', 'info');
      }
    }
  };

  // Manual booking form state
  const [manualFormData, setManualFormData] = useState({
    customerName: '',
    customerPhone: '',
    serviceId: services[0]?.id || '',
    barberId: barbers[0]?.id || '',
    bookingDate: new Date().toISOString().split('T')[0],
    bookingTime: '09:00',
    notes: ''
  });

  // DB Settings State
  const [importJsonText, setImportJsonText] = useState('');
  const [isCopied, setIsCopied] = useState(false);

  // Filters state
  const [bookingFilter, setBookingFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // ----------------------------------------------------
  // CALCULATIONS & METRICS
  // ----------------------------------------------------
  const metrics = useMemo(() => {
    const totalBookings = bookings.length;
    const completed = bookings.filter(b => b.status === 'completed').length;
    const pending = bookings.filter(b => b.status === 'pending').length;
    const confirmed = bookings.filter(b => b.status === 'confirmed').length;
    
    // PELANGGAR BOOKING (No-Shows)
    const noShows = bookings.filter(b => b.status === 'no_show').length;

    // Total POS Revenue
    const revenue = transactions.reduce((acc, curr) => acc + curr.total, 0);

    return { totalBookings, completed, pending, confirmed, noShows, revenue };
  }, [bookings, transactions]);

  // Group violators to identify repeat offenders (Cumulative list of "pelanggar booking")
  const violatorsList = useMemo(() => {
    // We group bookings with status 'no_show' by customerPhone
    const groups: Record<string, { name: string; phone: string; count: number; bookings: Booking[] }> = {};
    
    bookings.forEach(b => {
      if (b.status === 'no_show') {
        const phone = b.customerPhone;
        if (!groups[phone]) {
          groups[phone] = {
            name: b.customerName,
            phone: b.customerPhone,
            count: 0,
            bookings: []
          };
        }
        groups[phone].count += 1;
        groups[phone].bookings.push(b);
      }
    });

    return Object.values(groups).sort((a, b) => b.count - a.count);
  }, [bookings]);

  // Chart Data: Revenue per day
  const chartRevenueData = useMemo(() => {
    const revenueMap: Record<string, number> = {};
    
    // Fill last 7 days with 0 as base
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const str = d.toISOString().split('T')[0];
      revenueMap[str] = 0;
    }

    transactions.forEach(t => {
      if (revenueMap[t.transactionDate] !== undefined) {
        revenueMap[t.transactionDate] += t.total;
      } else {
        revenueMap[t.transactionDate] = t.total;
      }
    });

    return Object.entries(revenueMap).map(([date, amount]) => {
      // Format date e.g. "19 Mei"
      const dateObj = new Date(date);
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
      return {
        name: `${dateObj.getDate()} ${months[dateObj.getMonth()]}`,
        Pendapatan: amount
      };
    });
  }, [transactions]);
  // Chart Data: Payment Methods Ratio
  const chartPaymentData = useMemo(() => {
    let qris = 0, cash = 0, card = 0;
    transactions.forEach(t => {
      if (t.paymentMethod === 'qris') qris += 1;
      if (t.paymentMethod === 'cash') cash += 1;
      if (t.paymentMethod === 'card') card += 1;
    });

    return [
      { name: 'QRIS', value: qris, color: '#f59e0b' },
      { name: 'Tunai', value: cash, color: '#10b981' },
      { name: 'Kartu', value: card, color: '#6366f1' }
    ].filter(item => item.value > 0);
  }, [transactions]);

  // Filtered Bookings Table
  const filteredBookings = useMemo(() => {
    return bookings.filter(b => {
      const matchStatus = bookingFilter === 'all' || b.status === bookingFilter;
      const matchQuery = 
        b.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.customerPhone.includes(searchQuery) ||
        b.serviceName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.barberName.toLowerCase().includes(searchQuery.toLowerCase());
      return matchStatus && matchQuery;
    });
  }, [bookings, bookingFilter, searchQuery]);

  // Today's Bookings for Overview Scheduler
  const todayBookings = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    return bookings
      .filter(b => b.bookingDate === todayStr)
      .sort((a, b) => a.bookingTime.localeCompare(b.bookingTime));
  }, [bookings]);

  // ----------------------------------------------------
  // HANDLERS
  // ----------------------------------------------------
  const handleManualBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedService = services.find(s => s.id === manualFormData.serviceId)!;
    const selectedBarber = barbers.find(b => b.id === manualFormData.barberId)!;

    onAddBooking({
      customerName: manualFormData.customerName,
      customerPhone: manualFormData.customerPhone,
      serviceId: manualFormData.serviceId,
      serviceName: selectedService.name,
      price: selectedService.price,
      bookingDate: manualFormData.bookingDate,
      bookingTime: manualFormData.bookingTime,
      barberId: manualFormData.barberId,
      barberName: selectedBarber.name,
      notes: manualFormData.notes
    });

    addToast(`Booking manual atas nama ${manualFormData.customerName} berhasil dibuat!`, 'success');
    setIsManualBookingOpen(false);

    // Reset Form
    setManualFormData({
      customerName: '',
      customerPhone: '',
      serviceId: services[0]?.id || '',
      barberId: barbers[0]?.id || '',
      bookingDate: new Date().toISOString().split('T')[0],
      bookingTime: '09:00',
      notes: ''
    });
  };

  const handleCheckoutOpen = (booking: Booking) => {
    setSelectedCheckoutBooking(booking);
    setCheckoutAddons([]);
    setCheckoutDiscount(0);
    setCheckoutPaymentMethod('qris');
    setIsCheckoutOpen(true);
  };

  const handlePOSCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCheckoutBooking) return;

    // Calculate final billing
    const baseServicePrice = selectedCheckoutBooking.price;
    const checkoutServices = [
      {
        serviceId: selectedCheckoutBooking.serviceId,
        name: selectedCheckoutBooking.serviceName,
        price: baseServicePrice
      }
    ];

    let addonsSum = 0;
    checkoutAddons.forEach(addonId => {
      const svc = services.find(s => s.id === addonId);
      if (svc) {
        checkoutServices.push({
          serviceId: svc.id,
          name: svc.name,
          price: svc.price
        });
        addonsSum += svc.price;
      }
    });

    const subtotal = baseServicePrice + addonsSum;
    const tax = Math.round(subtotal * 0.1); // 10% VAT
    const discount = checkoutDiscount;
    const total = Math.max(0, subtotal + tax - discount);

    onAddTransaction({
      bookingId: selectedCheckoutBooking.id,
      customerName: selectedCheckoutBooking.customerName,
      services: checkoutServices,
      subtotal,
      tax,
      discount,
      total,
      paymentMethod: checkoutPaymentMethod
    });

    addToast(`Pembayaran POS berhasil untuk ${selectedCheckoutBooking.customerName}! Total: ${formatPrice(total)}`, 'success');
    setIsCheckoutOpen(false);
    setSelectedCheckoutBooking(null);

    // Blast celebratory confetti
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.8 },
      colors: ['#10b981', '#ffffff', '#3b82f6']
    });
  };

  const handleImport = () => {
    if (!importJsonText.trim()) {
      addToast('Teks JSON tidak boleh kosong', 'error');
      return;
    }
    const success = onImportDb(importJsonText);
    if (success) {
      addToast('Database berhasil dipulihkan dari cadangan!', 'success');
      setImportJsonText('');
    } else {
      addToast('Format JSON salah atau tidak valid.', 'error');
    }
  };

  const handleExport = () => {
    try {
      const json = onExportDb();
      setImportJsonText(json);
      addToast('Data database berhasil diexport ke kotak teks di bawah!', 'info');
    } catch (e) {
      addToast('Gagal mengekspor database.', 'error');
    }
  };

  const copySchemaToClipboard = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setIsCopied(true);
    addToast('Skema SQL disalin ke clipboard!', 'success');
    setTimeout(() => setIsCopied(false), 2000);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(price);
  };

  return (
    <div className="flex-1 min-h-screen bg-[#070a13] text-slate-100 flex flex-col md:flex-row relative overflow-hidden">
      
      {/* Decorative Glow background */}
      <div className="absolute top-[5%] left-[5%] w-[400px] h-[400px] rounded-full bg-amber-500/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[5%] right-[5%] w-[450px] h-[450px] rounded-full bg-indigo-500/5 blur-[120px] pointer-events-none" />

      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-slate-950/80 border-r border-slate-900 flex flex-col justify-between shrink-0 relative z-20">
        <div>
          {/* Logo & Header */}
          <div className="p-6 border-b border-slate-900/60 flex items-center justify-between">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => onNavigate('landing')}>
              <div className="p-1.5 bg-amber-600 rounded-md">
                <Scissors className="w-4 h-4 text-slate-950 stroke-[2.5]" />
              </div>
              <span className="font-heading font-extrabold text-sm tracking-wider text-white">THE GENTLEMEN</span>
            </div>
            <span className="px-1.5 py-0.5 bg-slate-900 border border-slate-800 text-[9px] font-bold text-amber-500 rounded uppercase tracking-wider">
              Admin
            </span>
          </div>

          {/* Cloud Database Connection Status Indicator */}
          <div className="px-6 py-2.5 border-b border-slate-900/40 bg-slate-950/20 flex items-center justify-between text-[11px]">
            <span className="text-slate-400 font-semibold">Cloud Database:</span>
            {isSupabaseConnected ? (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-emerald-950/40 border border-emerald-500/20 text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Terkoneksi
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-amber-950/40 border border-amber-500/20 text-amber-400">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                Luring (Local)
              </span>
            )}
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1">
            <button
              onClick={() => setActiveTab('overview')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer ${
                activeTab === 'overview'
                  ? 'bg-amber-600/10 text-amber-400 border-l-[3px] border-amber-500 rounded-l-none'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" /> Ringkasan & POS
            </button>

            <button
              onClick={() => setActiveTab('bookings')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer ${
                activeTab === 'bookings'
                  ? 'bg-amber-600/10 text-amber-400 border-l-[3px] border-amber-500 rounded-l-none'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
              }`}
            >
              <Calendar className="w-4 h-4" /> Kelola Booking
            </button>

            <button
              onClick={() => setActiveTab('violators')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer relative ${
                activeTab === 'violators'
                  ? 'bg-rose-500/10 text-rose-400 border-l-[3px] border-rose-500 rounded-l-none'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
              }`}
            >
              <Ban className="w-4 h-4" /> Pelanggar Booking
              {metrics.noShows > 0 && (
                <span className="absolute right-3 px-1.5 py-0.5 bg-rose-600/20 border border-rose-500/40 text-[9px] font-bold text-rose-400 rounded-full">
                  {metrics.noShows}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('transactions')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer ${
                activeTab === 'transactions'
                  ? 'bg-amber-600/10 text-amber-400 border-l-[3px] border-amber-500 rounded-l-none'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
              }`}
            >
              <CreditCard className="w-4 h-4" /> Riwayat POS Kasir
            </button>

            {adminUser?.role === 'super_admin' && (
              <button
                onClick={() => setActiveTab('database')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer ${
                  activeTab === 'database'
                    ? 'bg-amber-600/10 text-amber-400 border-l-[3px] border-amber-500 rounded-l-none'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                }`}
              >
                <Database className="w-4 h-4" /> Cloud & Backup
              </button>
            )}

            <button
              onClick={() => setActiveTab('content')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer ${
                activeTab === 'content'
                  ? 'bg-amber-600/10 text-amber-400 border-l-[3px] border-amber-500 rounded-l-none'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
              }`}
            >
              <Scissors className="w-4 h-4" /> Kelola Konten
            </button>

            {adminUser?.role === 'super_admin' && (
              <button
                onClick={() => setActiveTab('admins')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer ${
                  activeTab === 'admins'
                    ? 'bg-amber-600/10 text-amber-400 border-l-[3px] border-amber-500 rounded-l-none'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                }`}
              >
                <Users className="w-4 h-4" /> Kelola Admin
              </button>
            )}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-900/60 bg-slate-950/40 flex flex-col gap-2">
          <button
            onClick={() => onNavigate('landing')}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-slate-400 hover:text-amber-400 transition-colors cursor-pointer rounded-lg hover:bg-slate-900"
          >
            <Home className="w-4 h-4" /> Lihat Landing Page
          </button>
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-rose-400 hover:text-rose-300 transition-colors cursor-pointer rounded-lg hover:bg-rose-950/20"
          >
            <LogOut className="w-4 h-4" /> Sign Out Akun
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative z-10 overflow-x-hidden">
        
        {/* Top Header Bar */}
        <header className="h-16 border-b border-slate-900 bg-slate-950/30 flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-2">
            <h2 className="font-heading text-lg font-bold text-white capitalize">{activeTab} panel</h2>
            <span className="text-slate-600 text-xs font-semibold">|</span>
            <span className="text-slate-400 text-xs font-medium">Hari ini: {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>

          <div className="flex items-center gap-3">
            <Button 
              variant="gold" 
              size="sm"
              onClick={() => setIsManualBookingOpen(true)}
            >
              <Plus className="w-4 h-4 mr-1.5" /> Booking Baru (Kasir)
            </Button>
          </div>
        </header>

        {/* Dynamic Panel Content Container */}
        <div className="p-6 flex-1 overflow-y-auto">
          
          {/* ====================================================
              TAB 1: OVERVIEW / RINGKASAN & POS SCHEDULER
              ==================================================== */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              
              {/* Quick Metrics Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Total Omset (POS)</span>
                      <h4 className="text-xl font-extrabold text-white font-heading mt-0.5">{formatPrice(metrics.revenue)}</h4>
                    </div>
                    <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg flex items-center justify-center glow-emerald">
                      <DollarSign className="w-5 h-5" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Total Reservasi</span>
                      <h4 className="text-xl font-extrabold text-white font-heading mt-0.5">{metrics.totalBookings}</h4>
                    </div>
                    <div className="w-10 h-10 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-lg flex items-center justify-center glow-amber">
                      <Calendar className="w-5 h-5" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Terkonfirmasi (Pending/Conf)</span>
                      <h4 className="text-xl font-extrabold text-white font-heading mt-0.5">{metrics.pending + metrics.confirmed}</h4>
                    </div>
                    <div className="w-10 h-10 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-lg flex items-center justify-center glow-indigo">
                      <UserCheck className="w-5 h-5" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-rose-900/30">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-rose-500 font-bold uppercase tracking-wider">Pelanggar Booking (No-Show)</span>
                      <h4 className="text-xl font-extrabold text-rose-400 font-heading mt-0.5">{metrics.noShows}</h4>
                    </div>
                    <div className="w-10 h-10 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-lg flex items-center justify-center">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Charts grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* 1. Daily Revenue Area Chart */}
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle>Omset Penjualan 7 Hari Terakhir</CardTitle>
                    <CardDescription>Visualisasi harian transaksi yang diproses di mesin kasir POS.</CardDescription>
                  </CardHeader>
                  <CardContent className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartRevenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#d97706" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#d97706" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                          formatter={(value) => [formatPrice(Number(value)), 'Pendapatan']}
                        />
                        <Area type="monotone" dataKey="Pendapatan" stroke="#d97706" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* 2. Payment Method Distribution Pie Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle>Metode Pembayaran</CardTitle>
                    <CardDescription>Rasio pembayaran kasir.</CardDescription>
                  </CardHeader>
                  <CardContent className="h-64 flex flex-col justify-between">
                    <div className="h-44">
                      {chartPaymentData.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-xs text-slate-500">Belum ada transaksi</div>
                      ) : (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={chartPaymentData}
                              cx="50%"
                              cy="50%"
                              innerRadius={50}
                              outerRadius={65}
                              paddingAngle={4}
                              dataKey="value"
                            >
                              {chartPaymentData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip
                              contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#fff', fontSize: '11px' }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                    {/* Pie Legends */}
                    <div className="flex justify-around text-xs font-semibold text-slate-400">
                      {chartPaymentData.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                          <span>{item.name} ({item.value})</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Today's Scheduling timeline */}
              <Card>
                <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <CardTitle>Jadwal Antrean Hari Ini</CardTitle>
                    <CardDescription>Reservasi booking pelanggan terjadwal hari ini. Klik Tombol "Proses Kasir" untuk checkout.</CardDescription>
                  </div>
                  <Badge variant="info">Hari Ini</Badge>
                </CardHeader>
                <CardContent>
                  {todayBookings.length === 0 ? (
                    <div className="text-center py-12 border border-dashed border-slate-800 rounded-xl">
                      <Calendar className="w-8 h-8 text-slate-600 mx-auto mb-3" />
                      <p className="text-slate-400 text-sm">Tidak ada antrean booking terjadwal untuk hari ini.</p>
                      <Button variant="outline" size="sm" className="mt-4 border-slate-800" onClick={() => setIsManualBookingOpen(true)}>
                        <Plus className="w-4 h-4 mr-1.5" /> Masukkan Antrean Baru
                      </Button>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-slate-900 text-slate-500 font-bold uppercase tracking-wider">
                            <th className="pb-3 pl-2">Waktu</th>
                            <th className="pb-3">Pelanggan</th>
                            <th className="pb-3">Layanan</th>
                            <th className="pb-3">Barber</th>
                            <th className="pb-3">Harga</th>
                            <th className="pb-3">Status</th>
                            <th className="pb-3 text-right pr-2">Aksi POS / Kasir</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-900/60">
                          {todayBookings.map(b => {
                            const badgeVariants: Record<BookingStatus, 'success' | 'warning' | 'error' | 'info' | 'neutral'> = {
                              pending: 'warning',
                              confirmed: 'info',
                              completed: 'success',
                              cancelled: 'neutral',
                              no_show: 'error'
                            };

                            const statusLabels = {
                              pending: 'Menunggu',
                              confirmed: 'Terkonfirmasi',
                              completed: 'Selesai',
                              cancelled: 'Dibatalkan',
                              no_show: 'Mangkir / No-Show'
                            };

                            return (
                              <tr key={b.id} className="hover:bg-slate-900/20 group">
                                <td className="py-3.5 pl-2 font-bold text-amber-500 font-heading text-sm">{b.bookingTime}</td>
                                <td className="py-3.5">
                                  <div className="font-semibold text-slate-100 flex items-center gap-1.5">
                                    <span>{b.customerName}</span>
                                    {b.notes && b.notes.trim() && (
                                      <span className="tooltip-container outline-none" tabIndex={0}>
                                        <FileText className="w-3.5 h-3.5 text-amber-500 hover:text-amber-400 cursor-help shrink-0" />
                                        <span className="tooltip-content">
                                          <span className="font-bold block border-b border-slate-800 pb-1 mb-1 text-amber-500 text-[10px] uppercase">Catatan Booking</span>
                                          {b.notes}
                                        </span>
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[10px] text-slate-500">{b.customerPhone}</div>
                                </td>
                                <td className="py-3.5 text-slate-300 font-semibold">{b.serviceName}</td>
                                <td className="py-3.5 text-slate-400 font-medium">{b.barberName.split(' ')[0]}</td>
                                <td className="py-3.5 text-slate-200 font-bold">{formatPrice(b.price)}</td>
                                <td className="py-3.5">
                                  <Badge variant={badgeVariants[b.status]}>{statusLabels[b.status]}</Badge>
                                </td>
                                <td className="py-3.5 text-right pr-2">
                                  {b.status === 'confirmed' || b.status === 'pending' ? (
                                    <div className="flex justify-end gap-1.5">
                                      <Button 
                                        variant="gold" 
                                        size="sm"
                                        className="py-1 px-2.5 text-[11px] font-bold"
                                        onClick={() => handleCheckoutOpen(b)}
                                      >
                                        <CheckSquare className="w-3.5 h-3.5 mr-1" /> Proses Kasir
                                      </Button>
                                      
                                      <Button
                                        variant="secondary"
                                        size="sm"
                                        className="py-1 px-2 text-[11px] border-slate-800 text-slate-400 hover:text-rose-400 hover:bg-rose-950/20"
                                        onClick={() => onUpdateStatus(b.id, 'no_show', 'Pelanggan tidak datang pada jam booking.')}
                                      >
                                        Mangkir
                                      </Button>
                                    </div>
                                  ) : b.status === 'completed' ? (
                                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider flex items-center justify-end gap-1">
                                      <Check className="w-3.5 h-3.5 text-emerald-500" /> Selesai Bayar
                                    </span>
                                  ) : b.status === 'no_show' ? (
                                    <span className="text-[10px] text-rose-500 font-bold uppercase tracking-wider flex items-center justify-end gap-1">
                                      <AlertTriangle className="w-3.5 h-3.5" /> Pelanggar Booking
                                    </span>
                                  ) : (
                                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">N/A</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>

            </div>
          )}

          {/* ====================================================
              TAB 2: SEMUA BOOKING / DETAILED TABLES
              ==================================================== */}
          {activeTab === 'bookings' && (
            <Card>
              <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <CardTitle>Daftar Riwayat Booking</CardTitle>
                  <CardDescription>Kelola dan filter semua pemesanan potong rambut barbershop Anda.</CardDescription>
                </div>
                
                {/* Search & Filter Controls */}
                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                  <Input
                    placeholder="Cari nama, telp, layanan..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full sm:w-48 bg-slate-950"
                  />
                  <Select
                    value={bookingFilter}
                    onChange={(e) => setBookingFilter(e.target.value)}
                    className="w-full sm:w-40 bg-slate-950 text-slate-300"
                  >
                    <option value="all">Semua Status</option>
                    <option value="pending">Menunggu Konfirmasi</option>
                    <option value="confirmed">Terkonfirmasi</option>
                    <option value="completed">Selesai</option>
                    <option value="no_show">Pelanggar (No-Show)</option>
                    <option value="cancelled">Dibatalkan</option>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                {filteredBookings.length === 0 ? (
                  <div className="text-center py-12 text-slate-500 text-sm">
                    Tidak ditemukan data booking yang cocok dengan filter atau pencarian Anda.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-900 text-slate-500 font-bold uppercase tracking-wider">
                          <th className="pb-3 pl-2">Pelanggan</th>
                          <th className="pb-3">Kontak WA</th>
                          <th className="pb-3">Jadwal Tanggal</th>
                          <th className="pb-3">Waktu</th>
                          <th className="pb-3">Layanan</th>
                          <th className="pb-3">Barber</th>
                          <th className="pb-3">Harga</th>
                          <th className="pb-3">Status</th>
                          <th className="pb-3 text-right pr-2">Aksi Pengelolaan</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-900/60">
                        {filteredBookings.map(b => {
                          const badgeVariants: Record<BookingStatus, 'success' | 'warning' | 'error' | 'info' | 'neutral'> = {
                            pending: 'warning',
                            confirmed: 'info',
                            completed: 'success',
                            cancelled: 'neutral',
                            no_show: 'error'
                          };

                          const statusLabels = {
                            pending: 'Menunggu',
                            confirmed: 'Terkonfirmasi',
                            completed: 'Selesai',
                            cancelled: 'Dibatalkan',
                            no_show: 'Mangkir'
                          };

                          return (
                            <tr key={b.id} className="hover:bg-slate-900/20">
                              <td className="py-3 pl-2 font-semibold text-slate-100">
                                <div className="flex items-center gap-1.5">
                                  <span>{b.customerName}</span>
                                  {b.notes && b.notes.trim() && (
                                    <span className="tooltip-container outline-none" tabIndex={0}>
                                      <FileText className="w-3.5 h-3.5 text-amber-500 hover:text-amber-400 cursor-help shrink-0" />
                                      <span className="tooltip-content">
                                        <span className="font-bold block border-b border-slate-800 pb-1 mb-1 text-amber-500 text-[10px] uppercase">Catatan Booking</span>
                                        {b.notes}
                                      </span>
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="py-3 text-slate-400 font-medium">{b.customerPhone}</td>
                              <td className="py-3 text-slate-400 font-medium">{b.bookingDate}</td>
                              <td className="py-3 text-amber-500 font-bold font-heading">{b.bookingTime} WIB</td>
                              <td className="py-3 text-slate-300 font-semibold">{b.serviceName}</td>
                              <td className="py-3 text-slate-400">{b.barberName.split(' ')[0]}</td>
                              <td className="py-3 text-slate-200 font-bold">{formatPrice(b.price)}</td>
                              <td className="py-3">
                                <Badge variant={badgeVariants[b.status]}>{statusLabels[b.status]}</Badge>
                              </td>
                              <td className="py-3 text-right pr-2">
                                <div className="flex justify-end gap-1">
                                  {b.status === 'pending' && (
                                    <Button
                                      variant="primary"
                                      size="sm"
                                      className="p-1 px-2 text-[10px] bg-indigo-600 hover:bg-indigo-500"
                                      onClick={() => {
                                        onUpdateStatus(b.id, 'confirmed');
                                        addToast(`Pemesanan ${b.customerName} berhasil dikonfirmasi!`, 'success');
                                      }}
                                    >
                                      Konfirmasi
                                    </Button>
                                  )}
                                  
                                  {(b.status === 'confirmed' || b.status === 'pending') && (
                                    <Button
                                      variant="gold"
                                      size="sm"
                                      className="p-1 px-2 text-[10px]"
                                      onClick={() => handleCheckoutOpen(b)}
                                    >
                                      POS Bayar
                                    </Button>
                                  )}

                                  {(b.status === 'confirmed' || b.status === 'pending') && (
                                    <Button
                                      variant="secondary"
                                      size="sm"
                                      className="p-1 px-1.5 text-[10px] text-rose-400 hover:bg-rose-950/20 border-slate-800"
                                      onClick={() => {
                                        onUpdateStatus(b.id, 'no_show', 'Mangkir dari antrean');
                                        addToast(`${b.customerName} ditandai sebagai mangkir (No Show).`, 'error');
                                      }}
                                      title="Tandai Mangkir"
                                    >
                                      No-Show
                                    </Button>
                                  )}

                                  <Button
                                    variant="secondary"
                                    size="sm"
                                    className="p-1 text-slate-500 hover:text-rose-500 border-none cursor-pointer"
                                    onClick={() => {
                                      if(confirm('Apakah Anda yakin ingin menghapus data booking ini?')) {
                                        onDeleteBooking(b.id);
                                        addToast('Data booking berhasil dihapus.', 'info');
                                      }
                                    }}
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* ====================================================
              TAB 3: PELANGGAR BOOKING (NO-SHOW VIOLATORS)
              ==================================================== */}
          {activeTab === 'violators' && (
            <div className="space-y-6">
              
              {/* Alert Warning Box */}
              <div className="p-4 bg-rose-950/15 border border-rose-500/20 rounded-xl flex items-start gap-3 text-left">
                <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-rose-400">Pemberitahuan Pelanggar Booking (No-Show Rules)</h4>
                  <p className="text-slate-400 text-xs mt-1 leading-relaxed">
                    Pelanggan yang mangkir ("no_show") berturut-turut tanpa pembatalan tertulis dapat merugikan barbershop Anda karena memblokir slot waktu produktif barber. Layanan kasir dashboard ini secara otomatis merekap dan menelusuri nomor telepon pelanggan yang paling sering melanggar janji temu untuk ditindaklanjuti.
                  </p>
                </div>
              </div>

              {/* Cumulative Offenders Grid / Table */}
              <Card className="border-rose-900/30">
                <CardHeader>
                  <CardTitle className="text-rose-400 flex items-center gap-2">
                    <Ban className="w-5 h-5" /> Daftar Rekap Pelanggar Teratas
                  </CardTitle>
                  <CardDescription>
                    Menampilkan database pelanggan yang teridentifikasi memiliki catatan mangkir dari antrean booking barbershop.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {violatorsList.length === 0 ? (
                    <div className="text-center py-12 text-slate-500 text-sm">
                      Luar biasa! Tidak ditemukan pelanggan dengan status pelanggaran mangkir (No-Show).
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-slate-900 text-slate-500 font-bold uppercase tracking-wider">
                            <th className="pb-3 pl-2">Nama Pelanggan</th>
                            <th className="pb-3">Nomor Telepon WA</th>
                            <th className="pb-3">Jumlah Pelanggaran (Mangkir)</th>
                            <th className="pb-3">Status Pemblokiran</th>
                            <th className="pb-3 text-right pr-2">Aksi Pengelolaan Pelanggar</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-900/60">
                          {violatorsList.map((violator, idx) => {
                            const isRepeated = violator.count >= 2;
                            return (
                              <tr key={idx} className="hover:bg-slate-900/20">
                                <td className="py-3.5 pl-2">
                                  <div className="font-bold text-slate-100 flex items-center gap-2">
                                    {violator.name}
                                    {isRepeated && (
                                      <span className="px-2 py-0.5 bg-rose-500/10 text-rose-400 border border-rose-500/30 text-[9px] font-bold uppercase rounded">
                                        Pelanggar Tegar
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="py-3.5 text-slate-300 font-semibold">{violator.phone}</td>
                                <td className="py-3.5">
                                  <span className="px-2.5 py-1 rounded bg-rose-950/40 text-rose-400 font-extrabold text-sm border border-rose-500/20">
                                    {violator.count} Kali Mangkir
                                  </span>
                                </td>
                                <td className="py-3.5">
                                  {isRepeated ? (
                                    <Badge variant="error">Direkomendasikan Blacklist</Badge>
                                  ) : (
                                    <Badge variant="warning">Teguran Pertama</Badge>
                                  )}
                                </td>
                                <td className="py-3.5 text-right pr-2">
                                  <div className="flex justify-end gap-2">
                                    <a
                                      href={`https://wa.me/${violator.phone.replace(/[^0-9]/g, '')}`}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="inline-flex items-center justify-center px-3 py-1.5 rounded-lg border border-slate-800 text-slate-300 font-bold hover:bg-slate-900 text-xs transition-colors"
                                    >
                                      Hubungi WA
                                    </a>
                                    <Button
                                      variant="danger"
                                      size="sm"
                                      className="py-1.5 px-3 font-semibold text-xs"
                                      onClick={() => {
                                        addToast(`Pelanggan ${violator.name} (${violator.phone}) berhasil ditambahkan ke daftar hitam (blacklist) pemesanan online!`, 'success');
                                      }}
                                    >
                                      Blacklist Pelanggan
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Individual Bad Bookings logs */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-slate-200">Log Rincian Booking Mangkir</CardTitle>
                  <CardDescription>Daftar rincian tiket booking yang tercatat dengan status No-Show.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {bookings.filter(b => b.status === 'no_show').map(b => (
                      <div key={b.id} className="p-4 bg-slate-950/40 border border-slate-900 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-white">{b.customerName}</span>
                            <span className="text-xs text-slate-500 font-medium">({b.customerPhone})</span>
                          </div>
                          <p className="text-xs text-slate-400 mt-1">
                            Layanan: <strong className="text-slate-300 font-semibold">{b.serviceName}</strong> oleh <strong className="text-slate-300 font-semibold">{b.barberName}</strong>
                          </p>
                          <p className="text-[11px] text-rose-500 mt-1 italic">
                            Alasan / Catatan: {b.notes || 'Tidak ada alasan khusus.'}
                          </p>
                        </div>
                        <div className="text-right sm:self-center">
                          <div className="text-xs text-slate-500 font-semibold">Jadwal Cukur</div>
                          <div className="text-xs font-bold text-slate-300 font-heading">{b.bookingDate} @ {b.bookingTime}</div>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="mt-2 text-[10px] py-1 border-rose-950 text-slate-400 hover:text-slate-100 hover:bg-slate-900"
                            onClick={() => {
                              onUpdateStatus(b.id, 'pending', 'Dipulihkan kembali dari No-Show');
                              addToast(`Reservasi ${b.customerName} dipulihkan menjadi Menunggu (Pending).`, 'success');
                            }}
                          >
                            Pulihkan Status
                          </Button>
                        </div>
                      </div>
                    ))}
                    {bookings.filter(b => b.status === 'no_show').length === 0 && (
                      <p className="text-xs text-slate-500 text-center py-4">Belum ada rincian data pelanggaran.</p>
                    )}
                  </div>
                </CardContent>
              </Card>

            </div>
          )}

          {/* ====================================================
              TAB 4: RIWAYAT PENJUALAN (TRANSACTIONS)
              ==================================================== */}
          {activeTab === 'transactions' && (
            <Card>
              <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle>Riwayat Pembayaran Kasir (POS)</CardTitle>
                  <CardDescription>Semua pembayaran yang diselesaikan lewat antrean kasir barbershop digital.</CardDescription>
                </div>
                <Badge variant="success">Lunas Selesai</Badge>
              </CardHeader>
              <CardContent>
                {transactions.length === 0 ? (
                  <div className="text-center py-12 text-slate-500 text-sm">
                    Belum ada riwayat transaksi pembayaran. Selesaikan antrean booking di tab Overview terlebih dahulu!
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-900 text-slate-500 font-bold uppercase tracking-wider">
                          <th className="pb-3 pl-2">Invoice ID</th>
                          <th className="pb-3">Pelanggan</th>
                          <th className="pb-3">Tanggal / Jam</th>
                          <th className="pb-3">Daftar Layanan Rinci</th>
                          <th className="pb-3">Subtotal</th>
                          <th className="pb-3">Pajak (10%)</th>
                          <th className="pb-3">Diskon</th>
                          <th className="pb-3">Total Bayar</th>
                          <th className="pb-3 text-right pr-2">Metode Pembayaran</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-900/60">
                        {transactions.map(t => (
                          <tr key={t.id} className="hover:bg-slate-900/20">
                            <td className="py-3 pl-2 font-bold text-amber-500 font-heading">{t.id.toUpperCase()}</td>
                            <td className="py-3 font-semibold text-slate-100">{t.customerName}</td>
                            <td className="py-3 text-slate-400">
                              <div>{t.transactionDate}</div>
                              <div className="text-[10px] text-slate-500">{t.transactionTime} WIB</div>
                            </td>
                            <td className="py-3">
                              <div className="flex flex-col gap-0.5">
                                {t.services.map((s, idx) => (
                                  <span key={idx} className="text-slate-300 font-medium">
                                    • {s.name} ({formatPrice(s.price)})
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td className="py-3 text-slate-400">{formatPrice(t.subtotal)}</td>
                            <td className="py-3 text-slate-500">{formatPrice(t.tax)}</td>
                            <td className="py-3 text-rose-500/80 font-semibold">-{formatPrice(t.discount)}</td>
                            <td className="py-3 text-slate-100 font-extrabold text-sm">{formatPrice(t.total)}</td>
                            <td className="py-3 text-right pr-2">
                              <Badge variant={t.paymentMethod === 'qris' ? 'warning' : t.paymentMethod === 'cash' ? 'success' : 'info'}>
                                {t.paymentMethod === 'qris' ? 'QRIS E-Wallet' : t.paymentMethod === 'cash' ? 'Tunai / Cash' : 'Kartu Kredit/Debit'}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* ====================================================
              TAB 5: DATABASE & CLOUD CENTER (SUPABASE BACKUP)
              ==================================================== */}
          {activeTab === 'database' && (
            <div className="space-y-6">
              
              {/* Database status and explanation */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Supabase status and credentials info */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Database className="w-5 h-5 text-indigo-400 animate-pulse" /> Integrasi Cloud Database
                    </CardTitle>
                    <CardDescription>Penyimpanan cloud barbershop terintegrasi.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-slate-300 text-xs leading-relaxed">
                      Secara default, aplikasi ini berjalan menggunakan <strong className="text-amber-500 font-bold">LocalStorage (IndexedDB/Web)</strong> yang menyimpan data secara lokal di browser Anda secara offline.
                    </p>
                    <p className="text-slate-300 text-xs leading-relaxed">
                      Untuk menghubungkannya ke cloud database gratis, Anda cukup membuat project di <strong className="text-amber-500 font-bold">Supabase (Gratis & Cloud)</strong> dan menyetel dua variabel lingkungan (Environment Variables) berikut pada file <code className="text-white bg-slate-950 p-1 rounded font-mono text-[10px]">.env</code> Anda:
                    </p>
                    
                    <div className="p-3.5 bg-slate-950 rounded-lg space-y-2 border border-slate-900 font-mono text-[11px] text-slate-400">
                      <div>VITE_SUPABASE_URL=<span className="text-indigo-400">"https://project-id.supabase.co"</span></div>
                      <div>VITE_SUPABASE_ANON_KEY=<span className="text-indigo-400">"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVC..."</span></div>
                    </div>

                    <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-300">Status Koneksi Cloud:</span>
                      {isSupabaseConnected ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-extrabold bg-emerald-950/40 border border-emerald-500/20 text-emerald-400">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                          Terkoneksi (Supabase Cloud)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-extrabold bg-amber-950/40 border border-amber-500/20 text-amber-400">
                          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                          Offline (Local Storage)
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Import / Export JSON backup controls */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <RefreshCw className="w-5 h-5 text-amber-500" /> Cadangan Lokal (JSON Ekspor/Impor)
                    </CardTitle>
                    <CardDescription>Simpan seluruh data barbershop (pelanggan, transaksi, booking) ke cloud drive Anda secara manual dengan file JSON.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-slate-300 text-xs leading-relaxed">
                      Anda bisa mengekspor database lokal Anda menjadi file teks terenkripsi JSON, lalu mengunduhnya atau menyimpannya di Cloud Drive (Google Drive/Dropbox) pribadi Anda untuk dipulihkan kapan saja.
                    </p>

                    <div className="flex gap-2">
                      <Button variant="secondary" className="flex-1 py-2 font-bold" onClick={handleExport}>
                        <Download className="w-4 h-4 mr-1.5" /> Ekspor Database
                      </Button>
                      <Button variant="outline" className="flex-1 py-2 font-bold" onClick={handleImport}>
                        <Upload className="w-4 h-4 mr-1.5" /> Impor / Pulihkan
                      </Button>
                    </div>

                    <Button 
                      variant="danger" 
                      className="w-full py-2 bg-rose-950/20 hover:bg-rose-950/50 text-rose-400 border border-rose-500/10 font-bold"
                      onClick={() => {
                        if (confirm('WARNING! Apakah Anda yakin ingin mereset seluruh database ke data awal bawaan demo? Semua riwayat transaksi akan dihapus.')) {
                          onResetDb();
                          addToast('Database berhasil direset ke setting awal pabrik.', 'info');
                        }
                      }}
                    >
                      Reset Ke Data Bawaan (Demo)
                    </Button>
                  </CardContent>
                </Card>

              </div>

              {/* SQL Schema copier for Supabase */}
              <Card>
                <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <CardTitle>Skema SQL Supabase Editor</CardTitle>
                    <CardDescription>Salin kode inisialisasi tabel SQL di bawah ini dan jalankan di SQL Editor Supabase untuk struktur cloud instan.</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" className="border-slate-800 text-slate-300" onClick={copySchemaToClipboard}>
                    {isCopied ? 'Tersalin!' : 'Salin Skema SQL'}
                  </Button>
                </CardHeader>
                <CardContent>
                  <pre className="p-4 bg-slate-950 border border-slate-900 rounded-xl font-mono text-[10px] text-slate-400 overflow-x-auto max-h-60 text-left select-all">
                    {SUPABASE_SQL_SCHEMA}
                  </pre>
                </CardContent>
              </Card>

              {/* JSON text field area */}
              <Card>
                <CardHeader>
                  <CardTitle>Kotak Backup Teks Database (JSON State)</CardTitle>
                  <CardDescription>Gunakan area di bawah ini untuk mengekstrak hasil ekspor atau menaruh teks JSON cadangan Anda untuk dipulihkan.</CardDescription>
                </CardHeader>
                <CardContent>
                  <TextArea
                    value={importJsonText}
                    onChange={(e) => setImportJsonText(e.target.value)}
                    placeholder="Teks JSON database Anda akan muncul di sini setelah diekspor, atau taruh file teks cadangan Anda di sini lalu klik tombol Impor..."
                    className="font-mono text-xs text-slate-300 bg-slate-950 border-slate-900 min-h-36"
                  />
                </CardContent>
              </Card>

            </div>
          )}

          {/* ====================================================
              TAB 6: CMS KONTEN (KELOLA LAYANAN & STAFF BARBER)
              ==================================================== */}
          {activeTab === 'content' && (
             <div className="space-y-8">
               
               {/* 1. SEKSI KELOLA LAYANAN (SERVICES) */}
               <Card>
                 <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                   <div>
                     <CardTitle className="flex items-center gap-2">
                       <Scissors className="w-5 h-5 text-amber-500" /> Katalog Layanan Barbershop
                     </CardTitle>
                     <CardDescription>Tambah, edit, atau hapus menu pangkas rambut, shaving, spa leher, dan paket pangkas executive.</CardDescription>
                   </div>
                   <Button variant="gold" size="sm" onClick={() => handleOpenServiceModal()}>
                     <Plus className="w-4 h-4 mr-1.5" /> Tambah Layanan Baru
                   </Button>
                 </CardHeader>
                 <CardContent>
                   <div className="overflow-x-auto border border-slate-900 rounded-xl">
                     <table className="w-full text-left border-collapse text-xs">
                       <thead>
                         <tr className="bg-slate-950 border-b border-slate-900 text-slate-400 font-bold uppercase tracking-wider">
                           <th className="py-3 px-4">Nama Layanan</th>
                           <th className="py-3 px-4">Kategori</th>
                           <th className="py-3 px-4">Durasi</th>
                           <th className="py-3 px-4">Harga Menu</th>
                           <th className="py-3 px-4">Deskripsi Singkat</th>
                           <th className="py-3 px-4 text-right">Aksi</th>
                         </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-900/60 bg-slate-950/20">
                         {services.map((s) => (
                           <tr key={s.id} className="hover:bg-slate-900/20">
                             <td className="py-3.5 px-4 font-bold text-slate-100">{s.name}</td>
                             <td className="py-3.5 px-4">
                               <Badge variant={s.category === 'package' ? 'warning' : 'neutral'}>
                                 {s.category === 'haircut' ? 'Cukur Rambut' : s.category === 'beard' ? 'Shaving Jenggot' : s.category === 'spa' ? 'Hair Spa/Terapi' : 'Paket Executive'}
                               </Badge>
                             </td>
                             <td className="py-3.5 px-4 text-slate-400 font-medium">{s.duration} Menit</td>
                             <td className="py-3.5 px-4 font-bold text-amber-500">{formatPrice(s.price)}</td>
                             <td className="py-3.5 px-4 text-slate-400 max-w-xs truncate">{s.description || '-'}</td>
                             <td className="py-3.5 px-4 text-right">
                               <div className="flex justify-end gap-2">
                                 <Button variant="outline" size="sm" className="py-1 px-2.5 text-[11px] font-bold" onClick={() => handleOpenServiceModal(s)}>
                                   Edit
                                 </Button>
                                 <Button variant="danger" size="sm" className="py-1 px-2.5 text-[11px] font-bold bg-rose-950/20 hover:bg-rose-950/50 text-rose-400 border border-rose-500/10" onClick={() => handleDeleteServiceClick(s.id)}>
                                   Hapus
                                 </Button>
                               </div>
                             </td>
                           </tr>
                         ))}
                       </tbody>
                     </table>
                   </div>
                 </CardContent>
               </Card>

               {/* 2. SEKSI KELOLA BARBER (STAFF STYLISTS) */}
               <Card>
                 <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                   <div>
                     <CardTitle className="flex items-center gap-2">
                       <UserCheck className="w-5 h-5 text-indigo-400" /> Tim Stylist Barber Profesional
                     </CardTitle>
                     <CardDescription>Kelola tim barber stylist Anda yang bertugas di lokasi potong rambut.</CardDescription>
                   </div>
                   <Button variant="gold" size="sm" onClick={() => handleOpenBarberModal()}>
                     <Plus className="w-4 h-4 mr-1.5" /> Tambah Staff Barber
                   </Button>
                 </CardHeader>
                 <CardContent>
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                     {barbers.map((b) => (
                       <Card key={b.id} className="bg-slate-950/40 border-slate-900 relative overflow-hidden">
                         <CardContent className="p-5 flex items-center gap-4">
                           <img src={b.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200'} alt={b.name} className="w-14 h-14 rounded-full border border-slate-800 object-cover" />
                           <div className="flex-1 min-w-0">
                             <h4 className="font-heading font-bold text-sm text-slate-100 truncate">{b.name}</h4>
                             <p className="text-xs text-slate-400 truncate mt-0.5">{b.role}</p>
                             <div className="flex items-center gap-1.5 mt-2">
                               <span className="text-[10px] font-bold text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                                 ★ {b.rating.toFixed(1)}
                               </span>
                             </div>
                           </div>
                         </CardContent>
                         <div className="px-5 py-3.5 bg-slate-950 border-t border-slate-900/60 flex justify-end gap-2">
                           <Button variant="outline" size="sm" className="py-1 px-2.5 text-[10px] font-bold" onClick={() => handleOpenBarberModal(b)}>
                             Edit Staff
                           </Button>
                           <Button variant="danger" size="sm" className="py-1 px-2.5 text-[10px] font-bold bg-rose-950/20 hover:bg-rose-950/50 text-rose-400 border border-rose-500/10" onClick={() => handleDeleteBarberClick(b.id)}>
                             Pecat / Hapus
                           </Button>
                         </div>
                       </Card>
                     ))}
                   </div>
                 </CardContent>
               </Card>
             </div>
          )}

          {/* ====================================================
              TAB 7: CMS ADMINS (KELOLA USER ADMIN)
              ==================================================== */}
          {activeTab === 'admins' && (
             <div className="space-y-8 animate-fadeIn text-left">
               
               {/* SEKSI KELOLA ADMIN */}
               <Card>
                 <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                   <div>
                     <CardTitle className="flex items-center gap-2">
                       <Users className="w-5 h-5 text-amber-500" /> Pengaturan Pengguna Admin
                     </CardTitle>
                     <CardDescription>Tambah, edit, atau hapus kredensial admin yang memiliki otorisasi penuh untuk masuk ke aplikasi.</CardDescription>
                   </div>
                   <Button variant="gold" size="sm" onClick={() => handleOpenAdminModal()}>
                     <Plus className="w-4 h-4 mr-1.5" /> Tambah Admin Baru
                   </Button>
                 </CardHeader>
                 <CardContent>
                   <div className="overflow-x-auto border border-slate-900 rounded-xl">
                     <table className="w-full text-left border-collapse text-xs">
                       <thead>
                         <tr className="bg-slate-950 border-b border-slate-900 text-slate-400 font-bold uppercase tracking-wider">
                           <th className="py-3 px-4">Username</th>
                           <th className="py-3 px-4">Role Akses</th>
                           <th className="py-3 px-4">ID Unik</th>
                           <th className="py-3 px-4 text-right">Tindakan</th>
                         </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-900/60 bg-slate-950/10">
                         {admins.map((admin) => (
                           <tr key={admin.id} className="hover:bg-slate-900/30 transition-colors">
                             <td className="py-3.5 px-4 font-bold text-slate-200 flex items-center gap-2">
                               <div className="w-7 h-7 rounded-full bg-amber-500/10 flex items-center justify-center border border-amber-500/20 text-amber-500 font-extrabold uppercase text-[10px]">
                                 {admin.username.substring(0, 2)}
                               </div>
                               <span>{admin.username}</span>
                             </td>
                             <td className="py-3.5 px-4">
                               <Badge variant={admin.role === 'super_admin' ? 'warning' : 'neutral'} className="px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider">
                                 {admin.role === 'super_admin' ? 'Super Admin' : 'Admin Staff'}
                               </Badge>
                             </td>
                             <td className="py-3.5 px-4 font-mono text-slate-500">{admin.id}</td>
                             <td className="py-3.5 px-4 text-right">
                               <div className="flex gap-2 justify-end">
                                 <Button variant="outline" size="sm" className="py-1 px-2.5 text-[10px] font-semibold" onClick={() => handleOpenAdminModal(admin)}>
                                   Edit
                                 </Button>
                                 <Button variant="danger" size="sm" className="py-1 px-2.5 text-[10px] font-semibold bg-rose-950/20 hover:bg-rose-950/50 text-rose-400 border border-rose-500/10" onClick={() => handleDeleteAdminClick(admin.id)}>
                                   Hapus
                                 </Button>
                               </div>
                             </td>
                           </tr>
                         ))}
                         {admins.length === 0 && (
                           <tr>
                             <td colSpan={4} className="py-10 text-center text-slate-500 font-semibold">
                               Belum ada akun admin terdaftar. Silakan tambah admin baru.
                             </td>
                           </tr>
                         )}
                       </tbody>
                     </table>
                   </div>
                 </CardContent>
               </Card>
             </div>
          )}

        </div>
      </main>

      {/* ====================================================
          MODAL DIALOGS
          ==================================================== */}
      
      {/* 1. MANUAL BOOKING MODAL (FOR CASHIER AT BARBERSHOP) */}
      <Dialog
        isOpen={isManualBookingOpen}
        onClose={() => setIsManualBookingOpen(false)}
        title="Input Booking Kasir Baru"
        description="Gunakan form ini untuk memasukkan reservasi walk-in (datang langsung) atau booking via WA secara manual ke dalam sistem scheduler."
        size="md"
      >
        <form onSubmit={handleManualBookingSubmit} className="space-y-4">
          <Input
            label="Nama Pelanggan"
            value={manualFormData.customerName}
            onChange={(e) => setManualFormData(prev => ({ ...prev, customerName: e.target.value }))}
            placeholder="Masukkan nama lengkap pelanggan..."
            required
          />

          <Input
            label="Nomor WhatsApp Pelanggan"
            value={manualFormData.customerPhone}
            onChange={(e) => setManualFormData(prev => ({ ...prev, customerPhone: e.target.value }))}
            placeholder="Masukkan nomor WA aktif..."
            type="tel"
            required
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Layanan Utama"
              value={manualFormData.serviceId}
              onChange={(e) => setManualFormData(prev => ({ ...prev, serviceId: e.target.value }))}
            >
              {services.map(s => (
                <option key={s.id} value={s.id} className="bg-slate-900 text-slate-100">
                  {s.name} ({formatPrice(s.price)})
                </option>
              ))}
            </Select>

            <Select
              label="Barber Stylist"
              value={manualFormData.barberId}
              onChange={(e) => setManualFormData(prev => ({ ...prev, barberId: e.target.value }))}
            >
              {barbers.map(b => (
                <option key={b.id} value={b.id} className="bg-slate-900 text-slate-100">
                  {b.name} (★{b.rating})
                </option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Tanggal Booking"
              type="date"
              value={manualFormData.bookingDate}
              onChange={(e) => setManualFormData(prev => ({ ...prev, bookingDate: e.target.value }))}
              required
            />

            <Select
              label="Waktu Slot"
              value={manualFormData.bookingTime}
              onChange={(e) => setManualFormData(prev => ({ ...prev, bookingTime: e.target.value }))}
            >
              <option value="09:00" className="bg-slate-900 text-slate-100">09:00 WIB</option>
              <option value="10:00" className="bg-slate-900 text-slate-100">10:00 WIB</option>
              <option value="10:30" className="bg-slate-900 text-slate-100">10:30 WIB</option>
              <option value="11:00" className="bg-slate-900 text-slate-100">11:00 WIB</option>
              <option value="13:00" className="bg-slate-900 text-slate-100">13:00 WIB</option>
              <option value="14:00" className="bg-slate-900 text-slate-100">14:00 WIB</option>
              <option value="14:30" className="bg-slate-900 text-slate-100">14:30 WIB</option>
              <option value="15:00" className="bg-slate-900 text-slate-100">15:00 WIB</option>
              <option value="15:30" className="bg-slate-900 text-slate-100">15:30 WIB</option>
              <option value="16:00" className="bg-slate-900 text-slate-100">16:00 WIB</option>
              <option value="17:00" className="bg-slate-900 text-slate-100">17:00 WIB</option>
              <option value="18:30" className="bg-slate-900 text-slate-100">18:30 WIB</option>
              <option value="19:00" className="bg-slate-900 text-slate-100">19:00 WIB</option>
              <option value="20:00" className="bg-slate-900 text-slate-100">20:00 WIB</option>
            </Select>
          </div>

          <TextArea
            label="Catatan walk-in / admin"
            value={manualFormData.notes}
            onChange={(e) => setManualFormData(prev => ({ ...prev, notes: e.target.value }))}
            placeholder="Tulis instruksi khusus cukur jenggot, model fade, request pomade, dll..."
          />

          <div className="flex gap-2 justify-end pt-3">
            <Button type="button" variant="secondary" onClick={() => setIsManualBookingOpen(false)}>Batal</Button>
            <Button type="submit" variant="gold" className="px-6 font-bold">Buat Booking</Button>
          </div>
        </form>
      </Dialog>

      {/* 2. PREMIUM POS CASHIER CHECKOUT MODAL */}
      <Dialog
        isOpen={isCheckoutOpen}
        onClose={() => {
          setIsCheckoutOpen(false);
          setSelectedCheckoutBooking(null);
        }}
        title="Pembayaran POS Kasir (Checkout)"
        description="Proses pembayaran akhir pelanggan untuk mencatat penjualan, menghitung diskon dan mencetak riwayat invoice."
        size="md"
      >
        {selectedCheckoutBooking && (
          <form onSubmit={handlePOSCheckoutSubmit} className="space-y-4">
            
            {/* Customer Brief Card */}
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-900 flex justify-between items-center text-left">
              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Pelanggan Reservasi</span>
                <h4 className="text-sm font-bold text-white mt-0.5">{selectedCheckoutBooking.customerName}</h4>
                <p className="text-[10px] text-slate-400">{selectedCheckoutBooking.customerPhone}</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Barber Pelaksana</span>
                <p className="text-xs text-amber-500 font-bold mt-0.5">{selectedCheckoutBooking.barberName.split(' ')[0]}</p>
              </div>
            </div>

            {/* Base Service Rendered */}
            <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl text-left">
              <span className="text-xs font-semibold text-slate-400 block mb-1.5 uppercase tracking-wider">Layanan Utama Terpilih</span>
              <div className="flex justify-between items-center text-sm">
                <span className="font-bold text-white">{selectedCheckoutBooking.serviceName}</span>
                <span className="font-extrabold text-amber-400">{formatPrice(selectedCheckoutBooking.price)}</span>
              </div>
            </div>

            {/* Add Extra Services (Cross-sell/Up-sell during Checkout!) */}
            <div className="text-left">
              <span className="text-xs font-semibold text-slate-400 block mb-2 uppercase tracking-wider">Tambahkan Layanan Extra (POS Up-sell)</span>
              <div className="space-y-2 bg-slate-950/30 p-3 rounded-xl border border-slate-900">
                {services
                  .filter(s => s.id !== selectedCheckoutBooking.serviceId) // Skip the main selected service
                  .map(s => {
                    const isChecked = checkoutAddons.includes(s.id);
                    return (
                      <label key={s.id} className="flex items-center justify-between p-2 rounded hover:bg-slate-900/60 cursor-pointer text-xs transition-colors">
                        <div className="flex items-center gap-2">
                          <input 
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              if (isChecked) {
                                setCheckoutAddons(prev => prev.filter(id => id !== s.id));
                              } else {
                                setCheckoutAddons(prev => [...prev, s.id]);
                              }
                            }}
                            className="rounded bg-slate-950 border-slate-800 text-amber-500 focus:ring-amber-500/20 cursor-pointer"
                          />
                          <span className="font-bold text-slate-200">{s.name}</span>
                        </div>
                        <span className="font-bold text-amber-500">+{formatPrice(s.price)}</span>
                      </label>
                    );
                  })}
              </div>
            </div>

            {/* Payment & Promo Discounts */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Nominal Diskon Promo (Rupiah)"
                type="number"
                value={checkoutDiscount || ''}
                onChange={(e) => setCheckoutDiscount(Number(e.target.value))}
                placeholder="Contoh: 10000"
              />

              <Select
                label="Metode Pembayaran Kasir"
                value={checkoutPaymentMethod}
                onChange={(e) => setCheckoutPaymentMethod(e.target.value as 'cash' | 'card' | 'qris')}
              >
                <option value="qris" className="bg-slate-900 text-slate-100">QRIS E-Wallet</option>
                <option value="cash" className="bg-slate-900 text-slate-100">Tunai / Cash</option>
                <option value="card" className="bg-slate-900 text-slate-100">Kartu Kredit/Debit</option>
              </Select>
            </div>

            {/* Receipt Cost Breakdown */}
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-900 space-y-2 text-xs font-semibold text-slate-400 text-left">
              <div className="flex justify-between">
                <span>Subtotal Layanan:</span>
                <span className="text-slate-200">
                  {formatPrice(
                    selectedCheckoutBooking.price + 
                    checkoutAddons.reduce((acc, curr) => acc + (services.find(s => s.id === curr)?.price || 0), 0)
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Pajak Resto/PPN (10%):</span>
                <span className="text-slate-200">
                  {formatPrice(
                    Math.round(
                      (selectedCheckoutBooking.price + 
                      checkoutAddons.reduce((acc, curr) => acc + (services.find(s => s.id === curr)?.price || 0), 0)) * 0.1
                    )
                  )}
                </span>
              </div>
              {checkoutDiscount > 0 && (
                <div className="flex justify-between text-rose-400">
                  <span>Diskon Promo Potongan:</span>
                  <span>-{formatPrice(checkoutDiscount)}</span>
                </div>
              )}
              
              <div className="border-t border-slate-900 pt-2.5 flex justify-between text-sm text-slate-100 font-extrabold">
                <span className="font-heading uppercase tracking-wide">Net Total Invoice:</span>
                <span className="text-amber-400 font-heading">
                  {formatPrice(
                    Math.max(
                      0,
                      (selectedCheckoutBooking.price + 
                        checkoutAddons.reduce((acc, curr) => acc + (services.find(s => s.id === curr)?.price || 0), 0)) +
                      Math.round(
                        (selectedCheckoutBooking.price + 
                        checkoutAddons.reduce((acc, curr) => acc + (services.find(s => s.id === curr)?.price || 0), 0)) * 0.1
                      ) -
                      checkoutDiscount
                    )
                  )}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 justify-end pt-3">
              <Button 
                type="button" 
                variant="secondary" 
                onClick={() => {
                  setIsCheckoutOpen(false);
                  setSelectedCheckoutBooking(null);
                }}
              >
                Batal
              </Button>
              <Button type="submit" variant="gold" className="px-6 font-bold shadow-emerald-950/20">
                Selesaikan Transaksi & Cetak Invoice
              </Button>
            </div>
          </form>
        )}
      </Dialog>

      {/* 4. CMS LAYANAN DIALOG MODAL */}
      <Dialog
        isOpen={isServiceModalOpen}
        onClose={() => setIsServiceModalOpen(false)}
        title={editingService ? "Edit Katalog Layanan" : "Tambah Katalog Layanan Baru"}
        description="Lengkapi detail menu layanan barbershop di bawah. Data akan disinkronkan ke local storage dan cloud Supabase."
        size="sm"
      >
        <form onSubmit={handleServiceSubmit} className="space-y-4 text-left">
          <Input
            label="Nama Layanan / Treatment"
            value={serviceFormData.name}
            onChange={(e) => setServiceFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="Contoh: Gentleman's Special Cut..."
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Harga (IDR / Rupiah)"
              type="number"
              value={serviceFormData.price}
              onChange={(e) => setServiceFormData(prev => ({ ...prev, price: Number(e.target.value) }))}
              placeholder="65000"
              required
            />
            <Input
              label="Durasi (Menit)"
              type="number"
              value={serviceFormData.duration}
              onChange={(e) => setServiceFormData(prev => ({ ...prev, duration: Number(e.target.value) }))}
              placeholder="30"
              required
            />
          </div>

          <Select
            label="Kategori Menu"
            value={serviceFormData.category}
            onChange={(e: any) => setServiceFormData(prev => ({ ...prev, category: e.target.value as any }))}
          >
            <option value="haircut">Cukur Rambut (Haircut)</option>
            <option value="beard">Shaving Jenggot (Beard Shave)</option>
            <option value="spa">Hair Spa & Perawatan (Spa)</option>
            <option value="package">Paket Executive (Package)</option>
          </Select>

          <TextArea
            label="Deskripsi Layanan"
            value={serviceFormData.description}
            onChange={(e) => setServiceFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Tuliskan keterangan detail layanan potong rambut di sini..."
            className="min-h-20"
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setIsServiceModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" variant="gold">
              {editingService ? "Simpan Perubahan" : "Tambah Layanan"}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* 5. CMS BARBER DIALOG MODAL */}
      <Dialog
        isOpen={isBarberModalOpen}
        onClose={() => setIsBarberModalOpen(false)}
        title={editingBarber ? "Edit Profil Staff Barber" : "Tambah Staff Barber Baru"}
        description="Lengkapi detail profil stylist barbershop di bawah. Data akan disinkronkan ke local storage dan cloud Supabase."
        size="sm"
      >
        <form onSubmit={handleBarberSubmit} className="space-y-4 text-left">
          <Input
            label="Nama Lengkap Stylist"
            value={barberFormData.name}
            onChange={(e) => setBarberFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="Contoh: Samuel Wijaya..."
            required
          />

          <Input
            label="Jabatan / Spesialisasi"
            value={barberFormData.role}
            onChange={(e) => setBarberFormData(prev => ({ ...prev, role: e.target.value }))}
            placeholder="Contoh: Senior Stylist (Fade Specialist)..."
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Rating Awal Staff (1.0 - 5.0)"
              type="number"
              step="0.1"
              min="1.0"
              max="5.0"
              value={barberFormData.rating}
              onChange={(e) => setBarberFormData(prev => ({ ...prev, rating: Number(e.target.value) }))}
              placeholder="4.8"
              required
            />
            <Input
              label="URL Avatar / Foto Profil"
              value={barberFormData.avatar}
              onChange={(e) => setBarberFormData(prev => ({ ...prev, avatar: e.target.value }))}
              placeholder="https://images.unsplash.com/..."
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setIsBarberModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" variant="gold">
              {editingBarber ? "Simpan Perubahan" : "Tambah Staff"}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* 5. CMS ADMIN MODAL */}
      <Dialog
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        title={editingAdmin ? "Edit Akun Admin" : "Tambah Admin Baru"}
        description="Lengkapi detail akun admin di bawah. Password akan otomatis dienkripsi dengan bcrypt sebelum disimpan."
        size="sm"
      >
        <form onSubmit={handleAdminSubmit} className="space-y-4 text-left">
          <Input
            label="Username Admin"
            value={adminFormData.username}
            onChange={(e) => setAdminFormData(prev => ({ ...prev, username: e.target.value }))}
            placeholder="Masukkan username..."
            required
            disabled={!!editingAdmin}
          />
          
          <Input
            label={editingAdmin ? "Password Baru (Biarkan kosong jika tidak ingin diubah)" : "Password Utama"}
            type="password"
            value={adminFormData.password}
            onChange={(e) => setAdminFormData(prev => ({ ...prev, password: e.target.value }))}
            placeholder="Masukkan password..."
            required={!editingAdmin}
          />

          <Select
            label="Role Hak Akses"
            value={adminFormData.role}
            onChange={(e) => setAdminFormData(prev => ({ ...prev, role: e.target.value }))}
          >
            <option value="admin" className="bg-slate-900 text-slate-100">Admin Staff (Hak Akses Standar)</option>
            <option value="super_admin" className="bg-slate-900 text-slate-100">Super Admin (Hak Akses Penuh)</option>
          </Select>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setIsAdminModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" variant="gold">
              {editingAdmin ? "Simpan Perubahan" : "Tambah Admin"}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
};
