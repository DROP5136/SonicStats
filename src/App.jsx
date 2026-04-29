import { useState, useCallback, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import DashboardPage from './pages/DashboardPage';
import AlbumsPage from './pages/AlbumsPage';
import AlbumDetailPage from './pages/AlbumDetailPage';
import ActivityPage from './pages/ActivityPage';
import ProfilePage from './pages/ProfilePage';

export default function App() {
  const [activePage, setActivePage] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [albumDetailId, setAlbumDetailId] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [albumsSearchTerm, setAlbumsSearchTerm] = useState('');
  const [navbarSearchValue, setNavbarSearchValue] = useState('');

  useEffect(() => {
    const initialState = {
      activePage: 'dashboard',
      albumDetailId: null,
      albumsSearchTerm: ''
    };

    window.history.replaceState(initialState, '', window.location.pathname);

    const handlePopState = (event) => {
      const state = event.state || initialState;
      setActivePage(state.activePage || 'dashboard');
      setAlbumDetailId(state.albumDetailId || null);
      setAlbumsSearchTerm(state.albumsSearchTerm || '');
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const pushNavigationState = useCallback((nextState, replace = false) => {
    const state = {
      activePage,
      albumDetailId,
      albumsSearchTerm,
      ...nextState
    };

    if (replace) {
      window.history.replaceState(state, '', window.location.pathname);
    } else {
      window.history.pushState(state, '', window.location.pathname);
    }

    setActivePage(state.activePage || 'dashboard');
    setAlbumDetailId(state.albumDetailId || null);
    setAlbumsSearchTerm(state.albumsSearchTerm || '');
  }, [activePage, albumDetailId, albumsSearchTerm]);

  const handleAlbumReviewUpdated = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  const handleChangePage = useCallback((pageId) => {
    pushNavigationState({
      activePage: pageId,
      albumDetailId: null,
      albumsSearchTerm: pageId === 'albums' ? albumsSearchTerm : ''
    });
    setSidebarOpen(false);
  }, [albumsSearchTerm, pushNavigationState]);

  const handleToggleSidebar = useCallback(() => {
    setSidebarOpen((prev) => !prev);
  }, []);

  const handleOverlayClick = useCallback(() => {
    setSidebarOpen(false);
  }, []);

  const handleNavigateAlbum = useCallback((id) => {
    pushNavigationState({
      activePage: 'album-detail',
      albumDetailId: id
    });
  }, [pushNavigationState]);

  const handleBackFromDetail = useCallback(() => {
    pushNavigationState({
      activePage: 'albums',
      albumDetailId: null
    });
  }, [pushNavigationState]);

  const handleSearchSubmit = useCallback(() => {
    const query = navbarSearchValue.trim();
    if (!query) return;

    pushNavigationState({
      activePage: 'albums',
      albumDetailId: null,
      albumsSearchTerm: query
    });
    setSidebarOpen(false);
  }, [navbarSearchValue, pushNavigationState]);

  function renderPage() {
    if (activePage === 'album-detail' && albumDetailId) {
      return <AlbumDetailPage albumId={albumDetailId} onBack={handleBackFromDetail} onReviewUpdated={handleAlbumReviewUpdated} />;
    }
    switch (activePage) {
      case 'dashboard':
        return <DashboardPage onNavigateAlbum={handleNavigateAlbum} refreshKey={refreshKey} />;
      case 'albums':
        return <AlbumsPage onNavigateAlbum={handleNavigateAlbum} initialSearchTerm={albumsSearchTerm} />;
      case 'activity':
        return <ActivityPage />;
      case 'profile':
        return <ProfilePage />;
      default:
        return <DashboardPage onNavigateAlbum={handleNavigateAlbum} />;
    }
  }

  return (
    <div className="app-shell">
      <div
        className={`mobile-overlay${sidebarOpen ? ' visible' : ''}`}
        onClick={handleOverlayClick}
        id="mobile-overlay"
      />
      <Sidebar
        activePage={activePage === 'album-detail' ? 'albums' : activePage}
        onChangePage={handleChangePage}
        isOpen={sidebarOpen}
      />
      <div className="main-area">
        <Navbar
          onToggleSidebar={handleToggleSidebar}
          searchValue={navbarSearchValue}
          onSearchChange={setNavbarSearchValue}
          onSearchSubmit={handleSearchSubmit}
          onNavigateBack={() => window.history.back()}
          onNavigateForward={() => window.history.forward()}
        />
        <div className="page-content" id="page-content">
          {renderPage()}
        </div>
      </div>
    </div>
  );
}
