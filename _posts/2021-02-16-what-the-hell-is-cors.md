---
title: "CORS의 악몽에서 벗어나 봅시다"
excerpt: "웹 개발 할 때마다 마주하는 CORS 오류 때문에 삽질한 게 분해서 정리해 보았습니다."
date: 2021-02-16 19:11:12 +0900
category: dev
---

웹 앱을 개발하다 보면 필히 겪는 일이 있습니다.

**# 1. 어? ajax에러난다!**

서버 주소는 `https://api.myservice.com`이고 프론트엔드 주소는 `https://www.myservice.com`입니다. 프론트쪽 스크립트에서 데이터를 가져오기 위해 `https://api.myservice.com/data`로 `ajax` 요청을 전송합니다.

앗 그런데 제대로 작동하지 않습니다. 콘솔에는 `Origin https://api.myservice.com is not allowed by Access-Control-Allow-Origin.`라고 출력됩니다.

**# 2. 다른 페이지에서 가져온 텍스트를 표시하고 싶은데...**

새로 만든 웹사이트에 `https://api.github.com/zen`에서 가져온 텍스트를 보여주고 싶습니다. 그래서 자바스크립트 파일 어딘가에 이런 코드를 집어 넣습니다.

~~~javascript
window.onload = function() {
  fetch('https://api.github.com/zen').then((response) => {
    response.text().then((text) => {
      document.getElementById('myDiv').innerText = text;
    });
  });
}
~~~

페이지를 띄우는데, 예상과 달리 `myDiv`에 기대한 결과가 표시되지 않습니다. 콘솔에는 빨간 글씨만 몇 줄이 떠오릅니다.

## Same-Origin Policy (동일 출처 정책)

