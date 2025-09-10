import React, { useState, useEffect } from "react";
import {
  Filter,
  Clock,
  MapPin,
  Users,
  Star,
  ChevronDown,
  ChevronUp,
  X,
} from "lucide-react";
import { fetchTrips } from "@/lib/redux/tripSlice";
import { useDispatch, useSelector } from "react-redux";
import { Navigate } from "react-router";

// Mock data - Django API'dan gelecek veriler
const mockTrips = [
  {
    id: 1,
    company: "Metro Turizm",
    route: "Diyarbakır → İstanbul",
    departureTime: "10:30",
    arrivalTime: "18:45",
    duration: "8sa 15dk",
    price: 285,
    rating: 4.5,
    features: ["WiFi", "Klima", "2+1 Koltuk"],
    seatsAvailable: 25,
    totalSeats: 45,
    seatMap: generateSeatMap(45, [5, 12, 18, 23, 31, 38, 42]),
  },
  {
    id: 2,
    company: "Kamil Koç",
    route: "Diyarbakır → İstanbul",
    departureTime: "14:20",
    arrivalTime: "22:30",
    duration: "8sa 10dk",
    price: 320,
    rating: 4.2,
    features: ["WiFi", "Klima", "2+1 Koltuk", "TV"],
    seatsAvailable: 18,
    totalSeats: 45,
    seatMap: generateSeatMap(45, [3, 8, 14, 19, 25, 29, 35, 41]),
  },
  {
    id: 3,
    company: "Varan Turizm",
    route: "Diyarbakır → İstanbul",
    departureTime: "22:00",
    arrivalTime: "06:15",
    duration: "8sa 15dk",
    price: 350,
    rating: 4.7,
    features: ["WiFi", "Klima", "2+1 Koltuk", "İkram"],
    seatsAvailable: 32,
    totalSeats: 45,
    seatMap: generateSeatMap(45, [7, 15, 22, 28, 33]),
  },
  {
    id: 4,
    company: "DYR Seyehat",
    route: "Diyarbakır → İstanbul",
    departureTime: "22:00",
    arrivalTime: "06:15",
    duration: "8sa 15dk",
    price: 210,
    rating: 4.7,
    features: ["WiFi", "Klima", "2+1 Koltuk", "İkram"],
    seatsAvailable: 21,
    totalSeats: 44,
    seatMap: generateSeatMap(44, [7, 15, 22, 28, 33]),
  },
];

// Koltuk haritası oluşturucu
function generateSeatMap(totalSeats, occupiedSeats) {
  const seats = [];
  const seatsPerRow = 4; // 2+2 düzen
  const rows = Math.ceil(totalSeats / seatsPerRow);

  for (let row = 1; row <= rows; row++) {
    const rowSeats = [];
    for (let seat = 1; seat <= seatsPerRow; seat++) {
      const seatNumber = (row - 1) * seatsPerRow + seat;
      if (seatNumber <= totalSeats) {
        rowSeats.push({
          number: seatNumber,
          position: seat,
          isOccupied: occupiedSeats.includes(seatNumber),
          isSelected: false,
          gender: occupiedSeats.includes(seatNumber)
            ? Math.random() > 0.5
              ? "male"
              : "female"
            : null,
        });
      }
    }
    seats.push(rowSeats);
  }
  return seats;
}

