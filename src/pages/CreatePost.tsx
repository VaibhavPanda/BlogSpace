import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import { ArrowLeft, Image as ImageIcon, Save, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { postSchema } from "@/lib/validationSchemas";

const CreatePost = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [coverImage, setCoverImage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [existingCategories, setExistingCategories] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleCategoryChange = (value: string) => {
    setCategory(value);
    const cats = value.split(',').map(c => c.trim()).filter(c => c.length > 0);
    setCategories(cats);
    setShowSuggestions(value.length > 0);
  };

  const addCategoryFromSuggestion = (cat: string) => {
    const currentCats = category.split(',').map(c => c.trim()).filter(c => c.length > 0);
    if (!currentCats.includes(cat)) {
      const newValue = currentCats.length > 0 ? `${category}, ${cat}` : cat;
      handleCategoryChange(newValue);
    }
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  useEffect(() => {
    const fetchExistingCategories = async () => {
      const { data } = await supabase
        .from("posts")
        .select("categories")
        .not("categories", "is", null);

      if (data) {
        const allCats = new Set<string>();
        data.forEach((post: any) => {
          if (post.categories) {
            post.categories.forEach((cat: string) => allCats.add(cat));
          }
        });
        setExistingCategories(Array.from(allCats).sort());
      }
    };

    fetchExistingCategories();
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      setCurrentUser(session.user);

      if (id) {
        const { data: post, error } = await supabase
          .from("posts")
          .select("*")
          .eq("id", id)
          .single();

        if (error || !post || post.author_id !== session.user.id) {
          navigate("/");
          return;
        }

        setTitle(post.title);
        setContent(post.content);
        const existingCategories = post.categories && post.categories.length > 0 
          ? post.categories 
          : [post.category];
        setCategory(existingCategories.join(', '));
        setCategories(existingCategories);
        setCoverImage(post.cover_image || "");
      }
    };

    checkAuth();
  }, [id, navigate]);

  // Autosave every 30 seconds
  useEffect(() => {
    if (!currentUser || !title || !content) return;
    
    const timer = setInterval(() => {
      saveDraft();
    }, 30000);

    return () => clearInterval(timer);
  }, [currentUser, title, content, category, coverImage, categories, id]);

  const saveDraft = useCallback(async () => {
    if (!currentUser || !title || !content) return;

    try {
      const categoriesArray = category.split(',').map(c => c.trim()).filter(c => c.length > 0);
      const mainCategory = categoriesArray[0] || "Uncategorized";

      const postData = {
        title: title.trim(),
        content: content.trim(),
        category: mainCategory,
        categories: categoriesArray,
        cover_image: coverImage || null,
        author_id: currentUser.id,
        status: "draft" as const,
      };

      if (id) {
        await supabase.from("posts").update(postData).eq("id", id);
      } else {
        const { data } = await supabase.from("posts").insert(postData).select().single();
        if (data) {
          navigate(`/edit/${data.id}`, { replace: true });
        }
      }
      
      setLastSaved(new Date());
    } catch (error) {
      console.error("Error saving draft:", error);
    }
  }, [currentUser, title, content, category, coverImage, categories, id, navigate]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;

    setUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${currentUser.id}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          upsert: true
        });

      if (uploadError) {
        console.error("Upload error:", uploadError);
        toast.error("Failed to upload image: " + uploadError.message);
        setUploading(false);
        return;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      setCoverImage(publicUrl);
      toast.success("Image uploaded successfully");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent, isDraft = false) => {
    e.preventDefault();
    if (!currentUser) return;
    setLoading(true);

    const categoriesArray = category.split(',').map(c => c.trim()).filter(c => c.length > 0);

    // Validate post data (skip for drafts to allow partial saves)
    if (!isDraft) {
      const validationResult = postSchema.safeParse({
        title: title.trim(),
        content: content.trim(),
        categories: categoriesArray,
      });

      if (!validationResult.success) {
        const firstError = validationResult.error.errors[0];
        toast.error(firstError.message);
        setLoading(false);
        return;
      }
    } else {
      // Basic validation for drafts
      if (!title.trim() || !content.trim() || categoriesArray.length === 0) {
        toast.error("Please fill all required fields");
        setLoading(false);
        return;
      }
    }

    const mainCategory = categoriesArray[0];

    const postData = {
      title: title.trim(),
      content: content.trim(),
      category: mainCategory,
      categories: categoriesArray,
      cover_image: coverImage || null,
      status: isDraft ? ("draft" as const) : ("published" as const),
    };

    if (id) {
      const { error } = await supabase
        .from("posts")
        .update(postData)
        .eq("id", id);

      if (error) {
        toast.error(`Failed to ${isDraft ? 'save draft' : 'update post'}`);
        setLoading(false);
        return;
      }

      toast.success(`Post ${isDraft ? 'saved as draft' : 'updated'} successfully`);
    } else {
      const { error } = await supabase
        .from("posts")
        .insert({ ...postData, author_id: currentUser.id });

      if (error) {
        toast.error(`Failed to ${isDraft ? 'save draft' : 'create post'}`);
        setLoading(false);
        return;
      }

      toast.success(`Post ${isDraft ? 'saved as draft' : 'created'} successfully`);
    }

    setLoading(false);
    navigate("/");
  };

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

        <div className="mx-auto max-w-3xl">
          <div className="mb-8 flex items-center justify-between">
            <h1 className="text-3xl font-bold text-foreground">
              {id ? "Edit Post" : "Create New Post"}
            </h1>
            {lastSaved && (
              <span className="text-sm text-muted-foreground">
                Last saved: {lastSaved.toLocaleTimeString()}
              </span>
            )}
          </div>

          <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                type="text"
                placeholder="Enter post title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="space-y-2 relative">
              <Label htmlFor="category">Categories *</Label>
              <Input
                ref={inputRef}
                id="category"
                type="text"
                placeholder="e.g., Technology, Design, Lifestyle"
                value={category}
                onChange={(e) => handleCategoryChange(e.target.value)}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              />
              
              {showSuggestions && existingCategories.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-48 overflow-y-auto">
                  <div className="p-2 text-xs text-muted-foreground border-b border-border">
                    Existing categories (click to add):
                  </div>
                  <div className="p-2 flex flex-wrap gap-2">
                    {existingCategories
                      .filter(cat => !categories.includes(cat))
                      .map((cat) => (
                        <Badge
                          key={cat}
                          variant="secondary"
                          className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                          onClick={() => addCategoryFromSuggestion(cat)}
                        >
                          {cat}
                        </Badge>
                      ))}
                  </div>
                </div>
              )}
              
              <p className="text-xs text-muted-foreground">
                Add multiple categories separated by commas. Click existing categories above to add them.
              </p>
              {categories.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {categories.map((cat, idx) => (
                    <Badge key={idx} variant="default">
                      {cat}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="cover">Cover Image</Label>
              <div className="flex items-center gap-4">
                <Input
                  id="cover"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={uploading}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById("cover")?.click()}
                  disabled={uploading}
                >
                  <ImageIcon className="mr-2 h-4 w-4" />
                  {uploading ? "Uploading..." : "Upload Image"}
                </Button>
                {coverImage && (
                  <span className="text-sm text-muted-foreground">
                    Image uploaded
                  </span>
                )}
              </div>
              {coverImage && (
                <img
                  src={coverImage}
                  alt="Cover preview"
                  className="mt-2 h-48 w-full rounded-lg object-cover"
                />
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Content *</Label>
              <Textarea
                id="content"
                placeholder="Write your story..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[400px]"
              />
            </div>

            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={(e) => handleSubmit(e, true)}
                disabled={loading}
              >
                <Save className="mr-2 h-4 w-4" />
                Save Draft
              </Button>
              <Button type="submit" className="flex-1" disabled={loading}>
                <Send className="mr-2 h-4 w-4" />
                Publish Post
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default CreatePost;
