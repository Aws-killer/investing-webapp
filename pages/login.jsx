import React, { useState } from "react";
import Link from "next/link";
import { ArrowRight, Loader2, AlertCircle, ShieldCheck } from "lucide-react";
import { useAuthenticatorLoginMutation, useLoginMutation } from "../features/api/usersApi";
import { useRouter } from "next/router";
import { UwekezajiLogo } from "../components/layout/UwekezajiLogo";

const Field = ({ label, ...props }) => (
  <div>
    <label className="block text-[9px] font-bold uppercase tracking-[0.15em] text-muted-foreground mb-1.5">
      {label}
    </label>
    <input
      {...props}
      className="w-full h-11 bg-input rounded-[6px] px-3.5 text-[13px] font-medium text-foreground placeholder:text-tertiary ring-1 ring-border focus:outline-none focus:ring-2 focus:ring-ring transition"
    />
  </div>
);

export default function Login() {
  const router = useRouter();
  const [mode, setMode] = useState("password");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    authenticator_code: "",
  });
  const [error, setError] = useState("");
  const [login, { isLoading }] = useLoginMutation();
  const [authenticatorLogin, { isLoading: isAuthenticatorLoading }] = useAuthenticatorLoginMutation();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (mode === "authenticator") {
        await authenticatorLogin({
          email: formData.email,
          authenticator_code: formData.authenticator_code,
        }).unwrap();
      } else {
        await login({
          email: formData.email,
          password: formData.password,
          authenticator_code: formData.authenticator_code || undefined,
        }).unwrap();
      }
      router.push("/dashboard");
    } catch (err) {
      setError(err?.data?.message || "Invalid login details");
    }
  };

  const loading = isLoading || isAuthenticatorLoading;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-[400px]">
        <div className="flex justify-center mb-10">
          <Link href="/"><UwekezajiLogo /></Link>
        </div>

        <div className="bg-card rounded-[12px] p-8 card-shadow">
          <div className="mb-8">
            <h1 className="text-[28px] font-extrabold tracking-[-0.05em] text-foreground leading-tight">Welcome back</h1>
            <p className="text-[13px] text-muted-foreground mt-1.5 font-medium">Sign in to your account</p>
          </div>

          {error && (
            <div className="mb-6 p-3.5 bg-destructive/10 rounded-[8px] flex items-center gap-2.5 text-[13px] text-destructive font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />{error}
            </div>
          )}

          <div className="mb-5 grid grid-cols-2 rounded-[8px] bg-muted p-1">
            <button
              type="button"
              onClick={() => { setMode("password"); setError(""); }}
              className={`h-9 rounded-[6px] text-[12px] font-bold transition ${mode === "password" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}
            >
              Password
            </button>
            <button
              type="button"
              onClick={() => { setMode("authenticator"); setError(""); }}
              className={`h-9 rounded-[6px] text-[12px] font-bold transition ${mode === "authenticator" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}
            >
              Authenticator
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <Field label="Email Address" type="email" name="email" value={formData.email} onChange={handleChange} required placeholder="name@example.com" />
            {mode === "password" ? (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[9px] font-bold uppercase tracking-[0.15em] text-muted-foreground">Password</label>
                  <Link href="/forgot-password" className="text-[12px] font-semibold text-link hover:underline">Forgot?</Link>
                </div>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  placeholder="********"
                  className="w-full h-11 bg-input rounded-[6px] px-3.5 text-[13px] font-medium text-foreground placeholder:text-tertiary ring-1 ring-border focus:outline-none focus:ring-2 focus:ring-ring transition"
                />
              </div>
            ) : (
              <div className="rounded-[8px] border border-border bg-muted/40 p-3 text-[12px] leading-5 text-muted-foreground">
                <div className="mb-2 flex items-center gap-2 font-semibold text-foreground">
                  <ShieldCheck size={14} /> Use your Google Authenticator code instead of a password.
                </div>
                This works after you enable authenticator login in your profile.
              </div>
            )}
            <Field
              label={mode === "password" ? "Authenticator Code (if required)" : "Authenticator Code"}
              type="text"
              inputMode="numeric"
              name="authenticator_code"
              value={formData.authenticator_code}
              onChange={handleChange}
              required={mode === "authenticator"}
              placeholder="123456"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full h-10 bg-foreground text-background text-[12px] font-bold rounded-[6px] flex items-center justify-center gap-2 hover:opacity-80 active:scale-95 transition disabled:opacity-40 disabled:cursor-not-allowed mt-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (<>Sign In <ArrowRight className="w-4 h-4" /></>)}
            </button>
          </form>

          <p className="mt-7 text-center text-[13px] text-muted-foreground font-medium">
            Don't have an account?{" "}
            <Link href="/signup" className="text-link font-semibold hover:underline">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
