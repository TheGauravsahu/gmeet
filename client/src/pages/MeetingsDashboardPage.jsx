import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import ScheduleModal from '../components/ScheduleModal';
import DashboardTopNav from '../components/dashboard/DashboardTopNav';
import DashboardSidebar from '../components/dashboard/DashboardSidebar';
import DashboardDateStrip from '../components/dashboard/DashboardDateStrip';
import DashboardSafetyBanner from '../components/dashboard/DashboardSafetyBanner';
import DashboardFilterBar from '../components/dashboard/DashboardFilterBar';
import MeetingCard from '../components/dashboard/MeetingCard';
import DashboardEmptyState from '../components/dashboard/DashboardEmptyState';
import {
  ConfirmDeleteMeetingModal,
  MeetingForLaterModal,
  SafetyModal,
} from '../components/dashboard/DashboardModals';
import '../styles/Dashboard.css';

export default function MeetingsDashboardPage() {
  const navigate = useNavigate();
  const { displayName, user, logout } = useAuth();

  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [codeOrLink, setCodeOrLink] = useState('');
  const [activeTab, setActiveTab] = useState('meetings');
  const [activeFilter, setActiveFilter] = useState('all');

  // Date selection & week strip
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [weekOffset, setWeekOffset] = useState(0); // 0 = current week

  // Modals & dropdowns
  const [newMenuOpen, setNewMenuOpen] = useState(false);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [laterModalOpen, setLaterModalOpen] = useState(false);
  const [createdLaterRoom, setCreatedLaterRoom] = useState(null);
  const [safetyModalOpen, setSafetyModalOpen] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState(null);
  const [deletingRoomCode, setDeletingRoomCode] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  // Fetch user meetings
  const loadMeetings = async () => {
    try {
      setLoading(true);
      const res = await api.rooms.getUserRooms();
      if (res.success && res.data.rooms) {
        setRooms(res.data.rooms);
      }
    } catch (err) {
      console.warn('Error loading rooms:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMeetings();
  }, []);

  // Compute 7-day week strip based on weekOffset
  const getWeekDays = () => {
    const today = new Date();
    const currentDayOfWeek = today.getDay(); // 0 is Sunday, 1 is Monday...
    const mondayOffset = (currentDayOfWeek + 6) % 7;

    const baseMonday = new Date(today);
    baseMonday.setDate(today.getDate() - mondayOffset + weekOffset * 7);

    const days = [];
    const dayNames = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

    for (let i = 0; i < 7; i++) {
      const d = new Date(baseMonday);
      d.setDate(baseMonday.getDate() + i);
      days.push({
        name: dayNames[i],
        number: d.getDate(),
        fullDate: d,
        isToday: d.toDateString() === today.toDateString(),
        isSelected: d.toDateString() === selectedDate.toDateString(),
      });
    }
    return days;
  };

  const weekDays = getWeekDays();

  // Instant meeting handler
  const handleStartInstantMeeting = async () => {
    try {
      setNewMenuOpen(false);
      const res = await api.rooms.createRoom({
        title: `${displayName}'s Meeting`,
        hostName: displayName,
      });

      if (res.success && res.data.room) {
        navigate(`/meet/${res.data.room.roomCode}`, {
          state: {
            participantName: displayName,
            isHost: true,
          },
        });
      }
    } catch (err) {
      alert(`Could not start instant meeting: ${err.message}`);
    }
  };

  const handleStartAudioCall = async () => {
    try {
      setNewMenuOpen(false);
      const res = await api.rooms.createRoom({
        title: `${displayName}'s Audio Call`,
        hostName: displayName,
      });

      if (res.success && res.data.room) {
        navigate(`/call/${res.data.room.roomCode}`);
      }
    } catch (err) {
      alert(`Could not start audio call: ${err.message}`);
    }
  };

  // Create meeting for later
  const handleCreateMeetingForLater = async () => {
    try {
      setNewMenuOpen(false);
      const res = await api.rooms.createRoom({
        title: `${displayName}'s Quick Room`,
        hostName: displayName,
      });

      if (res.success && res.data.room) {
        setCreatedLaterRoom(res.data.room);
        setLaterModalOpen(true);
        loadMeetings();
      }
    } catch (err) {
      alert(`Failed to create meeting link: ${err.message}`);
    }
  };

  // Join by code or URL
  const handleJoinByCode = (e) => {
    e.preventDefault();
    let cleaned = codeOrLink.trim();
    if (!cleaned) return;
    const audioOnly = cleaned.includes('/call/') || /[?&]mode=audio(?:&|$)/i.test(cleaned);

    if (cleaned.includes('/meet/')) {
      cleaned = cleaned.split('/meet/')[1].split('?')[0];
    } else if (cleaned.includes('/call/')) {
      cleaned = cleaned.split('/call/')[1].split('?')[0];
    } else if (cleaned.includes('/lobby/')) {
      cleaned = cleaned.split('/lobby/')[1].split('?')[0];
    }

    cleaned = cleaned.split('?')[0].split('#')[0].toLowerCase().replace(/\s+/g, '');
    navigate(`/${audioOnly ? 'call' : 'lobby'}/${cleaned}`);
  };

  // Delete a room
  const handleDeleteRoom = async (roomCode, e) => {
    e.stopPropagation();
    setDeleteError('');
    setRoomToDelete(rooms.find((room) => room.roomCode === roomCode) || { roomCode });
  };

  const confirmDeleteRoom = async () => {
    if (!roomToDelete || deletingRoomCode) return;
    const roomCode = roomToDelete.roomCode;
    setDeletingRoomCode(roomCode);
    setDeleteError('');
    try {
      await api.rooms.deleteRoom(roomCode);
      setRooms((prev) => prev.filter((r) => r.roomCode !== roomCode));
      setRoomToDelete(null);
    } catch (err) {
      setDeleteError(`Could not delete this meeting: ${err.message}`);
    } finally {
      setDeletingRoomCode('');
    }
  };

  // Copy meeting link
  const handleCopyLink = (code, e) => {
    e?.stopPropagation();
    const url = `${window.location.origin}/lobby/${code}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // Filter meetings
  const filteredRooms = rooms.filter((r) => {
    if (activeFilter === 'active') return r.status === 'active';
    if (activeFilter === 'upcoming') {
      return r.scheduledFor && new Date(r.scheduledFor) >= new Date();
    }
    if (activeFilter === 'today') {
      const todayStr = selectedDate.toDateString();
      if (r.scheduledFor) {
        return new Date(r.scheduledFor).toDateString() === todayStr;
      }
      return new Date(r.createdAt).toDateString() === todayStr;
    }
    return true; // 'all'
  });

  const formattedHeaderDate = selectedDate.toLocaleDateString('en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });

  return (
    <div className="meet-dashboard-container">
      <div className="ambient-cosmos" />

      {/* 1. TOP APP BAR */}
      <DashboardTopNav
        displayName={displayName}
        user={user}
        logout={logout}
        codeOrLink={codeOrLink}
        setCodeOrLink={setCodeOrLink}
        onJoinByCode={handleJoinByCode}
        newMenuOpen={newMenuOpen}
        setNewMenuOpen={setNewMenuOpen}
        onStartInstantMeeting={handleStartInstantMeeting}
        onStartAudioCall={handleStartAudioCall}
        onCreateMeetingForLater={handleCreateMeetingForLater}
        onOpenScheduleModal={() => setScheduleModalOpen(true)}
        onOpenSafetyModal={() => setSafetyModalOpen(true)}
      />

      {/* 2. DASHBOARD BODY */}
      <div className="dashboard-layout-body">
        {/* Left Navigation Sidebar */}
        <DashboardSidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />

        {/* Main Workspace Stage */}
        <main className="dashboard-main-view">
          {/* Date & Week Strip Row */}
          <DashboardDateStrip
            formattedHeaderDate={formattedHeaderDate}
            weekDays={weekDays}
            setWeekOffset={setWeekOffset}
            setSelectedDate={setSelectedDate}
          />

          {/* Safety & Host Approval Banner */}
          <DashboardSafetyBanner
            onLearnMore={() => setSafetyModalOpen(true)}
          />

          {/* Filter Bar */}
          <DashboardFilterBar
            activeFilter={activeFilter}
            setActiveFilter={setActiveFilter}
            totalMeetingsCount={rooms.length}
            onRefresh={loadMeetings}
          />

          {/* Meetings List / Empty Stage */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8' }}>
              <div className="waiting-pulse-spinner" style={{ margin: '0 auto 16px auto' }}>
                <Sparkles size={24} className="spinning-sparkle" />
              </div>
              <p>Loading your meetings...</p>
            </div>
          ) : filteredRooms.length === 0 ? (
            <DashboardEmptyState
              onNewMeeting={() => setScheduleModalOpen(true)}
            />
          ) : (
            <div className="meetings-grid-list">
              {filteredRooms.map((room) => (
                <MeetingCard
                  key={room._id || room.roomCode}
                  room={room}
                  onCopyLink={handleCopyLink}
                  onDeleteRoom={handleDeleteRoom}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      {/* 3. MODALS */}
      <ScheduleModal
        isOpen={scheduleModalOpen}
        onClose={() => {
          setScheduleModalOpen(false);
          loadMeetings();
        }}
      />

      <MeetingForLaterModal
        isOpen={laterModalOpen}
        onClose={() => setLaterModalOpen(false)}
        createdRoom={createdLaterRoom}
        copiedLink={copiedLink}
        onCopyLink={handleCopyLink}
      />

      <SafetyModal
        isOpen={safetyModalOpen}
        onClose={() => setSafetyModalOpen(false)}
      />

      <ConfirmDeleteMeetingModal
        room={roomToDelete}
        isDeleting={Boolean(deletingRoomCode)}
        error={deleteError}
        onClose={() => {
          if (!deletingRoomCode) {
            setRoomToDelete(null);
            setDeleteError('');
          }
        }}
        onConfirm={confirmDeleteRoom}
      />
    </div>
  );
}
