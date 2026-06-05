import { Toaster as Sonner } from "sonner"

const Toaster = ({ ...props }) => {
  return (
    <Sonner
      position="bottom-right"
      gap={8}
      toastOptions={{
        style: {
          fontSize: '13px',
          padding: '12px 16px',
          minHeight: '44px',
          borderRadius: '12px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          border: '1.5px solid var(--border-light, #E8EAEF)',
          background: 'var(--bg-surface, #fff)',
          color: 'var(--text-primary, #1A1D2E)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        },
        classNames: {
          toast: 'group toast',
          description: 'group-[.toast]:text-muted-foreground',
          actionButton: 'group-[.toast]:bg-primary group-[.toast]:text-primary-foreground',
          cancelButton: 'group-[.toast]:bg-muted group-[.toast]:text-muted-foreground',
          success: 'border-l-4 !border-l-[#12C479]',
          error: 'border-l-4 !border-l-[#EF4444]',
          warning: 'border-l-4 !border-l-[#F97316]',
          info: 'border-l-4 !border-l-[#3B5BFC]',
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
