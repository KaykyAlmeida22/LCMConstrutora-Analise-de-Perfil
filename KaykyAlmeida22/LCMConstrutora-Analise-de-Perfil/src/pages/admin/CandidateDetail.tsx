import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../../services/mockDatabase';
import {
  DOCUMENT_LABELS,
} from '../../types';
import type {
  Candidate,
  CandidateStatus,
  DocumentType,
  CandidateDocument,
} from '../../types';
import StatusBadge from '../../components/shared/StatusBadge';
import ConfidenceMeter from '../../components/shared/ConfidenceMeter';
import LoadingSpinner from '../../components/shared/LoadingSpinner';

const FORM_ANSWER_LABELS: Record<string, string> = {
  estadoCivil: 'Estado Civil',
  temDependentes: 'Possui Dependentes',
  quantosDependentes: 'Quantidade de Dependentes',
  dependenteComRenda: 'Dependente com Renda',
  possuiImovel: 'Possui Imóvel',
  tipoMoradia: 'Tipo de Moradia',
  tipoRenda: 'Tipo de Renda',
  faixaRenda: 'Faixa de Renda',
  recebeuBeneficioHabitacional: 'Recebeu Benefício Habitacional',
  dataBeneficio: 'Data do Benefício',
  recebeBolsaFamilia: 'Recebe Bolsa Família',
  possuiFGTS: 'Possui FGTS',
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

  useEffect(() => {
    loadCandidate();
  }, [id]);

  async function loadCandidate() {
    if (!id) return;
    setLoading(true);
    const c = await db.getCandidate(id);
    if (c) {
      setCandidate(c);
      setObservations(c.analystObservations);
    }
    setLoading(false);
  }

  async function handleStatusChange(newStatus: CandidateStatus) {
    if (!candidate) return;
    setSaving(true);
    await db.updateCandidate(candidate.id, {
      status: newStatus,
      analystObservations: observations,
    });
    await loadCandidate();
    setSaving(false);
  }

  async function handleDocAction(doc: CandidateDocument, action: 'aprovado' | 'rejeitado') {
    if (!candidate) return;
    await db.updateDocument(candidate.id, doc.id, { status: action });
    await loadCandidate();
  }

  async function handleSaveObservations() {
    if (!candidate) return;
    setSaving(true);
    await db.updateCandidate(candidate.id, { analystObservations: observations });
    setSaving(false);
  }

  if (loading) return <LoadingSpinner size="lg" />;
  if (!candidate) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">❌</div>
        <div className="empty-state-title">Candidato não encontrado</div>
        <button className="btn btn-primary" onClick={() => navigate('/admin')}>
          Voltar ao Painel
        </button>
      </div>
    );
  }

  const docsUploaded = candidate.documents.length;
  const docsRequired = candidate.requiredDocuments.length;
  const docsApproved = candidate.documents.filter((d) => d.status === 'aprovado').length;
  const docsRejected = candidate.documents.filter((d) => d.status === 'rejeitado').length;
  const docsMissing = candidate.requiredDocuments.filter(
    (dt) => !candidate.documents.find((d) => d.type === dt)
  );

  return (
    <div className="animate-fadeIn">
      {/* Back + Header */}
      <div style={{ marginBottom: '24px' }}>
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => navigate('/admin')}
          style={{ marginBottom: '16px' }}
        >
          ← Voltar ao Painel
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
              {candidate.nome.charAt(0)}
            </div>
            <div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 800, lineHeight: 1.2 }}>
                {candidate.nome}
              </h1>
              <div className="flex items-center gap-3" style={{ marginTop: '4px' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                  CPF: {candidate.cpf}
                </span>
                <StatusBadge status={candidate.status} />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              className="btn btn-success"
              onClick={() => handleStatusChange('aprovado')}
              disabled={saving}
            >
              ✅ Aprovar
            </button>
            <button
              className="btn btn-danger"
              onClick={() => handleStatusChange('sem_renda_comprovavel')}
              disabled={saving}
            >
              ❌ Reprovar
            </button>
            <button
              className="btn btn-outline"
              onClick={() => handleStatusChange('aguardando_correcao')}
              disabled={saving}
            >
              ⚠️ Pedir Correção
            </button>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="stats-grid" style={{ marginBottom: '24px' }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(59, 130, 246, 0.12)', color: 'var(--primary-400)' }}>📄</div>
          <div>
            <div className="stat-value" style={{ fontSize: '1.4rem' }}>{docsUploaded}/{docsRequired}</div>
            <div className="stat-label">Documentos Enviados</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.12)', color: 'var(--success-500)' }}>✅</div>
          <div>
            <div className="stat-value" style={{ fontSize: '1.4rem' }}>{docsApproved}</div>
            <div className="stat-label">Aprovados</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(239, 68, 68, 0.12)', color: 'var(--danger-500)' }}>❌</div>
          <div>
            <div className="stat-value" style={{ fontSize: '1.4rem' }}>{docsRejected}</div>
            <div className="stat-label">Rejeitados</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.12)', color: 'var(--accent-500)' }}>📋</div>
          <div>
            <div className="stat-value" style={{ fontSize: '1.4rem' }}>{docsMissing.length}</div>
            <div className="stat-label">Faltantes</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button className={`tab ${activeTab === 'dados' ? 'active' : ''}`} onClick={() => setActiveTab('dados')}>
          📋 Dados do Candidato
        </button>
        <button className={`tab ${activeTab === 'documentos' ? 'active' : ''}`} onClick={() => setActiveTab('documentos')}>
          📄 Documentos ({docsUploaded})
        </button>
        <button className={`tab ${activeTab === 'validacao' ? 'active' : ''}`} onClick={() => setActiveTab('validacao')}>
          🤖 Validação IA
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'dados' && (
        <div className="animate-slideUp">
          {/* Personal Info */}
          <div className="detail-section">
            <h3 className="detail-section-title">👤 Dados Pessoais</h3>
            <div className="detail-grid">
              <div className="detail-item">
                <span className="detail-label">Nome Completo</span>
                <span className="detail-value">{candidate.nome}</span>
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
                <span className="detail-label">Email</span>
                <span className="detail-value">{candidate.email || '—'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Data de Nascimento</span>
                <span className="detail-value">
                  {candidate.dataNascimento
                    ? new Date(candidate.dataNascimento + 'T12:00:00').toLocaleDateString('pt-BR')
                    : '—'}
                </span>
              </div>
            </div>
          </div>

          {/* Form Answers */}
          {candidate.formAnswers ? (
            <div className="detail-section">
              <h3 className="detail-section-title">📝 Respostas da Ficha Pré-Cadastral</h3>
              <div className="detail-grid">
                {Object.entries(candidate.formAnswers)
                  .filter(([key]) => key !== 'narrativaAtividade')
                  .map(([key, value]) => (
                    <div className="detail-item" key={key}>
                      <span className="detail-label">{FORM_ANSWER_LABELS[key] || key}</span>
                      <span className="detail-value">{formatValue(value)}</span>
                    </div>
                  ))}
              </div>

              {/* Alerts */}
              {candidate.formAnswers.possuiImovel && (
                <div className="alert alert-warning" style={{ marginTop: '16px' }}>
                  <span className="alert-icon">⚠️</span>
                  <div>
                    <strong>Atenção:</strong> Candidato declarou possuir imóvel. Isso pode inviabilizar o acesso ao programa.
                  </div>
                </div>
              )}
              {candidate.formAnswers.recebeuBeneficioHabitacional && candidate.formAnswers.dataBeneficio && (
                <div className="alert alert-error" style={{ marginTop: '16px' }}>
                  <span className="alert-icon">🚫</span>
                  <div>
                    <strong>Subsídio Bloqueado:</strong> Candidato recebeu benefício habitacional em{' '}
                    {new Date(candidate.formAnswers.dataBeneficio + 'T12:00:00').toLocaleDateString('pt-BR')}.
                    {new Date(candidate.formAnswers.dataBeneficio) > new Date('2005-05-16')
                      ? ' Após 16/05/2005 — subsídio bloqueado.'
                      : ' Antes de 16/05/2005 — elegível.'}
                  </div>
                </div>
              )}
              {candidate.formAnswers.tipoRenda === 'sem_renda' && (
                <div className="alert alert-error" style={{ marginTop: '16px' }}>
                  <span className="alert-icon">💰</span>
                  <div>
                    <strong>Sem Renda Comprovável:</strong> Candidato declarou não possuir renda. Este é o ÚNICO motivo de reprovação definitiva.
                  </div>
                </div>
              )}

              {/* Narrative */}
              <div style={{ marginTop: '24px' }}>
                <h3 className="detail-section-title">📖 Narrativa sobre Atividade e Renda</h3>
                <div
                  className="card"
                  style={{
                    background: 'rgba(59, 130, 246, 0.05)',
                    borderColor: 'rgba(59, 130, 246, 0.15)',
                  }}
                >
                  <p style={{ fontSize: '0.9rem', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                    {candidate.formAnswers.narrativaAtividade || '(Nenhuma narrativa fornecida)'}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="alert alert-warning">
              <span className="alert-icon">📋</span>
              <div>Ficha pré-cadastral ainda não foi preenchida por este candidato.</div>
            </div>
          )}

          {/* Analyst observations */}
          <div className="detail-section">
            <h3 className="detail-section-title">🗒️ Observações do Analista</h3>
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
                {saving ? 'Salvando...' : '💾 Salvar Observações'}
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
              <span className="alert-icon">📋</span>
              <div>
                <strong>Documentos faltantes ({docsMissing.length}):</strong>{' '}
                {docsMissing.map((dt) => DOCUMENT_LABELS[dt]).join(', ')}
              </div>
            </div>
          )}

          {/* Document grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '16px' }}>
            {candidate.requiredDocuments.map((docType: DocumentType) => {
              const doc = candidate.documents.find((d) => d.type === docType);
              const statusColorMap: Record<string, string> = {
                pendente: 'var(--text-muted)',
                enviado: 'var(--primary-400)',
                validando: 'var(--accent-500)',
                aprovado: 'var(--success-500)',
                rejeitado: 'var(--danger-500)',
                alerta: 'var(--accent-400)',
              };

              return (
                <div
                  key={docType}
                  className="doc-card"
                  style={{
                    borderLeftWidth: '3px',
                    borderLeftColor: doc ? statusColorMap[doc.status] : 'var(--border-default)',
                  }}
                >
                  <div className="doc-card-header">
                    <span className="doc-card-title">{DOCUMENT_LABELS[docType]}</span>
                    {doc ? (
                      <span
                        className="doc-card-status"
                        style={{ color: statusColorMap[doc.status], fontWeight: 600 }}
                      >
                        {doc.status === 'aprovado' && '✅ Aprovado'}
                        {doc.status === 'rejeitado' && '❌ Rejeitado'}
                        {doc.status === 'enviado' && '📤 Enviado'}
                        {doc.status === 'validando' && '⏳ Validando'}
                        {doc.status === 'alerta' && '⚠️ Alerta'}
                        {doc.status === 'pendente' && '⏸ Pendente'}
                      </span>
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        ❌ Não enviado
                      </span>
                    )}
                  </div>

                  {doc ? (
                    <div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                        📎 {doc.fileName} • {(doc.fileSize / 1024).toFixed(0)} KB
                      </div>

                      {doc.validation && (
                        <div style={{ marginBottom: '12px' }}>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                            Confiança da IA
                          </div>
                          <ConfidenceMeter value={doc.validation.confidence} />

                          {doc.validation.issues.length > 0 && (
                            <div style={{ marginTop: '8px' }}>
                              {doc.validation.issues.map((issue, i) => (
                                <div
                                  key={i}
                                  style={{
                                    fontSize: '0.78rem',
                                    color: doc.validation!.isValid ? 'var(--accent-400)' : 'var(--danger-500)',
                                    display: 'flex',
                                    gap: '6px',
                                    marginTop: '4px',
                                  }}
                                >
                                  <span>{doc.validation!.isValid ? '⚠️' : '❌'}</span>
                                  <span>{issue}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      <div className="flex gap-2" style={{ marginTop: '8px' }}>
                        <button
                          className="btn btn-success btn-sm"
                          onClick={() => handleDocAction(doc, 'aprovado')}
                          disabled={doc.status === 'aprovado'}
                        >
                          ✅ Aprovar
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDocAction(doc, 'rejeitado')}
                          disabled={doc.status === 'rejeitado'}
                        >
                          ❌ Rejeitar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                      Aguardando envio pelo candidato.
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
            <span className="alert-icon">🤖</span>
            <div>
              A validação por IA analisa automaticamente a qualidade da imagem, extrai dados via OCR e verifica prazos de validade.
              <br />
              <strong>Nível de confiança:</strong> acima de 90% = alta confiança, 75-90% = média, abaixo de 75% = requer revisão manual.
            </div>
          </div>

          {candidate.documents.filter((d) => d.validation).length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🤖</div>
              <div className="empty-state-title">Nenhuma validação disponível</div>
              <div className="empty-state-text">
                As validações aparecem aqui após o candidato enviar os documentos.
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {candidate.documents
                .filter((d) => d.validation)
                .map((doc) => (
                  <div key={doc.id} className="card">
                    <div className="flex items-center justify-between" style={{ marginBottom: '16px' }}>
                      <div>
                        <h4 style={{ fontWeight: 600, fontSize: '0.95rem' }}>
                          {DOCUMENT_LABELS[doc.type]}
                        </h4>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          {doc.fileName}
                        </span>
                      </div>
                      <div
                        style={{
                          padding: '4px 12px',
                          borderRadius: '999px',
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          background: doc.validation!.isValid
                            ? 'rgba(16, 185, 129, 0.12)'
                            : 'rgba(239, 68, 68, 0.12)',
                          color: doc.validation!.isValid ? 'var(--success-500)' : 'var(--danger-500)',
                        }}
                      >
                        {doc.validation!.isValid ? '✅ Válido' : '❌ Inválido'}
                      </div>
                    </div>

                    <div className="detail-grid" style={{ marginBottom: '16px' }}>
                      <div className="detail-item">
                        <span className="detail-label">Confiança OCR</span>
                        <ConfidenceMeter value={doc.validation!.confidence} />
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Qualidade da Imagem</span>
                        <ConfidenceMeter value={doc.validation!.qualityScore} />
                      </div>
                    </div>

                    {/* Extracted data */}
                    {Object.keys(doc.validation!.extractedData).length > 0 && (
                      <div style={{ marginBottom: '12px' }}>
                        <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          Dados Extraídos por OCR
                        </div>
                        <div className="detail-grid">
                          {Object.entries(doc.validation!.extractedData).map(([k, v]) => (
                            <div className="detail-item" key={k}>
                              <span className="detail-label">{k.replace(/_/g, ' ')}</span>
                              <span className="detail-value" style={{ fontSize: '0.85rem' }}>{v}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Expiry check */}
                    {doc.validation!.expiryCheck && (
                      <div
                        className={`alert ${doc.validation!.expiryCheck.isExpired ? 'alert-error' : 'alert-success'}`}
                        style={{ marginTop: '8px' }}
                      >
                        <span className="alert-icon">
                          {doc.validation!.expiryCheck.isExpired ? '⏰' : '✅'}
                        </span>
                        <span>{doc.validation!.expiryCheck.message}</span>
                      </div>
                    )}

                    {/* Issues */}
                    {doc.validation!.issues.length > 0 && (
                      <div style={{ marginTop: '8px' }}>
                        {doc.validation!.issues.map((issue, i) => (
                          <div
                            key={i}
                            className="alert alert-warning"
                            style={{ marginTop: '4px', padding: '8px 12px', fontSize: '0.82rem' }}
                          >
                            <span className="alert-icon" style={{ fontSize: '0.9rem' }}>⚠️</span>
                            <span>{issue}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
