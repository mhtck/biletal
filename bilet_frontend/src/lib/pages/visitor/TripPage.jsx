import React, { useState, useEffect, useRef } from 'react';
import { AlertCircle, Armchair, CheckCircle, Clock, CreditCard, User, Phone, Mail } from 'lucide-react';

const SeatSelectionApp = () => {
  const [tripData, setTripData] = useState(null);
  const [seats, setSeats] = useState([]);
  const [selectedSeat, setSelectedSeat] = useState(null);
  const [userSession] = useState(() => Math.random().toString(36).substring(2));
  const [step, setStep] = useState('seat-selection'); // seat-selection, passenger-info, payment, confirmation
  const [passengerInfo, setPassengerInfo] = useState({
    name: '',
    phone: '',
    email: ''
  });
  const [paymentInfo, setPaymentInfo] = useState({
    method: 'credit_card',
    card_number: '',
    card_name: '',
    expiry: '',
    cvv: ''
  });
  const [reservation, setReservation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [timeLeft, setTimeLeft] = useState(null);
  
  const websocket = useRef(null);
  const timerRef = useRef(null);

  // Mock trip data - gerçek uygulamada API'den gelecek
  useEffect(() => {
    setTripData({
      id: 1,
      route: { origin: 'İstanbul', destination: 'Ankara' },
      departure_time: '2024-12-15T09:00:00Z',
      price: '150.00'
    });
    
    // Initialize seats - gerçek uygulamada API'den gelecek
    initializeSeats();
  }, []);

  // WebSocket bağlantısı
  useEffect(() => {
    if (tripData) {
      connectWebSocket();
    }
    
    return () => {
      if (websocket.current) {
        websocket.current.close();
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [tripData]);

  const initializeSeats = () => {
    const mockSeats = [];
    for (let row = 1; row <= 12; row++) {
      for (let letter of ['A', 'B', 'C', 'D']) {
        mockSeats.push({
          id: `${row}${letter}`,
          seat_number: `${row}${letter}`,
          row_number: row,
          seat_letter: letter,
          is_window: letter === 'A' || letter === 'D',
          status: Math.random() > 0.8 ? 'reserved' : 'available'
        });
      }
    }
    setSeats(mockSeats);
  };

  const connectWebSocket = () => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/trip/${tripData.id}/`;
    
    websocket.current = new WebSocket(wsUrl);
    
    websocket.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'seat_status_update') {
        setSeats(data.seats);
      } else if (data.type === 'initial_seats') {
        setSeats(data.seats);
      }
    };
    
    websocket.current.onerror = (error) => {
      console.error('WebSocket error:', error);
      setError('Bağlantı hatası. Sayfa yenilenecek...');
      setTimeout(() => window.location.reload(), 3000);
    };
  };

  const handleSeatSelect = async (seat) => {
    if (seat.status !== 'available') return;
    
    setLoading(true);
    setError('');
    
    try {
      // Önceki seçimi temizle
      if (selectedSeat) {
        await releaseSeat(selectedSeat);
      }

      const response = await fetch('/api/select-seat/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trip_id: tripData.id,
          seat_id: seat.id,
          user_session: userSession
        })
      });

      const result = await response.json();
      
      if (result.success) {
        setSelectedSeat(seat);
        startTimer(300); // 5 dakika
      } else {
        setError(result.message || 'Koltuk seçilemedi');
      }
    } catch (err) {
      setError('Bağlantı hatası');
    } finally {
      setLoading(false);
    }
  };

  const releaseSeat = async (seat) => {
    try {
      await fetch('/api/release-seat/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trip_id: tripData.id,
          seat_id: seat.id,
          user_session: userSession
        })
      });
    } catch (err) {
      console.error('Seat release error:', err);
    }
  };

  const startTimer = (seconds) => {
    setTimeLeft(seconds);
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          setSelectedSeat(null);
          setStep('seat-selection');
          setError('Süre doldu. Lütfen tekrar koltuk seçin.');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleReservationCreate = async () => {
    if (!passengerInfo.name || !passengerInfo.phone || !passengerInfo.email) {
      setError('Lütfen tüm yolcu bilgilerini doldurun');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/create-reservation/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trip_id: tripData.id,
          seat_id: selectedSeat.id,
          user_session: userSession,
          passenger: passengerInfo
        })
      });

      const result = await response.json();
      
      if (result.success) {
        setReservation(result.reservation);
        setStep('payment');
        startTimer(900); // 15 dakika ödeme için
      } else {
        setError(result.error || 'Rezervasyon oluşturulamadı');
      }
    } catch (err) {
      setError('Bağlantı hatası');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!paymentInfo.card_number || !paymentInfo.card_name || 
        !paymentInfo.expiry || !paymentInfo.cvv) {
      setError('Lütfen tüm ödeme bilgilerini doldurun');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/process-payment/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reservation_id: reservation.id,
          payment: paymentInfo
        })
      });

      const result = await response.json();
      
      if (result.success) {
        setStep('confirmation');
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      } else {
        setError(result.error || 'Ödeme işlenemedi');
      }
    } catch (err) {
      setError('Bağlantı hatası');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getSeatColor = (seat) => {
    if (seat.status === 'reserved') return 'bg-red-500';
    if (seat.status === 'temp_locked') return 'bg-yellow-500';
    if (selectedSeat?.id === seat.id) return 'bg-green-500';
    return 'bg-blue-500 hover:bg-blue-600';
  };

  if (!tripData) {
    return <div className="flex justify-center items-center h-64">Yükleniyor...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto p-6 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-blue-600 text-white p-6">
          <h1 className="text-2xl font-bold">
            {tripData.route.origin} → {tripData.route.destination}
          </h1>
          <p className="text-blue-100">
            {new Date(tripData.departure_time).toLocaleString('tr-TR')}
          </p>
          {timeLeft && (
            <div className="mt-2 flex items-center gap-2 text-yellow-200">
              <Clock size={16} />
              <span>Kalan süre: {formatTime(timeLeft)}</span>
            </div>
          )}
        </div>

        {/* Progress Steps */}
        <div className="bg-gray-100 p-4">
          <div className="flex justify-center space-x-8">
            {[
              { id: 'seat-selection', label: 'Koltuk Seçimi', icon: Armchair },
              { id: 'passenger-info', label: 'Yolcu Bilgileri', icon: User },
              { id: 'payment', label: 'Ödeme', icon: CreditCard },
              { id: 'confirmation', label: 'Onay', icon: CheckCircle }
            ].map((stepItem, index) => {
              const Icon = stepItem.icon;
              const isActive = step === stepItem.id;
              const isCompleted = ['seat-selection', 'passenger-info', 'payment', 'confirmation']
                .indexOf(step) > index;
              
              return (
                <div key={stepItem.id} className="flex items-center">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                    isActive ? 'bg-blue-600 text-white' : 
                    isCompleted ? 'bg-green-600 text-white' : 'bg-gray-300'
                  }`}>
                    <Icon size={16} />
                  </div>
                  <span className={`ml-2 text-sm ${isActive ? 'font-semibold' : ''}`}>
                    {stepItem.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 m-4 rounded flex items-center">
            <AlertCircle className="mr-2" size={16} />
            {error}
          </div>
        )}

        {/* Content */}
        <div className="p-6">
          {step === 'seat-selection' && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Koltuk Seçin</h2>
              
              {/* Legend */}
              <div className="flex gap-6 mb-6 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-blue-500 rounded"></div>
                  <span>Müsait</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-500 rounded"></div>
                  <span>Seçili</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                  <span>Geçici Rezerve</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-500 rounded"></div>
                  <span>Dolu</span>
                </div>
              </div>

              {/* Seat Map */}
              <div className="bg-gray-100 p-6 rounded-lg">
                <div className="text-center mb-4 text-gray-600">Şoför</div>
                <div className="grid grid-cols-4 gap-2 max-w-sm mx-auto">
                  {seats.map((seat) => (
                    <button
                      key={seat.id}
                      onClick={() => handleSeatSelect(seat)}
                      disabled={seat.status === 'reserved' || loading}
                      className={`
                        relative p-3 w-18 rounded-lg text-white text-sm font-medium
                        transition-colors duration-200 disabled:cursor-not-allowed
                        ${getSeatColor(seat)}
                      `}
                    >
                      {seat.seat_number}
                      {seat.is_window && seat.seat_letter == "A" &&(
                        
                        <div className="absolute -left-1 top-1/2 transform -translate-y-1/2 w-1 h-5 bg-blue-300 rounded-r"></div>
                      )}
                      {seat.is_window && seat.seat_letter == "D" &&(
                        
                        <div className="absolute -right-1 top-1/2 transform -translate-y-1/2 w-1 h-5 bg-blue-300 rounded-r"></div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Selected Seat Info */}
              {selectedSeat && (
                <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="font-semibold text-green-800 mb-2">Seçili Koltuk</h3>
                  <p className="text-green-700">
                    Koltuk {selectedSeat.seat_number} 
                    {selectedSeat.is_window ? ' (Pencere)' : ' (Koridor)'}
                  </p>
                  <p className="text-green-700">Fiyat: ₺{tripData.price}</p>
                  <button
                    onClick={() => setStep('passenger-info')}
                    className="mt-3 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
                  >
                    Devam Et
                  </button>
                </div>
              )}
            </div>
          )}

          {step === 'passenger-info' && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Yolcu Bilgileri</h2>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-blue-800">
                  Seçili Koltuk: {selectedSeat?.seat_number} - ₺{tripData.price}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <User className="inline mr-1" size={16} />
                    Ad Soyad *
                  </label>
                  <input
                    type="text"
                    value={passengerInfo.name}
                    onChange={(e) => setPassengerInfo({...passengerInfo, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Adınız ve soyadınız"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Phone className="inline mr-1" size={16} />
                    Telefon *
                  </label>
                  <input
                    type="tel"
                    value={passengerInfo.phone}
                    onChange={(e) => setPassengerInfo({...passengerInfo, phone: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0532 123 45 67"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Mail className="inline mr-1" size={16} />
                    E-posta *
                  </label>
                  <input
                    type="email"
                    value={passengerInfo.email}
                    onChange={(e) => setPassengerInfo({...passengerInfo, email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="ornek@email.com"
                  />
                </div>
              </div>

              <div className="flex gap-4 mt-6">
                <button
                  onClick={() => setStep('seat-selection')}
                  className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                >
                  Geri
                </button>
                <button
                  onClick={handleReservationCreate}
                  disabled={loading}
                  className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'İşleniyor...' : 'Rezervasyon Oluştur'}
                </button>
              </div>
            </div>
          )}

          {step === 'payment' && reservation && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Ödeme Bilgileri</h2>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <p className="text-yellow-800">
                  Rezervasyon No: {reservation.id}
                </p>
                <p className="text-yellow-800">
                  Yolcu: {passengerInfo.name} - Koltuk: {selectedSeat?.seat_number}
                </p>
                <p className="text-yellow-800 font-semibold">
                  Toplam: ₺{reservation.total_price}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ödeme Yöntemi
                  </label>
                  <select
                    value={paymentInfo.method}
                    onChange={(e) => setPaymentInfo({...paymentInfo, method: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="credit_card">Kredi Kartı</option>
                    <option value="debit_card">Banka Kartı</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Kart Numarası *
                  </label>
                  <input
                    type="text"
                    value={paymentInfo.card_number}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\s/g, '').replace(/(.{4})/g, '$1 ').trim();
                      if (value.replace(/\s/g, '').length <= 16) {
                        setPaymentInfo({...paymentInfo, card_number: value});
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="1234 5678 9012 3456"
                    maxLength="19"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Kart Üzerindeki İsim *
                  </label>
                  <input
                    type="text"
                    value={paymentInfo.card_name}
                    onChange={(e) => setPaymentInfo({...paymentInfo, card_name: e.target.value.toUpperCase()})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="AD SOYAD"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Son Kullanma Tarihi *
                  </label>
                  <input
                    type="text"
                    value={paymentInfo.expiry}
                    onChange={(e) => {
                      let value = e.target.value.replace(/\D/g, '');
                      if (value.length >= 2) {
                        value = value.substring(0, 2) + '/' + value.substring(2, 4);
                      }
                      if (value.length <= 5) {
                        setPaymentInfo({...paymentInfo, expiry: value});
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="MM/YY"
                    maxLength="5"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    CVV *
                  </label>
                  <input
                    type="text"
                    value={paymentInfo.cvv}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '');
                      if (value.length <= 3) {
                        setPaymentInfo({...paymentInfo, cvv: value});
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="123"
                    maxLength="3"
                  />
                </div>
              </div>

              <div className="flex gap-4 mt-6">
                <button
                  onClick={() => setStep('passenger-info')}
                  className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                >
                  Geri
                </button>
                <button
                  onClick={handlePayment}
                  disabled={loading}
                  className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Ödeme İşleniyor...' : 'Ödemeyi Tamamla'}
                </button>
              </div>
            </div>
          )}

          {step === 'confirmation' && reservation && (
            <div className="text-center">
              <div className="mb-6">
                <CheckCircle className="mx-auto text-green-600 mb-4" size={64} />
                <h2 className="text-2xl font-bold text-green-800 mb-2">
                  Ödemeniz Başarıyla Tamamlandı!
                </h2>
                <p className="text-gray-600">
                  Bilet bilgileriniz e-posta adresinize gönderilecektir.
                </p>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-6 max-w-md mx-auto">
                <h3 className="font-semibold text-green-800 mb-4">Bilet Bilgileri</h3>
                <div className="text-left space-y-2 text-sm">
                  <p><strong>Rezervasyon No:</strong> {reservation.id}</p>
                  <p><strong>Yolcu:</strong> {passengerInfo.name}</p>
                  <p><strong>Güzergah:</strong> {tripData.route.origin} → {tripData.route.destination}</p>
                  <p><strong>Tarih:</strong> {new Date(tripData.departure_time).toLocaleString('tr-TR')}</p>
                  <p><strong>Koltuk:</strong> {selectedSeat?.seat_number}</p>
                  <p><strong>Fiyat:</strong> ₺{reservation.total_price}</p>
                </div>
              </div>

              <div className="mt-6">
                <button
                  onClick={() => window.location.href = '/'}
                  className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition-colors mr-4"
                >
                  Ana Sayfa
                </button>
                <button
                  onClick={() => window.print()}
                  className="border border-gray-300 px-6 py-2 rounded hover:bg-gray-50 transition-colors"
                >
                  Bilet Yazdır
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SeatSelectionApp;