import { MapPin } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLocationContext } from "@/contexts/LocationContext";

export default function LocationSwitcher() {
  const { selectedLocationId, setSelectedLocationId, locations, isLoading } =
    useLocationContext();

  // Hide entirely if there are no locations or only one — no need to switch.
  if (isLoading) return null;
  if (locations.length <= 1) return null;

  return (
    <Select value={selectedLocationId} onValueChange={(v) => setSelectedLocationId(v as any)}>
      <SelectTrigger
        className="h-9 w-[200px] gap-2 bg-card text-sm"
        aria-label="Select location"
      >
        <MapPin className="h-3.5 w-3.5 text-text-secondary" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All locations</SelectItem>
        {locations.map((loc) => (
          <SelectItem key={loc.id} value={loc.id}>
            {loc.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
