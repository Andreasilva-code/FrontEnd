'use client';

import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, App as AntdApp } from 'antd';
import { LockOutlined, MailOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { API_ROUTES } from '@/config/api';

const { Title } = Typography;

const LoginPage = () => {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { message } = AntdApp.useApp();
  const { login } = useAuth();

  const onFinish = async (values: any) => {
    setLoading(true);

    const payload = {
      correo: values.correo,
      clave: values.clave,
    };

    try {
      const response = await fetch(API_ROUTES.LOGIN, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        // La API ahora retorna: { body: { user: { id, correo, rol } } }
        const responseData = await response.json().catch(() => ({}));
        const userPayload = responseData?.body?.user || {};

        const userData = {
          nombreUsuario: userPayload.nombreUsuario || payload.correo.split('@')[0],
          correo: userPayload.correo || payload.correo,
          cedula: userPayload.id || null,
          rol: userPayload.rol || 'propietario' // Guardamos el rol directamente
        };

        login(userData);
        message.success('Inicio de sesión exitoso');
        router.push('/');
      } else {
        const errorData = await response.json().catch(() => null);
        message.error(errorData?.message || 'Correo o contraseña incorrectos');
      }
    } catch (error) {
      console.error('Error enviando datos:', error);
      message.error('No se pudo conectar con el servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center h-full py-16">
      <Card className="w-full max-w-md shadow-sm border-slate-200 rounded-xl">
        <div className="text-center mb-6">
          <Title level={2} className="!text-slate-800">Iniciar Sesión</Title>
          <p className="text-slate-500">Panel de Administración Residencial</p>
        </div>

        <Form name="login" onFinish={onFinish} layout="vertical">
          <Form.Item name="correo" label="Correo Electrónico" rules={[{ required: true, type: 'email', message: 'Por favor ingrese un correo válido' }]}>
            <Input prefix={<MailOutlined className="text-slate-400" />} placeholder="ejemplo@correo.com" size="large" />
          </Form.Item>

          <Form.Item name="clave" label="Contraseña" rules={[{ required: true, message: 'Por favor ingrese su contraseña' }]}>
            <Input.Password prefix={<LockOutlined className="text-slate-400" />} placeholder="Tu contraseña" size="large" />
          </Form.Item>

          <Form.Item className="mt-8 mb-0">
            <Button type="primary" htmlType="submit" block size="large" className="bg-blue-900" loading={loading}>
              Ingresar
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default LoginPage;
