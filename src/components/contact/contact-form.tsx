"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { contactSchema } from "@/lib/validations";
import { SITE_CONFIG } from "@/lib/data/seed-data";

type ContactValues = z.infer<typeof contactSchema>;

export function ContactForm() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      company: "",
      subject: "",
      message: "",
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      // Demo-friendly: no backend required. In production, wire to email/CRM.
      await new Promise((r) => setTimeout(r, 400));
      console.info("Contact form submission", values);
      toast.success(`Message sent. We'll reply at ${SITE_CONFIG.supportEmail}.`);
      reset();
    } catch {
      toast.error("Unable to send message. Please email us directly.");
    }
  });

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Name"
          required
          autoComplete="name"
          error={errors.name?.message}
          {...register("name")}
        />
        <Input
          label="Email"
          type="email"
          required
          autoComplete="email"
          error={errors.email?.message}
          {...register("email")}
        />
        <Input
          label="Phone"
          type="tel"
          autoComplete="tel"
          error={errors.phone?.message}
          {...register("phone")}
        />
        <Input
          label="Company"
          autoComplete="organization"
          error={errors.company?.message}
          {...register("company")}
        />
      </div>
      <Select
        label="Subject"
        required
        placeholder="Select a topic"
        options={[
          { label: "Sales & quotes", value: "sales" },
          { label: "Order support", value: "orders" },
          { label: "Returns", value: "returns" },
          { label: "Product questions", value: "products" },
          { label: "Freight / shipping", value: "freight" },
          { label: "Other", value: "other" },
        ]}
        error={errors.subject?.message}
        {...register("subject")}
      />
      <Textarea
        label="Message"
        required
        rows={6}
        placeholder="Order #, SKUs, ship-to ZIP, and what you need…"
        error={errors.message?.message}
        {...register("message")}
      />
      <Button
        type="submit"
        variant="primary"
        size="lg"
        className="w-full sm:w-auto"
        disabled={isSubmitting}
      >
        {isSubmitting ? "Sending…" : "Send message"}
      </Button>
    </form>
  );
}
