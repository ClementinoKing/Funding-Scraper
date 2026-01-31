import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { 
  triggerBusinessMatching, 
  checkPendingMatches, 
  getBusinessMatches 
} from '@/lib/triggerMatching';
import { subscribeToBusinessMatches } from '@/lib/realtimeMatching';

export function BusinessMatchingStatus({ businessId }) {
  const [matches, setMatches] = useState([]);
  const [pending, setPending] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  const loadMatchStatus = async () => {
    setLoading(true);
    
    // Check pending status
    const pendingResult = await checkPendingMatches(businessId);
    setPending(pendingResult.hasPending);
    
    // Load existing matches
    const matchesResult = await getBusinessMatches(businessId);
    if (matchesResult.data) {
      setMatches(matchesResult.data);
      if (matchesResult.data.length > 0) {
        setLastUpdated(matchesResult.data[0].created_at);
      }
    }
    
    setLoading(false);
  };

  const triggerMatching = async (useAI = true) => {
    setRefreshing(true);
    const result = await triggerBusinessMatching(businessId, useAI);
    if (result.success) {
      setPending(true);
      // Wait a moment then refresh
      setTimeout(() => loadMatchStatus(), 2000);
    }
    setRefreshing(false);
  };

  const matchStats = {
    total: matches.length,
    excellent: matches.filter(m => m.match_score >= 80).length,
    good: matches.filter(m => m.match_score >= 60 && m.match_score < 80).length,
    averageScore: matches.length > 0 
      ? Math.round(matches.reduce((sum, m) => sum + m.match_score, 0) / matches.length)
      : 0,
  };

  useEffect(() => {
    (async () => loadMatchStatus())();
    
    // Subscribe to real-time updates
    const unsubscribe = subscribeToBusinessMatches(businessId, (update) => {
      if (update.type === 'matching_completed') {
        loadMatchStatus();
      } else {
        setMatches(prev => [update, ...prev]);
      }
    });

    return () => unsubscribe();
  }, [businessId]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Program Matching</span>
          <div className="flex items-center gap-2">
            {pending && (
              <Badge variant="outline" className="gap-1">
                <Clock className="w-3 h-3" />
                Processing
              </Badge>
            )}
            <Badge variant={matchStats.total > 0 ? "default" : "secondary"}>
              {matchStats.total} matches
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-1">
            <div className="text-sm font-medium text-muted-foreground">Total Matches</div>
            <div className="text-2xl font-bold">{matchStats.total}</div>
          </div>
          <div className="space-y-1">
            <div className="text-sm font-medium text-muted-foreground">Excellent</div>
            <div className="text-2xl font-bold text-emerald-600">{matchStats.excellent}</div>
          </div>
          <div className="space-y-1">
            <div className="text-sm font-medium text-muted-foreground">Average Score</div>
            <div className="text-2xl font-bold">{matchStats.averageScore}%</div>
          </div>
          <div className="space-y-1">
            <div className="text-sm font-medium text-muted-foreground">Last Updated</div>
            <div className="text-sm">
              {lastUpdated ? new Date(lastUpdated).toLocaleDateString() : 'Never'}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-2 pt-2">
          <Button 
            onClick={() => triggerMatching(true)}
            disabled={pending || refreshing}
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh Matches (AI)
          </Button>
          <Button 
            variant="outline"
            onClick={() => triggerMatching(false)}
            disabled={pending || refreshing}
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Quick Refresh
          </Button>
          <Button 
            variant="ghost"
            onClick={loadMatchStatus}
            disabled={loading}
          >
            Check Status
          </Button>
        </div>

        {/* Status Message */}
        {pending && (
          <div className="flex items-center gap-2 text-amber-600 bg-amber-50 dark:bg-amber-950/20 p-3 rounded-md">
            <Clock className="w-4 h-4" />
            <span className="text-sm">Matches are being processed. This may take a minute...</span>
          </div>
        )}

        {/* Top Matches Preview */}
        {matches.length > 0 && (
          <div className="pt-4 border-t">
            <h4 className="font-medium mb-2">Top Matches</h4>
            <div className="space-y-2">
              {matches.slice(0, 3).map((match) => (
                <div key={match.id} className="flex items-center justify-between p-2 rounded bg-muted/50">
                  <div>
                    <div className="font-medium text-sm">Program #{match.program_id}</div>
                    <div className="text-xs text-muted-foreground">
                      Score: {match.match_score}%
                      {match.ai_score && ` (AI: ${match.ai_score}%)`}
                    </div>
                  </div>
                  <Badge variant={match.match_score >= 80 ? "default" : "secondary"}>
                    {match.match_score >= 80 ? 'Excellent' : 
                     match.match_score >= 60 ? 'Good' : 'Fair'}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}