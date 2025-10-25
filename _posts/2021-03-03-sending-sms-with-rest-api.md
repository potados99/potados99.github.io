---
title: "SMS를 보내 봅시다. feat. HMAC"
summary: "SMS를 보내 주는 REST API를 사용해 보았습니다."
date: 2021-03-03 01:31:52 +0900
category: dev
---

## 들어가며

어떤 웹사이트를 주의깊게 관찰해야 할 일이 생겼습니다. 이 일을 대신 처리해 줄 웹 크롤러를 하나 만들었습니다.

웹사이트의 응답을 주시하다가 무언가 새로운 이벤트가 발생하면 이를 실시간으로 알려 주어야 했습니다. 몇 가지 선택지가 떠올랐습니다.

- 이메일
- 슬랙
- 디스코드
- 앱 푸시알림
- 문자 메시지

이메일이 가장 먼저 떠올랐습니다. 그런데 이메일을 사용할 경우, 스팸메시지함 신세를 면하려면 도메인을 파고 별도의 메일링 서비스를 동원해야 했기 때문에 포기했습니다.

슬랙이나 디스코드는 정말 좋은 API를 제공해 주지만, 알림 하나 보내자고 워크스페이스나 서버를 만드는 것은 조금 과하다고 판단했습니다.

전용 애플리케이션을 만들어 푸시 알림을 보내면 전달은 확실하게 되겠지만 생각해야 할 것들이 너무 많아 포기했습니다.

가장 간단하고 익숙하면서 전달력 있는 방법은 SMS인데, 어떻게 접근해야 할 지 몰라서 고민하던 차에 [괜찮은 서비스](https://coolsms.co.kr)를 하나 발견하였습니다.

> 검색해 보니, 보통 SMS 대행 서비스는 UI나 서비스 제공 형태가 2008년에 멈춰있는 경우가 많았습니다. 위 서비스는 HTTP API를 제공하기에 선택했습니다. ~~REST API를 제공한다고 광고하는데, 사실 RESTful하지는 않습니다.~~

이 서비스를 이용해서 문자 메시지 발송에 성공했습니다.

## API는 문서부터

개인적인 이야기를 해 보자면, 외부 API가 설치형 SDK 또는 바이너리로 주어지는 것을 안 좋아합니다. 다행히 *coolsms*는 HTTP API를 제공합니다.

개발자 센터의 [문서](https://developer.coolsms.co.kr/REST_API)를 참고해 예제를 작성해보려 했습니다. 그런데 문서가 조금 빈약했습니다.

![coolsms-rest-api-2.png](/assets/images/uEOGf8Z.png)

`Content-Type`, 저 필드가 헤더에 들어가는지 본문에 들어가는지 여부 등 몇 가지 필수적인 정보가 빠져 있었습니다. 그래서 그냥 Python SDK와 예제를 내려받아 소스를 보기로 했습니다.

소스를 열어 보니, 사용하는 API가 위 문서와 달랐습니다. 무슨 일인가 하고 알아보니, 저 문서는 API v2에 대한 설명이고 예제 소스는 API v4를 사용하는 예제였습니다.

알아보는 과정에서 또 다른 [개발자 문서](https://docs.coolsms.co.kr)를 찾았는데요, 여기에는 최신 API를 사용하는 언어별 SDK는 있었으나 HTTP API에 대한 얘기가 없었습니다. 최신 API부터는 HTTP API 문서화를 포기한 듯 싶었습니다. ~~시무룩~~

## 예제 코드

아무튼 코드는 이렇게 생겼습니다.

~~~python
...

payload = {
    'message': {
        'to': receiver,
        'from': '01012345678',
        'subject': title,
        'text': content
    }
}

requests.post(
    url='https://api.coolsms.co.kr/messages/v4/send',
    headers=get_headers(api_key, api_secret),
    json=payload
)

...
~~~

API를 호출하기 위한 인증 정보는 헤더에 담깁니다. `get_headers` 함수를 보겠습니다.

~~~python
def get_headers(api_key, api_secret):
    date = get_iso_datetime()
    salt = unique_id()
    data = date + salt
    signature = get_signature(api_secret, data)

    return {
      'Authorization': f'HMAC-SHA256 ApiKey={api_key}, Date={date}, salt={salt}, signature={signature}',
      'Content-Type': 'application/json; charset=utf-8'
    }

def get_signature(key, msg):
    return hmac.new(key.encode(), msg.encode(), hashlib.sha256).hexdigest()
~~~

`API key`와 `API secret`, 두 개의 문자열이 필요합니다. 여기서 `HMAC`이라는 단어가 등장합니다.

## HMAC

HMAC은 **H**ash-based **M**essage **A**uthentication **C**ode의 약자입니다.

이 서비스에서 HMAC이 이렇게 쓰입니다:

1. 클라이언트는 `현재 날짜와 시간`과 `임의의 문자열`을 생성합니다. 그리고 이들을 이어붙인 뒤 `API secret`으로 해시하여 `signature`를 생성합니다. 이렇게 만들어진 `현재 날짜와 시간`, `임의의 문자열`, `signature`를 `API key`과 함께 서버에 보냅니다.

2. 서버는 클라이언트가 보낸 `API key`, `현재 날짜와 시간`과 `임의의 문자열`, 그리고 `signature`를 수신합니다. 먼저 `API key`에 대응하는 `API secret`을 가져옵니다. 그리고 클라이언트와 같은 방식으로 `현재 날짜와 시간`과 `임의의 문자열`을 이어붙인 뒤 `API secret`으로 해시하여  `signature`를 생성합니다.

> 서버와 클라이언트 모두 같은 문자열(현재 날짜와 시간 + 임의의 문자열)로부터 해시값을 도출합니다. 이 때 같은 `API secret`으로 해시해야 같은 결과가 나옵니다.

3. 서버는 클라이언트가 보낸 `signature`와 서버가 만든 `signature`를 비교합니다. 둘이 같으면 **해당 메시지는 위조되지 않았다는 것**이 확실해집니다.

4. 서버는 추가적으로 클라이언트가 보낸 `현재 날짜와 시간`을 확인하여 현재로부터 15분 이상 차이가 나면 릴레이 공격이라고 간주하고 요청을 차단합니다.

기본적으로 해시는 단방향 연산입니다. 즉, 해시되기 전 원본이 무엇인지 알 수 없습니다. 따라서 **해시된 결과물로부터 정보를 추출해낼 수 없습니다.**

같은 값을 같은 secret으로 해시하면 항상 같은 결과가 나옵니다. 그리고 해시 값이 겹치는 경우는 극히 드뭅니다. 따라서 **해시 값이 같다면 원본과 secret 또한 같다는 것이 보장됩니다.**

위 두 특성으로 인해, 가로챈 메시지의 `signature`를 해석하거나 조작하는 것은 불가능에 가깝습니다.

## 마치며

슬랙 API를 사용할 때에 HMAC 인증을 처음 보았습니다. 그 때에는 되게 불편하고 번거롭기만 했는데 이제 보니 이것만큼 좋은게 또 없네요.
