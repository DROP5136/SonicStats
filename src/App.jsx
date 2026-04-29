import { useState, useCallback } from 'react';
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

  const handleAlbumReviewUpdated = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  const handleChangePage = useCallback((pageId) => {
    setActivePage(pageId);
    setAlbumDetailId(null);
    setSidebarOpen(false);
  }, []);

  const handleToggleSidebar = useCallback(() => {
    setSidebarOpen((prev) => !prev);
  }, []);

  const handleOverlayClick = useCallback(() => {
    setSidebarOpen(false);
  }, []);

  const handleNavigateAlbum = useCallback((id) => {
    setAlbumDetailId(id);
    setActivePage('album-detail');
  }, []);

  const handleBackFromDetail = useCallback(() => {
    setAlbumDetailId(null);
    setActivePage('albums');
  }, []);

  function renderPage() {
    if (activePage === 'album-detail' && albumDetailId) {
      return <AlbumDetailPage albumId={albumDetailId} onBack={handleBackFromDetail} onReviewUpdated={handleAlbumReviewUpdated} />;
    }
    switch (activePage) {
      case 'dashboard':
        return <DashboardPage onNavigateAlbum={handleNavigateAlbum} refreshKey={refreshKey} />;
      case 'albums':
        return <AlbumsPage onNavigateAlbum={handleNavigateAlbum} />;
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
        <Navbar onToggleSidebar={handleToggleSidebar} />
        <div className="page-content" id="page-content">
          {renderPage()}
        </div>
      </div>
    </div>
  );
}
