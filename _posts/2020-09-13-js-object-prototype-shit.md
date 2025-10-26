---
title: "Object.prototype을 건드리면 어떻게 되나"
excerpt: "잘못 건드려서 크게 삽질한 후기."
date: 2020-09-13 04:35:00 +0900
category: digging
---

## 들어가며

진행중인 프로젝트의 서버 단을 잠깐 수정하는 중이었다.

다섯 커밋 정도 불태운 후였을까, 유닛 테스트만 돌리다가 `npm run`을 하려니 실행이 안 되는 문제가 발생하였다.

![no-info-error-message.png](/assets/images/lgFezpr.png)

> **TypeError: this.$_terms[key].slice is not a function** 란다. 이렇게 도움 안되는 에러 메시지가 또 있을까?

이런 부류의 에러는 보통 무언가 꼬였을 때에 발생한다. 이렇게 꼬인 경우는 매우 드물기 때문에 사례를 찾아보기 쉽지 않아 구글링도 소용없었다.

어디서부터 잘못된 건지 하나씩 되짚어 보았다.

## 시작부터 추적하기

서버 앱은 `node -r esm index.mjs [인자...]` 명령으로 실행된다. 가장 먼저 `index.mjs`의 모든 함수를 지워보았다. 증상이 계속되었다. 혹시나 싶어 `import`문도 지워보았다. 문제가 사라졌다.

에러가 뜬 시점이나 `import`문에 의해 발생하는 것으로 보아, 모듈이 로드될 때 문제가 터지는 것으로 추정했다.

`index.mjs`에서 문제가 된 `import`문은 Hapi 서버를 생성하는 `createServer`라는 함수를 가리켰다. 해당 파일은 Hapi와 관련된 의존성들을 잔뜩 포함하고 있었다.

~~~js
import Hapi from '@hapi/hapi';
import Blipp from 'blipp';
import Vision from '@hapi/vision';
import Inert from '@hapi/inert';
import HapiAuthJwt2 from 'hapi-auth-jwt2';
import HapiSwagger from 'hapi-swagger';
import HapiGood from '@hapi/good';
~~~

이들을 지워 보니 문제가 발생하지 않았다.

그런데 Hapi에 갑자기 문제가 생긴 것은 아닐테고, 진짜 원인은 다른 곳에 있는 듯 했다.

## master 브랜치와 비교

브랜치를 push한 다음 GitHub으로 가서 master와 비교해 보았다.

![dependencies-updated.png](/assets/images/VkjstBs.png)
> package.json 변경 사항

의존성 버전을 업데이트한 것이 눈에 띄었다. 혹시나 싶어 예전 버전의 `package.json`을 가져와 `cheerio`(새로 설치)만 추가하고 `npm install && npm start` 해보았다. 또 안됐다.

## 커밋 단위로 비교하기

`master` 브랜치의 최신 버전은 아주 잘 돌아간다. 현재 개발중인 브랜치는 `master`에서 왔고, 지금은 문제가 있어도 예전 어느 시점에는 잘 실행되었다.

![back-to-the-past-git.png](/assets/images/hU7Agao.png)

> Git 커밋 목록

브랜칭 직후 커밋으로 가 보았다. 이 때까지는 잘 돌아갔다. 그 다음 커밋도 마찬가지였다.

동일한 작업을 반복해 문제를 발생시킨 커밋을 특정해 내었다.

## 지난 커밋 기준으로 하나씩 되돌려보기

보조 모니터에 브라우저로 GitHub을 띄워 놓고 변경된 파일을 하나씩 점검하였다. 새로 추가된 부분을 지우고, 지워진 부분을 복구하며 계속 실행을 시도하였다.

변경 사항 목록 중간 즈음에 다다를 무렵, 새로 추가한 `DirectMenuConverter`를 `import`하는 문이 문제라는 것을 발견했다.

## 원인

`DirectMenuConverter`는 원시 텍스트(교내 식당의 메뉴 정보)를 가공하는 역할을 담당한다. 중간에 이런 코드가 있다.

~~~js
const results = regexStrings
  .map((exprString) => new RegExp(exprString))
  .map((expr) => expr.exec(text))
  .filter((result) => !!result)
  .takeIf((collection) => collection.length > 0);
