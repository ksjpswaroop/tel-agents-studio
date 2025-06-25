'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

interface EditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  autoSave?: boolean
  onSave?: (value: string) => void
  readOnly?: boolean
}

export default function Editor({
  value,
  onChange,
  placeholder = 'Enter markdown content...',
  className,
  autoSave = false,
  onSave,
  readOnly = false,
}: EditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [localValue, setLocalValue] = useState(value)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    setLocalValue(value)
  }, [value])

  // Auto-save functionality
  useEffect(() => {
    if (autoSave && onSave && localValue !== value) {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
      saveTimeoutRef.current = setTimeout(() => {
        onSave(localValue)
      }, 1000) // Save after 1 second of inactivity
    }

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [localValue, value, autoSave, onSave])

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value
      setLocalValue(newValue)
      onChange(newValue)
    },
    [onChange]
  )

  // Handle tab key for indentation
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault()
      const start = e.currentTarget.selectionStart
      const end = e.currentTarget.selectionEnd
      const newValue = localValue.substring(0, start) + '  ' + localValue.substring(end)
      setLocalValue(newValue)
      onChange(newValue)
      
      // Set cursor position after tab
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 2
        }
      }, 0)
    }
    
    // Save on Cmd/Ctrl + S
    if ((e.metaKey || e.ctrlKey) && e.key === 's') {
      e.preventDefault()
      if (onSave) {
        onSave(localValue)
      }
    }
  }, [localValue, onChange, onSave])

  return (
    <textarea
      ref={textareaRef}
      value={localValue}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
      readOnly={readOnly}
      className={cn(
        'w-full h-full resize-none',
        'bg-background text-foreground',
        'p-4 font-mono text-sm',
        'border-0 outline-none focus:ring-0',
        'selection:bg-primary/20',
        className
      )}
      spellCheck={false}
    />
  )
}