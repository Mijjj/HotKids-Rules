import { useState } from "react";
import { Chip, Input, Label, TextField } from "@heroui/react";
import { MAX_TAGS } from "@snell-panel/shared";

const MAX_TAG_LENGTH = 32;

/** Small tag chips for read-only display (table rows, cards). */
export function TagChips({ tags }: { tags: string[] }) {
  if (tags.length === 0) return null;
  return (
    <span className="inline-flex flex-wrap gap-1">
      {tags.map((t) => (
        <Chip key={t} size="sm" variant="soft" color="accent">
          {t}
        </Chip>
      ))}
    </span>
  );
}

/**
 * Editable tag list: type and press Enter (or comma) to add, × to remove,
 * Backspace on an empty input removes the last tag. `suggestions` are tags
 * already used on other nodes, offered as one-click additions.
 */
export function TagInput({
  value,
  onChange,
  suggestions = [],
}: {
  value: string[];
  onChange: (tags: string[]) => void;
  suggestions?: string[];
}) {
  const [draft, setDraft] = useState("");
  const [hint, setHint] = useState("");

  function add(raw: string) {
    const tag = raw.trim();
    setDraft("");
    if (!tag) return;
    if (tag.length > MAX_TAG_LENGTH) return setHint(`Tags are at most ${MAX_TAG_LENGTH} characters.`);
    if (value.includes(tag)) return setHint("");
    if (value.length >= MAX_TAGS) return setHint(`At most ${MAX_TAGS} tags per node.`);
    setHint("");
    onChange([...value, tag]);
  }

  const remove = (tag: string) => onChange(value.filter((t) => t !== tag));
  const unused = suggestions.filter((t) => !value.includes(t));

  return (
    <div className="flex flex-col gap-2">
      <TextField value={draft} onChange={setDraft}>
        <Label>Tags</Label>
        <Input
          placeholder="type a tag, press Enter"
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              add(draft);
            } else if (e.key === "Backspace" && !draft && value.length) {
              remove(value[value.length - 1]);
            }
          }}
          onBlur={() => draft.trim() && add(draft)}
        />
      </TextField>

      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((t) => (
            <Chip key={t} size="sm" variant="soft" color="accent">
              <span className="inline-flex items-center gap-1">
                {t}
                <button
                  type="button"
                  aria-label={`Remove tag ${t}`}
                  className="-mr-1 rounded-full px-1 leading-none opacity-60 hover:opacity-100"
                  onClick={() => remove(t)}
                >
                  ×
                </button>
              </span>
            </Chip>
          ))}
        </div>
      )}

      {unused.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-muted">Existing:</span>
          {unused.map((t) => (
            <button
              key={t}
              type="button"
              className="rounded-full border border-black/10 px-2 py-0.5 hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10"
              onClick={() => add(t)}
            >
              + {t}
            </button>
          ))}
        </div>
      )}

      {hint && <p className="text-xs text-danger">{hint}</p>}
    </div>
  );
}
