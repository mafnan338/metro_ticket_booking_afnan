import { AlertCircle, CheckCircle2, Info, AlertTriangle } from 'lucide-react';
import { STATUS_META } from '../lib/metro';

const ALERT_ICONS = { error: AlertCircle, success: CheckCircle2, info: Info, warning: AlertTriangle };

export function Alert({ type = 'info', title, children, action }) {
  const Icon = ALERT_ICONS[type];
  return (
    <div className={`alert alert-${type}`} role={type === 'error' ? 'alert' : 'status'}>
      <Icon size={18} />
      <div style={{ flex: 1 }}>
        {title && <div className="alert-title">{title}</div>}
        {children && <div>{children}</div>}
      </div>
      {action}
    </div>
  );
}

export function Spinner({ size = 18 }) {
  return <span className="spinner" style={{ width: size, height: size }} aria-hidden="true" />;
}

export function StatusBadge({ status, light = false }) {
  const meta = STATUS_META[status] || { label: status, cls: 'badge-invalid' };
  return <span className={`badge ${light ? 'badge-light' : meta.cls}`}>{meta.label}</span>;
}

export function PageHeader({ eyebrow, icon: Icon, title, subtitle, children }) {
  return (
    <div className="page-head row between wrap" style={{ alignItems: 'flex-end' }}>
      <div>
        {eyebrow && <div className="eyebrow">{Icon && <Icon size={14} />}{eyebrow}</div>}
        <h1 className="page-title">{title}</h1>
        {subtitle && <p className="page-sub">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}
