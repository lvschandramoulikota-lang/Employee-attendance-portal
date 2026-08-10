import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// Hardcoded verified configuration credentials to completely bypass initialization errors
const supabaseUrl = 'https://supabase.co';
const supabaseAnonKey = 'sb_publishable_d6PtOQbD3lr-rRIdiZHLjg_MUkcYgNS';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface Employee {
  id: string;
  employeeId: string;
  name: string;
  email: string;
  department: string;
  designation: string;
  phone: string;
  role: string;
  shiftId: string;
  locationId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function EmployeeManagement() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  
  // Input fields state tracking
  const [empId, setEmpId] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [department, setDepartment] = useState('');
  const [designation, setDesignation] = useState('');
  const [password, setPassword] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    fetchEmployees();
  }, []);

  async function fetchEmployees() {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('employees').select('*');
      if (!error && data) {
        // Map database naming scheme to match UI layout types smoothly
        const mappedData = data.map((emp: any) => ({
          id: emp.id,
          employeeId: emp.id,
          name: emp.name,
          email: emp.email || '',
          department: emp.department || 'Operations',
          designation: emp.role || 'Staff Member',
          phone: emp.phone || '',
          role: 'employee',
          shiftId: emp.assigned_shift || '',
          locationId: emp.assigned_geofence || '',
          isActive: emp.status === 'Active Staff',
          createdAt: emp.timestamp || new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }));
        setEmployees(mappedData);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    // Structure exact column mapping payload for the Supabase tables
    const payload = { 
      id: empId, 
      name: name, 
      email: email, 
      department: department, 
      role: designation,
      phone: phone,
      status: 'Active Staff'
    };

    let error;
    if (isEditing) {
      const { error: err } = await supabase.from('employees').update(payload).eq('id', empId);
      error = err;
    } else {
      const { error: err } = await supabase.from('employees').insert([payload]);
      error = err;
    }

    if (error) {
      alert("Database Error: " + error.message);
    } else {
      setShowModal(false);
      resetForm();
      fetchEmployees();
    }
  }

  function handleEdit(emp: Employee) {
    setEmpId(emp.id);
    setName(emp.name);
    setEmail(emp.email);
    setPhone(emp.phone);
    setDepartment(emp.department);
    setDesignation(emp.designation);
    setIsEditing(true);
    setShowModal(true);
  }

  async function handleDelete(id: string) {
    if (!confirm(`Delete employee record ${id} permanently?`)) return;
    const { error } = await supabase.from('employees').delete().eq('id', id);
    if (error) alert(error.message);
    else fetchEmployees();
  }

  function resetForm() {
    setEmpId('');
    setName('');
    setEmail('');
    setPhone('');
    setDepartment('');
    setDesignation('');
    setPassword('');
    setIsEditing(false);
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6 bg-[#111827] p-6 border border-gray-800 rounded-xl shadow-lg">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">👥 Employee Records</h2>
          <p className="text-sm text-gray-400">Direct cloud database integration active</p>
        </div>
        <button onClick={() => { resetForm(); setShowModal(true); }} className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2 rounded-lg transition shadow-md">
          + Add New Employee
        </button>
      </div>

      <div className="bg-[#111827] border border-gray-800 rounded-xl overflow-hidden shadow-xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-800 bg-[#1f2937]/30 text-xs font-bold uppercase text-gray-400 tracking-wider">
              <th className="p-4">Employee Details</th>
              <th className="p-4">Department & Designation</th>
              <th className="p-4">Shift Details</th>
              <th className="p-4">Geofence Hub</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800 text-sm text-white">
            {loading ? (
              <tr><td colSpan={5} className="p-8 text-center text-gray-500">Syncing with cloud tables...</td></tr>
            ) : employees.length === 0 ? (
              <tr><td colSpan={5} className="p-8 text-center text-gray-500">No records found. Click "+ Add New Employee" to register staff permanently.</td></tr>
            ) : employees.map(emp => (
              <tr key={emp.id} className="hover:bg-gray-800/40 transition">
                <td className="p-4">
                  <div className="font-semibold text-gray-200">{emp.name}</div>
                  <div className="text-xs text-gray-400">ID: {emp.id} {emp.email ? `• ${emp.email}` : ''}</div>
                </td>
                <td className="p-4">
                  <div className="text-gray-200">{emp.department}</div>
                  <div className="text-xs text-gray-400">{emp.designation}</div>
                </td>
                <td className="p-4 text-xs text-gray-300">⏰ {emp.shiftId || 'Unassigned'}</td>
                <td className="p-4 text-xs text-gray-300">📍 {emp.locationId || 'Unassigned'}</td>
                <td className="p-4 text-right text-xs">
                  <button onClick={() => handleEdit(emp)} className="text-indigo-400 hover:text-indigo-300 mr-4 font-semibold transition">✏️ Edit</button>
                  <button onClick={() => handleDelete(emp.id)} className="text-red-400 hover:text-red-300 font-semibold transition">🗑️ Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#111827] border border-gray-800 rounded-xl max-w-xl w-full p-6 text-white shadow-2xl">
            <h3 className="text-lg font-bold border-b border-gray-800 pb-3 mb-4 text-indigo-400 uppercase tracking-wide">
              {isEditing ? 'Modify Employee File' : 'Add New Employee'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Employee ID</label>
                  <input type="text" placeholder="e.g., EMP680" value={empId} onChange={e => setEmpId(e.target.value)} disabled={isEditing} required className="w-full bg-[#0b0f19] border border-gray-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Full Name</label>
                  <input type="text" placeholder="e.g., John Doe" value={name} onChange={e => setName(e.target.value)} required className="w-full bg-[#0b0f19] border border-gray-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Work Email</label>
                  <input type="email" placeholder="employee@enterprise.com" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-[#0b0f19] border border-gray-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Phone Number</label>
                  <input type="text" placeholder="+1 (555) 000-0000" value={phone} onChange={e => setPhone(e.target.value)} className="w-full bg-[#0b0f19] border border-gray-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Department</label>
                  <input type="text" placeholder="Engineering" value={department} onChange={e => setDepartment(e.target.value)} className="w-full bg-[#0b0f19] border border-gray-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Designation</label>
