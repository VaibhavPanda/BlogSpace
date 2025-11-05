import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { Eye, Heart, MessageSquare, TrendingUp } from "lucide-react";

const Analytics = () => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalViews: 0,
    totalLikes: 0,
    totalComments: 0,
    totalPosts: 0,
  });
  const [postStats, setPostStats] = useState<any[]>([]);
  const [engagementData, setEngagementData] = useState<any[]>([]);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      setUserId(session.user.id);
      fetchAnalytics(session.user.id);
    };
    checkAuth();
  }, [navigate]);

  const fetchAnalytics = async (authorId: string) => {
    // Fetch posts with their stats
    const { data: posts } = await supabase
      .from("posts")
      .select(`
        id,
        title,
        views,
        created_at,
        likes:likes(count),
        comments:comments(count)
      `)
      .eq("author_id", authorId);

    if (posts) {
      const totalViews = posts.reduce((sum, post) => sum + (post.views || 0), 0);
      const totalLikes = posts.reduce((sum, post) => sum + (post.likes?.[0]?.count || 0), 0);
      const totalComments = posts.reduce((sum, post) => sum + (post.comments?.[0]?.count || 0), 0);

      setStats({
        totalViews,
        totalLikes,
        totalComments,
        totalPosts: posts.length,
      });

      // Prepare data for charts
      const postData = posts.map(post => ({
        title: post.title.length > 20 ? post.title.substring(0, 20) + "..." : post.title,
        views: post.views || 0,
        likes: post.likes?.[0]?.count || 0,
        comments: post.comments?.[0]?.count || 0,
      }));

      setPostStats(postData);

      // Group by date for engagement over time
      const dateMap = new Map();
      posts.forEach(post => {
        const date = new Date(post.created_at).toLocaleDateString();
        if (!dateMap.has(date)) {
          dateMap.set(date, { date, views: 0, engagement: 0 });
        }
        const entry = dateMap.get(date);
        entry.views += post.views || 0;
        entry.engagement += (post.likes?.[0]?.count || 0) + (post.comments?.[0]?.count || 0);
      });

      setEngagementData(Array.from(dateMap.values()));
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <h1 className="mb-8 text-3xl font-bold text-foreground">Analytics Dashboard</h1>

        <div className="mb-8 grid gap-6 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Views</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalViews}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Likes</CardTitle>
              <Heart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalLikes}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Comments</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalComments}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalPosts}</div>
            </CardContent>
          </Card>
        </div>

        {postStats.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Post Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={postStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="title" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="views" fill="hsl(var(--primary))" name="Views" />
                  <Bar dataKey="likes" fill="hsl(var(--destructive))" name="Likes" />
                  <Bar dataKey="comments" fill="hsl(var(--accent))" name="Comments" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {engagementData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Engagement Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={engagementData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="views" stroke="hsl(var(--primary))" name="Views" />
                  <Line type="monotone" dataKey="engagement" stroke="hsl(var(--accent))" name="Engagement" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default Analytics;
