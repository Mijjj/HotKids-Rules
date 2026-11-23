import { eq, sql, type SQL } from "drizzle-orm";
import { nodes, type NodeRow } from "../db/schema";
import type { Db } from "../db/client";

/** Current time in Unix seconds — the unit every timestamp column uses. */
export const nowSeconds = (): number => Math.floor(Date.now() / 1000);

/** Fetch a single node by its public `nodeId`, or null if it doesn't exist. */
export async function getNode(db: Db, nodeId: string): Promise<NodeRow | null> {
  const rows = await db.select().from(nodes).where(eq(nodes.nodeId, nodeId)).limit(1);
  return rows[0] ?? null;
}

/** Exact tag match against the JSON `tags` array. Unlike `LIKE '%"tag"%'`, the
 *  tag's `%`/`_` aren't wildcards and JSON-escaped characters still match. */
export function hasTag(tag: string): SQL {
  return sql`exists (select 1 from json_each(${nodes.tags}) where json_each.value = ${tag})`;
}
