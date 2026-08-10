import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Plus,
  Edit2,
  Trash2,
  X,
  Loader2,
  Crosshair,
  Compass,
  CheckCircle2,
  AlertTriangle,
  Send,
} from 'lucide-react';
import { OfficeLocation } from '../../types';
import { fetchLocations, createLocation, updateLocation, deleteLocation } from '../../lib/api';
import { getCurrentGPSPosition, validateGeofence } from '../../lib/geofence';

export const GeofenceManagement: React.FC = () => {
  const [locations, setLocations] = useState<OfficeLocation[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<OfficeLocation | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [gpsFetching, setGpsFetching] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    address: '',
    latitude: 37.7749,
    longitude: -122.4194,
    radiusMeters: 200,
    requiredAccuracyMeters: 50,
  });

  // Geofence Tester Sandbox State
  const [testLat, setTestLat] = useState<string>('37.7749');
  const [testLng, setTestLng] = useState<string>('-122.4194');
  const [testSelectedLocId, setTestSelectedLocId] = useState<string>('');
  const [testResult, setTestResult] = useState<any>(null);

  const loadLocations = async () => {
    setLoading(true);
    try {
      const list = await fetchLocations();
      setLocations(list);
      if (list.length > 0 && !testSelectedLocId) {
        setTestSelectedLocId(list[0].id);
      }
    } catch (err) {
      console.error('Failed to load locations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLocations();
  }, []);

  const openAddModal = () => {
    setEditingLocation(null);
    setFormData({
      name: 'Corporate Headquarters',
      address: '100 Enterprise Way',
      latitude: 37.7749,
      longitude: -122.4194,
      radiusMeters: 200,
      requiredAccuracyMeters: 50,
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (loc: OfficeLocation) => {
    setEditingLocation(loc);
    setFormData({
      name: loc.name,
      address: loc.address,
      latitude: loc.latitude,
      longitude: loc.longitude,
      radiusMeters: loc.radiusMeters,
      requiredAccuracyMeters: loc.requiredAccuracyMeters || 50,
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleFetchCurrentGps = async () => {
    setGpsFetching(true);
    setFormError(null);
    try {
      const pos = await getCurrentGPSPosition();
      setFormData((prev) => ({
        ...prev,
        latitude: parseFloat(pos.latitude.toFixed(6)),
        longitude: parseFloat(pos.longitude.toFixed(6)),
        requiredAccuracyMeters: Math.max(20, Math.round(pos.accuracy)),
      }));
    } catch (err: any) {
      setFormError(err.message || 'Could not fetch current GPS location.');
    } finally {
      setGpsFetching(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.name || formData.latitude === undefined || formData.longitude === undefined) {
      setFormError('Office name, latitude, and longitude are required.');
      return;
    }

    setFormLoading(true);
    try {
      if (editingLocation) {
        await updateLocation(editingLocation.id, formData);
      } else {
        await createLocation(formData);
      }
      setIsModalOpen(false);
      loadLocations();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save office location.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete geofence location "${name}"?`)) {
      try {
        await deleteLocation(id);
        loadLocations();
      } catch (err) {
        alert('Failed to delete office location.');
      }
    }
  };

  const runGeofenceTest = () => {
    const loc = locations.find((l) => l.id === testSelectedLocId);
    if (!loc) return;

    const lat = parseFloat(testLat);
    const lng = parseFloat(testLng);

    const res = validateGeofence(
      { latitude: lat, longitude: lng, accuracy: 15 },
      loc.latitude,
      loc.longitude,
      loc.radiusMeters,
      loc.requiredAccuracyMeters
    );

    setTestResult({ ...res, locationName: loc.name });
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <MapPin className="w-5 h-5 text-indigo-600" />
            Office Geofences & GPS Boundaries
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Define authorized office GPS coordinates, active boundary radii (meters), and mandatory GPS signal accuracy.
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Add Office Geofence
        </button>
      </div>

      {/* Geofences List */}
      {loading ? (
        <div className="p-12 bg-white rounded-2xl border border-slate-200 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-indigo-600" /> Loading office geofences...
        </div>
      ) : locations.length === 0 ? (
        <div className="p-12 bg-white rounded-2xl border border-slate-200 text-center text-slate-400 text-xs">
          No geofence office locations found. Add your primary office coordinates above.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {locations.map((loc) => (
            <div
              key={loc.id}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-sm">{loc.name}</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(loc)}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(loc.id, loc.name)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-slate-500 line-clamp-1">{loc.address || 'Street address unassigned'}</p>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1 text-xs">
                  <div className="flex justify-between font-mono text-[11px] text-slate-700">
                    <span className="text-slate-400">Lat: {loc.latitude}</span>
                    <span className="text-slate-400">Lng: {loc.longitude}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-indigo-50/60 p-2.5 rounded-xl border border-indigo-100/80">
                    <p className="text-[10px] text-indigo-700 font-medium">Active Radius</p>
                    <p className="font-bold text-indigo-900 text-sm mt-0.5">{loc.radiusMeters} meters</p>
                  </div>

                  <div className="bg-emerald-50/60 p-2.5 rounded-xl border border-emerald-100/80">
                    <p className="text-[10px] text-emerald-700 font-medium">GPS Accuracy</p>
                    <p className="font-bold text-emerald-900 text-sm mt-0.5">≤ {loc.requiredAccuracyMeters}m</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
                <span className="text-emerald-600 font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Boundary Active
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Interactive Geofence Tester Sandbox */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div>
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <Compass className="w-4 h-4 text-indigo-600" /> Geofence Verification Sandbox Tester
          </h3>
          <p className="text-xs text-slate-500">
            Simulate employee check-in GPS coordinates against configured office geofences to verify distance calculations and compliance status.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              Target Office Geofence
            </label>
            <select
              value={testSelectedLocId}
              onChange={(e) => setTestSelectedLocId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-slate-900 rounded-xl text-xs"
            >
              {locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              Sample Latitude
            </label>
            <input
              type="number"
              step="any"
              value={testLat}
              onChange={(e) => setTestLat(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-slate-900 rounded-xl text-xs font-mono"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              Sample Longitude
            </label>
            <input
              type="number"
              step="any"
              value={testLng}
              onChange={(e) => setTestLng(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-slate-900 rounded-xl text-xs font-mono"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={runGeofenceTest}
              className="w-full px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" /> Run Sandbox Test
            </button>
          </div>
        </div>

        {testResult && (
          <div
            className={`p-4 rounded-xl border text-xs flex items-center justify-between ${
              testResult.isValid
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            <div className="space-y-1">
              <p className="font-bold text-sm">
                {testResult.isValid ? '✅ GEOFENCE COMPLIANT' : '❌ OUTSIDE GEOFENCE BOUNDARY'}
              </p>
              <p className="text-xs">{testResult.message}</p>
            </div>
            <div className="text-right font-mono text-[11px]">
              <p>Distance: {testResult.distanceMeters} meters</p>
              <p>Allowed Max: {testResult.allowedRadiusMeters} meters</p>
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit Geofence Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-base font-bold text-slate-900">
                {editingLocation ? 'Edit Geofence Boundary' : 'Add New Office Geofence'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Office Location Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 rounded-xl text-xs"
                  placeholder="e.g. Headquarters Silicon Valley"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Address
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 rounded-xl text-xs"
                  placeholder="500 Tech Blvd, Mountain View, CA"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Latitude
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={formData.latitude}
                    onChange={(e) =>
                      setFormData({ ...formData, latitude: parseFloat(e.target.value) })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-slate-900 rounded-xl text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Longitude
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={formData.longitude}
                    onChange={(e) =>
                      setFormData({ ...formData, longitude: parseFloat(e.target.value) })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-slate-900 rounded-xl text-xs font-mono"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleFetchCurrentGps}
                disabled={gpsFetching}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5"
              >
                {gpsFetching ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Crosshair className="w-3.5 h-3.5 text-indigo-600" />
                )}
                Use My Current Device GPS Location
              </button>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Allowed Radius (meters)
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="5000"
                    value={formData.radiusMeters}
                    onChange={(e) =>
                      setFormData({ ...formData, radiusMeters: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-slate-900 rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Required Accuracy (meters)
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="500"
                    value={formData.requiredAccuracyMeters}
                    onChange={(e) =>
                      setFormData({ ...formData, requiredAccuracyMeters: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-slate-900 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5"
                >
                  {formLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Save Geofence
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
