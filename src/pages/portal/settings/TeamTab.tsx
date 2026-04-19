import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";

type Role = "owner" | "admin" | "manager" | "staff" | "customer";

type MemberRow = {
  id: string;
  profile_id: string;
  role: Role;
  active: boolean;
  profile: {
    first_name: string | null;
    last_name: string | null;
    email: string | null;
  } | null;
};

const ROLE_VARIANT: Record<Role, string> = {
  owner: "bg-foreground text-background",
  admin: "bg-purple-200 text-purple-900",
  manager: "bg-blue-200 text-blue-900",
  staff: "bg-muted text-foreground",
  customer: "bg-muted text-muted-foreground",
};

export default function TeamTab() {
  const { membership, user } = useAuth();
  const orgId = membership?.organization_id;
  const qc = useQueryClient();

  const { data: members = [], isLoading } = useQuery({
    queryKey: ["team", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data: mems, error } = await supabase
        .from("memberships")
        .select("id, profile_id, role, active")
        .eq("organization_id", orgId!);
      if (error) throw error;
      const ids = (mems ?? []).map((m) => m.profile_id);
      if (ids.length === 0) return [];
      const { data: profs, error: e2 } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, email")
        .in("id", ids);
      if (e2) throw e2;
      const map = new Map(profs?.map((p) => [p.id, p]) ?? []);
      return (mems ?? []).map((m) => ({
        ...m,
        profile: map.get(m.profile_id) ?? null,
      })) as MemberRow[];
    },
  });

  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");

  const inviteMut = useMutation({
    mutationFn: async () => {
      if (!email || !/^\S+@\S+\.\S+$/.test(email)) throw new Error("Invalid email");
      const { data: prof } = await supabase
        .from("profiles")
        .select("id, first_name, last_name")
        .ilike("email", email.trim())
        .maybeSingle();
      if (!prof) {
        throw new Error("NO_USER");
      }
      const { data: existing } = await supabase
        .from("memberships")
        .select("id")
        .eq("profile_id", prof.id)
        .eq("organization_id", orgId!)
        .maybeSingle();
      if (existing) throw new Error("Already a team member");
      // Direct insert blocked by RLS for non-self; use the create_membership RPC pattern
      // is owner/admin only. Fall back to attempting insert which may fail with 'No direct membership inserts'.
      const { error } = await supabase.from("memberships").insert({
        profile_id: prof.id,
        organization_id: orgId!,
        role: role,
        active: true,
      });
      if (error) throw error;
      return prof;
    },
    onSuccess: (prof) => {
      const name = [prof?.first_name, prof?.last_name].filter(Boolean).join(" ") || email;
      toast.success(`${name} added to team`);
      setOpen(false);
      setEmail("");
      qc.invalidateQueries({ queryKey: ["team", orgId] });
    },
    onError: (e: any) => {
      if (e.message === "NO_USER") {
        toast.info("User must sign up first, then you can add them");
      } else {
        toast.error(e.message ?? "Failed to invite");
      }
    },
  });

  const [role, setRole] = useState<Role>("staff");

  const updateRole = useMutation({
    mutationFn: async ({ id, role }: { id: string; role: Role }) => {
      const { error } = await supabase.from("memberships").update({ role }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Role updated");
      qc.invalidateQueries({ queryKey: ["team", orgId] });
    },
    onError: (e: any) => toast.error(e.message ?? "Failed"),
  });

  const deactivate = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("memberships").update({ active: false }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Member deactivated");
      qc.invalidateQueries({ queryKey: ["team", orgId] });
    },
    onError: (e: any) => toast.error(e.message ?? "Failed"),
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setOpen(true)}>
          <Plus className="mr-1.5 h-4 w-4" />
          Invite Team Member
        </Button>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-sm text-muted-foreground">
                  Loading…
                </TableCell>
              </TableRow>
            ) : members.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-sm text-muted-foreground">
                  No team members yet.
                </TableCell>
              </TableRow>
            ) : (
              members.map((m) => {
                const isMe = m.profile_id === user?.id;
                const fullName =
                  [m.profile?.first_name, m.profile?.last_name].filter(Boolean).join(" ") || "—";
                return (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium">
                      {fullName}
                      {isMe && <span className="ml-2 text-xs text-muted-foreground">(you)</span>}
                    </TableCell>
                    <TableCell className="text-sm">{m.profile?.email ?? "—"}</TableCell>
                    <TableCell>
                      {m.role === "owner" || isMe ? (
                        <Badge className={ROLE_VARIANT[m.role]}>{m.role}</Badge>
                      ) : (
                        <Select
                          value={m.role}
                          onValueChange={(v) =>
                            updateRole.mutate({ id: m.id, role: v as Role })
                          }
                        >
                          <SelectTrigger className="h-8 w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">admin</SelectItem>
                            <SelectItem value="manager">manager</SelectItem>
                            <SelectItem value="staff">staff</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={m.active ? "default" : "secondary"}>
                        {m.active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {!isMe && m.active && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (confirm(`Deactivate ${fullName}?`)) deactivate.mutate(m.id);
                          }}
                        >
                          Deactivate
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">Invite team member</DialogTitle>
            <DialogDescription>
              The user must already have a Snout account. Real email invites coming soon.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Email *</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="person@example.com"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Role</Label>
              <Select value={role} onValueChange={(v) => setRole(v as Role)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">admin</SelectItem>
                  <SelectItem value="manager">manager</SelectItem>
                  <SelectItem value="staff">staff</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => inviteMut.mutate()} disabled={inviteMut.isPending}>
              {inviteMut.isPending ? "Adding…" : "Add member"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
