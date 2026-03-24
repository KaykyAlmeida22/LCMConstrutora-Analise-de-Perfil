import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { validateDocument } from '../../services/aiValidation';
import { getRequiredDocuments, getDocumentName } from '../../services/documentRules';
import type { Candidate, DocumentType, Document } from '../../types';
import ConfidenceMeter from '../../components/shared/ConfidenceMeter';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import { 
  Building2, XCircle, FileText, Camera, UploadCloud, 
  CheckCircle, Paperclip, RefreshCw, PartyPopper 
} from 'lucide-react';

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

      // NEW: Check if all documents are uploaded after this one
      // We need to fetch FRESH data because loadCandidate is async
      const freshCandidate = await api.getCandidate(candidate.id);
      if (freshCandidate) {
        const docs = freshCandidate.documentos || [];
        const _freshFichas = Array.isArray(freshCandidate.fichas_cadastrais) 
            ? freshCandidate.fichas_cadastrais[0] 
            : freshCandidate.fichas_cadastrais;
        const reqs = _freshFichas ? getRequiredDocuments(_freshFichas) : [];
        const uploadedTypes = docs.map(d => d.tipo_documento);
        const isComplete = reqs.every(rt => uploadedTypes.includes(rt));

        if (isComplete && reqs.length > 0 && freshCandidate.status === 'documentacao_pendente') {
          await api.updateStatus(candidate.id, 'em_analise', undefined, 'Todos os documentos obrigatórios foram enviados pelo candidato.');
          await loadCandidate();
        }
      }
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
      <div className="empty-state" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', background: 'var(--bg-primary)' }}>
        <div style={{ color: 'var(--text-muted)', marginBottom: '16px', display: 'flex', justifyContent: 'center' }}>
          <XCircle size={48} strokeWidth={1} />
        </div>
        <div className="empty-state-title">Candidato não encontrado</div>
        <button className="btn btn-primary" onClick={() => navigate('/')} style={{ marginTop: '24px' }}>
          Voltar ao Início
        </button>
      </div>
    );
  }

  const documentos = candidate.documentos || [];
  const _fichas = Array.isArray(candidate.fichas_cadastrais) 
      ? candidate.fichas_cadastrais[0] 
      : candidate.fichas_cadastrais;
      
  const reqList = _fichas ? getRequiredDocuments(_fichas) : [];
  
  const uploadedTypes = documentos.map((d) => d.tipo_documento);
  const missingDocs = reqList.filter((dt) => !uploadedTypes.includes(dt));

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', padding: '32px 24px', position: 'relative', overflow: 'hidden' }}>
      
      {/* Background Glow */}
      <div style={{
         position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: '100vw', height: '40vh',
         background: 'radial-gradient(ellipse at top, rgba(59, 130, 246, 0.1) 0%, rgba(0,0,0,0) 70%)',
         zIndex: 0, pointerEvents: 'none'
      }} />

      <div style={{ maxWidth: '780px', margin: '0 auto', position: 'relative', zIndex: 10 }}>
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          style={{ display: 'none' }}
          onChange={handleFileSelected}
        />

        {/* Header */}
        <div className="animate-slideDown" style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: '16px',
              background: 'linear-gradient(135deg, var(--primary-600), var(--primary-800))',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              marginBottom: '20px',
              boxShadow: '0 8px 32px rgba(59, 130, 246, 0.4), inset 0 1px 1px rgba(255,255,255,0.2)',
              border: '1px solid rgba(255,255,255,0.1)'
            }}
          >
            <Building2 size={28} strokeWidth={1.5} />
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '8px', letterSpacing: '-0.02em' }}>
            Envio de Documentos
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            <strong>{candidate.nome_completo}</strong> — CPF: {candidate.cpf}
          </p>
        </div>

        {/* Progress */}
        <div className="card animate-slideUp" style={{ marginBottom: '24px', background: 'rgba(59, 130, 246, 0.05)', borderColor: 'rgba(59, 130, 246, 0.15)' }}>
          <div className="flex justify-between items-center" style={{ marginBottom: '12px' }}>
            <span className="flex items-center gap-2" style={{ fontSize: '0.9rem', fontWeight: 600 }}>
              <FileText size={18} className="text-primary-400" /> Progresso dos Documentos
            </span>
            <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--primary-400)' }}>
              {documentos.length}/{reqList.length}
            </span>
          </div>
          <div
            style={{
              width: '100%',
              height: '6px',
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
                transition: 'width 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
              }}
            />
          </div>
        </div>

        {/* Photo Tips */}
        <div className="photo-tips animate-slideUp" style={{ marginBottom: '32px' }}>
          <div className="photo-tips-title flex items-center gap-2">
            <Camera size={18} /> Dicas para uma boa foto do documento
          </div>
          <ul className="photo-tips-list" style={{ fontSize: '0.88rem', lineHeight: 1.6 }}>
            <li>Coloque o documento sobre uma superfície plana e escura</li>
            <li>Tire a foto com boa iluminação, sem sombras</li>
            <li>Enquadre todo o documento na tela, sem cortar bordas</li>
            <li>Evite reflexos e brilho (não use flash)</li>
          </ul>
        </div>

        {/* Pending documents to upload */}
        {missingDocs.length > 0 && (
          <div className="animate-slideUp" style={{ marginBottom: '32px' }}>
            <h2 className="flex items-center gap-2" style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '20px' }}>
              <FileText size={20} className="text-primary-400" /> Documentos Pendentes
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
                      <button className="btn btn-primary btn-sm flex items-center justify-center p-2"><UploadCloud size={16} /></button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sent documents */}
        {documentos.length > 0 && (
          <div className="animate-slideUp" style={{ marginBottom: '32px' }}>
            <h2 className="flex items-center gap-2" style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '20px' }}>
              <CheckCircle size={20} className="text-success-500" /> Documentos Enviados
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
                        display: 'flex', alignItems: 'center', gap: '4px',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        color:
                          doc.status_upload === 'Aprovado' ? 'var(--success-500)' :
                          doc.status_upload === 'Rejeitado' ? 'var(--danger-500)' :
                          'var(--primary-400)',
                      }}
                    >
                      {doc.status_upload === 'Enviado' && <><UploadCloud size={14} /> Enviado</>}
                      {doc.status_upload === 'Aprovado' && <><CheckCircle size={14} /> Aprovado</>}
                      {doc.status_upload === 'Rejeitado' && <><XCircle size={14} /> Rejeitado — Reenvie</>}
                    </span>
                  </div>

                  <div className="flex items-center gap-2" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    <Paperclip size={14} /> {doc.arquivo_original_nome || 'Arquivo'} 
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
                          className="btn btn-outline btn-sm flex items-center gap-2"
                          style={{ marginTop: '8px' }}
                          onClick={() => handleUploadClick(doc.tipo_documento as DocumentType)}
                        >
                          <RefreshCw size={14} /> Reenviar documento
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
          <div className="card animate-slideUp" style={{ textAlign: 'center', background: 'rgba(16, 185, 129, 0.06)', borderColor: 'rgba(16, 185, 129, 0.2)' }}>
            <div style={{ color: 'var(--success-500)', marginBottom: '16px', display: 'flex', justifyContent: 'center' }}>
              <PartyPopper size={48} strokeWidth={1.5} />
            </div>
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
