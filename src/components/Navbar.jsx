import {
  IconSearch,
  IconBell,
  IconChevronLeft,
  IconChevronRight,
  IconMenu,
} from './Icons';

export default function Navbar({
  onToggleSidebar,
  searchValue,
  onSearchChange,
  onSearchSubmit,
  onNavigateBack,
  onNavigateForward,
}) {
  return (
    <header className="navbar" id="navbar">
      <div className="navbar-left">
        {/* Mobile hamburger */}
        <button
          type="button"
          className="mobile-menu-btn"
          onClick={onToggleSidebar}
          aria-label="Toggle menu"
          id="mobile-menu-toggle"
        >
          <IconMenu />
        </button>

        {/* History nav arrows */}
        <div className="nav-history">
          <button type="button" className="nav-circle-btn" aria-label="Go back" id="nav-back" onClick={onNavigateBack}>
            <IconChevronLeft />
          </button>
          <button type="button" className="nav-circle-btn" aria-label="Go forward" id="nav-forward" onClick={onNavigateForward}>
            <IconChevronRight />
          </button>
        </div>

        {/* Search */}
        <form className="search-bar" id="search-container" onSubmit={(e) => { e.preventDefault(); onSearchSubmit?.(); }}>
          <input
            type="text"
            placeholder="Search albums, artists, reviews…"
            aria-label="Search"
            id="search-input"
            value={searchValue}
            onChange={(e) => onSearchChange?.(e.target.value)}
          />
          <button type="submit" className="search-submit-btn" aria-label="Search albums">
            <IconSearch />
          </button>
        </form>
      </div>

      <div className="navbar-right">
        <button type="button" className="navbar-icon-btn" aria-label="Notifications" id="notifications-btn">
          <IconBell />
          <span className="notification-dot" />
        </button>
        <div className="navbar-avatar" id="navbar-avatar" title="Lakshay">
          LK
        </div>
      </div>
    </header>
  );
}
