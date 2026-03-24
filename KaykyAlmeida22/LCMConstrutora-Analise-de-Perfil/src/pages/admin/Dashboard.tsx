import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { STATUS_LABELS, STATUS_COLORS } from '../../types';
import type { Candidate, CandidateStatus } from '../../types';
import StatusBadge from '../../components/shared/StatusBadge';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import { supabase } from '../../lib/supabase';
import { getRequiredDocuments } from '../../services/documentRules';
import { 
  FileText, Search, AlertTriangle, CheckCircle, Ban, Wallet, 
  Users, Plus, FolderOpen 
} from 'lucide-react';

export default function Dashboard() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [stats, setStats] = useState<Record<string, number> | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<CandidateStatus | ''>('');
  const navigate = useNavigate();

  useEffect(() => {
    loadData();

    // Setup realtime subscription
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public' },
        (_payload) => {
          loadData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function loadData() {
    setLoading(true);
    const [candidateList, statsData] = await Promise.all([
      api.getCandidates(),
      api.getStats(),
    ]);
    setCandidates(candidateList);
    setStats(statsData);
    setLoading(false);
  }

  const filtered = candidates.filter((c) => {
    const matchSearch =
      !search ||
      c.nome_completo.toLowerCase().includes(search.toLowerCase()) ||
      c.cpf.includes(search);
    const matchStatus = !statusFilter || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  if (loading) return <LoadingSpinner size="lg" />;

  const statCards: { key: CandidateStatus; icon: React.ReactNode }[] = [
    { key: 'documentacao_pendente', icon: <FileText size={24} /> },
    { key: 'em_analise', icon: <Search size={24} /> },
    { key: 'aguardando_correcao', icon: <AlertTriangle size={24} /> },
    { key: 'aprovado', icon: <CheckCircle size={24} /> },
    { key: 'subsidio_bloqueado', icon: <Ban size={24} /> },
    { key: 'sem_renda_comprovavel', icon: <Wallet size={24} /> },
  ];

  const totalCandidates = candidates.length;

  return (
    <div className="animate-fadeIn">
      {/* Page Title */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '4px' }}>
          Painel de Análise
        </h1>
        <p className="text-muted">
          Acompanhe o status dos candidatos ao programa Minha Casa Minha Vida.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid" style={{ marginBottom: '32px' }}>
        {/* Total card */}
        <div className="stat-card" style={{ borderColor: 'var(--primary-500)', borderWidth: '1px' }}>
          <div
            className="stat-icon"
            style={{
              background: 'linear-gradient(135deg, var(--primary-600), var(--primary-700))',
              color: 'white',
              boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.1)'
            }}
          >
            <Users size={24} />
          </div>
          <div>
            <div className="stat-value" style={{ color: 'var(--primary-400)' }}>
              {totalCandidates}
            </div>
            <div className="stat-label">Total de Candidatos</div>
          </div>
        </div>
        {statCards.map((sc) => (
          <div
            key={sc.key}
            className="stat-card"
            style={{ cursor: 'pointer' }}
            onClick={() => setStatusFilter(statusFilter === sc.key ? '' : sc.key)}
          >
            <div
              className="stat-icon"
              style={{
                background: `${STATUS_COLORS[sc.key]}18`,
                color: STATUS_COLORS[sc.key],
              }}
            >
              {sc.icon}
            </div>
            <div>
              <div className="stat-value">{stats?.[sc.key] ?? 0}</div>
              <div className="stat-label">{STATUS_LABELS[sc.key]}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filtro e Busca com botão lado a lado (estilo novo) */}
      <div
        className="flex items-center justify-between gap-4"
        style={{ marginBottom: '24px', flexWrap: 'wrap' }}
      >
        <div 
          className="search-input-wrapper" 
          style={{ 
            flex: 1, 
            maxWidth: '500px', 
            position: 'relative',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <span style={{ position: 'absolute', left: '16px', color: 'var(--text-muted)' }}><Search size={18} /></span>
          <input
            className="form-input"
            style={{
              paddingLeft: '44px',
              height: '48px',
              borderRadius: '12px',
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--border-default)',
              boxShadow: 'none',
              fontSize: '0.9rem'
            }}
            placeholder="Buscar por nome ou CPF..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            id="search-candidates"
          />
        </div>

        <div className="flex items-center gap-3">
          {statusFilter && (
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setStatusFilter('')}
            >
              ✕ Limpar filtro
            </button>
          )}
          <button
            className="btn btn-primary"
            style={{ 
              height: '48px', 
              padding: '0 24px', 
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
              boxShadow: '0 4px 16px rgba(6, 182, 212, 0.3)',
              fontSize: '0.95rem',
              fontWeight: 600
            }}
            onClick={() => navigate('/admin/novo-candidato')}
            id="btn-new-candidate"
          >
            <Plus size={18} /> Novo Candidato
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Candidato</th>
              <th>CPF</th>
              <th>Status</th>
              <th>Documentos</th>
              <th>Atualizado</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <div className="empty-state" style={{ padding: '64px 24px', textAlign: 'center' }}>
                    <div style={{ color: 'var(--text-muted)', marginBottom: '16px', display: 'flex', justifyContent: 'center' }}>
                      <FolderOpen size={48} strokeWidth={1} />
                    </div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
                      Nenhum candidato encontrado
                    </div>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                      {search || statusFilter
                        ? 'Tente alterar os filtros de busca para encontrar o que procura.'
                        : 'Clique no botão "Novo Candidato" ali em cima para começar.'}
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map((c) => {
                const _fichas = Array.isArray(c.fichas_cadastrais) ? c.fichas_cadastrais[0] : c.fichas_cadastrais;
                const reqList = _fichas ? getRequiredDocuments(_fichas) : [];
                const docsRequired = reqList.length;
                const docsUploaded = (c.documentos || []).length;
                
                return (
                  <tr
                    key={c.id}
                    className="table-row-clickable"
                    onClick={() => navigate(`/admin/candidato/${c.id}`)}
                  >
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div
                          style={{
                            width: 38,
                            height: 38,
                            borderRadius: '50%',
                            background: `linear-gradient(135deg, ${STATUS_COLORS[c.status as CandidateStatus]}40, ${STATUS_COLORS[c.status as CandidateStatus]}15)`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.85rem',
                            fontWeight: 700,
                            color: STATUS_COLORS[c.status as CandidateStatus],
                            flexShrink: 0,
                          }}
                        >
                          {c.nome_completo.charAt(0)}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{c.nome_completo}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {c.telefone}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{c.cpf}</td>
                    <td><StatusBadge status={c.status as CandidateStatus} /></td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div
                          style={{
                            width: '60px',
                            height: '5px',
                            background: 'var(--bg-tertiary)',
                            borderRadius: '999px',
                            overflow: 'hidden',
                          }}
                        >
                          <div
                            style={{
                              width: docsRequired > 0 ? `${Math.min((docsUploaded / docsRequired) * 100, 100)}%` : '0%',
                              height: '100%',
                              background: docsUploaded >= docsRequired && docsRequired > 0
                                ? 'var(--success-500)'
                                : 'var(--primary-500)',
                              borderRadius: '999px',
                              transition: 'width 0.4s ease',
                            }}
                          />
                        </div>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          {docsUploaded}/{docsRequired}
                        </span>
                      </div>
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {new Date(c.updated_at).toLocaleDateString('pt-BR')}
                    </td>
                    <td>
                      <button
                        className="btn btn-outline btn-sm"
                        style={{ borderRadius: '99px', fontSize: '0.75rem', padding: '6px 16px', borderColor: 'var(--border-hover)' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/admin/candidato/${c.id}`);
                        }}
                      >
                        Ver detalhes
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
