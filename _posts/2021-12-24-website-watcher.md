---
title: "게으른 자를 위한 취소표 알리미"
summary: "저 대신 클릭 노가다를 수행해 줄 분신을 만들었습니다."
date: 2021-12-24 06:04:14 +0900
categories:
   - dev
---

요즘 공연을 보러 자주 다닙니다. 이번 달에만 벌써 3번 다녀왔는데요, 크리스마스에 [카페 언플러그드](https://linktr.ee/cafe.unplugged)에서 열리는 [이제](https://namu.wiki/w/이제(가수))님 공연도 벌써 내일입니다. ~~덕질 영업중~~ 그리고 또 비교적 최근에 푹 빠진 가수로 [데이먼스 이어](https://namu.wiki/w/데이먼스%20이어?from=데이먼스이어)님이 있는데요, 애플뮤직이 추천해준 노래로 입덕했다가 전곡 돌려놓는 중입니다.

![damons-year-setting-fires.png](/assets/images/damons-year-setting-fires.png)

> 연말 단독 공연!

아무튼 가수님이 연말에 공연을 하시는데 그걸 티켓 오픈한지 2주가 넘게 지나서 알아버렸습니다..; 취소표를 구하고는 싶은데 그렇다고 다른 일들(누워서 멍때리기, 잠자기 등)을 모두 제쳐두고 예매창만 바라보고 있을 수는 없는 노릇 아니겠습니까! 그래서 봇을 하나 만들어 보았습니다.

> **소스는 [여기](https://github.com/potados99/web-watcher)에 있어요 :)**

## 정확히 무엇을 만들어야 하는가

티켓 예매 프로세스를 보면 이렇습니다:

1. 예매페이지 새로고침.
2. 빈 자리 있는지 확인.
3. 자리 있으면 예매 진행.

여기서 `1`과 `2`는 손가락과 눈만 있으면 뇌 없이도(?) 반복할 수 있을 것 같다는 생각이 들었습니다. 대략 지정된 URL로 요청을 쏘아 받은 응답을 계속 비교해가며 변화가 생길 때에 저에게 알려주면 되는 것이죠. 정리하면 다음과 같습니다:

- 예매 페이지 준 실시간 스크래핑.
- 알림 전송.

## 만들어 봅시다

기본적으로 커맨드라인에서 실행할 수 있는 간단한 파이썬 스크립트의 모양을 가집니다.

예전에 [매우 비슷한 스크립트](https://github.com/potados99/house-finder)를 하나 만들어 사용하던 것이 있었습니다. 새로 프로젝트 설정하기도 귀찮아서 그냥 가져다 쓰기로 했습니다. 마침 [SMS](https://blog.potados.com/dev/sending-sms-with-rest-api/)를 보내는 부분도 모두 구현되어 있어 알림 파트까지 가져다 쓰기만 하면 되었죠.

다만 이번에는 조금 범용성을 추구하고 싶었습니다. 특정 페이지에만 국한할 필요 없이, 웹상에서 인증 없이 `GET`으로 접근 가능한 모든 URL에 대해 변화를 감지하도록 만들 수 있을 것 같았습니다.

### 실행 파라미터는 넘겨주기: argparse & 환경변수.

스크립트가 돌아가기 위해서는 몇 가지 실행 정보가 필요합니다:

- 관찰할 URL
- 요청을 날리는 간격
- 알림 SMS를 보내는 데에 사용할 인증 정보 등

이 있는데요, 이중 SMS 발송 인증 정보는 이전 프로젝트에서는 환경 변수에서 가져오기로 했기 때문에 그대로 유지했습니다. ~~귀찮아서요~~

URL과 요청 간격은 명령줄 인자로 받기로 했습니다. 파이썬 3은 [argparse](https://docs.python.org/ko/3/library/argparse.html) 모듈을 제공하는데요, C나 쉘 스크립트에서 제공하는 `getopt`보다 훨씬 편합니다.

```python
# main.py

parser = ArgumentParser(description='어느 파이썬 스크립트')

parser.add_argument('--target', required=True, dest='target', help='관찰할 URL')

args = parser.parse_args()

target = args.target

print(f'target: {target}')
```

```bash
$ python3 main.py --target 'ㅎㅇㅎㅇ'
target: ㅎㅇㅎㅇ
```

사용법은 직관 그 자체입니다. `add_argument` 메소드는 명령줄 인자의 타입이나 필수 여부를 포함해 아주 많은 옵션을 제공합니다. 필요할 때에 [문서](https://docs.python.org/ko/3/library/argparse.html)에서 찾아다 쓰면 됩니다.

### 일정 간격마다 작업 수행하도록 스케줄링: schedule

메인 루프는 간단하게는 그냥 `while` 루프로 작성해도 되지만, 주어진 간격마다 웹페이지 내용을 비교하면서도 한편으로는 1시간마다 스크립트 동작 상태를 출력하도록 만들고 싶었습니다.

루프를 돌 때마다 마지막으로 로그를 출력한 시간을 체크하여 1시간 초과인 경우에만 출력하도록 만들어도 되지만, 딱히 내키지 않았습니다.

최대한 간단하고 멀티프로세스 또는 비동기를 동반하지 않는 모듈을 찾아보다가 [schedule](https://pypi.org/project/schedule/)을 발견하였습니다.

```python
import schedule
import time

def job():
    print("Good working...")

schedule.every(10).seconds.do(job)

while True:
    schedule.run_pending()
    time.sleep(1)
```

정말 간단하게 사용할 수 있습니다. 수행하려는 작업이 정말 길고 무거운 것만 아니라면 가볍게 쓰기 좋습니다.

### 사용자에게 알림 보내기: SMS

티케팅이라는 특성상 실시간성이 제일 중요하기 때문에 도달 시간이 짧은 슬랙/디스코드/텔레그램 봇을 사용하는 편이 합당하였으나, 매우 귀찮고 졸렸기 때문에~~ㅠㅠ~~ 위에서 이야기한 [예전 프로젝트](https://blog.potados.com/dev/sending-sms-with-rest-api/)의 SMS 전송 구현체를 그대로 가져다 사용하였습니다.

## 사용기

배포도 귀찮아서 그냥 집에 있는 라즈베리파이 서버에 `pm2`로 간단하게 띄워 놓았습니다. 정말 믿음직하게 자리가 빠질 때마다 알림이 잘 도착했습니다.

![watcher-notification-sms.jpeg](/assets/images/watcher-notification-sms.jpeg)

알림이 올 때마다 신속하게 반응한 결과 간신히 취소표 하나를 잡을 수 있었습니다 ㅠㅠ 1시간 투자 치고는 나름 큰 정신적 행복을 얻었습니다.

## Update: SMS 대신 슬랙 봇으로

1초에 5번씩 예매창을 체크하도록 만들어 놓았고, SMS 도달 시간이 최대 10초 정도이니 최악의 경우 11초 가량 지연이 발생할 수 있었습니다.

실제로는 그렇게까지 오래 걸리진 않았지만 알림을 받고 예매 페이지에 들어가보면 이미 자리가 사라져 있더라구요... 그래서 더 빠른 알림 채널을 고려해 보았습니다.

선택지가 몇 가지 있었습니다.

|방법|도달 시간|비용|사전 준비|
|:-:|:-:|:-:|:-:|
|SMS|최대 10초|건당 20원|개통된 휴대전화|
|슬랙 봇|최대 2초|무료|워크스페이스에 참여|
|디스코드 봇|측정 안 해보았으나 2초 미만으로 추정|무료|서버에 참여|
|텔레그램 봇|측정 안 해보았으나 2초 미만으로 추정|무료|채널 구독|

디스코드는 따로 서버를 파기가 귀찮고, 텔레그램도 앱 설치하기 귀찮아서, 워크스페이스 만들기도 봇 만들기도 가장 간단하다고 기억하는 슬랙으로 가기로 했습니다.

### 슬랙 쪽 준비

**1. 슬랙 워크스페이스 만들기**

![slack-new-workspace.png](/assets/images/slack-new-workspace.png)

개인용 워크스페이스를 하나 만들었습니다.

**2. 봇(앱) 만들기**

![slack-new-app.png](/assets/images/slack-new-app.png)

앱도 하나 만들었습니다.

**3. 웹훅 URL 가져오기**

앱 설정에서 **Activate Incoming Webhooks**를 활성화해주고 Webhook URL을 가져옵니다.

![slack-bot-webhook.png](/assets/images/slack-bot-webhook.png)

이제 저 URL로 `POST` 요청을 쏘기만 하면 슬랙 앱으로 알림이 옵니다.

### 스크립트 쪽 준비

코드도 조금 바꾸어 줍니다. 이제 인증이고 HMAC이고 필요 없습니다! 그냥 URL로 요청만 쏘면 됩니다.

```python
# SlackBot.py

from requests import request

class SlackBot:
    def __init__(self, web_hook_url):
        self._web_hook_url = web_hook_url

    def send(self, text: str):
        print(f'Sending to Slack: {text}')

        return request(
            method='POST',
            url=self._web_hook_url,
            headers={'content-type': 'application/json'},
            json={'text': text}
        )
```

요렇게 만들어 주고, 아래처럼 호출하면 되는거죠:

```python
from lib.SlackBot import SlackBot

slack_bot = SlackBot("적절한 URL...")
slack_bot.send("적절한 메시지...")
```

### 업데이트 후 사용기

확실히 알림이 빨라져서 편합니다. 그리고 SMS의 경우 건당 20원씩 빠져나가니까 알림이 계속 올 때에 심적 압박이 조금 있었는데, 이제 해방입니다.

![watcher-notification-slack.jpeg](/assets/images/watcher-notification-slack.jpeg)

> 메시지 내용도 조금 자세하게 꾸며 보았습니다.

## 마무리

이런 류의 프로그램을 만들 때에는 늘 생각이 많아집니다. 좋은 자리 잡아서 다행이긴 하지만, 도덕적 해이가 아닌가 생각도 듭니다. 괜히 취소표 알림이 없겠나 싶더라구요... 그래서 배포는 안 하고 있습니다.
