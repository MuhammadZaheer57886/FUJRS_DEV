"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { Button } from "@/components/ui/Button";
import { FormSection, ReadOnlyField, TextField } from "@/components/ui/Field";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { useToast } from "@/components/ui/Toast";
import { auth, profiles } from "@/lib/data";
import { Loading } from "@/components/ui/Loading";
import { LoadingScreen } from "@/components/ui/Loading";

const MIN_PASSWORD_LENGTH = 8;

function ProfileSection({ email, name }: { email: string; name: string }) {
  const { updateName } = useAuth();
  const { toast } = useToast();
  const [value, setValue] = useState(name);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    profiles.getAvatar().then((saved) => {
      if (active) setAvatar(saved);
    });
    return () => {
      active = false;
    };
  }, [email]);

  async function handleAvatarChange(next: string | null) {
    setAvatar(next);
    try {
      await profiles.updateAvatar(next);
      toast(next ? "Profile photo updated." : "Profile photo removed.", "success");
    } catch {
      // Roll the preview back so the UI doesn't claim a save that didn't happen.
      setAvatar(await profiles.getAvatar());
      toast("Couldn't save that photo — try a smaller image.", "info");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!value.trim()) {
      setError("Name can't be empty.");
      return;
    }
    setError(null);
    setSaving(true);
    const result = await updateName(value);
    setSaving(false);

    if (result.error) {
      setError(result.error);
      return;
    }
    toast("Name updated.", "success");
  }

  return (
    <FormSection title="Profile" description="How your name and photo appear across FUJRS.">
      <ImageUpload
        label="Profile Photo"
        value={avatar}
        onChange={(next) => void handleAvatarChange(next)}
        shape="circle"
        alt={`${name}'s profile photo`}
        hint="Square images work best. Saved as soon as you choose one."
      />

      <form onSubmit={handleSubmit} className="space-y-5">
        <TextField
          label="Full Name"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setError(null);
          }}
          error={error ?? undefined}
        />

        <ReadOnlyField
          label="Email Address"
          value={email}
          hint="Your email is your sign-in identity and can't be changed here. Contact the concierge if it needs updating."
        />

        <Button type="submit" variant="secondary" disabled={saving}>
          {saving ? "Saving…" : "Save Name"}
        </Button>
      </form>
    </FormSection>
  );
}

function PasswordSection() {
  const { toast } = useToast();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<{ password?: string; confirm?: string }>({});
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const next: typeof errors = {};
    if (password.length < MIN_PASSWORD_LENGTH) {
      next.password = `At least ${MIN_PASSWORD_LENGTH} characters.`;
    }
    if (password !== confirmPassword) next.confirm = "Passwords don't match.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSaving(true);
    // The length check above is UX; the auth provider enforces its own policy
    // and is the one that actually decides.
    const result = await auth.updatePassword(password);
    setSaving(false);

    if (result.error) {
      setErrors({ password: result.error });
      return;
    }

    setPassword("");
    setConfirmPassword("");
    toast("Your password has been changed.", "success");
  }

  return (
    <FormSection title="Password" description="Choose something you don't use anywhere else.">
      <form onSubmit={(e) => void handleSubmit(e)} noValidate className="space-y-5">
        <TextField
          label="New Password"
          type="password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setErrors((p) => ({ ...p, password: undefined }));
          }}
          error={errors.password}
        />
        <TextField
          label="Confirm New Password"
          type="password"
          value={confirmPassword}
          onChange={(e) => {
            setConfirmPassword(e.target.value);
            setErrors((p) => ({ ...p, confirm: undefined }));
          }}
          error={errors.confirm}
        />
        <Button type="submit" variant="secondary" disabled={saving}>
          {saving ? "Saving…" : "Update Password"}
        </Button>
      </form>
    </FormSection>
  );
}

function AddressSection({ email }: { email: string }) {
  const { toast } = useToast();
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [errors, setErrors] = useState<{ street?: string; city?: string; postalCode?: string }>({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    profiles
      .getAddress()
      .then((saved) => {
        if (!active || !saved) return;
        setStreet(saved.street);
        setCity(saved.city);
        setPostalCode(saved.postalCode);
      })
      .finally(() => {
        if (active) setLoaded(true);
      });
    return () => {
      active = false;
    };
  }, [email]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const next: typeof errors = {};
    if (!street.trim()) next.street = "Enter a street address.";
    if (!city.trim()) next.city = "Enter a city.";
    if (!postalCode.trim()) next.postalCode = "Enter a postal code.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    try {
      await profiles.updateAddress({ street, city, postalCode });
      toast("Address saved.", "success");
    } catch {
      toast("Couldn't save your address. Please try again.", "info");
    }
  }

  return (
    <FormSection
      title="Saved Address"
      description="Used to prefill your shipping details at checkout."
    >
      {!loaded ? (
        <Loading />
      ) : (
        <form onSubmit={(e) => void handleSubmit(e)} noValidate className="space-y-5">
          <TextField
            label="Street Address"
            value={street}
            onChange={(e) => {
              setStreet(e.target.value);
              setErrors((p) => ({ ...p, street: undefined }));
            }}
            error={errors.street}
            placeholder="House number and street name"
          />
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField
              label="City"
              value={city}
              onChange={(e) => {
                setCity(e.target.value);
                setErrors((p) => ({ ...p, city: undefined }));
              }}
              error={errors.city}
            />
            <TextField
              label="Postal Code"
              value={postalCode}
              onChange={(e) => {
                setPostalCode(e.target.value);
                setErrors((p) => ({ ...p, postalCode: undefined }));
              }}
              error={errors.postalCode}
            />
          </div>
          <Button type="submit" variant="secondary">
            Save Address
          </Button>
        </form>
      )}
    </FormSection>
  );
}

export default function AccountSettingsPage() {
  const { session, status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login?callbackUrl=/account/settings");
  }, [status, router]);

  if (status === "loading" || !session) {
    return <LoadingScreen />;
  }

  return (
    <div className="mx-auto max-w-2xl px-margin-mobile md:px-margin-desktop py-16">
      <Link
        href="/account"
        className="font-label-sm uppercase tracking-widest text-on-surface-variant hover:text-primary"
      >
        ← Back to Account
      </Link>
      <p className="mt-6 font-body text-label-sm uppercase tracking-widest text-marketplace-bronze">
        My Account
      </p>
      <h1 className="mt-2 font-display text-headline-md">Account Settings</h1>

      <div className="mt-10 space-y-6">
        <ProfileSection email={session.user.email} name={session.user.name} />
        <PasswordSection />
        <AddressSection email={session.user.email} />
      </div>
    </div>
  );
}
