import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import BlogCard from "@/components/BlogCard";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { EditProfileDialog } from "@/components/EditProfileDialog";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { FollowButton } from "@/components/FollowButton";
const Profile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [userPosts, setUserPosts] = useState<any[]>([]);
  const [showDrafts, setShowDrafts] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  
  const isOwnProfile = currentUserId === userId;

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      setCurrentUserId(session.user.id);
    };
    checkAuth();
  }, [navigate]);

  const fetchProfile = async () => {
    if (!userId) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    setUser(profile);
  };

  const fetchUserPosts = async () => {
    if (!userId) return;

    let query = supabase
      .from("posts")
      .select("*")
      .eq("author_id", userId);

    // Only show drafts if viewing own profile
    if (isOwnProfile && showDrafts) {
      query = query.eq("status", "draft");
    } else {
      query = query.eq("status", "published");
    }

    const { data: postsData, error } = await query.order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching posts:", error);
      return;
    }

    if (postsData) {
      // Fetch profile for the posts
      const { data: profile } = await supabase
        .from("profiles")
        .select("name, avatar")
        .eq("id", userId)
        .single();

      const postsWithProfile = postsData.map((post) => ({
        ...post,
        profiles: profile || { name: null, avatar: null },
      }));

      setUserPosts(postsWithProfile);
    }
  };

  useEffect(() => {
    fetchProfile();
    fetchUserPosts();
    fetchFollowCounts();
  }, [userId, showDrafts]);

  const fetchFollowCounts = async () => {
    if (!userId) return;

    const { count: followers } = await supabase
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("following_id", userId);

    const { count: following } = await supabase
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("follower_id", userId);

    setFollowersCount(followers || 0);
    setFollowingCount(following || 0);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <p className="text-center text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

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

        <div className="mb-12 rounded-lg border border-border bg-card p-8">
          <div className="flex items-start gap-6">
            <Avatar className="h-24 w-24">
              <AvatarImage src={user.avatar} alt={user.name} />
              <AvatarFallback>{user.name?.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="mb-2 flex items-center justify-between">
                <h1 className="text-3xl font-bold text-foreground">{user.name}</h1>
                <div className="flex gap-2">
                  <FollowButton userId={user.id} currentUserId={currentUserId} />
                  {isOwnProfile && (
                    <EditProfileDialog
                      userId={user.id}
                      currentName={user.name || ""}
                      currentBio={user.bio}
                      currentAvatar={user.avatar}
                      onProfileUpdate={() => {
                        fetchProfile();
                      }}
                    />
                  )}
                </div>
              </div>
              {isOwnProfile && <p className="mb-4 text-muted-foreground">{user.email}</p>}
              {user.bio && <p className="text-foreground">{user.bio}</p>}
              <div className="mt-4 flex gap-6 text-sm">
                <span className="text-muted-foreground">
                  <strong className="text-foreground">{userPosts.length}</strong> posts
                </span>
                <span className="text-muted-foreground">
                  <strong className="text-foreground">{followersCount}</strong> followers
                </span>
                <span className="text-muted-foreground">
                  <strong className="text-foreground">{followingCount}</strong> following
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-foreground">
            {isOwnProfile ? "Your Posts" : `Posts by ${user.name}`}
          </h2>
          {isOwnProfile && (
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

        {userPosts.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {userPosts.map((post: any) => (
              <BlogCard key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <div className="py-12 text-center">
            <p className="text-muted-foreground">
              {isOwnProfile ? "You haven't created any posts yet" : "No posts yet"}
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Profile;
