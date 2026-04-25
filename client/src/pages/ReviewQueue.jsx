import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { 
  Filter, Clock, MapPin, Phone, Info, CheckCircle, 
  Edit3, XCircle, ChevronRight, AlertTriangle 
} from 'lucide-react';

const socket = io("http://localhost:5000");

export default function ReviewQueue() {
  const [reports, setReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
    socket.on('new-report', (report) => setReports(prev => [report, ...prev]));
    return () => socket.off('new-report');
  }, []);

  const fetchReports = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/reports");
      const data = await res.json();
      // Only show reports that aren't already resolved/rejected if desired
      setReports(data);
      if (data.length > 0) setSelectedReport(data[0]);
      setLoading(false);
    } catch (err) { console.error(err); }
  };

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      const res = await fetch(`http://localhost:5000/api/reports/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        setReports(prev => prev.map(r => r._id === id ? { ...r, status: newStatus } : r));
        alert(`Report ${newStatus}`);
      }
    } catch (err) { alert("Failed to update status"); }
  };

  if (loading) return <div className="p-8 text-gray-500">Loading Queue...</div>;

  return (
    <div className="flex h-screen bg-[#050816] text-white">
      {/* LEFT: LIST OF REPORTS */}
      <div className="w-1/3 border-r border-[#1C223C] flex flex-col">
        <div className="p-6 border-b border-[#1C223C]">
          <h2 className="text-2xl font-bold mb-4">Review Queue</h2>
          <div className="flex gap-2">
            <FilterButton label="All" active />
            <FilterButton label="High Risk" />
            <FilterButton label="Recent" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {reports.map((report) => (
            <div 
              key={report._id}
              onClick={() => setSelectedReport(report)}
              className={`p-5 border-b border-[#1C223C] cursor-pointer transition-all hover:bg-[#11162B] ${selectedReport?._id === report._id ? 'bg-[#11162B] border-l-4 border-l-[#F97316]' : ''}`}
            >
              <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-orange-500 bg-orange-500/10 px-2 py-1 rounded">
                  {report.category || 'General'}
                </span>
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  <Clock size={12} /> 2 min ago
                </span>
              </div>
              <h4 className="font-bold mb-1 truncate">{report.description}</h4>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <MapPin size={12} /> {report.location}
              </div>
              
              {/* Severity Bar */}
              <div className="mt-3 w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${report.severityScore > 7 ? 'bg-red-500' : 'bg-yellow-500'}`} 
                  style={{ width: `${(report.severityScore || 5) * 10}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT: DETAILED VIEW */}
      <div className="flex-1 bg-[#050816] p-8 overflow-y-auto">
        {selectedReport ? (
          <div className="max-w-3xl mx-auto">
            <div className="bg-[#0A0F24] border border-[#1C223C] rounded-3xl p-8 shadow-2xl">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-xl font-bold flex items-center gap-3">
                  <AlertTriangle className="text-[#F97316]" /> AI Extracted Data
                </h3>
                <span className="bg-orange-500/10 text-orange-500 px-4 py-1 rounded-full text-xs font-bold border border-orange-500/20">
                  {selectedReport.severityScore * 10}% AI Confidence
                </span>
              </div>

              <div className="grid grid-cols-2 gap-6 mb-8">
                <DataField label="Category" value={selectedReport.category} />
                <DataField label="Urgency" value={selectedReport.severityScore > 7 ? 'Critical' : 'Moderate'} color="text-red-500" />
                <div className="col-span-2">
                  <DataField label="Location" value={selectedReport.location} />
                </div>
                <div className="col-span-2">
                  <DataField label="Description" value={selectedReport.description} isLong />
                </div>
                <DataField label="Contact Info" value={selectedReport.phone} />
              </div>

              {/* AI Reasoning Box */}
              <div className="bg-[#11162B] border border-[#1C223C] p-6 rounded-2xl mb-10">
                <p className="text-[10px] font-bold text-gray-500 uppercase mb-2 tracking-widest">AI Reasoning</p>
                <p className="text-sm text-gray-300 leading-relaxed italic">
                  "{selectedReport.aiReason || 'Analyzed based on keywords and emergency severity patterns.'}"
                </p>
              </div>

              {/* ACTION BUTTONS */}
              <div className="flex gap-4">
                <button 
                  onClick={() => handleStatusUpdate(selectedReport._id, 'Approved')}
                  className="flex-1 bg-[#F97316] text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/20"
                >
                  <CheckCircle size={20} /> Approve
                </button>
                <button className="flex-1 bg-[#11162B] border border-[#1C223C] text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-[#1C223C] transition-all">
                  <Edit3 size={20} /> Edit
                </button>
                <button 
                  onClick={() => handleStatusUpdate(selectedReport._id, 'Rejected')}
                  className="px-6 bg-red-500/10 border border-red-500/20 text-red-500 font-bold rounded-xl hover:bg-red-500 hover:text-white transition-all"
                >
                  <XCircle size={20} />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-gray-600">
             <Info size={48} className="mb-4 opacity-20" />
             <p>Select a report from the list to begin verification</p>
          </div>
        )}
      </div>
    </div>
  );
}

function FilterButton({ label, active }) {
  return (
    <button className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${active ? 'bg-white text-black' : 'bg-[#11162B] text-gray-500 border border-[#1C223C]'}`}>
      {label}
    </button>
  );
}

function DataField({ label, value, color = "text-white", isLong = false }) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{label}</label>
      <div className={`w-full bg-[#11162B] border border-[#1C223C] rounded-xl px-4 ${isLong ? 'py-4 min-h-[100px]' : 'py-3'} text-sm font-semibold ${color}`}>
        {value || 'Not provided'}
      </div>
    </div>
  );
}