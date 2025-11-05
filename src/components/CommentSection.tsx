import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { commentSchema } from "@/lib/validationSchemas";

interface CommentSectionProps {
  postId: string;
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  profiles: {
    name: string | null;
    avatar: string | null;
  } | null;
}

const CommentSection = ({ postId }: CommentSectionProps) => {
  const [content, setContent] = useState("");
  const [comments, setComments] = useState<Comment[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setCurrentUser(session?.user ?? null);
    });
  }, []);

  useEffect(() => {
    const fetchComments = async () => {
      const { data: commentsData, error } = await supabase
        .from("comments")
        .select("id, content, created_at, author_id")
        .eq("post_id", postId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching comments:", error);
        return;
      }

      // Fetch profiles for each comment
      const commentsWithProfiles = await Promise.all(
        (commentsData || []).map(async (comment) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("name, avatar")
            .eq("id", comment.author_id)
            .single();

          return {
            ...comment,
            profiles: profile || { name: null, avatar: null },
          };
        })
      );

      setComments(commentsWithProfiles);
    };

    fetchComments();

    const channel = supabase
      .channel(`comments:${postId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "comments",
          filter: `post_id=eq.${postId}`,
        },
        () => {
          fetchComments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [postId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentUser) {
      toast.error("Please sign in to comment");
      return;
    }

    // Validate comment
    const validationResult = commentSchema.safeParse(content);

    if (!validationResult.success) {
      const firstError = validationResult.error.errors[0];
      toast.error(firstError.message);
      return;
    }

    const { error } = await supabase
      .from("comments")
      .insert({
        post_id: postId,
        author_id: currentUser.id,
        content: content.trim(),
      });

    if (error) {
      toast.error("Failed to post comment");
      return;
    }

    setContent("");
    toast.success("Comment posted");
  };

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold text-foreground">
        Comments ({comments.length})
      </h3>

      {currentUser && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <Textarea
            placeholder="Write a comment..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[100px]"
          />
          <Button type="submit" size="sm">
            Post Comment
          </Button>
        </form>
      )}

      <div className="space-y-4">
        {comments.map((comment) => (
          <div key={comment.id} className="flex gap-3 border-b border-border pb-4 last:border-0">
            {comment.profiles?.avatar && (
              <img
                src={comment.profiles.avatar}
                alt={comment.profiles.name || "User"}
                className="h-10 w-10 rounded-full"
              />
            )}
            <div className="flex-1">
              <div className="mb-1 flex items-center gap-2">
                <span className="font-medium text-foreground">
                  {comment.profiles?.name || "Anonymous"}
                </span>
                <span className="text-sm text-muted-foreground">
                  {new Date(comment.created_at).toLocaleDateString()}
                </span>
              </div>
              <p className="text-foreground">{comment.content}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CommentSection;
