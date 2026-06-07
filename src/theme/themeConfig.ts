import type { ThemeConfig } from 'antd';

const theme: ThemeConfig = {
  token: {
    colorPrimary: '#10b981', // Emerald 500
    colorInfo: '#0ea5e9',    // Sky 500
    colorBgLayout: '#f8fafc', // Slate 50 background
    colorTextBase: '#1e293b', // Slate 800 text
    borderRadius: 12,        // More rounded for modern feel
    fontFamily: 'var(--font-geist-sans)',
  },
  components: {
    Layout: {
      headerBg: '#ffffff',
      siderBg: '#1e293b',
    },
    Menu: {
      darkItemBg: '#1e293b',
      darkItemSelectedBg: '#334155',
      darkItemSelectedColor: '#10b981',
      itemBorderRadius: 8,
    },
    Card: {
      borderRadiusLG: 16,
    },
    Button: {
      borderRadius: 8,
      controlHeight: 40,
    }
  }
};

export default theme;
