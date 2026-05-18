import React, { useState } from 'react';
import { Scissors, Calendar, Clock, Star, MapPin, Phone, ShieldCheck, Award, Sparkles } from 'lucide-react';
import type { Service, Barber, Booking } from '../types';
import { Button, Card, CardContent, Dialog, Input, Select, TextArea } from './ui/CustomComponents';
import confetti from 'canvas-confetti';

interface LandingPageProps {
  onNavigate: (view: 'landing' | 'login' | 'dashboard') => void;
  services: Service[];
  barbers: Barber[];
  onBook: (booking: Omit<Booking, 'id' | 'createdAt' | 'status'>) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onNavigate,
  services,
  barbers,
  onBook
}) => {
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);

  // Booking Form State
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    serviceId: services[0]?.id || '',
    barberId: barbers[0]?.id || '',
    bookingDate: new Date().toISOString().split('T')[0],
    bookingTime: '09:00',
    notes: ''
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.customerName.trim()) errors.customerName = 'Nama lengkap wajib diisi';
    if (!formData.customerPhone.trim()) {
      errors.customerPhone = 'Nomor telepon wajib diisi';
    } else if (!/^[0-9+-\s]{8,15}$/.test(formData.customerPhone)) {
      errors.customerPhone = 'Nomor telepon tidak valid (8-15 digit)';
    }

    // Validate booking date (must not be in the past)
    const todayStr = new Date().toISOString().split('T')[0];
    if (formData.bookingDate < todayStr) {
      errors.bookingDate = 'Tanggal booking tidak boleh di masa lalu';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const selectedService = services.find(s => s.id === formData.serviceId)!;
    const selectedBarber = barbers.find(b => b.id === formData.barberId)!;

    onBook({
      customerName: formData.customerName,
      customerPhone: formData.customerPhone,
      serviceId: formData.serviceId,
      serviceName: selectedService.name,
      price: selectedService.price,
      bookingDate: formData.bookingDate,
      bookingTime: formData.bookingTime,
      barberId: formData.barberId,
      barberName: selectedBarber.name,
      notes: formData.notes
    });

    // Reset Form
    setFormData({
      customerName: '',
      customerPhone: '',
      serviceId: services[0]?.id || '',
      barberId: barbers[0]?.id || '',
      bookingDate: new Date().toISOString().split('T')[0],
      bookingTime: '09:00',
      notes: ''
    });

    setIsBookModalOpen(false);

    // Blast premium confetti!
    confetti({
      particleCount: 150,
      spread: 80,
      origin: { y: 0.6 },
      colors: ['#d97706', '#f59e0b', '#fbbf24', '#ffffff', '#1e293b']
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(price);
  };

  return (
    <div className="flex-1 bg-[#070a13] text-slate-100 flex flex-col selection:bg-amber-600/40 selection:text-white relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-amber-500/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[20%] left-[-15%] w-[600px] h-[600px] rounded-full bg-indigo-500/5 blur-[150px] pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#070a13]/80 backdrop-blur-lg border-b border-slate-900 px-6 py-4 transition-all duration-300">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer group" onClick={() => onNavigate('landing')}>
            <div className="p-2 bg-linear-to-br from-amber-500 to-amber-700 rounded-lg shadow-lg shadow-amber-900/30 group-hover:rotate-6 transition-all duration-300">
              <Scissors className="w-5 h-5 text-slate-950 stroke-[2.5]" />
            </div>
            <span className="font-heading text-xl font-extrabold tracking-wide uppercase bg-linear-to-r from-amber-400 to-yellow-200 bg-clip-text text-transparent">
              THE GENTLEMEN
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-300">
            <a href="#services" className="hover:text-amber-400 transition-colors">Layanan</a>
            <a href="#barbers" className="hover:text-amber-400 transition-colors">Barber Kami</a>
            <a href="#about" className="hover:text-amber-400 transition-colors">Tentang Kami</a>
            <a href="#testimonials" className="hover:text-amber-400 transition-colors">Testimoni</a>
          </nav>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              className="border-slate-800 text-slate-300 hover:bg-slate-800"
              onClick={() => onNavigate('login')}
            >
              Sign In Admin
            </Button>
            <Button
              variant="gold"
              size="sm"
              onClick={() => setIsBookModalOpen(true)}
            >
              <Calendar className="w-4 h-4 mr-2" /> Booking Sekarang
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative px-6 py-20 lg:py-32 flex flex-col items-center text-center max-w-5xl mx-auto z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full text-xs font-bold text-amber-400 uppercase tracking-widest mb-6 animate-pulse">
          <Sparkles className="w-3.5 h-3.5" /> Premium Gentlemen Experience
        </div>

        <h1 className="font-heading text-5xl md:text-7xl font-extrabold tracking-tight text-white mb-6 leading-[1.1] max-w-4xl">
          Ketampanan Maksimal, <br />
          <span className="bg-linear-to-r from-amber-400 via-amber-200 to-yellow-500 bg-clip-text text-transparent">
            Gaya Klasik & Modern
          </span>
        </h1>

        <p className="text-slate-400 text-base md:text-lg max-w-2xl mb-10 leading-relaxed font-light">
          Wujudkan potongan rambut idaman Anda bersama stylist profesional kami. Kombinasi teknik potong rambut tradisional dengan tren gaya modern yang presisi di lingkungan yang mewah dan nyaman.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center px-4">
          <Button
            variant="gold"
            size="lg"
            className="px-8 shadow-amber-500/15"
            onClick={() => setIsBookModalOpen(true)}
          >
            <Calendar className="w-5 h-5 mr-2" /> Booking Online
          </Button>
          <a href="#services" className="w-full sm:w-auto">
            <Button
              variant="secondary"
              size="lg"
              className="w-full px-8 bg-slate-900/50 hover:bg-slate-800/80"
            >
              Lihat Layanan & Harga
            </Button>
          </a>
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mt-24 pt-10 border-t border-slate-900">
          <div className="flex flex-col items-center text-center p-4">
            <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-center text-amber-400 mb-4 glow-amber">
              <Award className="w-6 h-6" />
            </div>
            <h3 className="font-heading text-lg font-bold text-slate-100 mb-1">Barber Bersertifikasi</h3>
            <p className="text-slate-400 text-xs leading-relaxed max-w-[240px]">
              Dikerjakan oleh barber professional dengan lisensi internasional & jam terbang tinggi.
            </p>
          </div>

          <div className="flex flex-col items-center text-center p-4">
            <div className="w-12 h-12 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-400 mb-4 glow-indigo">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="font-heading text-lg font-bold text-slate-100 mb-1">Alat Higienis & Premium</h3>
            <p className="text-slate-400 text-xs leading-relaxed max-w-[240px]">
              Setiap pisau cukur & alat disterilisasi sebelum dipakai. Produk rambut premium bebas sulfat.
            </p>
          </div>

          <div className="flex flex-col items-center text-center p-4">
            <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-center text-amber-400 mb-4 glow-amber">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="font-heading text-lg font-bold text-slate-100 mb-1">Tepat Waktu & Mudah</h3>
            <p className="text-slate-400 text-xs leading-relaxed max-w-[240px]">
              Penjadwalan digital presisi tinggi. Datang tepat waktu, langsung dicukur tanpa antre lama.
            </p>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-24 px-6 bg-[#090e1b]/40 relative border-t border-slate-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-xs font-bold text-amber-500 uppercase tracking-widest">Menu Layanan</span>
            <h2 className="font-heading text-3xl md:text-4xl font-extrabold text-white mt-2">
              Layanan Utama & Paket Premium
            </h2>
            <p className="text-slate-400 text-sm max-w-xl mx-auto mt-3">
              Pilih dari berbagai pilihan perawatan rambut dan wajah eksklusif yang dirancang khusus untuk kenyamanan dan penampilan prima pria modern.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map(service => (
              <Card key={service.id} className="hover:translate-y-[-4px] flex flex-col h-full">
                <CardContent className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="px-2.5 py-1 bg-amber-500/10 text-amber-400 text-[10px] font-bold uppercase tracking-wider rounded border border-amber-500/20">
                        {service.category}
                      </span>
                      <span className="flex items-center text-slate-400 text-xs font-semibold">
                        <Clock className="w-3.5 h-3.5 mr-1 text-amber-500" /> {service.duration} Menit
                      </span>
                    </div>

                    <h3 className="font-heading text-xl font-bold text-white mb-2">{service.name}</h3>
                    <p className="text-slate-400 text-xs leading-relaxed mb-6 font-light">{service.description}</p>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-slate-900/60 mt-auto">
                    <span className="text-lg font-extrabold text-amber-400 font-heading">
                      {formatPrice(service.price)}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-amber-600/30 text-amber-500 hover:bg-amber-600 hover:text-slate-950 font-semibold"
                      onClick={() => {
                        setFormData(prev => ({ ...prev, serviceId: service.id }));
                        setIsBookModalOpen(true);
                      }}
                    >
                      Booking
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Barbers Section */}
      <section id="barbers" className="py-24 px-6 relative border-t border-slate-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-xs font-bold text-amber-500 uppercase tracking-widest">Master Stylists</span>
            <h2 className="font-heading text-3xl md:text-4xl font-extrabold text-white mt-2">
              Barber Artisans Profesional
            </h2>
            <p className="text-slate-400 text-sm max-w-xl mx-auto mt-3">
              Tim stylist andalan kami memiliki keahlian tajam untuk menyesuaikan potongan rambut dengan kontur wajah dan gaya hidup Anda.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {barbers.map(barber => (
              <Card key={barber.id} className="text-center group overflow-hidden">
                <div className="relative h-64 overflow-hidden bg-slate-950">
                  <img
                    src={barber.avatar}
                    alt={barber.name}
                    className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-500 opacity-90"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-slate-950 via-transparent to-transparent" />
                </div>
                <CardContent className="p-6 relative z-10 bg-slate-900/60 backdrop-blur-md border-t border-slate-800/40">
                  <h3 className="font-heading text-lg font-bold text-white mb-0.5">{barber.name}</h3>
                  <p className="text-amber-500 text-xs font-semibold mb-3">{barber.role}</p>

                  <div className="flex items-center justify-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                    ))}
                    <span className="text-slate-300 text-xs font-bold ml-1.5">{barber.rating}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-24 px-6 bg-[#090e1b]/40 relative border-t border-slate-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-xs font-bold text-amber-500 uppercase tracking-widest">Testimoni Pelanggan</span>
            <h2 className="font-heading text-3xl md:text-4xl font-extrabold text-white mt-2">
              Apa Kata Klien Setia Kami
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="bg-slate-900/40">
              <CardContent className="p-6">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />)}
                </div>
                <p className="text-slate-300 text-xs leading-relaxed italic mb-6">
                  "Barbershop terbaik di kota ini! Fadenya halus sekali, pengerjaannya sangat teliti oleh Mas Bagus. Sistem booking online juga rapih, saya datang langsung dilayani tanpa menunggu."
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center font-bold text-xs text-amber-400">
                    RP
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Reza Pratama</h4>
                    <p className="text-[10px] text-slate-500">Klien sejak 2024</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/40">
              <CardContent className="p-6">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />)}
                </div>
                <p className="text-slate-300 text-xs leading-relaxed italic mb-6">
                  "Saya selalu ambil Executive Package. Perawatannya lengkap, pijat kepalanya enak sekali dan keramasnya bersih. Sangat worthed dengan harga 150 ribu!"
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center font-bold text-xs text-amber-400">
                    DK
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Danny Kusuma</h4>
                    <p className="text-[10px] text-slate-500">Klien sejak 2025</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/40">
              <CardContent className="p-6">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />)}
                </div>
                <p className="text-slate-300 text-xs leading-relaxed italic mb-6">
                  "Mencoba cukur jenggot menggunakan handuk hangat ala Royal Beard Shave di sini. Sensasinya luar biasa rileks, razor-nya sangat bersih & steril. Highly recommended!"
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center font-bold text-xs text-amber-400">
                    AH
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Arief Hakim</h4>
                    <p className="text-[10px] text-slate-500">Klien Baru</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#05070e] border-t border-slate-900 px-6 py-12 text-slate-500 text-xs relative z-10">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-8 text-left">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 bg-amber-600 rounded-md">
                <Scissors className="w-4 h-4 text-slate-950" />
              </div>
              <span className="font-heading text-sm font-extrabold text-white tracking-wider uppercase">
                THE GENTLEMEN
              </span>
            </div>
            <p className="text-slate-400 max-w-sm mb-4 leading-relaxed">
              Barbershop premium untuk pria berkelas. Kami berkomitmen memberikan layanan potong rambut dengan tingkat presisi dan pelayanan bintang lima.
            </p>
            <div className="flex items-center gap-1.5 text-slate-400 mb-2">
              <MapPin className="w-4 h-4 text-amber-500 shrink-0" />
              <span>Jl. Jenderal Sudirman No. 123, Kebayoran Baru, Jakarta Selatan</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-400">
              <Phone className="w-4 h-4 text-amber-500 shrink-0" />
              <span>+62 812-3456-7890</span>
            </div>
          </div>

          <div>
            <h4 className="text-slate-200 font-bold uppercase tracking-wider mb-4">Navigasi</h4>
            <ul className="space-y-2 font-medium">
              <li><a href="#services" className="hover:text-amber-400 transition-colors">Layanan & Harga</a></li>
              <li><a href="#barbers" className="hover:text-amber-400 transition-colors">Barber Stylists</a></li>
              <li><a href="#testimonials" className="hover:text-amber-400 transition-colors">Ulasan Pelanggan</a></li>
              <li><span onClick={() => onNavigate('login')} className="hover:text-amber-400 transition-colors cursor-pointer">Admin Login Portal</span></li>
            </ul>
          </div>

          <div>
            <h4 className="text-slate-200 font-bold uppercase tracking-wider mb-4">Jam Operasional</h4>
            <ul className="space-y-2 font-medium text-slate-400">
              <li className="flex justify-between"><span>Senin - Jumat:</span> <span className="text-slate-300 font-semibold">09:00 - 21:00</span></li>
              <li className="flex justify-between"><span>Sabtu - Minggu:</span> <span className="text-slate-300 font-semibold">08:00 - 22:00</span></li>
              <li className="text-amber-500/80 font-bold mt-2 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> Menerima Booking Online 24 Jam
              </li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-8 border-t border-slate-900 flex flex-col md:flex-row items-center justify-between gap-4">
          <p>© 2026 The Gentlemen Barbershop POS Scheduler. All Rights Reserved.</p>
          <div className="flex items-center gap-6">
            <span onClick={() => onNavigate('login')} className="hover:text-amber-500 cursor-pointer transition-colors font-semibold">
              Admin Access
            </span>
          </div>
        </div>
      </footer>

      {/* Online Booking Modal */}
      <Dialog
        isOpen={isBookModalOpen}
        onClose={() => setIsBookModalOpen(false)}
        title="Form Booking Online"
        description="Silakan isi data Anda untuk menjadwalkan kunjungan perawatan barbershop Anda."
        size="md"
      >
        <form onSubmit={handleBookingSubmit} className="space-y-5">
          <Input
            label="Nama Lengkap Pelanggan"
            name="customerName"
            value={formData.customerName}
            onChange={handleInputChange}
            error={formErrors.customerName}
            placeholder="Masukkan nama Anda..."
            required
          />

          <Input
            label="Nomor Telepon WhatsApp"
            name="customerPhone"
            value={formData.customerPhone}
            onChange={handleInputChange}
            error={formErrors.customerPhone}
            placeholder="Contoh: 0812XXXXXXXX"
            type="tel"
            required
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Pilih Layanan Perawatan"
              name="serviceId"
              value={formData.serviceId}
              onChange={handleInputChange}
            >
              {services.map(s => (
                <option key={s.id} value={s.id} className="bg-slate-900 text-slate-100">
                  {s.name} ({formatPrice(s.price)})
                </option>
              ))}
            </Select>

            <Select
              label="Pilih Barber Handalan"
              name="barberId"
              value={formData.barberId}
              onChange={handleInputChange}
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
              label="Tanggal Kunjungan"
              name="bookingDate"
              type="date"
              value={formData.bookingDate}
              onChange={handleInputChange}
              error={formErrors.bookingDate}
              min={new Date().toISOString().split('T')[0]}
              required
            />

            <Select
              label="Jam Kunjungan"
              name="bookingTime"
              value={formData.bookingTime}
              onChange={handleInputChange}
            >
              <option value="09:00" className="bg-slate-900 text-slate-100">09:00 WIB</option>
              <option value="10:00" className="bg-slate-900 text-slate-100">10:00 WIB</option>
              <option value="10:30" className="bg-slate-900 text-slate-100">10:30 WIB</option>
              <option value="11:00" className="bg-slate-900 text-slate-100">11:00 WIB</option>
              <option value="12:00" className="bg-slate-900 text-slate-100">12:00 WIB (Istirahat)</option>
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
            label="Catatan Tambahan (Opsional)"
            name="notes"
            value={formData.notes}
            onChange={handleInputChange}
            placeholder="Contoh: Potongan rambut undercut, keramas dingin, atau request khusus lainnya..."
          />

          <div className="flex gap-3 justify-end pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsBookModalOpen(false)}
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="gold"
              className="px-6"
            >
              Konfirmasi Booking
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
};
