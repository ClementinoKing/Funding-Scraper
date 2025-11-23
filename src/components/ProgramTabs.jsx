import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, CheckCircle2, Calendar, Mail, Phone } from 'lucide-react'

export function ProgramTabs({ program }) {
  return (
    <Tabs defaultValue="overview" className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="eligibility">Eligibility</TabsTrigger>
        <TabsTrigger value="application">Application</TabsTrigger>
        <TabsTrigger value="timeline">Timeline</TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="mt-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Program Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {program.summary && (
              <div>
                <h4 className="font-semibold mb-2">Summary</h4>
                <p className="text-muted-foreground whitespace-pre-wrap">{program.summary}</p>
              </div>
            )}
            {program.sectors && (
              <div>
                <h4 className="font-semibold mb-2">Sectors</h4>
                <p className="text-muted-foreground">{program.sectors}</p>
              </div>
            )}
            {program.source && (
              <div>
                <h4 className="font-semibold mb-2">Source</h4>
                <a
                  href={program.source}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  {program.source}
                </a>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="eligibility" className="mt-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              Eligibility Requirements
            </CardTitle>
          </CardHeader>
          <CardContent>
            {program.eligibility ? (
              <p className="text-muted-foreground whitespace-pre-wrap">{program.eligibility}</p>
            ) : (
              <p className="text-muted-foreground">No eligibility information available.</p>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="application" className="mt-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Application Process
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {program.applicationProcess ? (
              <p className="text-muted-foreground whitespace-pre-wrap">{program.applicationProcess}</p>
            ) : (
              <p className="text-muted-foreground">No application process information available.</p>
            )}
            
            {(program.contactEmail || program.contactPhone) && (
              <div className="pt-4 border-t space-y-2">
                <h4 className="font-semibold">Contact Information</h4>
                {program.contactEmail && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <a
                      href={`mailto:${program.contactEmail}`}
                      className="text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      {program.contactEmail}
                    </a>
                  </div>
                )}
                {program.contactPhone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <a
                      href={`tel:${program.contactPhone}`}
                      className="text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      {program.contactPhone}
                    </a>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="timeline" className="mt-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Important Dates
            </CardTitle>
          </CardHeader>
          <CardContent>
            {program.deadlines ? (
              <div>
                <h4 className="font-semibold mb-2">Deadlines</h4>
                <p className="text-muted-foreground whitespace-pre-wrap">{program.deadlines}</p>
              </div>
            ) : (
              <p className="text-muted-foreground">No deadline information available.</p>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}

