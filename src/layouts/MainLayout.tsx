import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Home, UserPlus, LogOut, BarChart3 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const MainLayout = () => {
  const navItems = [
    { label: 'Trang chủ', path: '/', icon: <Home size={24} /> },
    { label: 'Báo cáo', path: '/transactions', icon: <BarChart3 size={24} /> },
    { label: 'Thành viên', path: '/members', icon: <UserPlus size={24} /> },
  ];

  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Lỗi đăng xuất:', error);
    }
  };

  return (
    <div className="flex fixed inset-0 bg-gray-50 overflow-hidden text-gray-900">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200">
        <div className="p-6">
          <h1 className="text-xl font-bold text-brand flex items-center gap-2 whitespace-nowrap">
            <span className="bg-brand text-white p-1 rounded-md shrink-0">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L2 22h20L12 2z" fill="currentColor" />
              </svg>
            </span>
            Quản lý chi tiêu
          </h1>
        </div>
        <nav className="flex-1 px-4 space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'bg-brand/10 text-brand font-semibold'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`
              }
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        
        {/* User Info & Sign Out */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-xl">
             <div className="flex flex-col overflow-hidden">
                <span className="text-sm font-semibold text-gray-900 truncate">{user?.displayName || 'User'}</span>
                <span className="text-xs text-gray-500 truncate">{user?.email}</span>
             </div>
             <button 
                onClick={handleSignOut}
                className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Đăng xuất"
             >
               <LogOut size={20} />
             </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto pb-20 md:pb-0 relative flex flex-col">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between p-4 bg-white border-b border-gray-100 sticky top-0 z-40">
          <div className="flex items-center gap-2">
            <span className="bg-brand text-white p-1 rounded-md shrink-0">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L2 22h20L12 2z" fill="currentColor" />
              </svg>
            </span>
            <h1 className="text-lg font-bold text-brand">Quản lý chi tiêu</h1>
          </div>
          <div className="relative">
            <button 
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="flex items-center gap-2 bg-gray-50 py-1 px-3 rounded-full border border-gray-100 shadow-sm hover:bg-gray-100 transition-colors"
            >
              <span className="text-sm font-semibold text-gray-700 max-w-[100px] truncate">{user?.displayName || 'User'}</span>
              <div className="w-6 h-6 bg-brand text-white rounded-full flex items-center justify-center font-bold uppercase text-xs">
                {(user?.displayName || 'U').charAt(0)}
              </div>
            </button>
            
            {showMobileMenu && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowMobileMenu(false)}
                />
                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-50">
                  <button
                    onClick={() => {
                      setShowMobileMenu(false);
                      handleSignOut();
                    }}
                    className="w-full flex items-center gap-2 px-4 py-3 text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut size={18} />
                    <span className="font-medium text-sm">Đăng xuất</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </header>

        <div className="max-w-4xl mx-auto w-full p-4 md:p-8">
          <Outlet />
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-50">
        <div className="flex justify-around items-center h-16">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
                  isActive ? 'text-brand' : 'text-gray-400 hover:text-gray-600'
                }`
              }
            >
              {item.icon}
              <span className="text-[10px] font-medium">{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default MainLayout;
