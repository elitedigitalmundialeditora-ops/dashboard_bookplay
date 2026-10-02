import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import { useData } from './context/DataContext';
import { Navbar } from './components/common/Navbar';
import { FloatingDailyCard } from './components/common/FloatingDailyCard';
import { DashboardTab } from './components/tabs/DashboardTab';
import { VisaoSetorTab } from './components/tabs/VisaoSetorTab';
import { OperadoresTab } from './components/tabs/OperadoresTab';
import { EquipesTab } from './components/tabs/EquipesTab';
import { AdminTab } from './components/tabs/AdminTab';
import { HistoricoTab } from './components/tabs/HistoricoTab';
import { ImportarModal } from './components/tabs/ImportarModal';
import { CheckCircle } from 'lucide-react';

export function App() {
  const { loading } = useData();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [importarModalOpen, setImportarModalOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: '#F8FAFC',
        color: '#0F2E52'
      }}>
        <div style={{
          width: 48,
          height: 48,
          border: '4px solid #E2E8F0',
          borderTopColor: '#1E6DC3',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <p style={{ marginTop: 16, fontWeight: 700, fontSize: '1.1rem' }}>
          Conectando e sincronizando dados em tempo real...
        </p>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="app-container">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenImportar={() => setImportarModalOpen(true)}
      />

      <main className="main-content">
        {activeTab === 'dashboard' && <DashboardTab />}
        {activeTab === 'visaoSetor' && <VisaoSetorTab />}
        {activeTab === 'operadores' && <OperadoresTab />}
        {activeTab === 'equipes' && <EquipesTab />}
        {activeTab === 'admin' && <AdminTab onToast={showToast} />}
        {activeTab === 'historico' && <HistoricoTab />}
      </main>

      {/* Card Flutuante de Recebimento do Dia */}
      <FloatingDailyCard />

      {/* Modal de Importação Excel */}
      <ImportarModal
        isOpen={importarModalOpen}
        onClose={() => setImportarModalOpen(false)}
        onToast={showToast}
      />

      {/* Notificação Toast */}
      {toastMsg && (
        <div style={{
          position: 'fixed',
          bottom: 24,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1000,
          background: '#0F2E52',
          color: 'white',
          padding: '12px 24px',
          borderRadius: 12,
          boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          fontWeight: 600,
          fontSize: '0.9rem'
        }}>
          <CheckCircle size={18} color="#10B981" />
          {toastMsg}
        </div>
      )}
    </div>
  );
}
