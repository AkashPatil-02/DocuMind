"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiRequest } from "@/app/libs/api";
import { clearTokens, getAccessToken, getRefreshToken } from "@/app/libs/auth";
import { FileText, LogOut, Upload, Send } from "lucide-react";

interface User {
  id: number;
  email: string;
  full_name: string | null;
}

interface AskResponse {
  question: string;
  answer: string;
  sources: { page: number | null; source_id: string; content: string }[];
}

interface DocumentItem {
  id: number;
  sourceId: string;
  fileName: string;
  pages: number | null;
  chunkCount: number | null;
  uploadedAt: string | null;
}

export default function Dashboard() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");

  const [documents, setDocuments] = useState<DocumentItem[]>([]);

  const [question, setQuestion] = useState("");
  const [asking, setAsking] = useState(false);
  const [answer, setAnswer] = useState<AskResponse | null>(null);
  const [askError, setAskError] = useState("");

  useEffect(() => {
    if (!getAccessToken()) {
      router.replace("/signin");
      return;
    }

    Promise.all([apiRequest("/auth/me"), apiRequest("/documents")])
      .then(([me, docs]) => {
        setUser(me);
        setDocuments(docs.documents);
      })
      .catch(() => {
        clearTokens();
        router.replace("/signin");
      })
      .finally(() => setLoading(false));
  }, [router]);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadMessage("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const result = await apiRequest("/documents", {
        method: "POST",
        body: formData,
      });

      setUploadMessage(
        `Indexed "${result.fileName}" — ${result.pages} pages, ${result.chunkCount} chunks`
      );
      const docs = await apiRequest("/documents");
      setDocuments(docs.documents);
    } catch (err) {
      setUploadMessage(
        err instanceof Error ? err.message : "Upload failed"
      );
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleAsk(e: React.FormEvent) {
    e.preventDefault();
    if (!question.trim()) return;

    setAsking(true);
    setAskError("");
    setAnswer(null);

    try {
      const result = await apiRequest("/ask", {
        method: "POST",
        body: JSON.stringify({ question }),
      });
      setAnswer(result);
    } catch (err) {
      setAskError(
        err instanceof Error ? err.message : "Something went wrong"
      );
    } finally {
      setAsking(false);
    }
  }

  async function handleLogout() {
    const refreshToken = getRefreshToken();
    try {
      if (refreshToken) {
        await apiRequest("/auth/logout", {
          method: "POST",
          body: JSON.stringify({ refresh_token: refreshToken }),
        });
      }
    } finally {
      clearTokens();
      router.push("/signin");
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <p className="text-gray-400">Loading...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <header className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-orange-500 p-2 rounded-lg">
            <FileText className="text-white" size={20} />
          </div>
          <span className="text-xl font-bold">DocuMind</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-400">
            {user?.full_name || user?.email}
          </span>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition"
          >
            <LogOut size={16} />
            Log out
          </button>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-10 space-y-10">
        <section>
          <h1 className="text-2xl font-bold mb-4">Upload a document</h1>
          <div className="border border-dashed border-zinc-700 rounded-lg p-8 text-center">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              onChange={handleUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-semibold rounded-lg px-5 py-3 transition"
            >
              <Upload size={18} />
              {uploading ? "Uploading..." : "Choose PDF"}
            </button>
            <p className="text-sm text-gray-500 mt-3">PDF files only</p>
            {uploadMessage && (
              <p className="text-sm text-gray-300 mt-3">{uploadMessage}</p>
            )}
          </div>
        </section>

        <section>
          <h1 className="text-2xl font-bold mb-4">Your documents</h1>
          {documents.length === 0 ? (
            <p className="text-sm text-gray-500">
              No documents uploaded yet.
            </p>
          ) : (
            <ul className="space-y-2">
              {documents.map((doc) => (
                <li
                  key={doc.id}
                  className="flex items-center justify-between bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <FileText size={18} className="text-orange-500 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {doc.fileName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {doc.pages ?? "?"} pages · {doc.chunkCount ?? "?"} chunks
                        {doc.uploadedAt &&
                          ` · ${new Date(doc.uploadedAt).toLocaleDateString()}`}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h1 className="text-2xl font-bold mb-4">Ask your documents</h1>
          <form onSubmit={handleAsk} className="flex gap-3">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask a question about your documents..."
              className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg p-3 outline-none focus:border-orange-500"
            />
            <button
              type="submit"
              disabled={asking || !question.trim()}
              className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-semibold rounded-lg px-5 transition"
            >
              <Send size={18} />
              {asking ? "..." : "Ask"}
            </button>
          </form>

          {askError && <p className="text-red-400 text-sm mt-3">{askError}</p>}

          {answer && (
            <div className="mt-6 space-y-4">
              <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
                <p className="text-gray-300 whitespace-pre-wrap">{answer.answer}</p>
              </div>
              {answer.sources.length > 0 && (
                <div>
                  <h2 className="text-sm font-semibold text-gray-400 mb-2">
                    Sources
                  </h2>
                  <ul className="space-y-2">
                    {answer.sources.map((source, i) => (
                      <li
                        key={i}
                        className="text-sm text-gray-500 bg-zinc-900/50 border border-zinc-800 rounded-lg p-3"
                      >
                        Page {source.page ?? "?"} — {source.content.slice(0, 200)}
                        {source.content.length > 200 ? "..." : ""}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </section>

        <p className="text-center text-sm">
          <Link href="/signin" className="text-orange-500 hover:underline">
            Back to sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
