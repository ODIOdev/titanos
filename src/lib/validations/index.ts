import { z } from "zod";
import { isValidUsPhone } from "@/lib/phone";

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  rememberMe: z.boolean(),
});

export const registerSchema = z
  .object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    email: z.string().email("Enter a valid email"),
    company: z.string().optional(),
    phone: z
      .string()
      .optional()
      .refine((value) => isValidUsPhone(value), {
        message: "Enter a valid 10-digit phone number",
      }),
    state: z.string().min(1, "State is required"),
    postalCode: z
      .string()
      .min(1, "ZIP code is required")
      .regex(/^\d{5}(-\d{4})?$/, "Enter a valid ZIP code"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Confirm your password"),
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
  ein: z
    .string()
    .optional()
    .refine(
      (value) =>
        !value ||
        value.trim() === "" ||
        /^\d{2}-?\d{7}$/.test(value.trim()),
      "Enter a valid EIN (XX-XXXXXXX)",
    ),
  email: z.string().email(),
  phone: z.string().min(7, "Phone is required"),
  industry: z.string().min(1, "Industry is required"),
  projectName: z.string().optional(),
  requestedDeliveryDate: z.string().optional(),
  urgency: z
    .enum(["standard", "soon", "urgent", "emergency"])
    .default("standard"),
  customProductDescription: z.string().optional(),
  taxExempt: z.boolean().default(false),
  notes: z.string().optional(),
  shippingLine1: z.string().min(1, "Shipping address is required"),
  shippingLine2: z.string().optional(),
  shippingCity: z.string().min(1),
  shippingState: z.string().min(1, "State is required"),
  shippingPostalCode: z.string().min(1),
  shippingCountry: z.string().min(1, "Country is required"),
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
  /** Storefront listing state — active products are public; draft/archived stay in admin only. */
  catalogStatus: z.enum(["active", "draft", "archived"]).default("active"),
  active: z.boolean().default(true),
  featured: z.boolean().default(false),
  bestseller: z.boolean().default(false),
  productType: z.string().optional(),
  department: z.string().optional(),
  gender: z.string().optional(),
  tag: z.string().optional(),
  ansiClass: z.string().optional(),
  color: z.string().optional(),
  size: z.string().optional(),
  /** When true, shoppers pick from the color/size/qty matrix instead of a single color. */
  hasMultipleSizes: z.boolean().default(false),
  variants: z
    .array(
      z.object({
        color: z.string(),
        size: z.string(),
        qty: z.coerce.number().int().min(0),
      }),
    )
    .optional()
    .default([]),
  specifications: z
    .array(
      z.object({
        name: z.string().min(1),
        value: z.string(),
      }),
    )
    .optional()
    .default([]),
  certifications: z
    .array(
      z.object({
        name: z.string().min(1),
        value: z.string(),
      }),
    )
    .optional()
    .default([]),
});

export const categoryFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required"),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
  sortOrder: z.coerce.number().int().min(0),
  active: z.boolean(),
});

export const memberFormSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Enter a valid email"),
  phone: z.string().optional(),
  dateOfBirth: z.string().optional(),
  promoCode: z.string().optional(),
  avatarUrl: z.string().optional(),
  password: z.string().optional(),
});

export const brandFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required"),
  description: z.string().optional(),
  logoUrl: z.string().optional(),
  website: z
    .string()
    .trim()
    .optional()
    .transform((value) => {
      if (!value) return undefined;
      const withProtocol = /^[a-z][a-z0-9+.-]*:/i.test(value)
        ? value
        : `https://${value}`;
      return withProtocol;
    })
    .refine(
      (value) => {
        if (!value) return true;
        try {
          const parsed = new URL(value);
          return parsed.protocol === "http:" || parsed.protocol === "https:";
        } catch {
          return false;
        }
      },
      { message: "Enter a valid website URL" },
    ),
  active: z.boolean(),
});

export const affiliateApplicationSchema = z.object({
  contactName: z.string().min(2, "Enter your full name"),
  email: z.string().email("Enter a valid email"),
  phone: z.string().optional(),
  company: z.string().optional(),
  audience: z
    .string()
    .min(20, "Tell us where you'll share your code (at least 20 characters)"),
  motivation: z.string().optional(),
  agreedToTerms: z.literal(true, {
    errorMap: () => ({ message: "You must accept the program terms" }),
  }),
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
export type BrandFormInput = z.infer<typeof brandFormSchema>;
export type MemberFormInput = z.infer<typeof memberFormSchema>;
export type AffiliateApplicationInput = z.infer<
  typeof affiliateApplicationSchema
>;
