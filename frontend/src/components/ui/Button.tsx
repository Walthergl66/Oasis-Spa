import React from 'react';

type Variant = 'primary' | 'outline' | 'ghost' | 'danger' | 'neutral' | 'add';

const CLASSES: Record<Variant, string> = {
  primary: 'btn-primary',
  outline: 'btn-mini-outline',
  ghost: 'btn-mini-ghost',
  danger: 'btn-danger',
  neutral: 'btn-neutral',
  add: 'add-btn',
};

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  /** Ocupa todo el ancho y usa el estilo de acción principal del modal. */
  block?: boolean;
  loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  block = false,
  loading = false,
  children,
  className = '',
  disabled,
  ...props
}) => (
  <button
    className={`${block ? 'btn-continue' : CLASSES[variant]} ${className}`.trim()}
    disabled={disabled || loading}
    {...props}
  >
    {loading ? 'Procesando…' : children}
  </button>
);
