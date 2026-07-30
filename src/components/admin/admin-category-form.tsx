"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { createCategory } from "@/lib/actions/admin";
import {
  categoryFormSchema,
  type CategoryFormInput,
} from "@/lib/validations";
import { slugify } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function AdminCategoryForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [slugTouched, setSlugTouched] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CategoryFormInput>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      imageUrl: "",
      sortOrder: 0,
      active: true,
    },
  });

  const active = watch("active");

  const onSubmit = handleSubmit((values) => {
    startTransition(async () => {
      const result = await createCategory(values);
      if (!result.success) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      if (result.id) {
        router.push(`/admin/categories/${result.id}`);
        router.refresh();
      } else {
        router.push("/admin/categories");
        router.refresh();
      }
    });
  });

  return (
    <form
      onSubmit={onSubmit}
      className="max-w-2xl space-y-5 rounded-sm border border-border-gray bg-white p-6"
      noValidate
    >
      <Input
        label="Name"
        required
        error={errors.name?.message}
        {...register("name", {
          onChange: (e) => {
            if (!slugTouched) {
              setValue("slug", slugify(e.target.value), {
                shouldValidate: true,
              });
            }
          },
        })}
      />
      <Input
        label="Slug"
        required
        error={errors.slug?.message}
        {...register("slug", {
          onChange: () => setSlugTouched(true),
        })}
      />
      <Textarea
        label="Description"
        rows={4}
        error={errors.description?.message}
        {...register("description")}
      />
      <Input
        label="Image URL"
        placeholder="/images/categories/hard-hats.svg"
        error={errors.imageUrl?.message}
        {...register("imageUrl")}
      />
      <Input
        label="Sort order"
        type="number"
        error={errors.sortOrder?.message}
        {...register("sortOrder")}
      />
      <label className="inline-flex items-center gap-2 text-sm text-dark-charcoal">
        <input
          type="checkbox"
          className="size-4 rounded-sm border-border-gray"
          checked={active}
          onChange={(e) =>
            setValue("active", e.target.checked, { shouldValidate: true })
          }
        />
        Active
      </label>
      <div className="flex flex-wrap gap-3 pt-2">
        <Button type="submit" variant="primary" disabled={pending}>
          {pending ? "Saving…" : "Create category"}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={pending}
          onClick={() => router.push("/admin/categories")}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
