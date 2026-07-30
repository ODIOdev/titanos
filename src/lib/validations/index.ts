import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const registerSchema = z
  .object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    email: z.string().email("Enter a valid email"),
    company: z.string().optional(),
    phone: z.string().optional(),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const forgotPasswordSchema = z.object({
  email: z.string().email("Enter a valid email"),
});

export const profileSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  company: z.string().optional(),
  phone: z.string().optional(),
});

export const addressSchema = z.object({
  type: z.enum(["shipping", "billing"]),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  company: z.string().optional(),
  line1: z.string().min(1, "Address is required"),
  line2: z.string().optional(),
  city: z.string().min(1),
  state: z.string().min(1),
  postalCode: z.string().min(1),
  country: z.string().default("US"),
  phone: z.string().optional(),
  isDefault: z.boolean().default(false),
});

export const newsletterSchema = z.object({
  email: z.string().email("Enter a valid email"),
});

export const contactSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email(),
  phone: z.string().optional(),
  company: z.string().optional(),
  subject: z.string().min(1, "Subject is required"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

export const quoteItemSchema = z.object({
  productId: z.string().optional(),
  productName: z.string().min(1, "Product name is required"),
  sku: z.string().optional(),
  quantity: z.coerce.number().int().min(1),
  notes: z.string().optional(),
});

export const quoteSchema = z.object({
  contactName: z.string().min(1, "Contact name is required"),
  company: z.string().min(1, "Company is required"),
  email: z.string().email(),
  phone: z.string().min(7, "Phone is required"),
  industry: z.string().min(1, "Industry is required"),
  projectName: z.string().optional(),
  requestedDeliveryDate: z.string().optional(),
  customProductDescription: z.string().optional(),
  taxExempt: z.boolean().default(false),
  notes: z.string().optional(),
  shippingLine1: z.string().min(1, "Shipping address is required"),
  shippingLine2: z.string().optional(),
  shippingCity: z.string().min(1),
  shippingState: z.string().min(1),
  shippingPostalCode: z.string().min(1),
  shippingCountry: z.string().default("US"),
  items: z.array(quoteItemSchema).min(1, "Add at least one product"),
});

export const productFormSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  sku: z.string().min(1),
  shortDescription: z.string().optional(),
  description: z.string().optional(),
  categoryId: z.string().optional(),
  brandId: z.string().optional(),
  price: z.coerce.number().min(0),
  compareAtPrice: z.coerce.number().min(0).optional().nullable(),
  cost: z.coerce.number().min(0).optional().nullable(),
  inventoryQuantity: z.coerce.number().int().min(0),
  lowStockThreshold: z.coerce.number().int().min(0).default(10),
  weight: z.coerce.number().min(0).optional().nullable(),
  shippingClass: z.string().optional(),
  active: z.boolean().default(true),
  featured: z.boolean().default(false),
  bestseller: z.boolean().default(false),
  productType: z.string().optional(),
  ansiClass: z.string().optional(),
  color: z.string().optional(),
  size: z.string().optional(),
});

export const categoryFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required"),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
  sortOrder: z.coerce.number().int().min(0),
  active: z.boolean(),
});

export const checkoutSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().uuid(),
        quantity: z.number().int().min(1),
      }),
    )
    .min(1),
  email: z.string().email().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type QuoteInput = z.infer<typeof quoteSchema>;
export type ProductFormInput = z.infer<typeof productFormSchema>;
export type CategoryFormInput = z.infer<typeof categoryFormSchema>;
