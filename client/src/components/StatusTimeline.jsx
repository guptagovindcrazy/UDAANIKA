import { formatDate } from '../utils/format';

const STEPS = [['Pending', 'Reported'], ['Assigned', 'Assigned'], ['In Progress', 'In Progress'], ['Rescued', 'Rescued'], ['Completed', 'Completed']];

// `history` is rescue.statusHistory; `status` is the current status.
export default function StatusTimeline({ history = [], status }) {
  const reachedAt = new Map();
  history.forEach((h) => { if (!reachedAt.has(h.status)) reachedAt.set(h.status, h.at); });
  const currentIdx = STEPS.findIndex(([k]) => k === status);
  const terminal = status === 'Cancelled' || status === 'Rejected';

  return (
    <ol className="timeline">
      {STEPS.map(([key, label], idx) => {
        const reached = reachedAt.has(key) && (currentIdx === -1 || idx < currentIdx);
        const state = key === status ? 'current' : reached ? 'done' : 'upcoming';
        return (
          <li key={key} className={`timeline__step timeline__step--${state}`} aria-current={state === 'current' ? 'step' : undefined}>
            <span className="timeline__dot" />
            <div>
              <strong>{label}</strong>
              {state !== 'upcoming' && reachedAt.has(key) && <small>{formatDate(reachedAt.get(key))}</small>}
            </div>
          </li>
        );
      })}
      {terminal && (
        <li className="timeline__step timeline__step--terminal">
          <span className="timeline__dot" />
          <div><strong>{status}</strong><small>{formatDate(reachedAt.get(status))}</small></div>
        </li>
      )}
    </ol>
  );
}
