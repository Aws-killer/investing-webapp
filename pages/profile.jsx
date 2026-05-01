"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { CheckCircle2, Loader2, ShieldCheck, ShieldOff } from "lucide-react";
import { selectCurrentUser } from "@/features/slices/authSlice";
import { useCurrency } from "@/features/context/currency-context";
import {
  useDisableAuthenticatorMutation,
  useGetMeQuery,
  useSetupAuthenticatorMutation,
  useUpdateMeMutation,
  useVerifyAuthenticatorMutation,
} from "@/features/api/usersApi";
import { toast } from "sonner";

const Label = ({ children }) => (
  <label className="mb-1.5 block text-[9px] font-bold uppercase tracking-[0.15em] text-muted-foreground">{children}</label>
);

const Input = ({ label, ...props }) => (
  <div>
    <Label>{label}</Label>
    <input
      {...props}
      className="h-11 w-full rounded-[6px] bg-input px-3.5 text-[13px] font-medium text-foreground ring-1 ring-border transition placeholder:text-tertiary focus:outline-none focus:ring-2 focus:ring-ring"
    />
  </div>
);

const Card = ({ title, description, children }) => (
  <div className="rounded-[12px] bg-card p-6 card-shadow">
    <h2 className="text-[15px] font-extrabold tracking-[-0.03em] text-foreground">{title}</h2>
    {description && <p className="mt-1 text-[13px] font-medium leading-relaxed text-muted-foreground">{description}</p>}
    <div className="mt-6">{children}</div>
  </div>
);

