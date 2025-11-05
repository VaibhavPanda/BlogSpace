import { Link } from "react-router-dom";
import { Heart, MessageCircle, Eye } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";

interface BlogCardProps {
  post: {
    id: string;
    title: string;
    content: string;
    category: string;
    categories?: string[] | null;
    author_id: string;
    cover_image: string | null;
    created_at: string;
    views?: number;
    status?: string;
    profiles: {
      name: string | null;
      avatar: string | null;
    } | null;
  };
}

const BlogCard = ({ post }: BlogCardProps) => {
  const [likesCount, setLikesCount] = useState(0);
  const [commentsCount, setCommentsCount] = useState(0);

  useEffect(() => {
    const fetchCounts = async () => {
      const { count: likes } = await supabase
        .from("likes")
        .select("*", { count: "exact", head: true })
        .eq("post_id", post.id);

      const { count: comments } = await supabase
        .from("comments")
        .select("*", { count: "exact", head: true })
        .eq("post_id", post.id);

      setLikesCount(likes || 0);
      setCommentsCount(comments || 0);
    };

    fetchCounts();
  }, [post.id]);

  const date = new Date(post.created_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <article className="group">
      <Link to={`/post/${post.id}`} className="block">
        <div className="overflow-hidden rounded-lg border border-border bg-card transition-all hover:shadow-lg">
          {post.cover_image && (
            <div className="aspect-video w-full overflow-hidden bg-muted">
              <img
                src={post.cover_image}
                alt={post.title}
                className="h-full w-full object-cover transition-transform group-hover:scale-105"
              />
            </div>
          )}
          <div className="p-6">
            <div className="mb-3 flex items-center gap-3">
              {post.profiles?.avatar && (
                <img
                  src={post.profiles.avatar}
                  alt={post.profiles.name || "User"}
                  className="h-10 w-10 rounded-full"
                />
              )}
              <div>
                <p className="font-medium text-foreground">{post.profiles?.name || "Anonymous"}</p>
                <p className="text-sm text-muted-foreground">{date}</p>
              </div>
            </div>
            <div className="mb-2 flex flex-wrap gap-2">
              {(post.categories && post.categories.length > 0 
                ? post.categories 
                : [post.category]
              ).map((cat, index) => (
                <span 
                  key={index}
                  className="inline-block rounded-md bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground"
                >
                  {cat}
                </span>
              ))}
            </div>
            <h2 className="mb-2 text-2xl font-bold text-foreground group-hover:text-primary">
              {post.title}
            </h2>
            <p className="mb-4 line-clamp-3 text-muted-foreground">
              {post.content}
            </p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  {post.views || 0}
                </span>
                <span className="flex items-center gap-1">
                  <Heart className="h-4 w-4" />
                  {likesCount}
                </span>
                <span className="flex items-center gap-1">
                  <MessageCircle className="h-4 w-4" />
                  {commentsCount}
                </span>
              </div>
              {post.status === "draft" && (
                <Badge variant="secondary">Draft</Badge>
              )}
            </div>
          </div>
        </div>
      </Link>
    </article>
  );
};

export default BlogCard;
