'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles, Globe, Palette, Eye, Edit3, Rocket, Loader2, ChevronLeft,
  Code, Monitor, Smartphone, Type, Layout, Download, CheckCircle, Plus
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { useAppStore } from '@/store/app-store'
import { toast } from 'sonner'

const THEMES = [
  { id: 'modern', name: 'Modern', color: '#0f3460', description: 'Clean and professional' },
  { id: 'vibrant', name: 'Vibrant', color: '#6c5ce7', description: 'Bold and colorful' },
  { id: 'nature', name: 'Nature', color: '#00b894', description: 'Fresh and organic' },
  { id: 'bold', name: 'Bold', color: '#2d3436', description: 'Strong and impactful' },
]

const CATEGORIES = [
  'Technology', 'Healthcare', 'Education', 'Finance', 'Real Estate',
  'Restaurant & Food', 'Fashion & Beauty', 'Travel & Tourism',
  'Professional Services', 'Retail & E-commerce', 'Agriculture', 'Other',
]

interface Website {
  id: string
  businessName: string
  category: string | null
  description: string | null
  theme: string
  status: string
  htmlContent: string | null
  domain?: { domainName: string } | null
  publishedAt: string | null
  createdAt: string
}

export function AIWebsiteBuilder() {
  const { navigate, user, isAuthenticated, setAuthModalOpen, setAuthModalMode } = useAppStore()
  const [step, setStep] = useState<'form' | 'generating' | 'preview' | 'editing' | 'websites'>('form')
  const [websites, setWebsites] = useState<Website[]>([])
  const [loading, setLoading] = useState(false)
  const [websitesLoading, setWebsitesLoading] = useState(false)

  // Form state
  const [businessName, setBusinessName] = useState('')
  const [category, setCategory] = useState('')
  const [description, setDescription] = useState('')
  const [theme, setTheme] = useState('modern')

  // Preview/edit state
  const [generatedHTML, setGeneratedHTML] = useState('')
  const [currentWebsiteId, setCurrentWebsiteId] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editBusinessName, setEditBusinessName] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop')

  // Publish dialog
  const [publishDialogOpen, setPublishDialogOpen] = useState(false)
  const [publishing, setPublishing] = useState(false)

  useEffect(() => {
    if (step === 'websites') {
      fetchWebsites()
    }
  }, [step])

  const fetchWebsites = async () => {
    setWebsitesLoading(true)
    try {
      const res = await fetch('/api/builder')
      if (res.ok) {
        const data = await res.json()
        setWebsites(data.websites)
      }
    } catch {
      toast.error('Failed to load websites')
    } finally {
      setWebsitesLoading(false)
    }
  }

  const handleGenerate = async () => {
    if (!businessName || !category || !description) {
      toast.error('Please fill in all fields')
      return
    }

    if (!isAuthenticated) {
      setAuthModalMode('signup')
      setAuthModalOpen(true)
      return
    }

    setStep('generating')
    setLoading(true)

    try {
      const res = await fetch('/api/builder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName,
          category,
          description,
          theme,
          userId: user?.id,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setGeneratedHTML(data.html)
        setCurrentWebsiteId(data.website.id)
        setEditBusinessName(businessName)
        setEditDescription(description)
        setTimeout(() => setStep('preview'), 1500)
      } else {
        toast.error('Failed to generate website')
        setStep('form')
      }
    } catch {
      toast.error('Generation failed. Please try again.')
      setStep('form')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateContent = async () => {
    if (!currentWebsiteId) return

    try {
      const res = await fetch('/api/builder', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          websiteId: currentWebsiteId,
          businessName: editBusinessName,
          description: editDescription,
        }),
      })

      if (res.ok) {
        setIsEditing(false)
        toast.success('Website updated')
      }
    } catch {
      toast.error('Failed to update website')
    }
  }

  const handlePublish = async () => {
    if (!currentWebsiteId) return
    setPublishing(true)

    try {
      const res = await fetch('/api/builder', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ websiteId: currentWebsiteId, status: 'published' }),
      })

      if (res.ok) {
        toast.success('Website published! It is now live.')
        setPublishDialogOpen(false)
        setStep('websites')
      }
    } catch {
      toast.error('Failed to publish website')
    } finally {
      setPublishing(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-purple-950 via-slate-900 to-slate-800 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-3 mb-6">
            <button onClick={() => navigate('home')} className="text-white/60 hover:text-white transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-purple-300" />
            </div>
            <h1 className="text-xl font-bold">AI Website Builder</h1>
          </div>

          {/* Step indicators */}
          <div className="flex items-center gap-2 mb-8">
            {[
              { id: 'form', label: 'Details' },
              { id: 'generating', label: 'Generate' },
              { id: 'preview', label: 'Preview' },
            ].map((s, i) => (
              <div key={s.id} className="flex items-center gap-2">
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm ${
                  step === s.id ? 'bg-purple-500/30 text-purple-200' : 'text-white/40'
                }`}>
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                    step === s.id ? 'bg-purple-500 text-white' : 'bg-white/10 text-white/40'
                  }`}>{i + 1}</span>
                  {s.label}
                </div>
                {i < 2 && <div className="w-8 h-px bg-white/20" />}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {/* Step 1: Form */}
          {step === 'form' && (
            <motion.div key="form" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="max-w-3xl mx-auto">
              <Card>
                <CardHeader>
                  <CardTitle>Tell us about your business</CardTitle>
                  <CardDescription>Our AI will generate a professional landing page based on your inputs</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="businessName">Business Name *</Label>
                    <Input
                      id="businessName"
                      placeholder="e.g., Nairobi Coffee House"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Business Category *</Label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map(cat => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Business Description *</Label>
                    <Textarea
                      id="description"
                      placeholder="Describe your business, what you offer, and what makes you unique..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={4}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Choose a Theme</Label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {THEMES.map(t => (
                        <button
                          key={t.id}
                          onClick={() => setTheme(t.id)}
                          className={`p-4 rounded-xl border-2 text-left transition-all ${
                            theme === t.id ? 'border-purple-500 bg-purple-50' : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="w-full h-8 rounded-lg mb-2" style={{ backgroundColor: t.color }} />
                          <p className="font-medium text-sm text-slate-900">{t.name}</p>
                          <p className="text-xs text-slate-500">{t.description}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button variant="outline" onClick={() => setStep('websites')}>
                      My Websites ({websites.length})
                    </Button>
                    <Button onClick={handleGenerate} className="flex-1 bg-purple-600 hover:bg-purple-700">
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate Website
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 2: Generating */}
          {step === 'generating' && (
            <motion.div key="generating" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-20">
              <div className="relative mb-8">
                <div className="w-20 h-20 bg-purple-100 rounded-2xl flex items-center justify-center">
                  <Sparkles className="w-10 h-10 text-purple-600" />
                </div>
                <div className="absolute -top-1 -right-1">
                  <Loader2 className="w-6 h-6 text-purple-500 animate-spin" />
                </div>
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">Generating Your Website</h2>
              <p className="text-slate-500 text-center max-w-md">
                Our AI is crafting a beautiful landing page for <strong>{businessName}</strong>...
              </p>
              <div className="mt-8 w-64 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-purple-600 rounded-full"
                  initial={{ width: '0%' }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 2, ease: 'easeInOut' }}
                />
              </div>
            </motion.div>
          )}

          {/* Step 3: Preview */}
          {(step === 'preview' || step === 'editing') && generatedHTML && (
            <motion.div key="preview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-6xl mx-auto">
              {/* Toolbar */}
              <div className="flex items-center justify-between mb-4 bg-white rounded-xl p-3 shadow-sm border">
                <div className="flex items-center gap-2">
                  <button onClick={() => setStep('form')} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <Separator orientation="vertical" className="h-6" />
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setPreviewMode('desktop')}
                      className={`p-2 rounded-lg transition-colors ${previewMode === 'desktop' ? 'bg-slate-100' : 'hover:bg-slate-50'}`}
                    >
                      <Monitor className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setPreviewMode('mobile')}
                      className={`p-2 rounded-lg transition-colors ${previewMode === 'mobile' ? 'bg-slate-100' : 'hover:bg-slate-50'}`}
                    >
                      <Smartphone className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setIsEditing(!isEditing)}>
                    <Edit3 className="w-4 h-4 mr-1" />
                    {isEditing ? 'Done' : 'Edit'}
                  </Button>
                  <Button size="sm" className="bg-purple-600 hover:bg-purple-700" onClick={() => setPublishDialogOpen(true)}>
                    <Rocket className="w-4 h-4 mr-1" />
                    Publish
                  </Button>
                </div>
              </div>

              <div className="flex gap-4">
                {/* Edit panel */}
                {isEditing && (
                  <motion.div
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: 320, opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    className="flex-shrink-0"
                  >
                    <Card className="sticky top-4">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm">Edit Content</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <Label className="text-xs">Business Name</Label>
                          <Input
                            value={editBusinessName}
                            onChange={(e) => setEditBusinessName(e.target.value)}
                            className="text-sm"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">Description</Label>
                          <Textarea
                            value={editDescription}
                            onChange={(e) => setEditDescription(e.target.value)}
                            rows={4}
                            className="text-sm"
                          />
                        </div>
                        <Button size="sm" onClick={handleUpdateContent} className="w-full bg-purple-600 hover:bg-purple-700">
                          Save Changes
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}

                {/* Preview iframe */}
                <div className={`flex-1 ${previewMode === 'mobile' ? 'flex justify-center' : ''}`}>
                  <div className={`bg-white rounded-xl shadow-lg border overflow-hidden transition-all ${
                    previewMode === 'mobile' ? 'w-[375px] h-[667px]' : 'w-full'
                  }`}>
                    <iframe
                      srcDoc={generatedHTML}
                      className="w-full h-full border-0"
                      style={{ minHeight: previewMode === 'mobile' ? '667px' : '800px' }}
                      title="Website Preview"
                      sandbox="allow-same-origin"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* My Websites */}
          {step === 'websites' && (
            <motion.div key="websites" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-4xl mx-auto">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">My Websites</h2>
                  <p className="text-sm text-slate-500">{websites.length} website{websites.length !== 1 ? 's' : ''}</p>
                </div>
                <Button onClick={() => setStep('form')} className="bg-purple-600 hover:bg-purple-700">
                  <Plus className="w-4 h-4 mr-1" /> New Website
                </Button>
              </div>

              {websitesLoading ? (
                <div className="space-y-3">
                  {[1, 2].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}
                </div>
              ) : websites.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Sparkles className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">No websites yet</h3>
                    <p className="text-slate-500 mb-6">Create your first AI-powered website</p>
                    <Button onClick={() => setStep('form')} className="bg-purple-600 hover:bg-purple-700">
                      <Sparkles className="w-4 h-4 mr-1" /> Create Website
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {websites.map(site => (
                    <Card key={site.id} className="hover:shadow-md transition-all overflow-hidden">
                      {/* Mini preview */}
                      <div className="h-32 bg-gradient-to-br from-slate-100 to-slate-50 flex items-center justify-center relative">
                        <Globe className="w-12 h-12 text-slate-300" />
                        <Badge className={`absolute top-3 right-3 ${
                          site.status === 'published' ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-600'
                        }`}>
                          {site.status}
                        </Badge>
                      </div>
                      <CardContent className="p-4">
                        <h3 className="font-semibold text-slate-900 mb-1">{site.businessName}</h3>
                        <p className="text-sm text-slate-500 mb-3 line-clamp-1">{site.description || 'No description'}</p>
                        <div className="flex items-center gap-2 text-xs text-slate-400 mb-3">
                          <Badge variant="outline" className="text-xs">{site.category}</Badge>
                          <span>{new Date(site.createdAt).toLocaleDateString()}</span>
                          {site.domain && (
                            <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700">
                              {site.domain.domainName}
                            </Badge>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => {
                              setGeneratedHTML(site.htmlContent || '')
                              setCurrentWebsiteId(site.id)
                              setEditBusinessName(site.businessName)
                              setEditDescription(site.description || '')
                              setStep('preview')
                            }}
                          >
                            <Eye className="w-3 h-3 mr-1" /> Preview
                          </Button>
                          {site.status === 'draft' && (
                            <Button
                              size="sm"
                              className="flex-1 bg-purple-600 hover:bg-purple-700"
                              onClick={() => {
                                setCurrentWebsiteId(site.id)
                                setPublishDialogOpen(true)
                              }}
                            >
                              <Rocket className="w-3 h-3 mr-1" /> Publish
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Publish Dialog */}
      <Dialog open={publishDialogOpen} onOpenChange={setPublishDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Publish Your Website</DialogTitle>
            <DialogDescription>
              Your website will be live and accessible to everyone. Connect a custom domain for a professional web address.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-emerald-50 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
              <span className="text-sm font-medium text-emerald-900">Free subdomain included</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
              <span className="text-sm font-medium text-emerald-900">SSL certificate included</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
              <span className="text-sm font-medium text-emerald-900">Mobile responsive design</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
              <span className="text-sm font-medium text-emerald-900">Fast hosting included</span>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setPublishDialogOpen(false)}>Cancel</Button>
            <Button onClick={handlePublish} disabled={publishing} className="bg-purple-600 hover:bg-purple-700">
              {publishing ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Publishing...</> : <><Rocket className="w-4 h-4 mr-2" /> Publish Now</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
