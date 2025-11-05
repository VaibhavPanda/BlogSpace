import { useState, useEffect } from "react";
import BlogCard from "@/components/BlogCard";
import Navbar from "@/components/Navbar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Post {
  id: string;
  title: string;
  content: string;
  category: string;
  categories?: string[] | null;
  author_id: string;
  cover_image: string | null;
  created_at: string;
  profiles: {
    name: string | null;
    avatar: string | null;
  } | null;
}

const Feed = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [showDrafts, setShowDrafts] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUserId(session?.user.id || null);
    };
    checkAuth();
  }, []);

  useEffect(() => {
    const fetchPosts = async () => {
      let query = supabase.from("posts").select("*");

      if (showDrafts && userId) {
        query = query.eq("status", "draft").eq("author_id", userId);
      } else {
        query = query.eq("status", "published");
      }

      const { data: postsData, error } = await query.order("created_at", { ascending: false });

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
    };

    fetchPosts();
  }, [showDrafts, userId]);

  const allCategories = posts.flatMap((p) => 
    p.categories && p.categories.length > 0 ? p.categories : [p.category]
  );
  const categories = ["All", ...Array.from(new Set(allCategories))];

  const filteredPosts = posts.filter((post) => {
    const matchesSearch =
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (post.profiles?.name || "").toLowerCase().includes(searchQuery.toLowerCase());

    const postCategories = post.categories && post.categories.length > 0 
      ? post.categories 
      : [post.category];
    
    const matchesCategory =
      selectedCategory === "All" || postCategories.includes(selectedCategory);

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-4xl font-bold text-foreground">
              Discover Stories
            </h1>
            {userId && (
              <div className="flex gap-4">
                <Button
                  variant={!showDrafts ? "default" : "outline"}
                  onClick={() => setShowDrafts(false)}
                >
                  Published
                </Button>
                <Button
                  variant={showDrafts ? "default" : "outline"}
                  onClick={() => setShowDrafts(true)}
                >
                  Drafts
                </Button>
              </div>
            )}
          </div>

          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search posts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  selectedCategory === category
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredPosts.map((post) => (
            <BlogCard key={post.id} post={post} />
          ))}
        </div>

        {filteredPosts.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-muted-foreground">No posts found</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Feed;