export default function ProfilePage() {
  const storedUser = useSelector(selectCurrentUser);
  const { data: fetchedUser } = useGetMeQuery(undefined, { skip: !storedUser });
  const user = fetchedUser || storedUser;
  const { currency, setCurrency, currencySymbol, setCurrencySymbol } = useCurrency();
  const [localCurrency, setLocalCurrency] = useState(currency);
  const [localSymbol, setLocalSymbol] = useState(currencySymbol);
  const [profile, setProfile] = useState({
    username: "",
    display_name: "",
    phone_number: "",
    location: "",
    bio: "",
    authenticator_login_enabled: true,
    require_authenticator_for_password_login: false,
  });
  const [setupData, setSetupData] = useState(null);
  const [authenticatorCode, setAuthenticatorCode] = useState("");

  const [updateMe, { isLoading: isSavingProfile }] = useUpdateMeMutation();
  const [setupAuthenticator, { isLoading: isSettingUp }] = useSetupAuthenticatorMutation();
  const [verifyAuthenticator, { isLoading: isVerifying }] = useVerifyAuthenticatorMutation();
  const [disableAuthenticator, { isLoading: isDisabling }] = useDisableAuthenticatorMutation();

  useEffect(() => {
    setLocalCurrency(currency);
    setLocalSymbol(currencySymbol);
  }, [currency, currencySymbol]);

  useEffect(() => {
    if (!user) return;
    setProfile({
      username: user.username || "",
      display_name: user.display_name || "",
      phone_number: user.phone_number || "",
      location: user.location || "",
      bio: user.bio || "",
      authenticator_login_enabled: user.authenticator_login_enabled ?? true,
      require_authenticator_for_password_login: user.require_authenticator_for_password_login ?? false,
    });
  }, [user]);

  const qrCodeUrl = useMemo(() => {
    if (!setupData?.otpauth_uri) return null;
    return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(setupData.otpauth_uri)}`;
  }, [setupData]);

  const handleProfileChange = (e) => {
    const { name, value, type, checked } = e.target;
    setProfile((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handleSaveProfile = async () => {
    try {
      await updateMe(profile).unwrap();
      toast.success("Profile saved");
    } catch (err) {
      toast.error(err?.data?.message || "Could not save profile");
    }
  };

  const handleSaveCurrency = () => {
    setCurrency(localCurrency);
    setCurrencySymbol(localSymbol);
    toast.success("Currency settings saved");
  };

  const handleSetupAuthenticator = async () => {
    try {
      const response = await setupAuthenticator().unwrap();
      setSetupData(response.data);
    } catch (err) {
      toast.error(err?.data?.message || "Could not start authenticator setup");
    }
  };

  const handleVerifyAuthenticator = async () => {
    try {
      await verifyAuthenticator({ code: authenticatorCode }).unwrap();
      setSetupData(null);
      setAuthenticatorCode("");
      toast.success("Authenticator enabled");
    } catch (err) {
      toast.error(err?.data?.message || "Invalid authenticator code");
    }
  };

  const handleDisableAuthenticator = async () => {
    try {
      await disableAuthenticator().unwrap();
      setSetupData(null);
      toast.success("Authenticator disabled");
    } catch (err) {
      toast.error(err?.data?.message || "Could not disable authenticator");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card px-6 py-5">
        <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-tertiary">Account</p>
        <h1 className="mt-0.5 text-[22px] font-extrabold tracking-[-0.05em] text-foreground">Profile & Settings</h1>
      </header>
      <main className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-6">
        <Card title="Personal Details" description="Keep your contact details current so account recovery and alerts can reach you.">
          <div className="grid gap-5 md:grid-cols-2">
            <Input label="Username" name="username" value={profile.username} onChange={handleProfileChange} placeholder="johndoe" />
            <Input label="Display Name" name="display_name" value={profile.display_name} onChange={handleProfileChange} placeholder="Jane Investor" />
            <Input label="Email" value={user?.email || ""} disabled className="h-11 w-full rounded-[6px] bg-muted px-3.5 text-[13px] font-medium text-muted-foreground ring-1 ring-border" />
            <Input label="Phone Number" name="phone_number" value={profile.phone_number} onChange={handleProfileChange} placeholder="+255769590766" />
            <Input label="Location" name="location" value={profile.location} onChange={handleProfileChange} placeholder="Dar es Salaam, Tanzania" />
          </div>
          <div className="mt-5">
            <Label>Bio</Label>
            <textarea
              name="bio"
              value={profile.bio}
              onChange={handleProfileChange}
              rows={4}
              placeholder="A short note about your investing goals"
              className="w-full rounded-[6px] bg-input px-3.5 py-3 text-[13px] font-medium text-foreground ring-1 ring-border transition placeholder:text-tertiary focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="mt-6 flex justify-end">
            <button
              onClick={handleSaveProfile}
              disabled={isSavingProfile}
              className="flex h-10 items-center justify-center gap-2 rounded-[6px] bg-foreground px-6 text-[12px] font-bold text-background transition hover:opacity-80 active:scale-95 disabled:opacity-40"
            >
              {isSavingProfile ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Profile"}
            </button>
          </div>
        </Card>

        <Card title="Authenticator Login" description="Use Google Authenticator as an alternative login method, or require it as a second factor for password sign-ins.">
          <div className="mb-5 flex items-center gap-2 rounded-[8px] border border-border bg-muted/40 p-3 text-[13px] text-muted-foreground">
            {user?.authenticator_enabled ? <CheckCircle2 size={16} className="text-emerald-500" /> : <ShieldCheck size={16} />}
            {user?.authenticator_enabled ? "Authenticator is enabled on this account." : "Authenticator is not enabled yet."}
          </div>

          <div className="space-y-3">
            <label className="flex items-start gap-3 rounded-[8px] border border-border p-3 text-[13px]">
              <input
                type="checkbox"
                name="authenticator_login_enabled"
                checked={profile.authenticator_login_enabled}
                onChange={handleProfileChange}
                disabled={!user?.authenticator_enabled}
                className="mt-1"
              />
              <span>
                <span className="block font-semibold text-foreground">Allow authenticator-only login</span>
                <span className="text-muted-foreground">This is the default alternative login method once setup is complete.</span>
              </span>
            </label>
            <label className="flex items-start gap-3 rounded-[8px] border border-border p-3 text-[13px]">
              <input
                type="checkbox"
                name="require_authenticator_for_password_login"
                checked={profile.require_authenticator_for_password_login}
                onChange={handleProfileChange}
                disabled={!user?.authenticator_enabled}
                className="mt-1"
              />
              <span>
                <span className="block font-semibold text-foreground">Require authenticator with password login</span>
                <span className="text-muted-foreground">Turn this on if you want authenticator to act as an added security layer.</span>
              </span>
            </label>
          </div>

          {setupData && (
            <div className="mt-6 rounded-[10px] border border-border bg-background p-4">
              <p className="text-[13px] font-semibold text-foreground">Scan this QR code in Google Authenticator</p>
              <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center">
                {qrCodeUrl && (
                  <img src={qrCodeUrl} alt="Authenticator setup QR code" className="h-[220px] w-[220px] rounded-[8px] bg-white p-2" />
                )}
                <div className="min-w-0 flex-1">
                  <Label>Manual Secret</Label>
                  <div className="break-all rounded-[6px] bg-muted p-3 font-mono text-[12px] text-muted-foreground">{setupData.secret}</div>
                  <div className="mt-4 flex gap-2">
                    <input
                      value={authenticatorCode}
                      onChange={(e) => setAuthenticatorCode(e.target.value)}
                      inputMode="numeric"
                      placeholder="123456"
                      className="h-10 min-w-0 flex-1 rounded-[6px] bg-input px-3.5 text-[13px] font-medium text-foreground ring-1 ring-border focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                    <button
                      onClick={handleVerifyAuthenticator}
                      disabled={isVerifying}
                      className="h-10 rounded-[6px] bg-foreground px-4 text-[12px] font-bold text-background transition hover:opacity-80 disabled:opacity-40"
                    >
                      {isVerifying ? "Verifying" : "Verify"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="mt-6 flex flex-wrap justify-end gap-3">
            {user?.authenticator_enabled && (
              <button
                onClick={handleDisableAuthenticator}
                disabled={isDisabling}
                className="flex h-10 items-center gap-2 rounded-[6px] border border-border px-4 text-[12px] font-bold text-muted-foreground transition hover:bg-muted disabled:opacity-40"
              >
                <ShieldOff size={14} /> Disable
              </button>
            )}
            <button
              onClick={handleSetupAuthenticator}
              disabled={isSettingUp}
              className="h-10 rounded-[6px] border border-border px-4 text-[12px] font-bold text-foreground transition hover:bg-muted disabled:opacity-40"
            >
              {user?.authenticator_enabled ? "Regenerate Setup" : "Set Up Authenticator"}
            </button>
            <button
              onClick={handleSaveProfile}
              disabled={isSavingProfile}
              className="h-10 rounded-[6px] bg-foreground px-5 text-[12px] font-bold text-background transition hover:opacity-80 disabled:opacity-40"
            >
              Save Security Settings
            </button>
          </div>
        </Card>

        <Card title="Currency Settings" description="Customize how monetary values are displayed across the application.">
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <Label>Currency</Label>
              <select
                value={localCurrency}
                onChange={(e) => setLocalCurrency(e.target.value)}
                className="h-11 w-full cursor-pointer appearance-none rounded-[6px] bg-input px-3.5 text-[13px] font-medium text-foreground ring-1 ring-border transition focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="TZS">Tanzanian Shilling (TZS)</option>
                <option value="USD">United States Dollar (USD)</option>
                <option value="EUR">Euro (EUR)</option>
              </select>
            </div>
            <Input label="Symbol" value={localSymbol} onChange={(e) => setLocalSymbol(e.target.value)} />
          </div>
          <div className="mt-6 flex justify-end">
            <button
              onClick={handleSaveCurrency}
              className="h-10 rounded-[6px] bg-foreground px-6 text-[12px] font-bold text-background transition hover:opacity-80 active:scale-95"
            >
              Save Currency
            </button>
          </div>
        </Card>
      </main>
    </div>
  );
}
