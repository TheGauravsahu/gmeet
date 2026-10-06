import React, { useCallback, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  Activity,
  ArrowUpRight,
  CalendarDays,
  Check,
  ChevronDown,
  CircleHelp,
  Clock3,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  LogOut,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Trash2,
  Users,
  Video,
  Pencil,
  X,
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import '../styles/Admin.css';

const navigation = [
  { label: 'Overview', to: '/dashboard', icon: LayoutDashboard },
  { label: 'Users', to: '/users', icon: Users },
  { label: 'Meetings', to: '/meetings', icon: Video },
  { label: 'Settings', to: '/settings', icon: Settings },
];

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : '—';

const dateInputValue = (value) => {
  if (!value) return '';
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
};

const initialDefaults = {
  isLocked: false,
  muteOnEntry: false,
  allowScreenShare: true,
  allowChat: true,
  requireHostApproval: true,
  aiTranscriptionEnabled: true,
};

const meetingSettingOptions = [
  ['isLocked', 'Lock meeting', 'Participants need the host to unlock the room.'],
  ['muteOnEntry', 'Mute on entry', 'Start participants with their microphones muted.'],
  ['allowScreenShare', 'Screen sharing', 'Allow participants to share their screen.'],
  ['allowChat', 'Meeting chat', 'Allow messages during the meeting.'],
  ['requireHostApproval', 'Host approval', 'Require the host to admit guests.'],
  ['aiTranscriptionEnabled', 'AI transcription', 'Allow Aura AI to transcribe this meeting.'],
];

function MeetingSettingsFields({ settings, onChange }) {
  return (
    <div className="admin-form-settings-grid">
      {meetingSettingOptions.map(([key, label, description]) => (
        <label key={key}>
          <input type="checkbox" checked={Boolean(settings[key])} onChange={() => onChange(key)} />
          <span><strong>{label}</strong><small>{description}</small></span>
        </label>
      ))}
    </div>
  );
}

function AdminLayout({ children, title, description, action }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div className="admin-app">
      <aside className="admin-sidebar">
        <Link to="/dashboard" className="admin-brand">
          <span className="admin-brand-icon"><Video size={18} /></span>
          <span>AURA<span className="admin-brand-light">.MEET</span></span>
        </Link>

        <div className="admin-workspace">
          <span className="admin-workspace-mark">A</span>
          <span><strong>Workspace</strong><small>Administrator</small></span>
          <ChevronDown size={15} />
        </div>

        <span className="admin-nav-label">WORKSPACE</span>
        <nav className="admin-nav">
          {navigation.map(({ label, to, icon: Icon }) => {
            const active =
              location.pathname === to ||
              (to === '/dashboard' && location.pathname === '/admin') ||
              (to !== '/dashboard' && location.pathname.startsWith(`${to}/`));
            return (
              <Link key={to} to={to} className={`admin-nav-link ${active ? 'active' : ''}`}>
                <Icon size={17} />
                <span>{label}</span>
                {label === 'Meetings' && <span className="admin-nav-dot" />}
              </Link>
            );
          })}
        </nav>

        <div className="admin-sidebar-spacer" />
        <div className="admin-plan-card">
          <div className="admin-plan-icon"><ShieldCheck size={17} /></div>
          <strong>Admin console</strong>
          <p>Manage your AURA.MEET workspace and keep everything running smoothly.</p>
          <Link to="/settings">Workspace settings <ArrowUpRight size={13} /></Link>
        </div>
        <button className="admin-nav-link admin-signout" onClick={() => { logout(); navigate('/'); }}>
          <LogOut size={17} /><span>Sign out</span>
        </button>
      </aside>

      <main className="admin-main">
        <header className="admin-topbar">
          <div className="admin-breadcrumb">Workspace <span>/</span> <strong>{title}</strong></div>
          <div className="admin-topbar-actions">
            <button className="admin-help-button" title="Help"><CircleHelp size={17} /></button>
            <span className="admin-topbar-divider" />
            <div className="admin-user-menu">
              <span className="admin-user-avatar">{(user?.name || 'A').charAt(0).toUpperCase()}</span>
              <span><strong>{user?.name || 'Administrator'}</strong><small>Admin</small></span>
              <ChevronDown size={14} />
            </div>
          </div>
        </header>

        <div className="admin-content">
          <div className="admin-page-heading">
            <div>
              <p className="admin-eyebrow">AURA.MEET ADMIN</p>
              <h1>{title}</h1>
              <p className="admin-page-description">{description}</p>
            </div>
            {action}
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}

function ErrorBanner({ children }) {
  return children ? <div className="admin-error-banner" role="alert">{children}</div> : null;
}

function AdminOverview() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.admin.getOverview()
      .then((response) => setData(response.data))
      .catch((err) => setError(err.message));
  }, []);

  const stats = data?.stats || {};
  const activity = data?.activity || [];
  const maxActivity = Math.max(1, ...activity.map((item) => item.count));
  const metricCards = [
    { label: 'Total users', value: stats.users ?? '—', change: 'Registered accounts', icon: Users, className: 'violet' },
    { label: 'Total meetings', value: stats.meetings ?? '—', change: 'Created in workspace', icon: Video, className: 'blue' },
    { label: 'Live meetings', value: stats.activeMeetings ?? '—', change: 'Happening right now', icon: Activity, className: 'green' },
    { label: 'People in calls', value: stats.participants ?? '—', change: 'Active participants', icon: Users, className: 'amber' },
  ];

  return (
    <AdminLayout
      title="Overview"
      description="Here’s what’s happening across your workspace."
      action={<Link to="/meetings/create" className="admin-primary-button"><Plus size={16} /> New meeting</Link>}
    >
      <ErrorBanner>{error}</ErrorBanner>
      <section className="admin-metrics-grid">
        {metricCards.map(({ label, value, change, icon: Icon, className }) => (
          <article className="admin-metric-card" key={label}>
            <div className="admin-metric-top">
              <span>{label}</span>
              <span className={`admin-metric-icon ${className}`}><Icon size={17} /></span>
            </div>
            <strong>{value}</strong>
            <small><span className="admin-metric-trend"><ArrowUpRight size={13} /> Live</span> {change}</small>
          </article>
        ))}
      </section>

      <section className="admin-overview-grid">
        <article className="admin-panel admin-activity-panel">
          <div className="admin-panel-heading">
            <div><h2>Workspace activity</h2><p>Meetings created over the last six months</p></div>
              <span className="admin-period-chip"><CalendarDays size={14} /> Last 6 months</span>
          </div>
          <div className="admin-chart">
            <div className="admin-chart-y-labels"><span>{maxActivity}</span><span>{Math.round(maxActivity * 0.75)}</span><span>{Math.round(maxActivity * 0.5)}</span><span>{Math.round(maxActivity * 0.25)}</span><span>0</span></div>
            <div className="admin-chart-area">
              <div className="admin-chart-grid"><i /><i /><i /><i /><i /></div>
              <div className="admin-chart-bars">
                {activity.map((item) => (
                  <span key={item.label} title={`${item.count} meeting${item.count === 1 ? '' : 's'}`} style={{ height: `${Math.max(3, (item.count / maxActivity) * 100)}%` }}><i /></span>
                ))}
              </div>
            </div>
            <div className="admin-chart-x-labels">{activity.map((item) => <span key={item.label}>{item.label}</span>)}</div>
          </div>
          <div className="admin-chart-legend"><i /> Meetings created <span>{activity.reduce((total, item) => total + item.count, 0)} in this period</span></div>
        </article>
        <article className="admin-panel admin-quick-panel">
          <div className="admin-panel-heading"><div><h2>Quick actions</h2><p>Common workspace tasks</p></div></div>
          <Link to="/users/create" className="admin-quick-action"><span className="admin-quick-icon violet"><Users size={17} /></span><span><strong>Invite a user</strong><small>Add someone to your workspace</small></span><ArrowUpRight size={15} /></Link>
          <Link to="/meetings/create" className="admin-quick-action"><span className="admin-quick-icon blue"><Video size={17} /></span><span><strong>Create a meeting</strong><small>Schedule or start a new meeting</small></span><ArrowUpRight size={15} /></Link>
          <Link to="/settings" className="admin-quick-action"><span className="admin-quick-icon green"><Settings size={17} /></span><span><strong>Meeting defaults</strong><small>Manage workspace preferences</small></span><ArrowUpRight size={15} /></Link>
        </article>
      </section>

      <section className="admin-panel admin-recent-panel">
        <div className="admin-panel-heading">
          <div><h2>Recent meetings</h2><p>A quick look at the latest activity</p></div>
          <Link to="/meetings" className="admin-text-link">View all meetings <ArrowUpRight size={14} /></Link>
        </div>
        <MeetingTable meetings={data?.recentMeetings || []} compact />
      </section>
    </AdminLayout>
  );
}

