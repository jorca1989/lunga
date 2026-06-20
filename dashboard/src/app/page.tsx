"use client";

import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import {
  Shield,
  Layers,
  MapPin,
  TrendingUp,
  Clock,
  CheckCircle,
  Users,
  Settings,
  AlertTriangle,
  Wrench,
  ChevronRight,
  Filter,
  Eye,
  Check,
  X,
  RefreshCw,
  Search,
  Building,
  Briefcase,
  Trash2
} from "lucide-react";
import dynamic from "next/dynamic";

const LeafletMap = dynamic(
  () => import("../components/LeafletMap"),
  { ssr: false, loading: () => <div className="text-slate-500 text-xs">A carregar mapa...</div> }
);

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<"overview" | "reports" | "jobs" | "users" | "tenants">("overview");
  const [activeTenant, setActiveTenant] = useState<string>("cazenga");
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [roleSearch, setRoleSearch] = useState<string>("");
  const [reportFilter, setReportFilter] = useState<string>("Tudo");
  const [roleFilter, setRoleFilter] = useState<string>("Tudo");

  // Fetch real-time data from Convex
  const stats = useQuery(api.admin.getSystemStats, { tenantId: activeTenant });
  const allUsers = useQuery(api.admin.listAllUsers);
  const reports = useQuery(api.reports.list, { tenantId: activeTenant });
  const jobs = useQuery(api.jobs.list);

  // Mutations
  const validateJob = useMutation(api.jobs.validate);
  const updateUserRole = useMutation(api.admin.updateUserRole);
  const updateReportStatus = useMutation(api.reports.updateStatus);
  const deleteReport = useMutation(api.reports.remove);

  // Selected report details
  const selectedReport = reports?.find((r) => r._id === selectedReportId);

  // Local actions handler
  const handleValidateJob = async (jobId: any, supervisorId: any, approved: boolean, notes: string) => {
    try {
      await validateJob({
        jobId,
        supervisorId,
        approved,
        notes
      });
      alert(approved ? "Trabalho aprovado e concluído!" : "Trabalho rejeitado e enviado de volta ao operador.");
    } catch (error: any) {
      alert("Erro ao processar validação: " + error.message);
    }
  };

  const handleUpdateRole = async (userId: any, newRole: string) => {
    try {
      await updateUserRole({
        userId,
        role: newRole,
        tenantId: activeTenant
      });
      alert("Permissão do utilizador atualizada com sucesso!");
    } catch (error: any) {
      alert("Erro ao atualizar permissão: " + error.message);
    }
  };

  const handleDeleteReport = async (reportId: any) => {
    if (!window.confirm("Tem a certeza que deseja eliminar esta ocorrência definitivamente?")) {
      return;
    }
    try {
      await deleteReport({
        reportId,
        userId: "j97efm1s5hfsxndnv424h7e42d1x48w2" as any // Mock Super Admin actor ID
      });
      if (selectedReportId === reportId) {
        setSelectedReportId(null);
      }
      alert("Ocorrência eliminada com sucesso!");
    } catch (error: any) {
      alert("Erro ao eliminar ocorrência: " + error.message);
    }
  };

  // Filter lists
  const filteredReports = reports?.filter((r) => {
    if (reportFilter === "Tudo") return true;
    return r.status === reportFilter;
  });

  const filteredUsers = allUsers?.filter((u: any) => {
    const matchesSearch = (u.name || "").toLowerCase().includes(roleSearch.toLowerCase()) || 
                          (u.phoneNumber || "").includes(roleSearch);
    const matchesRole = roleFilter === "Tudo" || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 font-sans overflow-hidden">
      
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between shrink-0">
        <div>
          {/* Brand */}
          <div className="h-16 flex items-center px-6 gap-3 border-b border-slate-800/60">
            <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center overflow-hidden">
              <img
                src="https://pub-2e19cd5eed3b430fbd424824137b6bde.r2.dev/Lunga%20Logo.png"
                alt="Lunga Logo"
                className="w-8 h-8 object-contain"
              />
            </div>
            <div>
              <h1 className="font-extrabold text-sm tracking-tight text-white leading-none">LUNGA</h1>
              <span className="text-xs text-yellow-500 font-semibold tracking-wider uppercase mt-1 block">Painel Geral</span>
            </div>
          </div>

          {/* Tenant Selector */}
          <div className="p-4 border-b border-slate-800/40">
            <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block mb-2">Município Activo</label>
            <div className="relative">
              <Building className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <select
                value={activeTenant}
                onChange={(e) => setActiveTenant(e.target.value)}
                className="w-full bg-slate-800/80 border border-slate-700/60 rounded-xl py-2 pl-9 pr-4 text-sm font-semibold text-white focus:outline-none focus:border-yellow-500 appearance-none cursor-pointer"
              >
                <option value="cazenga">Cazenga (Luanda)</option>
                <option value="viana">Viana (Luanda)</option>
                <option value="belas">Belas (Luanda)</option>
                <option value="talatona">Talatona (Luanda)</option>
              </select>
            </div>
          </div>

          {/* Menu Items */}
          <nav className="p-4 space-y-1">
            <button
              onClick={() => setActiveTab("overview")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                activeTab === "overview"
                  ? "bg-yellow-600/10 text-yellow-400 border-l-4 border-yellow-500 pl-3"
                  : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
              }`}
            >
              <Layers className="w-4 h-4" />
              Visão Geral
            </button>

            <button
              onClick={() => setActiveTab("reports")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                activeTab === "reports"
                  ? "bg-yellow-600/10 text-yellow-400 border-l-4 border-yellow-500 pl-3"
                  : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
              Ocorrências
            </button>

            <button
              onClick={() => setActiveTab("jobs")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                activeTab === "jobs"
                  ? "bg-yellow-600/10 text-yellow-400 border-l-4 border-yellow-500 pl-3"
                  : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
              }`}
            >
              <Wrench className="w-4 h-4" />
              Validações e Obras
            </button>

            <button
              onClick={() => setActiveTab("users")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                activeTab === "users"
                  ? "bg-yellow-600/10 text-yellow-400 border-l-4 border-yellow-500 pl-3"
                  : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
              }`}
            >
              <Users className="w-4 h-4" />
              Gestão de Equipa
            </button>
          </nav>
        </div>

        {/* User Card */}
        <div className="p-4 border-t border-slate-800 flex items-center gap-3 bg-slate-900/60">
          <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700/60 overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150"
              alt="Avatar"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-slate-200 truncate">João Francisco</p>
            <p className="text-[10px] text-yellow-500 font-semibold uppercase tracking-wider">Super Administrador</p>
          </div>
        </div>
      </aside>

      {/* Main Workspace */}
      <main className="flex-1 flex flex-col overflow-hidden bg-slate-950">
        
        {/* Header */}
        <header className="h-16 border-b border-slate-800/60 flex items-center justify-between px-8 bg-slate-900/30">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-white capitalize">{activeTab}</h2>
            <span className="h-4 w-px bg-slate-800" />
            <p className="text-xs text-slate-400">
              Gestão activa para o Município do <span className="text-blue-400 font-semibold capitalize">{activeTenant}</span>
            </p>
          </div>

          <div className="flex items-center gap-4">
            <span className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs text-blue-400 font-semibold flex items-center gap-1.5 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              Servidor Ligado
            </span>
          </div>
        </header>

        {/* Content Tabs */}
        <div className="flex-1 overflow-y-auto p-8">
          
          {/* TAB 1: OVERVIEW */}
          {activeTab === "overview" && (
            <div className="space-y-8">
              
              {/* KPI Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-6 relative overflow-hidden group hover:border-slate-700/80 transition-all">
                  <div className="w-12 h-12 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-500 mb-4">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-semibold text-slate-400">Total Ocorrências</h3>
                  <p className="text-3xl font-extrabold text-white mt-1">{stats?.totalReports ?? 0}</p>
                  <div className="absolute right-0 bottom-0 translate-x-2 translate-y-2 opacity-5 text-blue-500 pointer-events-none group-hover:scale-110 transition-transform">
                    <AlertTriangle className="w-32 h-32" />
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-6 relative overflow-hidden group hover:border-slate-700/80 transition-all">
                  <div className="w-12 h-12 rounded-xl bg-amber-600/10 border border-amber-500/20 flex items-center justify-center text-amber-500 mb-4">
                    <Clock className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-semibold text-slate-400">Em Análise / Aberto</h3>
                  <p className="text-3xl font-extrabold text-white mt-1">
                    {((stats?.statusCounts.open ?? 0) + (stats?.statusCounts.analysis ?? 0))}
                  </p>
                  <div className="absolute right-0 bottom-0 translate-x-2 translate-y-2 opacity-5 text-amber-500 pointer-events-none group-hover:scale-110 transition-transform">
                    <Clock className="w-32 h-32" />
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-6 relative overflow-hidden group hover:border-slate-700/80 transition-all">
                  <div className="w-12 h-12 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-500 mb-4">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-semibold text-slate-400">Tempo de Resolução</h3>
                  <p className="text-3xl font-extrabold text-white mt-1">{stats?.avgResolutionTime ?? 18.5} <span className="text-sm font-medium text-slate-400">horas</span></p>
                  <div className="absolute right-0 bottom-0 translate-x-2 translate-y-2 opacity-5 text-indigo-500 pointer-events-none group-hover:scale-110 transition-transform">
                    <TrendingUp className="w-32 h-32" />
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-6 relative overflow-hidden group hover:border-slate-700/80 transition-all">
                  <div className="w-12 h-12 rounded-xl bg-emerald-600/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 mb-4">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-semibold text-slate-400">Casos Resolvidos</h3>
                  <p className="text-3xl font-extrabold text-white mt-1">{stats?.statusCounts.resolved ?? 0}</p>
                  <div className="absolute right-0 bottom-0 translate-x-2 translate-y-2 opacity-5 text-emerald-500 pointer-events-none group-hover:scale-110 transition-transform">
                    <CheckCircle className="w-32 h-32" />
                  </div>
                </div>
              </div>

              {/* Main Content split */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                
                {/* SVG Live Map */}
                <div className="xl:col-span-2 bg-slate-900 border border-slate-800/85 rounded-2xl p-6 flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-extrabold text-white text-base">Mapa Geográfico de Ocorrências</h3>
                      <p className="text-xs text-slate-400 mt-0.5">Pontos activos e calor de resíduos</p>
                    </div>
                    <span className="text-[10px] text-emerald-400 font-bold uppercase bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Ao vivo
                    </span>
                  </div>

                  {/* Gorgeous Live OpenStreetMap */}
                  <div className="w-full h-[320px] rounded-xl bg-slate-950 border border-slate-800 relative overflow-hidden">
                    <LeafletMap 
                      reports={(reports || []).map(r => ({
                        _id: r._id,
                        title: r.title,
                        description: r.description,
                        category: r.category,
                        location: r.location,
                        latitude: r.latitude,
                        longitude: r.longitude,
                        status: r.status
                      }))} 
                      onSelectReport={(id) => setSelectedReportId(id)} 
                    />

                    {/* Floating Map Legend */}
                    <div className="absolute bottom-4 left-4 bg-slate-900/90 border border-slate-800 p-3 rounded-lg text-[10px] space-y-1.5 z-[1000] pointer-events-none">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-red-500 block" />
                        <span className="font-medium text-slate-300">Aberto (Urgente)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500 block" />
                        <span className="font-medium text-slate-300">Em Progresso (Obra)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 block" />
                        <span className="font-medium text-slate-300">Casos Resolvidos</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Panel: Selected or Top Issue Details */}
                <div className="bg-slate-900 border border-slate-800/85 rounded-2xl p-6 flex flex-col justify-between">
                  <div>
                    <h3 className="font-extrabold text-white text-base mb-4">Inspecção Rápida</h3>
                    {selectedReport ? (
                      <div className="space-y-4">
                        <div className="w-full h-40 rounded-xl overflow-hidden border border-slate-800">
                          <img src={selectedReport.image} alt={selectedReport.title} className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                            selectedReport.status === "Aberto" ? "bg-red-500/10 text-red-400 border border-red-500/20" : 
                            selectedReport.status === "Em Progresso" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" : 
                            "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          }`}>
                            {selectedReport.status}
                          </span>
                          <h4 className="font-extrabold text-sm text-white mt-2 leading-snug">{selectedReport.title}</h4>
                          <p className="text-xs text-slate-400 mt-1.5 leading-relaxed truncate-3-lines">{selectedReport.description}</p>
                        </div>
                        <div className="border-t border-slate-800/60 pt-3 space-y-2 text-xs">
                          <div className="flex justify-between">
                            <span className="text-slate-500">Localização:</span>
                            <span className="font-semibold text-slate-300">{selectedReport.location}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Categoria:</span>
                            <span className="font-semibold text-blue-400">{selectedReport.category}</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <MapPin className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                        <p className="text-xs text-slate-500">Selecione um ponto no mapa para inspecionar os detalhes em tempo real.</p>
                      </div>
                    )}
                  </div>
                  {selectedReport && (
                    <button
                      onClick={() => setActiveTab("reports")}
                      className="w-full py-2.5 mt-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      Ver Ficha Completa
                    </button>
                  )}
                </div>

              </div>

            </div>
          )}

          {/* TAB 2: REPORTS LIST */}
          {activeTab === "reports" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-white text-base">Ocorrências Submetidas</h3>
                  <p className="text-xs text-slate-400">Verifique e altere o estado de triagem municipal</p>
                </div>
                
                {/* Filters */}
                <div className="flex gap-3">
                  <div className="relative">
                    <Filter className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <select
                      value={reportFilter}
                      onChange={(e) => setReportFilter(e.target.value)}
                      className="bg-slate-800 border border-slate-700/60 rounded-xl py-2 pl-9 pr-4 text-xs font-semibold text-white focus:outline-none"
                    >
                      <option value="Tudo">Todos Estados</option>
                      <option value="Aberto">Aberto</option>
                      <option value="Em Análise">Em Análise</option>
                      <option value="Em Progresso">Em Progresso</option>
                      <option value="Resolvido">Resolvido</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Table */}
              <div className="bg-slate-900 border border-slate-800/80 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-900/60 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                        <th className="py-4 px-6">Título / Cidadão</th>
                        <th className="py-4 px-6">Localização</th>
                        <th className="py-4 px-6">Categoria</th>
                        <th className="py-4 px-6">Estado</th>
                        <th className="py-4 px-6">Acções</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {filteredReports?.map((report) => (
                        <tr key={report._id} className="hover:bg-slate-800/20 transition-all">
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg overflow-hidden border border-slate-800 bg-slate-800 shrink-0">
                                <img src={report.image} alt={report.title} className="w-full h-full object-cover" />
                              </div>
                              <div className="min-w-0">
                                <p className="font-bold text-slate-200 truncate max-w-[200px]">{report.title}</p>
                                <p className="text-[10px] text-slate-500 font-semibold mt-0.5 truncate max-w-[200px]">Submetido por: {report.user.name}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6 font-medium text-slate-300">{report.location}</td>
                          <td className="py-4 px-6">
                            <span className="px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-blue-400 font-semibold text-[10px]">
                              {report.category}
                            </span>
                          </td>
                          <td className="py-4 px-6">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                              report.status === "Aberto" ? "bg-red-500/10 text-red-400 border border-red-500/20" : 
                              report.status === "Em Progresso" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" : 
                              "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            }`}>
                              {report.status}
                            </span>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-2">
                              {report.status === "Aberto" && (
                                <button
                                  onClick={() => handleUpdateReportStatus(report._id, "Em Análise")}
                                  className="px-3 py-1 bg-amber-600/20 border border-amber-500/30 text-amber-400 rounded-lg font-bold hover:bg-amber-600/30 transition-all"
                                >
                                  Colocar em Análise
                                </button>
                              )}
                              <button
                                onClick={() => setSelectedReportId(report._id)}
                                className="p-1.5 bg-slate-800 border border-slate-700/60 rounded-lg hover:bg-slate-700 text-slate-300"
                                title="Visualizar Detalhes"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteReport(report._id)}
                                className="p-1.5 bg-red-950/40 border border-red-500/20 rounded-lg hover:bg-red-900/40 text-red-400"
                                title="Eliminar Ocorrência"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: JOBS & VALIDATION */}
          {activeTab === "jobs" && (
            <div className="space-y-6">
              <div>
                <h3 className="font-extrabold text-white text-base">Validação de Obras Urbanas</h3>
                <p className="text-xs text-slate-400">Verifique as fotos de Antes/Depois submetidas pelos operadores de limpeza</p>
              </div>

              {/* Jobs Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {jobs?.map((job) => (
                  <div key={job._id} className="bg-slate-900 border border-slate-800/80 rounded-2xl p-6 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                          job.status === "Concluído" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse" : 
                          job.status === "Validado" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : 
                          "bg-slate-500/10 text-slate-400 border border-slate-500/20"
                        }`}>
                          {job.status === "Concluído" ? "Pendente Validação" : job.status}
                        </span>
                        {job.assignedAt && (
                          <span className="text-[10px] text-slate-500 font-semibold flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {new Date(job.assignedAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>

                      <h4 className="font-extrabold text-sm text-white mb-2 leading-snug">{job.report?.title}</h4>
                      <p className="text-xs text-slate-400 mb-4">{job.report?.location}</p>

                      {/* Before / After comparison */}
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-[10px] text-slate-500 font-bold uppercase mb-1.5">Antes</p>
                          <div className="w-full h-32 rounded-lg overflow-hidden border border-slate-800 bg-slate-950">
                            <img src={job.beforeImage || "https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?w=300"} alt="Antes" className="w-full h-full object-cover" />
                          </div>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-500 font-bold uppercase mb-1.5">Depois (Evidência)</p>
                          <div className="w-full h-32 rounded-lg overflow-hidden border border-slate-800 bg-slate-950">
                            {job.afterImage ? (
                              <img src={job.afterImage} alt="Depois" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-600 bg-slate-950">
                                Sem foto
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    {job.status === "Concluído" && (
                      <div className="flex gap-3 border-t border-slate-800/40 pt-4 mt-2">
                        <button
                          onClick={() => handleValidateJob(job._id, "j97efm1s5hfsxndnv424h7e42d1x48w2" as any, true, "Trabalho validado com sucesso!")}
                          className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <Check className="w-4 h-4" />
                          Aprovar Limpeza
                        </button>
                        <button
                          onClick={() => handleValidateJob(job._id, "j97efm1s5hfsxndnv424h7e42d1x48w2" as any, false, "Evidência fraca. Por favor verifique e limpe novamente.")}
                          className="px-4 py-2 rounded-xl bg-red-600/10 border border-red-500/20 hover:bg-red-600/20 text-red-400 font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
                        >
                          <X className="w-4 h-4" />
                          Rejeitar
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: USERS MANAGEMENT */}
          {activeTab === "users" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-white text-base">Utilizadores e Equipa</h3>
                  <p className="text-xs text-slate-400">Atribua permissões e defina papéis hierárquicos</p>
                </div>

                {/* Filters */}
                <div className="flex gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Pesquisar..."
                      value={roleSearch}
                      onChange={(e) => setRoleSearch(e.target.value)}
                      className="bg-slate-800 border border-slate-700/60 rounded-xl py-2 pl-9 pr-4 text-xs font-semibold text-white focus:outline-none"
                    />
                  </div>

                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="bg-slate-800 border border-slate-700/60 rounded-xl py-2 px-4 text-xs font-semibold text-white focus:outline-none"
                  >
                    <option value="Tudo">Todos Cargos</option>
                    <option value="citizen">Cidadão</option>
                    <option value="operator">Operador Campo</option>
                    <option value="supervisor">Supervisor</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>
              </div>

              {/* Users list table */}
              <div className="bg-slate-900 border border-slate-800/80 rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-900/60 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                      <th className="py-4 px-6">Utilizador</th>
                      <th className="py-4 px-6">Contacto</th>
                      <th className="py-4 px-6">Pontuação</th>
                      <th className="py-4 px-6">Nível Hierárquico</th>
                      <th className="py-4 px-6">Acções</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredUsers?.map((user: any) => (
                      <tr key={user._id} className="hover:bg-slate-800/20 transition-all">
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full overflow-hidden border border-slate-800 bg-slate-800 shrink-0">
                              <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                            </div>
                            <span className="font-bold text-slate-200">{user.name}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6 font-medium text-slate-300">{user.phoneNumber}</td>
                        <td className="py-4 px-6">
                          <span className="font-bold text-blue-400">{user.reputation} pts</span>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            user.role === "admin" ? "bg-red-500/10 text-red-400 border border-red-500/20" : 
                            user.role === "supervisor" ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20" : 
                            user.role === "operator" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" : 
                            "bg-slate-500/10 text-slate-400 border border-slate-500/20"
                          }`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <select
                            value={user.role}
                            onChange={(e) => handleUpdateRole(user._id, e.target.value)}
                            className="bg-slate-800 border border-slate-700/60 rounded-lg py-1 px-2.5 text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                          >
                            <option value="citizen">Cidadão</option>
                            <option value="operator">Operador Campo</option>
                            <option value="supervisor">Supervisor</option>
                            <option value="admin">Administrador</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </main>

    </div>
  );

  // Helper action status changer
  async function handleUpdateReportStatus(reportId: any, nextStatus: string) {
    try {
      await updateReportStatus({
        reportId,
        status: nextStatus,
        userId: "j97efm1s5hfsxndnv424h7e42d1x48w2" as any, // Mock Super Admin actor ID
        notes: `Estado atualizado no Web Dashboard de triagem municipal.`
      });
      alert(`Estado atualizado para ${nextStatus}!`);
    } catch (e: any) {
      alert("Erro ao alterar estado: " + e.message);
    }
  }
}
