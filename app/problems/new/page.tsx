import NewProblemForm from "@/components/NewProblemForm";
import { getDomains } from "@/lib/api";

export const metadata = { title: "Post a Complaint — ProbResolve" };

export default async function NewProblemPage() {
  const domains = await getDomains();

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-brand-navy mb-1">Post a Complaint</h1>
      <p className="text-brand-slate text-sm mb-6">
        Your identity is optional. We only need the facts.
      </p>
      <NewProblemForm domains={domains} />
    </div>
  );
}
