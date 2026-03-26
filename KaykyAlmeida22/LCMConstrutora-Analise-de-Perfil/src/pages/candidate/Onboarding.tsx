import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { formSteps } from '../../data/formSteps';
import { api } from '../../services/api';
import type { FormAnswers, FormStep, FormField, Dependent } from '../../types';
import { ArrowRight, ArrowLeft, Check, X, Plus, ShieldCheck, ClipboardList, Info } from 'lucide-react';
import { cpfService } from '../../services/cpfService';

const EMPTY_ANSWERS: FormAnswers = {
  nome_completo: '',
  cpf: '',
  telefone: '',
  endereco: '',
  municipio_projeto: '',
  tipo_residencia: '',
  valor_aluguel: 0,
  teve_imovel_anterior: false,
  venda_registrada_cartorio: false,
  escolaridade: '',
  estado_civil: '',
  regime_bens: '',
  data_casamento: '',
  tem_dependentes: false,
  tem_financiamento_habitacional: false,
  data_contrato_habitacional: '',
  financiamento_habitacional_pos_2005: false,
  tem_financiamento_estudantil: false,
  financiamento_estudantil_em_atraso: false,
  tem_veiculo: false,
  valor_mercado_veiculo: 0,
  veiculo_financiado: false,
  prestacao_veiculo: 0,
  parcelas_restantes_veiculo: 0,
  tem_cartao_credito: false,
  bandeira_cartao: '',
  tem_imovel: false,
  valor_mercado_imovel: 0,
  declara_ir: false,
  tem_conta_corrente: false,
  banco_conta_corrente: '',
  limite_cheque_especial: 0,
  tem_poupanca_aplicacao: false,
  comprova_36_meses_fgts: false,
  fara_uso_fgts: false,
  tipo_renda: '',
  faixa_renda: '',
  trabalha_aplicativo: false,
};

