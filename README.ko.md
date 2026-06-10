# agent-log-digest

[![npm version](https://img.shields.io/npm/v/agent-log-digest)](https://www.npmjs.com/package/agent-log-digest)
[![npm downloads](https://img.shields.io/npm/dw/agent-log-digest)](https://www.npmjs.com/package/agent-log-digest)
[![CI](https://github.com/mylee04/agent-log-digest/actions/workflows/ci.yml/badge.svg)](https://github.com/mylee04/agent-log-digest/actions/workflows/ci.yml)
[![GitHub stars](https://img.shields.io/github/stars/mylee04/agent-log-digest)](https://github.com/mylee04/agent-log-digest)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

[English README](./README.md)

테스트, 린트, 타입체크, 빌드 로그처럼 길고 시끄러운 출력을 AI 코딩 에이전트가 바로 읽을 수 있는 간결한 JSON으로 정리합니다.

`agent-log-digest`는 로컬에서만 동작하는 Node CLI입니다. 명령을 감싸서 실행하거나 이미 저장된 로그 파일을 파싱하고, 기본적으로 민감 정보를 가린 뒤, 알려진 도구의 출력 형식을 감지해 결정적인 digest를 만듭니다. 텔레메트리, 호스팅 서비스, LLM 호출은 없습니다.

이 CLI가 시간을 아껴줬다면 [GitHub 저장소에 star](https://github.com/mylee04/agent-log-digest)를 눌러 주세요. 다른 개발자가 AI 코딩 에이전트용 로컬 전용 도구를 찾는 데 도움이 됩니다.

## 설치

```bash
npm install -D agent-log-digest
```

초기 테스트에서는 `npx`로 바로 실행할 수 있습니다.

```bash
npx agent-log-digest --json -- npm test
```

## 사용법

명령을 감싸서 실행하고 원래 exit code를 유지합니다.

```bash
agent-log-digest --json -- npm run typecheck
```

저장된 로그 파일을 파싱합니다.

```bash
agent-log-digest parse ./logs/eslint.log --tool eslint --json --output ./digest.json
```

실패한 명령을 digest에는 기록하되 CI 단계는 통과시키고 싶다면 `--always-zero`를 사용합니다.

```bash
agent-log-digest --json --always-zero -- npm test
```

가려진 원본 로그를 digest와 함께 저장합니다.

```bash
agent-log-digest --json --raw-log ./raw.log --output ./digest.json -- npm test
```

로컬 실행 환경을 점검합니다.

```bash
agent-log-digest doctor --json
```

프로젝트 URL을 출력합니다.

```bash
agent-log-digest repo
```

로컬 예시 파일을 명시적으로 생성합니다.

```bash
agent-log-digest init
```

## CI 예시

CI 단계는 통과시키면서 에이전트가 읽을 구조화 digest를 저장합니다.

```yaml
- name: Test with digest
  run: npx agent-log-digest --json --always-zero --output ./agent-log-digest.json -- npm test
```

## Before and After

TypeScript 로그:

```text
src/user.ts(3,7): error TS2322: Type string is not assignable to number.
```

Digest 요약:

```json
{"status":"failed","detectedTools":["typescript"],"summary":{"headline":"TypeScript failed with 1 error in 1 file."}}
```

Vite build 로그:

```text
[vite]: Rollup failed to resolve import "./missing" from "src/main.ts".
file: /repo/src/main.ts:3:18
```

Digest 요약:

```json
{"status":"failed","detectedTools":["vite"],"nextCommands":["vite build"]}
```

## 출력

JSON 출력은 `schemaVersion: "0.1"`을 사용합니다.

```json
{
  "schemaVersion": "0.1",
  "status": "failed",
  "exitCode": 2,
  "command": "npm run typecheck",
  "detectedTools": ["typescript"],
  "summary": {
    "headline": "TypeScript failed with 1 error in 1 file.",
    "errors": 1,
    "warnings": 0,
    "failedTests": 0,
    "filesWithProblems": 1
  },
  "problems": []
}
```

패키지 루트에서 공개 TypeScript 타입과 헬퍼를 가져올 수 있습니다.

```ts
import { SCHEMA_VERSION, createDigest, redactSecrets } from "agent-log-digest"
import type { AgentLogDigest, Problem } from "agent-log-digest"
```

## 지원하는 파서

- TypeScript `tsc` 진단 출력
- ESLint JSON formatter 및 최소 stylish 출력
- Vitest JSON 형식의 실패 테스트 결과
- Jest JSON 형식의 실패 테스트 결과
- Next.js 텍스트 build 실패 출력
- Vite/Rollup 텍스트 build 실패 출력
- Playwright 텍스트/list reporter 실패 출력
- 일반 Node 스타일 stack trace 및 `file:line:column` 참조

## CLI 옵션

- `--json`, `--markdown`, `--pretty`: 출력 형식을 선택합니다.
- `--output <file>`: 포맷된 digest를 파일로 저장합니다.
- `--raw-log <file>`: 캡처한 로그를 민감 정보 제거 후 파일로 저장합니다.
- `--no-raw-log`: raw log 저장을 비활성화합니다.
- `--max-errors <n>`: 보고할 문제 수를 제한합니다.
- `--max-log-bytes <n>`: 캡처할 명령 출력 크기를 제한합니다.
- `--cwd <dir>`: 다른 작업 디렉터리에서 실행하거나 파싱합니다.
- `--timeout <ms>`: 지정한 시간이 지나면 감싼 명령을 종료합니다.
- `--always-zero`: 프로세스 exit code는 0으로 반환하되, JSON에는 원래 명령의 exit code를 보존합니다.
- `--no-stream`: 실행 중 출력 스트리밍 없이 캡처만 합니다.
- `--notify`: 사용 가능하면 `code-notify` 또는 `cn`을 호출합니다.
- `--redact`, `--no-redact`: 민감 정보 제거를 켜거나 끕니다.
- `--tool <name>`: `typescript`, `eslint`, `vitest`, `jest`, `next`, `vite`, `playwright`, `generic` 중 파서 우선순위를 강제합니다.

사용법 오류는 exit code `2`를 반환합니다. 내부 CLI 오류는 exit code `1`을 반환합니다. 감싼 명령의 exit code는 `--always-zero`를 사용하지 않는 한 그대로 보존됩니다.

## 신뢰 모델

런타임 동작은 로컬 전용입니다.

- 텔레메트리 없음
- 런타임 네트워크 호출 없음
- 설치 hook 없음
- 자동 코드 수정 없음
- AI API 호출 없음

감싼 명령은 `child_process.spawn`과 `shell: false`로 실행합니다.
