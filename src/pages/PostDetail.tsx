import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import CommentSection from "@/components/CommentSection";
import { Button } from "@/components/ui/button";
import { Heart, Share2, Edit, Trash2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
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
  updated_at: string;
  profiles: {
    name: string | null;
    avatar: string | null;
  };
}

const PostDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState<Post | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setCurrentUser(session?.user ?? null);
    });
  }, []);

  useEffect(() => {
    const fetchPost = async () => {
      const { data: postData, error: postError } = await supabase
        .from("posts")
        .select("*")
        .eq("id", id)
        .single();

      if (postError) {
        console.error("Error fetching post:", postError);
        setLoading(false);
        return;
      }

      const { data: profileData } = await supabase
        .from("profiles")
        .select("name, avatar")
        .eq("id", postData.author_id)
        .single();

      setPost({ ...postData, profiles: profileData || { name: null, avatar: null } });
      setLoading(false);

      // Track view
      if (id) {
        await supabase.rpc("increment_post_views", { post_uuid: id });
        const { data: { session } } = await supabase.auth.getSession();
        await supabase.from("post_views").insert({
          post_id: id,
          viewer_id: session?.user.id || null,
        });
      }
    };

    const fetchLikes = async () => {
      const { count } = await supabase
        .from("likes")
        .select("*", { count: "exact", head: true })
        .eq("post_id", id);

      setLikesCount(count || 0);

      if (currentUser) {
        const { data } = await supabase
          .from("likes")
          .select("id")
          .eq("post_id", id)
          .eq("user_id", currentUser.id)
          .maybeSingle();

        setIsLiked(!!data);
      }
    };

    fetchPost();
    if (id) fetchLikes();
  }, [id, currentUser]);

  const handleLike = async () => {
    if (!currentUser) {
      toast.error("Please sign in to like posts");
      return;
    }

    if (!post) return;

    if (isLiked) {
      const { error } = await supabase
        .from("likes")
        .delete()
        .eq("post_id", post.id)
        .eq("user_id", currentUser.id);

      if (error) {
        toast.error("Failed to unlike post");
        return;
      }

      setIsLiked(false);
      setLikesCount((prev) => prev - 1);
      toast.success("Post unliked");
    } else {
      const { error } = await supabase
        .from("likes")
        .insert({ post_id: post.id, user_id: currentUser.id });

      if (error) {
        toast.error("Failed to like post");
        return;
      }

      setIsLiked(true);
      setLikesCount((prev) => prev + 1);
      toast.success("Post liked");
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link copied to clipboard");
  };

  const handleDelete = async () => {
    if (!post || !currentUser || post.author_id !== currentUser.id) return;

    const { error } = await supabase
      .from("posts")
      .delete()
      .eq("id", post.id);

    if (error) {
      toast.error("Failed to delete post");
      return;
    }

    toast.success("Post deleted");
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <p className="text-center text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <p className="text-center text-muted-foreground">Post not found</p>
        </div>
      </div>
    );
  }

  const isAuthor = currentUser?.id === post.author_id;
  const date = new Date(post.created_at).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <article className="mx-auto max-w-3xl">
          {post.cover_image && (
            <img
              src={post.cover_image}
              alt={post.title}
              className="mb-8 aspect-video w-full rounded-lg object-cover"
            />
          )}

          <div className="mb-6">
            <div className="mb-4 flex flex-wrap gap-2">
              {(post.categories && post.categories.length > 0 
                ? post.categories 
                : [post.category]
              ).map((cat, index) => (
                <span 
                  key={index}
                  className="inline-block rounded-md bg-secondary px-3 py-1 text-sm font-medium text-secondary-foreground"
                >
                  {cat}
                </span>
              ))}
            </div>
            <h1 className="mb-4 text-4xl font-bold text-foreground">
              {post.title}
            </h1>
          </div>

          <div className="mb-8 flex items-center justify-between border-b border-border pb-6">
            <Link
              to={`/profile/${post.author_id}`}
              className="flex items-center gap-3"
            >
              {post.profiles?.avatar && (
                <img
                  src={post.profiles.avatar}
                  alt={post.profiles.name || "User"}
                  className="h-12 w-12 rounded-full"
                />
              )}
              <div>
                <p className="font-medium text-foreground">{post.profiles?.name || "Anonymous"}</p>
                <p className="text-sm text-muted-foreground">{date}</p>
              </div>
            </Link>

            <div className="flex items-center gap-2">
              <Button
                variant={isLiked ? "default" : "outline"}
                size="sm"
                onClick={handleLike}
              >
                <Heart className={`h-4 w-4 ${isLiked ? "fill-current" : ""}`} />
                {likesCount}
              </Button>
              <Button variant="outline" size="sm" onClick={handleShare}>
                <Share2 className="h-4 w-4" />
              </Button>
              {isAuthor && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/edit/${post.id}`)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleDelete}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          </div>

          <div className="prose prose-slate max-w-none dark:prose-invert">
            <p className="whitespace-pre-wrap text-foreground">{post.content}</p>
          </div>

          <div className="mt-12 border-t border-border pt-8">
            <CommentSection postId={post.id} />
          </div>
        </article>
      </main>
    </div>
  );
};

export default PostDetail;
