import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Sparkles, RefreshCw, TrendingUp, CheckCircle2 } from 'lucide-react';
import { triggerProgramMatching, getBusinessMatches, subscribeToMatches } from '@/lib/matching';

export function ProgramMatchingDashboard({ businessId }) {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    excellent: 0,
    good: 0,
    averageScore: 0,
    lastUpdated: null,
  });

  const loadMatches = async () => {
    setLoading(true);
    const { data } = await getBusinessMatches(businessId);
    if (data) {
      setMatches(data);
      updateStats(data);
    }
    setLoading(false);
  };

  const updateStats = (matchData = matches) => {
    const total = matchData.length;
    const excellent = matchData.filter(m => m.match_score >= 80).length;
    const good = matchData.filter(m => m.match_score >= 60 && m.match_score < 80).length;
    const averageScore = total > 0 
      ? Math.round(matchData.reduce((sum, m) => sum + m.match_score, 0) / total)
      : 0;

    setStats({
      total,
      excellent,
      good,
      averageScore,
      lastUpdated: new Date(),
    });
  };

  const refreshMatches = async (useAI = true) => {
    setRefreshing(true);
    await triggerProgramMatching(businessId, useAI);
    await loadMatches();
    setRefreshing(false);
  };

  useEffect(() => {
    (async () => loadMatches())();
    
    // Subscribe to real-time updates
    const subscription = subscribeToMatches(businessId, (newMatch) => {
      setMatches(prev => [newMatch, ...prev.filter(m => m.program_id !== newMatch.program_id)]);
      updateStats();
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [businessId]);

  return (
    <div className="space-y-6">
      {/* Stats Header */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Matches</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Excellent Matches</p>
                <p className="text-2xl font-bold text-emerald-600">{stats.excellent}</p>
              </div>
              <Sparkles className="w-8 h-8 text-emerald-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Average Score</p>
                <p className="text-2xl font-bold">{stats.averageScore}%</p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Actions</p>
                <div className="flex gap-2 mt-2">
                  <Button 
                    size="sm" 
                    onClick={() => refreshMatches(true)}
                    disabled={refreshing}
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                    AI Refresh
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => refreshMatches(false)}
                    disabled={refreshing}
                  >
                    Quick Refresh
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Matches List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Recommended Funding Programs</span>
            <Badge variant="secondary">
              {matches.length} matches
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading matches...</div>
          ) : matches.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No matches found. Try refreshing or complete your business profile.
            </div>
          ) : (
            <div className="space-y-4">
              {matches.slice(0, 10).map((match) => (
                <div key={match.id} className="border rounded-lg p-4 hover:bg-muted/50">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold">{match.program_name}</h3>
                      <p className="text-sm text-muted-foreground">{match.program_summary}</p>
                    </div>
                    <div className="text-right">
                      <Badge 
                        className={`${
                          match.match_category === 'Excellent Match' ? 'bg-emerald-500' :
                          match.match_category === 'Good Match' ? 'bg-blue-500' :
                          'bg-amber-500'
                        }`}
                      >
                        {match.match_score}%
                      </Badge>
                      <div className="text-xs mt-1">{match.match_confidence}</div>
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-medium">Match Strength:</span>
                      <Progress value={match.match_score} className="h-2 flex-1" />
                    </div>
                    {match.match_reasons && (
                      <div className="text-sm text-muted-foreground">
                        <strong>Why it matches:</strong> {match.match_reasons}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}