~~~

`takeIf`를 사용하였다. 코틀린에서 차용한 것인데, 스타일을 유지하면서 작성하기 위해 만들었다.

`takeIf`는 `Obejct`의 프로토타입에 추가된 메소드이다. 즉, 이런 코드를 사용하였다.

~~~js
Object.prototype.takeIf = function(predicate, nullishValue=undefined) {
  if (predicate(this)) {
    return this;
  } else {
    return nullishValue;
  }
};

export default Object;
~~~

해당 코드가 `DirectMenuConverter`에 import되어 실행 초반에 evaluate되면 문제가 발생하는 것이었다.

**즉, `Object`에 임의의 프로토타입 메소드를 추가한 것이 원인이었던 것이다.**

## 또 다른 원인

그런데 아까 에러 로그를 보면 `Hapi`가 계속 언급되었다. `Hapi`의 import를 지우면 문제가 사라지기도 하였다.

이를 통해 미루어 볼 때, `Obejct`의 프로토타입을 건드린 것 자체가 문제라기보다는, 해당 행위를 `Hapi`가 싫어한다고 추측하였다.

그 근거로 아래 예시를 참고하였다.

## Hapi와 Object

`Hapi`가 `takeIf`라는 심볼을 점유해서 충돌이 난 것이 아닐까 생각해 보았다.

~~~js
Object.prototype.noOneWillUseThisNameTrulySure = function() {};
~~~

허나 다른 이름을 사용해도 같은 에러가 발생하였다.

함수를 넣어준 것이 문제인가 싶어 숫자를 넣어 보아도 마찬가지였다.

~~~js
Object.prototype.aNumber = 123;
~~~

`null`은 어떻까 싶어 넣어 보았다.

~~~js
Object.prototype.nullish = null;
~~~

뭔가 다른 메시지가 출력됐다.

~~~
Error: Invalid term override for any nullish
~~~

스트링을 대입해 보아도 같은 메시지가 출력되었다.

~~~js
Object.prototype.aString = 'Why this happen to me?';
~~~

~~~
Error: Invalid term override for any aString
~~~

Stack tract를 따라가보니 `@hapi/joi/lib/extend.js` 41행으로 연결되었다.

~~~js
const terms = Object.assign({}, parent.terms);
if (def.terms) {
    for (const name in def.terms) {                                     // Only apply own terms
        const term = def.terms[name];
        Assert(schema.$_terms[name] === undefined, 'Invalid term override for', def.type, name);
        schema.$_terms[name] = term.init;
        terms[name] = term;
    }
}
~~~

`schema.$_terms[name] === undefined`가 `false`일 때, 즉 `schema.$_terms[name]`에 무언가가 있을 때에 에러가 throw되도록 짜여 있었다.

추측하건데, `schema.$_terms`가 `Object`를 나타내고, `name`은 위에서 정한 프로토타입의 이름 `nullish`나 `aString`인 듯 하다.

결국 아무 프로토타입도 넣지 말라는 뜻으로 풀이된다.

`null`과 비슷한 `undefined`는 어떨까?

~~~js
Error: Invalid template variable "#label" fails due to: Formula constant aString contains invalid undefined value type
~~~

또 다른 에러다.

~~~js
for (const constant in options.constants) {
    const value = options.constants[constant];
    if (value !== null &&
        !['boolean', 'number', 'string'].includes(typeof value)) {

        throw new Error(`Formula constant ${constant} contains invalid ${typeof value} value type`);
    }
}
~~~

이 에러는 우리가 정한 상수(`aString = undefined`)가 `null`은 아닌데 `boolean`도 아니고 `number`도 아니고 `string`도 아닐 때에 발생한다.

## 결론

도대체 왜 이렇게 만들었는지 모르겠다. 상당히 불친절하다. 찾아도 안 나온다.

`eslint`에는 네이티브 객체(`Object` 등)에 속성을 추가하는 것을 방지하는 규칙이 있다. 이것만 잘 따랐어도 이렇게 오래 삽질할 일은 없었을 터인지라 조금 허탈하긴 하다.
