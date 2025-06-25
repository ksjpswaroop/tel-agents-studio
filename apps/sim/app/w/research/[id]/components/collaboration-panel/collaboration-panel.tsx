'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Users,
  Share2,
  Mail,
  Link,
  Copy,
  Settings,
  UserPlus,
  Crown,
  Eye,
  Edit,
  MessageSquare,
  Bell,
  Clock,
  Globe,
  Lock,
  Trash2,
  MoreVertical,
  Send,
  Hash,
  Download,
  ExternalLink,
  Shield,
  CheckCircle,
  AlertCircle,
  Calendar,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

interface ResearchSession {
  id: string
  title: string
  status: string
  [key: string]: any
}

interface Collaborator {
  id: string
  name: string
  email: string
  avatar?: string
  role: 'owner' | 'editor' | 'viewer' | 'commenter'
  status: 'active' | 'invited' | 'inactive'
  joinedAt: string
  lastActive: string
}

interface ShareLink {
  id: string
  name: string
  url: string
  permissions: 'view' | 'comment' | 'edit'
  expiresAt?: string
  createdAt: string
  accessCount: number
  isActive: boolean
}

interface Comment {
  id: string
  userId: string
  userName: string
  userAvatar?: string
  content: string
  createdAt: string
  updatedAt?: string
  isResolved: boolean
  replies: Comment[]
}

interface CollaborationPanelProps {
  session: ResearchSession
  onShare: () => void
}

const roleConfig = {
  owner: { label: 'Owner', icon: Crown, color: 'text-yellow-500', canEdit: true, canShare: true },
  editor: { label: 'Editor', icon: Edit, color: 'text-blue-500', canEdit: true, canShare: true },
  commenter: { label: 'Commenter', icon: MessageSquare, color: 'text-green-500', canEdit: false, canShare: false },
  viewer: { label: 'Viewer', icon: Eye, color: 'text-gray-500', canEdit: false, canShare: false },
}

const permissionConfig = {
  view: { label: 'Can view', icon: Eye, description: 'Can view the research and results' },
  comment: { label: 'Can comment', icon: MessageSquare, description: 'Can view and add comments' },
  edit: { label: 'Can edit', icon: Edit, description: 'Can edit research parameters and view results' },
}

// Mock data generators
const generateMockCollaborators = (sessionId: string): Collaborator[] => {
  return [
    {
      id: 'user-1',
      name: 'Alice Johnson',
      email: 'alice@company.com',
      avatar: '',
      role: 'owner',
      status: 'active',
      joinedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      lastActive: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    },
    {
      id: 'user-2',
      name: 'Bob Smith',
      email: 'bob@company.com',
      avatar: '',
      role: 'editor',
      status: 'active',
      joinedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      lastActive: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'user-3',
      name: 'Carol Davis',
      email: 'carol@company.com',
      avatar: '',
      role: 'commenter',
      status: 'active',
      joinedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      lastActive: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'user-4',
      name: 'David Wilson',
      email: 'david@external.com',
      avatar: '',
      role: 'viewer',
      status: 'invited',
      joinedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      lastActive: '',
    },
  ]
}

const generateMockShareLinks = (sessionId: string): ShareLink[] => {
  return [
    {
      id: 'link-1',
      name: 'Public Research Link',
      url: `https://app.example.com/research/${sessionId}/view?token=abc123`,
      permissions: 'view',
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      accessCount: 15,
      isActive: true,
    },
    {
      id: 'link-2',
      name: 'Review Link for Stakeholders',
      url: `https://app.example.com/research/${sessionId}/comment?token=def456`,
      permissions: 'comment',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      accessCount: 8,
      isActive: true,
    },
  ]
}

