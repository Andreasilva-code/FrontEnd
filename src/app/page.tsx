'use client';

import React, { useState, useEffect } from 'react';
import { Card, Avatar, Tag, Typography, Button, Space, Input, Spin, App as AntdApp, Skeleton, Divider } from 'antd';
import { useAuth } from '@/context/AuthContext';
import { API_ROUTES } from '@/config/api';
import {
  NotificationOutlined,
  CalendarOutlined,
  ToolOutlined,
  LikeOutlined,
  CommentOutlined,
  ShareAltOutlined,
  SendOutlined,
  PlusOutlined
} from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;
const { TextArea } = Input;

interface Publicacion {
  idPublicacion: number;
  titulo: string;
  contenido: string;
  imagen_url: string | null;
  fecha_creacion: string;
  tipo_categoria: string;
  idUsuario: number;
  autor: string;
}

const getCategoryColor = (category: string) => {
  const normalizedCategory = category?.toLowerCase() || '';
  if (normalizedCategory.includes('urgente')) return 'volcano';
  if (normalizedCategory.includes('mantenimiento')) return 'orange';
  if (normalizedCategory.includes('evento')) return 'cyan';
  return 'blue';
};

const getCategoryIcon = (category: string) => {
  const normalizedCategory = category?.toLowerCase() || '';
  if (normalizedCategory.includes('urgente') || normalizedCategory.includes('mantenimiento')) return <ToolOutlined />;
  if (normalizedCategory.includes('evento')) return <CalendarOutlined />;
  return <NotificationOutlined />;
};

