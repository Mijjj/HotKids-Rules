import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "./client";

export const nodeQueryKey = ["nodes"] as const;

export function useNodes() {
  return useQuery({ queryKey: nodeQueryKey, queryFn: api.listNodes });
}

/** Every tag in use, sorted by name, with how many nodes carry it. */
export function useTagCounts(): { tag: string; count: number }[] {
  const { data } = useNodes();
  return useMemo(() => {
    const counts = new Map<string, number>();
    for (const n of data ?? []) {
      for (const t of n.tags) counts.set(t, (counts.get(t) ?? 0) + 1);
    }
    return [...counts]
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => a.tag.localeCompare(b.tag));
  }, [data]);
}
