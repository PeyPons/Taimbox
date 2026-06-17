import { getJobStatusLabel, getJobStatusVariant } from '../lib/jobStatus';

interface JobStatusBadgeProps {
  status: string;
}

export default function JobStatusBadge({ status }: JobStatusBadgeProps) {
  const variant = getJobStatusVariant(status);
  const label = getJobStatusLabel(status);
  return <span className={`badge badge-${variant}`}>{label}</span>;
}
