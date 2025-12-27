import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { X, Filter, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'

export function FilterPanel({ 
  sources = [], 
  onFiltersChange,
  className 
}) {
  const [isOpen, setIsOpen] = useState(true)
  const [selectedSources, setSelectedSources] = useState([])

  const handleSourceToggle = (source) => {
    const newSources = selectedSources.includes(source)
      ? selectedSources.filter(s => s !== source)
      : [...selectedSources, source]
    setSelectedSources(newSources)
    onFiltersChange?.({ sources: newSources })
  }

  const clearAllFilters = () => {
    setSelectedSources([])
    onFiltersChange?.({ sources: [] })
  }

  const hasActiveFilters = selectedSources.length > 0

  return (
    <Card className={cn('sticky top-4', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="h-7 text-xs"
          >
            <X className="mr-1 h-3 w-3" />
            Clear all
          </Button>
        )}
      </CardHeader>
      {isOpen && (
        <CardContent className="space-y-6">
          {/* Sources Filter */}
          {sources.length > 0 && (
            <div>
              <Label className="text-sm font-medium mb-3 block">Organizations</Label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {sources.map((source) => (
                  <div key={source} className="flex items-center space-x-2">
                    <Checkbox
                      id={`source-${source}`}
                      checked={selectedSources.includes(source)}
                      onCheckedChange={() => handleSourceToggle(source)}
                    />
                    <Label
                      htmlFor={`source-${source}`}
                      className="text-sm font-normal cursor-pointer flex-1"
                    >
                      {source}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Separator />


          {/* Active Filters */}
          {hasActiveFilters && (
            <>
              <Separator />
              <div>
                <Label className="text-sm font-medium mb-2 block">Active Filters</Label>
                <div className="flex flex-wrap gap-2">
                  {selectedSources.map((source) => (
                    <Badge key={source} variant="secondary" className="gap-1">
                      {source}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => handleSourceToggle(source)}
                      />
                    </Badge>
                  ))}
                </div>
              </div>
            </>
          )}
        </CardContent>
      )}
    </Card>
  )
}

