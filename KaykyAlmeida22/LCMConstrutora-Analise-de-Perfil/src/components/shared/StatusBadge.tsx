import { STATUS_LABELS } from '../../types';
import type { CandidateStatus } from '../../types';

const STATUS_BADGE_CLASS: Record<CandidateStatus, string> = {
  documentacao_pendente: 'badge-pending',
  em_analise: 'badge-analysis',
  aguardando_correcao: 'badge-correction',
  aprovado: 'badge-approved',
  subsidio_bloqueado: 'badge-blocked',
  sem_renda_comprovavel: 'badge-no-income',
};

interface Props {
  status: CandidateStatus;
}

export default function StatusBadge({ status }: Props) {
  return (
    <span className={`badge ${STATUS_BADGE_CLASS[status]}`}>
      <span className="badge-dot" />
      {STATUS_LABELS[status]}
    </span>
  );
}
