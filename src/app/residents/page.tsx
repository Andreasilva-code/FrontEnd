'use client';

import React, { useState, useEffect } from 'react';
import { Table, Card, Tag, Typography, Input, Button, Space, Avatar, App as AntdApp, Breadcrumb } from 'antd';
import { API_ROUTES } from '@/config/api';
import {
  UserOutlined,
  SearchOutlined,
  ReloadOutlined,
  FilterOutlined,
  UsergroupAddOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;

interface Residente {
  id: number;
  nombre: string;
  apellido: string | null;
  cedula: string;
  celular: string;
  correo: string;
  Apartamento_idApartamento: string;
  estado: string;
  tipo: string;
}

export default function ResidentsPage() {
  const [residents, setResidents] = useState<Residente[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const { message } = AntdApp.useApp();

  const fetchResidents = async () => {
    setLoading(true);
    try {
      const response = await fetch(API_ROUTES.RESIDENTS);
      const data = await response.json();
      if (data && data.body) {
        setResidents(data.body);
      }
    } catch (error) {
      console.error("Error fetching residents:", error);
      message.error("No se pudo cargar la lista de residentes.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResidents();
  }, []);

  const filteredResidents = residents.filter(res => {
    const fullName = `${res.nombre} ${res.apellido || ''}`.toLowerCase();
    const search = searchText.toLowerCase();
    return fullName.includes(search) || res.correo.toLowerCase().includes(search) || res.tipo.toLowerCase().includes(search) || res.cedula?.includes(search);
  });

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      className: 'text-slate-400 font-mono text-xs',
    },
    {
      title: 'Nombre',
      dataIndex: 'nombre',
      key: 'nombre',
      render: (text: string) => <Text className="font-bold text-slate-800 capitalize">{text}</Text>,
    },
    {
      title: 'Apellido',
      dataIndex: 'apellido',
      key: 'apellido',
      render: (text: string) => <Text className="text-slate-600 capitalize">{text || '-'}</Text>,
    },
    {
      title: 'Cédula',
      dataIndex: 'cedula',
      key: 'cedula',
      render: (text: string) => <Text className="text-slate-500 font-medium">{text}</Text>,
    },
    {
      title: 'Celular',
      dataIndex: 'celular',
      key: 'celular',
      render: (text: string) => <Text className="text-slate-500">{text}</Text>,
    },
    {
      title: 'Correo',
      dataIndex: 'correo',
      key: 'correo',
      render: (text: string) => <Text className="text-slate-500">{text}</Text>,
    },
    {
      title: 'Apartamento',
      dataIndex: 'Apartamento_idApartamento',
      key: 'Apartamento_idApartamento',
      render: (text: string) => (
        <Tag className="bg-slate-100 border-slate-200 text-slate-600 font-bold rounded-lg px-3">
          {text}
        </Tag>
      ),
    },
    {
      title: 'Estado',
      dataIndex: 'estado',
      key: 'estado',
      render: (estado: string) => (
        <Tag
          color={estado === '1' ? 'green' : 'red'}
          className="rounded-lg font-bold"
        >
          {estado === '1' ? 'ACTIVO' : 'INACTIVO'}
        </Tag>
      ),
    },
    {
      title: 'Tipo',
      dataIndex: 'tipo',
      key: 'tipo',
      render: (tipo: string) => (
        <Tag
          color={tipo === 'Propietario' ? 'emerald' : 'cyan'}
          className="rounded-full px-3 py-0.5 border-none font-bold text-[10px] uppercase tracking-wider"
        >
          {tipo}
        </Tag>
      ),
    },
  ];

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="mb-8">
        <Breadcrumb
          items={[
            { title: 'Inicio' },
            { title: 'Gestión Residencial' },
            { title: 'Residentes' },
          ]}
          className="mb-4 text-xs font-medium uppercase tracking-wider text-slate-400"
        />
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <Title level={1} className="!text-slate-900 !mb-1 !font-extrabold tracking-tight">Gestión de Residentes</Title>
            <Text className="text-slate-500 text-base font-medium">Administra la base de datos de propietarios y arrendatarios.</Text>
          </div>
          <Button
            type="primary"
            size="large"
            icon={<UsergroupAddOutlined />}
            className="bg-emerald-500 hover:!bg-emerald-600 shadow-lg shadow-emerald-500/20 border-none rounded-2xl font-bold px-8"
          >
            Nuevo Residente
          </Button>
        </div>
      </div>

      <Card className="border-none shadow-xl shadow-slate-200/60 rounded-[2rem] overflow-hidden">
        <div className="p-2">
          <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 px-4">
            <Input
              placeholder="Buscar por nombre, correo o tipo..."
              prefix={<SearchOutlined className="text-slate-400" />}
              className="max-w-md h-12 bg-slate-50 border-slate-100 hover:border-emerald-200 focus:border-emerald-500 rounded-2xl transition-all"
              onChange={(e) => setSearchText(e.target.value)}
              value={searchText}
            />
            <Space>
              <Button
                icon={<ReloadOutlined />}
                onClick={fetchResidents}
                className="h-12 w-12 flex items-center justify-center rounded-2xl border-slate-100 text-slate-500 hover:text-emerald-500"
              />
              <Button
                icon={<FilterOutlined />}
                className="h-12 px-6 flex items-center gap-2 rounded-2xl border-slate-100 text-slate-500 font-bold hover:text-emerald-500"
              >
                Filtros
              </Button>
            </Space>
          </div>

          <Table
            columns={columns}
            dataSource={filteredResidents}
            loading={loading}
            rowKey={(record) => `${record.id}-${record.nombre}-${record.apellido}`}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              className: "px-6",
            }}
            className="modern-table"
            scroll={{ x: true }}
          />
        </div>
      </Card>

      <style jsx global>{`
        .modern-table .ant-table {
          background: transparent !important;
        }
        .modern-table .ant-table-thead > tr > th {
          background: #f8fafc !important;
          color: #64748b !important;
          font-weight: 700 !important;
          text-transform: uppercase !important;
          font-size: 11px !important;
          letter-spacing: 0.05em !important;
          border-bottom: 1px solid #f1f5f9 !important;
          padding: 24px !important;
        }
        .modern-table .ant-table-tbody > tr > td {
          padding: 20px 24px !important;
          border-bottom: 1px solid #f8fafc !important;
          transition: all 0.3s !important;
        }
        .modern-table .ant-table-tbody > tr:hover > td {
          background: #f0fdf4 !important;
        }
        .modern-table .ant-pagination-item-active {
          border-color: #10b981 !important;
        }
        .modern-table .ant-pagination-item-active a {
          color: #10b981 !important;
        }
      `}</style>
    </div>
  );
}
