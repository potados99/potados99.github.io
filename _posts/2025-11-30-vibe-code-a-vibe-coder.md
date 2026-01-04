---
date: 2025-11-30 20:52
title: "바이브 코딩으로 바이브 코더 만들기: Slack + Claude Code"
excerpt: 구슬이 서 말이라도 꿰어야 보배입니다. Claude Code 사용 경험을 그대로 Slack으로 가져왔습니다. 언제 어디서든 Claude에게 일을 시킬 수 있게 되었습니다.
---
## 들어가며

Claude Code 참 좋습니다. Opus 4.5 굉장히 좋습니다. 이제는 에러가 발생하였거나 동작이 무언가 이상해 굉장한 삽질이 예상될 때, 왠지 코드에 답이 있을 것 같은 느낌이 들면 구글 검색 대신 Claude Code에게 맡깁니다. 

여기서 더 나아가면 이제 책상 앞에 앉기도 귀찮아집니다. 개발 환경을 셋업하는 것도 귀찮아지구요. 어차피 Claude에게 넘기는 건 텍스트밖에 없는데, 굳이 책상 앞에 앉아서 해야 할까요? 메신저 보내듯이 툭 던질 수 있게 할 수 있지 않을까요?

## 인터페이스 장벽

기술은 이미 눈 앞에 와 있지만, 그걸로 가치를 창출하려면 결국 손이 닿는 곳에 있어야 합니다. 책상 앞을 떠나면 바로 눈 앞에서 사라지는 기술은 아직 생활에 완전히 녹아든 기술이라 할 수 없습니다.

Claude Code가 일상에 녹아들 필요가 있냐구요? 일할 때에만 쓰면 그만인 것 아니냐구요? 맞습니다. 하지만 그렇게만 쓰기에는 조금 아깝습니다. Claude를 단지 IDE나 터미널 속에서 움직이는 유틸리티 정도로 한정지을 필요가 없습니다. 그보다 더한 것을 해낼 수 있습니다.

기술이 인간을 게을러지게 만들어줄 수 있는 마지막 퍼즐은 인터페이스입니다. 15년 전에 터치스크린 스마트폰이 등장해 PC와 사용자 사이의 거리를 한 뼘 수준으로 줄여준 이후로 사람들은 더 기민하고 자유롭게 시스템과 상호작용 할 수 있게 되었습니다.

우리는 더 가까이 있는 것을 더 편안하게 느끼고 그래서 더 자주 사용합니다. Claude는 이미 인간에게 매우 친숙한 "텍스트" 인터페이스를 사용하여 소통합니다. 그리고 회사에서 그런 텍스트를 주고받을 수 있는 가장 익숙한 통로는 Slack입니다. 그래서 Slack에 Claude Code를 모시기(?)로 하였습니다.

## Vibe Coder

