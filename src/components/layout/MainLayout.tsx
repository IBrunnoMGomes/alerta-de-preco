
import React from 'react';
import { NavLink } from 'react-router-dom';
import { Bell, BarChart2, ShoppingBag, Settings, Search, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import { useState } from 'react';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  const isMobile = useIsMobile();
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  const navLinks = [
    { path: '/', label: 'Dashboard', icon: <BarChart2 className="mr-2 h-4 w-4" /> },
    { path: '/products', label: 'Produtos', icon: <ShoppingBag className="mr-2 h-4 w-4" /> },
    { path: '/notifications', label: 'Notificações', icon: <Bell className="mr-2 h-4 w-4" /> },
    { path: '/settings', label: 'Configurações', icon: <Settings className="mr-2 h-4 w-4" /> },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="container mx-auto flex justify-between items-center h-16 px-4">
          <div className="flex items-center">
            {isMobile && (
              <Button variant="ghost" size="icon" onClick={toggleMenu} className="mr-2">
                {menuOpen ? <X size={20} /> : <Menu size={20} />}
              </Button>
            )}
            <NavLink to="/" className="flex items-center text-brand-primary font-bold text-xl">
              <span className="bg-brand-primary text-white p-1 rounded mr-2">PW</span>
              PriceWatch
            </NavLink>
          </div>
          
          {!isMobile && (
            <nav className="flex-1 ml-10">
              <ul className="flex space-x-6">
                {navLinks.map((link) => (
                  <li key={link.path}>
                    <NavLink 
                      to={link.path} 
                      className={({ isActive }) => 
                        `flex items-center px-3 py-2 rounded-md transition-colors ${
                          isActive 
                            ? 'text-brand-primary bg-brand-light font-medium' 
                            : 'text-gray-600 hover:text-brand-primary hover:bg-gray-100'
                        }`
                      }
                    >
                      {link.icon}
                      {link.label}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </nav>
          )}

          <div className="flex items-center space-x-3">
            <Button variant="outline" size="icon" className="rounded-full">
              <Search className="h-4 w-4" />
            </Button>
            {/* Removed "Adicionar Produto" button */}
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      {isMobile && menuOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-20" onClick={toggleMenu}>
          <div 
            className="absolute top-16 left-0 w-64 bg-white h-full shadow-lg" 
            onClick={e => e.stopPropagation()}
          >
            <nav className="py-4">
              <ul className="space-y-2 px-3">
                {navLinks.map((link) => (
                  <li key={link.path}>
                    <NavLink 
                      to={link.path} 
                      className={({ isActive }) => 
                        `flex items-center px-4 py-3 rounded-md transition-colors ${
                          isActive 
                            ? 'text-brand-primary bg-brand-light font-medium' 
                            : 'text-gray-600 hover:text-brand-primary hover:bg-gray-100'
                        }`
                      }
                      onClick={toggleMenu}
                    >
                      {link.icon}
                      {link.label}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 container mx-auto py-6 px-4">
        {children}
      </main>

      {/* Footer */}
      <footer className="mt-auto bg-white border-t border-gray-200 py-4">
        <div className="container mx-auto text-center text-sm text-gray-500">
          <p>© 2025 PriceWatch - Monitoramento de Preços</p>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;
