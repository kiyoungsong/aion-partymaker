import type { Weights } from "../../types/party";
import { GhostButton, PrimaryButton } from "../button";
import { useEffect } from "react";
import {
  FormProvider,
  useForm,
  useFormContext,
  useWatch,
} from "react-hook-form";

interface WeightsModalProps {
  weights: Weights;
  setWeights: (weights: Weights) => void;
  onClose: () => void;
  onReset: () => void;
}

const DAMAGE_FIELDS: Array<{ key: keyof Weights["damage"]; label: string }> = [
  { key: "살성", label: "살성 (딜)" },
  { key: "마도성", label: "마도성 (딜)" },
  { key: "정령성", label: "정령성 (딜)" },
  { key: "궁성", label: "궁성 (딜)" },
  { key: "수호성", label: "수호성 (탱)" },
  { key: "검성", label: "검성 (탱)" },
  { key: "호법성", label: "호법성 (버프)" },
  { key: "치유성", label: "치유성 (힐)" },
];

export function WeightsModal({
  weights,
  setWeights,
  onClose,
  onReset,
}: WeightsModalProps) {
  const methods = useForm<Weights>({
    defaultValues: weights,
  });
  const { handleSubmit, reset } = methods;

  useEffect(() => {
    reset(weights);
  }, [weights, reset]);

  const handleSave = (value: Weights) => {
    setWeights(value);
    onClose();
  };

  const handleReset = () => {
    reset(weights);
    onReset();
  };

  return (
    <div
      className="fixed h-screen inset-0 bg-[rgba(8,10,18,0.6)] backdrop-blur-xs flex items-center justify-center z-200 p-5
        animate-[backdropIn_0.15s_ease-out]"
      onClick={onClose}
    >
      <FormProvider {...methods}>
        <form
          className="w-full max-w-[520px] bg-[#131A2B] border border-[#232C45] rounded-[14px]
            shadow-[0_24px_60px_rgba(0,0,0,0.5)] p-[22px] max-h-[85vh] overflow-y-auto
            animate-[modalIn_0.18s_ease-out]"
          onClick={(e) => e.stopPropagation()}
          onSubmit={handleSubmit(handleSave)}
        >
          {/* 헤더 */}
          <div className="flex items-center justify-between mb-1.5">
            <h3 className="m-0 text-[16px] font-semibold text-[#E6ECF7] tracking-tight">
              가중치 설정
            </h3>
            <button
              type="button"
              onClick={onClose}
              aria-label="닫기"
              className="cursor-pointer w-7 h-7 inline-flex items-center justify-center rounded-[7px] border-0 bg-transparent
                text-[#6B7592] transition hover:text-[#E6ECF7] hover:bg-[#182037]"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="text-[12.5px] text-[#6B7592] leading-[1.55] mb-[18px]">
            파티 자동 편성 시 각 항목이 결과에 미치는 영향을 조절합니다. <br />
            값이 클수록 해당 기준을 더 강하게 반영합니다.
          </p>

          {/* 딜 가중치 */}
          <div className="grid grid-cols-2 gap-3 mt-5">
            {DAMAGE_FIELDS.map(({ key, label }) => (
              <SliderRow key={key} name={key} label={label} hint="" max={100} />
            ))}
          </div>

          {/* 푸터 */}
          <div className="flex justify-end gap-2 mt-[18px] pt-4 border-t border-[#232C45]">
            <GhostButton type="button" onClick={handleReset}>
              기본값으로
            </GhostButton>
            <PrimaryButton type="submit">완료</PrimaryButton>
          </div>
        </form>
      </FormProvider>
    </div>
  );
}

interface SliderRowProps {
  name: keyof Weights["damage"];
  label: string;
  hint: string;
  max: number;
}

function SliderRow({ name, label, hint, max }: SliderRowProps) {
  const { control, setValue } = useFormContext<Weights>();
  const damage = useWatch({ control, name: "damage" });
  const currentValue = damage?.[name] ?? 0;
  const sliderValue = Math.round(currentValue * 100);
  const pct = `${(sliderValue / max) * 100}%`;

  return (
    <div className="bg-[#182037] border border-[#232C45] rounded-[10px] px-3.5 py-3">
      <div className="flex items-center justify-between gap-3 mb-2.5">
        <div>
          <div className="text-[13.5px] font-semibold text-[#E6ECF7]">
            {label}
          </div>
          {hint && (
            <div className="text-[11.5px] text-[#6B7592] mt-0.5">{hint}</div>
          )}
        </div>
        <div
          className="tabular-nums text-[14px] font-semibold text-[#6F9CFF] bg-[rgba(110,145,240,0.12)]
          border border-[rgba(110,145,240,0.28)] rounded-[6px] px-2 py-px min-w-[48px] text-center"
        >
          {currentValue.toFixed(2)}
        </div>
      </div>
      <input
        type="range"
        min={0}
        max={max}
        step={1}
        value={sliderValue}
        onChange={(e) => {
          setValue(`damage.${name}`, Number(e.target.value) / 100, {
            shouldDirty: true,
          });
        }}
        style={{ "--p": pct } as React.CSSProperties}
        className="w-full h-1 rounded-full outline-none cursor-pointer appearance-none
          [background:linear-gradient(to_right,#4F7BE6_0%,#4F7BE6_var(--p,50%),rgba(255,255,255,0.10)_var(--p,50%),rgba(255,255,255,0.10)_100%)]
          [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
          [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white
          [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[#4F7BE6]
          [&::-webkit-slider-thumb]:shadow-[0_2px_6px_rgba(0,0,0,0.4)] [&::-webkit-slider-thumb]:cursor-pointer"
      />
    </div>
  );
}
