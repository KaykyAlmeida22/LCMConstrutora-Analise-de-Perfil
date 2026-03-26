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
  Users, Plus, FolderOpen, ArrowRight
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
    { key: 'documentacao_pendente', icon: <FileText size={20} /> },
    { key: 'em_analise', icon: <Search size={20} /> },
    { key: 'aguardando_correcao', icon: <AlertTriangle size={20} /> },
    { key: 'aprovado', icon: <CheckCircle size={20} /> },
    { key: 'subsidio_bloqueado', icon: <Ban size={20} /> },
    { key: 'sem_renda_comprovavel', icon: <Wallet size={20} /> },
  ];

  const totalCandidates = candidates.length;

  return (
    <div className="animate-fadeIn">
      {/* Page header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '4px', letterSpacing: '-0.02em' }}>
          Painel de Análise
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          Acompanhe o status dos candidatos ao programa Minha Casa Minha Vida.
        </p>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ marginBottom: '24px' }}>
        {/* Total */}
        <div className="stat-card" style={{ borderLeft: '3px solid var(--primary-600)' }}>
          <div className="stat-icon" style={{ background: 'rgba(140, 198, 63, 0.1)', color: 'var(--primary-600)' }}>
            <Users size={20} />
          </div>
          <div>
            <div className="stat-value" style={{ color: 'var(--primary-700)' }}>{totalCandidates}</div>
            <div className="stat-label">Total</div>
          </div>
        </div>
        {statCards.map((sc) => (
          <div
            key={sc.key}
            className="stat-card"
            style={{
              cursor: 'pointer',
              borderLeft: statusFilter === sc.key ? `3px solid ${STATUS_COLORS[sc.key]}` : '3px solid transparent'
            }}
            onClick={() => setStatusFilter(statusFilter === sc.key ? '' : sc.key)}
          >
            <div
              className="stat-icon"
              style={{
                background: `${STATUS_COLORS[sc.key]}14`,
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

      {/* Search + Actions */}
      <div
        className="flex items-center justify-between"
        style={{ marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}
      >
        <div style={{ position: 'relative', flex: 1, maxWidth: '380px' }}>
          <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)' }}>
            <Search size={16} />
          </span>
          <input
            className="form-input"
            style={{
              paddingLeft: '36px',
              fontSize: '0.8125rem',
            }}
            placeholder="Buscar por nome ou CPF..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            id="search-candidates"
          />
        </div>

        <div className="flex items-center gap-2">
          {statusFilter && (
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setStatusFilter('')}
              style={{ fontSize: '0.75rem' }}
            >
              ✕ Limpar filtro
            </button>
          )}
          <button
            className="btn btn-primary"
            onClick={() => navigate('/admin/novo-candidato')}
            id="btn-new-candidate"
          >
            <Plus size={16} /> Novo Candidato
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
              <th style={{ width: '100px' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <div className="empty-state" style={{ padding: '48px 24px' }}>
                    <div style={{ color: 'var(--gray-400)', marginBottom: '12px' }}>
                      <FolderOpen size={40} strokeWidth={1.5} />
                    </div>
                    <div className="empty-state-title">
                      Nenhum candidato encontrado
                    </div>
                    <div className="empty-state-text">
                      {search || statusFilter
                        ? 'Tente alterar os filtros de busca.'
                        : 'Clique em "Novo Candidato" para começar.'}
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
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: 34,
                          height: 34,
                          borderRadius: '50%',
                          background: `${STATUS_COLORS[c.status as CandidateStatus]}12`,
                          border: `1.5px solid ${STATUS_COLORS[c.status as CandidateStatus]}30`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          color: STATUS_COLORS[c.status as CandidateStatus],
                          flexShrink: 0,
                        }}>
                          {c.nome_completo.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.875rem', lineHeight: 1.3 }}>{c.nome_completo}</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{c.telefone}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {c.cpf}
                    </td>
                    <td><StatusBadge status={c.status as CandidateStatus} /></td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{
                          width: '50px',
                          height: '4px',
                          background: 'var(--gray-100)',
                          borderRadius: 'var(--radius-full)',
                          overflow: 'hidden',
                        }}>
                          <div style={{
                            width: docsRequired > 0 ? `${Math.min((docsUploaded / docsRequired) * 100, 100)}%` : '0%',
                            height: '100%',
                            background: docsUploaded >= docsRequired && docsRequired > 0
                              ? 'var(--success-500)'
                              : 'var(--primary-500)',
                            borderRadius: 'var(--radius-full)',
                            transition: 'width 0.3s ease',
                          }} />
                        </div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                          {docsUploaded}/{docsRequired}
                        </span>
                      </div>
                    </td>
                    <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {new Date(c.updated_at).toLocaleDateString('pt-BR')}
                    </td>
                    <td>
                      <button
                        className="btn btn-ghost btn-sm"
                        style={{ fontSize: '0.75rem', color: 'var(--primary-600)', fontWeight: 500 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/admin/candidato/${c.id}`);
                        }}
                      >
                        Ver <ArrowRight size={12} />
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
