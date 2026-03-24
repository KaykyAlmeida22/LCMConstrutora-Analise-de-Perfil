import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { formSteps } from '../../data/formSteps';
import { getRequiredDocuments } from '../../services/documentRules';
import { api } from '../../services/api';
import type { FormAnswers, FormStep, FormField } from '../../types';

const EMPTY_ANSWERS: FormAnswers = {
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
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<FormAnswers>({ ...EMPTY_ANSWERS });
  const [saving, setSaving] = useState(false);
  const [candidateName, setCandidateName] = useState('');

  useEffect(() => {
    if (candidateId) {
      api.getCandidate(candidateId).then((c) => {
        if (c) {
          setCandidateName(c.nome_completo);
          if (c.fichas_cadastrais) {
            setAnswers(c.fichas_cadastrais);
          }
        }
      });
    }
  }, [candidateId]);

  const step: FormStep = formSteps[currentStep];
  const totalSteps = formSteps.length;
  const progress = ((currentStep + 1) / totalSteps) * 100;

  function shouldShowQuestion(q: FormField): boolean {
    if (!q.conditionalOn) return true;
    const parentVal = (answers as any)[q.conditionalOn.field];
    return parentVal === q.conditionalOn.value;
  }

  function handleAnswer(questionId: keyof FormAnswers, value: unknown) {
    setAnswers((prev) => {
      const newAnswers = { ...prev, [questionId]: value };
      
      // Regra Especial: Financiamento Habitacional Pós 2005
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
      const val = (answers as any)[q.id];
      if (val === null || val === undefined || val === '') return false;
      // Basic text validation if needed
      return true;
    });
  }

  async function handleNext() {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
      window.scrollTo(0, 0);
    } else {
      // Final step — save
      setSaving(true);
      if (candidateId) {
        // Prepare data (ensure numbers are numbers)
        const finalAnswers = { ...answers };
        
        await api.saveFormAnswers(candidateId, finalAnswers);
        
        // Update status if it's blocking
        if (finalAnswers.financiamento_habitacional_pos_2005) {
           await api.updateStatus(candidateId, 'subsidio_bloqueado', undefined, 'Benefício Habitacional após 16/05/2005 detectado na ficha.');
        } else if (finalAnswers.tipo_renda === 'Sem_renda') {
           await api.updateStatus(candidateId, 'sem_renda_comprovavel', undefined, 'Candidato declarou não possuir renda na ficha.');
        }

        navigate(`/upload?id=${candidateId}`);
      } else {
        navigate('/');
      }
      setSaving(false);
    }
  }

  function handleBack() {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      window.scrollTo(0, 0);
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', padding: '24px' }}>
      <div style={{ maxWidth: '680px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
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
            Ficha Pré-Cadastral
          </h1>
          {candidateName && (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Candidato(a): <strong style={{ color: 'var(--text-primary)' }}>{candidateName}</strong>
            </p>
          )}
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '4px' }}>
            Ficha de 11 Blocos — Estritamente Conforme Especificação
          </p>
        </div>

        {/* Progress bar */}
        <div style={{ marginBottom: '32px' }}>
          <div className="flex justify-between items-center" style={{ marginBottom: '8px' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Etapa {currentStep + 1} de {totalSteps}
            </span>
            <span style={{ fontSize: '0.78rem', color: 'var(--primary-400)', fontWeight: 600 }}>
              {Math.round(progress)}%
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
                width: `${progress}%`,
                height: '100%',
                background: 'linear-gradient(90deg, var(--primary-600), var(--primary-400))',
                borderRadius: '999px',
                transition: 'width 0.4s ease',
              }}
            />
          </div>
        </div>

        {/* Step Card */}
        <div className="card animate-slideUp" key={step.id} style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '4px' }}>
            {step.title}
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '28px' }}>
            {step.description}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {step.questions.filter(shouldShowQuestion).map((q) => (
              <div key={q.id} className="form-group">
                <label className="form-label">{q.label}</label>
                {q.helpText && <span className="form-help">{q.helpText}</span>}

                {q.type === 'boolean' && (
                  <div className="toggle-group">
                    <button
                      type="button"
                      className={`toggle-btn ${(answers as any)[q.id] === true ? 'selected' : ''}`}
                      onClick={() => handleAnswer(q.id, true)}
                    >
                      ✅ Sim
                    </button>
                    <button
                      type="button"
                      className={`toggle-btn ${(answers as any)[q.id] === false ? 'selected' : ''}`}
                      onClick={() => handleAnswer(q.id, false)}
                    >
                      ❌ Não
                    </button>
                  </div>
                )}

                {q.type === 'select' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {q.options?.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        className={`toggle-btn ${(answers as any)[q.id] === opt.value ? 'selected' : ''}`}
                        onClick={() => handleAnswer(q.id, opt.value)}
                        style={{ textAlign: 'left', flex: 'none' }}
                      >
                        {(answers as any)[q.id] === opt.value ? '● ' : '○ '}{opt.label}
                      </button>
                    ))}
                  </div>
                )}

                {q.type === 'number' && (
                  <input
                    className="form-input"
                    type="number"
                    value={(answers as any)[q.id] || ''}
                    onChange={(e) => handleAnswer(q.id, parseFloat(e.target.value) || 0)}
                  />
                )}

                {q.type === 'date' && (
                  <input
                    className="form-input"
                    type="date"
                    value={(answers as any)[q.id] || ''}
                    onChange={(e) => handleAnswer(q.id, e.target.value)}
                  />
                )}

                {q.type === 'text' && (
                  <textarea
                    className="form-textarea"
                    placeholder="Escreva aqui..."
                    value={(answers as any)[q.id] || ''}
                    onChange={(e) => handleAnswer(q.id, e.target.value)}
                    rows={4}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between">
          <button
            className="btn btn-ghost"
            onClick={handleBack}
            disabled={currentStep === 0}
          >
            ← Voltar
          </button>
          <button
            className="btn btn-primary btn-lg"
            onClick={handleNext}
            disabled={!canProceed() || saving}
          >
            {saving
              ? 'Salvando...'
              : currentStep === totalSteps - 1
              ? '✅ Finalizar Ficha'
              : 'Próximo →'}
          </button>
        </div>
      </div>
    </div>
  );
}
