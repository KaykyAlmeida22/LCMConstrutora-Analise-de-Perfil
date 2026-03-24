import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { formSteps } from '../../data/formSteps';
import { getRequiredDocuments } from '../../services/documentRules';
import { db } from '../../services/mockDatabase';
import type { FormAnswers, FormQuestion } from '../../types';

const EMPTY_ANSWERS: FormAnswers = {
  estadoCivil: '',
  temDependentes: null,
  quantosDependentes: 0,
  dependenteComRenda: null,
  possuiImovel: null,
  tipoMoradia: '',
  tipoRenda: '',
  faixaRenda: '',
  recebeuBeneficioHabitacional: null,
  dataBeneficio: '',
  recebeBolsaFamilia: null,
  possuiFGTS: null,
  narrativaAtividade: '',
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
      db.getCandidate(candidateId).then((c) => {
        if (c) {
          setCandidateName(c.nome);
          if (c.formAnswers) {
            setAnswers(c.formAnswers);
          }
        }
      });
    }
  }, [candidateId]);

  const step = formSteps[currentStep];
  const totalSteps = formSteps.length;
  const progress = ((currentStep + 1) / totalSteps) * 100;

  function shouldShowQuestion(q: FormQuestion): boolean {
    if (!q.conditionalOn) return true;
    const parentVal = answers[q.conditionalOn.field];
    return parentVal === q.conditionalOn.value;
  }

  function handleAnswer(questionId: keyof FormAnswers, value: unknown) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  }

  function canProceed(): boolean {
    const visibleQuestions = step.questions.filter(shouldShowQuestion);
    return visibleQuestions.every((q) => {
      if (!q.required) return true;
      const val = answers[q.id];
      if (val === null || val === undefined || val === '') return false;
      if (q.type === 'text' && typeof val === 'string' && val.trim().length < 10) return false;
      return true;
    });
  }

  async function handleNext() {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Final step — save
      setSaving(true);
      const requiredDocs = getRequiredDocuments(answers);
      if (candidateId) {
        await db.saveFormAnswers(candidateId, answers, requiredDocs);
        navigate(`/upload?id=${candidateId}`);
      } else {
        navigate('/');
      }
      setSaving(false);
    }
  }

  function handleBack() {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
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
            Programa Minha Casa Minha Vida — LCM Construtora
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
                      className={`toggle-btn ${answers[q.id] === true ? 'selected' : ''}`}
                      onClick={() => handleAnswer(q.id, true)}
                    >
                      ✅ Sim
                    </button>
                    <button
                      type="button"
                      className={`toggle-btn ${answers[q.id] === false ? 'selected' : ''}`}
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
                        className={`toggle-btn ${answers[q.id] === opt.value ? 'selected' : ''}`}
                        onClick={() => handleAnswer(q.id, opt.value)}
                        style={{ textAlign: 'left', flex: 'none' }}
                      >
                        {answers[q.id] === opt.value ? '● ' : '○ '}{opt.label}
                      </button>
                    ))}
                  </div>
                )}

                {q.type === 'number' && (
                  <input
                    className="form-input"
                    type="number"
                    min={0}
                    max={20}
                    value={answers[q.id] as number}
                    onChange={(e) => handleAnswer(q.id, parseInt(e.target.value) || 0)}
                  />
                )}

                {q.type === 'date' && (
                  <input
                    className="form-input"
                    type="date"
                    value={answers[q.id] as string}
                    onChange={(e) => handleAnswer(q.id, e.target.value)}
                  />
                )}

                {q.type === 'text' && (
                  <textarea
                    className="form-textarea"
                    placeholder="Escreva aqui..."
                    value={answers[q.id] as string}
                    onChange={(e) => handleAnswer(q.id, e.target.value)}
                    rows={5}
                    style={{ minHeight: '140px' }}
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
              ? '✅ Finalizar e Enviar Documentos'
              : 'Próximo →'}
          </button>
        </div>
      </div>
    </div>
  );
}
