import React from 'react'

export default function Card({ interactive = false, muted = false, className = '', children, as: Tag = 'div', ...rest }) {
  return (
    <Tag
      className={`card ${interactive ? 'card-interactive' : ''} ${muted ? 'card-muted' : ''} ${className}`}
      {...rest}
    >
      {children}
    </Tag>
  )
}

export const CardBody   = ({ className = '', children }) => <div className={`card-body ${className}`}>{children}</div>
export const CardHeader = ({ className = '', children }) => <div className={`card-header ${className}`}>{children}</div>
export const CardFooter = ({ className = '', children }) => <div className={`card-footer ${className}`}>{children}</div>
