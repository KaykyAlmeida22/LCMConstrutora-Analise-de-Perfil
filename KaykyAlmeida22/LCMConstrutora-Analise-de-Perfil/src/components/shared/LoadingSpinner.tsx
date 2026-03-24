interface Props {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function LoadingSpinner({ size = 'md', className = '' }: Props) {
  const sizeClass = size === 'lg' ? 'spinner-lg' : '';
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: size === 'lg' ? '48px' : '24px',
      }}
      className={className}
    >
      <div className={`spinner ${sizeClass}`} />
    </div>
  );
}