function MeetingTable({ meetings, compact = false, onEdit, onDelete }) {
  if (!meetings.length) return <div className="admin-empty-state"><Video size={22} /><strong>No meetings yet</strong><span>New meetings will show up here.</span></div>;
  return (
    <div className="admin-table-wrap">
      <table className="admin-table">
        <thead><tr><th>MEETING</th><th>HOST</th><th>STATUS</th><th>{compact ? 'CREATED' : 'SCHEDULED'}</th>{!compact && <th aria-label="Actions" />}</tr></thead>
        <tbody>{meetings.map((meeting) => (
          <tr key={meeting._id || meeting.roomCode}>
            <td><span className="admin-table-primary">{meeting.title}</span><span className="admin-table-secondary">#{meeting.roomCode}</span></td>
            <td><span className="admin-host-cell"><span>{(meeting.host?.name || meeting.hostName || 'H').charAt(0).toUpperCase()}</span>{meeting.host?.name || meeting.hostName || 'Meeting host'}</span></td>
            <td><span className={`admin-status ${meeting.status}`}>{meeting.status}</span></td>
            <td>{formatDate(compact ? meeting.createdAt : (meeting.scheduledFor || meeting.createdAt))}</td>
            {!compact && <td><div className="admin-row-actions"><button aria-label="Edit meeting" onClick={() => onEdit(meeting)}><Pencil size={15} /></button><button className="danger" aria-label="Delete meeting" onClick={() => onDelete(meeting)}><Trash2 size={15} /></button></div></td>}
          </tr>
        ))}</tbody>
      </table>
    </div>
  );
}

