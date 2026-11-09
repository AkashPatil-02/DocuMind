"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiRequest } from "@/app/libs/api";
import { setTokens } from "@/app/libs/auth";
import { Eye, EyeOff, FileText } from "lucide-react";

interface AuthFormProps {
  mode: "signin" | "signup";
}

export default function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [full_name, setName] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isSignup = mode === "signup";

  async function handleSubmit(e: React.SubmitEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isSignup) {
        await apiRequest("/auth/register", {
          method: "POST",
          body: JSON.stringify({ email, password, full_name }),
        });
      }

      const tokens = await apiRequest("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      setTokens(tokens.access_token, tokens.refresh_token);

      router.push("/dashboard");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Authentication failed"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md">

      {/* Logo */}
      <div className="flex items-center gap-2 mb-10">
        <div className="bg-orange-500 p-2 rounded-lg">
          <FileText className="text-white" size={22} />
        </div>
        <span className="text-2xl font-bold">
          DocuMind
        </span>
      </div>

      <h1 className="text-3xl font-bold mb-2">
        {isSignup ? "Create your account" : "Welcome back"}
      </h1>

      <p className="text-gray-400 mb-8">
        {isSignup
          ? "Start exploring your documents with AI."
          : "Sign in to continue to DocuMind."}
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">

        {isSignup && (
          <div>
            <label className="block text-sm mb-2">
              Full name
            </label>
            <input
              type="text"
              value={full_name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              required
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-3 outline-none focus:border-orange-500"
            />
          </div>
        )}

        <div>
          <label className="block text-sm mb-2">
            Email address
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-3 outline-none focus:border-orange-500"
          />
        </div>

        <div>
          <label className="block text-sm mb-2">
            Password
          </label>

          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              minLength={8}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-3 pr-12 outline-none focus:border-orange-500"
            />

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3 text-gray-400"
            >
              {showPassword
                ? <EyeOff size={20} />
                : <Eye size={20} />}
            </button>
          </div>
        </div>

        {error && (
          <p className="text-red-400 text-sm">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-semibold rounded-lg p-3 transition"
        >
          {loading
            ? "Please wait..."
            : isSignup
              ? "Create account"
              : "Sign in"}
        </button>

      </form>

      <p className="text-center text-gray-400 mt-8 text-sm">
        {isSignup
          ? "Already have an account? "
          : "Don't have an account? "}

        <Link
          href={isSignup ? "/signin" : "/signup"}
          className="text-orange-500 hover:underline"
        >
          {isSignup ? "Sign in" : "Sign up"}
        </Link>
      </p>

    </div>
  );
}