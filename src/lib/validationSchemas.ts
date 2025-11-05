import { z } from "zod";

// Authentication validation
export const emailSchema = z
  .string()
  .trim()
  .email({ message: "Invalid email address" })
  .max(255, { message: "Email must be less than 255 characters" });

export const passwordSchema = z
  .string()
  .min(8, { message: "Password must be at least 8 characters" })
  .max(72, { message: "Password must be less than 72 characters" })
  .regex(/[A-Z]/, { message: "Password must contain at least one uppercase letter" })
  .regex(/[a-z]/, { message: "Password must contain at least one lowercase letter" })
  .regex(/[0-9]/, { message: "Password must contain at least one number" });

export const nameSchema = z
  .string()
  .trim()
  .min(1, { message: "Name cannot be empty" })
  .max(100, { message: "Name must be less than 100 characters" });

// Post validation
export const postTitleSchema = z
  .string()
  .trim()
  .min(1, { message: "Title cannot be empty" })
  .max(200, { message: "Title must be less than 200 characters" });

export const postContentSchema = z
  .string()
  .trim()
  .min(1, { message: "Content cannot be empty" })
  .max(50000, { message: "Content must be less than 50,000 characters" });

export const categorySchema = z
  .string()
  .trim()
  .min(1, { message: "Category cannot be empty" })
  .max(50, { message: "Category must be less than 50 characters" })
  .regex(/^[a-zA-Z0-9\s-]+$/, { message: "Category can only contain letters, numbers, spaces, and hyphens" });

export const categoriesArraySchema = z
  .array(categorySchema)
  .min(1, { message: "At least one category is required" })
  .max(5, { message: "Maximum 5 categories allowed" });

// Comment validation
export const commentSchema = z
  .string()
  .trim()
  .min(1, { message: "Comment cannot be empty" })
  .max(5000, { message: "Comment must be less than 5,000 characters" });

// Profile validation
export const bioSchema = z
  .string()
  .trim()
  .max(500, { message: "Bio must be less than 500 characters" })
  .nullable()
  .optional()
  .transform((val) => val || "");

// Combined schemas
export const authSignUpSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
});

export const authSignInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, { message: "Password is required" }),
});

export const postSchema = z.object({
  title: postTitleSchema,
  content: postContentSchema,
  categories: categoriesArraySchema,
});

export const profileSchema = z.object({
  name: nameSchema,
  bio: bioSchema,
});
