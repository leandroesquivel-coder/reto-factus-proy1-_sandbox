import React, { useState, useEffect } from 'react';
import {
  FileText,
  Users,
  Package,
  Database,
  Key,
  HelpCircle,
  Play,
  RefreshCw,
  Plus,
  Trash2,
  Download,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Server,
  Layers,
  Copy,
  Check,
  Search,
  Eye,
  Settings2,
  Clock,
  ShieldCheck,
  ArrowRight,
  Code2,
  ChevronRight,
  FileCode,
  Globe,
  DollarSign
} from 'lucide-react';

interface SystemStatus {
  status: number;
  database: {
    mode: string;
    connected: boolean;
    isExternal: boolean;
    connectionInfo: string;
    host: string;
    database: string;
    lastError: string | null;
    tableCounts: Record<string, number>;
  };
  factus: {
    config: {
      url_api: string;
      client_id: string;
      email: string;
      simulationMode: boolean;
      has_credentials: boolean;
    };
    token: {
      access_token: string | null;
      refresh_token: string | null;
      expires_at: number | null;
      last_updated: string | null;
      is_simulated: boolean;
      status: string;
      error_message: string | null;
    };
  };
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'app' | 'facturas' | 'clientes' | 'productos' | 'database' | 'factus_api' | 'deploy_guide'>('app');
  const [appSubpage, setAppSubpage] = useState<string>('factus-app.html');
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [copied, setCopied] = useState<string | null>(null);