// Redux benzeri state management (basit)
const useAppState = () => {
  
  const [state, setState] = useState({
    tripsMock: mockTrips,
    filters: {
      departureTime: "all",
      company: "all",
      priceRange: [200, 400],
      seatType: "all",
    },
    expandedTrip: null,
    selectedSeats: [],
    passengerInfo: {
      name: "",
      phone: "",
      email: "",
      gender: "male",
    },
  });

  const updateFilters = (newFilters) => {
    setState((prev) => ({
      ...prev,
      filters: { ...prev.filters, ...newFilters },
    }));
  };

  const expandTrip = (tripId) => {
    setState((prev) => ({
      ...prev,
      expandedTrip: prev.expandedTrip === tripId ? null : tripId,
      selectedSeats: [],
    }));
  };

  const selectSeat = (tripId, seatNumber) => {
    setState((prev) => {
      const trip = prev.tripsMock.find((t) => t.id === tripId);
      const updatedTrips = prev.tripsMock.map((t) => {
        if (t.id === tripId) {
          const updatedSeatMap = t.seatMap.map((row) =>
            row.map((seat) => {
              if (seat.number === seatNumber && !seat.isOccupied) {
                return { ...seat, isSelected: !seat.isSelected };
              }
              return seat;
            })
          );
          return { ...t, seatMap: updatedSeatMap };
        }
        return t;
      });

      const selectedSeats = [];
      const currentTrip = updatedTrips.find((t) => t.id === tripId);
      currentTrip.seatMap.forEach((row) => {
        row.forEach((seat) => {
          if (seat.isSelected) {
            selectedSeats.push(seat.number);
          }
        });
      });

      return {
        ...prev,
        tripsMock: updatedTrips,
        selectedSeats,
      };
    });
  };

  return {
    ...state,
    updateFilters,
    expandTrip,
    selectSeat,
  };
};

