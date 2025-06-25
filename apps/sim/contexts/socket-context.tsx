'use client'

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'
import { io, type Socket } from 'socket.io-client'
import { createLogger } from '@/lib/logs/console-logger'

const logger = createLogger('SocketContext')

interface User {
  id: string
  name?: string
  email?: string
}

interface PresenceUser {
  socketId: string
  userId: string
  userName: string
  cursor?: { x: number; y: number }
  selection?: { type: 'block' | 'edge' | 'none'; id?: string }
}

interface SocketContextType {
  socket: Socket | null
  isConnected: boolean
  isConnecting: boolean
  connectionError: string | null
  isRetrying: boolean
  currentWorkflowId: string | null
  presenceUsers: PresenceUser[]
  joinWorkflow: (workflowId: string) => void
  leaveWorkflow: () => void
  emitWorkflowOperation: (operation: string, target: string, payload: any) => void
  emitSubblockUpdate: (blockId: string, subblockId: string, value: any) => void
  emitCursorUpdate: (cursor: { x: number; y: number }) => void
  emitSelectionUpdate: (selection: { type: 'block' | 'edge' | 'none'; id?: string }) => void
  retry: () => void
  // Event handlers for receiving real-time updates
  onWorkflowOperation: (handler: (data: any) => void) => void
  onSubblockUpdate: (handler: (data: any) => void) => void
  onCursorUpdate: (handler: (data: any) => void) => void
  onSelectionUpdate: (handler: (data: any) => void) => void
  onUserJoined: (handler: (data: any) => void) => void
  onUserLeft: (handler: (data: any) => void) => void
  onWorkflowDeleted: (handler: (data: any) => void) => void
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  isConnecting: false,
  connectionError: null,
  isRetrying: false,
  currentWorkflowId: null,
  presenceUsers: [],
  joinWorkflow: () => {},
  leaveWorkflow: () => {},
  emitWorkflowOperation: () => {},
  emitSubblockUpdate: () => {},
  emitCursorUpdate: () => {},
  emitSelectionUpdate: () => {},
  retry: () => {},
  onWorkflowOperation: () => {},
  onSubblockUpdate: () => {},
  onCursorUpdate: () => {},
  onSelectionUpdate: () => {},
  onUserJoined: () => {},
  onUserLeft: () => {},
  onWorkflowDeleted: () => {},
})

export const useSocket = () => useContext(SocketContext)

interface SocketProviderProps {
  children: ReactNode
  user?: User
}

