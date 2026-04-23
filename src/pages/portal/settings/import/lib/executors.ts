import { supabase } from "@/integrations/supabase/client";
import type { DataType, ImportResult, SourceSystem, ValidatedRow } from "./types";

type Progress = (done: number, total: number) => void;

export async function executeImport(
  dataType: DataType,
  rows: ValidatedRow[],
  organizationId: string,
  onProgress: Progress,
  sourceSystem: SourceSystem = "other",
): Promise<ImportResult> {
  const result: ImportResult = { imported: 0, skipped: 0, errored: 0, errorRows: [] };
  const toImport = rows.filter((r) => r.include);
  const skipped = rows.length - toImport.length;
  result.skipped = skipped;

  // Pre-load services for reservations
  let serviceMap = new Map<string, string>();
  if (dataType === "reservations") {
    const { data: services } = await supabase
      .from("services")
      .select("id, name")
      .eq("organization_id", organizationId)
      .is("deleted_at", null);
    for (const s of services ?? []) serviceMap.set(s.name.toLowerCase(), s.id);
  }

  const total = toImport.length;
  for (let i = 0; i < toImport.length; i++) {
    const row = toImport[i];
    try {
      if (dataType === "owners") {
        const { error } = await supabase.from("owners").insert({
          organization_id: organizationId,
          first_name: row.mapped.first_name,
          last_name: row.mapped.last_name,
          email: row.mapped.email,
          phone: row.mapped.phone,
          street_address: row.mapped.street_address,
          city: row.mapped.city,
          state_province: row.mapped.state_province,
          postal_code: row.mapped.postal_code,
          notes: row.mapped.notes,
          external_id: row.mapped.external_id ?? null,
          external_source: row.mapped.external_id ? sourceSystem : null,
        });
        if (error) throw error;
      } else if (dataType === "pets") {
        const { data: pet, error } = await supabase
          .from("pets")
          .insert({
            organization_id: organizationId,
            name: row.mapped.name,
            species: row.mapped.species,
            breed: row.mapped.breed,
            sex: row.mapped.sex,
            date_of_birth: row.mapped.date_of_birth,
            weight_kg: row.mapped.weight_kg,
            color: row.mapped.color,
            microchip_id: row.mapped.microchip_id,
            spayed_neutered: row.mapped.spayed_neutered ?? null,
            behavioral_notes: row.mapped.behavioral_notes ?? null,
            external_id: row.mapped.external_id ?? null,
            external_source: row.mapped.external_id ? sourceSystem : null,
          })
          .select("id")
          .single();
        if (error) throw error;
        if (pet && row.mapped._owner_id) {
          const { error: linkErr } = await supabase.from("pet_owners").insert({
            organization_id: organizationId,
            pet_id: pet.id,
            owner_id: row.mapped._owner_id,
            relationship: "primary",
          });
          if (linkErr) throw linkErr;
        }
      } else if (dataType === "vaccinations") {
        const { error } = await supabase.from("vaccinations").insert({
          organization_id: organizationId,
          pet_id: row.mapped._pet_id,
          vaccine_type: row.mapped.vaccine_type,
          administered_on: row.mapped.administered_on,
          expires_on: row.mapped.expires_on,
          vet_name: row.mapped.vet_name,
          vet_clinic: row.mapped.vet_clinic,
          verified: false,
        });
        if (error) throw error;
      } else if (dataType === "reservations") {
        const serviceId = row.mapped.service_name
          ? serviceMap.get(row.mapped.service_name.toLowerCase())
          : null;
        const { data: res, error } = await supabase
          .from("reservations")
          .insert({
            organization_id: organizationId,
            primary_owner_id: row.mapped._owner_id,
            service_id: serviceId,
            start_at: row.mapped.start_at,
            end_at: row.mapped.end_at,
            status: "checked_out",
            source: "staff_created",
            notes: row.mapped.notes,
          })
          .select("id")
          .single();
        if (error) throw error;
        if (res) {
          const { error: rpErr } = await supabase.from("reservation_pets").insert({
            organization_id: organizationId,
            reservation_id: res.id,
            pet_id: row.mapped._pet_id,
          });
          if (rpErr) throw rpErr;
        }
      }
      result.imported++;
    } catch (err: any) {
      result.errored++;
      result.errorRows.push({
        row: row.index + 2, // +1 for header, +1 for 1-indexed
        reason: err.message ?? String(err),
        data: row.raw,
      });
    }
    onProgress(i + 1, total);
  }

  return result;
}
