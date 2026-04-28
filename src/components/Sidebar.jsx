import {
  IconDashboard,
  IconAlbum,
  IconActivity,
  IconUser,
  IconWaveform,
} from './Icons';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: IconDashboard },
  { id: 'albums',    label: 'Albums',    icon: IconAlbum },
  { id: 'activity',  label: 'Activity',  icon: IconActivity },
  { id: 'profile',   label: 'Profile',   icon: IconUser },
];

export default function Sidebar({ activePage, onChangePage, isOpen }) {
  return (
    <aside className={`sidebar${isOpen ? ' open' : ''}`} id="sidebar">
      {/* Brand */}
      <div className="sidebar-brand">
        <div className="brand-icon">
          <IconWaveform />
        </div>
        <span className="brand-name">
          Sonic<span>Stats</span>
        </span>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav" aria-label="Primary navigation">
        <span className="nav-section-label">Menu</span>
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            id={`nav-${id}`}
            type="button"
            className={`nav-btn${activePage === id ? ' active' : ''}`}
            onClick={() => onChangePage(id)}
          >
            <Icon />
            <span>{label}</span>
          </button>
        ))}
      </nav>

      {/* Footer User */}
      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-user-avatar">LK</div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">Lakshay</div>
            <div className="sidebar-user-plan">Premium</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
