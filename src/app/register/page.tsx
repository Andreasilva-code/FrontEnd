'use client';

import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, App as AntdApp } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { API_ROUTES } from '@/config/api';

const { Title } = Typography;

const RegisterPage = () => {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { message } = AntdApp.useApp();

  const onFinish = async (values: any) => {
    setLoading(true);

    const payload = {
      idUsuarios: Number(values.idUsuarios),
      nombreUsuario: values.nombreUsuario,
      clave: values.clave,
      fechaCreacion: new Date().toISOString().slice(0, 19).replace('T', ' '),
      correo: values.correo,
      Arrendatario_idArrendatario: null,
      Funcionarios_idFuncionario: null,
      Propietario_idPropietario: 1,
    };

    try {
      const response = await fetch(API_ROUTES.REGISTER, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        message.success('Usuario registrado con éxito');
        router.push('/');
      } else {
        const errorData = await response.json().catch(() => null);
        message.error(errorData?.message || 'Hubo un error al registrar el usuario');
      }
    } catch (error) {
      console.error('Error enviando datos:', error);
      message.error('No se pudo conectar con el servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center h-full py-8">
      <Card className="w-full max-w-md shadow-sm border-slate-200 rounded-xl">
        <div className="text-center mb-6">
          <Title level={2} className="!text-slate-800">Crear Cuenta</Title>
          <p className="text-slate-500">Administración Residencial</p>
        </div>

        <Form name="register" onFinish={onFinish} layout="vertical">
          <Form.Item name="idUsuarios" label="Identificación" rules={[{ required: true, message: 'Requerido' }]}>
            <Input placeholder="Ej: 11111123" size="large" />
          </Form.Item>

          <Form.Item name="nombreUsuario" label="Nombre de Usuario" rules={[{ required: true, message: 'Requerido' }]}>
            <Input prefix={<UserOutlined className="text-slate-400" />} placeholder="Usuario" size="large" />
          </Form.Item>

          <Form.Item name="correo" label="Correo Electrónico" rules={[{ required: true, type: 'email', message: 'Correo inválido' }]}>
            <Input prefix={<MailOutlined className="text-slate-400" />} placeholder="ejemplo@correo.com" size="large" />
          </Form.Item>

          <Form.Item name="clave" label="Contraseña" rules={[{ required: true, message: 'Requerido' }]}>
            <Input.Password prefix={<LockOutlined className="text-slate-400" />} placeholder="Tu contraseña" size="large" />
          </Form.Item>

          <Form.Item className="mt-6 mb-0">
            <Button type="primary" htmlType="submit" block size="large" className="bg-blue-900" loading={loading}>
              Registrarse
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default RegisterPage;
