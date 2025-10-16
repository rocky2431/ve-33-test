import type { CSSProperties, ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  title?: string
  style?: CSSProperties
}

export function Card({ children, title, style }: CardProps) {
  return (
    <div
      style={{
        backgroundColor: '#1a1a1a',
        padding: '32px',
        borderRadius: '16px',
        border: '1px solid #333',
        ...style,
      }}
    >
      {title && (
        <h2
          style={{
            fontSize: '24px',
            fontWeight: '700',
            marginBottom: '24px',
            color: '#fff',
          }}
        >
          {title}
        </h2>
      )}
      {children}
    </div>
  )
}
