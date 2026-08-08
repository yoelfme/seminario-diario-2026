"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  type PaginationState,
} from "@tanstack/react-table";
import { useEffect, useState } from "react";
import {
  fetchRegistrations,
  type Registration,
  type RegistrationFilters,
} from "@/lib/api";
import { useDebouncedValue } from "@/lib/use-debounced-value";

const FILTER_DEBOUNCE_MS = 300;

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

const columnHelper = createColumnHelper<Registration>();

const columns = [
  columnHelper.accessor("full_name", {
    header: "Name",
    cell: (info) => info.getValue() ?? "—",
  }),
  columnHelper.accessor("email", {
    header: "Email",
    cell: (info) => (
      <span className="font-mono text-xs">{info.getValue() ?? "—"}</span>
    ),
  }),
  columnHelper.accessor("organization", {
    header: "Organization",
    cell: (info) => info.getValue() ?? "—",
  }),
  columnHelper.accessor("ticket_type", {
    header: "Ticket",
    cell: (info) => (
      <span className="capitalize">{info.getValue() ?? "—"}</span>
    ),
  }),
  columnHelper.accessor("years_experience", {
    header: "Experience",
    cell: (info) => {
      const value = info.getValue();
      return value != null ? `${value} yrs` : "—";
    },
  }),
  columnHelper.accessor("created_at", {
    header: "Registered",
    cell: (info) => (
      <span className="text-[var(--muted)]">{formatDate(info.getValue())}</span>
    ),
  }),
];

function hasActiveFilters(filters: RegistrationFilters) {
  return Boolean(filters.email || filters.organization || filters.fullName);
}

export default function AttendeesPage() {
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 50,
  });
  const [filters, setFilters] = useState<RegistrationFilters>({
    email: "",
    organization: "",
    fullName: "",
  });

  const debouncedFilters = useDebouncedValue(filters, FILTER_DEBOUNCE_MS);

  useEffect(() => {
    setPagination((current) =>
      current.pageIndex === 0 ? current : { ...current, pageIndex: 0 },
    );
  }, [debouncedFilters]);

  const activeFilters: RegistrationFilters = {
    email: debouncedFilters.email || undefined,
    organization: debouncedFilters.organization || undefined,
    fullName: debouncedFilters.fullName || undefined,
  };

  const { data, isLoading, isError, isFetching } = useQuery({
    queryKey: ["registrations", pagination, activeFilters],
    queryFn: () =>
      fetchRegistrations({
        page: pagination.pageIndex + 1,
        pageSize: pagination.pageSize,
        ...activeFilters,
      }),
    placeholderData: keepPreviousData,
  });

  const table = useReactTable({
    data: data?.data ?? [],
    columns,
    rowCount: data?.total ?? 0,
    state: { pagination },
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
  });

  const total = data?.total ?? 0;
  const filtersActive = hasActiveFilters(activeFilters);

  if (isLoading) {
    return <p className="text-[var(--muted)]">Loading attendees…</p>;
  }

  if (isError) {
    return (
      <p className="text-[var(--error)]">
        Could not load attendees. Is the API running on port 3001?
      </p>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Registered Attendees</h1>
        <p className="mt-2 text-[var(--muted)]">
          {total.toLocaleString()} registration{total !== 1 ? "s" : ""}
          {filtersActive ? " matching filters" : " total"}
          {isFetching ? " — loading page…" : ""}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="filter-full-name" className="block text-sm font-medium">
            Full name
          </label>
          <input
            id="filter-full-name"
            type="text"
            value={filters.fullName ?? ""}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                fullName: event.target.value,
              }))
            }
            placeholder="Filter by name"
            className="mt-1 w-full rounded border border-[var(--border)] bg-transparent px-3 py-2"
          />
        </div>
        <div>
          <label htmlFor="filter-email" className="block text-sm font-medium">
            Email
          </label>
          <input
            id="filter-email"
            type="text"
            value={filters.email ?? ""}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                email: event.target.value,
              }))
            }
            placeholder="Filter by email"
            className="mt-1 w-full rounded border border-[var(--border)] bg-transparent px-3 py-2"
          />
        </div>
        <div>
          <label
            htmlFor="filter-organization"
            className="block text-sm font-medium"
          >
            Organization
          </label>
          <input
            id="filter-organization"
            type="text"
            value={filters.organization ?? ""}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                organization: event.target.value,
              }))
            }
            placeholder="Filter by organization"
            className="mt-1 w-full rounded border border-[var(--border)] bg-transparent px-3 py-2"
          />
        </div>
      </div>

      {total === 0 ? (
        <p className="text-[var(--muted)]">
          {filtersActive
            ? "No matching registrations."
            : "No registrations yet."}
        </p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr
                    key={headerGroup.id}
                    className="border-b border-[var(--border)] text-[var(--muted)]"
                  >
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        className="pb-3 pr-4 font-medium last:pr-0"
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-[var(--border)]/50"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="py-3 pr-4 last:pr-0">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                className="rounded border border-[var(--border)] px-3 py-1.5 disabled:opacity-40"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                className="rounded border border-[var(--border)] px-3 py-1.5 disabled:opacity-40"
              >
                Next
              </button>
            </div>
            <span className="text-[var(--muted)]">
              Page {table.getState().pagination.pageIndex + 1} of{" "}
              {table.getPageCount().toLocaleString()}
            </span>
            <span className="text-[var(--muted)]">
              Showing {table.getRowModel().rows.length.toLocaleString()} of{" "}
              {total.toLocaleString()}
            </span>
            <label className="flex items-center gap-2 text-[var(--muted)]">
              Rows per page
              <select
                value={table.getState().pagination.pageSize}
                onChange={(e) => table.setPageSize(Number(e.target.value))}
                className="rounded border border-[var(--border)] bg-transparent px-2 py-1"
              >
                {[25, 50, 100].map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </>
      )}
    </div>
  );
}