  // Database Tab States
  const [dbConnStr, setDbConnStr] = useState<string>('');
  const [dbConnecting, setDbConnecting] = useState<boolean>(false);
  const [dbMsg, setDbMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [sqlQuery, setSqlQuery] = useState<string>('SELECT * FROM customer LIMIT 10;');
  const [sqlRunning, setSqlRunning] = useState<boolean>(false);
  const [sqlResult, setSqlResult] = useState<{ rows: any[]; rowCount: number } | null>(null);
  const [sqlError, setSqlError] = useState<string | null>(null);

  // Factus API Tab States
  const [factusUrlApi, setFactusUrlApi] = useState<string>('https://api-sandbox.factus.com.co');
  const [factusClientId, setFactusClientId] = useState<string>('');
  const [factusClientSecret, setFactusClientSecret] = useState<string>('');
  const [factusEmail, setFactusEmail] = useState<string>('');
  const [factusPassword, setFactusPassword] = useState<string>('');
  const [factusSimulation, setFactusSimulation] = useState<boolean>(true);
  const [factusSaving, setFactusSaving] = useState<boolean>(false);
  const [factusMsg, setFactusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Guide Config Generator State
  const [guideBackendUrl, setGuideBackendUrl] = useState<string>('https://mi-backend-factus.onrender.com');

  // Facturas List State
  const [invoices, setInvoices] = useState<any[]>([]);
  const [invoicesLoading, setInvoicesLoading] = useState<boolean>(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);
  const [searchInvoiceNumber, setSearchInvoiceNumber] = useState<string>('');
  const [showNewInvoiceModal, setShowNewInvoiceModal] = useState<boolean>(false);

  // Customers State
  const [customers, setCustomers] = useState<any[]>([]);
  const [customersLoading, setCustomersLoading] = useState<boolean>(false);
  const [showNewCustomerModal, setShowNewCustomerModal] = useState<boolean>(false);
  const [editingCustomer, setEditingCustomer] = useState<any | null>(null);

  // Products State
  const [products, setProducts] = useState<any[]>([]);
  const [productsLoading, setProductsLoading] = useState<boolean>(false);

  // Municipalities & Select data
  const [municipalities, setMunicipalities] = useState<any[]>([]);
  const [idTypes, setIdTypes] = useState<any[]>([]);
  const [tributes, setTributes] = useState<any[]>([]);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);

  // Fetch system status
  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/system/status');
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
        setFactusSimulation(data.factus.config.simulationMode);
        setFactusUrlApi(data.factus.config.url_api);
        setFactusEmail(data.factus.config.email);
      }
    } catch (err) {
      console.error('Error fetching status:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    loadAuxData();
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadAuxData = async () => {
    try {
      const [mRes, idRes, trRes, orgRes, pmRes] = await Promise.all([
        fetch('/api/get-data/municipality').then((r) => r.json()),
        fetch('/api/get-data/identification_document').then((r) => r.json()),
        fetch('/api/get-data/customer_tribute').then((r) => r.json()),
        fetch('/api/get-data/legal_organization').then((r) => r.json()),
        fetch('/api/get-data/payment_method').then((r) => r.json()),
      ]);
      if (mRes.data) setMunicipalities(mRes.data);
      if (idRes.data) setIdTypes(idRes.data);
      if (trRes.data) setTributes(trRes.data);
      if (orgRes.data) setOrganizations(orgRes.data);
      if (pmRes.data) setPaymentMethods(pmRes.data);
    } catch (e) {
      console.warn('Auxiliary data load:', e);
    }
  };

  const loadInvoices = async () => {
    setInvoicesLoading(true);
    try {
      const res = await fetch('/api/factura');
      const data = await res.json();
      if (data.status === 200 && Array.isArray(data.data)) {
        setInvoices(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setInvoicesLoading(false);
    }
  };

  const loadCustomers = async () => {
    setCustomersLoading(true);
    try {
      const res = await fetch('/api/get-data/customer');
      const data = await res.json();
      if (data.data) {
        setCustomers(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCustomersLoading(false);
    }
  };

  const loadProducts = async () => {
    setProductsLoading(true);
    try {
      const res = await fetch('/api/get-data/products');
      const data = await res.json();
      if (data.data) {
        setProducts(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setProductsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'facturas') loadInvoices();
    if (activeTab === 'clientes') loadCustomers();
    if (activeTab === 'productos') loadProducts();
  }, [activeTab]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2500);
  };

  const handleTestPostgres = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dbConnStr.trim()) return;
    setDbConnecting(true);
    setDbMsg(null);
    try {
      const res = await fetch('/api/system/db-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connectionString: dbConnStr.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setDbMsg({ type: 'success', text: data.message });
        await fetchStatus();
      } else {
        setDbMsg({ type: 'error', text: data.message });
      }
    } catch (err: any) {
      setDbMsg({ type: 'error', text: err.message });
    } finally {
      setDbConnecting(false);
    }
  };

  const handleRunSql = async () => {
    if (!sqlQuery.trim()) return;
    setSqlRunning(true);
    setSqlResult(null);
    setSqlError(null);
    try {
      const res = await fetch('/api/system/execute-sql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql: sqlQuery }),
      });
      const data = await res.json();
      if (res.ok) {
        setSqlResult(data);
      } else {
        setSqlError(data.error || 'Error al ejecutar SQL');
      }
    } catch (err: any) {
      setSqlError(err.message);
    } finally {
      setSqlRunning(false);
    }
  };

  const handleSaveFactusConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setFactusSaving(true);
    setFactusMsg(null);
    try {
      const payload: any = {
        url_api: factusUrlApi,
        simulationMode: factusSimulation,
      };
      if (factusClientId) payload.client_id = factusClientId;
      if (factusClientSecret) payload.client_secret = factusClientSecret;
      if (factusEmail) payload.email = factusEmail;
      if (factusPassword) payload.password = factusPassword;

      const res = await fetch('/api/system/factus-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.status === 200) {
        setFactusMsg({ type: 'success', text: 'Configuración de Factus y Token OAuth actualizados correctamente.' });
        await fetchStatus();
      } else {
        setFactusMsg({ type: 'error', text: 'Error actualizando configuración de Factus.' });
      }
    } catch (err: any) {
      setFactusMsg({ type: 'error', text: err.message });
    } finally {
      setFactusSaving(false);
    }
  };

  const handleDownloadPdf = async (number: string) => {
    try {
      const res = await fetch(`/api/factura-download/${number}`);
      const data = await res.json();
      if (data.status === 200 && data.data?.pdf_base_64_encoded) {
        const link = document.createElement('a');
        link.href = `data:application/pdf;base64,${data.data.pdf_base_64_encoded}`;
        link.download = data.data.file_name || `${number}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        alert('No se pudo descargar el PDF de la factura: ' + (data.message || 'Error'));
      }
    } catch (err: any) {
      alert('Error en descarga: ' + err.message);
    }
  };

  const handleDeleteFactura = async (refCode: string) => {
    if (!confirm(`¿Eliminar la factura con referencia ${refCode}?`)) return;
    try {
      const res = await fetch(`/api/factura/${refCode}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.status === 200) {
        loadInvoices();
      } else {
        alert(data.message || 'No se pudo eliminar la factura');
      }
    } catch (err: any) {
      alert('Error al eliminar: ' + err.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Header */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-50 px-4 py-3">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-white tracking-tight">Reto Factus</h1>
                <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800 font-mono">
                  DIAN v2
                </span>
              </div>
              <p className="text-xs text-slate-400">Node.js • PostgreSQL • Factus API OAuth 2.0</p>
            </div>
          </div>

          {/* Quick System Indicators */}
          <div className="flex items-center gap-2">
            {/* Database indicator */}
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${
                status?.database?.isExternal
                  ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
                  : 'bg-indigo-950/60 border-indigo-800 text-indigo-300'
              }`}
              title={status?.database?.connectionInfo}
            >
              <Database className="w-3.5 h-3.5" />
              <span>{status?.database?.isExternal ? 'PostgreSQL Nube' : 'Postgres Local'}</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            </div>

            {/* Factus API Indicator */}
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${
                status?.factus?.token?.status === 'active'
                  ? 'bg-blue-950/60 border-blue-800 text-blue-300'
                  : 'bg-amber-950/60 border-amber-800 text-amber-300'
              }`}
            >
              <Key className="w-3.5 h-3.5" />
              <span>{status?.factus?.token?.is_simulated ? 'Simulador DIAN' : 'Sandbox Factus'}</span>
              <span className="w-2 h-2 rounded-full bg-blue-400"></span>
            </div>

            <button
              onClick={fetchStatus}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              title="Actualizar estado del sistema"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="max-w-7xl mx-auto mt-3 flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none text-sm font-medium border-t border-slate-800/80 pt-2">
          <button
            onClick={() => setActiveTab('app')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
              activeTab === 'app'
                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>Reto Factus Web</span>
          </button>

          <button
            onClick={() => setActiveTab('facturas')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
              activeTab === 'facturas'
                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Facturas DIAN</span>
            <span className="text-xs bg-slate-800 px-1.5 py-0.2 rounded-full text-slate-300">
              {status?.database?.tableCounts?.invoices || 0}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('clientes')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
              activeTab === 'clientes'
                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Clientes</span>
            <span className="text-xs bg-slate-800 px-1.5 py-0.2 rounded-full text-slate-300">
              {status?.database?.tableCounts?.customer || 0}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('productos')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
              activeTab === 'productos'
                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Productos</span>
            <span className="text-xs bg-slate-800 px-1.5 py-0.2 rounded-full text-slate-300">
              {status?.database?.tableCounts?.products || 0}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('database')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
              activeTab === 'database'
                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>PostgreSQL & SQL</span>
          </button>

          <button
            onClick={() => setActiveTab('factus_api')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition whitespace-nowrap ${
              activeTab === 'factus_api'
                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Key className="w-4 h-4" />
            <span>API Factus OAuth 2.0</span>
          </button>

          <button
            onClick={() => setActiveTab('deploy_guide')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition whitespace-nowrap ml-auto ${
              activeTab === 'deploy_guide'
                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30 font-semibold'
                : 'text-amber-400/80 hover:text-amber-300 hover:bg-amber-950/30'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>Guía Despliegue Reto</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6">
        {/* TAB 1: RETO FACTUS WEB VIEW */}
        {activeTab === 'app' && (
          <div className="flex flex-col h-full space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-slate-300">Páginas de la Aplicación del Reto:</span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {[
                    { id: 'factus-app.html', label: 'Inicio', icon: Globe },
                    { id: 'pages/factus.html', label: 'Factus (Emitir)', icon: FileText },
                    { id: 'pages/cliente.html', label: 'Clientes (CRUD)', icon: Users },
                    { id: 'pages/factusget.html', label: 'Ver Facturas', icon: Search },
                    { id: 'pages/about.html', label: 'Acerca de (Santiago R.)', icon: HelpCircle },
                  ].map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setAppSubpage(p.id)}
                      className={`text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition ${
                        appSubpage === p.id
                          ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      <p.icon className="w-3.5 h-3.5" />
                      <span>{p.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={`/${appSubpage}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 bg-cyan-950/50 border border-cyan-800/60 px-2.5 py-1.5 rounded-lg transition"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>Abrir en pestaña nueva</span>
                </a>
              </div>
            </div>

            {/* Embedded Live Web Container */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex-1 min-h-[640px] flex flex-col">
              <div className="bg-slate-950 px-4 py-2 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-red-500/80 inline-block"></span>
                    <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block"></span>
                    <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block"></span>
                  </div>
                  <span className="font-mono text-slate-300 bg-slate-900 px-3 py-0.5 rounded border border-slate-800">
                    http://localhost:3000/{appSubpage}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Backend Conectado
                  </span>
                </div>
              </div>
              <iframe
                src={`/${appSubpage}`}
                title="Factus Challenge App"
                className="w-full flex-1 min-h-[620px] bg-slate-900 border-none"
              />
            </div>
          </div>
        )}

        {/* TAB 2: FACTURAS DIAN */}
        {activeTab === 'facturas' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-cyan-400" />
                  Facturas Electrónicas de Venta
                </h2>
                <p className="text-xs text-slate-400">
                  Gestión y validación de facturas electrónicas con la API de Factus (Validación DIAN)
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowNewInvoiceModal(true)}
                  className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-sm flex items-center gap-2 shadow-lg shadow-cyan-500/20 transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>Nueva Factura Electrónica</span>
                </button>
                <button
                  onClick={loadInvoices}
                  className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition"
                  title="Refrescar facturas"
                >
                  <RefreshCw className={`w-4 h-4 ${invoicesLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* Invoices List Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="p-4 border-b border-slate-800 flex items-center justify-between gap-3">
                <div className="relative flex-1 max-w-sm">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchInvoiceNumber}
                    onChange={(e) => setSearchInvoiceNumber(e.target.value)}
                    placeholder="Buscar por número o referencia..."
                    className="w-full pl-9 pr-4 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <span className="text-xs text-slate-400">
                  Total facturas: <strong className="text-white">{invoices.length}</strong>
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-950/80 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="px-4 py-3">Número / Ref</th>
                      <th className="px-4 py-3">Estado DIAN</th>
                      <th className="px-4 py-3">Cliente</th>
                      <th className="px-4 py-3">Identificación</th>
                      <th className="px-4 py-3">Forma de Pago</th>
                      <th className="px-4 py-3">Total</th>
                      <th className="px-4 py-3">Fecha</th>
                      <th className="px-4 py-3 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {invoices.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="text-center py-12 text-slate-500">
                          {invoicesLoading ? 'Cargando facturas...' : 'No hay facturas registradas todavía.'}
                        </td>
                      </tr>
                    ) : (
                      invoices
                        .filter(
                          (inv) =>
                            !searchInvoiceNumber ||
                            (inv.number && inv.number.toLowerCase().includes(searchInvoiceNumber.toLowerCase())) ||
                            (inv.reference_code && inv.reference_code.toLowerCase().includes(searchInvoiceNumber.toLowerCase()))
                        )
                        .map((inv: any) => {
                          const num = inv.number || `SETP${inv.id}`;
                          const ref = inv.reference_code || 'REF-N/A';
                          const cust = inv.graphic_representation_name || inv.names || inv.customer?.names || 'Cliente';
                          const id = inv.identification || inv.customer?.identification || '-';
                          const total = parseFloat(inv.total || '0').toLocaleString('es-CO', { style: 'currency', currency: 'COP' });
                          return (
                            <tr key={ref} className="hover:bg-slate-800/40 transition">
                              <td className="px-4 py-3">
                                <div className="font-semibold text-cyan-400 font-mono">{num}</div>
                                <div className="text-xs text-slate-500 font-mono">{ref}</div>
                              </td>
                              <td className="px-4 py-3">
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-950 text-emerald-400 border border-emerald-800">
                                  <CheckCircle2 className="w-3 h-3" />
                                  Validada DIAN
                                </span>
                              </td>
                              <td className="px-4 py-3 text-slate-200 font-medium">{cust}</td>
                              <td className="px-4 py-3 font-mono text-xs text-slate-400">{id}</td>
                              <td className="px-4 py-3 text-slate-300 text-xs">
                                {inv.payment_form?.name || 'Pago de contado'}
                              </td>
                              <td className="px-4 py-3 font-bold text-slate-100">{total}</td>
                              <td className="px-4 py-3 text-xs text-slate-400">{inv.created_at || '-'}</td>
                              <td className="px-4 py-3 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => setSelectedInvoice(inv)}
                                    className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-slate-800 rounded transition"
                                    title="Ver detalle de factura"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDownloadPdf(num)}
                                    className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded transition"
                                    title="Descargar PDF"
                                  >
                                    <Download className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteFactura(ref)}
                                    className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded transition"
                                    title="Eliminar factura"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: CLIENTES */}
        {activeTab === 'clientes' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-cyan-400" />
                  Directorio de Clientes
                </h2>
                <p className="text-xs text-slate-400">
                  Almacenados en la tabla <code>customer</code> de PostgreSQL con información tributaria y DIAN
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowNewCustomerModal(true)}
                  className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-sm flex items-center gap-2 shadow-lg shadow-cyan-500/20 transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>Nuevo Cliente</span>
                </button>
                <button
                  onClick={loadCustomers}
                  className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition"
                  title="Refrescar clientes"
                >
                  <RefreshCw className={`w-4 h-4 ${customersLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-950/80 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="px-4 py-3">Identificación (ID)</th>
                      <th className="px-4 py-3">Nombre Completo</th>
                      <th className="px-4 py-3">Empresa / Comercio</th>
                      <th className="px-4 py-3">Correo</th>
                      <th className="px-4 py-3">Teléfono</th>
                      <th className="px-4 py-3">Municipio</th>
                      <th className="px-4 py-3">Organización</th>
                      <th className="px-4 py-3 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {customers.map((c: any) => {
                      const munName = municipalities.find((m) => m.id === c.municipality_id)?.name || 'Fresno';
                      const orgName = c.id_org === 1 ? 'Jurídica' : 'Natural';
                      return (
                        <tr key={c.id} className="hover:bg-slate-800/40 transition">
                          <td className="px-4 py-3 font-mono text-cyan-400 font-semibold">
                            {c.id} {c.verification_digit ? `-${c.verification_digit}` : ''}
                          </td>
                          <td className="px-4 py-3 text-slate-200 font-medium">{c.names}</td>
                          <td className="px-4 py-3 text-slate-400 text-xs">
                            {c.company || c.trade_name || '----'}
                          </td>
                          <td className="px-4 py-3 text-slate-300 text-xs">{c.email}</td>
                          <td className="px-4 py-3 text-slate-400 text-xs font-mono">{c.phone}</td>
                          <td className="px-4 py-3 text-slate-300 text-xs">{munName}</td>
                          <td className="px-4 py-3 text-xs">
                            <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                              {orgName}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={async () => {
                                if (confirm(`¿Eliminar cliente ${c.names}?`)) {
                                  await fetch(`/api/delete/customer/id/${c.id}`, { method: 'DELETE' });
                                  loadCustomers();
                                }
                              }}
                              className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded transition"
                              title="Eliminar cliente"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: PRODUCTOS */}
        {activeTab === 'productos' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Package className="w-5 h-5 text-cyan-400" />
                  Catálogo de Productos para Facturación
                </h2>
                <p className="text-xs text-slate-400">
                  Tabla <code>products</code> en PostgreSQL con códigos de referencia, IVA y retenciones
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={loadProducts}
                  className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition"
                  title="Refrescar productos"
                >
                  <RefreshCw className={`w-4 h-4 ${productsLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((p: any) => (
                <div key={p.code_reference} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-xs font-mono font-bold bg-cyan-950 text-cyan-400 border border-cyan-800 px-2 py-0.5 rounded">
                        {p.code_reference}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">Stock: {p.quantity}</span>
                    </div>
                    <h3 className="font-semibold text-slate-100 text-base mb-1">{p.name}</h3>
                    <div className="text-2xl font-bold text-emerald-400 mb-3">
                      {parseFloat(p.price).toLocaleString('es-CO', { style: 'currency', currency: 'COP' })}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                    <span>IVA: {p.tax_rate}%</span>
                    <span>Desc: {p.discount_rate}%</span>
                    <span>Unidad DIAN: {p.unit_measure_id}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: POSTGRESQL & SQL RUNNER */}
        {activeTab === 'database' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Database className="w-5 h-5 text-emerald-400" />
                Gestor y Conector de PostgreSQL (Supabase / Neon / Render)
              </h2>
              <p className="text-xs text-slate-400">
                Conecta tu instancia de PostgreSQL en la nube, verifica tablas, ejecuta consultas SQL y copia el esquema listo para producción.
              </p>
            </div>

            {/* Connection Banner */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
                <h3 className="text-sm font-bold text-slate-200 mb-3 flex items-center gap-2">
                  <Server className="w-4 h-4 text-cyan-400" />
                  Conexión a PostgreSQL en la Nube
                </h3>
                <form onSubmit={handleTestPostgres} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      URL de Conexión PostgreSQL (DATABASE_URL):
                    </label>
                    <input
                      type="text"
                      value={dbConnStr}
                      onChange={(e) => setDbConnStr(e.target.value)}
                      placeholder="postgresql://postgres:[PASSWORD]@db.xxxx.supabase.co:5432/postgres?sslmode=require"
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      Compatible con Supabase, Neon, Render, Railway, ElephantSQL y Google Cloud SQL.
                    </p>
                  </div>

                  {dbMsg && (
                    <div
                      className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                        dbMsg.type === 'success'
                          ? 'bg-emerald-950/80 border border-emerald-800 text-emerald-300'
                          : 'bg-red-950/80 border border-red-800 text-red-300'
                      }`}
                    >
                      {dbMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                      <span>{dbMsg.text}</span>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="submit"
                      disabled={dbConnecting || !dbConnStr.trim()}
                      className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold px-4 py-2 rounded-xl text-sm flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition"
                    >
                      <Play className="w-4 h-4" />
                      <span>{dbConnecting ? 'Conectando...' : 'Conectar y Migrar a este Postgres'}</span>
                    </button>

                    <a
                      href="/api/system/schema.sql"
                      download="schema.sql"
                      className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded-xl text-sm flex items-center gap-2 transition"
                    >
                      <Download className="w-4 h-4" />
                      <span>Descargar schema.sql</span>
                    </a>
                  </div>
                </form>
              </div>

              {/* Status & Tables Card */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-200 mb-3 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-emerald-400" />
                    Estado de las Tablas
                  </h3>
                  <div className="space-y-2 text-xs">
                    {Object.entries(status?.database?.tableCounts || {}).map(([tbl, cnt]) => (
                      <div key={tbl} className="flex items-center justify-between py-1 border-b border-slate-800/60">
                        <span className="font-mono text-slate-400">{tbl}</span>
                        <span className="font-bold text-white bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                          {cnt} registros
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-800">
                  <button
                    onClick={async () => {
                      if (confirm('¿Restablecer datos semilla en la base de datos?')) {
                        await fetch('/api/system/reset-db', { method: 'POST' });
                        fetchStatus();
                        loadCustomers();
                        loadProducts();
                        loadInvoices();
                      }
                    }}
                    className="w-full text-xs text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 py-2 rounded-lg transition"
                  >
                    Restablecer datos semilla del Reto Factus
                  </button>
                </div>
              </div>
            </div>

            {/* SQL Console */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-cyan-400" />
                  Consola Interactiva SQL
                </h3>
                <div className="flex items-center gap-2">
                  {['customer', 'products', 'invoices', 'payment_method'].map((tbl) => (
                    <button
                      key={tbl}
                      onClick={() => setSqlQuery(`SELECT * FROM ${tbl} LIMIT 10;`)}
                      className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1 rounded transition font-mono"
                    >
                      {tbl}
                    </button>
                  ))}
                </div>
              </div>

              <div className="relative">
                <textarea
                  value={sqlQuery}
                  onChange={(e) => setSqlQuery(e.target.value)}
                  rows={3}
                  className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl font-mono text-sm text-cyan-300 focus:outline-none focus:border-cyan-500"
                />
                <button
                  onClick={handleRunSql}
                  disabled={sqlRunning}
                  className="absolute right-3 bottom-4 bg-cyan-500 hover:bg-cyan-400 text-slate-950 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition shadow"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>{sqlRunning ? 'Ejecutando...' : 'Ejecutar'}</span>
                </button>
              </div>

              {sqlError && (
                <div className="p-3 bg-red-950/80 border border-red-800 text-red-300 rounded-xl text-xs font-mono">
                  {sqlError}
                </div>
              )}

              {sqlResult && (
                <div className="space-y-2">
                  <div className="text-xs text-slate-400">
                    Resultados: <strong className="text-white">{sqlResult.rowCount}</strong> filas
                  </div>
                  <div className="max-h-64 overflow-auto border border-slate-800 rounded-xl bg-slate-950">
                    <table className="w-full text-left text-xs font-mono">
                      <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 sticky top-0">
                        <tr>
                          {sqlResult.rows[0] &&
                            Object.keys(sqlResult.rows[0]).map((col) => (
                              <th key={col} className="px-3 py-2">
                                {col}
                              </th>
                            ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/40">
                        {sqlResult.rows.map((row, i) => (
                          <tr key={i} className="hover:bg-slate-800/30">
                            {Object.values(row).map((val: any, j) => (
                              <td key={j} className="px-3 py-1.5 text-slate-300 truncate max-w-xs">
                                {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 6: FACTUS API & OAUTH 2.0 */}
        {activeTab === 'factus_api' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Key className="w-5 h-5 text-cyan-400" />
                Autenticación OAuth 2.0 y Configuración de API Factus
              </h2>
              <p className="text-xs text-slate-400">
                Genera y renueva automáticamente el token de acceso cada 55 minutos para conectarse con la DIAN
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* Credentials form */}
              <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
                <h3 className="text-sm font-bold text-slate-200 mb-3 flex items-center gap-2">
                  <Settings2 className="w-4 h-4 text-cyan-400" />
                  Credenciales de Factus (Sandbox / Producción)
                </h3>
                <form onSubmit={handleSaveFactusConfig} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">URL API Factus:</label>
                      <input
                        type="text"
                        value={factusUrlApi}
                        onChange={(e) => setFactusUrlApi(e.target.value)}
                        placeholder="https://api-sandbox.factus.com.co"
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">Email / Username:</label>
                      <input
                        type="text"
                        value={factusEmail}
                        onChange={(e) => setFactusEmail(e.target.value)}
                        placeholder="usuario@dominio.com"
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">Client ID:</label>
                      <input
                        type="text"
                        value={factusClientId}
                        onChange={(e) => setFactusClientId(e.target.value)}
                        placeholder="Factus Client ID"
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">Client Secret:</label>
                      <input
                        type="password"
                        value={factusClientSecret}
                        onChange={(e) => setFactusClientSecret(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">Password:</label>
                      <input
                        type="password"
                        value={factusPassword}
                        onChange={(e) => setFactusPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                  </div>

                  {/* Mode switch */}
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-semibold text-slate-200">Modo Simulador Factus DIAN</div>
                      <div className="text-[11px] text-slate-400">
                        Permite probar el reto inmediatamente con validación DIAN y cálculo sin necesidad de credenciales
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={factusSimulation}
                        onChange={(e) => setFactusSimulation(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
                    </label>
                  </div>

                  {factusMsg && (
                    <div
                      className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                        factusMsg.type === 'success'
                          ? 'bg-emerald-950/80 border border-emerald-800 text-emerald-300'
                          : 'bg-red-950/80 border border-red-800 text-red-300'
                      }`}
                    >
                      {factusMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                      <span>{factusMsg.text}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={factusSaving}
                    className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-sm flex items-center gap-2 shadow-lg shadow-cyan-500/20 transition"
                  >
                    <RefreshCw className={`w-4 h-4 ${factusSaving ? 'animate-spin' : ''}`} />
                    <span>Guardar y Renovar Token OAuth</span>
                  </button>
                </form>
              </div>

              {/* Token Monitor Card */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
                <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Monitor de Token OAuth 2.0
                </h3>

                <div className="space-y-3">
                  <div>
                    <span className="text-[11px] uppercase tracking-wider text-slate-500 font-bold">Estado</span>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      <span className="text-sm font-bold text-white capitalize">{status?.factus?.token?.status}</span>
                      <span className="text-xs bg-slate-800 px-2 py-0.5 rounded text-slate-300">
                        {status?.factus?.token?.is_simulated ? 'Simulado' : 'Real'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <span className="text-[11px] uppercase tracking-wider text-slate-500 font-bold">Access Token</span>
                    <div className="mt-1 p-2 bg-slate-950 rounded-lg border border-slate-800 font-mono text-xs text-cyan-300 break-all select-all">
                      {status?.factus?.token?.access_token || 'No generado'}
                    </div>
                  </div>

                  <div>
                    <span className="text-[11px] uppercase tracking-wider text-slate-500 font-bold">Última Renovación</span>
                    <div className="mt-1 text-xs text-slate-300 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{status?.factus?.token?.last_updated ? new Date(status.factus.token.last_updated).toLocaleString('es-CO') : 'Nunca'}</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-[11px] uppercase tracking-wider text-slate-500 font-bold">Ciclo de Renovación</span>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Renovación automática cada <strong>55 minutos</strong> vía <code>setInterval</code> (3,300,000 ms)
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 7: GUÍA DE DESPLIEGUE DEL RETO */}
        {activeTab === 'deploy_guide' && (
          <div className="space-y-6 max-w-5xl">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-amber-400" />
                Guía Completa de Despliegue para el Reto Factus
              </h2>
              <p className="text-xs text-slate-400">
                Paso a paso para configurar y subir PostgreSQL, el backend en Render/Railway y el frontend en Vercel/Netlify.
              </p>
            </div>

            {/* Step 1 */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-cyan-500 text-slate-950 font-bold flex items-center justify-center text-sm">
                  1
                </div>
                <h3 className="text-base font-bold text-white">Base de Datos PostgreSQL (Supabase, Neon o Render)</h3>
              </div>

              <p className="text-sm text-slate-300">
                El reto utiliza PostgreSQL para almacenar clientes, productos, medios de pago y municipios.
              </p>

              <ol className="list-decimal list-inside space-y-2 text-sm text-slate-300 pl-2">
                <li>
                  Ingresa a <a href="https://supabase.com" target="_blank" rel="noreferrer" className="text-cyan-400 underline">Supabase</a> o <a href="https://neon.tech" target="_blank" rel="noreferrer" className="text-cyan-400 underline">Neon</a> y crea un nuevo proyecto de PostgreSQL gratuito.
                </li>
                <li>
                  Copia la URL de conexión (formato URI: <code>postgresql://postgres:tu_password@host:5432/postgres</code>).
                </li>
                <li>
                  Dirígete a la pestaña <strong>SQL Editor</strong> de Supabase o Neon, pega el script <code>schema.sql</code> y ejecútalo:
                </li>
              </ol>

              <div className="flex items-center gap-2 pt-2">
                <a
                  href="/api/system/schema.sql"
                  download="schema.sql"
                  className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 transition"
                >
                  <Download className="w-4 h-4" />
                  <span>Descargar schema.sql completo con semillas</span>
                </a>
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-500 text-slate-950 font-bold flex items-center justify-center text-sm">
                  2
                </div>
                <h3 className="text-base font-bold text-white">Backend Node.js (Render, Railway o Heroku)</h3>
              </div>

              <p className="text-sm text-slate-300">
                Sube la carpeta <code>bc-v1</code> a tu repositorio o servicio de hosting. En la plataforma configura las variables de entorno:
              </p>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs space-y-1 text-slate-300">
                <div>PORT=4500 (o la asignada por la plataforma)</div>
                <div>DATABASE_URL=postgresql://usuario:password@host:5432/db?sslmode=require</div>
                <div>url_api=https://api-sandbox.factus.com.co</div>
                <div>client_id=tu_client_id_factus</div>
                <div>client_secret=tu_client_secret_factus</div>
                <div>email=tu_email_factus</div>
                <div>password=tu_password_factus</div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-500 text-slate-950 font-bold flex items-center justify-center text-sm">
                  3
                </div>
                <h3 className="text-base font-bold text-white">Frontend (Ajuste crucial de config.json)</h3>
              </div>

              <p className="text-sm text-slate-300">
                Dentro de <code>fr-v1/resources/assets/config.json</code> debes reemplazar <code>http://localhost:4500</code> por la URL pública que te entregó tu backend en el paso 2.
              </p>

              {/* Interactive Config Generator */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                <label className="block text-xs font-semibold text-slate-300">
                  Ingresa la URL pública de tu Backend para generar el config.json:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={guideBackendUrl}
                    onChange={(e) => setGuideBackendUrl(e.target.value)}
                    placeholder="https://mi-backend.onrender.com"
                    className="flex-1 px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-cyan-300 font-mono focus:outline-none focus:border-cyan-500"
                  />
                  <button
                    onClick={() => {
                      const jsonContent = JSON.stringify({ url: guideBackendUrl.trim() }, null, 2);
                      copyToClipboard(jsonContent, 'config_json');
                    }}
                    className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-4 py-2 rounded-lg text-xs flex items-center gap-1.5 transition"
                  >
                    {copied === 'config_json' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>Copiar config.json</span>
                  </button>
                </div>

                <div className="p-3 bg-slate-900 rounded-lg text-xs font-mono text-slate-300 border border-slate-800">
                  <pre>{JSON.stringify({ url: guideBackendUrl.trim() }, null, 2)}</pre>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* MODAL: NUEVA FACTURA ELECTRÓNICA */}
      {showNewInvoiceModal && (
        <NewInvoiceModal
          onClose={() => setShowNewInvoiceModal(false)}
          onSuccess={() => {
            setShowNewInvoiceModal(false);
            loadInvoices();
          }}
          customers={customers}
          products={products}
          paymentMethods={paymentMethods}
        />
      )}

      {/* MODAL: DETALLE DE FACTURA */}
      {selectedInvoice && (
        <InvoiceDetailModal invoice={selectedInvoice} onClose={() => setSelectedInvoice(null)} onDownload={handleDownloadPdf} />
      )}

      {/* MODAL: NUEVO CLIENTE */}
      {showNewCustomerModal && (
        <NewCustomerModal
          onClose={() => setShowNewCustomerModal(false)}
          onSuccess={() => {
            setShowNewCustomerModal(false);
            loadCustomers();
          }}
          municipalities={municipalities}
          idTypes={idTypes}
          tributes={tributes}
          organizations={organizations}
        />
      )}
    </div>
  );
}

// -------------------------------------------------------------------------------------------------
// SUB-COMPONENT: MODAL NUEVA FACTURA
// -------------------------------------------------------------------------------------------------
function NewInvoiceModal({
  onClose,
  onSuccess,
  customers,
  products,
  paymentMethods,
}: {
  onClose: () => void;
  onSuccess: () => void;
  customers: any[];
  products: any[];
  paymentMethods: any[];
}) {
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(customers[0]?.id || '');
  const [selectedPaymentCode, setSelectedPaymentCode] = useState<number>(10);
  const [observation, setObservation] = useState<string>('Venta en Reto Factus');
  const [selectedProductCode, setSelectedProductCode] = useState<string>(products[0]?.code_reference || '');
  const [productQty, setProductQty] = useState<number>(1);
  const [invoiceItems, setInvoiceItems] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Add initial item if empty
  useEffect(() => {
    if (products.length > 0 && invoiceItems.length === 0) {
      const p = products[0];
      setInvoiceItems([
        {
          code_reference: p.code_reference,
          name: p.name,
          quantity: 1,
          price: parseFloat(p.price),
          tax_rate: p.tax_rate || '19.00',
          discount_rate: parseFloat(p.discount_rate || 0),
          unit_measure_id: p.unit_measure_id || 70,
          standard_code_id: p.standard_code_id || 1,
          is_excluded: p.is_excluded || 0,
          tribute_id: p.tribute_id || 1,
          withholding_taxes: p.withholding_taxes || '[]',
        },
      ]);
    }
  }, [products]);

  const handleAddItem = () => {
    const p = products.find((prod) => prod.code_reference === selectedProductCode);
    if (!p) return;
    setInvoiceItems((prev) => [
      ...prev,
      {
        code_reference: p.code_reference,
        name: p.name,
        quantity: productQty,
        price: parseFloat(p.price),
        tax_rate: p.tax_rate || '19.00',
        discount_rate: parseFloat(p.discount_rate || 0),
        unit_measure_id: p.unit_measure_id || 70,
        standard_code_id: p.standard_code_id || 1,
        is_excluded: p.is_excluded || 0,
        tribute_id: p.tribute_id || 1,
        withholding_taxes: p.withholding_taxes || '[]',
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setInvoiceItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Calculations
  const subtotal = invoiceItems.reduce((acc, it) => acc + it.price * it.quantity, 0);
  const tax = invoiceItems.reduce((acc, it) => acc + (it.is_excluded ? 0 : it.price * it.quantity * (parseFloat(it.tax_rate) / 100)), 0);
  const total = subtotal + tax;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (invoiceItems.length === 0) {
      setErrorMsg('Debe agregar al menos un producto a la factura');
      return;
    }
    const cust = customers.find((c) => c.id === selectedCustomerId);
    if (!cust) {
      setErrorMsg('Cliente no encontrado');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    const payload = {
      observation: observation.trim() || 'Venta de productos',
      payment_method_code: selectedPaymentCode,
      customer: {
        identification: cust.id,
        dv: cust.verification_digit || null,
        graphic_representation_name: cust.names,
        trade_name: cust.trade_name || '',
        company: cust.company || '',
        names: cust.names,
        address: cust.address,
        email: cust.email,
        phone: cust.phone,
        legal_organization_id: cust.id_org || 2,
        tribute_id: cust.tribute_id || 21,
        municipality_id: cust.municipality_id || 1041,
      },
      items: invoiceItems,
    };

    try {
      const res = await fetch('/api/factura', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok && (data.status === 200 || data.status === 'OK' || data.status === 'Created')) {
        onSuccess();
      } else {
        setErrorMsg(data.message || data.error || 'Error al emitir factura electrónica');
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl p-6 my-8">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-cyan-400" />
            <h3 className="font-bold text-white text-base">Emitir Factura Electrónica (Validación DIAN)</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-lg">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Cliente Adquiriente:</label>
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.names} ({c.id})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Método de Pago:</label>
              <select
                value={selectedPaymentCode}
                onChange={(e) => setSelectedPaymentCode(parseInt(e.target.value))}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                {paymentMethods.map((pm) => (
                  <option key={pm.id} value={pm.id}>
                    {pm.name} (Código {pm.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Observación (máx 249 caracteres):</label>
            <input
              type="text"
              value={observation}
              onChange={(e) => setObservation(e.target.value)}
              maxLength={249}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Items Selector */}
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
            <span className="text-xs font-bold text-slate-300 block">Agregar Productos a la Factura:</span>
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={selectedProductCode}
                onChange={(e) => setSelectedProductCode(e.target.value)}
                className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-sm text-slate-200"
              >
                {products.map((p) => (
                  <option key={p.code_reference} value={p.code_reference}>
                    {p.name} - ${parseFloat(p.price).toLocaleString('es-CO')}
                  </option>
                ))}
              </select>
              <div className="flex items-center gap-1">
                <label className="text-xs text-slate-400">Cant:</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={productQty}
                  onChange={(e) => setProductQty(parseInt(e.target.value) || 1)}
                  className="w-16 px-2 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-sm text-center text-slate-200"
                />
              </div>
              <button
                type="button"
                onClick={handleAddItem}
                className="bg-slate-800 hover:bg-slate-700 text-cyan-400 px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Agregar</span>
              </button>
            </div>

            {/* Added Items List */}
            <div className="space-y-1.5 max-h-40 overflow-y-auto pt-2">
              {invoiceItems.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 bg-slate-900 rounded-lg text-xs">
                  <div>
                    <span className="font-semibold text-slate-200">{item.name}</span>
                    <span className="text-slate-500 ml-2">
                      ({item.quantity} x ${item.price.toLocaleString('es-CO')})
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-emerald-400">
                      ${(item.price * item.quantity).toLocaleString('es-CO')}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Totals Summary */}
            <div className="pt-3 border-t border-slate-800/80 flex justify-between text-xs text-slate-300">
              <div>
                <span>Subtotal: ${subtotal.toLocaleString('es-CO')}</span> |{' '}
                <span>IVA (19%): ${tax.toLocaleString('es-CO')}</span>
              </div>
              <div className="text-sm font-bold text-cyan-400">
                Total Factura: ${total.toLocaleString('es-CO')}
              </div>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 bg-red-950/80 border border-red-800 text-red-300 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold rounded-xl transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting || invoiceItems.length === 0}
              className="px-5 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-sm font-bold rounded-xl shadow-lg shadow-cyan-500/20 transition flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{submitting ? 'Emitiendo y Validando con DIAN...' : 'Emitir Factura Electrónica'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// -------------------------------------------------------------------------------------------------
// SUB-COMPONENT: MODAL DETALLE DE FACTURA
// -------------------------------------------------------------------------------------------------
function InvoiceDetailModal({
  invoice,
  onClose,
  onDownload,
}: {
  invoice: any;
  onClose: () => void;
  onDownload: (num: string) => void;
}) {
  const bill = invoice.bill || invoice;
  const cust = invoice.customer || {};
  const comp = invoice.company || {};
  const num = bill.number || `SETP${bill.id}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl shadow-2xl p-6 my-8 space-y-5">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="font-mono text-cyan-400 font-bold text-lg">{num}</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800">
              Validada Exitosamente DIAN
            </span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-lg">
            ✕
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
            <span className="text-slate-500 font-bold uppercase tracking-wider block mb-1">Emisor (Factus)</span>
            <div className="font-bold text-white text-sm">{comp.company || 'FACTUS S.A.S.'}</div>
            <div className="text-slate-400">NIT: {comp.nit || '901724254-1'}</div>
            <div className="text-slate-400">Dirección: {comp.direction || 'Carrera 10 # 9 - 04'}</div>
            <div className="text-slate-400">Email: {comp.email || 'factusfacturacion@gmail.com'}</div>
          </div>

          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
            <span className="text-slate-500 font-bold uppercase tracking-wider block mb-1">Adquiriente (Cliente)</span>
            <div className="font-bold text-white text-sm">{cust.names || bill.graphic_representation_name || 'Cliente'}</div>
            <div className="text-slate-400">Identificación: {cust.identification || bill.identification}</div>
            <div className="text-slate-400">Email: {cust.email || '-'}</div>
            <div className="text-slate-400">Teléfono: {cust.phone || '-'}</div>
          </div>
        </div>

        {/* Financial info */}
        <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="text-xs text-slate-400 block">Total Factura</span>
            <span className="text-2xl font-bold text-emerald-400 font-mono">
              ${parseFloat(bill.total || '0').toLocaleString('es-CO')} COP
            </span>
          </div>
          <div className="text-xs text-slate-400 space-y-0.5">
            <div>Fecha: {bill.created_at || '-'}</div>
            <div>Forma de Pago: {bill.payment_form?.name || 'Pago de contado'}</div>
            <div>Ref Code: <span className="font-mono text-cyan-400">{bill.reference_code}</span></div>
          </div>
        </div>

        {/* CUFE */}
        {bill.cufe && (
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Código Único de Factura Electrónica (CUFE)</span>
            <div className="font-mono text-[11px] text-slate-300 break-all select-all">{bill.cufe}</div>
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            onClick={() => onDownload(num)}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl flex items-center gap-2 transition shadow"
          >
            <Download className="w-4 h-4" />
            <span>Descargar Representación Gráfica PDF</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------------------------------------------
// SUB-COMPONENT: MODAL NUEVO CLIENTE
// -------------------------------------------------------------------------------------------------
function NewCustomerModal({
  onClose,
  onSuccess,
  municipalities,
  idTypes,
  tributes,
  organizations,
}: {
  onClose: () => void;
  onSuccess: () => void;
  municipalities: any[];
  idTypes: any[];
  tributes: any[];
  organizations: any[];
}) {
  const [names, setNames] = useState('');
  const [id, setId] = useState('');
  const [dv, setDv] = useState('');
  const [typeId, setTypeId] = useState(3);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [company, setCompany] = useState('');
  const [tradeName, setTradeName] = useState('');
  const [munId, setMunId] = useState(1041);
  const [tributeId, setTributeId] = useState(21);
  const [idOrg, setIdOrg] = useState(2);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!names.trim() || !id.trim() || !email.trim()) {
      setError('Complete los campos obligatorios');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/add-data/customer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: id.trim(),
          names: names.trim(),
          email: email.trim(),
          type_id: typeId,
          company: company.trim() || null,
          address: address.trim() || 'Dirección no especificada',
          phone: phone.trim() || '3000000000',
          trade_name: tradeName.trim() || null,
          municipality_id: munId,
          verification_digit: dv.trim() || null,
          id_org: idOrg,
          tribute_id: tributeId,
        }),
      });
      const data = await res.json();
      if (res.ok && data.status === 200) {
        onSuccess();
      } else {
        setError(data.message || 'Error guardando cliente');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl p-6 my-8">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-cyan-400" />
            <h3 className="font-bold text-white text-base">Registrar Nuevo Cliente</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-lg">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Tipo de Identificación:</label>
              <select
                value={typeId}
                onChange={(e) => setTypeId(parseInt(e.target.value))}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200"
              >
                {idTypes.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Número ID (Cédula/NIT):</label>
              <input
                type="text"
                value={id}
                onChange={(e) => setId(e.target.value)}
                placeholder="1109780065"
                required
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">DV (si aplica):</label>
              <input
                type="text"
                value={dv}
                onChange={(e) => setDv(e.target.value)}
                placeholder="1"
                maxLength={2}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Nombre Completo:</label>
            <input
              type="text"
              value={names}
              onChange={(e) => setNames(e.target.value)}
              placeholder="Santiago Rivera Marin"
              required
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Correo Electrónico:</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="usuario@dominio.com"
                required
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Teléfono:</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="3103362199"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Dirección:</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Cll. 22 #45C-45"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Municipio:</label>
              <select
                value={munId}
                onChange={(e) => setMunId(parseInt(e.target.value))}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200"
              >
                {municipalities.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Organización:</label>
              <select
                value={idOrg}
                onChange={(e) => setIdOrg(parseInt(e.target.value))}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200"
              >
                {organizations.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Tributo:</label>
              <select
                value={tributeId}
                onChange={(e) => setTributeId(parseInt(e.target.value))}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200"
              >
                {tributes.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {error && <div className="p-3 bg-red-950/80 border border-red-800 text-red-300 rounded-xl">{error}</div>}

          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl shadow-lg shadow-cyan-500/20 transition flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{saving ? 'Guardando...' : 'Guardar Cliente'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
