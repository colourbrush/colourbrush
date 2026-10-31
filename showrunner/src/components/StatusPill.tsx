import { nextStatus, STATUS_LABEL, type Status } from '../domain/types';

export function StatusPill({ status, onChange }: { status: Status; onChange(s: Status): void }) {
  return (
    <button className={`pill pill-${status}`} title="Click to change status" onClick={() => onChange(nextStatus(status))}>
      {STATUS_LABEL[status]}
    </button>
  );
}

export function ProgressBar({ done, total }: { done: number; total: number }) {
  if (!total) return null;
  return (
    <span className="progress" title={`${done} of ${total} wrapped`}>
      <span className="progress-fill" style={{ width: `${(done / total) * 100}%` }} />
    </span>
  );
}
