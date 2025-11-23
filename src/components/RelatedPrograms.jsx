import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowRight } from 'lucide-react'
import { ProgramCard } from './ProgramCard'
import { slugifyFunding } from '@/lib/utils'

export function RelatedPrograms({ programs, currentProgramId, maxItems = 3 }) {
  // Filter out the current program and limit results
  const related = programs
    .filter(p => p.id !== currentProgramId)
    .slice(0, maxItems)

  if (related.length === 0) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Related Programs</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {related.map((program) => (
            <ProgramCard key={program.id} program={program} variant="grid" />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

