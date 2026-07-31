"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Check, Copy, KeyRound, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  deleteCustomer,
  sendCustomerPasswordReset,
  setCustomerPassword,
} from "@/lib/actions/admin";
import { ConfirmDeleteDialog } from "@/components/admin/confirm-delete-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog } from "@/components/ui/dialog";

function generateTempPassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$";
  let out = "";
  for (let i = 0; i < 12; i += 1) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

export function CustomerDetailActions({
  customerId,
  customerName,
  passwordDialogOpen,
  onPasswordDialogOpenChange,
}: {
  customerId: string;
  customerName: string;
  passwordDialogOpen?: boolean;
  onPasswordDialogOpenChange?: (open: boolean) => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [internalPasswordOpen, setInternalPasswordOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [revealedPassword, setRevealedPassword] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const passwordOpen = passwordDialogOpen ?? internalPasswordOpen;
  function setPasswordOpen(open: boolean) {
    onPasswordDialogOpenChange?.(open);
    setInternalPasswordOpen(open);
    if (!open) {
      setCopied(false);
    }
  }

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteCustomer(customerId);
      if (!result.success) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      setConfirmOpen(false);
      router.push("/admin/customers");
      router.refresh();
    });
  }

  function handleSendReset() {
    startTransition(async () => {
      const result = await sendCustomerPasswordReset(customerId);
      if (!result.success) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
    });
  }

  function handleSetPassword() {
    const password = newPassword.trim();
    startTransition(async () => {
      const result = await setCustomerPassword(customerId, password);
      if (!result.success) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      setRevealedPassword(password);
      setNewPassword("");
      setCopied(false);
    });
  }

  async function copyPassword() {
    if (!revealedPassword) return;
    try {
      await navigator.clipboard.writeText(revealedPassword);
      setCopied(true);
      toast.success("Password copied.");
    } catch {
      toast.error("Unable to copy password.");
    }
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <Link
          href={`/admin/customers/${customerId}/edit`}
          className="inline-flex size-9 items-center justify-center rounded-sm border border-border-gray text-dark-charcoal hover:bg-light-gray"
          aria-label={`Edit ${customerName}`}
          title="Edit"
        >
          <Pencil className="size-4" aria-hidden="true" />
        </Link>
        <button
          type="button"
          disabled={pending}
          onClick={() => setPasswordOpen(true)}
          className="inline-flex size-9 items-center justify-center rounded-sm border border-border-gray text-dark-charcoal hover:bg-light-gray disabled:opacity-50"
          aria-label={`Manage password for ${customerName}`}
          title="Password"
        >
          <KeyRound className="size-4" aria-hidden="true" />
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => setConfirmOpen(true)}
          className="inline-flex size-9 items-center justify-center rounded-sm border border-border-gray text-dark-charcoal hover:bg-light-gray disabled:opacity-50"
          aria-label={`Delete ${customerName}`}
          title="Delete"
        >
          <Trash2 className="size-4" aria-hidden="true" />
        </button>
      </div>

      <ConfirmDeleteDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        itemLabel={customerName}
        description="This removes their account and profile. Orders stay in the system with the customer unlinked."
        pending={pending}
        onConfirm={handleDelete}
      />

      <Dialog
        open={passwordOpen}
        onOpenChange={setPasswordOpen}
        title="Customer password"
        className="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-sm text-medium-gray">
            The current password is encrypted and cannot be recovered. Set a
            new one below — it will be shown so you can copy it for the
            customer.
          </p>

          {revealedPassword ? (
            <div className="space-y-2 rounded-sm border border-green-600/30 bg-green-50 px-3 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-green-800">
                New password (copy now)
              </p>
              <div className="flex items-center gap-2">
                <code className="min-w-0 flex-1 break-all font-mono text-sm text-dark-charcoal">
                  {revealedPassword}
                </code>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={copyPassword}
                >
                  {copied ? (
                    <Check aria-hidden="true" />
                  ) : (
                    <Copy aria-hidden="true" />
                  )}
                  {copied ? "Copied" : "Copy"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="rounded-sm border border-border-gray bg-light-gray px-3 py-2 text-sm text-dark-charcoal">
              Current password:{" "}
              <span className="font-mono tracking-widest">••••••••</span>
              <span className="mt-1 block text-xs text-medium-gray">
                Not readable — secure hash only.
              </span>
            </div>
          )}

          <Input
            label="Set new password"
            type="password"
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            hint="Use the eye icon to show while typing. Min 8 characters."
          />
          <div className="flex flex-wrap justify-between gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={pending}
              onClick={() => {
                const next = generateTempPassword();
                setNewPassword(next);
                setRevealedPassword(null);
              }}
            >
              Generate
            </Button>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={pending}
                onClick={handleSendReset}
              >
                Send reset email
              </Button>
              <Button
                type="button"
                variant="primary"
                disabled={pending || newPassword.trim().length < 8}
                onClick={handleSetPassword}
              >
                {pending ? "Saving…" : "Set & show"}
              </Button>
            </div>
          </div>
        </div>
      </Dialog>
    </>
  );
}
