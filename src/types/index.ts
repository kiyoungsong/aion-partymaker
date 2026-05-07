export interface IPlayerCardProps {
  player: IPlayerDraft;
  altCount: number;
  onCharChange: (cid: string, patch: Partial<ICharDraft>) => void;
  onAddAlt: () => void;
  onRemoveChar: (cid: string) => void;
  onClear: () => void;
}

export interface ICharDraft {
  id: string;
  name: string;
  kind: "본" | "부";
  job: TAttrKey;
  power: string;
}

export interface IPlayerDraft {
  id: string;
  chars: ICharDraft[];
}

export type TAttrKey =
  | "궁성"
  | "살성"
  | "검성"
  | "치유성"
  | "수호성"
  | "호법성"
  | "정령성"
  | "마도성";

export interface ICharRowProps {
  ch: ICharDraft;
  onChange: (patch: Partial<ICharDraft>) => void;
  onDelete?: () => void;
}

export interface IBulkPanelProps {
  value: string;
  onChange: (s: string) => void;
  errors: string[];
  onClose: () => void;
  onApply: () => void;
}
