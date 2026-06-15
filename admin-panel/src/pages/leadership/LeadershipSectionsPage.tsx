import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  LEADERSHIP_GROUPS,
  PRESIDENT_ROLE_KEY,
  deleteLeadershipAdmin,
  leadershipGroupLabel,
  listLeadershipAdmin,
  type LeadershipGroupKey,
  type LeadershipRow,
} from "@/api/leadershipAdmin";
import { DataTable } from "@/components/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

function SectionTable({
  groupKey,
  addLabel,
  extraActions,
}: {
  groupKey: LeadershipGroupKey;
  addLabel: string;
  extraActions?: ReactNode;
}) {
  const qc = useQueryClient();
  const [q, setQ] = useState("");

  const listQ = useQuery({
    queryKey: ["leadership", "section", groupKey, q],
    queryFn: () =>
      listLeadershipAdmin({
        limit: 200,
        offset: 0,
        active: "all",
        groupKey,
        q: q.trim() || undefined,
      }),
  });

  const delM = useMutation({
    mutationFn: deleteLeadershipAdmin,
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["leadership"] }),
  });

  const rows = listQ.data?.data ?? [];
  const total = listQ.data?.meta.total ?? rows.length;

  const columns = useMemo<ColumnDef<LeadershipRow>[]>(
    () => [
      {
        id: "name",
        header: "Ad soyad",
        cell: ({ row }) => (
          <Link
            className="font-medium hover:underline"
            to={`/leadership/${row.original.id}/edit`}
          >
            {row.original.name}
          </Link>
        ),
      },
      { header: "Ünvan", accessorKey: "title" },
      { header: "Sıra", accessorKey: "sortOrder" },
      {
        id: "isActive",
        header: "Durum",
        cell: ({ row }) =>
          row.original.isActive ? (
            <Badge className="bg-emerald-600">Yayında</Badge>
          ) : (
            <Badge variant="secondary">Pasif</Badge>
          ),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => {
          const isPresident = row.original.roleKey === PRESIDENT_ROLE_KEY;
          return (
            <div className="flex justify-end gap-2">
              <Button size="sm" variant="outline" asChild>
                <Link to={`/leadership/${row.original.id}/edit`}>Düzenle</Link>
              </Button>
              {!isPresident && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-red-700"
                  disabled={delM.isPending}
                  onClick={() => {
                    if (confirm(`${row.original.name} silinsin mi?`)) {
                      delM.mutate(row.original.id);
                    }
                  }}
                >
                  Sil
                </Button>
              )}
            </div>
          );
        },
      },
    ],
    [delM],
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <p className="text-sm text-zinc-600">
          {leadershipGroupLabel(groupKey)} — {total} kişi
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {extraActions}
          <Button asChild>
            <Link to={`/leadership/new?group=${groupKey}`}>{addLabel}</Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ara</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-w-md space-y-2">
            <Label>Ad soyad</Label>
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="İsimle filtrele…"
            />
          </div>
        </CardContent>
      </Card>

      <DataTable
        columns={columns}
        data={rows}
        isLoading={listQ.isLoading}
        pagination={{ pageIndex: 0, pageSize: rows.length || 1 }}
        onPaginationChange={() => undefined}
        pageCount={1}
        total={total}
        rowId={(r) => r.id}
      />
    </div>
  );
}

export function LeadershipSectionsPage() {
  const [tab, setTab] = useState<LeadershipGroupKey>("yonetim_kurulu");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Yönetim şeması</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Meclis, yönetim kurulu ve diğer gruplardaki isimleri ekleyin veya kaldırın.
          Değişiklikler{" "}
          <a
            href="/kurumsal/yonetim"
            target="_blank"
            rel="noreferrer"
            className="underline"
          >
            kurumsal yönetim sayfasında
          </a>{" "}
          görünür.
        </p>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as LeadershipGroupKey)}>
        <TabsList className="flex h-auto flex-wrap gap-1">
          {LEADERSHIP_GROUPS.map((g) => (
            <TabsTrigger key={g.value} value={g.value}>
              {g.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {LEADERSHIP_GROUPS.map((g) => (
          <TabsContent key={g.value} value={g.value}>
            <SectionTable
              groupKey={g.value}
              addLabel={`+ ${g.label} ekle`}
              extraActions={
                g.value === "yonetim_kurulu" ? (
                  <Button variant="outline" asChild>
                    <Link to="/president-message">Başkan mesajını düzenle</Link>
                  </Button>
                ) : undefined
              }
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
