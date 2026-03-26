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
  financiamento_habitacional_pos_2005: 'Financ. Hab. Pós 2005',
  tem_financiamento_estudantil: 'Financ. Estudantil',
  financiamento_estudantil_em_atraso: 'Financ. Estudantil em Atraso',
  tem_veiculo: 'Possui Veículo',
  valor_mercado_veiculo: 'Valor Mercado Veíc.',
  veiculo_financiado: 'Veículo Financiado',
  prestacao_veiculo: 'Prestação Veíc.',
  parcelas_restantes_veiculo: 'Parcelas Restantes',
  tem_cartao_credito: 'Cartão Crédito',
  bandeira_cartao: 'Bandeira Cartão',
  tem_imovel: 'Possui Imóvel',
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
        <XCircle size={40} strokeWidth={1.5} style={{ color: 'var(--gray-400)', marginBottom: '12px' }} />
        <div className="empty-state-title">Candidato não encontrado</div>
        <button className="btn btn-primary" onClick={() => navigate('/admin')} style={{ marginTop: '16px' }}>
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
          style={{ marginBottom: '16px', fontSize: '0.8rem' }}
        >
          <ArrowLeft size={14} /> Voltar
        </button>

        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              background: 'var(--primary-600)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.1rem',
              fontWeight: 800,
              color: 'white',
              flexShrink: 0,
            }}>
              {candidate.nome_completo.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 style={{ fontSize: '1.375rem', fontWeight: 800, lineHeight: 1.2, marginBottom: '4px' }}>
                {candidate.nome_completo}
              </h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                  {candidate.cpf}
                </span>
                <StatusBadge status={candidate.status as CandidateStatus} />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button className="btn btn-success btn-sm" onClick={() => handleStatusChange('aprovado')} disabled={saving}>
              <Check size={14} /> Aprovar
            </button>
            <button className="btn btn-danger btn-sm" onClick={() => handleStatusChange('sem_renda_comprovavel')} disabled={saving}>
              <X size={14} /> Reprovar
            </button>
            <button className="btn btn-outline btn-sm" onClick={() => handleStatusChange('aguardando_correcao')} disabled={saving}>
              <AlertTriangle size={14} /> Pedir Correção
            </button>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="stats-grid" style={{ marginBottom: '20px' }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(59, 130, 246, 0.08)', color: 'var(--info-500)' }}><FileText size={18} /></div>
          <div>
            <div className="stat-value" style={{ fontSize: '1.25rem' }}>{docsUploaded}/{docsRequired}</div>
            <div className="stat-label">Enviados</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.08)', color: 'var(--success-500)' }}><CheckCircle size={18} /></div>
          <div>
            <div className="stat-value" style={{ fontSize: '1.25rem' }}>{docsApproved}</div>
            <div className="stat-label">Aprovados</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(239, 68, 68, 0.08)', color: 'var(--danger-500)' }}><XCircle size={18} /></div>
          <div>
            <div className="stat-value" style={{ fontSize: '1.25rem' }}>{docsRejected}</div>
            <div className="stat-label">Rejeitados</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.08)', color: 'var(--accent-500)' }}><FileWarning size={18} /></div>
          <div>
            <div className="stat-value" style={{ fontSize: '1.25rem' }}>{docsMissing.length}</div>
            <div className="stat-label">Faltantes</div>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {candidate.fichas_cadastrais && (
        <div style={{ marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {candidate.fichas_cadastrais.tem_imovel && (
            <div className="alert alert-warning">
              <span className="alert-icon"><AlertTriangle size={16} /></span>
              <span><strong>Atenção:</strong> Candidato declarou possuir imóvel em seu nome.</span>
            </div>
          )}
          {candidate.fichas_cadastrais.financiamento_habitacional_pos_2005 && (
            <div className="alert alert-error">
              <span className="alert-icon"><Ban size={16} /></span>
              <span><strong>Subsídio Bloqueado:</strong> Benefício habitacional pós 16/05/2005.</span>
            </div>
          )}
          {candidate.fichas_cadastrais.tipo_renda === 'Sem_renda' && (
            <div className="alert alert-error">
              <span className="alert-icon"><Wallet size={16} /></span>
              <span><strong>Sem Renda:</strong> Candidato declarou não possuir renda.</span>
            </div>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="tabs">
        <button className={`tab ${activeTab === 'dados' ? 'active' : ''}`} onClick={() => setActiveTab('dados')}>
          <User size={14} /> Dados
        </button>
        <button className={`tab ${activeTab === 'documentos' ? 'active' : ''}`} onClick={() => setActiveTab('documentos')}>
          <FileText size={14} /> Documentos ({docsUploaded})
        </button>
        <button className={`tab ${activeTab === 'validacao' ? 'active' : ''}`} onClick={() => setActiveTab('validacao')}>
          <Bot size={14} /> Validação IA
        </button>
      </div>

      {/* Tab: Dados */}
      {activeTab === 'dados' && (
        <div className="animate-slideUp">
          {/* Personal */}
          <div className="detail-section">
            <h3 className="detail-section-title"><User size={16} /> Dados Pessoais</h3>
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
                <span className="detail-label">Endereço</span>
                <span className="detail-value">{candidate.endereco || '—'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Município</span>
                <span className="detail-value">{candidate.municipio_projeto || '—'}</span>
              </div>
            </div>
          </div>

          {/* Ficha */}
          {candidate.fichas_cadastrais ? (
            <div className="detail-section">
              <h3 className="detail-section-title"><FileEdit size={16} /> Ficha Pré-Cadastral</h3>
              <div className="detail-grid">
                {Object.entries(candidate.fichas_cadastrais)
                  .filter(([key]) => key !== 'candidato_id' && key !== 'created_at' && key !== 'updated_at')
                  .map(([key, value]) => (
                    <div className="detail-item" key={key}>
                      <span className="detail-label">{FORM_ANSWER_LABELS[key] || key}</span>
                      <span className="detail-value">{formatValue(value)}</span>
                    </div>
                  ))}
              </div>

              {/* Dependents */}
              {candidate.dependentes && candidate.dependentes.length > 0 && (
                <div style={{ marginTop: '20px' }}>
                  <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Dependentes
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '8px' }}>
                    {candidate.dependentes.map(dep => (
                      <div key={dep.id} style={{
                        padding: '10px 14px',
                        background: 'var(--bg-tertiary)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-default)',
                      }}>
                        <div style={{ fontWeight: 600, fontSize: '0.8125rem' }}>{dep.nome}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {dep.idade} anos · {dep.grau_parentesco === 'Outro' ? dep.outro_parentesco : dep.grau_parentesco}
                        </div>
                        {dep.tem_renda && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Renda: R$ {dep.valor_renda}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Narrative */}
              <div style={{ marginTop: '20px' }}>
                <h3 className="detail-section-title"><BookOpen size={16} /> Narrativa de Renda</h3>
                <div style={{
                  padding: '14px 16px',
                  background: 'var(--bg-tertiary)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-default)',
                }}>
                  <p style={{ fontSize: '0.875rem', lineHeight: 1.7, whiteSpace: 'pre-wrap', color: 'var(--text-secondary)' }}>
                    {candidate.narrativa_renda || '(Nenhuma narrativa fornecida)'}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="alert alert-warning" style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'flex-start' }}>
              <div className="flex items-center gap-2">
                <span className="alert-icon"><FileWarning size={16} /></span>
                <span>Ficha pré-cadastral ainda não preenchida.</span>
              </div>
              <button 
                className="btn btn-primary btn-sm"
                onClick={() => navigate(`/onboarding?id=${candidate.id}&admin=true`)}
              >
                Preencher Ficha
              </button>
            </div>
          )}

          {/* Observations */}
          <div className="detail-section" style={{ marginTop: '20px' }}>
            <h3 className="detail-section-title"><FileEdit size={16} /> Observações do Analista</h3>
            <div className="form-group">
              <textarea
                className="form-textarea"
                placeholder="Anotações sobre o candidato..."
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
                rows={3}
                style={{ minHeight: '80px' }}
              />
              <button
                className="btn btn-primary btn-sm"
                style={{ alignSelf: 'flex-end' }}
                onClick={handleSaveObservations}
                disabled={saving}
              >
                {saving ? 'Salvando...' : <><Check size={14} /> Salvar</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Documentos */}
      {activeTab === 'documentos' && (
        <div className="animate-slideUp">
          {docsMissing.length > 0 && (
            <div className="alert alert-warning" style={{ marginBottom: '16px' }}>
              <span className="alert-icon"><FileWarning size={16} /></span>
              <span>
                <strong>Faltantes ({docsMissing.length}):</strong>{' '}
                {docsMissing.map((dt) => getDocumentName(dt)).join(', ')}
              </span>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '12px' }}>
            {reqList.map((docType) => {
              const doc = documentos.find((d) => d.tipo_documento === docType);
              const statusColorMap: Record<string, string> = {
                Pendente: 'var(--gray-400)',
                Enviado: 'var(--info-500)',
                Processando: 'var(--accent-500)',
                Aprovado: 'var(--success-500)',
                Rejeitado: 'var(--danger-500)',
              };

              return (
                <div
                  key={docType}
                  className="doc-card"
                  style={{
                    borderLeft: `3px solid ${doc ? statusColorMap[doc.status_upload] : 'var(--gray-200)'}`,
                  }}
                >
                  <div className="doc-card-header">
                    <span className="doc-card-title">{getDocumentName(docType)}</span>
                    {doc ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem', fontWeight: 600, color: statusColorMap[doc.status_upload] }}>
                        {doc.status_upload === 'Aprovado' && <><CheckCircle size={12} /> Aprovado</>}
                        {doc.status_upload === 'Rejeitado' && <><XCircle size={12} /> Rejeitado</>}
                        {doc.status_upload === 'Enviado' && <><CheckCircle size={12} /> Enviado</>}
                        {doc.status_upload === 'Pendente' && <><AlertTriangle size={12} /> Pendente</>}
                      </span>
                    ) : (
                      <span style={{ fontSize: '0.7rem', color: 'var(--gray-400)' }}>
                        Não enviado
                      </span>
                    )}
                  </div>

                  {doc ? (
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                        <Paperclip size={12} /> {doc.arquivo_original_nome || 'Arquivo'}
                      </div>

                      {doc.status_ia !== 'Pendente' && (
                        <div style={{ marginBottom: '10px' }}>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Confiança IA</div>
                          <ConfidenceMeter value={doc.confianca_leitura_ia || 0} />
                          <div style={{ marginTop: '4px', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                            IA: {doc.status_ia}
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2" style={{ marginTop: '8px' }}>
                        <button className="btn btn-outline btn-sm" onClick={() => setSelectedDocUrl(doc.arquivo_url)}>
                          <Eye size={12} /> Ver
                        </button>
                        <button
                          className="btn btn-success btn-sm"
                          onClick={() => handleDocAction(doc, 'Aprovado')}
                          disabled={doc.status_upload === 'Aprovado'}
                        >
                          <Check size={12} />
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => setRejectingDocId(doc.id!)}
                          disabled={doc.status_upload === 'Rejeitado'}
                        >
                          <X size={12} />
                        </button>
                      </div>
                      {doc.motivo_rejeicao && doc.status_upload === 'Rejeitado' && (
                        <div style={{ marginTop: '8px', fontSize: '0.75rem', color: 'var(--danger-500)' }}>
                          <strong>Motivo:</strong> {doc.motivo_rejeicao}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                      Aguardando envio.
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab: Validação IA */}
      {activeTab === 'validacao' && (
        <div className="animate-slideUp">
          <div className="alert alert-info" style={{ marginBottom: '16px' }}>
            <span className="alert-icon"><Bot size={16} /></span>
            <span>A validação por IA analisa qualidade, extrai dados via OCR e verifica prazos.</span>
          </div>

          {documentos.filter((d) => d.status_ia && d.status_ia !== 'Pendente').length === 0 ? (
            <div className="empty-state">
              <Bot size={40} strokeWidth={1.5} style={{ color: 'var(--gray-400)', marginBottom: '12px' }} />
              <div className="empty-state-title">Nenhuma validação concluída</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {documentos
                .filter((d) => d.status_ia !== 'Pendente')
                .map((doc) => (
                  <div key={doc.id} className="card" style={{ padding: 'var(--space-4)' }}>
                    <div className="flex items-center justify-between" style={{ marginBottom: '12px' }}>
                      <h4 style={{ fontWeight: 600, fontSize: '0.875rem' }}>
                        {getDocumentName(doc.tipo_documento as DocumentType)}
                      </h4>
                      <span style={{
                        padding: '3px 10px',
                        borderRadius: 'var(--radius-full)',
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        background: doc.status_ia === 'Aprovado' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                        color: doc.status_ia === 'Aprovado' ? '#047857' : '#991b1b',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}>
                        {doc.status_ia === 'Aprovado' ? <><CheckCircle size={12} /> Válido</> : <><XCircle size={12} /> Rejeitado</>}
                      </span>
                    </div>

                    <div className="detail-grid" style={{ marginBottom: '12px' }}>
                      <div className="detail-item">
                        <span className="detail-label">Confiança</span>
                        <ConfidenceMeter value={doc.confianca_leitura_ia || 0} />
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Data Emissão</span>
                        <span className="detail-value">{doc.data_emissao_documento || 'ND'}</span>
                      </div>
                    </div>

                    {doc.alertas_ia && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {doc.alertas_ia.issues && doc.alertas_ia.issues.length > 0 && (
                          <div>
                            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--danger-500)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <AlertTriangle size={12} /> Problemas:
                            </div>
                            <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                              {doc.alertas_ia.issues.map((issue: string, idx: number) => (
                                <li key={idx}>{issue}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {doc.alertas_ia.expiryCheck && (
                          <div style={{
                            padding: '8px 10px',
                            borderRadius: 'var(--radius-md)',
                            background: doc.alertas_ia.expiryCheck.isExpired ? '#fef2f2' : '#f0fdf4',
                            border: `1px solid ${doc.alertas_ia.expiryCheck.isExpired ? '#fecaca' : '#dcfce7'}`,
                            fontSize: '0.75rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            color: doc.alertas_ia.expiryCheck.isExpired ? '#991b1b' : '#166534'
                          }}>
                            {doc.alertas_ia.expiryCheck.isExpired ? <Ban size={14} /> : <CheckCircle size={14} />}
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

      {/* Document Viewer Modal */}
      {selectedDocUrl && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{ padding: '12px 16px', display: 'flex', justifyContent: 'flex-end', gap: '8px', background: 'var(--gray-900)' }}>
            <a href={selectedDocUrl} target="_blank" rel="noopener noreferrer" download className="btn btn-outline btn-sm" style={{ color: '#fff', borderColor: 'rgba(255,255,255,0.2)' }}>
              <Download size={14} /> Exportar
            </a>
            <button className="btn btn-primary btn-sm" onClick={() => setSelectedDocUrl(null)}>Fechar ✕</button>
          </div>
          <div style={{ flex: 1, padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <iframe 
              src={selectedDocUrl} 
              style={{ width: '100%', maxWidth: '900px', height: '100%', backgroundColor: 'white', border: 'none', borderRadius: 'var(--radius-md)' }}
              title="Document Viewer"
            />
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {rejectingDocId && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(2px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '400px', padding: '24px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '16px' }}>Rejeitar Documento</h3>
            <div className="form-group">
              <label className="form-label">Motivo da rejeição</label>
              <textarea 
                className="form-textarea" 
                rows={3}
                placeholder="Ex: Documento ilegível, data expirada..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                style={{ minHeight: '80px' }}
              />
            </div>
            <div className="flex justify-between" style={{ marginTop: '16px' }}>
              <button className="btn btn-ghost btn-sm" onClick={() => { setRejectingDocId(null); setRejectReason(''); }}>
                Cancelar
              </button>
              <button className="btn btn-danger btn-sm" onClick={submitRejection} disabled={!rejectReason.trim()}>
                Confirmar Rejeição
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