function UsersPage() {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await api.admin.getUsers(`search=${encodeURIComponent(search)}&page=${page}`);
      setUsers(result.data.users || []);
      setPagination(result.data.pagination || { page: 1, pages: 1, total: 0 });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const removeUser = async (selected) => {
    const currentUserId = currentUser?._id || currentUser?.id;
    if ((selected._id || selected.id) === currentUserId) {
      setError('You cannot delete your own administrator account.');
      return;
    }
    if (!window.confirm(`Delete ${selected.name}? This cannot be undone.`)) return;
    try {
      await api.admin.deleteUser(selected._id || selected.id);
      setUsers((items) => items.filter((item) => item._id !== selected._id));
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <AdminLayout title="Users" description="Manage workspace members, permissions, and accounts."
      action={<Link to="/users/create" className="admin-primary-button"><Plus size={16} /> Add user</Link>}>
      <ErrorBanner>{error}</ErrorBanner>
      <section className="admin-panel admin-list-panel">
        <div className="admin-list-toolbar">
          <div><h2>All users <span className="admin-count-badge">{pagination.total}</span></h2><p>People with access to your workspace</p></div>
          <label className="admin-search"><Search size={16} /><input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Search users..." /></label>
        </div>
        {loading ? <div className="admin-loading">Loading users…</div> : users.length === 0 ? (
          <div className="admin-empty-state"><Users size={22} /><strong>No users found</strong><span>Try another search or add a new user.</span></div>
        ) : (
          <div className="admin-table-wrap"><table className="admin-table">
            <thead><tr><th>USER</th><th>ROLE</th><th>JOINED</th><th>LAST UPDATED</th><th aria-label="Actions" /></tr></thead>
            <tbody>{users.map((member) => (
              <tr key={member._id}>
                <td><span className="admin-member-cell"><span className="admin-member-avatar">{member.name?.charAt(0).toUpperCase()}</span><span><strong>{member.name}</strong><small>{member.email}</small></span></span></td>
                <td><span className={`admin-role-pill ${member.role}`}>{member.role === 'admin' && <ShieldCheck size={12} />}{member.role}</span></td>
                <td>{formatDate(member.createdAt)}</td><td>{formatDate(member.updatedAt)}</td>
                <td><div className="admin-row-actions"><button aria-label={`Edit ${member.name}`} onClick={() => navigate(`/users/${member._id}/edit`)}><Pencil size={15} /></button><button className="danger" aria-label={`Delete ${member.name}`} onClick={() => removeUser(member)}><Trash2 size={15} /></button></div></td>
              </tr>
            ))}</tbody>
          </table></div>
        )}
        {!loading && pagination.pages > 1 && (
          <div className="admin-pagination"><span>Page {pagination.page} of {pagination.pages}</span><div><button disabled={page <= 1} onClick={() => setPage((value) => value - 1)} aria-label="Previous users page"><ChevronLeft size={15} /></button><button disabled={page >= pagination.pages} onClick={() => setPage((value) => value + 1)} aria-label="Next users page"><ChevronRight size={15} /></button></div></div>
        )}
      </section>
    </AdminLayout>
  );
}

function UserFormPage({ editing, userId }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'user' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(editing);

  useEffect(() => {
    if (!editing) return;
    let cancelled = false;
    const loadUser = async () => {
      try {
        const result = await api.admin.getUser(userId);
        if (cancelled) return;
        const member = result.data.user;
        setForm({ name: member.name, email: member.email, password: '', role: member.role });
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    loadUser();
    return () => { cancelled = true; };
  }, [editing, userId]);

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = { ...form };
      if (editing && !payload.password) delete payload.password;
      if (editing) await api.admin.updateUser(userId, payload);
      else await api.admin.createUser(payload);
      navigate('/users');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout title={editing ? 'Edit user' : 'Create user'} description={editing ? 'Update this account and its workspace permissions.' : 'Create a workspace account and choose its access level.'}>
      <ErrorBanner>{error}</ErrorBanner>
      {loading ? <div className="admin-panel admin-loading">Loading user…</div> : <form className="admin-panel admin-form" onSubmit={submit}>
        <div className="admin-form-section"><div><h2>Account details</h2><p>Basic information used for this account.</p></div>
          <div className="admin-form-grid">
            <label>Full name<input required maxLength={60} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="e.g. Jordan Lee" /></label>
            <label>Email address<input required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="name@company.com" /></label>
            <label>{editing ? 'New password (optional)' : 'Temporary password'}<input required={!editing} minLength={6} type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder={editing ? 'Leave blank to keep current password' : 'At least 6 characters'} /></label>
            <label>Workspace role<select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })}><option value="user">User</option><option value="admin">Administrator</option></select></label>
          </div>
        </div>
        <div className="admin-form-footer"><Link className="admin-secondary-button" to="/users"><X size={15} /> Cancel</Link><button className="admin-primary-button" disabled={saving}>{saving ? 'Saving…' : <><Check size={16} /> {editing ? 'Save changes' : 'Create user'}</>}</button></div>
      </form>}
    </AdminLayout>
  );
}

