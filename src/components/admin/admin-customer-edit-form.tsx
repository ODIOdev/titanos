"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { updateCustomer } from "@/lib/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
import { Controller } from "react-hook-form";

type CustomerEditValues = {
  firstName: string;
  lastName: string;
  email: string;
  company: string;
  phone: string;
  state: string;
  postalCode: string;
};

export function AdminCustomerEditForm({
  customerId,
  defaults,
}: {
  customerId: string;
  defaults: CustomerEditValues;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<CustomerEditValues>({
    defaultValues: defaults,
  });

  const onSubmit = handleSubmit((values) => {
    startTransition(async () => {
      const result = await updateCustomer(customerId, values);
      if (!result.success) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      router.push(`/admin/customers/${customerId}`);
      router.refresh();
    });
  });

  return (
    <form onSubmit={onSubmit} className="max-w-xl space-y-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="First name"
          required
          error={errors.firstName?.message}
          {...register("firstName", { required: "First name is required" })}
        />
        <Input
          label="Last name"
          required
          error={errors.lastName?.message}
          {...register("lastName", { required: "Last name is required" })}
        />
      </div>
      <Input
        label="Email"
        type="email"
        required
        error={errors.email?.message}
        {...register("email", { required: "Email is required" })}
      />
      <Input label="Company" {...register("company")} />
      <Controller
        name="phone"
        control={control}
        render={({ field }) => (
          <PhoneInput
            label="Phone"
            value={field.value}
            onValueChange={field.onChange}
            onBlur={field.onBlur}
          />
        )}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="State" {...register("state")} />
        <Input label="ZIP code" {...register("postalCode")} />
      </div>
      <div className="flex gap-2">
        <Button type="submit" variant="primary" disabled={pending}>
          {pending ? "Saving…" : "Save changes"}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={pending}
          onClick={() => router.push(`/admin/customers/${customerId}`)}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
