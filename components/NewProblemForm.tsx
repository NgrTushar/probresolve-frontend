"use client";

import { useState, useTransition } from "react";
import type { Category, Domain } from "@/lib/types";
import { createProblem } from "@/app/problems/new/actions";
import CompanyAutocomplete from "@/components/CompanyAutocomplete";

function formatIndianInput(raw: string): string {
  const noDecimal = raw.split(".")[0];
  const digits = noDecimal.replace(/[^0-9]/g, "");
  if (!digits) return "";
  const lastThree = digits.slice(-3);
  const rest = digits.slice(0, -3);
  return rest.length > 0
    ? rest.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + "," + lastThree
    : lastThree;
}

function parseRawAmount(formatted: string): string {
  const noDecimal = formatted.split(".")[0];
  return noDecimal.replace(/[^0-9]/g, "");
}

const inputCls = "w-full bg-dark-bg border border-dark-border text-dark-pop rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-navy placeholder:text-dark-muted";
const labelCls = "block text-sm font-medium text-dark-pop mb-1";

function AmountLostInput() {
  const [displayValue, setDisplayValue] = useState("");
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDisplayValue(formatIndianInput(e.target.value));
  };
  return (
    <div>
      <label htmlFor="amount_lost" className={labelCls}>
        Amount Lost (₹)
      </label>
      <input
        id="amount_lost"
        name="amount_lost"
        type="text"
        inputMode="numeric"
        value={displayValue}
        onChange={handleChange}
        placeholder="e.g. 1,00,000"
        autoComplete="off"
        className={inputCls}
      />
      <input type="hidden" name="amount_lost_raw" value={parseRawAmount(displayValue)} />
    </div>
  );
}

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
const MAX_TOTAL_BYTES = 40 * 1024 * 1024; // 40 MB total

