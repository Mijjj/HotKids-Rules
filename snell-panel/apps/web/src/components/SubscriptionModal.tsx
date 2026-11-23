import { useMemo, useState } from "react";
import {
  Button,
  Input,
  Label,
  ListBox,
  Modal,
  Select,
  TextField,
} from "@heroui/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { SettingsResponse, SubscriptionFormat } from "@snell-panel/shared";
import { api } from "../api/client";
import { useNodes } from "../api/hooks";
import { CopyButton } from "./CopyButton";

const ALL = "__all__";

export function SubscriptionModal({
  isOpen,
  onOpenChange,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const qc = useQueryClient();
  const settings = useQuery({
    queryKey: ["settings"],
    queryFn: api.settings,
    enabled: isOpen,
  });

  const [format, setFormat] = useState<SubscriptionFormat>("surge");
  const [flag, setFlag] = useState(true);
  const [filter, setFilter] = useState("");
  const [via, setVia] = useState("");
  const [tag, setTag] = useState(ALL);

  // Tags of nodes the subscription actually serves (active + enabled), with counts.
  const nodes = useNodes();
  const tagCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const n of nodes.data ?? []) {
      if (n.status !== "active" || !n.enabled) continue;
      for (const t of n.tags) counts.set(t, (counts.get(t) ?? 0) + 1);
    }
    return [...counts].sort(([a], [b]) => a.localeCompare(b));
  }, [nodes.data]);
  // A tag removed from every node falls back to "All nodes".
  const activeTag = tag !== ALL && tagCounts.some(([t]) => t === tag) ? tag : ALL;

  const reset = useMutation({
    mutationFn: api.resetSubscribeToken,
    onSuccess: (d: SettingsResponse) => qc.setQueryData(["settings"], d),
  });

  const buildUrl = (forTag: string | null) => {
    if (!settings.data) return "";
    const p = new URLSearchParams();
    p.set("token", settings.data.subscribe_token);
    p.set("format", format);
    if (!flag) p.set("flag", "false");
    if (forTag) p.set("tag", forTag);
    if (filter.trim()) p.set("filter", filter.trim());
    // Relay (underlying-proxy) is Surge-only.
    if (via.trim() && format === "surge") p.set("via", via.trim());
    return `${window.location.origin}/api/subscribe?${p.toString()}`;
  };
  const url = buildUrl(activeTag === ALL ? null : activeTag);

  return (
    <Modal.Backdrop isOpen={isOpen} onOpenChange={onOpenChange}>
      <Modal.Container>
        <Modal.Dialog className="sm:max-w-[640px]">
          <Modal.CloseTrigger />
          <Modal.Header>
            <Modal.Heading>Subscription</Modal.Heading>
          </Modal.Header>
          <Modal.Body>
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Select
                  selectedKey={format}
                  onSelectionChange={(k) =>
                    setFormat(String(k) as SubscriptionFormat)
                  }
                >
                  <Label>Format</Label>
                  <Select.Trigger>
                    <Select.Value />
                    <Select.Indicator />
                  </Select.Trigger>
                  <Select.Popover>
                    <ListBox>
                      <ListBox.Item id="surge" textValue="Surge">
                        Surge
                        <ListBox.ItemIndicator />
                      </ListBox.Item>
                      <ListBox.Item id="shadowrocket" textValue="Shadowrocket">
                        Shadowrocket
                        <ListBox.ItemIndicator />
                      </ListBox.Item>
                      <ListBox.Item id="mihomo" textValue="Mihomo">
                        Mihomo
                        <ListBox.ItemIndicator />
                      </ListBox.Item>
                    </ListBox>
                  </Select.Popover>
                </Select>

                <Select
                  selectedKey={flag ? "on" : "off"}
                  onSelectionChange={(k) => setFlag(String(k) === "on")}
                >
                  <Label>Country flag</Label>
                  <Select.Trigger>
                    <Select.Value />
                    <Select.Indicator />
                  </Select.Trigger>
                  <Select.Popover>
                    <ListBox>
                      <ListBox.Item id="on" textValue="Show">
                        Show
                        <ListBox.ItemIndicator />
                      </ListBox.Item>
                      <ListBox.Item id="off" textValue="Hide">
                        Hide
                        <ListBox.ItemIndicator />
                      </ListBox.Item>
                    </ListBox>
                  </Select.Popover>
                </Select>

                <Select
                  selectedKey={activeTag}
                  onSelectionChange={(k) => setTag(String(k))}
                >
                  <Label>Tag</Label>
                  <Select.Trigger>
                    <Select.Value />
                    <Select.Indicator />
                  </Select.Trigger>
                  <Select.Popover>
                    <ListBox>
                      <ListBox.Item id={ALL} textValue="All nodes">
                        All nodes
                        <ListBox.ItemIndicator />
                      </ListBox.Item>
                      {tagCounts.map(([t, c]) => (
                        <ListBox.Item key={t} id={t} textValue={t}>
                          {t} ({c})
                          <ListBox.ItemIndicator />
                        </ListBox.Item>
                      ))}
                    </ListBox>
                  </Select.Popover>
                </Select>

                <TextField value={filter} onChange={setFilter}>
                  <Label>Filter (name contains)</Label>
                  <Input placeholder="optional" />
                </TextField>
                {format === "surge" && (
                  <TextField value={via} onChange={setVia}>
                    <Label>Relay (underlying-proxy)</Label>
                    <Input placeholder="optional" />
                  </TextField>
                )}
              </div>

              <TextField value={url} className="w-full">
                <Label>Subscription URL</Label>
                <Input readOnly className="font-mono text-xs" />
              </TextField>

              {tagCounts.length > 0 && (
                <div className="flex flex-col gap-2">
                  <p className="text-sm font-medium">By tag</p>
                  <p className="text-xs text-muted">
                    One URL per tag, using the format and options above.
                  </p>
                  <ul className="flex flex-col divide-y divide-black/5 rounded-xl border border-black/5 dark:divide-white/10 dark:border-white/10">
                    {tagCounts.map(([t, c]) => (
                      <li key={t} className="flex items-center justify-between gap-3 px-3 py-2">
                        <span className="min-w-0 truncate text-sm">
                          {t} <span className="text-muted">· {c} node{c === 1 ? "" : "s"}</span>
                        </span>
                        <CopyButton text={buildUrl(t)} label="Copy URL" />
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="danger"
              isDisabled={reset.isPending}
              onPress={() => {
                if (
                  confirm(
                    "Reset the subscribe token? Existing subscription URLs will stop working.",
                  )
                ) {
                  reset.mutate();
                }
              }}
            >
              {reset.isPending ? "Resetting…" : "Reset token"}
            </Button>
            <CopyButton text={url} label="Copy URL" />
            <Button variant="tertiary" slot="close">
              Close
            </Button>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
