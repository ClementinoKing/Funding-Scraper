import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, Percent, Clock, CheckCircle2, Calendar, Scale } from 'lucide-react';
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
      console.log("Loaded matches:", matchesResult.data);
      if (matchesResult.data.length > 0) {
        setLastUpdated(matchesResult.data[0].created_at);
      }
    }
    
    setLoading(false);
  };

  const triggerMatching = async (useAI = true) => {
    setRefreshing(true);
    const result = await triggerBusinessMatching(businessId, useAI);
    console.log("Trigger matching result:", result);
    if (result.success) {
      setPending(true);
      // Wait a moment then refresh
      setTimeout(() => loadMatchStatus(), 500);
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
    <div>
      <div>
        <div className="flex items-center justify-between">
          <span>Matching Statistics</span>
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
        </div>
      </div>
      <div className="space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

          <Card className="border-2 hover:border-blue-500/50 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Total Matches
                  </p>
                  <p className="text-2xl font-bold mt-1">{matchStats.total}</p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <Percent className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-blue-500/50 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Excellent
                  </p>
                  <p className="text-2xl font-bold mt-1">{matchStats.excellent}</p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                </div>
              </div>
            </CardContent>
          </Card>


          <Card className="border-2 hover:border-blue-500/50 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Average Score
                  </p>
                  <p className="text-2xl font-bold mt-1">{matchStats.averageScore}%</p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                      <Scale className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-blue-500/50 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Last Updated
                  </p>
                  <p className="text-2xl font-bold mt-1">{lastUpdated ? new Date(lastUpdated).toLocaleDateString() : 'Never'}</p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
              </div>
            </CardContent>
          </Card>
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
      </div>
    </div>
  );
}