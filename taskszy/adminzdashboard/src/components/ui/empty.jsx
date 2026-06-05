import React from 'react';

export function Empty({ children, className = '', ...props }) {
  return (
    <div 
      className={`flex flex-col items-center justify-center p-8 ${className}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 32px',
        textAlign: 'center',
        ...props.style
      }}
      {...props}
    >
      {children}
    </div>
  );
}

export function EmptyHeader({ children, className = '', ...props }) {
  return (
    <div 
      className={`flex flex-col items-center gap-4 ${className}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '16px',
        marginBottom: '24px',
        ...props.style
      }}
      {...props}
    >
      {children}
    </div>
  );
}

export function EmptyMedia({ children, className = '', ...props }) {
  return (
    <div 
      className={`mb-4 ${className}`}
      style={{
        marginBottom: '16px',
        ...props.style
      }}
      {...props}
    >
      {children}
    </div>
  );
}

export function EmptyTitle({ children, className = '', ...props }) {
  return (
    <h3 
      className={`text-xl font-semibold ${className}`}
      style={{
        fontSize: '20px',
        fontWeight: 700,
        color: 'var(--text-primary)',
        marginBottom: '8px',
        ...props.style
      }}
      {...props}
    >
      {children}
    </h3>
  );
}

export function EmptyDescription({ children, className = '', ...props }) {
  return (
    <p 
      className={`text-sm text-muted-foreground ${className}`}
      style={{
        fontSize: '14px',
        color: 'var(--text-muted)',
        maxWidth: '400px',
        lineHeight: '1.6',
        ...props.style
      }}
      {...props}
    >
      {children}
    </p>
  );
}

export function EmptyContent({ children, className = '', ...props }) {
  return (
    <div 
      className={`flex gap-2 ${className}`}
      style={{
        display: 'flex',
        gap: '8px',
        marginTop: '8px',
        ...props.style
      }}
      {...props}
    >
      {children}
    </div>
  );
}
