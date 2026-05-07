/**
 * parser.ts
 * C# PartyInputParser → TypeScript 이식
 * "이름(본, 직업, 전투력) / ..." 형식 한 줄을 OptimizerUser 로 변환
 */

import type { TAttrKey } from "../types";
import type { OptimizerChar, OptimizerUser } from "./optimizer";

export const ATTR_LIST: readonly TAttrKey[] = [
  "궁성",
  "살성",
  "검성",
  "치유성",
  "수호성",
  "호법성",
  "정령성",
  "마도성",
];

const ALLOWED_JOBS = new Set<string>(ATTR_LIST);
const JOB_ALIASES: Record<string, string> = {
  마도: "마도성",
  궁성: "궁성",
  호법: "호법성",
  호법성: "호법성",
  살성: "살성",
  치유: "치유성",
  치유성: "치유성",
  정령: "정령성",
  정령성: "정령성",
  수호: "수호성",
  수호성: "수호성",
  검성: "검성",
};

function normalizeJobName(rawJob: string): string {
  const trimmed = rawJob.trim();
  return JOB_ALIASES[trimmed] ?? trimmed;
}

/** ^이름(본|부, 직업, 숫자)$ 패턴 */
const CHAR_PATTERN =
  /^(.+?)\(\s*(본|부)\s*[,，]\s*([^,，]+?)\s*[,，]\s*([\d,]+)\s*\)$/;

export interface ParseResult {
  users: OptimizerUser[];
  errors: string[];
}

/**
 * 텍스트 8줄 → OptimizerUser[] 변환
 * C# PartyInputParser.ReadUsers + ParseUserLine 에 해당
 */
export function parseUsers(
  text: string,
  requiredAltCount: number,
): ParseResult {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const errors: string[] = [];

  if (lines.length !== 8) {
    return {
      users: [],
      errors: [`8명의 정보가 모두 입력되어야 합니다.(현재 ${lines.length}명)`],
    };
  }

  const users: OptimizerUser[] = [];

  lines.forEach((line, li) => {
    const parts = line
      .split("/")
      .map((s) => s.trim())
      .filter(Boolean);

    if (parts.length < 1 + requiredAltCount) {
      errors.push(
        `${li + 1}번째 줄: 본캐 1개 + 부캐 ${requiredAltCount}개 이상 필요합니다.`,
      );
      return;
    }

    const chars: OptimizerChar[] = [];
    parts.forEach((part, ci) => {
      const m = CHAR_PATTERN.exec(part);
      if (!m) {
        errors.push(
          `${li + 1}번째 줄, ${ci + 1}번째 항목 형식 오류: "${part}"`,
        );
        return;
      }
      const [, rawName, kind, rawJob, rawPower] = m;
      const name = rawName.trim();
      const job = normalizeJobName(rawJob);
      const normalizedPower = rawPower.replace(/,/g, "").trim();
      const power = parseInt(normalizedPower, 10);

      if (!name) {
        errors.push(
          `${li + 1}번째 줄, ${ci + 1}번째 항목: 캐릭터명을 입력해주세요.`,
        );
        return;
      }

      if (!ALLOWED_JOBS.has(job)) {
        errors.push(`${li + 1}번째 줄 "${name}": 알 수 없는 직업 "${job}"`);
        return;
      }
      if (!normalizedPower || isNaN(power) || power <= 0) {
        errors.push(
          `${li + 1}번째 줄 "${name}": 전투력은 1 이상의 숫자를 입력해주세요. (입력값: "${rawPower}")`,
        );
        return;
      }

      chars.push({
        userIndex: li,
        charIndex: ci,
        name,
        job,
        power,
        isMain: kind === "본",
        uniqueKey: `${li}:${ci}:${name}`,
      });
    });

    const mains = chars.filter((c) => c.isMain);
    if (mains.length !== 1) {
      errors.push(
        `${li + 1}번째 줄: 본캐가 정확히 1개여야 합니다. (현재 ${mains.length}개)`,
      );
      return;
    }

    const alts = chars.filter((c) => !c.isMain);
    if (alts.length < requiredAltCount) {
      errors.push(
        `${li + 1}번째 줄: 부캐가 ${requiredAltCount}개 이상 필요합니다. (현재 ${alts.length}개)`,
      );
      return;
    }

    users.push({ userIndex: li, main: mains[0], alts });
  });

  return { users, errors };
}
