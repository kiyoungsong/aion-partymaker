import type { ICharRowProps, TAttrKey } from "../../types";
import { ATTR_LIST } from "../../types/party";
import { Input } from "../input";
import { Pill } from "../pill";
import { Select } from "../select";
import { ATTRS } from "../token";

export const CharRow = ({ ch, onChange, onDelete }: ICharRowProps) => {
  return (
    <div
      className="grid items-center gap-1.5"
      style={{ gridTemplateColumns: "30px minmax(0,1fr) 80px 56px 24px" }}
    >
      <Pill kind={ch.kind} className="h-[26px] min-w-[28px] px-1.5 text-[11px]">
        {ch.kind}
      </Pill>
      <Input
        value={ch.name}
        onChange={(e) => onChange({ name: e.target.value })}
        placeholder="이름"
        className={`w-full`}
      />
      <div className="relative">
        <Select
          value={ch.job}
          onChange={(e) => onChange({ job: e.target.value as TAttrKey })}
          className={`w-[68px] appearance-none pr-5 font-semibold ${ATTRS[ch.job]?.text ?? ""}`}
        >
          {ATTR_LIST.map((a) => (
            <option key={a} value={a} className="bg-[#0F1422] text-[#E6ECF7]">
              {a}
            </option>
          ))}
        </Select>
        <svg
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7592]"
          width="10"
          height="10"
          viewBox="0 0 12 12"
        >
          <path
            d="M2 4l4 4 4-4"
            stroke="currentColor"
            strokeWidth="1.5"
            fill="none"
          />
        </svg>
      </div>
      <Input
        type="number"
        value={ch.power}
        onChange={(e) => onChange({ power: e.target.value })}
        placeholder="전투력"
        className={`pr-2 text-right tabular-nums min-w-16`}
        min={0}
      />
      {onDelete ? (
        <button
          onClick={onDelete}
          aria-label="삭제"
          className="cursor-pointer grid h-6 w-6 place-items-center rounded-md border border-transparent text-[#6B7592]
            transition hover:border-[rgba(255,90,90,0.2)] hover:bg-[rgba(255,90,90,0.08)] hover:text-[#FF9A9A]"
        >
          <svg width="12" height="12" viewBox="0 0 12 12">
            <path
              d="M2 2l8 8M10 2l-8 8"
              stroke="currentColor"
              strokeWidth="1.6"
            />
          </svg>
        </button>
      ) : (
        <span className="h-6 w-6" />
      )}
    </div>
  );
};
