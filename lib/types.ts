export interface Domain {
  id: string;
  name: string;
  slug: string;
  icon: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
}

export interface Company {
  id: string;
  name: string;
}

export interface Evidence {
  id: string;
  file_url: string;
  file_name: string;
  content_type: string | null;
}

export interface EscalationLink {
  name: string;
  url: string;
  description: string;
}

export interface ProblemListItem {
  id: string;
  title: string;
  slug: string;
  domain: Domain;
  category: Category | null;
  company: Company | null;
  is_resolved: boolean;
  is_verified: boolean;
  flags_cleared: boolean;
  upvote_count: number;
  report_count: number;
  amount_lost: number | null; // exact Rupees — display as-is with Indian formatting
  poster_name: string | null;
  location_state: string | null;
  date_of_incident: string | null;
  created_at: string;
}

export interface ProblemDetail extends ProblemListItem {
  description: string;
  evidence: Evidence[];
  has_email: boolean;
  already_voted: boolean;
  already_reported: boolean;
  escalation_links: EscalationLink[];
}

export interface CompanyScoreEntry {
  id: string;
  name: string;
  domain: Domain | null;
  complaint_count: number;
  total_amount_lost: number; // 0 when no amounts filed
}

export interface CategoryScore {
  id: string | null;  // null = "Uncategorized"
  name: string;
  complaint_count: number;
  total_amount_lost: number;
}
