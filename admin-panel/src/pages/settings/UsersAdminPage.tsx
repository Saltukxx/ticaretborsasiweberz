import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { ApiError } from "@/api/http";
import {
  createUserAdmin,
  deleteUserAdmin,
  listUsersAdmin,
  patchUserAdmin,
  type AdminUserRow,
} from "@/api/usersAdmin";
import { DataTable } from "@/components/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const createSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  password: z.string().min(10),
  role: z.enum(["super_admin", "editor"]),
});

type CreateForm = z.infer<typeof createSchema>;

export function UsersAdminPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<"all" | "true" | "false">("all");
  const [q, setQ] = useState("");
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 20 });

  const listQ = useQuery({
    queryKey: ["users", "admin", active, q, pagination.pageIndex, pagination.pageSize],
    queryFn: () =>
      listUsersAdmin({
        limit: pagination.pageSize,
        offset: pagination.pageIndex * pagination.pageSize,
        active,
        q: q.trim() || undefined,
      }),
  });

  const form = useForm<CreateForm>({
    resolver: zodResolver(createSchema),
    defaultValues: { email: "", name: "", password: "", role: "editor" },
  });

  const createM = useMutation({
    mutationFn: (body: CreateForm) => createUserAdmin(body as unknown as Record<string, unknown>),
    onSuccess: () => {
      setOpen(false);
      form.reset();
      void qc.invalidateQueries({ queryKey: ["users"] });
    },
  });

  const delM = useMutation({
    mutationFn: deleteUserAdmin,
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["users"] }),
  });

  const patchM = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Record<string, unknown> }) =>
      patchUserAdmin(id, patch),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["users"] }),
  });

  const rows = listQ.data?.data ?? [];
  const total = listQ.data?.meta.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / pagination.pageSize));

  const columns = useMemo<ColumnDef<AdminUserRow>[]>(
    () => [
      { header: "E-posta", accessorKey: "email" },
      { header: "Ad", accessorKey: "name" },
      {
        header: "Rol",
        accessorKey: "role",
        cell: ({ row }) =>
          row.original.role === "super_admin" ? (
            <Badge>süper</Badge>
          ) : (
            <Badge variant="secondary">editör</Badge>
          ),
      },
      {
        id: "isActive",
        header: "Aktif",
        cell: ({ row }) => (
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={patchM.isPending}
            onClick={() =>
              patchM.mutate({
                id: row.original.id,
                patch: { isActive: !row.original.isActive },
              })
            }
          >
            {row.original.isActive ? "pasifleştir" : "aktifleştir"}
          </Button>
        ),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="text-red-700"
            disabled={delM.isPending}
            onClick={() => {
              if (confirm("Kullanıcı silinsin mi?")) delM.mutate(row.original.id);
            }}
          >
            Sil
          </Button>
        ),
      },
    ],
    [delM, patchM],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-semibold">Yöneticiler</h1>
          <p className="text-sm text-zinc-600">Süper yönetici alanı</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button type="button">Yeni kullanıcı</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Yeni yönetici</DialogTitle>
            </DialogHeader>
            <form
              className="space-y-3"
              onSubmit={form.handleSubmit(async (vals) => {
                try {
                  await createM.mutateAsync(vals);
                } catch (e) {
                  form.setError("root", {
                    message: e instanceof ApiError ? e.message : "Oluşturulamadı",
                  });
                }
              })}
            >
              {form.formState.errors.root && (
                <p className="text-sm text-red-600">{form.formState.errors.root.message}</p>
              )}
              <div className="space-y-1">
                <Label>E-posta</Label>
                <Input {...form.register("email")} />
              </div>
              <div className="space-y-1">
                <Label>Ad</Label>
                <Input {...form.register("name")} />
              </div>
              <div className="space-y-1">
                <Label>Şifre (10+)</Label>
                <Input type="password" {...form.register("password")} />
              </div>
              <div className="space-y-1">
                <Label>Rol</Label>
                <select className="h-10 w-full rounded-md border px-3 text-sm" {...form.register("role")}>
                  <option value="editor">Editör</option>
                  <option value="super_admin">Süper yönetici</option>
                </select>
              </div>
              <Button type="submit" disabled={createM.isPending}>
                Oluştur
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filtreler</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="space-y-2">
            <Label>Aktif</Label>
            <select
              className="h-10 rounded-md border px-3 text-sm"
              value={active}
              onChange={(e) => {
                setActive(e.target.value as typeof active);
                setPagination((p) => ({ ...p, pageIndex: 0 }));
              }}
            >
              <option value="all">Tümü</option>
              <option value="true">Aktif</option>
              <option value="false">Pasif</option>
            </select>
          </div>
          <div className="max-w-md flex-1 space-y-2">
            <Label>Ara</Label>
            <Input
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPagination((p) => ({ ...p, pageIndex: 0 }));
              }}
            />
          </div>
        </CardContent>
      </Card>
      <DataTable
        columns={columns}
        data={rows}
        isLoading={listQ.isLoading}
        pagination={pagination}
        onPaginationChange={setPagination}
        pageCount={pageCount}
        total={total}
        rowId={(r) => r.id}
      />
    </div>
  );
}
