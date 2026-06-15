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
  Upload,
  Divider,
  Modal,
} from 'antd';
import { useAuth } from '@/context/AuthContext';
import { API_ROUTES } from '@/config/api';
import {
  PlusOutlined,
  HistoryOutlined,
  FileTextOutlined,
  SendOutlined,
  SearchOutlined,
  ReloadOutlined,
  UploadOutlined,
  FilePdfOutlined,
  EyeOutlined,
  ClockCircleOutlined,
  SmileOutlined,
  WarningOutlined,
  CloseCircleOutlined,
  MessageOutlined,
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

// ─── Tipos ───────────────────────────────────────────────────────────────────

interface Pqrs {
  idpqrs: number;
  fechaCreacion: string;
  idUsuario: string;
  tipo: string;
  descripcion: string;
  evidencia: string | null;
  evidenciaUrl: string | null;
  estado: string;
  respuestaPqrs?: string | null; // columna antigua
  respuesta?: string | null;      // columna nueva
  numeroApartamento?: string | number | null;
  fechaRespuesta?: string | null;
}

// Helper para obtener la respuesta de cualquiera de las dos columnas
const getRespuesta = (r: Pqrs): string | null =>
  r.respuestaPqrs || r.respuesta || null;

// ─── Constantes ──────────────────────────────────────────────────────────────

const TIPOS_PQRS = [
  { value: 'Petición', icon: <MessageOutlined />, color: 'blue', desc: 'Solicitud de un servicio o trámite administrativo.' },
  { value: 'Queja', icon: <WarningOutlined />, color: 'orange', desc: 'Inconformidad sobre el servicio recibido.' },
  { value: 'Reclamo', icon: <CloseCircleOutlined />, color: 'red', desc: 'Exigencia sobre un derecho que no fue atendido.' },
  { value: 'Felicitación', icon: <SmileOutlined />, color: 'green', desc: 'Reconocimiento positivo a la administración o personal.' },
];

const ESTADOS_PQRS = ['Pendiente', 'En Proceso', 'Resuelto'];

// ─── Utilidades ──────────────────────────────────────────────────────────────

const estadoBadge = (estado: string) => {
  const e = (estado || '').toLowerCase();
  if (e.includes('resuelto')) return <Badge status="success" text="Resuelto" className="font-bold" />;
  if (e.includes('proceso')) return <Badge status="processing" text="En Proceso" className="font-bold" />;
  return <Badge status="warning" text="Pendiente" className="font-bold" />;
};

const tipoTag = (tipo: string) => {
  const t = TIPOS_PQRS.find(x => x.value.toLowerCase() === (tipo || '').toLowerCase()) ?? TIPOS_PQRS[0];
  return (
    <Tag
      color={t.color}
      className="rounded-full px-3 py-0.5 font-bold uppercase text-[10px] inline-flex items-center gap-1"
    >
      {t.icon} {tipo}
    </Tag>
  );
};

const formatDate = (d: string | null) => {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleDateString('es-CO', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch { return d; }
};

const localIso = () => {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
};

// ─── Componente principal ────────────────────────────────────────────────────

export default function PqrsPage() {
  const { user, isAuthenticated } = useAuth();
  const { message } = AntdApp.useApp();
  const [form] = Form.useForm();

  const isAdmin = user?.rol?.toLowerCase() === 'administrador';
  const cedulaUsuario = String(user?.cedula || '');

  const [activeView, setActiveView] = useState<'new' | 'history'>('new');
  const [loading, setLoading] = useState(false);
  const [pqrsList, setPqrsList] = useState<Pqrs[]>([]);
  const [searchText, setSearchText] = useState('');
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [tipoSelected, setTipoSelected] = useState<string>('');

  // Estados para respuesta de admin
  const [replyingTo, setReplyingTo] = useState<Pqrs | null>(null);
  const [replyText, setReplyText] = useState('');
  const [viewingReply, setViewingReply] = useState<Pqrs | null>(null);

  // ── fetch ──────────────────────────────────────────────────────────────────
  const fetchPqrs = async () => {
    setLoading(true);
    try {
      const res = await fetch(API_ROUTES.PQRS);
      const data = await res.json();
      if (data && Array.isArray(data.body)) {
        const normalized = data.body.map((item: any) => ({
          ...item,
          idpqrs: item.idpqrs !== undefined ? Number(item.idpqrs) : Number(item.idPqrs),
        }));
        setPqrsList(normalized);
      } else {
        setPqrsList([]);
      }
    } catch {
      message.error('No se pudo cargar la lista de PQRS.');
      setPqrsList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) fetchPqrs();
  }, [isAuthenticated]);

  // ── enviar nueva PQRS ──────────────────────────────────────────────────────
  const onFinish = async (values: any) => {
    if (!tipoSelected) {
      message.warning('Por favor selecciona el tipo de PQRS.');
      return;
    }
    setLoading(true);
    const fd = new FormData();
    fd.append('idpqrs', String(Date.now()).slice(-6));
    fd.append('fechaCreacion', localIso());
    fd.append('idUsuario', cedulaUsuario || user?.nombreUsuario || 'usuario');
    fd.append('tipo', tipoSelected);
    fd.append('descripcion', values.descripcion || '');
    fd.append('estado', 'Pendiente');
    if (values.evidencia?.length > 0) {
      fd.append('evidencia', values.evidencia[0].originFileObj);
    }
    try {
      const res = await fetch(API_ROUTES.PQRS, { method: 'POST', body: fd });
      if (res.ok) {
        message.success('¡PQRS radicada con éxito!');
        form.resetFields();
        setTipoSelected('');
        fetchPqrs();
        setActiveView('history');
      } else {
        const err = await res.json().catch(() => ({}));
        message.error(err.mensaje || 'Error al radicar la PQRS');
      }
    } catch {
      message.error('Error de conexión con el servidor');
    } finally {
      setLoading(false);
    }
  };

  // ── actualizar estado (solo admin) ────────────────────────────────────────
  const actualizarEstado = async (record: Pqrs, nuevoEstado: string) => {
    setUpdatingId(record.idpqrs);
    try {
      const res = await fetch(API_ROUTES.PQRS, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idpqrs: record.idpqrs, estado: nuevoEstado }),
      });
      if (res.ok) {
        message.success(`Estado actualizado a "${nuevoEstado}"`);
        fetchPqrs();
      } else {
        const err = await res.json().catch(() => ({}));
        message.error(err.mensaje || 'No se pudo actualizar el estado');
      }
    } catch {
      message.error('Error de conexión');
    } finally {
      setUpdatingId(null);
    }
  };

  // ── enviar respuesta de admin ──────────────────────────────────────────────
  const enviarRespuesta = async () => {
    if (!replyText.trim()) {
      message.warning('Por favor escribe una respuesta.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(API_ROUTES.PQRS, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idpqrs: replyingTo!.idpqrs,
          estado: 'Resuelto',
          respuestaPqrs: replyText,
          fechaRespuesta: localIso(),
        }),
      });

      if (res.ok) {
        message.success('Respuesta enviada y estado actualizado a "Resuelto"');
        setReplyingTo(null);
        setReplyText('');
        fetchPqrs();
      } else {
        const err = await res.json().catch(() => ({}));
        message.error(err.mensaje || 'No se pudo enviar la respuesta');
      }
    } catch {
      message.error('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  // ── filtrado ──────────────────────────────────────────────────────────────
  const dataSource = (Array.isArray(pqrsList) ? pqrsList : [])
    .filter(p => isAdmin ? true : p.idUsuario === cedulaUsuario)
    .filter(p => {
      const s = searchText.toLowerCase();
      return !s || [p.tipo, p.descripcion, p.estado, p.idUsuario]
        .some(f => (f || '').toLowerCase().includes(s));
    });

  // ── columnas ──────────────────────────────────────────────────────────────
  const columns = [
    {
      title: 'N°',
      dataIndex: 'idpqrs',
      key: 'idpqrs',
      width: 60,
      render: (v: number) => <span className="font-mono font-bold text-slate-400 text-xs">#{v}</span>,
    },
    {
      title: 'Tipo',
      dataIndex: 'tipo',
      key: 'tipo',
      render: (v: string) => tipoTag(v),
    },
    {
      title: 'Descripción',
      dataIndex: 'descripcion',
      key: 'descripcion',
      width: 250,
      render: (v: string) => (
        <Text className="text-slate-600 whitespace-pre-wrap break-words block">{v || '—'}</Text>
      ),
    },
    ...(isAdmin ? [{
      title: 'Usuario',
      dataIndex: 'idUsuario',
      key: 'idUsuario',
      render: (v: string) => <Text className="font-mono text-slate-500 text-xs">{v}</Text>,
    }] : []),
    {
      title: 'APTO',
      dataIndex: 'numeroApartamento',
      key: 'numeroApartamento',
      render: (v: any, r: Pqrs) => <Text className="font-bold text-slate-600 text-xs">{r.numeroApartamento || v || '—'}</Text>,
    },
    {
      title: 'Fecha Creacion',
      dataIndex: 'fechaCreacion',
      key: 'fechaCreacion',
      render: (v: string) => <Text className="text-slate-500 text-xs">{formatDate(v)}</Text>,
      sorter: (a: Pqrs, b: Pqrs) =>
        new Date(a.fechaCreacion).getTime() - new Date(b.fechaCreacion).getTime(),
      defaultSortOrder: 'descend' as const,
    },
    {
      title: 'Fecha Respuesta',
      dataIndex: 'fechaRespuesta',
      key: 'fechaRespuesta',
      render: (v: string) => <Text className="text-slate-500 text-xs">{formatDate(v)}</Text>,
    },
    {
      title: 'Evidencia',
      key: 'evidencia',
      render: (_: any, r: Pqrs) => {
        if (!r.evidenciaUrl) return <Text className="text-slate-300 text-xs">Sin adjunto</Text>;
        const isPdf = (r.evidencia || '').toLowerCase().endsWith('.pdf');
        return isPdf ? (
          <Tooltip title="Ver PDF">
            <Button
              icon={<FilePdfOutlined className="text-red-500" />}
              className="rounded-lg border-slate-200 hover:border-red-400 h-9 w-9 flex items-center justify-center"
              onClick={() => window.open(r.evidenciaUrl!, '_blank')}
            />
          </Tooltip>
        ) : (
          <Tooltip title="Ver imagen">
            <Button
              icon={<EyeOutlined className="text-emerald-500" />}
              className="rounded-lg border-slate-200 hover:border-emerald-400 h-9 w-9 flex items-center justify-center"
              onClick={() => setPreviewUrl(r.evidenciaUrl!)}
            />
          </Tooltip>
        );
      },
    },
    {
      title: 'Respuesta',
      dataIndex: 'respuestaPqrs',
      key: 'respuestaPqrs',
      width: 250,
      render: (v: string, r: Pqrs) => (
        <Text className="text-slate-600 whitespace-pre-wrap break-words block">
          {getRespuesta(r) || '—'}
        </Text>
      ),
    },
    {
      title: 'Estado',
      key: 'estado',
      render: (_: any, r: Pqrs) => <div>{estadoBadge(r.estado)}</div>,
    },
    ...(isAdmin ? [{
      title: 'Acciones',
      key: 'acciones',
      render: (_: any, r: Pqrs) => (
        <Button
          size="small"
          type="primary"
          ghost
          className="border-emerald-500 text-emerald-600 hover:!bg-emerald-50"
          onClick={() => {
            setReplyingTo(r);
            setReplyText(getRespuesta(r) || '');
          }}
        >
          {getRespuesta(r) ? 'Editar Respuesta' : 'Responder'}
        </Button>
      )
    }] : []),
  ];

  // ─── render ───────────────────────────────────────────────────────────────
  return (
    <div className={`${activeView === 'history' ? 'max-w-[95%]' : 'max-w-7xl'} mx-auto pt-2 pb-20 px-4 transition-all duration-300`}>

      {/* Breadcrumb */}
      <Breadcrumb
        items={[{ title: 'Inicio' }, { title: 'PQRS' }]}
        className="mb-6 text-xs font-semibold uppercase tracking-wider text-slate-400"
      />

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
        <div>
          <Title level={1} className="!text-slate-900 !mb-2 !font-black tracking-tight">
            Peticiones, Quejas, Reclamos y Felicitaciones
          </Title>
          <Text className="text-slate-500 text-base font-medium flex items-center gap-2">
            <FileTextOutlined className="text-emerald-500" />
            Radica tu solicitud o consulta el historial de tus PQRS
          </Text>
        </div>

        <div className="bg-white p-1.5 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 flex-shrink-0">
          <Segmented
            size="large"
            value={activeView}
            onChange={(v) => setActiveView(v as 'new' | 'history')}
            options={[
              {
                value: 'new',
                label: (
                  <div className="flex items-center gap-2 px-3 py-1">
                    <PlusOutlined />
                    <span className="font-bold">Nueva PQRS</span>
                  </div>
                ),
              },
              {
                value: 'history',
                label: (
                  <div className="flex items-center gap-2 px-3 py-1">
                    <HistoryOutlined />
                    <span className="font-bold">Historial</span>
                  </div>
                ),
              },
            ]}
            className="custom-seg"
          />
        </div>
      </div>

      {/* ── Formulario Nueva PQRS ──────────────────────────────────────────── */}
      {activeView === 'new' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Tarjeta principal del formulario */}
          <Card className="lg:col-span-2 border-none shadow-2xl shadow-slate-200/60 rounded-[2rem] overflow-hidden">
            <div className="p-8">
              <Title level={3} className="!mb-1 !text-slate-800">Radicar una PQRS</Title>
              <Paragraph className="text-slate-500 !mb-8">
                Selecciona el tipo de solicitud, describe tu situación y adjunta evidencia si la tienes.
              </Paragraph>

              {/* Selector visual de tipo (controlado con estado local) */}
              <div className="mb-8">
                <Text className="font-bold text-slate-700 block mb-3">¿Qué vas a radicar?</Text>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {TIPOS_PQRS.map(t => (
                    <button
                      type="button"
                      key={t.value}
                      onClick={() => setTipoSelected(t.value)}
                      className={`
                        flex flex-col items-center gap-2 py-5 px-3 rounded-2xl border-2
                        transition-all duration-200 cursor-pointer font-bold text-sm
                        ${tipoSelected === t.value
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-md shadow-emerald-100'
                          : 'border-slate-200 bg-white text-slate-500 hover:border-emerald-300 hover:bg-slate-50'}
                      `}
                    >
                      <span className="text-2xl">{t.icon}</span>
                      <span>{t.value}</span>
                    </button>
                  ))}
                </div>
                {!tipoSelected && (
                  <Text className="text-slate-400 text-xs mt-2 block">
                    Selecciona uno de los tipos para continuar.
                  </Text>
                )}
              </div>

              {/* Formulario */}
              <Form form={form} layout="vertical" onFinish={onFinish} className="space-y-2">
                <Form.Item
                  name="descripcion"
                  label={<Text className="font-bold text-slate-700">Descripción detallada</Text>}
                  rules={[{ required: true, message: 'Por favor describe tu solicitud' }]}
                >
                  <TextArea
                    rows={5}
                    placeholder="Explica detalladamente tu petición, queja, reclamo o felicitación..."
                    className="rounded-2xl resize-none text-slate-700"
                    style={{ padding: '14px 16px' }}
                  />
                </Form.Item>

                <Form.Item
                  name="evidencia"
                  label={<Text className="font-bold text-slate-700">Adjuntar evidencia <span className="text-slate-400 font-normal">(opcional)</span></Text>}
                  valuePropName="fileList"
                  getValueFromEvent={(e) => Array.isArray(e) ? e : e?.fileList}
                >
                  <Upload maxCount={1} beforeUpload={() => false} accept="image/*,.pdf">
                    <Button
                      icon={<UploadOutlined />}
                      className="h-12 rounded-xl border-dashed hover:border-emerald-500 hover:text-emerald-500 font-semibold"
                    >
                      Subir imagen o PDF
                    </Button>
                  </Upload>
                </Form.Item>

                <Divider className="!border-slate-100 !my-6" />

                <Button
                  type="primary"
                  htmlType="submit"
                  size="large"
                  block
                  loading={loading}
                  disabled={!tipoSelected}
                  icon={<SendOutlined />}
                  className="h-14 bg-emerald-500 hover:!bg-emerald-600 border-none rounded-2xl text-base font-black shadow-lg shadow-emerald-500/20 transition-all"
                >
                  Radicar PQRS
                </Button>
              </Form>
            </div>
          </Card>

          {/* Panel lateral informativo */}
          <div className="flex flex-col gap-6">
            <Card className="bg-[#1e293b] border-none rounded-[2rem]">
              <div className="p-6">
                <Title level={5} className="!text-white !mb-5">¿Qué significa cada tipo?</Title>
                <div className="flex flex-col gap-4">
                  {TIPOS_PQRS.map(t => (
                    <div key={t.value} className="flex items-start gap-3">
                      <Tag
                        color={t.color}
                        className="rounded-full border-none font-bold text-[10px] uppercase shrink-0 mt-0.5"
                      >
                        {t.value}
                      </Tag>
                      <Text className="text-slate-400 text-xs leading-relaxed">{t.desc}</Text>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            <Card className="border-none shadow-lg rounded-[2rem] bg-emerald-50">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <ClockCircleOutlined className="text-emerald-500 text-xl" />
                  <Title level={5} className="!m-0 !text-slate-800">Tiempo de respuesta</Title>
                </div>
                <Text className="text-slate-600 text-sm leading-relaxed">
                  Las PQRS son atendidas en un plazo máximo de{' '}
                  <strong className="text-emerald-700">15 días hábiles</strong>{' '}
                  desde su radicación.
                </Text>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* ── Historial ─────────────────────────────────────────────────────── */}
      {activeView === 'history' && (
        <Card className="border-none shadow-2xl shadow-slate-200/60 rounded-[2rem] overflow-hidden">
          <div className="p-6">
            {/* Cabecera del historial */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
              <div>
                <Title level={3} className="!m-0 !text-slate-800">
                  {isAdmin ? 'Todas las PQRS' : 'Mis PQRS'}
                </Title>
                {isAdmin && (
                  <Text className="text-slate-400 text-xs font-medium block mt-1">
                    Puedes cambiar el estado de cada radicado directamente desde la tabla.
                  </Text>
                )}
              </div>
              <Space wrap>
                <Input
                  placeholder="Buscar..."
                  prefix={<SearchOutlined className="text-slate-400" />}
                  className="h-11 bg-slate-50 border-slate-100 rounded-2xl min-w-[200px]"
                  onChange={(e) => setSearchText(e.target.value)}
                  value={searchText}
                  allowClear
                />
                <Button
                  icon={<ReloadOutlined />}
                  onClick={fetchPqrs}
                  loading={loading}
                  className="h-11 w-11 flex items-center justify-center rounded-2xl border-slate-100 hover:text-emerald-500"
                />
              </Space>
            </div>

            <Table
              columns={columns}
              dataSource={dataSource}
              // 🌟 SOLUCIÓN: Usamos solo el 'record' y combinamos propiedades para asegurar un String único sin usar el index
              rowKey={(record) => {
                if (record.idpqrs) return String(record.idpqrs);
                // Salvavidas en caso de que falte el idpqrs en datos de prueba:
                return `pqrs-${record.idUsuario}-${record.fechaCreacion}`;
              }}
              loading={loading}
              pagination={{ pageSize: 8, showSizeChanger: false }}
              className="pqrs-table"
              scroll={{ x: true }}
              locale={{
                emptyText: (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description="No hay PQRS registradas"
                  />
                ),
              }}
            />
          </div>
        </Card>
      )}

      <Modal
        open={!!previewUrl}
        footer={null}
        onCancel={() => setPreviewUrl(null)}
        centered
        width={700}
      >
        {previewUrl && (
          <img src={previewUrl} alt="Evidencia" className="w-full h-auto rounded-2xl mt-4" />
        )}
      </Modal>

      {/* Modal para que el admin responda */}
      <Modal
        title={<div className="flex items-center gap-2"><MessageOutlined className="text-emerald-500" /> Responder PQRS #{replyingTo?.idpqrs}</div>}
        open={!!replyingTo}
        onCancel={() => {
          setReplyingTo(null);
          setReplyText('');
        }}
        onOk={enviarRespuesta}
        okText="Enviar Respuesta"
        cancelText="Cancelar"
        confirmLoading={loading}
        okButtonProps={{ className: 'bg-emerald-500 hover:!bg-emerald-600 border-none' }}
      >
        <div className="mb-4 bg-slate-50 p-4 rounded-xl border border-slate-100 mt-4">
          <Text className="font-bold text-slate-700 block mb-1">Descripción del usuario:</Text>
          <Text className="text-slate-600 italic">{replyingTo?.descripcion}</Text>
        </div>
        <Text className="font-bold text-slate-700 block mb-2">Tu respuesta:</Text>
        <TextArea
          rows={4}
          value={replyText}
          onChange={(e) => setReplyText(e.target.value)}
          placeholder="Escribe la respuesta aquí..."
          className="rounded-xl"
        />
        <Text className="text-slate-400 text-xs mt-2 block">
          * Al enviar, el estado de la PQRS cambiará automáticamente a "Resuelto".
        </Text>
      </Modal>

      {/* Modal para ver la respuesta (Admin/Usuario) */}
      <Modal
        title={<div className="flex items-center gap-2"><MessageOutlined className="text-emerald-500" /> Respuesta a PQRS #{viewingReply?.idpqrs}</div>}
        open={!!viewingReply}
        footer={[
          <Button key="close" type="primary" onClick={() => setViewingReply(null)} className="bg-emerald-500 hover:!bg-emerald-600 border-none">
            Cerrar
          </Button>
        ]}
        onCancel={() => setViewingReply(null)}
      >
        <div className="my-4 bg-emerald-50 p-4 rounded-xl border border-emerald-100">
          <Text className="text-slate-700">{viewingReply?.respuestaPqrs}</Text>
        </div>
      </Modal>

      <style jsx global>{`
        /* Segmented */
        .custom-seg .ant-segmented-item {
          transition: all .25s ease !important;
          border-radius: 12px !important;
        }
        .custom-seg .ant-segmented-item-selected {
          background: #1e293b !important;
          color: white !important;
          box-shadow: 0 4px 12px rgba(30,41,59,.2) !important;
        }

        /* Tabla */
        .pqrs-table .ant-table-thead > tr > th {
          background: #f8fafc !important;
          color: #64748b !important;
          font-weight: 700 !important;
          text-transform: uppercase !important;
          font-size: 11px !important;
          letter-spacing: .05em !important;
          border-bottom: 2px solid #f1f5f9 !important;
          padding: 14px 16px !important;
        }
        .pqrs-table .ant-table-tbody > tr > td {
          padding: 16px !important;
          border-bottom: 1px solid #f1f5f9 !important;
          vertical-align: middle !important;
        }
        .pqrs-table .ant-table-row:hover > td {
          background: #f0fdf4 !important;
        }
      `}</style>
    </div>
  );
}