function MeetingsPage() {
  const navigate = useNavigate();
  const [meetings, setMeetings] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

  const loadMeetings = useCallback(async () => {
    setLoading(true);
    try {
      const result = await api.admin.getMeetings(`page=${page}`);
      setMeetings(result.data.meetings || []);
      setPagination(result.data.pagination || { page: 1, pages: 1, total: 0 });
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [page]);
  useEffect(() => { loadMeetings(); }, [loadMeetings]);

  const removeMeeting = async (meeting) => {
    if (!window.confirm(`Delete "${meeting.title}" and its meeting history?`)) return;
    try {
      await api.admin.deleteMeeting(meeting.roomCode);
      setMeetings((items) => items.filter((item) => item.roomCode !== meeting.roomCode));
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <AdminLayout title="Meetings" description="Review, schedule, and manage meetings across the workspace."
      action={<Link to="/meetings/create" className="admin-primary-button"><Plus size={16} /> New meeting</Link>}>
      <ErrorBanner>{error}</ErrorBanner>
      <section className="admin-panel admin-list-panel">
        <div className="admin-list-toolbar"><div><h2>All meetings <span className="admin-count-badge">{pagination.total}</span></h2><p>Workspace meeting directory</p></div><span className="admin-period-chip"><Clock3 size={14} /> Most recent</span></div>
        {loading ? <div className="admin-loading">Loading meetings…</div> : <MeetingTable meetings={meetings} onEdit={(meeting) => navigate(`/meetings/${meeting.roomCode}/edit`)} onDelete={removeMeeting} />}
        {!loading && pagination.pages > 1 && (
          <div className="admin-pagination"><span>Page {pagination.page} of {pagination.pages}</span><div><button disabled={page <= 1} onClick={() => setPage((value) => value - 1)} aria-label="Previous meetings page"><ChevronLeft size={15} /></button><button disabled={page >= pagination.pages} onClick={() => setPage((value) => value + 1)} aria-label="Next meetings page"><ChevronRight size={15} /></button></div></div>
        )}
      </section>
    </AdminLayout>
  );
}

function MeetingFormPage({ editing, roomCode }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({ title: '', description: '', hostName: '', status: 'active', scheduledFor: '', maxParticipants: 50, settings: initialDefaults });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(editing);

  useEffect(() => {
    if (!editing) {
      api.admin.getSettings()
        .then((result) => setForm((current) => ({
          ...current,
          maxParticipants: result.data.settings.defaultMaxParticipants || 50,
          settings: { ...initialDefaults, ...result.data.settings.defaultMeetingSettings },
        })))
        .catch((err) => setError(err.message));
      return;
    }
    let cancelled = false;
    const loadMeeting = async () => {
      try {
        const result = await api.admin.getMeeting(roomCode);
        if (cancelled) return;
        const meeting = result.data.meeting;
        setForm({
          title: meeting.title || '',
          description: meeting.description || '',
          hostName: meeting.hostName || '',
          status: meeting.status || 'active',
          scheduledFor: dateInputValue(meeting.scheduledFor),
          maxParticipants: meeting.maxParticipants || 50,
          settings: { ...initialDefaults, ...meeting.settings },
        });
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    loadMeeting();
    return () => { cancelled = true; };
  }, [editing, roomCode]);

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    const payload = {
      ...form,
      maxParticipants: Number(form.maxParticipants),
      scheduledFor: form.scheduledFor ? new Date(form.scheduledFor).toISOString() : null,
    };
    try {
      if (editing) await api.admin.updateMeeting(roomCode, payload);
      else await api.admin.createMeeting(payload);
      navigate('/meetings');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleMeetingSetting = (key) => setForm((current) => ({
    ...current,
    settings: { ...current.settings, [key]: !current.settings[key] },
  }));

  return (
    <AdminLayout title={editing ? 'Edit meeting' : 'Create meeting'} description={editing ? `Update settings for #${roomCode}.` : 'Set up a meeting for your workspace.'}>
      <ErrorBanner>{error}</ErrorBanner>
      {loading ? <div className="admin-panel admin-loading">Loading meeting…</div> : <form className="admin-panel admin-form" onSubmit={submit}>
        <div className="admin-form-section"><div><h2>Meeting details</h2><p>Choose a title, host, and meeting schedule.</p></div>
          <div className="admin-form-grid">
            <label>Meeting title<input required maxLength={100} value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Weekly team sync" /></label>
            <label>Host name<input value={form.hostName} onChange={(event) => setForm({ ...form, hostName: event.target.value })} placeholder="Meeting host" /></label>
            <label>Schedule for<input type="datetime-local" value={form.scheduledFor} onChange={(event) => setForm({ ...form, scheduledFor: event.target.value, status: event.target.value ? 'scheduled' : form.status })} /></label>
            <label>Participant limit<input type="number" min="2" max="500" required value={form.maxParticipants} onChange={(event) => setForm({ ...form, maxParticipants: event.target.value })} /></label>
            {editing && <label>Meeting status<select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}><option value="active">Active</option><option value="scheduled">Scheduled</option><option value="ended">Ended</option></select></label>}
            <label className="admin-form-full">Description<textarea rows="4" maxLength={500} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Add a short description (optional)" /></label>
          </div>
        </div>
        <div className="admin-form-section admin-form-settings-section">
          <div><h2>Meeting permissions</h2><p>Choose which features and access controls apply to this meeting.</p></div>
          <MeetingSettingsFields settings={form.settings} onChange={toggleMeetingSetting} />
        </div>
        <div className="admin-form-footer"><Link className="admin-secondary-button" to="/meetings"><X size={15} /> Cancel</Link><button className="admin-primary-button" disabled={saving}>{saving ? 'Saving…' : <><Check size={16} /> {editing ? 'Save changes' : 'Create meeting'}</>}</button></div>
      </form>}
    </AdminLayout>
  );
}

function SettingsPage() {
  const [settings, setSettings] = useState({ defaultMaxParticipants: 50, defaultMeetingSettings: initialDefaults });
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.admin.getSettings()
      .then((result) => {
        const saved = result.data.settings;
        setSettings({
          defaultMaxParticipants: saved.defaultMaxParticipants ?? 50,
          defaultMeetingSettings: { ...initialDefaults, ...saved.defaultMeetingSettings },
        });
      })
      .catch((err) => setError(err.message));
  }, []);

  const save = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const result = await api.admin.updateSettings(settings);
      setSettings({
        defaultMaxParticipants: result.data.settings.defaultMaxParticipants,
        defaultMeetingSettings: { ...initialDefaults, ...result.data.settings.defaultMeetingSettings },
      });
      setNotice('Workspace defaults saved. New meetings will use these settings.');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleSetting = (key) => setSettings((current) => ({
    ...current,
    defaultMeetingSettings: {
      ...current.defaultMeetingSettings,
      [key]: !current.defaultMeetingSettings[key],
    },
  }));
  return (
    <AdminLayout title="Settings" description="Configure defaults for new meetings in your workspace.">
      <ErrorBanner>{error}</ErrorBanner>
      {notice && <div className="admin-success-banner"><Check size={15} />{notice}</div>}
      <form className="admin-settings-layout" onSubmit={save}>
        <section className="admin-panel admin-settings-panel">
          <div className="admin-panel-heading"><div><h2>Meeting defaults</h2><p>These defaults apply when a new meeting is created.</p></div></div>
          <label className="admin-limit-setting"><span><strong>Maximum participants</strong><small>Default capacity for each new meeting (2–500).</small></span><input type="number" min="2" max="500" required value={settings.defaultMaxParticipants} onChange={(event) => setSettings({ ...settings, defaultMaxParticipants: event.target.value })} /></label>
          <div className="admin-settings-divider" />
          {meetingSettingOptions.map(([key, label, description]) => (
            <label className="admin-switch-setting" key={key}>
              <span><strong>{label}</strong><small>{description}</small></span>
              <input type="checkbox" checked={Boolean(settings.defaultMeetingSettings[key])} onChange={() => toggleSetting(key)} />
              <i className="admin-switch" />
            </label>
          ))}
          <div className="admin-settings-footer"><span>Defaults are applied to newly created meetings.</span><button className="admin-primary-button" disabled={saving}>{saving ? 'Saving…' : <><Check size={16} /> Save settings</>}</button></div>
        </section>
        <aside className="admin-settings-note"><ShieldCheck size={18} /><strong>Workspace-wide defaults</strong><p>These options affect meetings created after saving. Hosts can still adjust meeting permissions when available.</p></aside>
      </form>
    </AdminLayout>
  );
}

export default function AdminPage() {
  const location = useLocation();
  const params = useParams();
  const pathname = location.pathname;
  if (pathname === '/users') return <UsersPage />;
  if (pathname === '/users/create') return <UserFormPage key="create-user" editing={false} />;
  if (pathname.startsWith('/users/') && pathname.endsWith('/edit')) return <UserFormPage key={params.userId} editing userId={params.userId} />;
  if (pathname === '/meetings') return <MeetingsPage />;
  if (pathname === '/meetings/create') return <MeetingFormPage key="create-meeting" editing={false} />;
  if (pathname.startsWith('/meetings/') && pathname.endsWith('/edit')) return <MeetingFormPage key={params.roomCode} editing roomCode={params.roomCode} />;
  if (pathname === '/settings') return <SettingsPage />;
  return <AdminOverview />;
}