export default function Home() {
  const { user } = useAuth();
  const { message } = AntdApp.useApp();
  const isAdmin = user?.rol?.toLowerCase() === 'administrador';
  const [posts, setPosts] = useState<Publicacion[]>([]);
  const [loading, setLoading] = useState(true);

  const [titulo, setTitulo] = useState('');
  const [contenido, setContenido] = useState('');
  const [categoria, setCategoria] = useState('Comunicado');
  const [submitting, setSubmitting] = useState(false);

  const fetchPosts = async () => {
    try {
      const response = await fetch(`${API_ROUTES.MURO}/`);
      const data = await response.json();
      if (data && data.body) {
        setPosts(data.body);
      }
    } catch (error) {
      console.error("Error al obtener las publicaciones:", error);
      message.error("No se pudieron cargar las publicaciones del muro.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handlePost = async () => {
    if (!titulo.trim() || !contenido.trim()) {
      message.warning('Por favor ingresa un título y un contenido.');
      return;
    }

    setSubmitting(true);

    const payload = {
      titulo,
      contenido,
      idUsuario: user?.cedula ? Number(user.cedula) : 999999999,
      tipo_categoria: categoria
    };

    try {
      const response = await fetch(`${API_ROUTES.MURO}/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        message.success('¡Publicación compartida con éxito!');
        setTitulo('');
        setContenido('');
        fetchPosts();
      } else {
        const errorData = await response.json().catch(() => null);
        message.error(`Error: ${errorData?.mensaje || 'Hubo un problema al publicar.'}`);
      }
    } catch (error) {
      console.error('Error enviando publicación', error);
      message.error('No se pudo conectar con el servidor.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('es-ES', options);
  };

  return (
    <div className="max-w-4xl mx-auto pb-12">
      {/* Featured Image Banner */}
      <div className="mb-12 rounded-[2.5rem] overflow-hidden shadow-2xl shadow-slate-200/60 border border-slate-100 bg-white p-2 animate-in fade-in zoom-in duration-1000">
        <div className="relative group overflow-hidden rounded-[2rem]">
          <img 
            src="/FotoFrenteConjunto.png" 
            alt="Frente del Conjunto Prados del Portal II" 
            className="w-full h-[300px] sm:h-[450px] object-cover transition-transform duration-1000 ease-out group-hover:scale-105" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-500" />
          <div className="absolute bottom-8 left-8 text-white">
            <Tag color="rgba(16, 185, 129, 0.9)" className="mb-3 px-4 py-1 border-none rounded-full font-bold uppercase tracking-widest text-[10px]">
              Vista Principal
            </Tag>
            <Title level={2} className="!text-white !m-0 !font-black !text-3xl sm:!text-4xl tracking-tight">Prados del Portal II</Title>
            <Text className="text-slate-100/90 text-sm sm:text-base font-medium">Tu hogar, nuestra prioridad</Text>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-4">
        <div>
          <Title level={1} className="!text-slate-900 !mb-1 !font-extrabold tracking-tight">Muro Social</Title>
          <Text className="text-slate-500 text-base font-medium">Novedades y comunicados de Prados del Portal II</Text>
        </div>
        <div className="hidden sm:flex bg-white px-4 py-2 rounded-2xl shadow-sm border border-slate-100 items-center gap-3">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          <span className="text-slate-600 text-xs font-bold uppercase tracking-wider">Sistema Actualizado</span>
        </div>
      </div>

      {isAdmin && (
        <Card className="mb-12 shadow-xl shadow-slate-200/50 border-none rounded-[2rem] overflow-hidden p-2">
          <div className="p-6">
            <div className="flex gap-5">
              <Avatar size={56} className="bg-emerald-500 shadow-lg shadow-emerald-500/20 flex-shrink-0 border-4 border-emerald-50 font-bold">
                {user?.nombreUsuario?.charAt(0).toUpperCase() || 'AD'}
              </Avatar>
              <div className="flex-grow">
                <Input
                  placeholder="Título de la publicación..."
                  variant="borderless"
                  className="text-xl font-bold p-0 mb-2 placeholder:text-slate-300"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                />
                <TextArea
                  rows={3}
                  variant="borderless"
                  placeholder="¿Qué hay de nuevo en la comunidad?"
                  className="text-base p-0 mb-4 resize-none placeholder:text-slate-300 text-slate-600"
                  value={contenido}
                  onChange={(e) => setContenido(e.target.value)}
                />

                <Divider className="my-4 border-slate-100" />

                <div className="flex justify-between items-center flex-wrap gap-4">
                  <Space wrap size="small">
                    <Button
                      icon={<NotificationOutlined />}
                      type={categoria === 'Comunicado' ? 'primary' : 'text'}
                      className={`rounded-xl font-bold ${categoria === 'Comunicado' ? 'bg-emerald-500' : 'text-slate-400 hover:text-emerald-500 hover:bg-emerald-50'}`}
                      onClick={() => setCategoria('Comunicado')}
                    >
                      Comunicado
                    </Button>
                    <Button
                      icon={<CalendarOutlined />}
                      type={categoria === 'Evento' ? 'primary' : 'text'}
                      className={`rounded-xl font-bold ${categoria === 'Evento' ? 'bg-emerald-500' : 'text-slate-400 hover:text-emerald-500 hover:bg-emerald-50'}`}
                      onClick={() => setCategoria('Evento')}
                    >
                      Evento
                    </Button>
                    <Button
                      icon={<ToolOutlined />}
                      type={categoria === 'Urgente' ? 'primary' : 'text'}
                      className={`rounded-xl font-bold ${categoria === 'Urgente' ? 'bg-emerald-500' : 'text-slate-400 hover:text-emerald-500 hover:bg-emerald-50'}`}
                      onClick={() => setCategoria('Urgente')}
                    >
                      Urgente
                    </Button>
                  </Space>
                  <Button
                    type="primary"
                    size="large"
                    className="bg-[#1e293b] hover:!bg-slate-800 border-none rounded-2xl px-8 font-bold shadow-lg shadow-slate-900/10 flex items-center gap-2"
                    icon={<PlusOutlined />}
                    onClick={handlePost}
                    loading={submitting}
                  >
                    Publicar
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {loading ? (
        <div className="space-y-8">
          {[1, 2, 3].map(i => (
            <Card key={i} className="rounded-3xl border-none shadow-sm p-6">
              <Skeleton avatar active paragraph={{ rows: 3 }} />
            </Card>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-[2rem] shadow-sm border border-dashed border-slate-200">
          <NotificationOutlined className="text-5xl text-slate-200 mb-4" />
          <p className="text-slate-400 text-lg font-medium">No hay publicaciones disponibles en este momento.</p>
        </div>
      ) : (
        <div className="bg-white rounded-[2.5rem] p-4 sm:p-8 border border-slate-200 shadow-2xl shadow-slate-200/60">
          <div className="h-[650px] overflow-y-auto pr-4 
            [&::-webkit-scrollbar]:w-2
            [&::-webkit-scrollbar-track]:bg-slate-50
            [&::-webkit-scrollbar-track]:rounded-full
            [&::-webkit-scrollbar-thumb]:bg-slate-200
            [&::-webkit-scrollbar-thumb]:rounded-full
            hover:[&::-webkit-scrollbar-thumb]:bg-emerald-500
            transition-all duration-300"
          >
            <div className="flex flex-col gap-8 pb-4">
              {posts.map((post) => (
                <Card 
                  key={post.idPublicacion} 
                  className="border-none shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 rounded-[2rem] overflow-hidden group"
                  styles={{ body: { padding: '2rem' } }}
                >
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex gap-4">
                      <Avatar size={48} className="bg-slate-100 text-slate-400 font-bold border border-slate-200">
                        {post.autor ? post.autor.substring(0, 2).toUpperCase() : 'AD'}
                      </Avatar>
                      <div className="flex flex-col justify-center">
                        <Title level={5} className="!mb-0 !text-slate-900 !font-bold capitalize">{post.autor}</Title>
                        <Text className="text-slate-400 text-xs font-semibold uppercase tracking-wider">{formatDate(post.fecha_creacion)}</Text>
                      </div>
                    </div>
                    <Tag 
                      color={getCategoryColor(post.tipo_categoria)} 
                      className="rounded-xl px-4 py-1 border-none font-bold text-[10px] uppercase tracking-widest flex items-center gap-1"
                    >
                      {getCategoryIcon(post.tipo_categoria)}
                      {post.tipo_categoria}
                    </Tag>
                  </div>
                  
                  <Title level={3} className="!text-slate-900 !mb-4 !font-extrabold leading-tight group-hover:text-emerald-600 transition-colors">
                    {post.titulo}
                  </Title>
                  <Paragraph className="text-slate-600 text-base leading-relaxed mb-6 whitespace-pre-line font-medium">
                    {post.contenido}
                  </Paragraph>
                  
                  {post.imagen_url && (
                    <div className="mt-6 rounded-[1.5rem] overflow-hidden border border-slate-100 shadow-inner bg-slate-50">
                      <img src={post.imagen_url} alt="Imagen adjunta" className="w-full h-auto object-cover max-h-[500px]" />
                    </div>
                  )}

                  <Divider className="my-6 border-slate-50" />

                  <div className="flex justify-between items-center">
                    <Space size="large">
                      <Button type="text" icon={<LikeOutlined className="text-lg" />} className="text-slate-400 font-bold hover:text-emerald-500 hover:bg-emerald-50 rounded-xl px-4">
                        Me gusta
                      </Button>
                      <Button type="text" icon={<CommentOutlined className="text-lg" />} className="text-slate-400 font-bold hover:text-sky-500 hover:bg-sky-50 rounded-xl px-4">
                        Comentar
                      </Button>
                    </Space>
                    <Button type="text" icon={<ShareAltOutlined className="text-lg" />} className="text-slate-400 font-bold hover:text-slate-600 hover:bg-slate-100 rounded-xl px-4">
                      Compartir
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
