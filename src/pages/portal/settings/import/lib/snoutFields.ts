import type { DataType } from "./types";

export type FieldDef = {
  key: string;
  label: string;
  required?: boolean;
  hint?: string;
};

export const SNOUT_FIELDS: Record<DataType, FieldDef[]> = {
  owners: [
    { key: "first_name", label: "First Name", required: true },
    { key: "last_name", label: "Last Name", required: true },
    { key: "email", label: "Email", required: true, hint: "Used to detect duplicates" },
    { key: "phone", label: "Phone" },
    { key: "street_address", label: "Street Address" },
    { key: "city", label: "City" },
    { key: "state_province", label: "State / Province" },
    { key: "postal_code", label: "Postal / Zip Code" },
    { key: "notes", label: "Notes" },
  ],
  pets: [
    { key: "name", label: "Pet Name", required: true },
    { key: "species", label: "Species", required: true, hint: "dog, cat, or other" },
    { key: "breed", label: "Breed" },
    { key: "sex", label: "Sex", hint: "M, F, or U" },
    { key: "date_of_birth", label: "Date of Birth", hint: "YYYY-MM-DD" },
    { key: "weight_lbs", label: "Weight (lbs)", hint: "Auto-converted to kg" },
    { key: "color", label: "Color" },
    { key: "microchip_id", label: "Microchip ID" },
    { key: "owner_email", label: "Owner Email", required: true, hint: "Links pet to existing owner" },
  ],
  vaccinations: [
    { key: "pet_name", label: "Pet Name", required: true },
    { key: "owner_email", label: "Owner Email", required: true, hint: "Used with pet name to find pet" },
    { key: "vaccine_name", label: "Vaccine Name", required: true, hint: "rabies, dapp, bordetella, etc." },
    { key: "administered_date", label: "Date Given", hint: "YYYY-MM-DD" },
    { key: "expiry_date", label: "Expiration", hint: "YYYY-MM-DD" },
    { key: "vet_name", label: "Vet Name" },
    { key: "vet_clinic", label: "Vet Clinic" },
  ],
  reservations: [
    { key: "owner_email", label: "Owner Email", required: true },
    { key: "pet_name", label: "Pet Name", required: true },
    { key: "service_name", label: "Service Name", hint: "Matched to existing services" },
    { key: "start_at", label: "Start Date/Time", required: true, hint: "ISO date or YYYY-MM-DD HH:MM" },
    { key: "end_at", label: "End Date/Time", required: true },
    { key: "notes", label: "Notes" },
  ],
};