[Slack용 Claude Code 통합](https://code.claude.com/docs/en/slack)은 이미 존재합니다. 하지만 이 친구는 GitHub에서 코드를 읽어와서 사용자와 상호작용하는 정도밖에 안 됩니다. 로컬에서 테스트를 돌릴 수도, DB를 조작할 수도 없습니다. 

인간이 충분히 게으르고(!) 편안해지려면 챗봇이 자신만의 실행 환경을 갖추고 모든 것을 수행할 수 있어야 합니다. 즉, **인간이 할 수 있는 모든 일(코드 작성, 버그 해결, 테스트 실행, 커밋 & 푸시, PR 작성, DB 작업 등등)은 이 챗봇도 할 수 있어야 합니다.**

결국 별도의 서버에서 자신만의 실행 환경을 갖춘 Claude Code가 필요하다는 결론에 도달하였습니다. 그리고 이 친구의 이름은 제가 평소에 하던 짓(?)의 호칭에서 따와 Vibe Coder로 지어주었습니다.

### Claude Code CLI와 Slack 봇을 붙이자

Claude Code API를 찾아보니, 그냥 모델 요청-응답 API 말고도 온전한 에이전트 경험을 제공하는 [Claude Agent SDK](https://platform.claude.com/docs/en/agent-sdk/overview)라는 것을 발견하였습니다. 그렇지만 선택하지 않았습니다. 왜냐면요:
1. API key 발급하기 싫었습니다. 이미 로컬에서 잘 쓰는 Claude Code가 있는데 어쨰서 추가 과금을...?
2. 귀찮았습니다. 그냥 로컬에서 쓰는 Claude Code 그대로 쓰면 안 되나...?

사실 방법이 있습니다.

터미널에서 `claude`로 실행하던 Claude Code에 `--print` 옵션을 붙이면 결과를 stdout으로 받아볼 수 있습니다. `--output-format json`으로 지정하면 파싱하기 편한 json으로 나옵니다. `--verbose`를 걸어주면 결과 뿐만 아니라 `assistant` 응답과 tool calling 현황까지 나옵니다.

```bash
$ claude --dangerously-skip-permissions --output-format json --print "안녕하세요" | jq .
{
  "type": "result",
  "subtype": "success",
  "is_error": false,
  "duration_ms": 1849,
  "duration_api_ms": 1776,
  "num_turns": 1,
  "result": "안녕하세요! 무엇을 도와드릴까요?",
  "session_id": "69954183-d558-4e76-a9d5-beab1bd01d3e",
  "total_cost_usd": 0.0100635,
  "usage": {
    "input_tokens": 2,
    "cache_creation_input_tokens": 0,
    "cache_read_input_tokens": 18857,
    "output_tokens": 25,
    "server_tool_use": {
      "web_search_requests": 0,
      "web_fetch_requests": 0
    },
    "service_tier": "standard",
    "cache_creation": {
      "ephemeral_1h_input_tokens": 0,
      "ephemeral_5m_input_tokens": 0
    }
  },
  "modelUsage": {
    "claude-opus-4-5-20251101": {
      "inputTokens": 2,
      "outputTokens": 25,
      "cacheReadInputTokens": 18857,
      "cacheCreationInputTokens": 0,
      "webSearchRequests": 0,
      "costUSD": 0.0100635,
      "contextWindow": 200000
    }
  },
  "permission_denials": [],
  "uuid": "dfd7c3fa-4ad4-4765-b432-0d511a4bbc04"
}
```

이것을 TypeScript로 사용하기 편하게 말아놓은 [`@instantlyeasy/claude-code-sdk-ts`](https://www.npmjs.com/package/@instantlyeasy/claude-code-sdk-ts/v/0.1.0) 패키지도 찾았습니다. 

궁극적으로 이것은 Slack을 통해 프롬프트를 전달할 뿐, 개발자의 환경에서 굴러가는 로컬 Claude Code입니다. 사람이 할 수 있는 것은 모두 처리해주는 Vibe Coder의 철학에 딱 맞는 선택이었습니다.

## 부트스트래핑

여기까지는 특별할 것 없는 Slack 챗봇 이야기입니다. 하지만 여기서부터는 다릅니다. 게으름 추구가 극에 달한 나머지, Vibe Coder가 스스로를 업데이트하고 재시작할 수 있게 만들었습니다.

그 과정은 이러합니다:
1. Vibe Coder 초안을 첫 배포합니다. Slack을 통해 프롬프트를 받고 tool calling을 수행한 뒤 응답을 던질 수 있습니다. 이때부터는 Vibe Coder 소스코드를 자기가 수정할 수 있게 됩니다. 
2. Vibe Coder에게 재시작(배포) 스크립트의 작성을 맡깁니다. 이 스크립트는 자식 프로세스가 아닌 별도의 프로세스로 실행되며, 재시작 후에 Vibe Coder 서비스가 정상이 아니라면 롤백을 처리해줍니다. 
3. 이제 수정-배포-롤백 루프가 완성되었습니다. Vibe Coder에게 "너 버그 있어" 라고 알려 수정을 유도한 뒤 재시작을 요청합니다. Vibe Coder는 재시작 스크립트를 실행하고, 스크립트는 별도의 프로세스에서 Vibe Coder의 상태를 지켜보며 새 버전을 유지하거나 롤백해줍니다.

![Vibe Coder 재시작](/assets/images/Screenshot%202026-01-04%20at%207.23.13%20PM.png)

- 재시작 스크립트는 진행 상황을 Slack 스레드에 알려줍니다.
- Claude Code의 세션은 Slack의 스레드에 연결됩니다. 대화를 시작한 스레드에서 계속 같은 세션을 이어나갈 수 있습니다.

이렇게 하여 Slack 챗봇만으로 인간이 할 수 있는 개발 업무는 모두(셀프 업데이트까지!) 할 수 있게 되었습니다.

## 마치며

평소에는 아이폰에서 Termius를 켜고 개인 서버나 맥북에 ssh로 붙어 claude를 띄워두고 영어로(한국어 타이핑 이슈) 작업하곤 했는데, 이제 안 그래도 되어서 너무 편안합니다.