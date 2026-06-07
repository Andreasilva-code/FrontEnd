'use client';

import React, { useState, useEffect } from 'react';
import { Layout, Menu, Button, Avatar, theme as antTheme, Space, Divider, Tooltip } from 'antd';
import { 
  MenuOutlined,
  HomeOutlined,
  UsergroupAddOutlined,
  FileTextOutlined,
  SettingOutlined,
  BellOutlined,
  LogoutOutlined,
  UserOutlined,
  SearchOutlined,
  CustomerServiceOutlined,
  TeamOutlined,
  CarOutlined,
  CoffeeOutlined,
  TruckOutlined
} from '@ant-design/icons';
import { MapPin, Phone, Mail, Info, Link as LinkIcon, ExternalLink, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

const { Header, Sider, Content, Footer } = Layout;

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [rol, setRol] = useState<string>('Propietario');
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuth();
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = antTheme.useToken();

  useEffect(() => {
    if (isAuthenticated && user?.rol) {
      const formattedRol = user.rol.charAt(0).toUpperCase() + user.rol.slice(1);
      setRol(formattedRol);
    } else {
      setRol('Propietario');
    }
  }, [user, isAuthenticated]);

  const userRole = user?.rol?.toLowerCase();
  const isVigilante = userRole === 'vigilante';
  const isAdmin = userRole === 'administrador';

  const menuItems = [
    // Muro Social: visible para todos (autenticados o no)
    {
      key: '/',
      icon: <HomeOutlined className="text-lg" />,
      label: <span className="font-medium">Muro Social</span>,
    },
    // PQRS: visible para todos los usuarios autenticados
    ...(isAuthenticated ? [
      {
        key: '/pqrs',
        icon: <FileTextOutlined className="text-lg" />,
        label: <span className="font-medium">PQRS</span>,
      },
    ] : []),
    // Parqueadero de Visitante: solo Admin y Vigilante
    ...((isAdmin || isVigilante) ? [
      {
        key: '/visitor-parking',
        icon: <CarOutlined className="text-lg" />,
        label: <span className="font-medium">Parqueadero de Visitante</span>,
      },
    ] : []),
    // Resto del menú: solo Admin (no vigilante, no propietario)
    ...(isAuthenticated && !isVigilante ? [
      {
        key: '/residents',
        icon: <UsergroupAddOutlined className="text-lg" />,
        label: <span className="font-medium">Residentes</span>,
      },
      {
        key: '/documents',
        icon: <FileTextOutlined className="text-lg" />,
        label: <span className="font-medium">Documentos</span>,
      },
      {
        key: '/requests',
        icon: <CustomerServiceOutlined className="text-lg" />,
        label: <span className="font-medium">Solicitudes</span>,
        children: [
          {
            key: '/requests/parking',
            icon: <CarOutlined />,
            label: <span className="font-medium">Solicitudes Parqueaderos</span>,
          },
          {
            key: '/requests/social-hall',
            icon: <CoffeeOutlined />,
            label: <span className="font-medium">Solicitudes Salón Social</span>,
          },
          {
            key: '/requests/moving',
            icon: <TruckOutlined />,
            label: <span className="font-medium">Solicitudes Trasteos</span>,
          },
        ]
      },
      {
        key: '/staff',
        icon: <TeamOutlined className="text-lg" />,
        label: <span className="font-medium">Funcionarios</span>,
      },
      {
        key: '/settings',
        icon: <SettingOutlined className="text-lg" />,
        label: <span className="font-medium">Configuración</span>,
      },
    ] : []),
  ];

  return (
    <Layout className="min-h-screen bg-[#f8fafc]">
      <Sider 
        trigger={null} 
        collapsible 
        collapsed={collapsed}
        breakpoint="lg"
        collapsedWidth="0"
        onBreakpoint={(broken) => {
          if (broken) {
            setCollapsed(true);
          }
        }}
        width={300}
        theme="dark"
        className="sticky top-0 h-screen z-50 border-r border-slate-800 shadow-2xl transition-all duration-300 ease-in-out"
        style={{ background: '#1e293b' }}
      >
        <div className="flex flex-col h-full py-6">
          {/* Logo Area */}
          <div className="px-6 mb-8">
            <Link href="/" className="flex items-center gap-3 no-underline">
              <img 
                src="/logo.png" 
                alt="Logo" 
                className="w-10 h-10 object-contain" 
              />
              {!collapsed && (
                <div className="flex flex-col">
                  <span className="text-white font-bold text-lg leading-tight">Prados II</span>
                  <span className="text-emerald-400 text-[10px] font-bold tracking-widest uppercase">Admin System</span>
                </div>
              )}
            </Link>
          </div>

          <div className="px-4 mb-4">
            {!collapsed && <div className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-4 px-2">Menu Principal</div>}
            <Menu
              theme="dark"
              mode="inline"
              selectedKeys={[pathname]}
              defaultOpenKeys={['/requests']}
              items={(() => {
                const mapMenuItems = (items: any[]): any[] => items.map(item => ({
                  ...item,
                  label: item.children ? (
                    <span className="font-medium">{item.label}</span>
                  ) : (
                    <Link href={item.key}>{item.label}</Link>
                  ),
                  children: item.children ? mapMenuItems(item.children) : undefined
                }));
                return mapMenuItems(menuItems);
              })()}
              className="bg-transparent border-none space-y-1"
              style={{ background: 'transparent' }}
            />
          </div>

          <div className="mt-auto px-6">
            {!collapsed && (
              <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700/50">
                <div className="flex items-center gap-2 mb-2 text-emerald-400">
                  <ShieldCheck size={16} />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Soporte Activo</span>
                </div>
                <p className="text-slate-400 text-[11px] leading-relaxed mb-3">
                  ¿Necesitas ayuda con el sistema? Contacta con administración.
                </p>
                <Button size="small" block className="bg-slate-700 border-none text-white text-[11px] font-bold hover:bg-slate-600">
                  Ver Guía
                </Button>
              </div>
            )}
          </div>
        </div>
      </Sider>

      <Layout className="transition-all duration-300">
        <Header 
          className="flex justify-between items-center px-6 sticky top-0 z-40 transition-all duration-300"
          style={{ 
            background: 'rgba(255, 255, 255, 0.8)', 
            backdropFilter: 'blur(12px)',
            borderBottom: '1px solid #e2e8f0',
            height: '72px',
            lineHeight: '72px'
          }}
        >
          <div className="flex items-center gap-4">
            <Button
              type="text"
              icon={<MenuOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              className="hover:bg-slate-100 rounded-xl"
              style={{ width: 44, height: 44 }}
            />
            <div className="hidden sm:flex flex-col justify-center leading-tight">
              <h1 className="text-lg font-bold text-slate-800 m-0">
                {isAuthenticated ? `Panel de ${rol}` : 'Portal Residencial'}
              </h1>
              <span className="text-slate-400 text-xs font-medium">Gestiona tu comunidad con facilidad</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden lg:flex items-center bg-slate-100 rounded-xl px-3 py-1 mr-4 border border-slate-200">
              <SearchOutlined className="text-slate-400 mr-2" />
              <input 
                type="text" 
                placeholder="Buscar..." 
                className="bg-transparent border-none outline-none text-sm text-slate-600 w-40 h-8"
              />
            </div>

            {!isAuthenticated ? (
              <div className="flex items-center gap-4">
                <Link href="/login">
                  <Button type="text" className="font-semibold text-slate-600 hover:text-emerald-600">Entrar</Button>
                </Link>
                <Link href="/register">
                  <Button type="primary" className="bg-emerald-500 shadow-md shadow-emerald-500/20 font-bold px-6">Crear Cuenta</Button>
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Tooltip title="Notificaciones">
                  <Button type="text" icon={<BellOutlined className="text-xl text-slate-500" />} className="rounded-xl" />
                </Tooltip>
                
                <Divider orientation="vertical" className="h-8 border-slate-200 mx-1" />
                
                <div className="flex items-center gap-3 pl-2">
                  <div className="hidden sm:flex flex-col items-end leading-none">
                    <span className="text-sm font-bold text-slate-800">{user?.nombreUsuario}</span>
                    <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-tighter">{rol}</span>
                  </div>
                  <Avatar 
                    size={40}
                    className="bg-emerald-500 shadow-md shadow-emerald-500/20 cursor-pointer border-2 border-white"
                    icon={<UserOutlined />}
                  >
                    {user?.nombreUsuario?.charAt(0).toUpperCase()}
                  </Avatar>
                  <Button 
                    type="text" 
                    danger 
                    icon={<LogoutOutlined />} 
                    onClick={logout}
                    className="rounded-xl hover:bg-red-50"
                  />
                </div>
              </div>
            )}
          </div>
        </Header>

        <Content className="p-6 sm:p-8 min-h-[calc(100vh-144px)]">
          <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
            {children}
          </div>
        </Content>

        <Footer className="bg-white border-t border-slate-200 py-12 px-6 sm:px-12">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
              <div className="md:col-span-1">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                    <img src="/logo.png" alt="Logo" className="w-5 h-5 object-contain brightness-0 invert" />
                  </div>
                  <span className="text-slate-900 font-bold text-lg">Prados II</span>
                </div>
                <p className="text-slate-500 text-sm leading-relaxed">
                  Comprometidos con la excelencia en la administración residencial y la convivencia ciudadana.
                </p>
              </div>

              <div>
                <h4 className="text-slate-900 font-bold mb-6 flex items-center gap-2">
                  <Info size={16} className="text-emerald-500" /> Legal
                </h4>
                <div className="text-slate-500 text-sm space-y-2">
                  <p className="font-bold text-slate-800">Conjunto Prados 2</p>
                  <p>NIT: 900.730.308-1</p>
                  <p className="text-xs pt-2">Vigilado por Superintendencia de Vigilancia y Seguridad Privada.</p>
                </div>
              </div>

              <div>
                <h4 className="text-slate-900 font-bold mb-6 flex items-center gap-2">
                  <MapPin size={16} className="text-emerald-500" /> Contacto
                </h4>
                <div className="text-slate-500 text-sm space-y-3">
                  <div className="flex items-start gap-2">
                    <MapPin size={14} className="mt-1 text-slate-400" />
                    <p>CRA 11 N° 65C-80 SUR<br/>Bogotá, Portal Usme</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone size={14} className="text-slate-400" />
                    <p>3025934391</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail size={14} className="text-slate-400" />
                    <p>cr.pradosii@hotmail.com</p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-slate-900 font-bold mb-6 flex items-center gap-2">
                  <LinkIcon size={16} className="text-emerald-500" /> Enlaces
                </h4>
                <nav className="flex flex-col gap-3 text-sm">
                  <Link href="/" className="text-slate-500 hover:text-emerald-600 transition-colors">Muro Social</Link>
                  <Link href="/reglamento" className="text-slate-500 hover:text-emerald-600 transition-colors">Reglamento</Link>
                  <Link href="/contacto" className="text-slate-500 hover:text-emerald-600 transition-colors">Contacto</Link>
                </nav>
              </div>
            </div>

            <div className="pt-8 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4 text-slate-400 text-xs font-medium">
              <p>&copy; {new Date().getFullYear()} Conjunto Residencial Prados II. Todos los derechos reservados.</p>
              <div className="flex gap-6">
                <span className="hover:text-slate-600 cursor-pointer">Privacidad</span>
                <span className="hover:text-slate-600 cursor-pointer">Términos</span>
                <span className="hover:text-slate-600 cursor-pointer">Seguridad</span>
              </div>
            </div>
          </div>
        </Footer>
      </Layout>

      {/* Global styles to allow menu text to wrap completely without truncation */}
      <style jsx global>{`
        .ant-menu-title-content {
          white-space: normal !important;
          line-height: 1.3 !important;
        }
        .ant-menu-inline .ant-menu-item,
        .ant-menu-inline .ant-menu-submenu-title {
          height: auto !important;
          padding-top: 10px !important;
          padding-bottom: 10px !important;
          display: flex !important;
          align-items: center !important;
        }
        .ant-menu-inline .ant-menu-item-icon {
          margin-top: 0 !important;
        }
      `}</style>
    </Layout>
  );
}