function BusBookingApp({ vehicleType }) {

  const dispatch = useDispatch();
  const {trips, error } = useSelector((state) => state.trip);

  useEffect(() => {
    dispatch(fetchTrips());
  },[dispatch])



  const {
    tripsMock,
    filters,
    expandedTrip,
    selectedSeats,
    updateFilters,
    expandTrip,
    selectSeat,
  } = useAppState();

  const vt = { bus: "Otobüs", plain: "Uçak", train: "Tren" };
  console.log("vt : ", vt[vehicleType]);

  // Filtrelenmiş seferler
  const filteredTrips = tripsMock.filter((trip) => {
    if (filters.company !== "all" && trip.company !== filters.company)
      return false;
    if (filters.departureTime !== "all") {
      const hour = parseInt(trip.departureTime.split(":")[0]);
      switch (filters.departureTime) {
        case "morning":
          if (hour < 6 || hour >= 12) return false;
          break;
        case "afternoon":
          if (hour < 12 || hour >= 18) return false;
          break;
        case "evening":
          if (hour < 18) return false;
          break;
      }
    }
    if (
      trip.price < filters.priceRange[0] ||
      trip.price > filters.priceRange[1]
    )
      return false;
    return true;
  });

  const SeatComponent = ({ seat, onSelect }) => {
    let seatClass =
      "w-8 h-8 rounded border-2 text-xs font-medium transition-all cursor-pointer ";

    if (seat.isOccupied) {
      seatClass +=
        seat.gender === "male"
          ? "bg-blue-200 border-blue-400 cursor-not-allowed"
          : "bg-pink-200 border-pink-400 cursor-not-allowed";
    } else if (seat.isSelected) {
      seatClass += "bg-green-500 border-green-600 text-white";
    } else {
      seatClass += "bg-gray-100 border-gray-300 hover:bg-gray-200";
    }

    return (
      <button
        className={seatClass}
        onClick={() => !seat.isOccupied && onSelect(seat.number)}
        disabled={seat.isOccupied}
      >
        {seat.number}
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-blue-600">
                {vt[vehicleType]} Otobüs
              </h1>
              <div className="flex items-center space-x-2 text-gray-600">
                <MapPin className="w-4 h-4" />
                <span className="font-medium">
                  Diyarbakır → İstanbul Avrupa (Tümü)
                </span>
                <span className="text-sm">10 Eylül 2025, Çar</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - Filters */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center space-x-2 mb-6">
              <Filter className="w-5 h-5 text-gray-600" />
              <h2 className="text-lg font-semibold">Filtreler</h2>
              <button
                className="text-blue-600 text-sm ml-auto"
                onClick={() =>
                  updateFilters({
                    departureTime: "all",
                    company: "all",
                    priceRange: [200, 400],
                    seatType: "all",
                  })
                }
              >
                Temizle
              </button>
            </div>

            {/* Departure Time Filter */}
            <div className="mb-6">
              <h3 className="font-medium mb-3 flex items-center">
                <Clock className="w-4 h-4 mr-2" />
                Kalkış Saati
              </h3>
              <div className="space-y-2">
                {[
                  { value: "all", label: "Tümü" },
                  { value: "morning", label: "Sabah (06:00-12:00)" },
                  { value: "afternoon", label: "Öğleden Sonra (12:00-18:00)" },
                  { value: "evening", label: "Akşam (18:00+)" },
                ].map((option) => (
                  <label
                    key={option.value}
                    className="flex items-center space-x-2"
                  >
                    <input
                      type="radio"
                      name="departureTime"
                      value={option.value}
                      checked={filters.departureTime === option.value}
                      onChange={(e) =>
                        updateFilters({ departureTime: e.target.value })
                      }
                      className="text-blue-600"
                    />
                    <span className="text-sm">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Company Filter */}
            <div className="mb-6">
              <h3 className="font-medium mb-3">Otobüs Firması</h3>
              <div className="space-y-2">
                {[
                  { value: "all", label: "Tümü" },
                  { value: "Metro Turizm", label: "Metro Turizm" },
                  { value: "Kamil Koç", label: "Kamil Koç" },
                  { value: "Varan Turizm", label: "Varan Turizm" },
                ].map((option) => (
                  <label
                    key={option.value}
                    className="flex items-center space-x-2"
                  >
                    <input
                      type="checkbox"
                      checked={filters.company === option.value}
                      onChange={() =>
                        updateFilters({
                          company:
                            filters.company === option.value
                              ? "all"
                              : option.value,
                        })
                      }
                      className="text-blue-600"
                    />
                    <span className="text-sm">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Price Range */}
            <div className="mb-6">
              <h3 className="font-medium mb-3">Bilet Fiyatı</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>₺{filters.priceRange[0]}</span>
                  <span>₺{filters.priceRange[1]}</span>
                </div>
                <input
                  type="range"
                  min="200"
                  max="500"
                  value={filters.priceRange[1]}
                  onChange={(e) =>
                    updateFilters({
                      priceRange: [
                        filters.priceRange[0],
                        parseInt(e.target.value),
                      ],
                    })
                  }
                  className="w-full"
                />
              </div>
            </div>

            {/* Seat Configuration */}
            <div className="mb-6">
              <h3 className="font-medium mb-3">Oturma Düzeni</h3>
              <div className="space-y-2">
                {[
                  { value: "all", label: "Tümü" },
                  { value: "2+1", label: "2+1 Koltuk" },
                  { value: "2+2", label: "2+2 Koltuk" },
                  { value: "business", label: "Business" },
                ].map((option) => (
                  <label
                    key={option.value}
                    className="flex items-center space-x-2"
                  >
                    <input
                      type="checkbox"
                      checked={filters.seatType === option.value}
                      onChange={() =>
                        updateFilters({
                          seatType:
                            filters.seatType === option.value
                              ? "all"
                              : option.value,
                        })
                      }
                      className="text-blue-600"
                    />
                    <span className="text-sm">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content - Trip List */}
          <div className="lg:col-span-3 space-y-4">
            <div className="flex justify-between items-center mb-4">
              <p className="text-gray-600">
                Gidiş:{" "}
                <span className="font-medium">
                  {filteredTrips.length} sefer
                </span>{" "}
                den 35 tanesi gösteriliyor.
              </p>
              <select className="px-3 py-2 border border-gray-300 rounded">
                <option>Kalkış erken → geç</option>
                <option>Fiyat düşük → yüksek</option>
                <option>Süre kısa → uzun</option>
              </select>
            </div>

            {filteredTrips.map((trip) => (
              <div
                key={trip.id}
                className="bg-white rounded-lg shadow-sm overflow-hidden"
              >
                {/* Trip Header */}
                <div
                  className="p-6 hover:bg-gray-50 cursor-pointer"
                  onClick={() => expandTrip(trip.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold">
                          {trip.departureTime}
                        </div>
                        <div className="text-sm text-gray-500">Diyarbakır</div>
                      </div>

                      <div className="flex flex-col items-center">
                        <div className="text-sm text-gray-500">
                          {trip.duration}
                        </div>
                        <div className="w-16 h-px bg-gray-300 my-1"></div>
                        <div className="text-xs text-gray-400">Direkt</div>
                      </div>

                      <div className="text-center">
                        <div className="text-2xl font-bold">
                          {trip.arrivalTime}
                        </div>
                        <div className="text-sm text-gray-500">İstanbul</div>
                      </div>

                      <div className="ml-6">
                        <div className="font-bold text-lg">{trip.company}</div>
                        <div className="flex items-center space-x-2">
                          <Star className="w-4 h-4 text-yellow-400 fill-current" />
                          <span className="text-sm">{trip.rating}</span>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {trip.features.map((feature) => (
                            <span
                              key={feature}
                              className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded"
                            >
                              {feature}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-600">
                        ₺{trip.price}
                      </div>
                      <div className="text-sm text-gray-500">
                        {trip.seatsAvailable} koltuk kaldı
                      </div>
                      <div className="mt-2">
                        {expandedTrip === trip.id ? (
                          <ChevronUp className="w-5 h-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expanded Seat Selection */}
                {expandedTrip === trip.id && (
                  <div className="border-t bg-gray-50 p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Seat Map */}
                      <div className="lg:col-span-2">
                        <h3 className="font-semibold mb-4">
                          Lütfen koltuğunuzu seçin
                        </h3>

                        {/* Seat Legend */}
                        <div className="flex space-x-6 mb-4 text-sm">
                          <div className="flex items-center space-x-2">
                            <div className="w-4 h-4 bg-blue-200 border border-blue-400 rounded"></div>
                            <span>Erkek - Dolu</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="w-4 h-4 bg-pink-200 border border-pink-400 rounded"></div>
                            <span>Kadın - Dolu</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="w-4 h-4 bg-gray-100 border border-gray-300 rounded"></div>
                            <span>Boş Koltuk</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="w-4 h-4 bg-green-500 border border-green-600 rounded"></div>
                            <span>Seçili Koltuk</span>
                          </div>
                        </div>

                        {/* Bus Layout */}
                        <div className="bg-white p-4 rounded border">
                          <div className="text-center mb-4 text-sm text-gray-500">
                            Şoför
                          </div>
                          <div className="space-y-2">
                            {trip.seatMap.map((row, rowIndex) => (
                              <div
                                key={rowIndex}
                                className="flex justify-center space-x-1"
                              >
                                <div className="flex space-x-1">
                                  {row[0] && (
                                    <SeatComponent
                                      seat={row[0]}
                                      onSelect={(seatNum) =>
                                        selectSeat(trip.id, seatNum)
                                      }
                                    />
                                  )}
                                  {row[1] && (
                                    <SeatComponent
                                      seat={row[1]}
                                      onSelect={(seatNum) =>
                                        selectSeat(trip.id, seatNum)
                                      }
                                    />
                                  )}
                                </div>
                                <div className="w-6"></div>
                                <div className="flex space-x-1">
                                  {row[2] && (
                                    <SeatComponent
                                      seat={row[2]}
                                      onSelect={(seatNum) =>
                                        selectSeat(trip.id, seatNum)
                                      }
                                    />
                                  )}
                                  {row[3] && (
                                    <SeatComponent
                                      seat={row[3]}
                                      onSelect={(seatNum) =>
                                        selectSeat(trip.id, seatNum)
                                      }
                                    />
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Booking Summary */}
                      <div className="space-y-4">
                        <div className="bg-white p-4 rounded border">
                          <h4 className="font-semibold mb-2">
                            Seçilen Koltuklar
                          </h4>
                          {selectedSeats.length === 0 ? (
                            <p className="text-gray-500 text-sm">
                              Henüz koltuk seçilmedi
                            </p>
                          ) : (
                            <div className="space-y-2">
                              {selectedSeats.map((seatNum) => (
                                <div
                                  key={seatNum}
                                  className="flex justify-between items-center"
                                >
                                  <span className="text-sm">
                                    Koltuk {seatNum}
                                  </span>
                                  <span className="text-sm font-medium">
                                    ₺{trip.price}
                                  </span>
                                </div>
                              ))}
                              <div className="border-t pt-2 flex justify-between font-semibold">
                                <span>Toplam</span>
                                <span>
                                  ₺{trip.price * selectedSeats.length}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>

                        {selectedSeats.length > 0 && (
                          <button className="w-full bg-green-600 text-white py-3 rounded font-semibold hover:bg-green-700">
                            Onayla ve Devam Et
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default BusBookingApp;
