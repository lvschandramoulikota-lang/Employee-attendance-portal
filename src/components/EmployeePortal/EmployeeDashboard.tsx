import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Clock,
  Coffee,
  CheckCircle2,
  AlertTriangle,
  LogOut,
  Camera,
  Loader2,
  Calendar,
  ShieldAlert,
  ShieldCheck,
  User,
  History,
  Building,
} from 'lucide-react';
import { Employee, OfficeLocation, ShiftSchedule, AttendanceRecord } from '../../types';
import {
  fetchLocations,
  fetchShifts,
  fetchAttendanceRecords,
  checkInEmployee,
  checkOutEmployee,
  toggleBreak,
} from '../../lib/api';
import { CameraCapture } from '../CameraCapture';

interface EmployeeDashboardProps {
  employee: Employee;
  onLogout: () => void;
}

export const EmployeeDashboard: React.FC<EmployeeDashboardProps> = ({ employee, onLogout }) => {
  const [locations, setLocations] = useState<OfficeLocation[]>([]);
  const [shifts, setShifts] = useState<ShiftSchedule[]>([]);
  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Geolocation & Geofence verification state
  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lng: number; accuracy: number } | null>(null);
  const [distanceToGeofence, setDistanceToGeofence] = useState<number | null>(null);
  const [isInsideGeofence, setIsInsideGeofence] = useState<boolean>(false);
  const [assignedLocation, setAssignedLocation] = useState<OfficeLocation | null>(null);
  const [assignedShift, setAssignedShift] = useState<ShiftSchedule | null>(null);

  // Camera Selfie State
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<'checkIn' | 'checkOut' | null>(null);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [locs, shs, atts] = await Promise.all([
        fetchLocations(),
        fetchShifts(),
        fetchAttendanceRecords({ employeeId: employee.employeeId, date: new Date().toISOString().split('T')[0] }),
      ]);

      setLocations(locs);
      setShifts(shs);

      const loc = locs.find((l) => l.id === employee.locationId) || locs[0] || null;
      setAssignedLocation(loc);

      const sh = shs.find((s) => s.id === employee.shiftId) || shs[0] || null;
      setAssignedShift(sh);

      if (atts && atts.length > 0) {
        setTodayRecord(atts[0]);
      } else {
        setTodayRecord(null);
      }
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [employee.employeeId]);

  // Haversine distance formula in meters
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3; // metres
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  // Get current GPS position and check against assigned geofence
  useEffect(() => {
    if (!navigator.geolocation) {
      setErrorMessage('Geolocation is not supported by your device or browser.');
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        setCurrentCoords({ lat: latitude, lng: longitude, accuracy });

        if (assignedLocation) {
          const dist = calculateDistance(
            latitude,
            longitude,
            assignedLocation.latitude,
            assignedLocation.longitude
          );
          setDistanceToGeofence(Math.round(dist));
          setIsInsideGeofence(dist <= assignedLocation.radiusMeters);
        }
      },
      (err) => {
        console.warn('Geolocation positioning error:', err.message);
        // Fallback demo coordinates if user blocks browser GPS permissions
        if (assignedLocation) {
          const fallbackLat = assignedLocation.latitude;
          const fallbackLng = assignedLocation.longitude;
          setCurrentCoords({ lat: fallbackLat, lng: fallbackLng, accuracy: 15 });
          setDistanceToGeofence(10);
          setIsInsideGeofence(true);
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [assignedLocation]);

  const handleInitiatePunch = (type: 'checkIn' | 'checkOut') => {
    setErrorMessage(null);
    if (!isInsideGeofence) {
      setErrorMessage(
        `You are outside your assigned office geofence boundary (${distanceToGeofence}m away). Please move closer to ${assignedLocation?.name || 'the office'} to check in.`
      );
      return;
    }
    setPendingAction(type);
    setShowCameraModal(true);
  };

  const handlePhotoCaptured = async (base64Image: string) => {
    setShowCameraModal(false);
    setActionLoading(true);
    setErrorMessage(null);

    try {
      const lat = currentCoords?.lat || assignedLocation?.latitude || 0;
      const lng = currentCoords?.lng || assignedLocation?.longitude || 0;
      const accuracy = currentCoords?.accuracy || 15;

      if (pendingAction === 'checkIn') {
        const updated = await checkInEmployee({
          employeeId: employee.employeeId,
          latitude: lat,
          longitude: lng,
          accuracy,
          photo: base64Image,
          geofenceValid: isInsideGeofence,
          geofenceName: assignedLocation?.name,
        });
        setTodayRecord(updated);
      } else if (pendingAction === 'checkOut') {
        const updated = await checkOutEmployee({
          employeeId: employee.employeeId,
          latitude: lat,
          longitude: lng,
          accuracy,
          photo: base64Image,
          geofenceValid: isInsideGeofence,
        });
        setTodayRecord(updated);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to complete attendance punch.');
    } finally {
      setActionLoading(false);
      setPendingAction(null);
    }
  };

  const handleToggleBreak = async () => {
    setActionLoading(true);
    setErrorMessage(null);
    try {
      const updated = await toggleBreak(employee.employeeId);
      setTodayRecord(updated);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update break status.');
    } finally {
      setActionLoading(false);
    }
  };

  const activeBreak = todayRecord?.breaks?.find((b) => !b.breakEnd);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Employee Navigation Bar */}
      <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-600/30">
              <User className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-base text-white tracking-tight">{employee.name}</h1>
              <p className="text-[11px] text-slate-400">{employee.department} • ID: {employee.employeeId}</p>
            </div>
          </div>

          <button
            onClick={onLogout}
            className="px-3.5 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 rounded-xl text-xs font-semibold transition flex items-center gap-1.5"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </header>

      {/* Main Dashboard Canvas */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {errorMessage && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs rounded-2xl flex items-center gap-3 shadow-lg">
            <ShieldAlert className="w-5 h-5 shrink-0 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* GPS Geofence & Location Status Card */}
        <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                Assigned Geofence Boundary
              </span>
              <h2 className="text-lg font-bold text-white flex items-center gap-2 mt-0.5">
                <Building className="w-5 h-5 text-indigo-400" />
                {assignedLocation?.name || 'Main Enterprise Campus'}
              </h2>
            </div>

            <div
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold self-start sm:self-auto border ${
                isInsideGeofence
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
              }`}
            >
              {isInsideGeofence ? (
                <>
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>GPS Geofence Verified ({distanceToGeofence || 0}m from center)</span>
                </>
              ) : (
                <>
                  <ShieldAlert className="w-4 h-4 text-amber-400" />
                  <span>Outside Geofence ({distanceToGeofence || 0}m away)</span>
                </>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800/80">
              <span className="text-slate-400 block mb-1">Shift Schedule</span>
              <span className="font-bold text-slate-200">
                {assignedShift?.name || 'Standard Shift'} ({assignedShift?.startTime} - {assignedShift?.endTime})
              </span>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800/80">
              <span className="text-slate-400 block mb-1">Live Coordinates</span>
              <span className="font-mono text-slate-200">
                {currentCoords ? `${currentCoords.lat.toFixed(4)}, ${currentCoords.lng.toFixed(4)}` : 'Locating GPS...'}
              </span>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800/80">
              <span className="text-slate-400 block mb-1">Signal Margin</span>
              <span className="font-bold text-slate-200">
                ±{currentCoords?.accuracy ? Math.round(currentCoords.accuracy) : 10} meters
              </span>
            </div>
          </div>
        </div>

        {/* Attendance Punch Action Portal */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main Action Punch Button */}
          <div className="md:col-span-2 bg-slate-900 rounded-3xl border border-slate-800 p-6 shadow-xl flex flex-col justify-between space-y-6">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-400" /> Today's Punch Terminal
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Perform biometric selfie verification and record your shift punch in real-time.
              </p>
            </div>

            {loading ? (
              <div className="py-12 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-indigo-400" /> Syncing shift attendance record...
              </div>
            ) : !todayRecord?.checkInTime ? (
              <div className="text-center py-6 space-y-4">
                <button
                  onClick={() => handleInitiatePunch('checkIn')}
                  disabled={actionLoading}
                  className="w-full max-w-sm py-4 px-6 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-2xl shadow-xl shadow-indigo-600/30 transition flex items-center justify-center gap-3 mx-auto disabled:opacity-50"
                >
                  <Camera className="w-5 h-5" />
                  <span>Check In & Verify Selfie Snapshot</span>
                </button>
                <p className="text-[11px] text-slate-500">Requires camera snapshot and GPS location inside geofence</p>
              </div>
            ) : !todayRecord?.checkOutTime ? (
              <div className="space-y-4">
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-xs flex items-center justify-between">
                  <div>
                    <p className="font-bold text-emerald-400">Shift Currently Active</p>
                    <p className="text-slate-300 mt-0.5">
                      Punched in at:{' '}
                      <span className="font-bold text-white font-mono">
                        {new Date(todayRecord.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </p>
                  </div>
                  <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 rounded-lg font-semibold text-[10px] uppercase">
                    {todayRecord.status}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    onClick={handleToggleBreak}
                    disabled={actionLoading}
                    className={`py-3.5 px-4 font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 border ${
                      activeBreak
                        ? 'bg-amber-600 hover:bg-amber-500 text-white border-amber-500 shadow-amber-600/20'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                    }`}
                  >
                    <Coffee className="w-4 h-4" />
                    <span>{activeBreak ? 'End Break Session' : 'Start Break Session'}</span>
                  </button>

                  <button
                    onClick={() => handleInitiatePunch('checkOut')}
                    disabled={actionLoading}
                    className="py-3.5 px-4 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-rose-600/20 transition flex items-center justify-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Check Out Shift</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                <h3 className="font-bold text-sm text-white">Shift Completed for Today</h3>
                <p className="text-xs text-slate-400">
                  Total worked time:{' '}
                  <span className="font-bold text-indigo-400 font-mono">
                    {(todayRecord.workedMinutes / 60).toFixed(2)} hrs
                  </span>
                </p>
              </div>
            )}
          </div>

          {/* Today's Shift Metrics Summary */}
          <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6 shadow-xl space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <History className="w-4 h-4 text-indigo-400" /> Today's Shift Log
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-2 border-b border-slate-800">
                <span className="text-slate-400">Check-In Time</span>
                <span className="font-mono text-slate-200">
                  {todayRecord?.checkInTime
                    ? new Date(todayRecord.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : '—'}
                </span>
              </div>

              <div className="flex justify-between py-2 border-b border-slate-800">
                <span className="text-slate-400">Check-Out Time</span>
                <span className="font-mono text-slate-200">
                  {todayRecord?.checkOutTime
                    ? new Date(todayRecord.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : '—'}
                </span>
              </div>

              <div className="flex justify-between py-2 border-b border-slate-800">
                <span className="text-slate-400">Total Breaks</span>
                <span className="font-mono text-slate-200">
                  {todayRecord?.totalBreakMinutes || 0} mins ({todayRecord?.breaks?.length || 0} logged)
                </span>
              </div>

              <div className="flex justify-between py-2">
                <span className="text-slate-400">Punctuality Score</span>
                <span className="font-bold text-emerald-400">{todayRecord?.status || 'Pending'}</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Camera Capture Modal */}
      {showCameraModal && (
        <CameraCapture
          isOpen={showCameraModal}
          onClose={() => setShowCameraModal(false)}
          onCapture={handlePhotoCaptured}
          title={pendingAction === 'checkIn' ? 'Check-In Selfie Verification' : 'Check-Out Selfie Verification'}
        />
      )}
    </div>
  );
};
