'use client';

import React, { useState, useEffect } from 'react';
import { 
  Typography, 
  Card, 
  Button, 
  Segmented, 
  Form, 
  Input, 
  Select, 
  Table, 
  Tag, 
  Space, 
  Badge,
  Empty,
  App as AntdApp,
  Breadcrumb,
  Tooltip,
  Divider,
  Modal,
  Descriptions,
  DatePicker
} from 'antd';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { API_ROUTES } from '@/config/api';
import dayjs from 'dayjs';
import { 
  PlusOutlined, 
  HistoryOutlined, 
  CarOutlined, 
  SendOutlined,
  SearchOutlined,
  ReloadOutlined,
  IdcardOutlined,
  UserOutlined,
  ClockCircleOutlined,
  InfoCircleOutlined,
  FilePdfOutlined
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

interface VehiculoVisitante {
  idparqueaderovisitante: number;
  placa: string;
  nombres: string;
  cedula: string;
  tipoParqueadero: string;
  estado: number;
  horaIngreso: string | null;
  horaSalida: string | null;
  vigilanteIngreso: string | null;
  vigilanteSalida: string | null;
  tiempoParqueoReal?: string | null;
  valorParqueadero?: number | null;
  horasDescuento?: number | null;
  tiempoMenosDescuento?: number | null;
  tiempoParqueoConAproximacion?: number | null;
}

export default function VisitorParkingPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const { message } = AntdApp.useApp();
  const [form] = Form.useForm();
  
  const [activeView, setActiveView] = useState<'list' | 'new' | 'arqueo'>('list');
  const [loading, setLoading] = useState(false);
  const [visitorData, setVisitorData] = useState<VehiculoVisitante[]>([]);
  const [searchText, setSearchText] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [liquidationData, setLiquidationData] = useState<any>(null);
  const [loadingId, setLoadingId] = useState<number | null>(null);
  const [isConsultModalOpen, setIsConsultModalOpen] = useState(false);
  const [consultData, setConsultData] = useState<VehiculoVisitante | null>(null);
  const [arqueoData, setArqueoData] = useState<any>(null);
  const [arqueoLoading, setArqueoLoading] = useState(false);

  const handleLiquidar = async (record: VehiculoVisitante) => {
    setLoadingId(record.idparqueaderovisitante);
    const now = new Date();
    const payload = {
      placa: record.placa,
      horaIngreso: record.horaIngreso,
      horaSalida: formatLocalDatetime(now),
      vigilanteSalida: user?.nombreUsuario || 'Administrador'
    };

    try {
      const response = await fetch(`${API_ROUTES.VISITOR_PARKING}/liquidar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (response.ok && data && !data.error && response.status === 200) {
        setLiquidationData(data.body);
        setIsModalOpen(true);
      } else {
        message.error(data.body || data.mensaje || 'Error al liquidar el parqueadero.');
      }
    } catch (error) {
      console.error("Error al liquidar parqueadero:", error);
      message.error("Error de conexión al liquidar el parqueadero.");
    } finally {
      setLoadingId(null);
    }
  };

  const handleFinalize = () => {
    setIsModalOpen(false);
    setLiquidationData(null);
    fetchVisitors();
  };

  const handleArqueo = async (values: any) => {
    setArqueoLoading(true);
    
    const formatDateTime = (dateObj: any) => {
      if (!dateObj) return '';
      return dayjs(dateObj).format('YYYY-MM-DD HH:mm:ss');
    };

    const payload = {
      fechaInicio: formatDateTime(values.fechaInicio),
      fechaFin: formatDateTime(values.fechaFin)
    };

    try {
      const response = await fetch(`${API_ROUTES.VISITOR_PARKING}/arqueo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (response.ok && data && !data.error && response.status === 200) {
        setArqueoData(data.body);
        message.success('Arqueo generado correctamente');
      } else {
        message.error(data.body || data.mensaje || 'Error al generar el arqueo.');
      }
    } catch (err) {
      console.error("Error al generar arqueo:", err);
      message.error("Error de conexión al generar el arqueo.");
    } finally {
      setArqueoLoading(false);
    }
  };

  const downloadArqueoPDF = () => {
    if (!arqueoData) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      message.error('No se pudo abrir la ventana de impresión. Por favor, permita las ventanas emergentes.');
      return;
    }

    const totalDinero = arqueoData.totales?.dineroTotal?.toLocaleString('es-CO') || '0';
    const totalCarros = arqueoData.totales?.totalCarros || 0;
    const totalMotos = arqueoData.totales?.totalMotos || 0;
    const totalVehiculos = arqueoData.totales?.totalVehiculos || 0;
    const dineroCarros = arqueoData.totales?.dineroCarros?.toLocaleString('es-CO') || '0';
    const dineroMotos = arqueoData.totales?.dineroMotos?.toLocaleString('es-CO') || '0';
    const descuentos = arqueoData.totales?.descuentosOtorgados || 0;
    const desde = arqueoData.rangoConsulta?.desde || '-';
    const hasta = arqueoData.rangoConsulta?.hasta || '-';
    const fechaGeneracion = dayjs().format('YYYY-MM-DD HH:mm:ss');
    const vigilante = user?.nombreUsuario || 'Administrador';

    printWindow.document.write(`
      <html>
        <head>
          <title>Soporte de Arqueo y Cierre de Caja - Prados II</title>
          <style>
            body {
              font-family: 'Helvetica Neue', Arial, sans-serif;
              color: #1e293b;
              padding: 40px;
              line-height: 1.5;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              border-bottom: 2px solid #e2e8f0;
              padding-bottom: 20px;
            }
            .header h1 {
              font-size: 24px;
              margin: 0;
              color: #0f172a;
              font-weight: 800;
            }
            .header p {
              margin: 5px 0 0;
              color: #64748b;
              font-size: 14px;
            }
            .info-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 20px;
              margin-bottom: 30px;
            }
            .info-box {
              background-color: #f8fafc;
              padding: 15px;
              border-radius: 12px;
              border: 1px solid #e2e8f0;
            }
            .info-box h3 {
              margin: 0 0 10px 0;
              font-size: 12px;
              text-transform: uppercase;
              color: #64748b;
              letter-spacing: 0.05em;
            }
            .info-box p {
              margin: 4px 0;
              font-size: 14px;
              font-weight: 600;
            }
            .info-box span {
              font-weight: normal;
              color: #334155;
            }
            .table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 30px;
            }
            .table th, .table td {
              padding: 12px 15px;
              text-align: left;
              border-bottom: 1px solid #e2e8f0;
            }
            .table th {
              background-color: #f1f5f9;
              color: #475569;
              font-weight: 700;
              text-transform: uppercase;
              font-size: 11px;
              letter-spacing: 0.05em;
            }
            .table td {
              font-size: 14px;
            }
            .total-row {
              background-color: #f8fafc;
              font-weight: bold;
            }
            .total-row td {
              font-size: 16px;
              color: #0f172a;
              border-top: 2px solid #cbd5e1;
            }
            .footer {
              margin-top: 60px;
              text-align: center;
              font-size: 12px;
              color: #94a3b8;
              border-top: 1px solid #e2e8f0;
              padding-top: 20px;
            }
            .signature-area {
              margin-top: 50px;
              display: flex;
              justify-content: space-around;
            }
            .signature-line {
              width: 200px;
              border-top: 1px solid #94a3b8;
              text-align: center;
              padding-top: 8px;
              font-size: 12px;
              color: #475569;
            }
            @media print {
              body { padding: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>CONJUNTO RESIDENCIAL PRADOS II</h1>
            <p>Soporte de Arqueo y Cierre de Caja - Parqueadero de Visitantes</p>
          </div>

          <div class="info-grid">
            <div class="info-box">
              <h3>Rango de Consulta</h3>
              <p>Desde: <span>${desde}</span></p>
              <p>Hasta: <span>${hasta}</span></p>
            </div>
            <div class="info-box">
              <h3>Datos del Reporte</h3>
              <p>Generado por: <span>${vigilante}</span></p>
              <p>Fecha Generación: <span>${fechaGeneracion}</span></p>
            </div>
          </div>

          <table class="table">
            <thead>
              <tr>
                <th>Tipo de Vehículo</th>
                <th>Cantidad Ingresados</th>
                <th>Monto Recaudado</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Carros</td>
                <td>${totalCarros}</td>
                <td>$ ${dineroCarros} COP</td>
              </tr>
              <tr>
                <td>Motos</td>
                <td>${totalMotos}</td>
                <td>$ ${dineroMotos} COP</td>
              </tr>
              <tr class="total-row">
                <td>Total General</td>
                <td>${totalVehiculos}</td>
                <td>$ ${totalDinero} COP</td>
              </tr>
            </tbody>
          </table>

          <div style="margin-bottom: 30px;">
            <p><strong>Descuentos Otorgados:</strong> ${descuentos} horas de beneficio aplicadas en total.</p>
          </div>

          <div class="signature-area">
            <div class="signature-line">
              Firma Responsable (Vigilante)
            </div>
            <div class="signature-line">
              Firma Revisor (Administrador)
            </div>
          </div>

          <div class="footer">
            <p>Este documento es un soporte físico oficial del Conjunto Residencial Prados II.</p>
            <p>Desarrollado para el control interno de seguridad y finanzas.</p>
          </div>

          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Role Protection Guard
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    const userRole = user?.rol?.toLowerCase();
    if (userRole !== 'administrador' && userRole !== 'vigilante') {
      message.error('No tienes permisos para acceder a esta sección.');
      router.push('/');
    }
  }, [user, isAuthenticated, router]);

  const fetchVisitors = async () => {
    setLoading(true);
    try {
      const response = await fetch(API_ROUTES.VISITOR_PARKING);
      const data = await response.json();
      if (data && data.body) {
        const sorted = [...data.body].sort((a, b) => {
          if (!a.horaIngreso) return 1;
          if (!b.horaIngreso) return -1;
          return new Date(b.horaIngreso).getTime() - new Date(a.horaIngreso).getTime();
        });
        setVisitorData(sorted);
      }
    } catch (error) {
      console.error("Error al obtener parqueadero de visitante:", error);
      message.error("No se pudo cargar la lista de vehículos de visitantes.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchVisitors();
    }
  }, [isAuthenticated]);

  const formatLocalDatetime = (date: Date) => {
    const pad = (num: number) => String(num).padStart(2, '0');
    const yyyy = date.getFullYear();
    const MM = pad(date.getMonth() + 1);
    const dd = pad(date.getDate());
    const hh = pad(date.getHours());
    const mm = pad(date.getMinutes());
    const ss = pad(date.getSeconds());
    return `${yyyy}-${MM}-${dd}T${hh}:${mm}:${ss}`;
  };

  const formatDateTimeToShow = (dateString: string | null) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      const pad = (num: number) => String(num).padStart(2, '0');
      const yyyy = date.getFullYear();
      const MM = pad(date.getMonth() + 1);
      const dd = pad(date.getDate());
      const hh = pad(date.getHours());
      const mm = pad(date.getMinutes());
      return `${yyyy}-${MM}-${dd} ${hh}:${mm}`;
    } catch (e) {
      return dateString;
    }
  };

  const onFinish = async (values: any) => {
    setLoading(true);
    
    // Construct payload matching updated backend and MySQL column types
    const payload = {
      idparqueaderovisitante: Number(values.idparqueaderovisitante),
      placa: values.placa.toUpperCase().trim(),
      nombres: values.nombres.trim(),
      cedula: values.cedula.trim(),
      tipoParqueadero: values.tipoParqueadero,
      estado: 1, // 'estado' is now type 'int' (we send 1 for active)
      horaIngreso: formatLocalDatetime(new Date()), // local current datetime
      horaSalida: null, // empty / null as requested
      vigilanteIngreso: user?.nombreUsuario || 'Administrador', // current logged-in user
      vigilanteSalida: null // empty / null as requested
    };

    try {
      const response = await fetch(API_ROUTES.VISITOR_PARKING, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        message.success('Vehículo de visitante registrado con éxito');
        form.resetFields();
        fetchVisitors();
        setActiveView('list');
      } else {
        const errorData = await response.json().catch(() => ({}));
        message.error(errorData.mensaje || 'Error al registrar el vehículo');
      }
    } catch (error) {
      console.error("Error al enviar registro:", error);
      message.error("Error de conexión con el servidor");
    } finally {
      setLoading(false);
    }
  };

  const filteredData = visitorData.filter(visitor => {
    const search = searchText.toLowerCase();
    return (
      (visitor.placa || '').toLowerCase().includes(search) ||
      (visitor.nombres || '').toLowerCase().includes(search) ||
      (visitor.cedula || '').toLowerCase().includes(search) ||
      (visitor.tipoParqueadero || '').toLowerCase().includes(search) ||
      (visitor.vigilanteIngreso || '').toLowerCase().includes(search)
    );
  });

  const activeVehicles = filteredData.filter(v => v.estado === 1 || !v.horaSalida);
  const activeCarros = activeVehicles.filter(v => v.tipoParqueadero?.toLowerCase() === 'carro').length;
  const activeMotos = activeVehicles.filter(v => v.tipoParqueadero?.toLowerCase() === 'moto').length;

  const columns = [
    {
      title: 'Puesto',
      dataIndex: 'idparqueaderovisitante',
      key: 'idparqueaderovisitante',
      render: (val: number) => (
        <span className="font-extrabold text-slate-800 bg-slate-100 px-3 py-1 rounded-lg border border-slate-200">
          #{val}
        </span>
      ),
      sorter: (a: VehiculoVisitante, b: VehiculoVisitante) => a.idparqueaderovisitante - b.idparqueaderovisitante,
    },
    {
      title: 'Placa',
      dataIndex: 'placa',
      key: 'placa',
      render: (text: string) => (
        <Tag color="warning" className="rounded-md px-3 py-0.5 border-amber-300 text-amber-900 font-extrabold tracking-widest text-xs uppercase shadow-sm">
          {text}
        </Tag>
      ),
      sorter: (a: VehiculoVisitante, b: VehiculoVisitante) => a.placa.localeCompare(b.placa),
    },
    {
      title: 'Visitante',
      key: 'visitante',
      render: (_: any, record: VehiculoVisitante) => (
        <div className="flex flex-col">
          <Text className="font-bold text-slate-700 capitalize">{record.nombres}</Text>
          <Text className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
            <IdcardOutlined /> C.C. {record.cedula}
          </Text>
        </div>
      ),
      sorter: (a: VehiculoVisitante, b: VehiculoVisitante) => a.nombres.localeCompare(b.nombres),
    },
    {
      title: 'Vehículo',
      dataIndex: 'tipoParqueadero',
      key: 'tipoParqueadero',
      render: (type: string) => {
        const normalized = type?.toLowerCase() || '';
        let color = 'default';
        if (normalized === 'carro') color = 'blue';
        if (normalized === 'moto') color = 'purple';
        if (normalized === 'bicicleta') color = 'green';
        return <Tag color={color} className="rounded-full px-3 py-0.5 font-bold uppercase text-[10px]">{type || 'Desconocido'}</Tag>;
      },
      sorter: (a: VehiculoVisitante, b: VehiculoVisitante) => (a.tipoParqueadero || '').localeCompare(b.tipoParqueadero || ''),
    },
    {
      title: 'Registro Ingreso',
      key: 'ingreso',
      render: (_: any, record: VehiculoVisitante) => (
        <div className="flex flex-col leading-tight">
          <Text className="font-semibold text-slate-700">{formatDateTimeToShow(record.horaIngreso)}</Text>
          {record.vigilanteIngreso && (
            <Text className="text-[10px] font-bold text-emerald-600 uppercase tracking-tight">
              Vig: {record.vigilanteIngreso}
            </Text>
          )}
        </div>
      ),
      sorter: (a: VehiculoVisitante, b: VehiculoVisitante) => (a.horaIngreso || '').localeCompare(b.horaIngreso || ''),
    },
    {
      title: 'Registro Salida',
      key: 'salida',
      render: (_: any, record: VehiculoVisitante) => {
        if (!record.horaSalida) {
          return <Badge status="processing" text="En Conjunto" className="font-bold text-sky-600" />;
        }
        return (
          <div className="flex flex-col leading-tight">
            <Text className="text-slate-500">{formatDateTimeToShow(record.horaSalida)}</Text>
            {record.vigilanteSalida && (
              <Text className="text-[10px] font-medium text-slate-400 uppercase">
                Vig: {record.vigilanteSalida}
              </Text>
            )}
          </div>
        );
      },
      sorter: (a: VehiculoVisitante, b: VehiculoVisitante) => (a.horaSalida || '').localeCompare(b.horaSalida || ''),
    },
    {
      title: 'Acción',
      key: 'accion',
      render: (_: any, record: VehiculoVisitante) => {
        const isEnConjunto = record.estado === 1 || !record.horaSalida;
        if (isEnConjunto) {
          return (
            <Button
              type="primary"
              danger
              size="small"
              onClick={() => handleLiquidar(record)}
              loading={loadingId === record.idparqueaderovisitante}
              className="bg-red-500 hover:bg-red-600 border-none rounded-lg font-bold text-xs"
            >
              Liquidar
            </Button>
          );
        } else if (record.estado === 0) {
          return (
            <Button
              type="default"
              size="small"
              onClick={() => {
                setConsultData(record);
                setIsConsultModalOpen(true);
              }}
              className="bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700 rounded-lg font-bold text-xs"
            >
              Consultar liquidado
            </Button>
          );
        }
        return null;
      }
    }
  ];

  // Prevent flicker before redirect
  const userRole = user?.rol?.toLowerCase();
  if (!isAuthenticated || (userRole !== 'administrador' && userRole !== 'vigilante')) {
    return null;
  }

  return (
    <div className="max-w-5xl mx-auto pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { title: 'Inicio' },
          { title: 'Control de Seguridad' },
          { title: 'Parqueadero de Visitante' },
        ]}
        className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-400"
      />

      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
        <div>
          <Title level={1} className="!text-slate-900 !mb-1 !font-black tracking-tight">Parqueadero de Visitante</Title>
          <Text className="text-slate-500 text-lg font-medium flex items-center gap-2">
            <CarOutlined className="text-emerald-500" /> Control y registro en tiempo real de vehículos visitantes
          </Text>
        </div>

        <div className="bg-white p-1.5 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100">
          <Segmented
            size="large"
            value={activeView}
            onChange={(value) => setActiveView(value as 'list' | 'new' | 'arqueo')}
            options={[
              {
                label: (
                  <div className="flex items-center gap-2 px-4 py-1">
                    <ClockCircleOutlined />
                    <span className="font-bold">Vehículos Estacionados</span>
                  </div>
                ),
                value: 'list',
              },
              {
                label: (
                  <div className="flex items-center gap-2 px-4 py-1">
                    <PlusOutlined />
                    <span className="font-bold">Registrar Entrada</span>
                  </div>
                ),
                value: 'new',
              },
              {
                label: (
                  <div className="flex items-center gap-2 px-4 py-1">
                    <HistoryOutlined />
                    <span className="font-bold">Arqueo y Cierre</span>
                  </div>
                ),
                value: 'arqueo',
              },
            ]}
            className="custom-segmented"
          />
        </div>
      </div>

      {activeView === 'list' ? (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Card className="border-none shadow-2xl shadow-slate-200/60 rounded-[2.5rem] overflow-hidden">
            <div className="p-4">
              <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 px-2">
                <Input
                  placeholder="Buscar por placa, nombre o vigilante..."
                  prefix={<SearchOutlined className="text-slate-400" />}
                  className="max-w-md h-12 bg-slate-50 border-slate-100 hover:border-emerald-200 focus:border-emerald-500 rounded-2xl transition-all"
                  onChange={(e) => setSearchText(e.target.value)}
                  value={searchText}
                  allowClear
                />
                <Space>
                  <Button 
                    icon={<ReloadOutlined />} 
                    onClick={fetchVisitors} 
                    loading={loading} 
                    className="h-12 w-12 flex items-center justify-center rounded-2xl border-slate-100 text-slate-500 hover:text-emerald-500"
                  />
                  <div className="hidden sm:flex items-center gap-2">
                    <div className="bg-emerald-50 text-emerald-600 px-4 h-12 flex items-center gap-2 rounded-2xl font-bold border border-emerald-100 shadow-sm">
                      <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
                      <span>{activeVehicles.length} En Conjunto</span>
                    </div>
                    <div className="bg-blue-50 text-blue-600 px-4 h-12 flex items-center gap-2 rounded-2xl font-bold border border-blue-100 shadow-sm">
                      <CarOutlined className="text-blue-500" />
                      <span>{activeCarros} Carros</span>
                    </div>
                    <div className="bg-purple-50 text-purple-600 px-4 h-12 flex items-center gap-2 rounded-2xl font-bold border border-purple-100 shadow-sm">
                      <ClockCircleOutlined className="text-purple-500" />
                      <span>{activeMotos} Motos</span>
                    </div>
                  </div>
                </Space>
              </div>

              <Table 
                columns={columns} 
                dataSource={filteredData} 
                rowKey={(record) => `${record.idparqueaderovisitante}-${record.placa}`}
                loading={loading}
                pagination={{ pageSize: 8 }}
                className="custom-table"
                locale={{
                  emptyText: (
                    <Empty 
                      image={Empty.PRESENTED_IMAGE_SIMPLE} 
                      description="No hay vehículos de visitantes estacionados actualmente" 
                    />
                  )
                }}
              />
            </div>
          </Card>
        </div>
      ) : activeView === 'new' ? (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Form Card */}
            <Card className="lg:col-span-2 border-none shadow-2xl shadow-slate-200/60 rounded-[2.5rem] overflow-hidden p-4">
              <div className="p-4">
                <div className="mb-8">
                  <Title level={3} className="!mb-2">Registrar Entrada de Visitante</Title>
                  <Paragraph className="text-slate-500">Llene los datos del visitante y del vehículo para registrar su ingreso y asignar un puesto.</Paragraph>
                </div>

                <Form 
                  form={form}
                  layout="vertical" 
                  onFinish={onFinish}
                  className="space-y-6"
                  initialValues={{ 
                    tipoParqueadero: 'Carro',
                    idparqueaderovisitante: 1
                  }}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Form.Item 
                      name="nombres" 
                      label={<Text className="font-bold text-slate-700">Nombre del Visitante</Text>} 
                      rules={[{ required: true, message: 'Ingrese el nombre completo' }]}
                    >
                      <Input size="large" prefix={<UserOutlined className="text-slate-400" />} placeholder="Nombre y Apellido" className="rounded-xl" />
                    </Form.Item>
                    <Form.Item 
                      name="cedula" 
                      label={<Text className="font-bold text-slate-700">Identificación (Cédula)</Text>} 
                      rules={[{ required: true, message: 'Ingrese el número de cédula' }]}
                    >
                      <Input size="large" prefix={<IdcardOutlined className="text-slate-400" />} placeholder="Número de documento" className="rounded-xl" />
                    </Form.Item>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Form.Item 
                      name="tipoParqueadero" 
                      label={<Text className="font-bold text-slate-700">Tipo de Vehículo</Text>} 
                      rules={[{ required: true }]}
                    >
                      <Select size="large" className="custom-select">
                        <Select.Option value="Carro">Carro</Select.Option>
                        <Select.Option value="Moto">Moto</Select.Option>
                        <Select.Option value="Bicicleta">Bicicleta</Select.Option>
                      </Select>
                    </Form.Item>
                    
                    <Form.Item 
                      name="placa" 
                      label={<Text className="font-bold text-slate-700">Placa del Vehículo</Text>} 
                      rules={[
                        { required: true, message: 'Ingrese la placa' },
                        { max: 7, message: 'La placa no puede exceder 7 caracteres' }
                      ]}
                    >
                      <Input size="large" placeholder="ABC123" className="rounded-xl uppercase font-bold tracking-widest" />
                    </Form.Item>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Form.Item 
                      name="idparqueaderovisitante" 
                      label={<Text className="font-bold text-slate-700">Puesto de Parqueadero asignado</Text>} 
                      rules={[{ required: true, message: 'Asigne un puesto de parqueadero' }]}
                    >
                      <Select size="large" className="custom-select">
                        {Array.from({ length: 20 }, (_, i) => i + 1).map(num => (
                          <Select.Option key={num} value={num}>Puesto #{num}</Select.Option>
                        ))}
                      </Select>
                    </Form.Item>

                    <div className="flex flex-col justify-center bg-slate-50 p-4 rounded-xl border border-slate-100">
                      <Text className="text-slate-400 text-xs font-bold uppercase tracking-wider block mb-1">Vigilante de Ingreso</Text>
                      <Text className="font-bold text-slate-700 text-sm">{user?.nombreUsuario || 'Administrador'}</Text>
                    </div>
                  </div>

                  <Divider className="border-slate-100 my-8" />

                  <Button 
                    type="primary" 
                    htmlType="submit"
                    size="large" 
                    block 
                    loading={loading}
                    icon={<SendOutlined />}
                    className="h-14 bg-emerald-500 hover:!bg-emerald-600 border-none rounded-2xl text-lg font-black shadow-lg shadow-emerald-500/20 transition-all hover:-translate-y-1"
                  >
                    Registrar Entrada
                  </Button>
                </Form>
              </div>
            </Card>

            {/* Information Sidebar */}
            <div className="space-y-6">
              <Card className="bg-[#1e293b] border-none rounded-[2rem] p-4 text-white">
                <div className="flex items-center gap-3 mb-6 text-emerald-400">
                  <CarOutlined className="text-2xl" />
                  <Title level={4} className="!text-white !m-0">Zona de Visitantes</Title>
                </div>
                <div className="space-y-4 text-sm">
                  <Paragraph className="text-slate-300">
                    El Conjunto Residencial Prados II dispone de 20 puestos de parqueo asignados a visitantes.
                  </Paragraph>
                  <Paragraph className="text-slate-300">
                    Registre el vehículo al ingresar para tener un control estricto de seguridad.
                  </Paragraph>
                  <Divider className="border-slate-700 my-4" />
                  <div className="flex justify-between mb-4">
                    <Text className="text-slate-400">Puestos habilitados:</Text>
                    <Tag color="emerald" className="m-0 border-none rounded-full font-bold">20 Puestos</Tag>
                  </div>
                  <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/50">
                    <span className="text-amber-400 text-xs font-bold uppercase tracking-wider block mb-1">Jornada Nocturna</span>
                    <Paragraph className="text-slate-300 text-xs !mb-0">
                      La jornada nocturna va entre las <strong>8:00:00 pm</strong> del día actual a las <strong>05:59:59 am</strong> del siguiente día. Si el vehículo está en este horario se aplicará la tarifa plena de <strong>$4.000 COP</strong>.
                    </Paragraph>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      ) : (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-1 gap-8">
            {/* Form Card */}
            <Card className="border-none shadow-2xl shadow-slate-200/60 rounded-[2.5rem] overflow-hidden p-6 bg-white">
              <div className="mb-6">
                <Title level={3} className="!mb-2 flex items-center gap-2">
                  <HistoryOutlined className="text-emerald-500" />
                  Arqueo y Cierre de Caja
                </Title>
                <Paragraph className="text-slate-500">
                  Consulte el total de vehículos recaudados, montos cobrados y descuentos otorgados dentro de un rango de fecha y hora específico.
                </Paragraph>
              </div>

              <Form
                layout="vertical"
                onFinish={handleArqueo}
                className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end"
                initialValues={{
                  fechaInicio: dayjs().startOf('day'),
                  fechaFin: dayjs().endOf('day')
                }}
              >
                <Form.Item
                  name="fechaInicio"
                  label={<Text className="font-bold text-slate-700">Fecha y Hora Inicio</Text>}
                  rules={[{ required: true, message: 'Seleccione la fecha de inicio' }]}
                >
                  <DatePicker 
                    showTime 
                    format="YYYY-MM-DD HH:mm:ss" 
                    placeholder="Fecha y hora inicio" 
                    className="w-full h-12 rounded-xl"
                  />
                </Form.Item>

                <Form.Item
                  name="fechaFin"
                  label={<Text className="font-bold text-slate-700">Fecha y Hora Fin</Text>}
                  rules={[{ required: true, message: 'Seleccione la fecha de fin' }]}
                >
                  <DatePicker 
                    showTime 
                    format="YYYY-MM-DD HH:mm:ss" 
                    placeholder="Fecha y hora fin" 
                    className="w-full h-12 rounded-xl"
                  />
                </Form.Item>

                <Form.Item className="mb-0">
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={arqueoLoading}
                    icon={<SearchOutlined />}
                    className="w-full h-12 bg-emerald-500 hover:!bg-emerald-600 border-none rounded-xl font-bold shadow-md shadow-emerald-500/10"
                  >
                    Consultar Arqueo
                  </Button>
                </Form.Item>
              </Form>
            </Card>

            {/* Arqueo Results */}
            {arqueoData && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in duration-300">
                {/* Query Range and Summary */}
                <Card className="md:col-span-3 border-none shadow-xl shadow-slate-100 rounded-3xl p-4 bg-slate-50">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1">Rango Consultado</span>
                      <Text className="font-bold text-slate-700 text-sm">
                        Desde: <span className="text-emerald-600 font-extrabold">{arqueoData.rangoConsulta?.desde}</span> | Hasta: <span className="text-emerald-600 font-extrabold">{arqueoData.rangoConsulta?.hasta}</span>
                      </Text>
                    </div>
                    <Space size="middle" className="w-full md:w-auto justify-between md:justify-end">
                      <Badge color="emerald" count="Consulta exitosa" className="font-semibold text-xs py-1 px-2 bg-emerald-100/50 rounded-full text-emerald-800" />
                      <Button
                        type="primary"
                        icon={<FilePdfOutlined />}
                        onClick={downloadArqueoPDF}
                        className="bg-rose-500 hover:!bg-rose-600 border-none rounded-xl font-bold text-xs h-10 px-4 flex items-center gap-1 shadow-md shadow-rose-500/10 transition-all"
                      >
                        Exportar Soporte PDF
                      </Button>
                    </Space>
                  </div>
                </Card>

                {/* Card Totales de Vehículos */}
                <Card className="border-none shadow-xl shadow-slate-200/50 rounded-3xl p-5 bg-white flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <Title level={4} className="!m-0 !text-slate-800 !text-base font-bold">Vehículos Ingresados</Title>
                      <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                        <CarOutlined className="text-lg" />
                      </div>
                    </div>
                    <div className="mb-4">
                      <span className="text-4xl font-black text-slate-800">
                        {arqueoData.totales?.totalVehiculos || 0}
                      </span>
                      <span className="text-slate-400 text-xs font-bold block mt-1">TOTAL VEHÍCULOS</span>
                    </div>
                  </div>
                  
                  <Divider className="my-3 border-slate-100" />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100/80">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Carros</span>
                      <span className="text-lg font-black text-blue-600">{arqueoData.totales?.totalCarros || 0}</span>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100/80">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Motos</span>
                      <span className="text-lg font-black text-purple-600">{arqueoData.totales?.totalMotos || 0}</span>
                    </div>
                  </div>
                </Card>

                {/* Card Recaudación Financiera */}
                <Card className="border-none shadow-xl shadow-slate-200/50 rounded-3xl p-5 bg-white flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <Title level={4} className="!m-0 !text-slate-800 !text-base font-bold">Cierre de Caja</Title>
                      <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
                        <span className="text-lg font-black">$</span>
                      </div>
                    </div>
                    <div className="mb-4">
                      <span className="text-4xl font-black text-emerald-600">
                        ${arqueoData.totales?.dineroTotal?.toLocaleString('es-CO') || 0}
                      </span>
                      <span className="text-slate-400 text-xs font-bold block mt-1">RECAUDACIÓN TOTAL (COP)</span>
                    </div>
                  </div>
                  
                  <Divider className="my-3 border-slate-100" />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100/80">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Carros</span>
                      <span className="text-sm font-black text-slate-700">${arqueoData.totales?.dineroCarros?.toLocaleString('es-CO') || 0}</span>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100/80">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Motos</span>
                      <span className="text-sm font-black text-slate-700">${arqueoData.totales?.dineroMotos?.toLocaleString('es-CO') || 0}</span>
                    </div>
                  </div>
                </Card>

                {/* Card Descuentos */}
                <Card className="border-none shadow-xl shadow-slate-200/50 rounded-3xl p-5 bg-white flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <Title level={4} className="!m-0 !text-slate-800 !text-base font-bold">Descuentos Aplicados</Title>
                      <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600">
                        <span className="text-lg font-black">%</span>
                      </div>
                    </div>
                    <div className="mb-4 flex items-baseline gap-2">
                      <span className="text-4xl font-black text-amber-600">
                        {arqueoData.totales?.descuentosOtorgados || 0}
                      </span>
                      <span className="text-slate-500 font-bold text-sm">horas otorgadas</span>
                    </div>
                    <Paragraph className="text-xs text-slate-400">
                      Horas totales descontadas de la liquidación de visitantes asociadas a beneficios o convenios del conjunto residencial.
                    </Paragraph>
                  </div>
                </Card>
              </div>
            )}
          </div>
        </div>
      )}

      <Modal
        title={
          <div className="flex items-center gap-2 text-rose-600 font-extrabold text-xl pb-2 border-b border-slate-100">
            <ClockCircleOutlined />
            <span>Liquidación de Parqueadero</span>
          </div>
        }
        open={isModalOpen}
        onCancel={handleFinalize}
        footer={[
          <Button
            key="finalizar"
            type="primary"
            size="large"
            onClick={handleFinalize}
            className="w-full h-12 bg-emerald-500 hover:!bg-emerald-600 border-none rounded-xl font-bold text-sm"
          >
            Finalizar
          </Button>
        ]}
        centered
        width={500}
      >
        {liquidationData && (
          <div className="py-6 space-y-6">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col items-center justify-center">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Valor a Pagar</span>
              <span className="text-3xl font-black text-emerald-600">
                ${liquidationData.valorParqueadero?.toLocaleString('es-CO') || '0'} COP
              </span>
            </div>

            <Descriptions bordered column={1} size="small" className="rounded-xl overflow-hidden border border-slate-100">
              <Descriptions.Item label={<span className="font-bold text-slate-600">Placa</span>}>
                <Tag color="warning" className="rounded-md px-2 py-0.5 border-amber-300 text-amber-900 font-extrabold tracking-widest text-xs uppercase shadow-sm">
                  {liquidationData.placa}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label={<span className="font-bold text-slate-600">Hora Ingreso</span>}>
                <span className="text-slate-700 font-medium">{formatDateTimeToShow(liquidationData.horaIngreso)}</span>
              </Descriptions.Item>
              <Descriptions.Item label={<span className="font-bold text-slate-600">Hora Salida</span>}>
                <span className="text-slate-700 font-medium">{formatDateTimeToShow(liquidationData.horaSalida)}</span>
              </Descriptions.Item>
              <Descriptions.Item label={<span className="font-bold text-slate-600">Tiempo Real</span>}>
                <span className="text-slate-700 font-bold">{liquidationData.tiempoParqueoReal} hs</span>
              </Descriptions.Item>
              <Descriptions.Item label={<span className="font-bold text-slate-600">Tiempo Cobrado (Aprox.)</span>}>
                <span className="text-slate-700 font-bold">{liquidationData.tiempoParqueoConAproximacion} hs</span>
              </Descriptions.Item>
              <Descriptions.Item label={<span className="font-bold text-slate-600">Horas de Descuento</span>}>
                <span className={liquidationData.horasDescuento > 0 ? "text-red-500 font-bold" : "text-slate-700 font-medium"}>
                  {liquidationData.horasDescuento > 0 ? `-${liquidationData.horasDescuento}` : '0'} hs
                </span>
              </Descriptions.Item>
              <Descriptions.Item label={<span className="font-bold text-slate-600">Tiempo Menos Descuento</span>}>
                <span className="text-slate-700 font-bold">{liquidationData.tiempoMenosDescuento} hs</span>
              </Descriptions.Item>
              <Descriptions.Item label={<span className="font-bold text-slate-600">Vigilante de Salida</span>}>
                <span className="text-slate-700 font-bold uppercase">{liquidationData.vigilanteSalida}</span>
              </Descriptions.Item>
            </Descriptions>
          </div>
        )}
      </Modal>

      <Modal
        title={
          <div className="flex items-center gap-2 text-emerald-600 font-extrabold text-xl pb-2 border-b border-slate-100">
            <InfoCircleOutlined />
            <span>Detalle de Liquidación</span>
          </div>
        }
        open={isConsultModalOpen}
        onCancel={() => {
          setIsConsultModalOpen(false);
          setConsultData(null);
        }}
        footer={[
          <Button
            key="cerrar"
            type="primary"
            size="large"
            onClick={() => {
              setIsConsultModalOpen(false);
              setConsultData(null);
            }}
            className="w-full h-12 bg-emerald-500 hover:!bg-emerald-600 border-none rounded-xl font-bold text-sm"
          >
            Cerrar
          </Button>
        ]}
        centered
        width={500}
      >
        {consultData && (
          <div className="py-6 space-y-6">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col items-center justify-center">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Valor Total Pagado</span>
              <span className="text-3xl font-black text-emerald-600">
                ${consultData.valorParqueadero?.toLocaleString('es-CO') || '0'} COP
              </span>
            </div>

            <Descriptions bordered column={1} size="small" className="rounded-xl overflow-hidden border border-slate-100">
              <Descriptions.Item label={<span className="font-bold text-slate-600">Placa</span>}>
                <Tag color="warning" className="rounded-md px-2 py-0.5 border-amber-300 text-amber-900 font-extrabold tracking-widest text-xs uppercase shadow-sm">
                  {consultData.placa}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label={<span className="font-bold text-slate-600">Visitante</span>}>
                <span className="text-slate-700 font-bold capitalize">{consultData.nombres}</span>
              </Descriptions.Item>
              <Descriptions.Item label={<span className="font-bold text-slate-600">Identificación</span>}>
                <span className="text-slate-700 font-medium">C.C. {consultData.cedula}</span>
              </Descriptions.Item>
              <Descriptions.Item label={<span className="font-bold text-slate-600">Tipo Vehículo</span>}>
                <span className="text-slate-700 font-medium">{consultData.tipoParqueadero}</span>
              </Descriptions.Item>
              <Descriptions.Item label={<span className="font-bold text-slate-600">Estado</span>}>
                <Tag color="success" className="font-bold uppercase rounded-md text-[10px]">
                  {consultData.estado === 0 ? 'Liquidado' : 'Activo'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label={<span className="font-bold text-slate-600">Hora Ingreso</span>}>
                <span className="text-slate-700 font-medium">{formatDateTimeToShow(consultData.horaIngreso)}</span>
              </Descriptions.Item>
              <Descriptions.Item label={<span className="font-bold text-slate-600">Hora Salida</span>}>
                <span className="text-slate-700 font-medium">{formatDateTimeToShow(consultData.horaSalida)}</span>
              </Descriptions.Item>
              <Descriptions.Item label={<span className="font-bold text-slate-600">Vigilante Ingreso</span>}>
                <span className="text-slate-700 font-bold uppercase">{consultData.vigilanteIngreso}</span>
              </Descriptions.Item>
              <Descriptions.Item label={<span className="font-bold text-slate-600">Vigilante Salida</span>}>
                <span className="text-slate-700 font-bold uppercase">{consultData.vigilanteSalida}</span>
              </Descriptions.Item>
              <Descriptions.Item label={<span className="font-bold text-slate-600">Tiempo Real</span>}>
                <span className="text-slate-700 font-bold">{consultData.tiempoParqueoReal} hs</span>
              </Descriptions.Item>
              <Descriptions.Item label={<span className="font-bold text-slate-600">Tiempo Cobrado (Aprox.)</span>}>
                <span className="text-slate-700 font-bold">{consultData.tiempoParqueoConAproximacion} hs</span>
              </Descriptions.Item>
              <Descriptions.Item label={<span className="font-bold text-slate-600">Horas de Descuento</span>}>
                <span className={consultData.horasDescuento && consultData.horasDescuento > 0 ? "text-red-500 font-bold" : "text-slate-700 font-medium"}>
                  {consultData.horasDescuento && consultData.horasDescuento > 0 ? `-${consultData.horasDescuento}` : '0'} hs
                </span>
              </Descriptions.Item>
              <Descriptions.Item label={<span className="font-bold text-slate-600">Tiempo Menos Descuento</span>}>
                <span className="text-slate-700 font-bold">{consultData.tiempoMenosDescuento} hs</span>
              </Descriptions.Item>
            </Descriptions>
          </div>
        )}
      </Modal>

      <style jsx global>{`
        .custom-segmented { background: transparent !important; padding: 4px !important; }
        .custom-segmented .ant-segmented-item { transition: all 0.3s ease !important; border-radius: 12px !important; }
        .custom-segmented .ant-segmented-item-selected { background: #1e293b !important; color: white !important; box-shadow: 0 4px 12px rgba(30, 41, 59, 0.2) !important; }
        .custom-select .ant-select-selector { border-radius: 12px !important; height: 48px !important; display: flex !important; align-items: center !important; }
        .custom-table .ant-table-thead > tr > th { background: #f8fafc !important; color: #64748b !important; font-weight: 700 !important; text-transform: uppercase !important; font-size: 11px !important; letter-spacing: 0.05em !important; border-bottom: 2px solid #f1f5f9 !important; }
        .custom-table .ant-table-tbody > tr > td { padding: 20px 16px !important; border-bottom: 1px solid #f1f5f9 !important; }
        .custom-table .ant-table-row:hover > td { background: #fdfdfd !important; }
      `}</style>
    </div>
  );
}
