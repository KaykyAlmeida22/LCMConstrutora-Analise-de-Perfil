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
  CheckCircle, Paperclip, RefreshCw, PartyPopper,
  ShieldCheck, AlertCircle
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

    const allowed = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!allowed.includes(file.type)) {
      alert('Tipo de arquivo não aceito. Envie PDF, JPEG ou PNG.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Arquivo muito grande. O tamanho máximo é 5MB.');
      return;
    }

    setUploadingDocType(selectedDocType);
    
    try {
      const isPdf = file.type === 'application/pdf';

      let fileToUpload: File | Blob;
      let imageDataUrl: string;

      if (isPdf) {
        fileToUpload = file;
        imageDataUrl = await pdfToImage(file);
      } else {
        const pdfBlob = await imageToPdf(file);
        fileToUpload = new File([pdfBlob], file.name.replace(/\.[^/.]+$/, "") + ".pdf", { type: 'application/pdf' });
        imageDataUrl = await fileToBase64(file);
      }

      const storagePath = `${selectedDocType}_${Date.now()}.pdf`;
      const publicUrl = await api.uploadFile(candidate.id, fileToUpload as File, storagePath);

      if (!publicUrl) {
          throw new Error('Falha no upload do arquivo');
      }

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
        motivo_rejeicao: '',
      };

      let currentDoc: Document | undefined;

      if (existingDoc?.id) {
        currentDoc = await api.updateDocument(existingDoc.id, docData);
      } else {
        currentDoc = await api.addDocument(docData);
      }

      if (currentDoc && currentDoc.id) {
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
      <div className="empty-state" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', background: 'var(--bg-secondary)' }}>
        <XCircle size={40} strokeWidth={1.5} style={{ color: 'var(--gray-400)', marginBottom: '12px' }} />
        <div className="empty-state-title">Candidato não encontrado</div>
        <button className="btn btn-primary" onClick={() => navigate('/')} style={{ marginTop: '16px' }}>
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
  const progressPercent = reqList.length > 0 ? (documentos.length / reqList.length) * 100 : 0;

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      background: '#ffffff',
    }}>

      {/* Left Side — Progress Panel */}
      <div style={{
        width: '320px',
        minHeight: '100vh',
        background: '#111827',
        padding: '40px 32px',
        display: 'none',
        flexDirection: 'column',
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
        zIndex: 10,
        overflowY: 'auto',
      }}
        className="upload-sidebar"
      >
        <img src="/logo.png" alt="LCM" style={{ height: '32px', objectFit: 'contain', marginBottom: '48px', alignSelf: 'flex-start' }} />
        
        <div style={{ flex: 1 }}>
          <h2 style={{ color: '#ffffff', fontSize: '1.125rem', fontWeight: 800, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={20} style={{ color: 'var(--primary-500)' }} />
            Documentos
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {reqList.map((docType) => {
              const doc = documentos.find(d => d.tipo_documento === docType);
              const isUploaded = !!doc;
              const isRejected = doc?.status_upload === 'Rejeitado';
              
              return (
                <div key={docType} style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '12px', 
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  background: isUploaded ? (isRejected ? 'rgba(239, 68, 68, 0.1)' : 'rgba(140, 198, 63, 0.1)') : 'rgba(255,255,255,0.03)',
                  border: '1px solid',
                  borderColor: isUploaded ? (isRejected ? 'rgba(239, 68, 68, 0.2)' : 'rgba(140, 198, 63, 0.2)') : 'rgba(255,255,255,0.05)',
                }}>
                  {isUploaded ? (
                    isRejected ? <AlertCircle size={16} style={{ color: '#ef4444' }} /> : <CheckCircle size={16} style={{ color: 'var(--primary-500)' }} />
                  ) : (
                    <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: '1.5px solid rgba(255,255,255,0.2)' }} />
                  )}
                  <span style={{ 
                    fontSize: '0.75rem', 
                    fontWeight: 500, 
                    color: isUploaded ? '#ffffff' : 'rgba(255,255,255,0.4)',
                  }}>
                    {getDocumentName(docType)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ 
          background: 'rgba(255,255,255,0.03)', 
          padding: '16px', 
          borderRadius: 'var(--radius-lg)', 
          border: '1px solid rgba(255,255,255,0.05)' 
        }}>
          <div style={{ color: 'var(--primary-400)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Camera size={14} /> Dica de Foto
          </div>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', lineHeight: 1.5 }}>
            Evite sombras e reflexos. Enquadre bem o documento para acelerar a análise.
          </p>
        </div>
      </div>

      {/* Right Side — Upload Area */}
      <div style={{
        flex: 1,
        marginLeft: '0',
        background: 'var(--bg-secondary)',
        padding: '40px 24px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
        className="upload-main-content"
      >
        {/* Mobile Header (Hidden on Desktop) */}
        <div className="upload-mobile-header" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          background: '#111827',
          padding: '16px 20px',
          display: 'none',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 100,
          boxShadow: 'var(--shadow-md)',
        }}>
          <img src="/logo.png" alt="LCM" style={{ height: '28px' }} />
        </div>

        <div style={{ width: '100%', maxWidth: '640px' }} className="upload-container">
          {/* Top Title Section */}
          <div style={{ marginBottom: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary-600)', marginBottom: '8px', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>
              <UploadCloud size={16} /> Envio de Documentação
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: '4px' }}>
               Quase lá, {candidate.nome_completo.split(' ')[0]}!
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9375rem' }}>
              Envie fotos nítidas dos seus documentos para análise de crédito.
            </p>
          </div>

          {/* Hidden input */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            style={{ display: 'none' }}
            onChange={handleFileSelected}
          />

          {/* Progress Card */}
          <div className="card" style={{ marginBottom: '24px', padding: '20px 24px', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-default)' }}>
            <div className="flex justify-between items-center" style={{ marginBottom: '12px' }}>
              <span className="flex items-center gap-2" style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Envio Completo: {documentos.length} de {reqList.length}
              </span>
              <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--primary-700)' }}>
                {Math.round(progressPercent)}%
              </span>
            </div>
            <div style={{ width: '100%', height: '6px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
              <div style={{
                width: `${progressPercent}%`,
                height: '100%',
                background: 'var(--primary-600)',
                borderRadius: 'var(--radius-full)',
                transition: 'width 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
              }} />
            </div>
          </div>

          {/* Pending Docs */}
          {missingDocs.length > 0 && (
            <div style={{ marginBottom: '32px' }}>
              <h2 style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Documentos Pendentes
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
                {missingDocs.map((docType) => (
                  <div
                    key={docType}
                    className="card hover-scale"
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      padding: '24px',
                      cursor: uploadingDocType ? 'not-allowed' : 'pointer',
                      border: '1px dashed var(--gray-300)',
                      background: 'var(--bg-primary)',
                      textAlign: 'center',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '12px',
                    }}
                    onClick={() => !uploadingDocType && handleUploadClick(docType)}
                  >
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <UploadCloud size={24} style={{ color: 'var(--gray-400)' }} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text-primary)', marginBottom: '4px' }}>
                        {getDocumentName(docType)}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Clique para enviar
                      </div>
                    </div>
                    {uploadingDocType === docType && (
                      <div style={{ marginTop: '4px' }}>
                        <div className="spinner-sm" />
                       </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sent Docs */}
          {documentos.length > 0 && (
            <div style={{ marginBottom: '32px' }}>
              <h2 style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Enviados
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {documentos.map((doc) => {
                  const isRejected = doc.status_upload === 'Rejeitado';
                  const isAproved = doc.status_upload === 'Aprovado';
                  
                  return (
                    <div
                      key={doc.id}
                      className="card animate-fadeIn"
                      style={{
                        padding: '20px 24px',
                        border: '1px solid var(--border-default)',
                        borderLeft: `4px solid ${isRejected ? '#ef4444' : isAproved ? 'var(--success-500)' : 'var(--primary-500)'}`,
                        boxShadow: 'var(--shadow-sm)',
                      }}
                    >
                      <div className="flex items-center justify-between" style={{ marginBottom: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ 
                            width: '36px', 
                            height: '36px', 
                            borderRadius: '8px', 
                            background: isRejected ? 'rgba(239, 68, 68, 0.1)' : 'rgba(140, 198, 63, 0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}>
                            <FileText size={18} style={{ color: isRejected ? '#ef4444' : 'var(--primary-600)' }} />
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text-primary)' }}>
                              {getDocumentName(doc.tipo_documento as DocumentType)}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                               <Paperclip size={10} /> {doc.arquivo_original_nome || 'Arquivo enviado'}
                            </div>
                          </div>
                        </div>
                        
                        <div style={{
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '6px',
                          padding: '6px 12px',
                          borderRadius: 'var(--radius-full)',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          background: isRejected ? '#fef2f2' : isAproved ? '#f0fdf4' : 'rgba(140, 198, 63, 0.08)',
                          color: isRejected ? '#991b1b' : isAproved ? '#166534' : 'var(--primary-700)',
                        }}>
                          {isAproved ? <CheckCircle size={14} /> : isRejected ? <XCircle size={14} /> : <div className="spinner-sm" style={{ width: '12px', height: '12px' }} />}
                          {doc.status_upload === 'Enviado' ? 'Em Análise' : doc.status_upload}
                        </div>
                      </div>

                      {isRejected && (
                        <div style={{ 
                          background: '#fff1f2', 
                          padding: '16px', 
                          borderRadius: 'var(--radius-md)', 
                          border: '1px solid #fee2e2',
                          marginTop: '8px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '8px'
                        }}>
                           <div style={{ color: '#991b1b', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <AlertCircle size={16} /> <strong>Problema identificado:</strong>
                           </div>
                           <ul style={{ margin: 0, paddingLeft: '24px', fontSize: '0.8rem', color: '#b91c1c' }}>
                              {doc.alertas_ia?.issues?.map((issue: string, idx: number) => (
                                <li key={idx} style={{ marginBottom: '4px' }}>{issue}</li>
                              )) || <li>O arquivo não atende aos requisitos de qualidade.</li>}
                           </ul>
                           <button
                             className="btn btn-primary btn-sm"
                             onClick={() => handleUploadClick(doc.tipo_documento as DocumentType)}
                             style={{ alignSelf: 'flex-start', background: '#e11d48', borderColor: '#e11d48', height: '32px', fontSize: '0.75rem' }}
                           >
                             <RefreshCw size={12} /> Tentar Reenviar
                           </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Success State */}
          {missingDocs.length === 0 && documentos.length > 0 && (
            <div className="card animate-slideUp" style={{ 
              textAlign: 'center', 
              borderColor: 'var(--success-200)', 
              background: 'var(--success-50)', 
              padding: '40px 32px',
              boxShadow: 'var(--shadow-lg)'
            }}>
              <div style={{ 
                color: 'var(--success-500)', 
                marginBottom: '20px', 
                display: 'inline-flex',
                background: '#ffffff',
                padding: '16px',
                borderRadius: '50%',
                boxShadow: 'var(--shadow-md)'
              }}>
                <PartyPopper size={48} strokeWidth={1.5} />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#166534', marginBottom: '8px' }}>
                🎉 Tudo certo!
              </h3>
              <p style={{ color: '#14532d', fontSize: '0.9375rem', marginBottom: '24px' }}>
                Recebemos todos os seus documentos. Nossa equipe agora irá realizar a análise técnica.
              </p>
              <button 
                className="btn btn-primary" 
                onClick={() => navigate('/')}
                style={{ borderRadius: 'var(--radius-full)', minWidth: '200px', height: '48px' }}
              >
                Voltar à Página Inicial
              </button>
            </div>
          )}

          <div style={{ marginTop: '40px', textAlign: 'center' }}>
             <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <ShieldCheck size={16} style={{ color: 'var(--primary-600)' }} /> Sua documentação está protegida em ambiente criptografado.
             </p>
          </div>
        </div>
      </div>

      {/* Responsive Styles */}
      <style>{`
        @media (min-width: 768px) {
          .upload-sidebar {
            display: flex !important;
          }
          .upload-main-content {
            margin-left: 320px !important;
          }
          .upload-mobile-header {
            display: none !important;
          }
          .upload-container {
            margin-top: 40px !important;
          }
        }
        .upload-sidebar::-webkit-scrollbar {
          width: 4px;
        }
        .upload-sidebar::-webkit-scrollbar-track {
          background: rgba(255,255,255,0.02);
        }
        .upload-sidebar::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.1);
          border-radius: 10px;
        }
        .upload-sidebar::-webkit-scrollbar-thumb:hover {
          background: rgba(255,255,255,0.2);
        }
        @media (max-width: 767px) {
          .upload-sidebar {
            display: none !important;
          }
          .upload-main-content {
            margin-left: 0 !important;
            padding-top: 80px !important;
          }
          .upload-mobile-header {
            display: flex !important;
          }
          .upload-container {
            margin-top: 0 !important;
          }
        }
        .hover-scale {
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .hover-scale:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
          border-color: var(--primary-400) !important;
        }
      `}</style>
    </div>
  );
}
