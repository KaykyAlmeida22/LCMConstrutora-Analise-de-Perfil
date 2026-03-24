import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { db } from '../../services/mockDatabase';
import { validateDocument } from '../../services/aiValidation';
import { DOCUMENT_LABELS } from '../../types';
import type { Candidate, DocumentType, CandidateDocument } from '../../types';
import ConfidenceMeter from '../../components/shared/ConfidenceMeter';
import LoadingSpinner from '../../components/shared/LoadingSpinner';

export default function Upload() {
  const [searchParams] = useSearchParams();
  const candidateId = searchParams.get('id') || '';
  const navigate = useNavigate();

  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [loading, setLoading] = useState(true);
  const [validatingDoc, setValidatingDoc] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedDocType, setSelectedDocType] = useState<DocumentType | null>(null);
  const [_dragOver, _setDragOver] = useState(false);

  useEffect(() => {
    loadCandidate();
  }, [candidateId]);

  async function loadCandidate() {
    if (!candidateId) return;
    setLoading(true);
    const c = await db.getCandidate(candidateId);
    setCandidate(c || null);
    setLoading(false);
  }

  function handleUploadClick(docType: DocumentType) {
    setSelectedDocType(docType);
    fileInputRef.current?.click();
  }

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !selectedDocType || !candidate) return;

    // Check file type
    const allowed = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!allowed.includes(file.type)) {
      alert('Tipo de arquivo não aceito. Envie PDF, JPEG ou PNG.');
      return;
    }

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('Arquivo muito grande. O tamanho máximo é 10MB.');
      return;
    }

    const docId = `doc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const fileUrl = URL.createObjectURL(file);

    const newDoc: CandidateDocument = {
      id: docId,
      candidateId: candidate.id,
      type: selectedDocType,
      status: 'validando',
      fileName: file.name,
      fileUrl,
      fileSize: file.size,
      uploadedAt: new Date().toISOString(),
    };

    await db.addDocument(candidate.id, newDoc);
    await loadCandidate();

    // Run AI validation
    setValidatingDoc(docId);
    try {
      const result = await validateDocument(docId, selectedDocType, fileUrl);
      await db.updateDocument(candidate.id, docId, {
        status: result.isValid ? 'enviado' : 'rejeitado',
        validation: result,
      });
    } catch {
      await db.updateDocument(candidate.id, docId, { status: 'enviado' });
    }
    setValidatingDoc(null);
    await loadCandidate();

    // Reset
    if (fileInputRef.current) fileInputRef.current.value = '';
    setSelectedDocType(null);
  }

  if (loading) return <LoadingSpinner size="lg" />;
  if (!candidate) {
    return (
      <div className="empty-state" style={{ minHeight: '100vh' }}>
        <div className="empty-state-icon">❌</div>
        <div className="empty-state-title">Candidato não encontrado</div>
        <button className="btn btn-primary" onClick={() => navigate('/')}>
          Voltar ao Início
        </button>
      </div>
    );
  }

  const uploadedTypes = candidate.documents.map((d) => d.type);
  const missingDocs = candidate.requiredDocuments.filter((dt) => !uploadedTypes.includes(dt));
  const sentDocs = candidate.documents;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', padding: '24px' }}>
      <div style={{ maxWidth: '780px', margin: '0 auto' }}>
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          style={{ display: 'none' }}
          onChange={handleFileSelected}
        />

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: '12px',
              background: 'linear-gradient(135deg, var(--primary-500), var(--primary-700))',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.3rem',
              fontWeight: 800,
              color: 'white',
              marginBottom: '16px',
              boxShadow: '0 4px 16px rgba(59, 130, 246, 0.3)',
            }}
          >
            LCM
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '4px' }}>
            Envio de Documentos
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            {candidate.nome} — CPF: {candidate.cpf}
          </p>
        </div>

        {/* Progress */}
        <div className="card" style={{ marginBottom: '24px', background: 'rgba(59, 130, 246, 0.06)', borderColor: 'rgba(59, 130, 246, 0.15)' }}>
          <div className="flex justify-between items-center" style={{ marginBottom: '8px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>
              📄 Progresso dos Documentos
            </span>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary-400)' }}>
              {sentDocs.length}/{candidate.requiredDocuments.length}
            </span>
          </div>
          <div
            style={{
              width: '100%',
              height: '8px',
              background: 'var(--bg-tertiary)',
              borderRadius: '999px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${candidate.requiredDocuments.length > 0 ? (sentDocs.length / candidate.requiredDocuments.length) * 100 : 0}%`,
                height: '100%',
                background: 'linear-gradient(90deg, var(--primary-600), var(--success-500))',
                borderRadius: '999px',
                transition: 'width 0.5s ease',
              }}
            />
          </div>
          {missingDocs.length > 0 && (
            <div style={{ marginTop: '12px', fontSize: '0.82rem', color: 'var(--accent-400)' }}>
              ⚠️ Faltam {missingDocs.length} documento(s) para completar o envio.
            </div>
          )}
        </div>

        {/* Photo Tips */}
        <div className="photo-tips" style={{ marginBottom: '24px' }}>
          <div className="photo-tips-title">📸 Dicas para uma boa foto do documento</div>
          <ul className="photo-tips-list">
            <li>Coloque o documento sobre uma superfície plana e escura</li>
            <li>Tire a foto com boa iluminação, sem sombras</li>
            <li>Enquadre todo o documento na tela, sem cortar bordas</li>
            <li>Evite reflexos e brilho (não use flash)</li>
            <li>A foto deve estar nítida e legível</li>
            <li>Formatos aceitos: PDF, JPEG ou PNG (máx. 10MB)</li>
          </ul>
        </div>

        {/* Missing documents to upload */}
        {missingDocs.length > 0 && (
          <div style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px' }}>
              📋 Documentos Pendentes
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {missingDocs.map((docType) => (
                <div
                  key={docType}
                  className="card"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '16px 20px',
                    cursor: 'pointer',
                  }}
                  onClick={() => handleUploadClick(docType)}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                      {DOCUMENT_LABELS[docType]}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      Clique para enviar
                    </div>
                  </div>
                  <button className="btn btn-primary btn-sm">
                    📤 Enviar
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sent documents */}
        {sentDocs.length > 0 && (
          <div style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px' }}>
              ✅ Documentos Enviados
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {sentDocs.map((doc) => (
                <div
                  key={doc.id}
                  className="card"
                  style={{
                    borderLeftWidth: '3px',
                    borderLeftColor:
                      doc.status === 'aprovado' ? 'var(--success-500)' :
                      doc.status === 'rejeitado' ? 'var(--danger-500)' :
                      doc.status === 'validando' ? 'var(--accent-500)' :
                      'var(--primary-500)',
                  }}
                >
                  <div className="flex items-center justify-between" style={{ marginBottom: '8px' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                      {DOCUMENT_LABELS[doc.type]}
                    </div>
                    <span
                      style={{
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        color:
                          doc.status === 'aprovado' ? 'var(--success-500)' :
                          doc.status === 'rejeitado' ? 'var(--danger-500)' :
                          doc.status === 'validando' ? 'var(--accent-500)' :
                          'var(--primary-400)',
                      }}
                    >
                      {doc.status === 'validando' && '⏳ Validando...'}
                      {doc.status === 'enviado' && '📤 Enviado'}
                      {doc.status === 'aprovado' && '✅ Aprovado'}
                      {doc.status === 'rejeitado' && '❌ Rejeitado — Reenvie'}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    📎 {doc.fileName} • {(doc.fileSize / 1024).toFixed(0)} KB
                  </div>

                  {validatingDoc === doc.id && (
                    <div className="flex items-center gap-2" style={{ marginTop: '12px' }}>
                      <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                      <span style={{ fontSize: '0.82rem', color: 'var(--accent-500)' }}>
                        Analisando documento com IA...
                      </span>
                    </div>
                  )}

                  {doc.validation && (
                    <div style={{ marginTop: '12px' }}>
                      <div style={{ marginBottom: '8px' }}>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          Confiança da análise:
                        </span>
                        <ConfidenceMeter value={doc.validation.confidence} size="sm" />
                      </div>

                      {doc.validation.issues.length > 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {doc.validation.issues.map((issue, i) => (
                            <div
                              key={i}
                              className="alert alert-warning"
                              style={{ padding: '8px 12px', fontSize: '0.78rem' }}
                            >
                              <span className="alert-icon" style={{ fontSize: '0.85rem' }}>⚠️</span>
                              <span>{issue}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {doc.status === 'rejeitado' && (
                        <button
                          className="btn btn-outline btn-sm"
                          style={{ marginTop: '12px' }}
                          onClick={() => handleUploadClick(doc.type)}
                        >
                          🔄 Reenviar documento
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All done */}
        {missingDocs.length === 0 && sentDocs.length > 0 && (
          <div className="card" style={{ textAlign: 'center', background: 'rgba(16, 185, 129, 0.06)', borderColor: 'rgba(16, 185, 129, 0.2)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🎉</div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '4px' }}>
              Todos os documentos foram enviados!
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '20px' }}>
              Agora é só aguardar a análise da equipe LCM Construtora. Entraremos em contato em breve.
            </p>
            <button className="btn btn-primary" onClick={() => navigate('/')}>
              Voltar ao Início
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
