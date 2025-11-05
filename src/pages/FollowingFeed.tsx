import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import BlogCard from "@/components/BlogCard";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

interface Post {
  id: string;
  title: string;
  content: string;
  cover_image: string | null;
  created_at: string;
  category: string;
  author_id: string;
  profiles: {
    name: string;
    avatar: string | null;
  };
}

const FollowingFeed = () => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      setUserId(session.user.id);
    };
    checkAuth();
  }, [navigate]);

  useEffect(() => {
    if (userId) {
      fetchPosts();
    }
  }, [userId, showAll]);

  const fetchPosts = async () => {
    if (!userId) return;

    if (!showAll) {
      // Get list of followed users
      const { data: follows } = await supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", userId);

      if (follows && follows.length > 0) {
        const followingIds = follows.map(f => f.following_id);
        
        const { data: postsData, error } = await supabase
          .from("posts")
          .select("*")
          .eq("status", "published")
          .in("author_id", followingIds)
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Error fetching posts:", error);
          return;
        }

        const postsWithProfiles = await Promise.all(
          (postsData || []).map(async (post) => {
            const { data: profile } = await supabase
              .from("profiles")
              .select("name, avatar")
              .eq("id", post.author_id)
              .single();

            return {
              ...post,
              profiles: profile || { name: null, avatar: null },
            };
          })
        );

        setPosts(postsWithProfiles);
      } else {
        setPosts([]);
      }
    } else {
      const { data: postsData, error } = await supabase
        .from("posts")
        .select("*")
        .eq("status", "published")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching posts:", error);
        return;
      }

      const postsWithProfiles = await Promise.all(
        (postsData || []).map(async (post) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("name, avatar")
            .eq("id", post.author_id)
            .single();

          return {
            ...post,
            profiles: profile || { name: null, avatar: null },
          };
        })
      );

      setPosts(postsWithProfiles);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-foreground">
            {showAll ? "All Posts" : "Following"}
          </h1>
          <div className="flex gap-4">
            <Button
              variant={!showAll ? "default" : "outline"}
              onClick={() => setShowAll(false)}
            >
              Following
            </Button>
            <Button
              variant={showAll ? "default" : "outline"}
              onClick={() => setShowAll(true)}
            >
              All Posts
            </Button>
          </div>
        </div>

        {posts.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <BlogCard key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <div className="py-12 text-center">
            <p className="mb-4 text-muted-foreground">
              {showAll
                ? "No posts available"
                : "You're not following anyone yet. Follow some authors to see their posts here!"}
            </p>
            {!showAll && (
              <Button onClick={() => navigate("/feed")}>
                Discover Authors
              </Button>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default FollowingFeed;