const generateMockComments = (sessionId: string): Comment[] => {
  return [
    {
      id: 'comment-1',
      userId: 'user-2',
      userName: 'Bob Smith',
      userAvatar: '',
      content: 'The methodology section looks comprehensive. Have we considered including more recent sources from 2024?',
      createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      isResolved: false,
      replies: [
        {
          id: 'reply-1',
          userId: 'user-1',
          userName: 'Alice Johnson',
          content: 'Great point! I\'ll add a filter for 2024 sources in the next iteration.',
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          isResolved: false,
          replies: [],
        },
      ],
    },
    {
      id: 'comment-2',
      userId: 'user-3',
      userName: 'Carol Davis',
      content: 'The AI confidence scores are very helpful. Could we also show the source credibility ratings?',
      createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      isResolved: true,
      replies: [],
    },
  ]
}

export function CollaborationPanel({ session, onShare }: CollaborationPanelProps) {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([])
  const [shareLinks, setShareLinks] = useState<ShareLink[]>([])
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<Collaborator['role']>('viewer')
  const [newComment, setNewComment] = useState('')
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false)
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false)

  // Share settings
  const [shareSettings, setShareSettings] = useState({
    publicAccess: false,
    allowComments: true,
    allowDownloads: false,
    requireAuth: true,
    expiry: '30d',
  })

  // Fetch data
  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const collaboratorsData = generateMockCollaborators(session.id)
      const shareLinksData = generateMockShareLinks(session.id)
      const commentsData = generateMockComments(session.id)
      
      setCollaborators(collaboratorsData)
      setShareLinks(shareLinksData)
      setComments(commentsData)
    } catch (error) {
      console.error('Error fetching collaboration data:', error)
    } finally {
      setLoading(false)
    }
  }, [session.id])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleInviteUser = async () => {
    if (!inviteEmail.trim()) return

    try {
      const newCollaborator: Collaborator = {
        id: `user-${Date.now()}`,
        name: inviteEmail.split('@')[0],
        email: inviteEmail,
        role: inviteRole,
        status: 'invited',
        joinedAt: new Date().toISOString(),
        lastActive: '',
      }

      setCollaborators(prev => [...prev, newCollaborator])
      setInviteEmail('')
      setIsInviteDialogOpen(false)
    } catch (error) {
      console.error('Error inviting user:', error)
    }
  }

  const handleCreateShareLink = async () => {
    try {
      const newLink: ShareLink = {
        id: `link-${Date.now()}`,
        name: 'Research Share Link',
        url: `https://app.example.com/research/${session.id}/view?token=${Math.random().toString(36).substr(2, 8)}`,
        permissions: 'view',
        expiresAt: shareSettings.expiry === 'never' ? undefined : 
          new Date(Date.now() + (parseInt(shareSettings.expiry) * 24 * 60 * 60 * 1000)).toISOString(),
        createdAt: new Date().toISOString(),
        accessCount: 0,
        isActive: true,
      }

      setShareLinks(prev => [...prev, newLink])
      setIsShareDialogOpen(false)
    } catch (error) {
      console.error('Error creating share link:', error)
    }
  }

  const handleAddComment = async () => {
    if (!newComment.trim()) return

    try {
      const comment: Comment = {
        id: `comment-${Date.now()}`,
        userId: 'current-user',
        userName: 'You',
        content: newComment,
        createdAt: new Date().toISOString(),
        isResolved: false,
        replies: [],
      }

      setComments(prev => [comment, ...prev])
      setNewComment('')
    } catch (error) {
      console.error('Error adding comment:', error)
    }
  }

  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(url)
  }

  const handleRemoveCollaborator = (collaboratorId: string) => {
    setCollaborators(prev => prev.filter(c => c.id !== collaboratorId))
  }

  const handleToggleShareLink = (linkId: string) => {
    setShareLinks(prev => prev.map(link => 
      link.id === linkId ? { ...link, isActive: !link.isActive } : link
    ))
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getRelativeTime = (dateString: string) => {
    if (!dateString) return 'Never'
    
    const now = Date.now()
    const time = new Date(dateString).getTime()
    const diff = now - time
    
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return `${days}d ago`
  }

  if (loading) {
    return (
      <div className='p-4 flex items-center justify-center h-64'>
        <div className='text-center space-y-2'>
          <div className='animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto'></div>
          <p className='text-sm text-muted-foreground'>Loading collaboration...</p>
        </div>
      </div>
    )
  }

  return (
    <div className='flex flex-col h-full'>
      {/* Header */}
      <div className='p-4 border-b'>
        <div className='flex items-center justify-between mb-3'>
          <div className='flex items-center space-x-2'>
            <Users className='h-4 w-4 text-primary' />
            <h3 className='font-medium'>Collaboration</h3>
            <Badge variant='secondary' className='text-xs'>
              {collaborators.filter(c => c.status === 'active').length} active
            </Badge>
          </div>
          <div className='flex items-center space-x-2'>
            <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
              <DialogTrigger asChild>
                <Button variant='outline' size='sm' className='text-xs'>
                  <UserPlus className='h-3 w-3 mr-1' />
                  Invite
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Invite Collaborator</DialogTitle>
                  <DialogDescription>
                    Invite someone to collaborate on this research
                  </DialogDescription>
                </DialogHeader>
                <div className='space-y-4'>
                  <div className='space-y-2'>
                    <Label>Email Address</Label>
                    <Input
                      placeholder='colleague@company.com'
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label>Role</Label>
                    <Select value={inviteRole} onValueChange={(value: any) => setInviteRole(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(roleConfig).filter(([key]) => key !== 'owner').map(([key, config]) => (
                          <SelectItem key={key} value={key}>
                            <div className='flex items-center space-x-2'>
                              <config.icon className={`h-3 w-3 ${config.color}`} />
                              <span>{config.label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className='flex justify-end space-x-2'>
                    <Button variant='outline' onClick={() => setIsInviteDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleInviteUser}>
                      Send Invite
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
              <DialogTrigger asChild>
                <Button variant='outline' size='sm' className='text-xs'>
                  <Share2 className='h-3 w-3 mr-1' />
                  Share
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Share Link</DialogTitle>
                  <DialogDescription>
                    Generate a shareable link for this research
                  </DialogDescription>
                </DialogHeader>
                <div className='space-y-4'>
                  <div className='space-y-3'>
                    <div className='flex items-center justify-between'>
                      <Label>Public Access</Label>
                      <Switch
                        checked={shareSettings.publicAccess}
                        onCheckedChange={(checked) =>
                          setShareSettings(prev => ({ ...prev, publicAccess: checked }))
                        }
                      />
                    </div>
                    <div className='flex items-center justify-between'>
                      <Label>Allow Comments</Label>
                      <Switch
                        checked={shareSettings.allowComments}
                        onCheckedChange={(checked) =>
                          setShareSettings(prev => ({ ...prev, allowComments: checked }))
                        }
                      />
                    </div>
                    <div className='flex items-center justify-between'>
                      <Label>Allow Downloads</Label>
                      <Switch
                        checked={shareSettings.allowDownloads}
                        onCheckedChange={(checked) =>
                          setShareSettings(prev => ({ ...prev, allowDownloads: checked }))
                        }
                      />
                    </div>
                  </div>
                  <div className='space-y-2'>
                    <Label>Expiry</Label>
                    <Select
                      value={shareSettings.expiry}
                      onValueChange={(value) =>
                        setShareSettings(prev => ({ ...prev, expiry: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='7'>7 days</SelectItem>
                        <SelectItem value='30'>30 days</SelectItem>
                        <SelectItem value='90'>90 days</SelectItem>
                        <SelectItem value='never'>Never</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className='flex justify-end space-x-2'>
                    <Button variant='outline' onClick={() => setIsShareDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateShareLink}>
                      Create Link
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      <Tabs defaultValue='people' className='flex-1 flex flex-col'>
        <TabsList className='grid w-full grid-cols-3 mx-4 mt-2'>
          <TabsTrigger value='people' className='text-xs'>People</TabsTrigger>
          <TabsTrigger value='links' className='text-xs'>Links</TabsTrigger>
          <TabsTrigger value='activity' className='text-xs'>Activity</TabsTrigger>
        </TabsList>

        {/* People Tab */}
        <TabsContent value='people' className='flex-1 mt-2'>
          <ScrollArea className='h-full'>
            <div className='p-4 space-y-3'>
              {collaborators.map((collaborator) => {
                const RoleIcon = roleConfig[collaborator.role].icon

                return (
                  <Card key={collaborator.id}>
                    <CardContent className='p-3'>
                      <div className='flex items-center space-x-3'>
                        <Avatar className='h-8 w-8'>
                          <AvatarImage src={collaborator.avatar} />
                          <AvatarFallback className='text-xs'>
                            {collaborator.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className='flex-1 min-w-0'>
                          <div className='flex items-center space-x-2 mb-1'>
                            <h4 className='font-medium text-sm truncate'>
                              {collaborator.name}
                            </h4>
                            <Badge
                              variant={collaborator.status === 'active' ? 'default' : 'secondary'}
                              className='text-xs'
                            >
                              <RoleIcon className={`h-2 w-2 mr-1 ${roleConfig[collaborator.role].color}`} />
                              {roleConfig[collaborator.role].label}
                            </Badge>
                          </div>
                          <div className='flex items-center space-x-2 text-xs text-muted-foreground'>
                            <span>{collaborator.email}</span>
                            {collaborator.status === 'active' && (
                              <>
                                <span>•</span>
                                <span>Active {getRelativeTime(collaborator.lastActive)}</span>
                              </>
                            )}
                            {collaborator.status === 'invited' && (
                              <Badge variant='outline' className='text-xs'>
                                Pending
                              </Badge>
                            )}
                          </div>
                        </div>

                        {collaborator.role !== 'owner' && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant='ghost' size='sm' className='h-6 w-6 p-0'>
                                <MoreVertical className='h-3 w-3' />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align='end'>
                              <DropdownMenuItem>
                                <Settings className='h-3 w-3 mr-2' />
                                Change Role
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Mail className='h-3 w-3 mr-2' />
                                Send Message
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleRemoveCollaborator(collaborator.id)}
                                className='text-red-600'
                              >
                                <Trash2 className='h-3 w-3 mr-2' />
                                Remove
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Links Tab */}
        <TabsContent value='links' className='flex-1 mt-2'>
          <ScrollArea className='h-full'>
            <div className='p-4 space-y-3'>
              {shareLinks.map((link) => {
                const PermissionIcon = permissionConfig[link.permissions].icon

                return (
                  <Card key={link.id}>
                    <CardContent className='p-3'>
                      <div className='space-y-3'>
                        <div className='flex items-start justify-between'>
                          <div className='flex-1'>
                            <div className='flex items-center space-x-2 mb-1'>
                              <h4 className='font-medium text-sm'>{link.name}</h4>
                              <Badge
                                variant={link.isActive ? 'default' : 'secondary'}
                                className='text-xs'
                              >
                                <PermissionIcon className='h-2 w-2 mr-1' />
                                {permissionConfig[link.permissions].label}
                              </Badge>
                            </div>
                            <div className='flex items-center space-x-2 text-xs text-muted-foreground'>
                              <span>{link.accessCount} views</span>
                              <span>•</span>
                              <span>Created {formatDate(link.createdAt)}</span>
                              {link.expiresAt && (
                                <>
                                  <span>•</span>
                                  <span>Expires {formatDate(link.expiresAt)}</span>
                                </>
                              )}
                            </div>
                          </div>
                          <Switch
                            checked={link.isActive}
                            onCheckedChange={() => handleToggleShareLink(link.id)}
                          />
                        </div>

                        <div className='flex items-center space-x-2'>
                          <div className='flex-1 p-2 bg-muted rounded text-xs font-mono truncate'>
                            {link.url}
                          </div>
                          <Button
                            variant='outline'
                            size='sm'
                            onClick={() => handleCopyLink(link.url)}
                            className='h-8 px-2'
                          >
                            <Copy className='h-3 w-3' />
                          </Button>
                        </div>

                        <div className='flex items-center space-x-2'>
                          <Button variant='outline' size='sm' className='text-xs'>
                            <Settings className='h-3 w-3 mr-1' />
                            Settings
                          </Button>
                          <Button variant='outline' size='sm' className='text-xs'>
                            <ExternalLink className='h-3 w-3 mr-1' />
                            Preview
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}

              {shareLinks.length === 0 && (
                <div className='text-center py-8'>
                  <Share2 className='h-12 w-12 text-muted-foreground mx-auto mb-4' />
                  <h3 className='font-medium mb-2'>No share links yet</h3>
                  <p className='text-sm text-muted-foreground mb-4'>
                    Create shareable links to give others access to this research
                  </p>
                  <Button onClick={() => setIsShareDialogOpen(true)}>
                    <Share2 className='h-4 w-4 mr-2' />
                    Create Share Link
                  </Button>
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value='activity' className='flex-1 mt-2'>
          <div className='flex flex-col h-full'>
            {/* Comments Input */}
            <div className='p-4 border-b'>
              <div className='space-y-3'>
                <Textarea
                  placeholder='Add a comment...'
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows={2}
                />
                <div className='flex justify-end'>
                  <Button
                    onClick={handleAddComment}
                    disabled={!newComment.trim()}
                    size='sm'
                  >
                    <Send className='h-3 w-3 mr-2' />
                    Comment
                  </Button>
                </div>
              </div>
            </div>

            {/* Comments List */}
            <ScrollArea className='flex-1'>
              <div className='p-4 space-y-4'>
                {comments.map((comment) => (
                  <Card key={comment.id} className={comment.isResolved ? 'opacity-60' : ''}>
                    <CardContent className='p-3'>
                      <div className='space-y-3'>
                        <div className='flex items-start space-x-3'>
                          <Avatar className='h-6 w-6'>
                            <AvatarImage src={comment.userAvatar} />
                            <AvatarFallback className='text-xs'>
                              {comment.userName.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          
                          <div className='flex-1'>
                            <div className='flex items-center space-x-2 mb-1'>
                              <span className='font-medium text-sm'>{comment.userName}</span>
                              <span className='text-xs text-muted-foreground'>
                                {formatDate(comment.createdAt)}
                              </span>
                              {comment.isResolved && (
                                <Badge variant='outline' className='text-xs'>
                                  <CheckCircle className='h-2 w-2 mr-1' />
                                  Resolved
                                </Badge>
                              )}
                            </div>
                            <p className='text-sm'>{comment.content}</p>
                          </div>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant='ghost' size='sm' className='h-6 w-6 p-0'>
                                <MoreVertical className='h-3 w-3' />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align='end'>
                              <DropdownMenuItem>
                                <MessageSquare className='h-3 w-3 mr-2' />
                                Reply
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <CheckCircle className='h-3 w-3 mr-2' />
                                {comment.isResolved ? 'Unresolve' : 'Resolve'}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className='text-red-600'>
                                <Trash2 className='h-3 w-3 mr-2' />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        {/* Replies */}
                        {comment.replies.length > 0 && (
                          <div className='pl-6 space-y-2 border-l-2 border-muted'>
                            {comment.replies.map((reply) => (
                              <div key={reply.id} className='flex items-start space-x-2'>
                                <Avatar className='h-5 w-5'>
                                  <AvatarFallback className='text-xs'>
                                    {reply.userName.split(' ').map(n => n[0]).join('')}
                                  </AvatarFallback>
                                </Avatar>
                                <div className='flex-1'>
                                  <div className='flex items-center space-x-2 mb-1'>
                                    <span className='font-medium text-xs'>{reply.userName}</span>
                                    <span className='text-xs text-muted-foreground'>
                                      {formatDate(reply.createdAt)}
                                    </span>
                                  </div>
                                  <p className='text-xs'>{reply.content}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {comments.length === 0 && (
                  <div className='text-center py-8'>
                    <MessageSquare className='h-12 w-12 text-muted-foreground mx-auto mb-4' />
                    <h3 className='font-medium mb-2'>No comments yet</h3>
                    <p className='text-sm text-muted-foreground'>
                      Start a discussion about this research
                    </p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}