이런 일이 생기는 근본적인 원인은, **자바스크립트에서 다른 출처의 사이트에 접근하는 것이 금지되어 있기 때문입니다.** [동일 출처 정책](https://ko.wikipedia.org/wiki/동일-출처_정책)이라고 합니다.

다른 출처란, `프로토콜`, `호스트`, `포트` 중 하나라도 다른 것입니다. 예를 들어 `https://www.google.com`와 `https://www.apple.com`은 `프로토콜`과 `포트`는 같은데 `호스트`가 다릅니다.

![from-google-to-apple.png](/assets/images/WEvF266.png)

> 구글에서 애플로 요청을 보냅니다. 역시 안 됩니다.

`https://api.myservice.com`와 `https://www.myservice.com`도 마찬가지입니다. `호스트`가 다르기 때문에 다른 출처로 취급됩니다.

더 많은 예시를 보겠습니다. `https://www.example.com`에서 다른 URL로 요청을 보낼 때 `프로토콜`, `호스트`, `포트`에 따른 성공/실패 여부를 살펴보죠.

![same-origin-rule.png](/assets/images/1sfK4XC.png)

> 처음 세 개는 same-origin이라 성공, 그 다음 다섯 개는 cross-origin이라 실패입니다. [출처 위키백과](https://ko.wikipedia.org/wiki/동일-출처_정책)

네, 그러니까 결국 자바스크립트로 요청을 하려면, **같은 프로토콜, 같은 호스트, 같은 포트**로 요청을 보내야 합니다.

![if not...](/assets/images/Grddj8q.jpg)

만약 그렇게 못하면... **브라우저가 막습니다.** 응답이 오긴 하는데 그걸 코드 상에서 접근하지 못하게 브라우저가 막아섭니다.

그렇지만 이렇게 되면 너무하지 않습니까? 프론트와 API 서버를 같은 도메인에서 제공할 수는 있지만 분리하는 것이 나을 때가 많습니다. 다행스럽게도 방법이 있습니다.

## Cross-Origin Resource Sharing (교차 출처 리소스 공유)

[교차 출처 리소스 공유](https://developer.mozilla.org/ko/docs/Web/HTTP/CORS)같는 같은 출처(same-origin)가 아닌 사이트로부터 리소스를 가져올 수 있게 해 줍니다.

기본적으로 다른 출처로의 `XMLHttpRequest`와 `Fetch`에는 **동일 출처 정책**이 적용됩니다. 따라서 요청은 전송되지만 응답을 읽는 것을 브라우저가 막습니다. 여기에 **예외를 설정**해 주는 것이 `CORS`입니다.

## CORS 작동 원리

Cross-origin 요청을 허용할 지 말지는 **그 요청을 받는 서버가 결정**합니다. 요청을 받는 cross-origin 서버는 응답의 `Access-Control-Allow-Origin` 헤더를 통해 허용 여부를 전달합니다.

예를 들어 `https://www.from.com`에서 `https://www.to.com`으로 cross-origin 요청을 보내는 경우를 보겠습니다.

1. 먼저 브라우저는 `https://www.from.com` 페이지의 자바스크립트 `fetch()` 호출을 실행해 `https://www.to.com`으로 요청을 보냅니다.

2. 응답이 오면 브라우저는 헤더를 읽어 `Access-Control-Allow-Origin` 필드를 찾습니다.

이 때, 해당 필드가

- `Access-Control-Allow-Origin: *` 또는
- `Access-Control-Allow-Origin: https://www.from.com`

으로 설정되어 있다면 브라우저는 `https://www.from.com`으로부터 `https://www.to.com`로 가는 cross-origin 요청이 허용된다고 간주합니다.

만약 해당 필드의 값이

- `Access-Control-Allow-Origin: null` 또는
- `Access-Control-Allow-Origin: https://www.haha.com`과 같은 다른 origin이거나
- 필드가 아예 존재하지 않으면

브라우저는 해당 cross-origin 요청이 허용되지 않았다고 보고 응답에 대한 접근을 차단합니다.

즉, 다른 사이트로 요청을 보내 결과를 가져오고 싶으면 **그쪽 사이트가 협조를 해 주어야 한다**는 것입니다.

## 요약!

정리하면 아래와 같습니다.

- `프로토콜`, `호스트`, `포트`가 모두 같으면 same-origin, 하나라도 다르면 cross-origin입니다.
- 모든 요청에는 `동일 출처 정책`이 적용되지만 예외가 있으니, 바로 `교차 출처 리소스 공유`입니다.
- 접근 제어(access-control)는 요청을 받는 서버가 결정합니다(`Access-Control-Allow-Origin` 헤더 사용).

**끝!**

여기부터는 몰라도 별 탈은 없지만 알아두면 좋은 내용입니다.

## Preflight

사실 `CORS`에는 위의 access-control 외에도 preflight라는 것이 있습니다. 요청을 보내기 전에 먼저 이 요청이 안전한 것인지 서버에 물어보는 절차입니다.

아래는 preflight 없이 직접 요청을 보내는 예시입니다.

![simple](/assets/images/xTZ1wrd.png)

> 바로 실제 요청을 보내고 그 응답을 받습니다.

그리고 아래는 preflight를 동반하는 요청 예시입니다.

![not-simple](/assets/images/HtT7qwF.png)

> OPTIONS 메소드로 preflight 요청을 보낸 뒤, 응답이 성공적이면 실제 요청을 보냅니다.

Preflight는 *간단한* 요청에 대해서는 일어나지 않습니다. 간단한 요청이라 함은 [Mozilla](https://developer.mozilla.org/ko/docs/Web/HTTP/CORS)에 따르면 다음 조건을 모두 만족하는 요청입니다.

- 메소드가 `GET`, `HEAD`, `POST` 중 하나
- 자동으로 설정된 헤더를 제외하고, 아래의 헤더만 사용:
  - `Accept`
  - `Accept-Language`
  - `Content-Language`
  - `Content-Type`
  - `DPR`
  - `Downlink`
  - `Save-Data`
  - `Viewport-Width`
  - `Width`
- `Content-Type`은 다음만 사용:
  - `application/x-www-form-urlencoded`
  - `multipart/form-data`
  - `text/plain`

위 조건을 모두 만족하지 못하면 *복잡한* 요청이 됩니다. 가장 흔한 *복잡한* cross-origin 요청은 `Content-Type`이 `application/json`인 `POST`요청입니다.

만약 *복잡한* cross-origin 요청이 실패한 경우, 콘솔에는 *간단한* 요청이 실패했을 때와 조금 다른 메시지가 출력됩니다.

![fail-on-preflight.png](/assets/images/DR1hebH.png)

> Preflight가 언급됩니다. 본 요청 이전 preflight 단계에서 실패한 경우입니다.

## 인증 정보를 포함한 요청

Cross-origin 요청에 인증 정보(쿠키)를 담아 보내는 경우에는 요청을 받는 서버의 **추가적인** 허락이 필요합니다.

기본적으로 cross-origin 요청은 쿠키를 포함하지 않습니다. 하지만 위의 예시처럼 API 서버로 요청을 보낼 때에는 인증을 위해 쿠키를 같이 보내야 합니다. 이럴 때에는 요청에 `withCredentials` 플래그를 `true`로 설정하여 보내면 됩니다.

인증 정보를 같이 보내는 요청은 응답에 `Access-Control-Allow-Credentials: true` 헤더가 들어 있어야 성사됩니다. 만약 그렇지 않으면 **브라우저가 막습니다!**

![withCredentials](/assets/images/WHkSm04.png)

> 쿠키를 포함하는 간단한 GET 요청 예시

이 때 아주 중요한 조건이 하나 더 있는데, 인증 정보와 함께 요청을 보낸 경우 **응답의 `Access-Control-Allow-Origin` 헤더가 `*`이면 안 됩니다.** 이 경우도 브라우저가 막습니다. 조금 더 까다로운 것이죠. 정리하면 다음과 같습니다.

쿠키를 포함한 cross-origin 요청이 성공하려면,

- 응답 헤더의 `Access-Control-Allow-Origin`의 값이 **요청을 보낸 origin과 같아야 하고**,
- 응답 헤더의 `Access-Control-Allow-Credentials` 값이 `true`여야 합니다.

## 마치며

정리해보니 속 시원하네요. [Mozilla 문서](https://developer.mozilla.org/ko/docs/Web/HTTP/CORS)가 정말 잘 되어 있습니다. **꼭** 읽어보시길 추천드립니다.

## 참고

- [Same_Origin_Policy](https://www.w3.org/Security/wiki/Same_Origin_Policy)
- [동일-출처_정책](https://ko.wikipedia.org/wiki/동일-출처_정책)
- [교차 출처 리소스 공유 (CORS)](https://developer.mozilla.org/ko/docs/Web/HTTP/CORS)
