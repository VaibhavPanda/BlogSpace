import { User, BlogPost, Comment } from "@/types/blog";

const USERS_KEY = "blog_users";
const POSTS_KEY = "blog_posts";
const COMMENTS_KEY = "blog_comments";
const CURRENT_USER_KEY = "blog_current_user";

// Initialize with mock data if empty
const initializeData = () => {
  if (!localStorage.getItem(USERS_KEY)) {
    const mockUsers: User[] = [
      {
        id: "1",
        name: "Sarah Chen",
        email: "sarah.chen@example.com",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
        bio: "Tech enthusiast and full-stack developer",
        createdAt: new Date().toISOString(),
      },
      {
        id: "2",
        name: "Marcus Johnson",
        email: "marcus.j@example.com",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Marcus",
        bio: "Design leader passionate about UX",
        createdAt: new Date().toISOString(),
      },
      {
        id: "3",
        name: "Elena Rodriguez",
        email: "elena.r@example.com",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Elena",
        bio: "Wellness coach and lifestyle blogger",
        createdAt: new Date().toISOString(),
      },
      {
        id: "4",
        name: "James Park",
        email: "james.park@example.com",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=James",
        bio: "Software architect and React expert",
        createdAt: new Date().toISOString(),
      },
    ];
    localStorage.setItem(USERS_KEY, JSON.stringify(mockUsers));
  }

  if (!localStorage.getItem(POSTS_KEY)) {
    const mockPosts: BlogPost[] = [
      {
        id: "1",
        title: "Getting Started with React",
        content: "React is a powerful JavaScript library for building user interfaces. In this comprehensive guide, we'll explore the fundamentals of React and how to get started with your first project...",
        category: "Technology",
        authorId: "1",
        authorName: "Sarah Chen",
        authorAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
        coverImage: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800",
        likes: ["2"],
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        updatedAt: new Date(Date.now() - 86400000).toISOString(),
      },
      {
        id: "2",
        title: "The Art of Minimalist Design",
        content: "Minimalism in design is not about having less. It's about making room for more of what matters. Let's explore the principles of minimalist design and how to apply them...",
        category: "Design",
        authorId: "2",
        authorName: "Marcus Johnson",
        authorAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Marcus",
        coverImage: "https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=800",
        likes: ["1", "3"],
        createdAt: new Date(Date.now() - 172800000).toISOString(),
        updatedAt: new Date(Date.now() - 172800000).toISOString(),
      },
      {
        id: "3",
        title: "Healthy Lifestyle Tips",
        content: "Transform your life with these practical wellness tips. From nutrition to exercise, discover how small changes can lead to big improvements in your overall well-being...",
        category: "Lifestyle",
        authorId: "3",
        authorName: "Elena Rodriguez",
        authorAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Elena",
        coverImage: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800",
        likes: ["1"],
        createdAt: new Date(Date.now() - 259200000).toISOString(),
        updatedAt: new Date(Date.now() - 259200000).toISOString(),
      },
      {
        id: "4",
        title: "Advanced TypeScript Patterns",
        content: "Take your TypeScript skills to the next level with advanced patterns and techniques. We'll dive deep into generics, utility types, and conditional types...",
        category: "Technology",
        authorId: "4",
        authorName: "James Park",
        authorAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=James",
        coverImage: "https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=800",
        likes: ["1", "2"],
        createdAt: new Date(Date.now() - 345600000).toISOString(),
        updatedAt: new Date(Date.now() - 345600000).toISOString(),
      },
      {
        id: "5",
        title: "Design Systems That Scale",
        content: "Building a design system that grows with your product is crucial for consistency and efficiency. Learn how to create reusable components and maintain a living style guide...",
        category: "Design",
        authorId: "2",
        authorName: "Marcus Johnson",
        authorAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Marcus",
        coverImage: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800",
        likes: [],
        createdAt: new Date(Date.now() - 432000000).toISOString(),
        updatedAt: new Date(Date.now() - 432000000).toISOString(),
      },
    ];
    localStorage.setItem(POSTS_KEY, JSON.stringify(mockPosts));
  }

  if (!localStorage.getItem(COMMENTS_KEY)) {
    const mockComments: Comment[] = [
      {
        id: "1",
        postId: "1",
        authorId: "2",
        authorName: "Marcus Johnson",
        authorAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Marcus",
        content: "Great post! Very helpful for beginners.",
        createdAt: new Date(Date.now() - 43200000).toISOString(),
      },
      {
        id: "2",
        postId: "2",
        authorId: "1",
        authorName: "Sarah Chen",
        authorAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
        content: "Love this minimalist approach!",
        createdAt: new Date(Date.now() - 86400000).toISOString(),
      },
    ];
    localStorage.setItem(COMMENTS_KEY, JSON.stringify(mockComments));
  }
};

export const getUsers = (): User[] => {
  initializeData();
  return JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
};

export const getPosts = (): BlogPost[] => {
  initializeData();
  return JSON.parse(localStorage.getItem(POSTS_KEY) || "[]");
};

export const getComments = (): Comment[] => {
  initializeData();
  return JSON.parse(localStorage.getItem(COMMENTS_KEY) || "[]");
};

export const getCurrentUser = (): User | null => {
  const userStr = localStorage.getItem(CURRENT_USER_KEY);
  return userStr ? JSON.parse(userStr) : null;
};

export const setCurrentUser = (user: User | null) => {
  if (user) {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(CURRENT_USER_KEY);
  }
};

export const saveUsers = (users: User[]) => {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

export const savePosts = (posts: BlogPost[]) => {
  localStorage.setItem(POSTS_KEY, JSON.stringify(posts));
};

export const saveComments = (comments: Comment[]) => {
  localStorage.setItem(COMMENTS_KEY, JSON.stringify(comments));
};

export const generateId = () => {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
};
