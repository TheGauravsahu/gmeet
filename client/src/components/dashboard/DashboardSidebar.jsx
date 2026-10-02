import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Phone, Home } from 'lucide-react';

export default function DashboardSidebar({ activeTab, setActiveTab }) {
  const navigate = useNavigate();

  return (
    <aside className="dashboard-sidebar">
      <button
        className={`sidebar-nav-item ${activeTab === 'meetings' ? 'active' : ''}`}
        onClick={() => setActiveTab('meetings')}
        title="Meetings"
      >
        <Calendar size={20} className="nav-icon-box" />
        <span>Meetings</span>
      </button>

      <button
        className={`sidebar-nav-item ${activeTab === 'calls' ? 'active' : ''}`}
        onClick={() => setActiveTab('calls')}
        title="Calls"
      >
        <Phone size={20} className="nav-icon-box" />
        <span>Calls</span>
      </button>

      <div style={{ flex: 1 }} />

      <button
        className="sidebar-nav-item"
        onClick={() => navigate('/')}
        title="Landing Home"
      >
        <Home size={20} className="nav-icon-box" />
        <span>Home</span>
      </button>
    </aside>
  );
}
