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
import {
  expandTrip,
  fetchTrips,
  selectFilteredTrips,
  selectSeat,
  updateFilters,
} from "@/lib/redux/tripSlice";
import { useDispatch, useSelector } from "react-redux";
import { Navigate } from "react-router";
import { TripSearchForm } from "./TripSearch";

import { format, startOfDay } from "date-fns";
import { tr } from "date-fns/locale";

function BusBookingApp({ vehicleType }) {
  const dispatch = useDispatch();

  const filteredTrips = useSelector(selectFilteredTrips);
  const expandedTrip = useSelector((state) => state.trip.expandedTrip);
  const selectedSeats = useSelector((state) => state.trip.selectedSeats);
  const trips = useSelector((state) => state.trip.trips);
  const findTrip = useSelector((state) => state.trip.findTrip);
  const filters = useSelector((state) => state.trip.filters);

  useEffect(() => {
    let _ = {};

    console.log("booking find:", findTrip);
    dispatch(fetchTrips(findTrip));
  }, [dispatch]);

  console.log("trips  ", trips);

  const vt = { bus: "Otobüs", plain: "Uçak", train: "Tren" };
  console.log("vt : ", vt[vehicleType]);

  const SeatComponent = ({ seat, onSelect }) => {
    let seatClass =
      "w-8 h-8 rounded border-2 text-xs font-medium transition-all cursor-pointer ";

    if (seat.is_reserved) {
      seatClass += "bg-blue-200 border-blue-400 cursor-not-allowed";
    } else if (seat.is_selected) {
      seatClass += "bg-green-500 border-green-600 text-white";
    } else {
      seatClass += "bg-gray-100 border-gray-300 hover:bg-gray-200";
    }

    return (
      <button
        className={seatClass}
        onClick={() => !seat.is_reserved && onSelect(seat.id)}
        disabled={seat.is_reserved}
      >
        {seat.seat_number}
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
                {vt[vehicleType]}
              </h1>
              <div className="flex items-center space-x-2 text-gray-600">
                <MapPin className="w-4 h-4" />
                <span className="font-medium">
                  {findTrip.origin} → {findTrip.destination}
                </span>
                <span className="text-sm"> {format(findTrip.date, "PPP", { locale: tr })}</span>
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
                  dispatch(
                    updateFilters({
                      departureTime: "all",
                      priceRange: [0, 500],
                    })
                  )
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
                        dispatch(
                          updateFilters({ departureTime: e.target.value })
                        )
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
                  min="0"
                  max="5000"
                  value={filters.priceRange[1]}
                  onChange={(e) =>
                    dispatch(
                      updateFilters({
                        priceRange: [
                          filters.priceRange[0],
                          parseInt(e.target.value),
                        ],
                      })
                    )
                  }
                  className="w-full"
                />
              </div>
            </div>

            {/* Company Filter */}
            <div className="mb-6">
              <h3 className="font-medium mb-3">Otobüs Firması</h3>
              <div className="space-y-2">
                {[
                  { value: "all", label: "Tümü" },
                  { value: "dyr", label: "DYR Seyehat" },
                ].map((option) => (
                  <label
                    key={option.value}
                    className="flex items-center space-x-2"
                  >
                    <input
                      type="checkbox"
                      checked={filters.company === option.value}
                      onChange={() =>
                        dispatch(
                          updateFilters({
                            company:
                              filters.company === option.value
                                ? "all"
                                : option.value,
                          })
                        )
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
            {filteredTrips.map((trip) => (
              <div
                key={trip.id}
                className="bg-white rounded-lg shadow-sm overflow-hidden"
              >
                {/* Trip Header */}
                <div
                  className="p-6 hover:bg-gray-50 cursor-pointer"
                  onClick={() => dispatch(expandTrip(trip.id))}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold">
                          {format(trip.departure_time, "HH:mm", { locale: tr })}
                        </div>
                        <div className="text-sm text-gray-500">
                          {trip.route.origin}
                        </div>
                      </div>

                      <div className="flex flex-col items-center">
                        <div className="text-sm text-gray-500">
                          {trip.route.estimated_duration.slice(0, 5)}
                        </div>
                        <div className="w-16 h-px bg-gray-300 my-1"></div>
                        <div className="text-xs text-gray-400">Direkt</div>
                      </div>

                      <div className="text-center">
                        <div className="text-2xl font-bold">
                          {format(trip.arrival_time, "H:mm", { locale: tr })}
                        </div>
                        <div className="text-sm text-gray-500">
                          {trip.route.destination}
                        </div>
                      </div>

                      <div className="ml-6">
                        <div className="font-bold text-lg">
                          {trip.company.name}
                        </div>

                        <div className="flex flex-wrap gap-1 mt-1">
                          {["İkram", "WiFi", "Klima", "2+2 Koltuk"].map(
                            (feature) => (
                              <span
                                key={feature}
                                className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded"
                              >
                                {feature}
                              </span>
                            )
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-600">
                        ₺{trip.price}
                      </div>
                      <div className="mt-2">
                        {expandedTrip === trip.id ? (
                          <ChevronUp className="w-5 h-5 text-gray-700" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-700" />
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
                            <span>Dolu</span>
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
                            {(() => {
                              const rows = [];
                              const seats = trip?.seats || [];

                              for (let i = 0; i < seats.length; i += 4) {
                                const group = seats.slice(i, i + 4); // 4 koltuk al

                                rows.push(
                                  <div
                                    key={i}
                                    className="flex justify-center space-x-6 mb-4"
                                  >
                                    {/* Sol taraf */}
                                    <div className="flex space-x-1">
                                      {group.slice(0, 2).map((seat) => (
                                        <SeatComponent
                                          key={seat.seat_number}
                                          seat={seat}
                                          onSelect={(seatNum) =>
                                            dispatch(
                                              selectSeat({
                                                tripId: trip.id,
                                                seatNumber: seatNum,
                                              })
                                            )
                                          }
                                        />
                                      ))}
                                    </div>
                                    <div className="w-2"></div>
                                    {/* koridor boşluğu */}
                                    {/* Sağ taraf */}
                                    <div className="flex space-x-1">
                                      {group.slice(2).map((seat) => (
                                        <SeatComponent
                                          key={seat.seat_number}
                                          seat={seat}
                                          onSelect={(seatNum) =>
                                            dispatch(
                                              selectSeat({
                                                tripId: trip.id,
                                                seatNumber: seatNum,
                                              })
                                            )
                                          }
                                        />
                                      ))}
                                    </div>
                                  </div>
                                );
                              }

                              return rows;
                            })()}
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
                                <span>₺{trip.price}</span>
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
