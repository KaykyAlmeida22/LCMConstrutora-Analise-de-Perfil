import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { getRequiredDocuments, getDocumentName } from '../../services/documentRules';
import type { Candidate, CandidateStatus, DocumentType, Document } from '../../types';
import StatusBadge from '../../components/shared/StatusBadge';
import ConfidenceMeter from '../../components/shared/ConfidenceMeter';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import { 
  ArrowLeft, Check, X, AlertTriangle, FileText, CheckCircle, 
  XCircle, FileWarning, User, Bot, FileEdit, Ban, Wallet, 
  BookOpen, Paperclip, Eye, Download 
} from 'lucide-react';

const FORM_ANSWER_LABELS: Record<string, string> = {
  tipo_residencia: 'Tipo de Residência',
  valor_aluguel: 'Valor do Aluguel',
  teve_imovel_anterior: 'Imóvel Anterior',
  venda_registrada_cartorio: 'Venda Registrada',
  escolaridade: 'Escolaridade',
  estado_civil: 'Estado Civil',
  regime_bens: 'Regime de Bens',
  data_casamento: 'Data Casamento',
  tem_dependentes: 'Possui Dependentes',
  tem_financiamento_habitacional: 'Financ. Habitacional',
  data_contrato_habitacional: 'Data Contrato financ.',
  financiamento_habitacional_pos_2005: 'Financ. Hab. Pós 2005 (Bloqueante)',
  tem_financiamento_estudantil: 'Financ. Estudantil',
  financiamento_estudantil_em_atraso: 'Financ. Estudantil em Atraso',
  tem_veiculo: 'Possui Veículo',
  valor_mercado_veiculo: 'Valor Mercado Veíc.',
  veiculo_financiado: 'Veículo Financiado',
  prestacao_veiculo: 'Prestação Veí.',
  parcelas_restantes_veiculo: 'Parcelas Restantes veíc.',
  tem_cartao_credito: 'Cartão Crédito',
  bandeira_cartao: 'Bandeira Cartão',
  tem_imovel: 'Possui Imóvel Atual',
  valor_mercado_imovel: 'Valor Imóvel',
  declara_ir: 'Declara IR',
  tem_conta_corrente: 'Conta Corrente',
  banco_conta_corrente: 'Banco',
  limite_cheque_especial: 'Cheque Especial',
  tem_poupanca_aplicacao: 'Poupança / Aplicação',
  comprova_36_meses_fgts: 'Comprova 36 Meses FGTS',
  fara_uso_fgts: 'Uso de FGTS',
  tipo_renda: 'Tipo Renda',
  faixa_renda: 'Faixa Renda',
  trabalha_aplicativo: 'Trabalho de App'
};

function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'boolean') return value ? 'Sim' : 'Não';
  if (typeof value === 'number') return String(value);
  return String(value);
}

