import AuthForm from "@/app/components/auth/form";

export default function SigninPage() {
  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <AuthForm mode="signin" />
    </main>
  );
}