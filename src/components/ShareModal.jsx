import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Copy, Check, Mail, Twitter, Facebook, Linkedin } from 'lucide-react'
import { toast } from 'sonner'

export function ShareModal({ open, onOpenChange, program }) {
  const [copied, setCopied] = useState(false)
  const shareUrl = typeof window !== 'undefined' ? window.location.href : ''

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    toast.success('Link copied to clipboard!')
    setTimeout(() => setCopied(false), 2000)
  }

  const shareViaEmail = () => {
    const subject = encodeURIComponent(`Funding Opportunity: ${program?.name || 'Program'}`)
    const body = encodeURIComponent(`Check out this funding opportunity:\n\n${program?.name || ''}\n\n${shareUrl}`)
    window.location.href = `mailto:?subject=${subject}&body=${body}`
  }

  const shareViaTwitter = () => {
    const text = encodeURIComponent(`Check out this funding opportunity: ${program?.name || 'Program'}`)
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(shareUrl)}`, '_blank')
  }

  const shareViaFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank')
  }

  const shareViaLinkedIn = () => {
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`, '_blank')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share Program</DialogTitle>
          <DialogDescription>
            Share this funding opportunity with others
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="share-url">Share Link</Label>
            <div className="flex gap-2">
              <Input id="share-url" value={shareUrl} readOnly />
              <Button
                variant="outline"
                size="icon"
                onClick={copyToClipboard}
                aria-label="Copy link"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Share via</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" onClick={shareViaEmail} className="justify-start">
                <Mail className="mr-2 h-4 w-4" />
                Email
              </Button>
              <Button variant="outline" onClick={shareViaTwitter} className="justify-start">
                <Twitter className="mr-2 h-4 w-4" />
                Twitter
              </Button>
              <Button variant="outline" onClick={shareViaFacebook} className="justify-start">
                <Facebook className="mr-2 h-4 w-4" />
                Facebook
              </Button>
              <Button variant="outline" onClick={shareViaLinkedIn} className="justify-start">
                <Linkedin className="mr-2 h-4 w-4" />
                LinkedIn
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

