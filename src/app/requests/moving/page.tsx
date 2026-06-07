'use client';

import React, { useState, useEffect } from 'react';
import { 
  Typography, 
  Card, 
  Button, 
  Segmented, 
  Form, 
  Input, 
  Table, 
  Tag, 
  Space, 
  Badge,
  Empty,
  App as AntdApp,
  Radio,
  DatePicker,
  Divider as AntdDivider
} from 'antd';
import { API_ROUTES } from '@/config/api';
import { 
  PlusOutlined, 
  HistoryOutlined, 
  TruckOutlined, 
  SendOutlined,
  CalendarOutlined,
  InfoCircleOutlined,
  ClockCircleOutlined,
  FileTextOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

interface SolicitudTrasteo {
  idSolicitudTrasteos: number;
  fechaSolicitud: string;
  idApartamento: string;
  fechaTrasteo: string;
  Observaciones: string;
  idArrendatario: string;
  idPropietario: string;
  aprobado: string;
}

export default function MovingRequestsPage() {
  const { message } = AntdApp.useApp();
  const [form] = Form.useForm();
  const [activeView, setActiveView] = useState<'new' | 'history'>('new');
  const [loading, setLoading] = useState(false);
  const [historyData, setHistoryData] = useState<SolicitudTrasteo[]>([]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const response = await fetch(API_ROUTES.MOVING);
      const data = await response.json();
      if (data && data.body) {
        setHistoryData(data.body);
      }
    } catch (error) {
      console.error("Error al obtener historial:", error);
      message.error("No se pudo cargar el historial de trasteos.");
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
    
    const idPropietario = values.rolSolicitante === 'propietario' ? values.cedula : "0";
    const idArrendatario = values.rolSolicitante === 'arrendatario' ? values.cedula : "0";

    const payload = {
      idApartamento: values.idApartamento,
      fechaTrasteo: values.fechaTrasteo.format('YYYY-MM-DD HH:mm:ss'),
      Observaciones: values.Observaciones || "NA",
      idPropietario: idPropietario,
      idArrendatario: idArrendatario,
      fechaSolicitud: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      aprobado: "0" // Initial status as per logic 0 = Pendiente
    };

    try {
      const response = await fetch(API_ROUTES.MOVING, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        message.success('Solicitud de trasteo enviada con éxito');
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
      title: 'ID',
      dataIndex: 'idSolicitudTrasteos',
      key: 'idSolicitudTrasteos',
      sorter: (a: SolicitudTrasteo, b: SolicitudTrasteo) => a.idSolicitudTrasteos - b.idSolicitudTrasteos,
    },
    {
      title: 'Solicitante',
      key: 'solicitante',
      render: (_: any, record: SolicitudTrasteo) => {
        const id = record.idPropietario !== "0" ? record.idPropietario : record.idArrendatario;
        const label = record.idPropietario !== "0" ? "Propietario" : "Arrendatario";
        return (
          <div className="flex flex-col">
            <Text className="font-bold text-slate-700">{id}</Text>
            <Text className="text-[10px] uppercase font-black text-slate-400 tracking-tighter">{label}</Text>
          </div>
        );
      },
      sorter: (a: SolicitudTrasteo, b: SolicitudTrasteo) => {
        const idA = a.idPropietario !== "0" ? a.idPropietario : a.idArrendatario;
        const idB = b.idPropietario !== "0" ? b.idPropietario : b.idArrendatario;
        return idA.localeCompare(idB);
      }
    },
    {
      title: 'Apto',
      dataIndex: 'idApartamento',
      key: 'idApartamento',
      sorter: (a: SolicitudTrasteo, b: SolicitudTrasteo) => a.idApartamento.localeCompare(b.idApartamento),
    },
    {
      title: 'Fecha Trasteo',
      dataIndex: 'fechaTrasteo',
      key: 'fechaTrasteo',
      render: (date: string) => dayjs(date).format('DD/MM/YYYY HH:mm'),
      sorter: (a: SolicitudTrasteo, b: SolicitudTrasteo) => dayjs(a.fechaTrasteo).unix() - dayjs(b.fechaTrasteo).unix(),
    },
    {
      title: 'Estado',
      dataIndex: 'aprobado',
      key: 'aprobado',
      render: (aprobado: string) => {
        if (aprobado === "0") return <Badge status="warning" text="Pendiente" />;
        if (aprobado === "1") return <Badge status="success" text="Aprobado" />;
        return <Badge status="default" text="Sin Estado" />;
      },
      sorter: (a: SolicitudTrasteo, b: SolicitudTrasteo) => a.aprobado.localeCompare(b.aprobado),
    },
    {
      title: 'Solicitud',
      dataIndex: 'fechaSolicitud',
      key: 'fechaSolicitud',
      render: (date: string) => dayjs(date).format('DD/MM/YYYY'),
      sorter: (a: SolicitudTrasteo, b: SolicitudTrasteo) => dayjs(a.fechaSolicitud).unix() - dayjs(b.fechaSolicitud).unix(),
      defaultSortOrder: 'descend' as const,
    }
  ];

  return (
    <div className="max-w-5xl mx-auto pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
        <div>
          <Title level={1} className="!text-slate-900 !mb-1 !font-black tracking-tight">Solicitudes de Trasteos</Title>
          <Text className="text-slate-500 text-lg font-medium flex items-center gap-2">
            <TruckOutlined className="text-blue-500" /> Agenda tu mudanza de forma organizada
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
            <Card className="lg:col-span-2 border-none shadow-2xl shadow-slate-200/60 rounded-[2.5rem] overflow-hidden p-4">
              <div className="p-4">
                <div className="mb-8">
                  <Title level={3} className="!mb-2">Programar Mudanza</Title>
                  <Paragraph className="text-slate-500">Ingrese la fecha y hora estimada para su trasteo. Recuerde las normas de convivencia.</Paragraph>
                </div>

                <Form 
                  form={form}
                  layout="vertical" 
                  onFinish={onFinish}
                  className="space-y-6"
                  initialValues={{ 
                    rolSolicitante: 'propietario'
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
                    <Form.Item name="idApartamento" label={<Text className="font-bold text-slate-700">Apartamento</Text>} rules={[{ required: true }]}>
                      <Input size="large" placeholder="Ej: 4204" className="rounded-xl" />
                    </Form.Item>
                    <Form.Item name="fechaTrasteo" label={<Text className="font-bold text-slate-700">Fecha y Hora del Trasteo</Text>} rules={[{ required: true }]}>
                      <DatePicker 
                        showTime 
                        size="large" 
                        format="DD/MM/YYYY HH:mm" 
                        className="w-full rounded-xl"
                        placeholder="Seleccionar fecha y hora"
                      />
                    </Form.Item>
                  </div>

                  <Form.Item name="Observaciones" label={<Text className="font-bold text-slate-700">Observaciones</Text>}>
                    <TextArea rows={4} placeholder="Detalles sobre el trasteo..." className="rounded-2xl resize-none p-4" />
                  </Form.Item>

                  <Button 
                    type="primary" 
                    htmlType="submit"
                    size="large" 
                    block 
                    loading={loading}
                    icon={<SendOutlined />}
                    className="h-14 bg-blue-600 hover:!bg-blue-700 border-none rounded-2xl text-lg font-black shadow-lg shadow-blue-500/20 transition-all hover:-translate-y-1"
                  >
                    Enviar Solicitud
                  </Button>
                </Form>
              </div>
            </Card>

            <div className="space-y-6">
              <Card className="bg-slate-900 border-none rounded-[2rem] p-4 text-white">
                <div className="flex items-center gap-3 mb-6 text-blue-400">
                  <InfoCircleOutlined className="text-2xl" />
                  <Title level={4} className="!text-white !m-0">Información Importante</Title>
                </div>
                <div className="space-y-4 text-sm">
                  <Paragraph className="text-slate-300">
                    Los trasteos deben realizarse en los horarios permitidos por la administración (L - V 8:00 AM - 5:00 PM y S 8:00 AM - 12:00 PM).
                  </Paragraph>
                  <AntdDivider className="border-slate-700 my-4" />
                  <div className="flex justify-between">
                    <Text className="text-slate-400">Paz y Salvo:</Text>
                    <Tag color="blue" className="m-0 border-none rounded-full">Requerido</Tag>
                  </div>
                </div>
              </Card>

              <Card className="border-none shadow-xl rounded-[2rem] p-4 bg-blue-50 border-blue-100">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-blue-500 shadow-sm">
                    <CalendarOutlined className="text-xl" />
                  </div>
                  <div>
                    <Text className="block font-bold text-slate-800">Fecha de Solicitud</Text>
                    <Text className="text-blue-600 font-bold">{dayjs().format('DD/MM/YYYY')}</Text>
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
                <Title level={3} className="!m-0 text-slate-800">Historial de Trasteos</Title>
                <Button icon={<HistoryOutlined />} onClick={fetchHistory} loading={loading} className="rounded-xl font-bold">Refrescar</Button>
              </div>
              
              <Table 
                columns={columns} 
                dataSource={historyData} 
                rowKey="idSolicitudTrasteos"
                loading={loading}
                pagination={{ pageSize: 5 }}
                className="custom-table"
                locale={{
                  emptyText: (
                    <Empty 
                      image={Empty.PRESENTED_IMAGE_SIMPLE} 
                      description="No hay trasteos programados" 
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
        .custom-table .ant-table-thead > tr > th { background: #f8fafc !important; color: #64748b !important; font-weight: 700 !important; text-transform: uppercase !important; font-size: 11px !important; letter-spacing: 0.05em !important; border-bottom: 2px solid #f1f5f9 !important; }
        .custom-table .ant-table-tbody > tr > td { padding: 20px 16px !important; border-bottom: 1px solid #f1f5f9 !important; }
        .custom-table .ant-table-row:hover > td { background: #fdfdfd !important; }
      `}</style>
    </div>
  );
}
