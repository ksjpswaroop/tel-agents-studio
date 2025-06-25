'use client'

interface MermaidProps {
  children: string
}

export default function Mermaid({ children }: MermaidProps) {
  // Fallback component for mermaid diagrams when mermaid library is not available
  return (
    <div className='my-4 p-4 bg-muted/50 border rounded-lg'>
      <div className='text-xs font-medium text-muted-foreground mb-2 uppercase'>
        Mermaid Diagram
      </div>
      <pre className='text-sm font-mono whitespace-pre-wrap break-words'>
        {children}
      </pre>
      <div className='text-xs text-muted-foreground mt-2 italic'>
        Mermaid rendering not available - showing raw diagram code
      </div>
    </div>
  )
}