import { useLocation } from "wouter";
import { PenLine } from "lucide-react";

export function CreateStoryFAB() {
  const [, setLocation] = useLocation();

  return (
    <button
      onClick={() => setLocation("/create")}
      className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-5 py-3.5 rounded-full bg-gradient-to-r from-purple-600 to-teal-500 text-white font-semibold shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all"
      aria-label="Create Story"
    >
      <PenLine className="h-5 w-5" />
      <span className="text-sm">Create Story</span>
    </button>
  );
}
