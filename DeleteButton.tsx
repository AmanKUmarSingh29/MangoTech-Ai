"use client";

import { Trash2, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function DeleteButton({ docId }: { docId: number }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this document?")) return;

    setDeleting(true);
    try {
      await fetch(`/api/documents/${docId}`, { method: "DELETE" });
      router.refresh();
    } catch {
      alert("Failed to delete document");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={deleting}
      className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition-all"
      title="Delete document"
    >
      {deleting ? (
        <Loader2 className="animate-spin" size={16} />
      ) : (
        <Trash2 size={16} />
      )}
    </button>
  );
}