export default function Onboarding() {
  const [searchParams] = useSearchParams();
  const candidateId = searchParams.get('id') || '';
  const isAdmin = searchParams.get('admin') === 'true';
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<FormAnswers>({ ...EMPTY_ANSWERS });
  const [isConsultingCpf, setIsConsultingCpf] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (candidateId) {
      api.getCandidate(candidateId).then((c) => {
        if (c) {
          const initialAnswers = { 
            ...EMPTY_ANSWERS,
            nome_completo: c.nome_completo,
            cpf: c.cpf,
            telefone: c.telefone,
            endereco: c.endereco,
            municipio_projeto: c.municipio_projeto,
            narrativa_renda: c.narrativa_renda,
            ...(c.fichas_cadastrais || {})
          };
          setAnswers(initialAnswers);
        }
      });
    }
  }, [candidateId]);

  useEffect(() => {
    const cpf = answers.cpf?.replace(/\D/g, '') || '';
    const isPlaceholder = !answers.nome_completo || answers.nome_completo === 'Em Preenchimento';
    
    if (cpf.length === 11 && isPlaceholder && !isConsultingCpf) {
      handleConsultaCpf();
    }
  }, [answers.cpf]);

  const step: FormStep = formSteps[currentStep];
  const totalSteps = formSteps.length;

  function shouldShowQuestion(q: FormField): boolean {
    if (!q.conditionalOn) return true;
    const parentVal = (answers as any)[q.conditionalOn.field];
    if (Array.isArray(q.conditionalOn.value)) {
      return q.conditionalOn.value.includes(parentVal);
    }
    return parentVal === q.conditionalOn.value;
  }

  function handleAnswer(questionId: keyof FormAnswers, value: unknown) {
    setAnswers((prev) => {
      const newAnswers = { ...prev, [questionId]: value };
      if (questionId === 'data_contrato_habitacional' && typeof value === 'string') {
        const contractDate = new Date(value);
        const limitDate = new Date('2005-05-16');
        newAnswers.financiamento_habitacional_pos_2005 = contractDate > limitDate;
      }
      return newAnswers;
    });
  }

  function canProceed(): boolean {
    const visibleQuestions = step.questions.filter(shouldShowQuestion);
    return visibleQuestions.every((q) => {
      if (!q.required) return true;
      if (q.type === 'dependentes_array') {
        const deps = ((answers as any)[q.id] as Dependent[]) || [];
        if (deps.length === 0) return false;
        return deps.every(d => d.nome.trim() !== '' && d.idade >= 0 && d.grau_parentesco !== '' && (!d.tem_renda || (d.tem_renda && d.valor_renda !== undefined && d.valor_renda > 0)));
      }
      const val = (answers as any)[q.id];
      if (val === null || val === undefined || val === '') return false;
      return true;
    });
  }

  async function handleNext() {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
      window.scrollTo(0, 0);
    } else {
      setSaving(true);
      if (candidateId) {
        const finalAnswers = { ...answers };
        const result = await api.saveFormAnswers(candidateId, finalAnswers);
        
        if (!result) {
            alert('Erro ao salvar as respostas. Por favor, tente novamente.');
            setSaving(false);
            return;
        }

        if (finalAnswers.financiamento_habitacional_pos_2005) {
           await api.updateStatus(candidateId, 'subsidio_bloqueado' as any, undefined, 'Benefício Habitacional após 16/05/2005 detectado na ficha.');
        } else if (finalAnswers.tipo_renda === 'Sem_renda') {
           await api.updateStatus(candidateId, 'sem_renda_comprovavel' as any, undefined, 'Candidato declarou não possuir renda na ficha.');
        } else {
           await api.updateStatus(candidateId, 'documentacao_pendente' as any, undefined, 'Ficha cadastral preenchida com sucesso.');
        }

        if (isAdmin) {
          navigate(`/admin/candidato/${candidateId}`);
        } else {
          navigate(`/upload?id=${candidateId}`);
        }
      } else {
        navigate('/');
      }
      setSaving(false);
    }
  }

  async function handleConsultaCpf() {
    const cpf = answers.cpf || '';
    if (!cpf) return;
    
    setIsConsultingCpf(true);
    try {
      const result = await cpfService.consultaCPF(cpf);
      if (result.code === 200 && result.data) {
        setAnswers(prev => ({
          ...prev,
          nome_completo: result.data?.nome || prev.nome_completo
        }));
      }
    } catch (error) {
      console.error('Erro na consulta cpf:', error);
    } finally {
      setIsConsultingCpf(false);
    }
  }

  function handleBack() {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      window.scrollTo(0, 0);
    }
  }

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
        className="onboarding-sidebar"
      >
        <img src="/logo.png" alt="LCM" style={{ height: '32px', objectFit: 'contain', marginBottom: '48px', alignSelf: 'flex-start' }} />
        
        <div style={{ flex: 1 }}>
          <h2 style={{ color: '#ffffff', fontSize: '1.125rem', fontWeight: 800, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ClipboardList size={20} style={{ color: 'var(--primary-500)' }} />
            Progresso
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
            {formSteps.map((s, index) => {
              const isCompleted = index < currentStep;
              const isActive = index === currentStep;
              return (
                <div key={s.id} style={{ display: 'flex', gap: '16px', position: 'relative', paddingBottom: '24px' }}>
                  {/* Line */}
                  {index < formSteps.length - 1 && (
                    <div style={{
                      position: 'absolute',
                      left: '11px',
                      top: '24px',
                      bottom: 0,
                      width: '2px',
                      background: isCompleted ? 'var(--primary-600)' : 'rgba(255,255,255,0.1)',
                      zIndex: 1,
                    }} />
                  )}
                  
                  {/* Circle */}
                  <div style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: isCompleted ? 'var(--primary-600)' : isActive ? 'transparent' : 'rgba(255,255,255,0.05)',
                    border: isActive ? '2px solid var(--primary-500)' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 2,
                    flexShrink: 0,
                  }}>
                    {isCompleted ? <Check size={14} color="#ffffff" strokeWidth={3} /> : (
                      <span style={{ fontSize: '10px', fontWeight: 800, color: isActive ? 'var(--primary-500)' : 'rgba(255,255,255,0.3)' }}>
                        {index + 1}
                      </span>
                    )}
                  </div>

                  <div style={{ marginTop: '2px' }}>
                    <div style={{ 
                      fontSize: '0.8125rem', 
                      fontWeight: isActive ? 700 : 500, 
                      color: isActive ? '#ffffff' : isCompleted ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.3)',
                      transition: 'color 0.2s ease'
                    }}>
                      {s.title}
                    </div>
                  </div>
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
            <Info size={14} /> Dica
          </div>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', lineHeight: 1.5 }}>
            Certifique-se de que os dados informados condizem com seus documentos originais.
          </p>
        </div>
      </div>

      {/* Right Side — Form Area */}
      <div style={{
        flex: 1,
        marginLeft: '0',
        background: 'var(--bg-secondary)',
        padding: '40px 24px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        transition: 'margin-left 0.2s ease',
      }}
        className="onboarding-main-content"
      >
        {/* Mobile Header (Hidden on Desktop) */}
        <div className="onboarding-mobile-header" style={{
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

        <div style={{ width: '100%', maxWidth: '640px', marginTop: '0' }} className="onboarding-form-container">
          {/* Top Title Section */}
          <div style={{ marginBottom: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary-600)', marginBottom: '8px', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>
              <ShieldCheck size={16} /> Ficha Pré-Cadastral
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: '4px' }}>
              {step.title}
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9375rem' }}>
              {step.description}
            </p>
          </div>

          {/* Form Card */}
          <div className="card animate-slideUp" key={step.id} style={{ 
            padding: '32px', 
            boxShadow: 'var(--shadow-lg)', 
            border: '1px solid var(--border-default)',
            marginBottom: '24px',
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {step.questions.filter(shouldShowQuestion).map((q) => (
                <div key={q.id} className="form-group">
                  <label className="form-label" style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{q.label}</label>
                  {q.helpText && <span className="form-help" style={{ marginTop: '4px', marginBottom: '8px' }}>{q.helpText}</span>}

                  <div style={{ marginTop: '8px' }}>
                    {q.type === 'boolean' && (
                      <div className="toggle-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <button
                          type="button"
                          className={`toggle-btn ${(answers as any)[q.id] === true ? 'selected' : ''}`}
                          onClick={() => handleAnswer(q.id, true)}
                          style={{ height: '44px', borderRadius: 'var(--radius-md)' }}
                        >
                          <Check size={16} /> Sim
                        </button>
                        <button
                          type="button"
                          className={`toggle-btn ${(answers as any)[q.id] === false ? 'selected' : ''}`}
                          onClick={() => handleAnswer(q.id, false)}
                          style={{ height: '44px', borderRadius: 'var(--radius-md)' }}
                        >
                          <X size={16} /> Não
                        </button>
                      </div>
                    )}

                    {q.type === 'select' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {q.options?.map((opt) => {
                          const isSelected = (answers as any)[q.id] === opt.value;
                          return (
                            <button
                              key={opt.value}
                              type="button"
                              className={`toggle-btn ${isSelected ? 'selected' : ''}`}
                              onClick={() => handleAnswer(q.id, opt.value)}
                              style={{ 
                                textAlign: 'left', 
                                justifyContent: 'space-between', 
                                padding: '14px 16px',
                                borderRadius: 'var(--radius-md)',
                                height: 'auto',
                                minHeight: '44px',
                              }}
                            >
                              {opt.label}
                              {isSelected && <Check size={16} />}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {q.type === 'number' && (
                      <input
                        className="form-input"
                        type="number"
                        placeholder="R$ 0,00"
                        value={(answers as any)[q.id] || ''}
                        onChange={(e) => handleAnswer(q.id, parseFloat(e.target.value) || 0)}
                        style={{ height: '48px', borderRadius: 'var(--radius-md)' }}
                      />
                    )}

                    {q.type === 'textarea' && (
                      <textarea
                        className="form-textarea"
                        placeholder="Conte-nos um pouco mais..."
                        rows={4}
                        value={((answers as any)[q.id] as string) || ''}
                        onChange={(e) => handleAnswer(q.id, e.target.value)}
                        style={{ borderRadius: 'var(--radius-md)', padding: '14px' }}
                      />
                    )}

                    {q.type === 'date' && (
                      <input
                        className="form-input"
                        type="date"
                        value={(answers as any)[q.id] || ''}
                        onChange={(e) => handleAnswer(q.id, e.target.value)}
                        style={{ height: '48px', borderRadius: 'var(--radius-md)' }}
                      />
                    )}

                    {q.type === 'text' && (
                      <div style={{ position: 'relative' }}>
                        <input
                          className="form-input"
                          type="text"
                          placeholder={q.id === 'cpf' ? '000.000.000-00' : ''}
                          value={(answers as any)[q.id] || ''}
                          onChange={(e) => handleAnswer(q.id, e.target.value)}
                          style={{ 
                            height: '48px', 
                            borderRadius: 'var(--radius-md)',
                            paddingRight: q.id === 'cpf' && isConsultingCpf ? '40px' : '12px' 
                          }}
                        />
                        {q.id === 'cpf' && isConsultingCpf && (
                          <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)' }}>
                            <div className="spinner-sm" />
                          </div>
                        )}
                      </div>
                    )}

                    {q.type === 'dependentes_array' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', background: 'var(--bg-tertiary)', padding: '20px', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-default)' }}>
                        {((answers.dependentes as Dependent[]) || []).map((dep, index) => (
                          <div key={index} style={{ padding: '20px', background: 'var(--bg-primary)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-default)', display: 'flex', flexDirection: 'column', gap: '16px', boxShadow: 'var(--shadow-sm)' }}>
                            <div className="flex justify-between items-center">
                              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary-600)', textTransform: 'uppercase' }}>Dep. #{index + 1}</span>
                              <button 
                                type="button" 
                                className="btn btn-ghost btn-sm" 
                                style={{ color: 'var(--danger-500)', height: '24px', fontSize: '0.75rem' }}
                                onClick={() => {
                                  const newList = [...((answers.dependentes as Dependent[]) || [])];
                                  newList.splice(index, 1);
                                  handleAnswer('dependentes', newList);
                                }}
                              >
                                Remover
                              </button>
                            </div>
                            
                            <div className="form-group">
                              <label className="form-label" style={{ fontSize: '0.75rem' }}>Nome Completo *</label>
                              <input
                                className="form-input"
                                value={dep.nome}
                                onChange={(e) => {
                                  const newList = [...((answers.dependentes as Dependent[]) || [])];
                                  newList[index].nome = e.target.value;
                                  handleAnswer('dependentes', newList);
                                }}
                              />
                            </div>
                            
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                              <div className="form-group">
                                <label className="form-label" style={{ fontSize: '0.75rem' }}>Idade *</label>
                                <input
                                  className="form-input"
                                  type="number"
                                  value={dep.idade || ''}
                                  onChange={(e) => {
                                    const newList = [...((answers.dependentes as Dependent[]) || [])];
                                    newList[index].idade = parseInt(e.target.value) || 0;
                                    handleAnswer('dependentes', newList);
                                  }}
                                />
                              </div>
                              
                              <div className="form-group">
                                <label className="form-label" style={{ fontSize: '0.75rem' }}>Parentesco *</label>
                                <select
                                  className="form-input"
                                  value={dep.grau_parentesco}
                                  onChange={(e) => {
                                    const newList = [...((answers.dependentes as Dependent[]) || [])];
                                    newList[index].grau_parentesco = e.target.value;
                                    handleAnswer('dependentes', newList);
                                  }}
                                  style={{ height: '40px' }}
                                >
                                  <option value="">Selecione...</option>
                                  <option value="Filho_Filha">Filho(a)</option>
                                  <option value="Enteado_Enteada">Enteado(a)</option>
                                  <option value="Menor_Guarda">Menor sob guarda</option>
                                  <option value="Pai_Mae">Pai/Mãe</option>
                                  <option value="Outro">Outro</option>
                                </select>
                              </div>
                            </div>

                            <div className="form-group">
                              <label className="form-label" style={{ fontSize: '0.75rem' }}>Possui renda?</label>
                              <div className="toggle-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                <button
                                  type="button"
                                  className={`toggle-btn ${dep.tem_renda === true ? 'selected' : ''}`}
                                  onClick={() => {
                                    const newList = [...((answers.dependentes as Dependent[]) || [])];
                                    newList[index].tem_renda = true;
                                    handleAnswer('dependentes', newList);
                                  }}
                                  style={{ height: '36px', fontSize: '0.8rem' }}
                                >Sim</button>
                                <button
                                  type="button"
                                  className={`toggle-btn ${dep.tem_renda === false ? 'selected' : ''}`}
                                  onClick={() => {
                                    const newList = [...((answers.dependentes as Dependent[]) || [])];
                                    newList[index].tem_renda = false;
                                    newList[index].valor_renda = 0;
                                    handleAnswer('dependentes', newList);
                                  }}
                                  style={{ height: '36px', fontSize: '0.8rem' }}
                                >Não</button>
                              </div>
                            </div>

                            {dep.tem_renda && (
                              <div className="form-group">
                                <label className="form-label" style={{ fontSize: '0.75rem' }}>Valor mensal (R$) *</label>
                                <input
                                  className="form-input"
                                  type="number"
                                  value={dep.valor_renda || ''}
                                  onChange={(e) => {
                                    const newList = [...((answers.dependentes as Dependent[]) || [])];
                                    newList[index].valor_renda = parseFloat(e.target.value) || 0;
                                    handleAnswer('dependentes', newList);
                                  }}
                                  style={{ height: '40px' }}
                                />
                              </div>
                            )}
                          </div>
                        ))}
                        
                        <button 
                          type="button" 
                          className="btn btn-outline" 
                          onClick={() => {
                            const current = ((answers.dependentes as Dependent[]) || []);
                            handleAnswer('dependentes', [
                              ...current, 
                              { nome: '', idade: 0, grau_parentesco: '', tem_renda: false }
                            ]);
                          }}
                          style={{ borderStyle: 'dashed', height: '44px', color: 'var(--text-muted)' }}
                        >
                          <Plus size={16} /> Adicionar Dependente
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center" style={{ marginTop: '32px' }}>
            <button
              className="btn btn-ghost"
              onClick={handleBack}
              disabled={currentStep === 0}
              style={{ visibility: currentStep === 0 ? 'hidden' : 'visible', fontWeight: 600 }}
            >
              <ArrowLeft size={18} /> Voltar
            </button>
            
            <button
              className="btn btn-primary btn-lg"
              onClick={handleNext}
              disabled={!canProceed() || saving}
              style={{ minWidth: '180px', justifyContent: 'center', borderRadius: 'var(--radius-full)', height: '52px', fontSize: '1rem' }}
            >
              {saving
                ? 'Processando...'
                : currentStep === totalSteps - 1
                ? <><Check size={20} /> Finalizar</>
                : <>Continuar <ArrowRight size={20} /></>}
            </button>
          </div>

          <div style={{ marginTop: '40px', padding: '16px', borderTop: '1px solid var(--border-default)', display: 'flex', justifyContent: 'center' }}>
             <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ShieldCheck size={14} style={{ color: 'var(--primary-600)' }} /> Seus dados estão protegidos pela LGPD.
             </p>
          </div>
        </div>
      </div>

      {/* Responsive Styles */}
      <style>{`
        @media (min-width: 768px) {
          .onboarding-sidebar {
            display: flex !important;
          }
          .onboarding-main-content {
            margin-left: 320px !important;
          }
          .onboarding-mobile-header {
            display: none !important;
          }
          .onboarding-form-container {
            margin-top: 40px !important;
          }
        }
        .onboarding-sidebar::-webkit-scrollbar {
          width: 4px;
        }
        .onboarding-sidebar::-webkit-scrollbar-track {
          background: rgba(255,255,255,0.02);
        }
        .onboarding-sidebar::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.1);
          border-radius: 10px;
        }
        .onboarding-sidebar::-webkit-scrollbar-thumb:hover {
          background: rgba(255,255,255,0.2);
        }
        @media (max-width: 767px) {
          .onboarding-sidebar {
            display: none !important;
          }
          .onboarding-main-content {
            margin-left: 0 !important;
            padding-top: 80px !important;
          }
          .onboarding-mobile-header {
            display: flex !important;
          }
          .onboarding-form-container {
            margin-top: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}
