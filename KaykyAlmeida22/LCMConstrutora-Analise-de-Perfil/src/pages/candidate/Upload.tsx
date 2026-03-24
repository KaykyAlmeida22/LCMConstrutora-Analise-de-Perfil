import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { validateDocument } from '../../services/aiValidation';
import { getRequiredDocuments, getDocumentName } from '../../services/documentRules';
import type { Candidate, DocumentType, Document } from '../../types';
import ConfidenceMeter from '../../components/shared/ConfidenceMeter';
import LoadingSpinner from '../../components/shared/LoadingSpinner';

export default function Upload() {
  const [searchParams] = useSearchParams();
  const candidateId = searchParams.get('id') || '';
  const navigate = useNavigate();

  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploadingDocType, setUploadingDocType] = useState<DocumentType | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedDocType, setSelectedDocType] = useState<DocumentType | null>(null);

  useEffect(() => {
    loadCandidate();
  }, [candidateId]);

  async function loadCandidate() {
    if (!candidateId) return;
    setLoading(true);
    const c = await api.getCandidate(candidateId);
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

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Arquivo muito grande. O tamanho máximo é 5MB.');
      return;
    }

    setUploadingDocType(selectedDocType);
    
    try {
      // 1. Upload to Storage
      const extension = file.name.split('.').pop() || 'pdf';
      const storagePath = `${selectedDocType}_${Date.now()}.${extension}`;
      const publicUrl = await api.uploadFile(candidate.id, file, storagePath);

      if (!publicUrl) {
          throw new Error('Falha no upload do arquivo');
      }

      // 2. Create entry in Database
      const newDoc: Partial<Document> = {
        candidato_id: candidate.id,
        tipo_documento: selectedDocType,
        arquivo_url: publicUrl,
        arquivo_original_nome: file.name,
        formato_original: file.type,
        status_upload: 'Enviado',
        status_ia: 'Pendente',
        aprovado_pelo_analista: false,
      };

      const createdDoc = await api.addDocument(newDoc);

      if (createdDoc && createdDoc.id) {
          // 3. Trigger IA Validation (Simulation)
          // Em produção, isso seria um webhook ou edge function.
          const iaResult = await validateDocument(createdDoc.id, selectedDocType, publicUrl);
          
          await api.updateDocument(createdDoc.id, {
            status_ia: iaResult.isValid ? 'Aprovado' : 'Rejeitado',
            confianca_leitura_ia: iaResult.confidence,
            alertas_ia: {
                issues: iaResult.issues,
                qualityScore: iaResult.qualityScore,
                expiryCheck: iaResult.expiryCheck
            }
          });
      }
      
      await loadCandidate();
    } catch (err) {
      console.error(err);
      alert('Erro ao enviar documento. Tente novamente.');
    } finally {
      setUploadingDocType(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setSelectedDocType(null);
    }
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

  const documentos = candidate.documentos || [];
  const reqList = candidate.fichas_cadastrais ? getRequiredDocuments(candidate.fichas_cadastrais) : [];
  
  const uploadedTypes = documentos.map((d) => d.tipo_documento);
  const missingDocs = reqList.filter((dt) => !uploadedTypes.includes(dt));

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
            {candidate.nome_completo} — CPF: {candidate.cpf}
          </p>
        </div>

        {/* Progress */}
        <div className="card" style={{ marginBottom: '24px', background: 'rgba(59, 130, 246, 0.06)', borderColor: 'rgba(59, 130, 246, 0.15)' }}>
          <div className="flex justify-between items-center" style={{ marginBottom: '8px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>
              📄 Progresso dos Documentos
            </span>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary-400)' }}>
              {documentos.length}/{reqList.length}
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
                width: `${reqList.length > 0 ? (documentos.length / reqList.length) * 100 : 0}%`,
                height: '100%',
                background: 'linear-gradient(90deg, var(--primary-600), var(--success-500))',
                borderRadius: '999px',
                transition: 'width 0.5s ease',
              }}
            />
          </div>
        </div>

        {/* Photo Tips */}
        <div className="photo-tips" style={{ marginBottom: '24px' }}>
          <div className="photo-tips-title">📸 Dicas para uma boa foto do documento</div>
          <ul className="photo-tips-list" style={{ fontSize: '0.85rem' }}>
            <li>Coloque o documento sobre uma superfície plana e escura</li>
            <li>Tire a foto com boa iluminação, sem sombras</li>
            <li>Enquadre todo o documento na tela, sem cortar bordas</li>
            <li>Evite reflexos e brilho (não use flash)</li>
          </ul>
        </div>

        {/* Pending documents to upload */}
        {missingDocs.length > 0 && (
          <div style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px' }}>
              📋 Documentos Pendentes
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '12px' }}>
              {missingDocs.map((docType) => (
                <div
                  key={docType}
                  className="card"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '16px 20px',
                    cursor: uploadingDocType ? 'not-allowed' : 'pointer',
                    opacity: uploadingDocType ? 0.7 : 1
                  }}
                  onClick={() => !uploadingDocType && handleUploadClick(docType)}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>
                      {getDocumentName(docType)}
                    </div>
                  </div>
                  {uploadingDocType === docType ? (
                      <div className="spinner" style={{ width: 20, height: 20 }} />
                  ) : (
                      <button className="btn btn-primary btn-sm">📤</button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sent documents */}
        {documentos.length > 0 && (
          <div style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px' }}>
              ✅ Documentos Enviados
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {documentos.map((doc) => (
                <div
                  key={doc.id}
                  className="card"
                  style={{
                    borderLeftWidth: '3px',
                    borderLeftColor:
                      doc.status_upload === 'Aprovado' ? 'var(--success-500)' :
                      doc.status_upload === 'Rejeitado' ? 'var(--danger-500)' :
                      'var(--primary-500)',
                  }}
                >
                  <div className="flex items-center justify-between" style={{ marginBottom: '8px' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                      {getDocumentName(doc.tipo_documento as DocumentType)}
                    </div>
                    <span
                      style={{
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        color:
                          doc.status_upload === 'Aprovado' ? 'var(--success-500)' :
                          doc.status_upload === 'Rejeitado' ? 'var(--danger-500)' :
                          'var(--primary-400)',
                      }}
                    >
                      {doc.status_upload === 'Enviado' && '📤 Enviado'}
                      {doc.status_upload === 'Aprovado' && '✅ Aprovado'}
                      {doc.status_upload === 'Rejeitado' && '❌ Rejeitado — Reenvie'}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    📎 {doc.arquivo_original_nome || 'Arquivo'} 
                  </div>

                  {doc.status_ia !== 'Pendente' && (
                    <div style={{ marginTop: '12px' }}>
                      <div style={{ marginBottom: '8px' }}>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          IA (Confiança):
                        </span>
                        <ConfidenceMeter value={doc.confianca_leitura_ia || 0} size="sm" />
                      </div>
                      
                      {doc.status_upload === 'Rejeitado' && (
                        <button
                          className="btn btn-outline btn-sm"
                          style={{ marginTop: '8px' }}
                          onClick={() => handleUploadClick(doc.tipo_documento as DocumentType)}
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
        {missingDocs.length === 0 && documentos.length > 0 && (
          <div className="card" style={{ textAlign: 'center', background: 'rgba(16, 185, 129, 0.06)', borderColor: 'rgba(16, 185, 129, 0.2)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🎉</div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '4px' }}>
              Todos os documentos foram enviados!
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '20px' }}>
              Agora é só aguardar a análise da equipe LCM Construtora.
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