export default function CandidateDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dados' | 'documentos' | 'validacao'>('dados');
  const [observations, setObservations] = useState('');
  const [saving, setSaving] = useState(false);
  const [selectedDocUrl, setSelectedDocUrl] = useState<string | null>(null);
  const [rejectingDocId, setRejectingDocId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    loadCandidate();
  }, [id]);

  async function loadCandidate() {
    if (!id) return;
    setLoading(true);
    const c = await api.getCandidate(id);
    if (c) {
      setCandidate(c);
      setObservations(c.observacoes_analista || '');
    }
    setLoading(false);
  }

  async function handleStatusChange(newStatus: CandidateStatus) {
    if (!candidate) return;
    setSaving(true);
    await api.updateCandidate(candidate.id, {
      status: newStatus,
      observacoes_analista: observations,
    });
    // Log history
    await api.updateStatus(candidate.id, newStatus, undefined, 'Status alterado manualmente pelo analista');
    await loadCandidate();
    setSaving(false);
  }

  async function handleDocAction(doc: Document, action: 'Aprovado' | 'Rejeitado', reason?: string) {
    if (!candidate || !doc.id) return;
    await api.updateDocument(doc.id, { 
      status_upload: action,
      aprovado_pelo_analista: action === 'Aprovado',
      motivo_rejeicao: reason || ''
    });
    
    // Auto status check for overall progression if needed
    // Example: If all are approved, Candidate status -> 'aprovado'
    // But for now, just reload
    
    await loadCandidate();
  }

  async function submitRejection() {
    if (!rejectingDocId) return;
    const doc = candidate?.documentos?.find(d => d.id === rejectingDocId);
    if (doc) {
      await handleDocAction(doc, 'Rejeitado', rejectReason);
    }
    setRejectingDocId(null);
    setRejectReason('');
  }

  async function handleSaveObservations() {
    if (!candidate) return;
    setSaving(true);
    await api.updateCandidate(candidate.id, { observacoes_analista: observations });
    setSaving(false);
  }

  if (loading) return <LoadingSpinner size="lg" />;
  if (!candidate) {
    return (
      <div className="empty-state">
        <div style={{ color: 'var(--text-muted)', marginBottom: '16px', display: 'flex', justifyContent: 'center' }}>
          <XCircle size={48} strokeWidth={1} />
        </div>
        <div className="empty-state-title">Candidato não encontrado</div>
        <button className="btn btn-primary" onClick={() => navigate('/admin')}>
          Voltar ao Painel
        </button>
      </div>
    );
  }

  const documentos = candidate.documentos || [];
  const reqList = candidate.fichas_cadastrais ? getRequiredDocuments(candidate.fichas_cadastrais) : [];
  
  const docsUploaded = documentos.length;
  const docsRequired = reqList.length;
  const docsApproved = documentos.filter((d) => d.status_upload === 'Aprovado').length;
  const docsRejected = documentos.filter((d) => d.status_upload === 'Rejeitado').length;
  const docsMissing = reqList.filter(
    (dt) => !documentos.find((d) => d.tipo_documento === dt)
  );

  return (
    <div className="animate-fadeIn">
      {/* Back + Header */}
      <div style={{ marginBottom: '24px' }}>
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => navigate('/admin/candidatos')}
          style={{ marginBottom: '16px' }}
        >
          <ArrowLeft size={16} /> Voltar aos Candidatos
        </button>

        <div className="flex items-center justify-between" style={{ flexWrap: 'wrap', gap: '16px' }}>
          <div className="flex items-center gap-4">
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--primary-600), var(--primary-400))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.3rem',
                fontWeight: 800,
                color: 'white',
              }}
            >
              {candidate.nome_completo.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 800, lineHeight: 1.2 }}>
                {candidate.nome_completo}
              </h1>
              <div className="flex items-center gap-3" style={{ marginTop: '4px' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                  CPF: {candidate.cpf}
                </span>
                <StatusBadge status={candidate.status as CandidateStatus} />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              className="btn btn-success"
              onClick={() => handleStatusChange('aprovado')}
              disabled={saving}
            >
              <Check size={16} /> Aprovar Final
            </button>
            <button
              className="btn btn-danger"
              onClick={() => handleStatusChange('sem_renda_comprovavel')}
              disabled={saving}
            >
              <X size={16} /> Reprovar (Sem Renda)
            </button>
            <button
              className="btn btn-outline"
              onClick={() => handleStatusChange('aguardando_correcao')}
              disabled={saving}
            >
              <AlertTriangle size={16} /> Pedir Correção
            </button>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="stats-grid" style={{ marginBottom: '24px' }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(59, 130, 246, 0.12)', color: 'var(--primary-400)' }}><FileText size={24} /></div>
          <div>
            <div className="stat-value" style={{ fontSize: '1.4rem' }}>{docsUploaded}/{docsRequired}</div>
            <div className="stat-label">Documentos Enviados</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.12)', color: 'var(--success-500)' }}><CheckCircle size={24} /></div>
          <div>
            <div className="stat-value" style={{ fontSize: '1.4rem' }}>{docsApproved}</div>
            <div className="stat-label">Doc. Aprovados</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(239, 68, 68, 0.12)', color: 'var(--danger-500)' }}><XCircle size={24} /></div>
          <div>
            <div className="stat-value" style={{ fontSize: '1.4rem' }}>{docsRejected}</div>
            <div className="stat-label">Doc. Rejeitados</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.12)', color: 'var(--accent-500)' }}><FileWarning size={24} /></div>
          <div>
            <div className="stat-value" style={{ fontSize: '1.4rem' }}>{docsMissing.length}</div>
            <div className="stat-label">Doc. Faltantes</div>
          </div>
        </div>
      </div>

      {/* Global Alerts */}
      {candidate.fichas_cadastrais && (
        <div style={{ marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {candidate.fichas_cadastrais.tem_imovel && (
            <div className="alert alert-warning">
              <span className="alert-icon"><AlertTriangle size={20} /></span>
              <div>
                <strong>Atenção:</strong> Candidato declarou possuir imóvel em seu nome neste instante.
              </div>
            </div>
          )}
          {candidate.fichas_cadastrais.financiamento_habitacional_pos_2005 && (
            <div className="alert alert-error">
              <span className="alert-icon"><Ban size={20} /></span>
              <div>
                <strong>Subsídio Bloqueado:</strong> Candidato recebeu benefício habitacional após 16/05/2005. Processo pode continuar sem subsídio.
              </div>
            </div>
          )}
          {candidate.fichas_cadastrais.tipo_renda === 'Sem_renda' && (
            <div className="alert alert-error">
              <span className="alert-icon"><Wallet size={20} /></span>
              <div>
                <strong>Sem Renda Comprovável:</strong> Candidato declarou não possuir renda alguma. (Avaliar reprovação)
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="tabs">
        <button className={`tab ${activeTab === 'dados' ? 'active' : ''}`} onClick={() => setActiveTab('dados')}>
          <User size={16} /> Dados do Candidato
        </button>
        <button className={`tab ${activeTab === 'documentos' ? 'active' : ''}`} onClick={() => setActiveTab('documentos')}>
          <FileText size={16} /> Documentos ({docsUploaded})
        </button>
        <button className={`tab ${activeTab === 'validacao' ? 'active' : ''}`} onClick={() => setActiveTab('validacao')}>
          <Bot size={16} /> Validação IA
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'dados' && (
        <div className="animate-slideUp">
          {/* Personal Info */}
          <div className="detail-section">
            <h3 className="detail-section-title flex items-center gap-2"><User size={20} className="text-primary-400" /> Dados Pessoais</h3>
            <div className="detail-grid">
              <div className="detail-item">
                <span className="detail-label">Nome Completo</span>
                <span className="detail-value">{candidate.nome_completo}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">CPF</span>
                <span className="detail-value" style={{ fontFamily: 'monospace' }}>{candidate.cpf}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Telefone</span>
                <span className="detail-value">{candidate.telefone || '—'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Endereço (MCMV)</span>
                <span className="detail-value">{candidate.endereco || '—'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Município Projeto</span>
                <span className="detail-value">{candidate.municipio_projeto || '—'}</span>
              </div>
            </div>
          </div>

          {/* Form Answers */}
          {candidate.fichas_cadastrais ? (
            <div className="detail-section">
              <h3 className="detail-section-title flex items-center gap-2"><FileEdit size={20} className="text-primary-400" /> Respostas da Ficha Pré-Cadastral</h3>
              <div className="detail-grid">
                {Object.entries(candidate.fichas_cadastrais)
                  .filter(([key]) => key !== 'candidato_id')
                  .map(([key, value]) => (
                    <div className="detail-item" key={key}>
                      <span className="detail-label">{FORM_ANSWER_LABELS[key] || key}</span>
                      <span className="detail-value">{formatValue(value)}</span>
                    </div>
                  ))}
              </div>

              {/* Dependentes se houver */}
              {candidate.dependentes && candidate.dependentes.length > 0 && (
                 <div style={{ marginTop: '16px' }}>
                   <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase' }}>Dependentes</div>
                   <div className="detail-grid">
                      {candidate.dependentes.map(dep => (
                         <div key={dep.id} className="card" style={{ padding: '8px 12px' }}>
                           <div><strong>{dep.nome}</strong> ({dep.idade} anos)</div>
                           <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Grau: {dep.grau_parentesco}</div>
                           {dep.tem_renda && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Renda: R$ {dep.valor_renda}</div>}
                         </div>
                      ))}
                   </div>
                 </div>
              )}

              {/* Narrative */}
              <div style={{ marginTop: '24px' }}>
                <h3 className="detail-section-title flex items-center gap-2"><BookOpen size={20} className="text-primary-400" /> Narrativa sobre Atividade e Renda</h3>
                <div
                  className="card"
                  style={{
                    background: 'rgba(59, 130, 246, 0.05)',
                    borderColor: 'rgba(59, 130, 246, 0.15)',
                  }}
                >
                  <p style={{ fontSize: '0.9rem', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                    {candidate.fichas_cadastrais.narrativa_renda || '(Nenhuma narrativa fornecida)'}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="alert alert-warning" style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'flex-start' }}>
              <div className="flex items-center gap-2">
                <span className="alert-icon"><FileWarning size={20} /></span>
                <div>Ficha pré-cadastral ainda não foi preenchida por este candidato.</div>
              </div>
              <button 
                className="btn btn-primary btn-sm"
                onClick={() => navigate(`/onboarding?id=${candidate.id}&admin=true`)}
              >
                Preencher Ficha Agora
              </button>
            </div>
          )}

          {/* Analyst observations */}
          <div className="detail-section">
            <h3 className="detail-section-title flex items-center gap-2"><FileEdit size={20} className="text-primary-400" /> Observações do Analista</h3>
            <div className="form-group">
              <textarea
                className="form-textarea"
                placeholder="Escreva suas observações sobre o candidato..."
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
                rows={4}
              />
              <button
                className="btn btn-primary btn-sm"
                style={{ alignSelf: 'flex-end' }}
                onClick={handleSaveObservations}
                disabled={saving}
              >
                {saving ? 'Salvando...' : <><Check size={16} /> Salvar Observações</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'documentos' && (
        <div className="animate-slideUp">
          {/* Missing documents alert */}
          {docsMissing.length > 0 && (
            <div className="alert alert-warning" style={{ marginBottom: '20px' }}>
              <span className="alert-icon"><FileWarning size={20} /></span>
              <div>
                <strong>Documentos faltantes ({docsMissing.length}):</strong>{' '}
                {docsMissing.map((dt) => getDocumentName(dt)).join(', ')}
              </div>
            </div>
          )}

          {/* Document grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '16px' }}>
            {reqList.map((docType) => {
              const doc = documentos.find((d) => d.tipo_documento === docType);
              const statusColorMap: Record<string, string> = {
                Pendente: 'var(--text-muted)',
                Enviado: 'var(--primary-400)',
                Processando: 'var(--accent-500)',
                Aprovado: 'var(--success-500)',
                Rejeitado: 'var(--danger-500)',
              };

              return (
                <div
                  key={docType}
                  className="doc-card"
                  style={{
                    borderLeftWidth: '3px',
                    borderLeftColor: doc ? statusColorMap[doc.status_upload] : 'var(--border-default)',
                  }}
                >
                  <div className="doc-card-header">
                    <span className="doc-card-title">{getDocumentName(docType)}</span>
                    {doc ? (
                      <span
                        className="doc-card-status flex items-center gap-1"
                        style={{ color: statusColorMap[doc.status_upload], fontWeight: 600 }}
                      >
                        {doc.status_upload === 'Aprovado' && <><CheckCircle size={14} /> Aprovado</>}
                        {doc.status_upload === 'Rejeitado' && <><XCircle size={14} /> Rejeitado</>}
                        {doc.status_upload === 'Enviado' && <><CheckCircle size={14} /> Enviado</>}
                        {doc.status_upload === 'Pendente' && <><AlertTriangle size={14} /> Pendente</>}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        <XCircle size={12} /> Não enviado
                      </span>
                    )}
                  </div>

                  {doc ? (
                    <div>
                      <div className="flex items-center gap-2" style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                        <Paperclip size={14} /> {doc.arquivo_original_nome || 'Arquivo'} 
                      </div>

                      {doc.status_ia !== 'Pendente' && (
                        <div style={{ marginBottom: '12px' }}>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                            Confiança Lida (IA)
                          </div>
                          <ConfidenceMeter value={doc.confianca_leitura_ia || 0} />
                          <div style={{ marginTop: '8px', fontSize: '0.75rem' }}>
                            Status IA: {doc.status_ia}
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2" style={{ marginTop: '8px' }}>
                        <button
                          className="btn btn-outline btn-sm"
                          onClick={() => setSelectedDocUrl(doc.arquivo_url)}
                        >
                          <Eye size={14} /> Ver 
                        </button>
                        <button
                          className="btn btn-success btn-sm"
                          onClick={() => handleDocAction(doc, 'Aprovado')}
                          disabled={doc.status_upload === 'Aprovado'}
                        >
                          <Check size={14} /> 
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => setRejectingDocId(doc.id!)}
                          disabled={doc.status_upload === 'Rejeitado'}
                        >
                          <X size={14} /> 
                        </button>
                      </div>
                      {doc.motivo_rejeicao && doc.status_upload === 'Rejeitado' && (
                        <div style={{ marginTop: '8px', fontSize: '0.78rem', color: 'var(--danger-500)' }}>
                          <strong>Motivo:</strong> {doc.motivo_rejeicao}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                      Aguardando envio.
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'validacao' && (
        <div className="animate-slideUp">
          <div className="alert alert-info" style={{ marginBottom: '20px' }}>
            <span className="alert-icon"><Bot size={20} /></span>
            <div>
              A validação por IA analisa automaticamente a qualidade, extrai dados via OCR e verifica prazos de validade.
            </div>
          </div>

          {documentos.filter((d) => d.status_ia && d.status_ia !== 'Pendente').length === 0 ? (
            <div className="empty-state">
              <div style={{ color: 'var(--text-muted)', marginBottom: '16px', display: 'flex', justifyContent: 'center' }}>
                <Bot size={48} strokeWidth={1} />
              </div>
              <div className="empty-state-title">Nenhuma validação de IA concluída</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {documentos
                .filter((d) => d.status_ia !== 'Pendente')
                .map((doc) => (
                  <div key={doc.id} className="card">
                    <div className="flex items-center justify-between" style={{ marginBottom: '16px' }}>
                      <div>
                        <h4 style={{ fontWeight: 600, fontSize: '0.95rem' }}>
                          {getDocumentName(doc.tipo_documento as DocumentType)}
                        </h4>
                      </div>
                      <div
                        className="flex items-center gap-1"
                        style={{
                          padding: '4px 12px',
                          borderRadius: '999px',
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          background: doc.status_ia === 'Aprovado'
                            ? 'rgba(16, 185, 129, 0.12)'
                            : 'rgba(239, 68, 68, 0.12)',
                          color: doc.status_ia === 'Aprovado' ? 'var(--success-500)' : 'var(--danger-500)',
                        }}
                      >
                        {doc.status_ia === 'Aprovado' ? <><CheckCircle size={14} /> IA Válido</> : <><XCircle size={14} /> IA Rejeitado</>}
                      </div>
                    </div>

                    <div className="detail-grid" style={{ marginBottom: '16px' }}>
                      <div className="detail-item">
                        <span className="detail-label">Confiança Leitura</span>
                        <ConfidenceMeter value={doc.confianca_leitura_ia || 0} />
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Data Emissão Capturada</span>
                        <span className="detail-value">{doc.data_emissao_documento || 'ND'}</span>
                      </div>
                    </div>

                    {doc.alertas_ia && (
                      <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {doc.alertas_ia.issues && doc.alertas_ia.issues.length > 0 && (
                          <div>
                            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--danger-500)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <AlertTriangle size={14} /> Problemas Identificados:
                            </div>
                            <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                              {doc.alertas_ia.issues.map((issue: string, idx: number) => (
                                <li key={idx}>{issue}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {doc.alertas_ia.expiryCheck && (
                          <div style={{ 
                            padding: '8px 12px', 
                            borderRadius: '8px', 
                            background: doc.alertas_ia.expiryCheck.isExpired ? 'rgba(239, 68, 68, 0.08)' : 'rgba(16, 185, 129, 0.08)',
                            border: `1px solid ${doc.alertas_ia.expiryCheck.isExpired ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)'}`,
                            fontSize: '0.82rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            color: doc.alertas_ia.expiryCheck.isExpired ? 'var(--danger-500)' : 'var(--success-500)'
                          }}>
                            {doc.alertas_ia.expiryCheck.isExpired ? <Ban size={16} /> : <CheckCircle size={16} />}
                            {doc.alertas_ia.expiryCheck.message}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* Viewer Modal */}
      {selectedDocUrl && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.85)',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{ padding: '16px', display: 'flex', justifyContent: 'flex-end', gap: '8px', background: 'var(--bg-primary)' }}>
            <a
              href={selectedDocUrl}
              target="_blank"
              rel="noopener noreferrer"
              download
              className="btn btn-outline"
            >
              <Download size={16} /> Exportar PDF
            </a>
            <button className="btn btn-primary" onClick={() => setSelectedDocUrl(null)}>Fechar Visualizador ✕</button>
          </div>
          <div style={{ flex: 1, padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
            <iframe 
               src={selectedDocUrl} 
               style={{ width: '100%', maxWidth: '1000px', height: '100%', backgroundColor: 'white', border: 'none', borderRadius: '8px' }}
               title="Document Viewer"
            />
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {rejectingDocId && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div className="card-glass" style={{ width: '100%', maxWidth: '400px', padding: '24px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '16px' }}>Rejeitar Documento</h3>
            <div className="form-group">
              <label className="form-label">Por que o documento está sendo rejeitado?</label>
              <textarea 
                className="form-textarea" 
                rows={3}
                placeholder="Exemplo: Documento ilegível, data de emissão expirou..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />
            </div>
            <div className="flex justify-between" style={{ marginTop: '24px' }}>
              <button 
                className="btn btn-ghost" 
                onClick={() => {
                  setRejectingDocId(null);
                  setRejectReason('');
                }}>
                Cancelar
              </button>
              <button 
                className="btn btn-danger" 
                onClick={submitRejection}
                disabled={!rejectReason.trim()}
              >
                Confirmar Rejeição
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
