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
  Switch,
  Radio,
  Upload,
  Divider as AntdDivider,
  Image,
  Tooltip
} from 'antd';
import { API_ROUTES } from '@/config/api';
import { 
  PlusOutlined, 
  HistoryOutlined, 
  CarOutlined, 
  SendOutlined,
  CalendarOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  UploadOutlined,
  FileTextOutlined,
  EyeOutlined,
  FilePdfOutlined
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

interface SolicitudParqueadero {
  idSolicitudParqueadero: number;
  fechaSolicitud: string;
  idParqueadero: string;
  tipoParqueadero: string;
  idApartamento: string;
  observaciones: string;
  aprobado: string | null;
  idPropietario: string;
  idArrendatario: string;
  placa: string;
  discapacidad: string;
  soat: string | null;
  tecnoMecanica: string | null;
  tarjetaPropiedad: string | null;
  soatUrl: string | null;
  tecnoMecanicaUrl: string | null;
  tarjetaPropiedadUrl: string | null;
}

export default function ParkingRequestsPage() {
  const { message } = AntdApp.useApp();
  const [form] = Form.useForm();
  const [activeView, setActiveView] = useState<'new' | 'history'>('new');
  const [loading, setLoading] = useState(false);
  const [historyData, setHistoryData] = useState<SolicitudParqueadero[]>([]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const response = await fetch(API_ROUTES.PARKING);
      const data = await response.json();
      if (data && data.body) {
        setHistoryData(data.body);
      }
    } catch (error) {
      console.error("Error al obtener historial:", error);
      message.error("No se pudo cargar el historial de solicitudes.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeView === 'history') {
      fetchHistory();
    }
  }, [activeView]);

  const onFinish = async (values: any) => {
    setLoading(true);
    
    // Determine IDs based on role
    const idPropietario = values.rolSolicitante === 'propietario' ? values.cedula : "0";
    const idArrendatario = values.rolSolicitante === 'arrendatario' ? values.cedula : "0";

    const formData = new FormData();
    
    // Append text fields
    formData.append('tipoParqueadero', values.tipoParqueadero);
    formData.append('placa', values.placa);
    formData.append('idApartamento', values.idApartamento);
    formData.append('observaciones', values.observaciones || "NA");
    formData.append('idPropietario', idPropietario);
    formData.append('idArrendatario', idArrendatario);
    formData.append('fechaSolicitud', new Date().toISOString().slice(0, 19).replace('T', ' '));
    formData.append('idParqueadero', "0");
    formData.append('discapacidad', values.discapacidad ? "1" : "0");
    formData.append('aprobado', ''); // Sending empty string or null as per requirement

    // Append file fields
    if (values.docSoat && values.docSoat.length > 0) {
      formData.append('soat', values.docSoat[0].originFileObj);
    }
    if (values.docTecno && values.docTecno.length > 0) {
      formData.append('tecnoMecanica', values.docTecno[0].originFileObj);
    }
    if (values.docTarjeta && values.docTarjeta.length > 0) {
      formData.append('tarjetaPropiedad', values.docTarjeta[0].originFileObj);
    }

    try {
      const response = await fetch(API_ROUTES.PARKING, {
        method: 'POST',
        // Note: No 'Content-Type' header here, browser will set it automatically with boundary
        body: formData
      });

      if (response.ok) {
        message.success('Solicitud enviada con éxito');
        form.resetFields();
        setActiveView('history');
      } else {
        const errorData = await response.json().catch(() => ({}));
        message.error(errorData.mensaje || 'Error al enviar la solicitud');
      }
    } catch (error) {
      console.error("Error al enviar solicitud:", error);
      message.error("Error de conexión con el servidor");
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: 'Placa',
      dataIndex: 'placa',
      key: 'placa',
      render: (text: string) => <Tag color="blue" className="rounded-full px-3 font-bold">{text}</Tag>,
      sorter: (a: SolicitudParqueadero, b: SolicitudParqueadero) => a.placa.localeCompare(b.placa),
    },
    {
      title: 'Solicitante',
      key: 'solicitante',
      render: (_: any, record: SolicitudParqueadero) => {
        const id = record.idPropietario !== "0" ? record.idPropietario : record.idArrendatario;
        const label = record.idPropietario !== "0" ? "Propietario" : "Arrendatario";
        return (
          <div className="flex flex-col">
            <Text className="font-bold text-slate-700">{id}</Text>
            <Text className="text-[10px] uppercase font-black text-slate-400 tracking-tighter">{label}</Text>
          </div>
        );
      },
      sorter: (a: SolicitudParqueadero, b: SolicitudParqueadero) => {
        const idA = a.idPropietario !== "0" ? a.idPropietario : a.idArrendatario;
        const idB = b.idPropietario !== "0" ? b.idPropietario : b.idArrendatario;
        return idA.localeCompare(idB);
      }
    },
    {
      title: 'Apto',
      dataIndex: 'idApartamento',
      key: 'idApartamento',
      sorter: (a: SolicitudParqueadero, b: SolicitudParqueadero) => a.idApartamento.localeCompare(b.idApartamento),
    },
    {
      title: 'Tipo',
      dataIndex: 'tipoParqueadero',
      key: 'tipoParqueadero',
      sorter: (a: SolicitudParqueadero, b: SolicitudParqueadero) => a.tipoParqueadero.localeCompare(b.tipoParqueadero),
    },
    {
      title: 'Discapacidad',
      dataIndex: 'discapacidad',
      key: 'discapacidad',
      render: (val: string) => val === "1" ? <Tag color="cyan">Sí</Tag> : <Text className="text-slate-400">No</Text>,
      sorter: (a: SolicitudParqueadero, b: SolicitudParqueadero) => a.discapacidad.localeCompare(b.discapacidad),
    },
    {
      title: 'Documentos',
      key: 'documentos',
      render: (_: any, record: SolicitudParqueadero) => {
        const docs = [
          { key: 'soat', label: 'SOAT', file: record.soat, url: record.soat ? `${API_ROUTES.UPLOAD_DIR}${record.soat}` : null },
          { key: 'tecno', label: 'Tecno', file: record.tecnoMecanica, url: record.tecnoMecanica ? `${API_ROUTES.UPLOAD_DIR}${record.tecnoMecanica}` : null },
          { key: 'tarjeta', label: 'Tarjeta', file: record.tarjetaPropiedad, url: record.tarjetaPropiedad ? `${API_ROUTES.UPLOAD_DIR}${record.tarjetaPropiedad}` : null },
        ];

        return (
          <Space size="small">
            {docs.map(doc => {
              if (!doc.url) return <Tag key={doc.key} className="m-0 text-[10px] opacity-40">N/A</Tag>;
              
              const isPdf = doc.file?.toLowerCase().endsWith('.pdf');
              
              return (
                <Tooltip title={`Ver ${doc.label}`} key={doc.key}>
                  {isPdf ? (
                    <Button 
                      icon={<FilePdfOutlined className="text-red-500" />} 
                      className="w-10 h-10 rounded-lg flex items-center justify-center border-slate-200 hover:border-red-400"
                      onClick={() => window.open(doc.url as string, '_blank')}
                    />
                  ) : (
                    <Image
                      width={40}
                      height={40}
                      src={doc.url}
                      fallback="https://placehold.co/40x40?text=Doc"
                      className="rounded-lg object-cover cursor-pointer border border-slate-200 hover:border-emerald-500 transition-colors"
                      preview={{
                        mask: <EyeOutlined className="text-xs" />,
                      }}
                    />
                  )}
                </Tooltip>
              );
            })}
          </Space>
        );
      }
    },
    {
      title: 'Fecha',
      dataIndex: 'fechaSolicitud',
      key: 'fechaSolicitud',
      render: (date: string) => new Date(date).toLocaleDateString('es-ES'),
      sorter: (a: SolicitudParqueadero, b: SolicitudParqueadero) => new Date(a.fechaSolicitud).getTime() - new Date(b.fechaSolicitud).getTime(),
      defaultSortOrder: 'descend' as const,
    },
    {
      title: 'Estado',
      dataIndex: 'aprobado',
      key: 'aprobado',
      render: (aprobado: string | null) => {
        if (aprobado === "0") return <Badge status="warning" text="Pendiente" />;
        if (aprobado === "1") return <Badge status="success" text="Aprobado" />;
        return <Badge status="default" text="Sin Estado" />;
      },
      sorter: (a: SolicitudParqueadero, b: SolicitudParqueadero) => (a.aprobado || "").localeCompare(b.aprobado || ""),
    }
  ];

  return (
    <div className="max-w-5xl mx-auto pb-20">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
        <div>
          <Title level={1} className="!text-slate-900 !mb-1 !font-black tracking-tight">Solicitudes de Parqueaderos</Title>
          <Text className="text-slate-500 text-lg font-medium flex items-center gap-2">
            <CarOutlined className="text-emerald-500" /> Gestiona tus espacios de estacionamiento
          </Text>
        </div>

        <div className="bg-white p-1.5 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100">
          <Segmented
            size="large"
            value={activeView}
            onChange={(value) => setActiveView(value as 'new' | 'history')}
            options={[
              {
                label: (
                  <div className="flex items-center gap-2 px-4 py-1">
                    <PlusOutlined />
                    <span className="font-bold">Nueva Solicitud</span>
                  </div>
                ),
                value: 'new',
              },
              {
                label: (
                  <div className="flex items-center gap-2 px-4 py-1">
                    <HistoryOutlined />
                    <span className="font-bold">Historial</span>
                  </div>
                ),
                value: 'history',
              },
            ]}
            className="custom-segmented"
          />
        </div>
      </div>

      {activeView === 'new' ? (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Form Card */}
            <Card className="lg:col-span-2 border-none shadow-2xl shadow-slate-200/60 rounded-[2.5rem] overflow-hidden p-4">
              <div className="p-4">
                <div className="mb-8">
                  <Title level={3} className="!mb-2">Nueva Solicitud</Title>
                  <Paragraph className="text-slate-500">Completa los datos para solicitar un espacio de parqueo conforme al sistema.</Paragraph>
                </div>

                <Form 
                  form={form}
                  layout="vertical" 
                  onFinish={onFinish}
                  className="space-y-6"
                  initialValues={{ 
                    tipoParqueadero: 'Carro', 
                    discapacidad: false,
                    rolSolicitante: 'propietario',
                    docSoat: [],
                    docTecno: [],
                    docTarjeta: []
                  }}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Form.Item name="rolSolicitante" label={<Text className="font-bold text-slate-700">Tipo de Solicitante</Text>} rules={[{ required: true }]}>
                      <Radio.Group className="bg-slate-50 p-1 rounded-xl border border-slate-100 w-full flex">
                        <Radio.Button value="propietario" className="flex-1 text-center rounded-lg">Propietario</Radio.Button>
                        <Radio.Button value="arrendatario" className="flex-1 text-center rounded-lg">Arrendatario</Radio.Button>
                      </Radio.Group>
                    </Form.Item>
                    <Form.Item name="cedula" label={<Text className="font-bold text-slate-700">Cédula del Solicitante</Text>} rules={[{ required: true }]}>
                      <Input size="large" placeholder="Número de identificación" className="rounded-xl" />
                    </Form.Item>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Form.Item name="tipoParqueadero" label={<Text className="font-bold text-slate-700">Tipo de Vehículo</Text>} rules={[{ required: true }]}>
                      <Select size="large" className="custom-select">
                        <Select.Option value="Carro">Carro</Select.Option>
                        <Select.Option value="Moto">Moto</Select.Option>
                        <Select.Option value="Bicicleta">Bicicleta</Select.Option>
                      </Select>
                    </Form.Item>
                    <Form.Item name="placa" label={<Text className="font-bold text-slate-700">Placa</Text>} rules={[{ required: true }]}>
                      <Input size="large" placeholder="ABC123" className="rounded-xl uppercase font-bold tracking-widest" />
                    </Form.Item>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Form.Item name="idApartamento" label={<Text className="font-bold text-slate-700">Apartamento</Text>} rules={[{ required: true }]}>
                      <Input size="large" placeholder="Ej: 4204" className="rounded-xl" />
                    </Form.Item>
                    <Form.Item name="discapacidad" label={<Text className="font-bold text-slate-700">¿Requiere acceso para discapacidad?</Text>} valuePropName="checked">
                      <Switch className="bg-slate-200" />
                    </Form.Item>
                  </div>

                  <AntdDivider className="border-slate-100 my-8">
                    <Text className="text-slate-400 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                      <FileTextOutlined /> Documentación Requerida
                    </Text>
                  </AntdDivider>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <Form.Item 
                      name="docSoat" 
                      label={<Text className="font-bold text-slate-700 text-xs">SOAT Vigente</Text>} 
                      required
                      valuePropName="fileList"
                      getValueFromEvent={(e) => {
                        if (Array.isArray(e)) return e;
                        return e?.fileList;
                      }}
                    >
                      <Upload maxCount={1} beforeUpload={() => false} className="w-full">
                        <Button icon={<UploadOutlined />} className="w-full h-12 rounded-xl border-dashed hover:border-emerald-500 hover:text-emerald-500">
                          Adjuntar
                        </Button>
                      </Upload>
                    </Form.Item>
                    <Form.Item 
                      name="docTecno" 
                      label={<Text className="font-bold text-slate-700 text-xs">Tecnomecánica</Text>} 
                      required
                      valuePropName="fileList"
                      getValueFromEvent={(e) => {
                        if (Array.isArray(e)) return e;
                        return e?.fileList;
                      }}
                    >
                      <Upload maxCount={1} beforeUpload={() => false} className="w-full">
                        <Button icon={<UploadOutlined />} className="w-full h-12 rounded-xl border-dashed hover:border-emerald-500 hover:text-emerald-500">
                          Adjuntar
                        </Button>
                      </Upload>
                    </Form.Item>
                    <Form.Item 
                      name="docTarjeta" 
                      label={<Text className="font-bold text-slate-700 text-xs">Tarjeta Propiedad</Text>} 
                      required
                      valuePropName="fileList"
                      getValueFromEvent={(e) => {
                        if (Array.isArray(e)) return e;
                        return e?.fileList;
                      }}
                    >
                      <Upload maxCount={1} beforeUpload={() => false} className="w-full">
                        <Button icon={<UploadOutlined />} className="w-full h-12 rounded-xl border-dashed hover:border-emerald-500 hover:text-emerald-500">
                          Adjuntar
                        </Button>
                      </Upload>
                    </Form.Item>
                  </div>

                  <Form.Item name="observaciones" label={<Text className="font-bold text-slate-700">Observaciones</Text>}>
                    <TextArea rows={4} placeholder="Detalles adicionales..." className="rounded-2xl resize-none p-4" />
                  </Form.Item>

                  <Button 
                    type="primary" 
                    htmlType="submit"
                    size="large" 
                    block 
                    loading={loading}
                    icon={<SendOutlined />}
                    className="h-14 bg-emerald-500 hover:!bg-emerald-600 border-none rounded-2xl text-lg font-black shadow-lg shadow-emerald-500/20 transition-all hover:-translate-y-1"
                  >
                    Enviar Solicitud
                  </Button>
                </Form>
              </div>
            </Card>

            <div className="space-y-6">
              <Card className="bg-[#1e293b] border-none rounded-[2rem] p-4 text-white">
                <div className="flex items-center gap-3 mb-6 text-emerald-400">
                  <InfoCircleOutlined className="text-2xl" />
                  <Title level={4} className="!text-white !m-0">Datos del Sistema</Title>
                </div>
                <div className="space-y-4 text-sm">
                  <Paragraph className="text-slate-300">
                    Asegúrese de que los datos ingresados coincidan con el contrato de arrendamiento o certificado de propiedad.
                  </Paragraph>
                  <Divider className="border-slate-700 my-4" />
                  <div className="flex justify-between">
                    <Text className="text-slate-400">Estado Inicial:</Text>
                    <Tag color="orange" className="m-0 border-none rounded-full">Pendiente</Tag>
                  </div>
                </div>
              </Card>

              <Card className="border-none shadow-xl rounded-[2rem] p-4 bg-emerald-50 border-emerald-100">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-emerald-500 shadow-sm">
                    <CalendarOutlined className="text-xl" />
                  </div>
                  <div>
                    <Text className="block font-bold text-slate-800">Fecha Actual</Text>
                    <Text className="text-emerald-600 font-bold">{new Date().toLocaleDateString('es-ES')}</Text>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      ) : (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Card className="border-none shadow-2xl shadow-slate-200/60 rounded-[2.5rem] overflow-hidden">
            <div className="p-6">
              <div className="flex justify-between items-center mb-8">
                <Title level={3} className="!m-0 text-slate-800">Historial de Solicitudes</Title>
                <Space>
                  <Button icon={<HistoryOutlined />} onClick={fetchHistory} loading={loading} className="rounded-xl font-bold">Refrescar</Button>
                </Space>
              </div>
              
              <Table 
                columns={columns} 
                dataSource={historyData} 
                rowKey="idSolicitudParqueadero"
                loading={loading}
                pagination={{ pageSize: 5 }}
                className="custom-table"
                locale={{
                  emptyText: (
                    <Empty 
                      image={Empty.PRESENTED_IMAGE_SIMPLE} 
                      description="No hay solicitudes registradas" 
                    />
                  )
                }}
              />
            </div>
          </Card>
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

const Divider = ({ className, ...props }: any) => <div className={`border-t ${className}`} {...props} />;
