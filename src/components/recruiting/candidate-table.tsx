import * as React from "react";
import { Link } from "@tanstack/react-router";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
  SortingState,
} from "@tanstack/react-table";
import { ArrowUpDown, Star, GitCompare } from "lucide-react";
import { ScoredCandidate } from "@/lib/recruiting/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/recruiting/Avatar";
import { useRecruiterStore, MAX_COMPARE_CANDIDATES } from "@/lib/recruiting/store";
import { cn } from "@/lib/utils";

const columnHelper = createColumnHelper<ScoredCandidate>();

export function CandidateTable({ data }: { data: ScoredCandidate[] }) {
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "score", desc: true },
  ]);

  const shortlist = useRecruiterStore((s) => s.shortlist);
  const compare = useRecruiterStore((s) => s.compare);
  const toggleShortlist = useRecruiterStore((s) => s.toggleShortlist);
  const toggleCompare = useRecruiterStore((s) => s.toggleCompare);

  const columns = React.useMemo(
    () => [
      columnHelper.accessor((row) => row.candidate.fullName, {
        id: "name",
        header: "Candidate",
        cell: (info) => {
          const c = info.row.original.candidate;
          return (
            <div className="flex items-center gap-3">
              <Avatar name={c.fullName} src={c.profileImageUrl} className="size-8 text-xs" />
              <div className="min-w-0">
                <Link
                  to="/recruiting/candidates/$id"
                  params={{ id: c.externalId }}
                  className="block truncate font-medium hover:underline"
                >
                  {c.fullName}
                </Link>
                <p className="truncate text-xs text-muted-foreground">
                  {c.currentJobTitle}
                </p>
              </div>
            </div>
          );
        },
      }),
      columnHelper.accessor((row) => row.candidate.currentCompany, {
        id: "company",
        header: "Company",
        cell: (info) => info.getValue() ?? "-",
      }),
      columnHelper.accessor((row) => row.candidate.location, {
        id: "location",
        header: "Location",
        cell: (info) => (
          <span className="text-sm text-muted-foreground">
            {info.getValue() ?? "-"}
          </span>
        ),
      }),
      columnHelper.accessor((row) => row.candidate.yearsOfExperience ?? 0, {
        id: "experience",
        header: "Exp (yrs)",
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor((row) => row.candidate.provider, {
        id: "provider",
        header: "Provider",
        cell: (info) => <Badge variant="outline">{info.getValue()}</Badge>,
      }),
      columnHelper.accessor((row) => row.score, {
        id: "score",
        header: "Score",
        cell: (info) => {
          const v = info.getValue();
          return (
            <Badge variant={v >= 75 ? "success" : v >= 50 ? "warning" : "muted"}>
              {Math.round(v)}
            </Badge>
          );
        },
      }),
      columnHelper.display({
        id: "actions",
        header: "",
        cell: (info) => {
          const c = info.row.original.candidate;
          const isShort = Boolean(shortlist[c.id]);
          const isComp = compare.some((x) => x.id === c.id);
          const compFull = compare.length >= MAX_COMPARE_CANDIDATES;
          return (
            <div className="flex items-center justify-end gap-1">
              <Button
                variant={isShort ? "default" : "ghost"}
                size="icon"
                aria-label="Shortlist"
                onClick={() => toggleShortlist(c, info.row.original.score)}
              >
                <Star className={cn("size-4", isShort && "fill-current")} />
              </Button>
              <Button
                variant={isComp ? "default" : "ghost"}
                size="icon"
                aria-label="Compare"
                disabled={!isComp && compFull}
                onClick={() => toggleCompare(c)}
              >
                <GitCompare className="size-4" />
              </Button>
            </div>
          );
        },
      }),
    ],
    [shortlist, compare, toggleShortlist, toggleCompare]
  );

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="rounded-xl border border-border">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((hg) => (
            <TableRow key={hg.id}>
              {hg.headers.map((header) => {
                const canSort = header.column.getCanSort();
                return (
                  <TableHead key={header.id}>
                    {header.isPlaceholder ? null : canSort ? (
                      <button
                        className="inline-flex items-center gap-1 hover:text-foreground"
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                        <ArrowUpDown className="size-3" />
                      </button>
                    ) : (
                      flexRender(header.column.columnDef.header, header.getContext())
                    )}
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
