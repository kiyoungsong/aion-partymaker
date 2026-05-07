import type { IBulkPanelProps } from "../../types";
import { GhostButton, PrimaryButton } from "../button";

/**
 * 텍스트 입력으로 직업 넣는 부분
 */
export const BulkPanel = ({
  value,
  onChange,
  errors,
  onClose,
  onApply,
}: IBulkPanelProps) => {
  return (
    <div
      className="flex flex-col gap-2.5 rounded-[14px] border border-[#232C45] px-4 py-3.5
      bg-linear-to-b from-[rgba(28,36,60,0.7)] to-[rgba(18,24,42,0.7)]"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[14px] font-bold text-left">
            텍스트로 일괄 입력
          </div>
          <div className="mt-1  text-[#9AA6BF]">
            한 줄에 한 명의 플레이어 정보를 입력 :{" "}
            <span className="rounded border border-[#324379] bg-[#324379] px-1.5 py-px  text-[#E6ECF7]">
              이름(본, 직업, 전투력) / 이름(부, 직업, 전투력) / …
            </span>
          </div>
        </div>
        <GhostButton onClick={onClose} aria-label="닫기">
          <svg width="14" height="14" viewBox="0 0 12 12">
            <path
              d="M2 2l8 8M10 2l-8 8"
              stroke="currentColor"
              strokeWidth="1.6"
            />
          </svg>
        </GhostButton>
      </div>
      <textarea
        rows={9}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={BULK_PLACEHOLDER}
        spellCheck={false}
        className="min-h-[140px] w-full resize-y rounded-[9px] border border-[#1B2238] bg-[#0F1422] px-3 py-2.5 font-mono text-[12.5px] leading-7 text-[#E6ECF7] outline-none focus:border-[#6F9CFF] placeholder:text-[#4A5474]"
      />
      {errors.length > 0 && (
        <div className="rounded-lg border border-[rgba(255,90,90,0.22)] bg-[rgba(255,90,90,0.06)] px-3 py-2 text-[11.5px] leading-6 text-[#FFB3B3]">
          {errors.slice(0, 5).map((e, i) => (
            <div key={i}>• {e}</div>
          ))}
          {errors.length > 5 && <div>… 외 {errors.length - 5}건</div>}
        </div>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <GhostButton onClick={() => onChange(BULK_PLACEHOLDER)}>
          예시 채우기
        </GhostButton>
        <div className="flex-1" />
        <GhostButton onClick={onClose}>취소</GhostButton>
        <PrimaryButton onClick={onApply} disabled={!value.trim()}>
          적용
        </PrimaryButton>
      </div>
    </div>
  );
};

const BULK_PLACEHOLDER = `예시)
브라우니(본, 마도성, 520) / 궁향(부, 궁성, 180) / 호향(부, 호법성, 200) / 시류혼(부, 살성, 190)
차정준(본, 궁성, 467) / 귀유미(부, 치유성, 501) / 양의지(부, 살성, 220) / 조수행(부, 수호성, 225)
천국(본, 호법성, 545) / 빈하(부, 치유성, 220) / 태빈(부, 수호성, 180) / 태민(부, 궁성, 150)
대삭(본, 검성, 580) / 수삭(부, 정령성, 190) / 호삭(부, 호법성, 180) / 대삭부(부, 검성, 210)
송곳(본, 궁성, 520) / 맹타(부, 검성, 160) / 쉬이(부, 궁성, 192) / 송곳부(부, 궁성, 240)
정카리(본, 검성, 557) / 궁카리(부, 궁성, 200) / 카리뽈(부, 치유성, 245) / 카리부(부, 호법성, 190)
살괭이(본, 살성, 530) / 르(부, 호법성, 153) / 살괭이부(부, 궁성, 300) / 괭이뉴(부, 마도성, 180)
레잉(본, 검성, 470) / 귀멸의티모(부, 검성, 220) / 빙결(부, 마도성, 160) / 레잉부(부, 호법성, 320)`;
