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
  Divider
} from 'antd';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { API_ROUTES } from '@/config/api';
import { 
  PlusOutlined, 
  HistoryOutlined, 
  CarOutlined, 
  SendOutlined,
  SearchOutlined,
  ReloadOutlined,
  IdcardOutlined,
  UserOutlined,
  ClockCircleOutlined
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
}

export default function VisitorParkingPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const { message } = AntdApp.useApp();
  const [form] = Form.useForm();
  
  const [activeView, setActiveView] = useState<'list' | 'new'>('list');
  const [loading, setLoading] = useState(false);
  const [visitorData, setVisitorData] = useState<VehiculoVisitante[]>([]);
  const [searchText, setSearchText] = useState('');

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
        setVisitorData(data.body);
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
            onChange={(value) => setActiveView(value as 'list' | 'new')}
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
                  <div className="hidden sm:flex bg-emerald-50 text-emerald-600 px-4 h-12 items-center gap-2 rounded-2xl font-bold border border-emerald-100">
                    <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
                    <span>{filteredData.length} Vehículos Activos</span>
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
      ) : (
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
                  <div className="flex justify-between">
                    <Text className="text-slate-400">Puestos habilitados:</Text>
                    <Tag color="emerald" className="m-0 border-none rounded-full font-bold">20 Puestos</Tag>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      )}

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
