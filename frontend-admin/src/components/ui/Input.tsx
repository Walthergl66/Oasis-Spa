import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({ label, error, className = '', ...props }) => (
  <div className="input-wrapper">
    {label && <label className="input-label">{label}</label>}
    <input className={`input ${error ? 'error' : ''} ${className}`.trim()} {...props} />
    {error && <span className="error-message">{error}</span>}
  </div>
);

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea: React.FC<TextareaProps> = ({ label, error, className = '', ...props }) => (
  <div className="input-wrapper">
    {label && <label className="input-label">{label}</label>}
    <textarea className={`input ${error ? 'error' : ''} ${className}`.trim()} {...props} />
    {error && <span className="error-message">{error}</span>}
  </div>
);

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export const Select: React.FC<SelectProps> = ({ label, error, options, className = '', ...props }) => (
  <div className="input-wrapper">
    {label && <label className="input-label">{label}</label>}
    <select className={`input ${error ? 'error' : ''} ${className}`.trim()} {...props}>
      {options.map(option => (
        <option key={option.value} value={option.value}>{option.label}</option>
      ))}
    </select>
    {error && <span className="error-message">{error}</span>}
  </div>
);
