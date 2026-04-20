import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Leaf } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/home", { replace: true });
    } catch {
      setError("Invalid email or password. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-zinc-50 px-4">
      <div className="w-full max-w-sm rounded-xl border bg-white p-8 shadow-sm">
        <div className="mb-8 flex flex-col items-center gap-2 text-center">
          <div className="flex items-center gap-2">
            <Leaf className="h-6 w-6 text-lime-700" />
            <span className="text-lg font-semibold">PLM Herbarium</span>
          </div>
          <p className="text-sm text-zinc-500">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-sm font-medium text-zinc-700">
              Email
            </label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-sm font-medium text-zinc-700">
              Password
            </label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          <Button
            type="submit"
            className="mt-2 w-full bg-lime-700 text-white hover:bg-lime-800"
            disabled={loading}
          >
            {loading ? "Signing in…" : "Sign in"}
          </Button>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;
