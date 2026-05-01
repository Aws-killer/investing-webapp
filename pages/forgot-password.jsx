import React, { useState } from "react";
import Link from "next/link";
import { AlertCircle, ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";
import { useRouter } from "next/router";
import { UwekezajiLogo } from "../components/layout/UwekezajiLogo";
import { useRequestPasswordResetMutation, useResetPasswordMutation } from "../features/api/usersApi";

const Field = ({ label, ...props }) => (
  <div>
    <label className="mb-1.5 block text-[9px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
      {label}
    </label>
    <input
      {...props}
      className="h-11 w-full rounded-[6px] bg-input px-3.5 text-[13px] font-medium text-foreground ring-1 ring-border transition placeholder:text-tertiary focus:outline-none focus:ring-2 focus:ring-ring"
    />
  </div>
);

export default function ForgotPassword() {
  const router = useRouter();
  const [step, setStep] = useState("request");
  const [formData, setFormData] = useState({
    email: "",
    code: "",
    new_password: "",
    confirm_password: "",
  });
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [requestReset, { isLoading: isRequesting }] = useRequestPasswordResetMutation();
  const [resetPassword, { isLoading: isResetting }] = useResetPasswordMutation();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const handleRequest = async (e) => {
    e.preventDefault();
    try {
      await requestReset({ email: formData.email }).unwrap();
      setMessage("If that email has a saved phone number, we sent a 6-digit reset code.");
      setStep("reset");
    } catch (err) {
      setError(err?.data?.message || "Could not send reset code");
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    if (formData.new_password !== formData.confirm_password) {
      setError("Passwords do not match");
      return;
    }

    try {
      await resetPassword({
        email: formData.email,
        code: formData.code,
        new_password: formData.new_password,
      }).unwrap();
      setMessage("Password reset successful. You can sign in now.");
      setTimeout(() => router.push("/login"), 900);
    } catch (err) {
      setError(err?.data?.message || "Could not reset password");
    }
  };

  const loading = isRequesting || isResetting;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-[420px]">
        <div className="mb-10 flex justify-center">
          <Link href="/"><UwekezajiLogo /></Link>
        </div>

        <div className="rounded-[12px] bg-card p-8 card-shadow">
          <Link href="/login" className="mb-6 inline-flex items-center gap-2 text-[12px] font-semibold text-muted-foreground hover:text-foreground">
            <ArrowLeft size={14} /> Back to sign in
          </Link>

          <div className="mb-8">
            <h1 className="text-[28px] font-extrabold leading-tight tracking-[-0.05em] text-foreground">Reset password</h1>
            <p className="mt-1.5 text-[13px] font-medium text-muted-foreground">
              We will send a short SMS code to the phone number saved on your account.
            </p>
          </div>

          {error && (
            <div className="mb-6 flex items-center gap-2.5 rounded-[8px] bg-destructive/10 p-3.5 text-[13px] font-medium text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />{error}
            </div>
          )}
          {message && (
            <div className="mb-6 flex items-center gap-2.5 rounded-[8px] bg-emerald-500/10 p-3.5 text-[13px] font-medium text-emerald-500">
              <CheckCircle2 className="h-4 w-4 shrink-0" />{message}
            </div>
          )}

          {step === "request" ? (
            <form onSubmit={handleRequest} className="space-y-5">
              <Field label="Email Address" type="email" name="email" value={formData.email} onChange={handleChange} required placeholder="name@example.com" />
              <button
                type="submit"
                disabled={loading}
                className="flex h-10 w-full items-center justify-center gap-2 rounded-[6px] bg-foreground text-[12px] font-bold text-background transition hover:opacity-80 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send SMS Code"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleReset} className="space-y-5">
              <Field label="Email Address" type="email" name="email" value={formData.email} onChange={handleChange} required />
              <Field label="SMS Code" type="text" inputMode="numeric" name="code" value={formData.code} onChange={handleChange} required placeholder="123456" />
              <Field label="New Password" type="password" name="new_password" value={formData.new_password} onChange={handleChange} required placeholder="********" />
              <Field label="Confirm Password" type="password" name="confirm_password" value={formData.confirm_password} onChange={handleChange} required placeholder="********" />
              <button
                type="submit"
                disabled={loading}
                className="flex h-10 w-full items-center justify-center gap-2 rounded-[6px] bg-foreground text-[12px] font-bold text-background transition hover:opacity-80 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Reset Password"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
