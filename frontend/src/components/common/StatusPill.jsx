import Badge from './Badge.jsx';

export default function StatusPill({ status, children, size = 'md' }) {
  return (
    <Badge status={status} size={size}>
      {children || status}
    </Badge>
  );
}
