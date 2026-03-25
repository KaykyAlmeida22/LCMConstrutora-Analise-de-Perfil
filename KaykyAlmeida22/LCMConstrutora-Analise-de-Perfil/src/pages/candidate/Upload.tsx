import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { validateDocument } from '../../services/aiValidation';
import { imageToPdf, pdfToImage, fileToBase64 } from '../../services/pdfUtils';
import { getRequiredDocuments, getDocumentName } from '../../services/documentRules';
import type { Candidate, DocumentType, Document } from '../../types';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import { 
  XCircle, FileText, Camera, UploadCloud, 
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
      const isPdf = file.type === 'application/pdf';

      // 1. Prepare the file for storage (always as PDF)
      let fileToUpload: File | Blob;
      let imageDataUrl: string;

      if (isPdf) {
        // PDF: upload original, render page 1 as image for GPT-5.4
        fileToUpload = file;
        imageDataUrl = await pdfToImage(file);
      } else {
        // Image: convert to PDF for storage, read base64 for GPT-4o
        const pdfBlob = await imageToPdf(file);
        // Important: Wrap Blob in File so it has a name and type for the uploader
        fileToUpload = new File([pdfBlob], file.name.replace(/\.[^/.]+$/, "") + ".pdf", { type: 'application/pdf' });
        imageDataUrl = await fileToBase64(file);
      }

      // 2. Upload PDF to Storage (always .pdf extension)
      const storagePath = `${selectedDocType}_${Date.now()}.pdf`;
      const publicUrl = await api.uploadFile(candidate.id, fileToUpload as File, storagePath);

      if (!publicUrl) {
          throw new Error('Falha no upload do arquivo');
      }

      // 3. Create or Update entry in Database
      const existingDoc = candidate.documentos?.find(d => d.tipo_documento === selectedDocType);
      
      const docData: Partial<Document> = {
        candidato_id: candidate.id,
        tipo_documento: selectedDocType,
        arquivo_url: publicUrl,
        arquivo_original_nome: file.name,
        formato_original: file.type,
        status_upload: 'Enviado',
        status_ia: 'Pendente',
        aprovado_pelo_analista: false,
        motivo_rejeicao: '', // Clear old rejection
      };

      let currentDoc: Document | undefined;

      if (existingDoc?.id) {
        currentDoc = await api.updateDocument(existingDoc.id, docData);
      } else {
        currentDoc = await api.addDocument(docData);
      }

      if (currentDoc && currentDoc.id) {
          // 4. Trigger IA Validation with the correct model
          const iaResult = await validateDocument(
            currentDoc.id,
            selectedDocType,
            publicUrl,
            { isPdf, imageDataUrl }
          );
          
          await api.updateDocument(currentDoc.id, {
            status_ia: iaResult.isValid ? 'Aprovado' : 'Rejeitado',
            status_upload: iaResult.isValid ? 'Enviado' : 'Rejeitado', 
            confianca_leitura_ia: iaResult.confidence,
            alertas_ia: {
                issues: iaResult.issues,
                qualityScore: iaResult.qualityScore,
                expiryCheck: iaResult.expiryCheck
            }
          });

          // Move candidate to 'aguardando_correcao' if rejected
          if (!iaResult.isValid) {
            await api.updateStatus(
              candidate.id, 
              'aguardando_correcao', 
              undefined, 
              `Documento (${getDocumentName(selectedDocType)}) rejeitado automaticamente pela IA.`
            );
          }
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
    } catch (err: any) {
      console.error('Erro detalhado no upload:', err);
      const msg = err.message || 'Erro desconhecido';
      alert(`Erro ao enviar documento: ${msg}`);
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
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', flexDirection: 'column' }}>
      
      {/* Dark Green Header Banner */}
      <div style={{
        background: '#1a2a0e',
        padding: '40px 24px 56px',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
          width: '80%', height: '100%',
          background: 'radial-gradient(ellipse at top, rgba(140,198,63,0.15) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />
        <div className="animate-slideDown" style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ marginBottom: '20px' }}>
            <img
              src="/logo.png"
              alt="LCM Construtora"
              style={{ height: '60px', objectFit: 'contain', display: 'inline-block' }}
            />
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '8px', letterSpacing: '-0.02em', color: '#ffffff' }}>
            Envio de Documentos
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.95rem', marginBottom: '4px' }}>
            Candidato(a): <strong style={{ color: '#ffffff', fontWeight: 600 }}>{candidate.nome_completo}</strong>
          </p>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>
            CPF: {candidate.cpf}
          </p>
        </div>
      </div>

      {/* Content Area */}
      <div style={{ flex: 1, padding: '0 24px 40px', marginTop: '-24px', position: 'relative', zIndex: 10 }}>
        <div style={{ maxWidth: '680px', margin: '0 auto' }}>
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            style={{ display: 'none' }}
            onChange={handleFileSelected}
          />

          {/* Progress bar */}
          <div style={{ marginBottom: '24px', background: 'var(--bg-primary)', borderRadius: '12px', padding: '16px 20px', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-default)' }}>
            <div className="flex justify-between items-center" style={{ marginBottom: '8px' }}>
              <span className="flex items-center gap-2" style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                <FileText size={18} className="text-primary-500" /> Progresso dos Documentos
              </span>
              <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--primary-600)' }}>
                {documentos.length}/{reqList.length}
              </span>
            </div>
            <div style={{ width: '100%', height: '6px', background: 'var(--border-default)', borderRadius: '999px', overflow: 'hidden' }}>
              <div style={{
                width: `${reqList.length > 0 ? (documentos.length / reqList.length) * 100 : 0}%`,
                height: '100%',
                background: 'linear-gradient(90deg, var(--primary-600), var(--primary-400))',
                borderRadius: '999px',
                transition: 'width 0.4s ease',
              }} />
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
                      
                      {/* AI Reject Reason Alert - ONLY show if the overall status is still 'Rejeitado' */}
                      {doc.status_upload === 'Rejeitado' && doc.alertas_ia?.issues && doc.alertas_ia.issues.length > 0 && (
                        <div style={{ 
                          marginBottom: '12px', 
                          padding: '10px 12px', 
                          background: 'rgba(239, 68, 68, 0.08)', 
                          border: '1px solid rgba(239, 68, 68, 0.2)', 
                          borderRadius: '8px', 
                          color: 'var(--danger-500)', 
                          fontSize: '0.82rem',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '4px'
                        }}>
                          <strong>Motivo da recusa:</strong>
                          <ul style={{ margin: 0, paddingLeft: '16px', listStyleType: 'disc' }}>
                            {doc.alertas_ia.issues.map((issue: string, idx: number) => (
                              <li key={idx}>{issue}</li>
                            ))}
                          </ul>
                          <div style={{ marginTop: '4px', fontWeight: 600 }}>Por favor, tire uma nova foto e reenvie.</div>
                        </div>
                      )}

                      {(doc.status_upload === 'Rejeitado' || doc.status_ia === 'Rejeitado') && (
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
  </div>
  );
}
