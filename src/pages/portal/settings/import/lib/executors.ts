import { supabase } from "@/integrations/supabase/client";
import type { DataType, ImportResult, SourceSystem, ValidatedRow } from "./types";

type Progress = (done: number, total: number) => void;

const OWNER_BATCH_SIZE = 200;

export async function executeImport(
  dataType: DataType,
  rows: ValidatedRow[],
  organizationId: string,
  onProgress: Progress,
  sourceSystem: SourceSystem = "other",
): Promise<ImportResult> {
  const result: ImportResult = { imported: 0, skipped: 0, errored: 0, errorRows: [] };
  const toImport = rows.filter((r) => r.include);
  result.skipped = rows.length - toImport.length;
  const total = toImport.length;

  // Pre-load services for reservations
  const serviceMap = new Map<string, string>();
  if (dataType === "reservations") {
    const { data: services } = await supabase
      .from("services")
      .select("id, name")
      .eq("organization_id", organizationId)
      .is("deleted_at", null);
    for (const s of services ?? []) serviceMap.set(s.name.toLowerCase(), s.id);
  }

  // ===== OWNERS: batched inserts =====
  if (dataType === "owners") {
    for (let start = 0; start < toImport.length; start += OWNER_BATCH_SIZE) {
      const batch = toImport.slice(start, start + OWNER_BATCH_SIZE);
      const payload = batch.map((row) => ({
        organization_id: organizationId,
        first_name: row.mapped.first_name || null,
        last_name: row.mapped.last_name || null,
        email: row.mapped.email || null,
        phone: row.mapped.phone || null,
        street_address: row.mapped.street_address || null,
        city: row.mapped.city || null,
        state_province: row.mapped.state_province || null,
        postal_code: row.mapped.postal_code || null,
        notes: row.mapped.notes || null,
        external_id: row.mapped.external_id || null,
        external_source: row.mapped.external_id ? sourceSystem : null,
      }));

      const { error, count } = await supabase
        .from("owners")
        .insert(payload, { count: "exact" });

      if (error) {
        // Batch failed — fall back to per-row to identify which rows are bad
        for (const row of batch) {
          try {
            const { error: rowErr } = await supabase.from("owners").insert({
              organization_id: organizationId,
              first_name: row.mapped.first_name || null,
              last_name: row.mapped.last_name || null,
              email: row.mapped.email || null,
              phone: row.mapped.phone || null,
              street_address: row.mapped.street_address || null,
              city: row.mapped.city || null,
              state_province: row.mapped.state_province || null,
              postal_code: row.mapped.postal_code || null,
              notes: row.mapped.notes || null,
              external_id: row.mapped.external_id || null,
              external_source: row.mapped.external_id ? sourceSystem : null,
            });
            if (rowErr) throw rowErr;
            result.imported++;
          } catch (err: any) {
            result.errored++;
            result.errorRows.push({
              row: row.index + 2,
              reason: err.message ?? String(err),
              data: row.raw,
            });
          }
        }
      } else {
        result.imported += count ?? batch.length;
      }
      onProgress(Math.min(start + batch.length, total), total);
    }
    return result;
  }

  // ===== Other types: per-row (relational links require returned IDs) =====
  for (let i = 0; i < toImport.length; i++) {
    const row = toImport[i];
    try {
      if (dataType === "pets") {
        const { data: pet, error } = await supabase
          .from("pets")
          .insert({
            organization_id: organizationId,
            name: row.mapped.name,
            species: row.mapped.species,
            breed: row.mapped.breed || null,
            sex: row.mapped.sex,
            date_of_birth: row.mapped.date_of_birth || null,
            weight_kg: row.mapped.weight_kg ?? null,
            color: row.mapped.color || null,
            microchip_id: row.mapped.microchip_id || null,
            spayed_neutered: row.mapped.spayed_neutered ?? null,
            behavioral_notes: row.mapped.behavioral_notes || null,
            external_id: row.mapped.external_id || null,
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
        row: row.index + 2,
        reason: err.message ?? String(err),
        data: row.raw,
      });
    }
    onProgress(i + 1, total);
  }

  return result;
}