export default function NewProblemForm({ domains }: { domains: Domain[] }) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedDomainId, setSelectedDomainId] = useState<string | null>(null);
  const [companyKey, setCompanyKey] = useState(0);
  const [descLen, setDescLen] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [fileInputKey, setFileInputKey] = useState(0);

  async function handleDomainChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const domainId = e.target.value;
    setSelectedDomainId(domainId || null);
    setCompanyKey((k) => k + 1);
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
    } else {
      setError(null);
    }

    setSelectedFiles((prev) => {
      const merged = [...prev, ...valid];
      const seen = new Set<string>();
      const deduped = merged.filter((f) => {
        const key = `${f.name}-${f.size}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      }).slice(0, MAX_FILES);

      const totalSize = deduped.reduce((sum, f) => sum + f.size, 0);
      if (totalSize > MAX_TOTAL_BYTES) {
        setError(`Total file size (${(totalSize / 1024 / 1024).toFixed(1)} MB) exceeds 40 MB. Remove some files.`);
      }

      return deduped;
    });
  }

  function removeFile(index: number) {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  }

  const todayIST = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

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
    let digits = phone;
    if (/^\+91/.test(phone) && phone.length === 13) digits = phone.slice(3);
    else if (/^91/.test(phone) && phone.length === 12) digits = phone.slice(2);
    else if (/^0/.test(phone) && phone.length === 11) digits = phone.slice(1);
    if (!/^[6-9][0-9]{9}$/.test(digits)) {
      setError("Enter a valid 10-digit Indian mobile number (starting with 6, 7, 8, or 9).");
      return;
    }

    const totalFileSize = selectedFiles.reduce((sum, f) => sum + f.size, 0);
    if (totalFileSize > MAX_TOTAL_BYTES) {
      setError(`Total file size (${(totalFileSize / 1024 / 1024).toFixed(1)} MB) exceeds 40 MB. Remove some files before submitting.`);
      return;
    }

    formData.delete("files");
    selectedFiles.forEach((f) => formData.append("files", f));

    startTransition(async () => {
      const result = await createProblem(formData);
      if (result?.error) {
        setError(result.error);
      } else {
        setSelectedFiles([]);
        setFileInputKey((k) => k + 1);
      }
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      encType="multipart/form-data"
      className="bg-dark-surface rounded-lg border border-dark-border p-6 space-y-5"
    >
      {error && (
        <div className="border border-red-800 bg-red-900/20 rounded p-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Domain */}
      <div>
        <label htmlFor="domain_id" className={labelCls}>
          Category of Fraud <span className="text-red-500">*</span>
        </label>
        <select
          name="domain_id"
          id="domain_id"
          required
          onChange={handleDomainChange}
          className={inputCls}
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
        <label htmlFor="category_id" className={labelCls}>
          Sub-category <span className="text-red-500">*</span>
        </label>
        <select
          name="category_id"
          id="category_id"
          required
          disabled={categories.length === 0}
          className={`${inputCls} disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          <option value="">{categories.length === 0 ? "— Select domain first —" : "— Select sub-category —"}</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Target Company */}
      <CompanyAutocomplete key={companyKey} domainId={selectedDomainId} />

      {/* Title */}
      <div>
        <label htmlFor="title" className={labelCls}>
          Title <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="title"
          id="title"
          required
          maxLength={300}
          placeholder="Brief summary of the fraud"
          className={inputCls}
        />
      </div>

      {/* Description with live counter */}
      <div>
        <label htmlFor="description" className={labelCls}>
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
          className={inputCls}
        />
        <p className="mt-1 text-xs">
          <span className={descLen >= 150 ? "text-brand-green font-medium" : "text-dark-muted"}>
            {descLen}
          </span>
          <span className="text-dark-muted"> / 150 characters minimum</span>
        </p>
      </div>

      {/* State + date */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="location_state" className={labelCls}>
            State (India)
          </label>
          <select
            name="location_state"
            id="location_state"
            className={inputCls}
          >
            <option value="">— Select state —</option>
            {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="date_of_incident" className={labelCls}>
            Date of Incident
          </label>
          <input
            type="date"
            name="date_of_incident"
            id="date_of_incident"
            max={todayIST}
            className={inputCls}
          />
        </div>
      </div>

      {/* Amount lost */}
      <AmountLostInput />

      {/* Contact info */}
      <div className="border border-dark-border rounded-lg p-4 bg-dark-bg space-y-3">
        <p className="text-sm font-medium text-dark-pop">
          Contact Info <span className="text-red-500">*</span>
        </p>
        <div>
          <label htmlFor="poster_name" className={labelCls}>
            Full name <span className="text-red-500">*</span>
            <span className="text-dark-muted font-normal ml-1">(shown publicly)</span>
          </label>
          <input
            type="text"
            name="poster_name"
            id="poster_name"
            required
            placeholder="Your full name"
            className={inputCls}
          />
        </div>
        <div>
          <label htmlFor="poster_email" className={labelCls}>
            Email <span className="text-red-500">*</span>
            <span className="text-dark-muted font-normal ml-1">(private)</span>
          </label>
          <input
            type="email"
            name="poster_email"
            id="poster_email"
            required
            placeholder="you@example.com"
            className={inputCls}
          />
        </div>
        <div>
          <label htmlFor="poster_phone" className={labelCls}>
            Mobile number <span className="text-red-500">*</span>
            <span className="text-dark-muted font-normal ml-1">(private)</span>
          </label>
          <div className="flex">
            <span className="inline-flex items-center px-3 py-2 border border-r-0 border-dark-border rounded-l bg-dark-border text-sm text-dark-muted select-none">
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
              className="flex-1 bg-dark-bg border border-dark-border text-dark-pop rounded-r px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-navy placeholder:text-dark-muted"
            />
          </div>
          <p className="mt-1 text-xs text-dark-muted">10-digit Indian mobile number</p>
        </div>
        <p className="text-xs text-dark-muted">
          Your contact details are used only to verify complaints and enable resolution. They are never shown publicly.
        </p>
      </div>

      {/* Evidence files */}
      <div>
        <label className={labelCls}>
          Evidence{" "}
          <span className="text-dark-muted font-normal">
            (optional — up to {MAX_FILES} files, 10 MB each, 40 MB total)
          </span>
        </label>

        {selectedFiles.length > 0 && (
          <ul className="mb-2 space-y-1">
            {selectedFiles.map((f, i) => (
              <li key={i} className="flex items-center justify-between bg-dark-bg border border-dark-border rounded px-3 py-1.5 text-sm">
                <span className="truncate text-dark-pop">📎 {f.name} <span className="text-dark-muted text-xs">({(f.size / 1024 / 1024).toFixed(2)} MB)</span></span>
                <button
                  type="button"
                  onClick={() => removeFile(i)}
                  className="ml-3 text-red-400 hover:text-red-300 text-xs font-medium flex-shrink-0"
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
          id="files"
          multiple
          disabled={selectedFiles.length >= MAX_FILES}
          accept="image/jpeg,image/png,image/gif,image/webp,image/heic,image/heif,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/plain,.jpg,.jpeg,.png,.gif,.webp,.heic,.heif,.pdf,.doc,.docx,.xls,.xlsx,.txt"
          onChange={handleFileChange}
          className="block w-full text-sm text-dark-muted file:mr-3 file:py-1.5 file:px-4 file:rounded file:border-0 file:text-sm file:font-medium file:bg-brand-navy/30 file:text-dark-pop hover:file:bg-brand-navy/50 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        />

        <p className="mt-1 text-xs text-dark-muted">
          {selectedFiles.length}/{MAX_FILES} files
          {selectedFiles.length > 0 && ` · ${(selectedFiles.reduce((s, f) => s + f.size, 0) / 1024 / 1024).toFixed(1)} MB / 40 MB`}
          {" "}· Images (JPG, PNG, WEBP, HEIC), PDF, Word (DOC/DOCX), Excel (XLS/XLSX), TXT · Max 10 MB each
        </p>
      </div>

      {/* Deterrence warning */}
      <div className="border border-amber-800 bg-amber-900/20 rounded p-3 text-xs text-amber-400">
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