export function SocketProvider({ children, user }: SocketProviderProps) {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const [isRetrying, setIsRetrying] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const [currentWorkflowId, setCurrentWorkflowId] = useState<string | null>(null)
  const [presenceUsers, setPresenceUsers] = useState<PresenceUser[]>([])
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Use refs to store event handlers to avoid stale closures
  const eventHandlers = useRef<{
    workflowOperation?: (data: any) => void
    subblockUpdate?: (data: any) => void
    cursorUpdate?: (data: any) => void
    selectionUpdate?: (data: any) => void
    userJoined?: (data: any) => void
    userLeft?: (data: any) => void
    workflowDeleted?: (data: any) => void
  }>({})

  // Helper function to calculate retry delay with exponential backoff
  const getRetryDelay = (attemptCount: number) => {
    return Math.min(1000 * Math.pow(2, attemptCount), 30000) // Max 30 seconds
  }

  // Helper function to clear retry timeout
  const clearRetryTimeout = () => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current)
      retryTimeoutRef.current = null
    }
  }

  // Initialize socket when user is available
  useEffect(() => {
    if (!user?.id || socket) return

    logger.info('Initializing socket connection for user:', user.id)
    setIsConnecting(true)
    setConnectionError(null)

    const initializeSocket = async () => {
      try {
        // Generate one-time token for socket authentication
        const tokenResponse = await fetch('/api/auth/socket-token', {
          method: 'POST',
          credentials: 'include',
        })

        if (!tokenResponse.ok) {
          const errorText = await tokenResponse.text()
          throw new Error(`Failed to generate socket token: ${tokenResponse.status} ${errorText}`)
        }

        const { token } = await tokenResponse.json()

        const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3002'

        logger.info('Attempting to connect to Socket.IO server', {
          url: socketUrl,
          userId: user?.id || 'no-user',
          hasToken: !!token,
          timestamp: new Date().toISOString(),
        })

        const socketInstance = io(socketUrl, {
          transports: ['polling', 'websocket'],
          withCredentials: true,
          reconnectionAttempts: 3,
          timeout: 10000,
          auth: {
            token, // Send one-time token for authentication
          },
        })

        // Connection events
        socketInstance.on('connect', () => {
          setIsConnected(true)
          setIsConnecting(false)
          setConnectionError(null)
          setRetryCount(0)
          setIsRetrying(false)
          clearRetryTimeout()
          logger.info('Socket connected successfully', {
            socketId: socketInstance.id,
            connected: socketInstance.connected,
            transport: socketInstance.io.engine?.transport?.name,
          })
        })

        socketInstance.on('disconnect', (reason) => {
          setIsConnected(false)
          setIsConnecting(false)
          logger.info('Socket disconnected', { reason })

          // Clear presence when disconnected
          setPresenceUsers([])
        })

        socketInstance.on('connect_error', (error: any) => {
          setIsConnecting(false)
          const errorMessage = error.message || 'Socket connection failed'
          setConnectionError(errorMessage)
          
          // Only log detailed error in development
          if (process.env.NODE_ENV === 'development') {
            logger.warn('Socket connection error:', {
              message: error.message,
              description: error.description,
              type: error.type,
              transport: error.transport,
            })
          } else {
            logger.warn('Socket connection failed. Check if socket server is running.')
          }
        })

        // Add reconnection logging
        socketInstance.on('reconnect', (attemptNumber) => {
          logger.info('Socket reconnected', { attemptNumber })
        })

        socketInstance.on('reconnect_attempt', (attemptNumber) => {
          logger.info('Socket reconnection attempt', { attemptNumber })
        })

        socketInstance.on('reconnect_error', (error: any) => {
          logger.error('Socket reconnection error:', error)
        })

        socketInstance.on('reconnect_failed', () => {
          logger.error('Socket reconnection failed - all attempts exhausted')
        })

        // Presence events
        socketInstance.on('presence-update', (users: PresenceUser[]) => {
          setPresenceUsers(users)
        })

        socketInstance.on('user-joined', (userData) => {
          setPresenceUsers((prev) => [...prev, userData])
          eventHandlers.current.userJoined?.(userData)
        })

        socketInstance.on('user-left', ({ userId, socketId }) => {
          setPresenceUsers((prev) => prev.filter((u) => u.socketId !== socketId))
          eventHandlers.current.userLeft?.({ userId, socketId })
        })

        // Workflow operation events
        socketInstance.on('workflow-operation', (data) => {
          eventHandlers.current.workflowOperation?.(data)
        })

        // Subblock update events
        socketInstance.on('subblock-update', (data) => {
          eventHandlers.current.subblockUpdate?.(data)
        })

        // Workflow deletion events
        socketInstance.on('workflow-deleted', (data) => {
          logger.warn(`Workflow ${data.workflowId} has been deleted`)
          // Clear current workflow ID if it matches the deleted workflow
          if (currentWorkflowId === data.workflowId) {
            setCurrentWorkflowId(null)
            setPresenceUsers([])
          }
          eventHandlers.current.workflowDeleted?.(data)
        })

        // Cursor update events
        socketInstance.on('cursor-update', (data) => {
          setPresenceUsers((prev) =>
            prev.map((user) =>
              user.socketId === data.socketId ? { ...user, cursor: data.cursor } : user
            )
          )
          eventHandlers.current.cursorUpdate?.(data)
        })

        // Selection update events
        socketInstance.on('selection-update', (data) => {
          setPresenceUsers((prev) =>
            prev.map((user) =>
              user.socketId === data.socketId ? { ...user, selection: data.selection } : user
            )
          )
          eventHandlers.current.selectionUpdate?.(data)
        })

        // Enhanced error handling for new server events
        socketInstance.on('error', (error) => {
          logger.error('Socket error:', error)
        })

        socketInstance.on('operation-error', (error) => {
          logger.error('Operation error:', error)
        })

        socketInstance.on('operation-forbidden', (error) => {
          logger.warn('Operation forbidden:', error)
          // Could show a toast notification to user
        })

        socketInstance.on('operation-confirmed', (data) => {
          logger.debug('Operation confirmed:', data)
        })

        socketInstance.on('workflow-state', (state) => {
          logger.info('Received workflow state from server:', state)
          // This will be used to sync initial state when joining a workflow
        })

        setSocket(socketInstance)

        return () => {
          socketInstance.close()
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        setConnectionError(errorMessage)
        setIsConnecting(false)
        
        if (process.env.NODE_ENV === 'development') {
          logger.warn('Failed to initialize socket:', errorMessage)
        } else {
          logger.warn('Socket initialization failed. Real-time features may be unavailable.')
        }
      }
    }

    // Start the socket initialization
    initializeSocket()
    
    // Cleanup function
    return () => {
      clearRetryTimeout()
    }
  }, [user?.id])

  // Join workflow room
  const joinWorkflow = useCallback(
    (workflowId: string) => {
      if (socket && user?.id) {
        logger.info(`Joining workflow: ${workflowId}`)
        socket.emit('join-workflow', {
          workflowId, // Server gets user info from authenticated session
        })
        setCurrentWorkflowId(workflowId)
      }
    },
    [socket, user]
  )

  // Leave current workflow room
  const leaveWorkflow = useCallback(() => {
    if (socket && currentWorkflowId) {
      logger.info(`Leaving workflow: ${currentWorkflowId}`)
      socket.emit('leave-workflow')
      setCurrentWorkflowId(null)
      setPresenceUsers([])
    }
  }, [socket, currentWorkflowId])

  // Emit workflow operations (blocks, edges, subflows)
  const emitWorkflowOperation = useCallback(
    (operation: string, target: string, payload: any) => {
      if (socket && currentWorkflowId) {
        socket.emit('workflow-operation', {
          operation,
          target,
          payload,
          timestamp: Date.now(),
        })
      }
    },
    [socket, currentWorkflowId]
  )

  // Emit subblock value updates
  const emitSubblockUpdate = useCallback(
    (blockId: string, subblockId: string, value: any) => {
      // Only emit if socket is connected and we're in a valid workflow room
      if (socket && currentWorkflowId) {
        socket.emit('subblock-update', {
          blockId,
          subblockId,
          value,
          timestamp: Date.now(),
        })
      } else {
        logger.warn('Cannot emit subblock update: no socket connection or workflow room', {
          hasSocket: !!socket,
          currentWorkflowId,
          blockId,
          subblockId,
        })
      }
    },
    [socket, currentWorkflowId]
  )

  // Emit cursor position updates
  const emitCursorUpdate = useCallback(
    (cursor: { x: number; y: number }) => {
      if (socket && currentWorkflowId) {
        socket.emit('cursor-update', { cursor })
      }
    },
    [socket, currentWorkflowId]
  )

  // Emit selection updates
  const emitSelectionUpdate = useCallback(
    (selection: { type: 'block' | 'edge' | 'none'; id?: string }) => {
      if (socket && currentWorkflowId) {
        socket.emit('selection-update', { selection })
      }
    },
    [socket, currentWorkflowId]
  )

  // Event handler registration functions
  const onWorkflowOperation = useCallback((handler: (data: any) => void) => {
    eventHandlers.current.workflowOperation = handler
  }, [])

  const onSubblockUpdate = useCallback((handler: (data: any) => void) => {
    eventHandlers.current.subblockUpdate = handler
  }, [])

  const onCursorUpdate = useCallback((handler: (data: any) => void) => {
    eventHandlers.current.cursorUpdate = handler
  }, [])

  const onSelectionUpdate = useCallback((handler: (data: any) => void) => {
    eventHandlers.current.selectionUpdate = handler
  }, [])

  const onUserJoined = useCallback((handler: (data: any) => void) => {
    eventHandlers.current.userJoined = handler
  }, [])

  const onUserLeft = useCallback((handler: (data: any) => void) => {
    eventHandlers.current.userLeft = handler
  }, [])

  const onWorkflowDeleted = useCallback((handler: (data: any) => void) => {
    eventHandlers.current.workflowDeleted = handler
  }, [])

  // Manual retry function
  const retry = useCallback(() => {
    if (isConnecting || isRetrying || isConnected) return
    
    setIsRetrying(true)
    setConnectionError(null)
    
    const delay = getRetryDelay(retryCount)
    logger.info(`Retrying socket connection in ${delay}ms (attempt ${retryCount + 1})`)
    
    retryTimeoutRef.current = setTimeout(() => {
      setRetryCount(prev => prev + 1)
      setIsRetrying(false)
      
      // Trigger reconnection by clearing and re-setting the socket
      if (socket) {
        socket.close()
        setSocket(null)
      }
      
      // The useEffect will reinitialize the socket
    }, delay)
  }, [isConnecting, isRetrying, isConnected, retryCount, socket, getRetryDelay])

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        isConnecting,
        connectionError,
        isRetrying,
        currentWorkflowId,
        presenceUsers,
        joinWorkflow,
        leaveWorkflow,
        emitWorkflowOperation,
        emitSubblockUpdate,
        emitCursorUpdate,
        emitSelectionUpdate,
        retry,
        onWorkflowOperation,
        onSubblockUpdate,
        onCursorUpdate,
        onSelectionUpdate,
        onUserJoined,
        onUserLeft,
        onWorkflowDeleted,
      }}
    >
      {children}
    </SocketContext.Provider>
  )
}
