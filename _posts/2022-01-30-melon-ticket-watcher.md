---
title: "예매 현황 실시간(?) 모니터링하기"
summary: "두고두고 쓸 생각에 고민을 많이 했습니다."
date: 2022-01-30 21:05:51 +0900
categories:
   - dev
---

일전에 [웹사이트 모니터링 툴](https://blog.potados.com/dev/website-watcher/)을 만들었습니다. 취소표를 잡기 위해 잘 쓰고 있었는데, 문득 욕심이 생겼습니다. 회차별 남은 좌석의 수 뿐만 아니라 변동된 좌석의 위치까지 알 수 있으면 편할 것 같았습니다.

그런데 그러려면 특정 사이트의 API에 맞추어 많은 양의 코드를 작성해야 하는지라, 이전의 [web-watcher](https://github.com/potados99/web-watcher)의 목표인 *만능 웹사이트 모니터링 툴*에서는 한발짝 멀어지게 됩니다. 그래서 그냥 새로 만들었습니다.

티케팅에 맞추어 상당히 급하게 만들기 시작하였기에, 평소에 자주 사용하고 좋아하는 Typescript로 작성하기로 했습니다. ~~타입스크립트 최고~~

## 모델링

**데이터**와 **행동**, 이렇게 두 개로 나누어서 생각해 보았습니다.

일단 주어진 API에 맞게 생각하고 설계해야 가장 편안하기 때문에, 브라우저 콘솔을 열어 오고가는 요청들을 살펴 보고 [차근차근 정리해 보았습니다.](https://potados.notion.site/ebbe4556405443e69af121bd03399be1)

회차 정보를 알려주는 API와, 회차별 좌석 정보를 알려주는 API가 있어 각각 회차(`Schedule`)와 좌석(`Seat`)으로 모델링 하였습니다.

![melon-ticket-watcher-entity.png](/assets/images/melon-ticket-watcher-entity.png)

**회차**는 해당 회차 공연일 및 시간, 그리고 식별자와 해당 회차 좌석 정보를 포함합니다. **좌석**은 어느 한 좌석의 식별자와 위치, 그리고 예매 가능 여부를 나타냅니다.

이렇게 두 데이터 구조를 정의했습니다. 이제 이걸 가지고 로직을 짜야 합니다. 해야 하는 일들을 먼저 정리해봅니다:

- 커맨드라인 인자 파싱하여 실행 옵션 가져오기
- API 호출하고 응답 받아오기
- 응답 결과 전처리 후 모델(엔티티)로 매핑하기
- 이전 응답과 비교하여 변동이 생긴 좌석 찾기
- Slack으로 알림 보내기
- 위의 작업들을 순서대로 실행하기

생각보다 많습니다. 이럴 때에는 [자기가 맡은 일만 잘 처리하는 클래스를 만들어 작업을 전담시키는 것](https://ko.wikipedia.org/wiki/단일_책임_원칙)이 좋습니다.

![melon-ticket-watcher-actors.png](/assets/images/melon-ticket-watcher-actors.png)

- 외부에서 데이터를 가져오는 `Fetcher`,
- 그걸 해석해서 도메인 엔티티로 바꿔 주는 `Parser`,
- 둘을 합쳐 [데이터의 유일한 출처](https://ko.wikipedia.org/wiki/단일_진실_공급원) 역할을 하는 `Repository`,
- 데이터를 비교하며 바뀐 점을 알아내는 `Detector`,
- 사용자에게 변화를 알려 주는 `Notifier`,
- 위에서 정의한 친구들을 부려먹으며 일을 딱딱 처리하는 `Worker`,
- 그리고 주어진 옵션대로 `Worker`를 실컷 굴리는 `Runner`

를 정의하였습니다.

`Runner`는 메인 루프를 돌면서 `Worker`에게 일을 시키고, `Worker`는 일을 시킬 때마다 **가져오기-비교하기-알리기**를 실행합니다.

![melon-ticket-watcher-main-loop.png](/assets/images/melon-ticket-watcher-main-loop.png)

`Worker`가 일을 하는 하나의 사이클에서 `Repository`, `Detector`, `Notifier`가 차례로 사용됩니다. 이들 사이에서는 위에서 정의한 모델인 `Schedule`과 `Seat`이 오고 갑니다.

이 사이클은 `Runner`에 의해 실행되며, 프로그램이 내부의 예외나 외부의 인터럽트에 의해 종료될 때까지 약간의 시간 간격을 두고 계속 반복됩니다.

## 구현

엔트리 포인트 `index.ts`는 이렇게 생겼습니다:

```Typescript
import Runner from './lib/actor/Runner';

new Runner().run().catch((e) => console.error(e));
```

`Runner`는 이렇게 생긴 메인 루프를 돕니다:

```Typescript
// 생략
while (true) {
  await worker.tick();

  await sleep(interval);
}
// 생략
```

`Worker`는 대략 이런 일을 합니다:

```Typescript
// 생략
const detector = new Detector(prev, current);
if (detector.hasNoChanges) {
  continue;
}

await this.notifier.notify({
  schedule: current,
  activatedSeats: detector.activatedSeats(),
  deactivatedSeats: detector.deactivatedSeats()
});
// 생략
```

나머지는 생략! 전체 코드는 [여기](https://github.com/potados99/melon-ticket-watcher)에 있습니다.

## 약간의 삽질

API에 생각도 못한 이슈가 있었습니다.

예매창에 들어가면 좌석을 고르기 전 화면에서 회차 목록을 볼 수 있는데요, 이때 회차별로 남은 좌석 수가 표시됩니다. 그런데 이 좌석 수의 업데이트가 실제보다 1초 정도 늦는 현상이 계속 관찰되었습니다.

그러니까, 좌석을 찍어서 고르는 화면에서는 자리가 빠진 것이 바로 보이는데, 회차 선택 화면에서는 남은 좌석 수가 바로 줄어들지 않고 약간의 딜레이가 있었습니다.

그래서 API가 제공하는 회차별 남은 좌석 수를 그대로 믿지 않고(?), 전체 좌석 정보를 가지고 와서 그 중 예매가 가능한 좌석의 수를 직접 세는 방법으로 해결했습니다.

## 마치며

Typescript는 쓸 수록 마음에 듭니다. Javascript의 문어같은 유연함, Java 스타일의 클래스 기반 객체지향, Kotlin과 닮은 듯한 약간의 함수형, 아무 생각 없이 써도 메모리와 비동기 지원이 끝내주는 Node 런타임, 그리고 매일매일이 새롭고 불안한 라이브러리 생태계까지(?).

## Reference

- [단일 책임 원칙](https://ko.wikipedia.org/wiki/단일_책임_원칙)
- [단일 진실 공급원](https://ko.wikipedia.org/wiki/단일_진실_공급원)
