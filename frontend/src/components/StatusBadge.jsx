import React from 'react';
import { CheckCircle2, XCircle, Clock, Loader2, MinusCircle } from 'lucide-react';

export const StatusBadge = ({ status }) => {
  const normalized = (status || 'queued').toLowerCase();

  switch (normalized) {
    case 'success':
    case 'completed':
      return (
        <span className="badge badge-success">
          <CheckCircle2 size={12} strokeWidth={2.5} />
          <span>Success</span>
        </span>
      );
    case 'failed':
    case 'error':
    case 'failure':
      return (
        <span className="badge badge-failed">
          <XCircle size={12} strokeWidth={2.5} />
          <span>Failed</span>
        </span>
      );
    case 'in_progress':
    case 'building':
    case 'running':
      return (
        <span className="badge badge-in-progress">
          <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />
          <span>In Progress</span>
        </span>
      );
    case 'queued':
    case 'pending':
      return (
        <span className="badge badge-queued">
          <Clock size={12} strokeWidth={2.5} />
          <span>Queued</span>
        </span>
      );
    case 'cancelled':
    default:
      return (
        <span className="badge badge-neutral">
          <MinusCircle size={12} strokeWidth={2.5} />
          <span>{status || 'Unknown'}</span>
        </span>
      );
  }
};
