"use client";

import { useState, useTransition } from "react";
import type { Category, Domain } from "@/lib/types";
import { createProblem } from "@/app/problems/new/actions";

const STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh",
  "Goa","Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka",
  "Kerala","Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram",
  "Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana",
  "Tripura","Uttar Pradesh","Uttarakhand","West Bengal",
  "Andaman and Nicobar Islands","Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu","Delhi",
  "Jammu and Kashmir","Ladakh","Lakshadweep","Puducherry",
];

const MAX_FILES = 5;
const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB

export default function NewProblemForm({ domains }: { domains: Domain[] }) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [descLen, setDescLen] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [fileInputKey, setFileInputKey] = useState(0);

  async function handleDomainChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const domainId = e.target.value;
    if (!domainId) { setCategories([]); return; }
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/domains/${domainId}/categories`
    );
    if (res.ok) setCategories(await res.json());
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? []);
    const valid = picked.filter(f => f.size <= MAX_FILE_BYTES);
    const rejected = picked.filter(f => f.size > MAX_FILE_BYTES);

    if (rejected.length > 0) {
      setError(`These files exceed 10 MB and were not added: ${rejected.map(f => f.name).join(", ")}`);
    }

    setSelectedFiles((prev) => {
      const merged = [...prev, ...valid];
      // Deduplicate by name + size, cap at MAX_FILES
      const seen = new Set<string>();
      return merged.filter((f) => {
        const key = `${f.name}-${f.size}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      }).slice(0, MAX_FILES);
    });
    setFileInputKey((k) => k + 1);
  }

  function removeFile(index: number) {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);

    const description = formData.get("description")?.toString() ?? "";
    if (description.trim().length < 150) {
      setError("Please describe in more detail — at least 150 characters of actual content (spaces don't count).");
      return;
    }

    const phone = formData.get("poster_phone")?.toString().trim() ?? "";
    const digits = phone.replace(/^\+?91/, "").replace(/^0/, "");
    if (!/^[6-9][0-9]{9}$/.test(digits)) {
      setError("Enter a valid 10-digit Indian mobile number (starting with 6, 7, 8, or 9).");
      return;
    }

    // Replace file input entries with our accumulated state
    formData.delete("files");
    selectedFiles.forEach((f) => formData.append("files", f));

    startTransition(async () => {
      const result = await createProblem(formData);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      encType="multipart/form-data"
      className="bg-white rounded-lg border border-gray-200 p-6 space-y-5"
    >
      {error && (
        <div className="border border-red-200 bg-red-50 rounded p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Domain */}
      <div>
        <label htmlFor="domain_id" className="block text-sm font-medium text-gray-700 mb-1">
          Category of Fraud <span className="text-red-500">*</span>
        </label>
        <select
          name="domain_id"
          id="domain_id"
          required
          onChange={handleDomainChange}
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-navy"
        >
          <option value="">— Select domain —</option>
          {domains.map((d) => (
            <option key={d.id} value={d.id}>
              {d.icon} {d.name}
            </option>
          ))}
        </select>
      </div>

      {/* Category */}
      <div>
        <label htmlFor="category_id" className="block text-sm font-medium text-gray-700 mb-1">
          Sub-category
        </label>
        <select
          name="category_id"
          id="category_id"
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-navy"
        >
          <option value="">— Select domain first —</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Title */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
          Title <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="title"
          id="title"
          required
          maxLength={300}
          placeholder="Brief summary of the fraud"
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-navy"
        />
      </div>

      {/* Description with live counter */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
          What happened? <span className="text-red-500">*</span>
        </label>
        <textarea
          name="description"
          id="description"
          required
          rows={6}
          minLength={150}
          placeholder="Describe the fraud in detail — include dates, amounts, reference numbers, and steps you already took…"
          onChange={(e) => setDescLen(e.target.value.length)}
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-navy"
        />
        <p className="mt-1 text-xs">
          <span className={descLen >= 150 ? "text-brand-green font-medium" : "text-gray-400"}>
            {descLen}
          </span>
          <span className="text-gray-400"> / 150 characters minimum</span>
        </p>
      </div>

      {/* State + date */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="location_state" className="block text-sm font-medium text-gray-700 mb-1">
            State (India)
          </label>
          <select
            name="location_state"
            id="location_state"
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-navy"
          >
            <option value="">— Select state —</option>
            {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="date_of_incident" className="block text-sm font-medium text-gray-700 mb-1">
            Date of Incident
          </label>
          <input
            type="date"
            name="date_of_incident"
            id="date_of_incident"
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-navy"
          />
        </div>
      </div>

      {/* Amount lost */}
      <div>
        <label htmlFor="amount_lost" className="block text-sm font-medium text-gray-700 mb-1">
          Amount Lost (₹)
        </label>
        <input
          type="number"
          name="amount_lost"
          id="amount_lost"
          min={0}
          placeholder="e.g. 50000"
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-navy"
        />
      </div>

      {/* Contact info */}
      <div className="border border-brand-smoke rounded-lg p-4 bg-brand-mist space-y-3">
        <p className="text-sm font-medium text-gray-700">
          Contact Info <span className="text-red-500">*</span>
        </p>
        <div>
          <label htmlFor="poster_name" className="block text-sm font-medium text-gray-700 mb-1">
            Full name <span className="text-red-500">*</span>
            <span className="text-gray-400 font-normal ml-1">(shown publicly)</span>
          </label>
          <input
            type="text"
            name="poster_name"
            id="poster_name"
            required
            placeholder="Your full name"
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-navy"
          />
        </div>
        <div>
          <label htmlFor="poster_email" className="block text-sm font-medium text-gray-700 mb-1">
            Email <span className="text-red-500">*</span>
            <span className="text-gray-400 font-normal ml-1">(private)</span>
          </label>
          <input
            type="email"
            name="poster_email"
            id="poster_email"
            required
            placeholder="you@example.com"
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-navy"
          />
        </div>
        <div>
          <label htmlFor="poster_phone" className="block text-sm font-medium text-gray-700 mb-1">
            Mobile number <span className="text-red-500">*</span>
            <span className="text-gray-400 font-normal ml-1">(private)</span>
          </label>
          <div className="flex">
            <span className="inline-flex items-center px-3 py-2 border border-r-0 border-gray-300 rounded-l bg-gray-50 text-sm text-gray-500 select-none">
              +91
            </span>
            <input
              type="tel"
              name="poster_phone"
              id="poster_phone"
              required
              maxLength={10}
              pattern="[6-9][0-9]{9}"
              placeholder="9876543210"
              className="flex-1 border border-gray-300 rounded-r px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-navy"
            />
          </div>
          <p className="mt-1 text-xs text-gray-500">10-digit Indian mobile number</p>
        </div>
        <p className="text-xs text-gray-400">
          Your contact details are used only to verify complaints and enable resolution. They are never shown publicly.
        </p>
      </div>

      {/* Evidence files */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Evidence{" "}
          <span className="text-gray-400 font-normal">
            (optional — up to {MAX_FILES} files, 10 MB each)
          </span>
        </label>

        {/* Selected files list */}
        {selectedFiles.length > 0 && (
          <ul className="mb-2 space-y-1">
            {selectedFiles.map((f, i) => (
              <li key={i} className="flex items-center justify-between bg-brand-mist border border-brand-smoke rounded px-3 py-1.5 text-sm">
                <span className="truncate text-gray-700">📎 {f.name} <span className="text-gray-400 text-xs">({(f.size / 1024 / 1024).toFixed(2)} MB)</span></span>
                <button
                  type="button"
                  onClick={() => removeFile(i)}
                  className="ml-3 text-red-400 hover:text-red-600 text-xs font-medium flex-shrink-0"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}

        <input
          key={fileInputKey}
          type="file"
          name="files"
          id="files"
          multiple
          disabled={selectedFiles.length >= MAX_FILES}
          accept="image/jpeg,image/png,image/gif,image/webp,image/heic,image/heif,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/plain,.jpg,.jpeg,.png,.gif,.webp,.heic,.heif,.pdf,.doc,.docx,.xls,.xlsx,.txt"
          onChange={handleFileChange}
          className="block w-full text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-4 file:rounded file:border-0 file:text-sm file:font-medium file:bg-brand-navy/10 file:text-brand-navy hover:file:bg-brand-navy/20 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        />

        <p className="mt-1 text-xs text-gray-400">
          {selectedFiles.length}/{MAX_FILES} files · Images (JPG, PNG, WEBP, HEIC), PDF, Word (DOC/DOCX), Excel (XLS/XLSX), TXT · Max 10 MB each
        </p>
      </div>

      {/* Deterrence warning */}
      <div className="border border-amber-200 bg-amber-50 rounded p-3 text-xs text-amber-800">
        ⚠️ False or defamatory complaints are a violation of our terms and will be removed.
        Your IP address is logged with every submission.
      </div>

      <div className="pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="w-full bg-brand-navy hover:bg-brand-navy/90 text-white font-semibold py-2.5 rounded transition-colors disabled:opacity-50"
        >
          {isPending ? "Submitting…" : "Submit Complaint"}
        </button>
      </div>
    </form>
  );
}
