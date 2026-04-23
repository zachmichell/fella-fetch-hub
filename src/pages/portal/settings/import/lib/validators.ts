import { supabase } from "@/integrations/supabase/client";
import type {
  ColumnMapping,
  DataType,
  ParsedFile,
  RowIssue,
  ValidatedRow,
} from "./types";
import { SNOUT_FIELDS } from "./snoutFields";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function parseDate(v: string): string | null {
  if (!v) return null;
  const s = v.trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const d = new Date(s);
  if (isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

function parseDateTime(v: string): string | null {
  if (!v) return null;
  const d = new Date(v.trim());
  if (isNaN(d.getTime())) return null;
  return d.toISOString();
}

function normalizeSpecies(v: string): string | null {
  const s = v.trim().toLowerCase();
  if (!s) return null;
  if (["dog", "canine", "k9", "puppy"].includes(s)) return "dog";
  if (["cat", "feline", "kitten"].includes(s)) return "cat";
  return "other";
}

function normalizeSex(v: string): string {
  const s = v.trim().toLowerCase();
  if (s.startsWith("m")) return "M";
  if (s.startsWith("f")) return "F";
  return "U";
}

function normalizeBool(v: string): boolean | null {
  const s = v.trim().toLowerCase();
  if (!s) return null;
  if (["yes", "y", "true", "t", "1"].includes(s)) return true;
  if (["no", "n", "false", "f", "0"].includes(s)) return false;
  return null;
}

const VAX_TYPES = ["rabies", "dapp", "dhpp", "bordetella", "lepto", "lyme", "influenza", "fvrcp", "other"];
function normalizeVaccine(v: string): string {
  const s = v.trim().toLowerCase();
  for (const t of VAX_TYPES) if (s.includes(t)) return t;
  return "other";
}

function applyMapping(
  row: Record<string, string>,
  mapping: ColumnMapping,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [snoutField, csvHeader] of Object.entries(mapping)) {
    out[snoutField] = (row[csvHeader] ?? "").toString().trim();
  }
  return out;
}

// Match owner by full name (case-insensitive). Handles "First Last" and partial fallback.
function findOwnerByName(
  ownerName: string,
  ownersByFullName: Map<string, string>,
  owners: { id: string; first_name: string | null; last_name: string | null }[],
): string | null {
  const norm = ownerName.trim().toLowerCase();
  if (!norm) return null;

  // Exact full-name match
  const exact = ownersByFullName.get(norm);
  if (exact) return exact;

  // Partial: o_name contains last_name AND starts with first_name
  const firstWord = norm.split(/\s+/)[0];
  for (const o of owners) {
    const fn = (o.first_name ?? "").toLowerCase().trim();
    const ln = (o.last_name ?? "").toLowerCase().trim();
    if (!ln) continue;
    if (norm.includes(ln) && fn && firstWord === fn) return o.id;
  }
  return null;
}

export async function validateRows(
  parsed: ParsedFile,
  dataType: DataType,
  mapping: ColumnMapping,
  organizationId: string,
): Promise<ValidatedRow[]> {
  const existingOwnerEmails = new Set<string>();
  const ownerEmailToId = new Map<string, string>();
  const ownersByFullName = new Map<string, string>();
  const ownerExternalToId = new Map<string, string>();
  let allOwners: { id: string; first_name: string | null; last_name: string | null }[] = [];
  const petKeyToId = new Map<string, string>();

  if (dataType === "owners" || dataType === "pets" || dataType === "vaccinations" || dataType === "reservations") {
    const { data: owners } = await supabase
      .from("owners")
      .select("id, email, first_name, last_name, external_id, external_source")
      .eq("organization_id", organizationId)
      .is("deleted_at", null);
    allOwners = (owners ?? []).map((o) => ({
      id: o.id,
      first_name: o.first_name,
      last_name: o.last_name,
    }));
    for (const o of owners ?? []) {
      if (o.email) {
        const e = o.email.toLowerCase();
        existingOwnerEmails.add(e);
        ownerEmailToId.set(e, o.id);
      }
      const fn = (o.first_name ?? "").trim();
      const ln = (o.last_name ?? "").trim();
      if (fn || ln) {
        ownersByFullName.set(`${fn} ${ln}`.trim().toLowerCase(), o.id);
      }
      if (o.external_id && o.external_source) {
        ownerExternalToId.set(`${o.external_source}::${o.external_id}`, o.id);
      }
    }
  }

  if (dataType === "vaccinations" || dataType === "reservations") {
    const { data: pets } = await supabase
      .from("pets")
      .select("id, name, pet_owners(owner_id, owners(email))")
      .eq("organization_id", organizationId)
      .is("deleted_at", null);
    for (const p of pets ?? []) {
      const links = (p.pet_owners as any[]) ?? [];
      for (const link of links) {
        const email = link.owners?.email?.toLowerCase();
        if (email) petKeyToId.set(`${email}::${p.name.toLowerCase()}`, p.id);
      }
    }
  }

  const fields = SNOUT_FIELDS[dataType];
  const required = fields.filter((f) => f.required).map((f) => f.key);

  return parsed.rows.map((raw, index) => {
    const m = applyMapping(raw, mapping);
    const issues: RowIssue[] = [];
    const mapped: Record<string, any> = {};

    for (const r of required) {
      if (!m[r] || m[r] === "") {
        issues.push({ severity: "error", field: r, message: `Missing required field` });
      }
    }

    if (m.email && !EMAIL_RE.test(m.email)) {
      issues.push({ severity: "error", field: "email", message: "Invalid email format" });
    }
    if (m.owner_email && !EMAIL_RE.test(m.owner_email)) {
      issues.push({ severity: "warning", field: "owner_email", message: "Invalid email format" });
    }

    if (dataType === "owners") {
      mapped.external_id = m.external_id || null;
      mapped.first_name = m.first_name;
      mapped.last_name = m.last_name;
      mapped.email = m.email?.toLowerCase() || null;
      mapped.phone = m.phone || null;
      mapped.home_phone = m.home_phone || null;
      mapped.street_address = m.street_address || null;
      mapped.city = m.city || null;
      mapped.state_province = m.state_province || null;
      mapped.postal_code = m.postal_code || null;
      const noteParts: string[] = [];
      if (m.notes) noteParts.push(m.notes);
      if (m.referral_source) noteParts.push(`Referral: ${m.referral_source}`);
      if (m.home_phone && !mapped.phone) noteParts.push(`Home phone: ${m.home_phone}`);
      mapped.notes = noteParts.length ? noteParts.join("\n") : null;

      if (mapped.email && existingOwnerEmails.has(mapped.email)) {
        issues.push({
          severity: "warning",
          field: "email",
          message: "Owner with this email already exists",
        });
      }
    }

    if (dataType === "pets") {
      mapped.external_id = m.external_id || null;
      mapped.name = m.name;
      mapped.species = normalizeSpecies(m.species || "");
      if (!mapped.species) {
        issues.push({ severity: "error", field: "species", message: "Could not determine species" });
      }
      mapped.breed = m.breed || null;
      mapped.sex = normalizeSex(m.sex || "");
      const fixed = normalizeBool(m.is_fixed || "");
      if (fixed !== null) mapped.spayed_neutered = fixed;
      if (m.date_of_birth) {
        const d = parseDate(m.date_of_birth);
        if (!d) issues.push({ severity: "warning", field: "date_of_birth", message: "Invalid date" });
        mapped.date_of_birth = d;
      }
      if (m.weight_lbs) {
        const lbs = parseFloat(m.weight_lbs);
        if (isNaN(lbs)) {
          issues.push({ severity: "warning", field: "weight_lbs", message: "Invalid weight" });
        } else {
          mapped.weight_kg = +(lbs * 0.453592).toFixed(2);
        }
      }
      mapped.color = m.color || null;
      mapped.microchip_id = m.microchip_id || null;
      if (m.veterinarian) {
        mapped.behavioral_notes = `Veterinarian: ${m.veterinarian}`;
      }

      // Owner linking: try email → external_id → name
      let ownerId: string | null = null;
      const oe = m.owner_email?.toLowerCase();
      if (oe && ownerEmailToId.has(oe)) {
        ownerId = ownerEmailToId.get(oe) ?? null;
      }
      if (!ownerId && m.owner_name) {
        ownerId = findOwnerByName(m.owner_name, ownersByFullName, allOwners);
      }
      if (ownerId) {
        mapped._owner_id = ownerId;
      } else if (m.owner_name || oe) {
        issues.push({
          severity: "warning",
          field: "owner_name",
          message: `Owner not found ("${m.owner_name || oe}") — pet will be imported unlinked`,
        });
      }
    }

    if (dataType === "vaccinations") {
      mapped.pet_name = m.pet_name;
      mapped.owner_email = m.owner_email?.toLowerCase();
      mapped.vaccine_type = normalizeVaccine(m.vaccine_name || "");
      mapped.administered_on = m.administered_date ? parseDate(m.administered_date) : null;
      mapped.expires_on = m.expiry_date ? parseDate(m.expiry_date) : null;
      mapped.vet_name = m.vet_name || null;
      mapped.vet_clinic = m.vet_clinic || null;
      const key = `${mapped.owner_email}::${mapped.pet_name?.toLowerCase()}`;
      const petId = petKeyToId.get(key);
      if (!petId) {
        issues.push({
          severity: "error",
          field: "pet_name",
          message: "Pet not found — import pets first",
        });
      } else {
        mapped._pet_id = petId;
      }
    }

    if (dataType === "reservations") {
      mapped.owner_email = m.owner_email?.toLowerCase();
      mapped.pet_name = m.pet_name;
      mapped.service_name = m.service_name || null;
      mapped.start_at = m.start_at ? parseDateTime(m.start_at) : null;
      mapped.end_at = m.end_at ? parseDateTime(m.end_at) : null;
      mapped.notes = m.notes || null;
      if (m.start_at && !mapped.start_at) {
        issues.push({ severity: "error", field: "start_at", message: "Invalid start date" });
      }
      if (m.end_at && !mapped.end_at) {
        issues.push({ severity: "error", field: "end_at", message: "Invalid end date" });
      }
      const ownerId = ownerEmailToId.get(mapped.owner_email);
      if (!ownerId) {
        issues.push({ severity: "error", field: "owner_email", message: "Owner not found" });
      } else {
        mapped._owner_id = ownerId;
      }
      const key = `${mapped.owner_email}::${mapped.pet_name?.toLowerCase()}`;
      const petId = petKeyToId.get(key);
      if (!petId) {
        issues.push({ severity: "error", field: "pet_name", message: "Pet not found" });
      } else {
        mapped._pet_id = petId;
      }
    }

    return {
      index,
      raw,
      mapped,
      issues,
      include: !issues.some((i) => i.severity === "error"),
    };
  });
}
