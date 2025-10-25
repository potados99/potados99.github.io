---
title: "[삽질] 자바스크립트로 서버 짜기: 대삽질 후기"
date: 2020-03-06 01:42:51 +0900
category: dev
---

# 들어가며

학교 [앱센터](https://github.com/inu-appcenter)에서 진행중인 프로젝트가 있다.

서비스 중 클라이언트, 교내 업체 측과 통신하는 서버 부분이 있다.

코드를 보고서는, 다시 새로 짜야겠다고 결심했다.

아직 완성은 못했지만 서버나 자바스크립트라고는 하나도 모르는 상태에서 시작해서 무수한 삽질을 겪었고, 기억하기 위해 남겨둔다.

아래부터는 주로 구성과 호환성 문제 등으로 고생한 경험에 대해 쓸 것이다.

# 기술 선택

간단한 API 서버이기 때문에 언어와 엔진으로는 `1. 간단하고` `2. 사용자 많고` `3. 레퍼런스도 많은` 자바스크립트와 Node.js를 채택했다.

서버 라이브러리는 [Hapi](https://hapi.dev)를 사용했다.

기능상의 차이는 거의 없고, 새롭고 신선하고 사용법이 조금 더 마음에 들어서 채택했다.

테스트는 Jest를 사용했다. 딱히 이유는 없고, 아무거나 집어왔다.

# 설계

손 가는대로 짰다가는 엉망이 될 것이 뻔하므로 적절한 아키텍쳐를 도입하기로 했다.

예제를 이것저것 찾아보다가 맘에 드는 [클린 아키텍쳐 예제](https://github.com/jbuget/nodejs-clean-architecture-app)를 하나 발견했다.

해당 프로젝트를 레퍼런스 삼아 디렉토리 구성이나 코딩 컨벤션 등을 모방하였다.

# 구현

개발 착수한지 일주일만에 처음 목표한 부분은 구현이 끝났다.

에너지가 남아돌아서 테스트 + 문서 + 배포 가이드까지 작성하고 실서버 설정 + 테스트까지 끝냈다.

이제 좀 쉬어야지 하면서 혹시나 싶어 기존 서버 로그를 구경하는데, 처음 보는 기능이 수행되고 있었다.

클라이언트가 사용하지 않는 API를 누군가 호출하고 있어서 알아보니 이 서버가 모바일 앱만을 위한 게 아니었다.

문서도 없고 개발 기록도 없고 커밋 로그에도 없고 알려주는 사람도 없어서 한참 고생해서 찾았다.

아무튼 해당 기능을 넣기 위해 새 브랜치를 만들어서 다시 개발에 착수했는데...

# 발단

Node에서 `require`로 가져오는 모듈들은 각자 별도의 스코프를 가지지만, 모두 싱글턴이다.

즉 한번 `require`로 evaluate된 모듈은 그 상태를 유지한다.

그래서 그냥 가져다 쓰면 그게 싱글턴이다.

그런데 욕심이 나기 시작했다.

저 함수인지 클래스인지도 구분 안되는 모듈을 매번 못생긴 `require`로 가져다 쓸 게 아니라,

모두 클래스로 디자인해서 의존성 주입 라이브러리를 사용해보면 어떨까 하는 생각이 들었다.

# 리팩토링

클래스는 ES6(ECMA Script 6)부터 추가되었다. NodeJS는 이걸 이미 지원한다.

거의 모든 소스 파일(대략 50개)을 클래스 기반으로 새로 디자인했다.

ES6은 모듈을 다룰 때 `import`와 `export`를 사용한다.

다시 모든 소스 파일에서 `require` & `module.exports`을 `import` & `export`로 바꾸었다.

# 엿과 방황

엿을 무수히 먹고 한참을(며칠) 방황했다.

## 엿 하나

Node 12에서 ES module의 사용은 **실험적으로 지원된다.** ~~소심한 것들.~~

그냥 실행했다가는 `Uncaught SyntaxError: Cannot use import statement outside a module` 라며 뻗는다.

온 구글을 뒤져서 [Node ES module 문서](https://nodejs.org/docs/latest-v12.x/api/esm.html#esm_ecmascript_modules)까지 도달했다.

`--experimental-modules` 옵션을 주어야 `import`를 쓸 수 있단다.

실행을 했다.

이번엔 `Cannot find module`이란다.

찾아보니 `--es-module-specifier-resolution=node` 옵션도 주어야 한단다.

![f](/assets/images/ZNKT2jl.gif)

> 어 ? 2020년에 어? 2015년 기술좀 쓰겠다는데 어? 아직도 지원을....

한번 실행하려면 명령이 `node --experimental-modules --es-module-specifier-resolution=node index.js` 이렇게 길어진다.

**맘에 안든다.**

## 방황 하나

결국 아직도 Node가 ES6 모듈을 전면적으로 지원하지 않는다는 것인데, 다른 웹앱 개발자들은 그러면 ES5 이하만 쓰는건가 해서 찾아보니

`TypeScript`나 ES6, ES7같은 기존의 브라우저나 엔진은 전혀 알아먹을 수 없는 언어들을 CommonJS로 바꿔주는 `트랜스파일러`라는 존재가 있더라.

대표적으로 `Babel`이 있다.

충분히 검증된 솔루션인 것 같아서 도입하기로 했다.

`@babel/core`도 `@babel/node`도 `@babel/cli`도 `@babel/preset-env`도 설치하고 `.babelrc`도 설정하고 npm 명령어도 설정하고 기타등등 사소한 과정을 거쳐서 babel 설치와 설정을 끝냈다.

실행 옵션 중에 개발용으로 `babel-node`가 존재한다. 빌드하지 않고 바로 실시간으로 실행할 수 있게 해주는 것인데, 이게 프로덕션용은 아니란다.

> You should not be using babel-node in production.     
It is unnecessarily heavy, with high memory usage due to the cache being stored in memory.     
babel-node를 프로덕션에서 쓰지 마세요.
불필요하게 부겁고, 캐시를 메모리에 저장하기 때문에 메모리 사용량이 많습니다.

하는 수 없이 빌드 과정을 추가하기로 했다.

`build` 명령에 `babel lib --out-dir dist` 할당하고 실행을 해보는데 엉뚱하게 `import`가 어쩌구 저쩌구 하는 에러가 뜬다.

분명 `import`의 흔적이 없게 컴파일했는데..?

## 엿 둘

`babel`을 사용해 빌드하면 소스코드가 들어있는 `lib` 디렉토리 구조와 소스파일 전체가 트랜스파일을 거쳐 `dist`에 생성된다.

`node dist/index.js`로 해당 소스를 실행하면, 그 소스가 참조하는 모듈은 `lib`에 있는 것일까, `dist`에 있는 것일까..?

이때 모듈 경로를 타이핑하는 수고를 덜고자 `link-module-alias`를 사용하고 있었는데, 이 녀석이 자꾸 `lib`에 있는 원본 소스를 가리킨 것이다.

## 방황 둘

문제 두 개가 동시에 덮쳤다.

- dist 디렉토리 속의 의존성은 어디를 향하는가
- module alias 어떻게 할 것인가

첫 번째 문제는 결국 babel을 포기함으로써 해결되었다.

끈질기게 찾다 보니 Node에서 ES module을 네이티브로 엘레건트하게 사용하는 방법이 있었다.

`npm i esm`으로 esm 모듈을 설치하고 `node -r esm index.js`로 실행하면 된다. 야호.

다음 문제.

module alias를 어떻게 할 지 상당히 고민을 많이 했다.

`../../../../domain/(생략)` 이런건 도무지 하고 싶지가 않았다.

참 많은 방법이 있었는데 시도해본 것은 다음과 같다:

### link-module-alias

node_modules 디렉토리에 내 소스로 향하는 symlink를 만든다.

어디서 import 하더라도 node_modules는 기본 탐색 경로에 있기 때문에 환경을 가리지 않고 잘 동작한다.

하지만 치명적인 단점이 있었다.

npm으로 패키지를 설치할 때마다 링크가 날아가거나 설치한 패키지가 날아갔다. 심지어 소스코드 전체를 날려버리기도 했다.

> Note: you can use @ in front of your module but before of the possible data loss    
 https://github.com/Rush/link-module-alias/issues/3

 이는 원작자가 경고한 부분이기도 한데, 무시하고 `npm install`을 수행했다가 **.git까지 날아가버렸다**

 푸시 안한 커밋 다 날아가나 싶었는데 다행이 타임머신 백업이 살아있어 복구했다 ~~(고마워요 애플)~~

### module-alias

위와 설정 방법은 같으나 조금 더 안전하다.

앱의 시작 부분에 `require('module-alias/register');`를 써주면 된다.

다 좋은데 치명적인 단점은...

- Jest 테스트시 alias를 못 읽는다.
- ES6의 `import`와 호환이 안된다. `module-alias/register`를 도저히 못 찾는다.

### Webpack

Webpack은 이렇게 쓰라고 있는건 아니지만, 사용중인 IDE인 WebStorm이 webpack의 module aliasing을 도입한 것을 보고 설정 파일을 만들어 적용해 보았다.

IDE상에서는 잘 작동하였으나 실행하면 webpack과 아무 연고도 없으니 당연히 모듈을 찾지 못한다.

### 마지막 방법

나에게는 적용되지 않는 저 가증스러운 기술들을 집어던지고 **상대경로 hell** 에 빠지기로 했다.

IDE의 지원 덕분에 금방 바꿀 수 있었고, 생각보다 그렇게 혐오스럽지는 않다.

무엇보다, 테스트 환경과 실제 환경에서 모두 모듈 찾는 문제가 해결되었다.

## 엿 셋

의존성 주입 클래스를 만들고 테스트하려는데 `Must use import to load ES Module`라며 거부한다.

심지어 파일 내용 전체가 `console.log('hi');`인 `.js`파일도 실행을 거부한다.

![wtf](/assets/images/v4MY5ki.jpg)

> 얘가 반항을 하나..? 뭘 잘못 건드렸나..? 재설치를 해야 하나....?

한참 뒤지다 정신차리고 보니, 그 전에 `package.json`에서 `type`에 `module`을 넣어 준 것이 화근이었다.

## 방황 셋

망할 `import`를 사용하려면 다음 조건을 만족해야 한다:

- `--experimental-modules` 옵션을 준다.
- 해당 파일 또는 import하는 파일의 확장자가 `.mjs`이거나 `package.json`의 `type`이 `module`이어야 한다.

한 번은 옵션을 안 주어서 오류가 나고, 한번은 옵션을 주어도 `package.json` 설정을 안해서 오류가 나고, 이런 식이었다.

해당 부분에 대한 자세한 설명은 [문서](https://nodejs.org/docs/latest-v12.x/api/esm.html#esm_ecmascript_modules)에 들어 있다.

옵션을 매번 주기 너무 지저분해서 더 찾아보다가 나은 해결책을 발견했다.

`esm` 모듈을 쓰면 된다는 것이다.

`npm install esm`하고 `node -r esm index.js`하면 된다!

이제 Node에서 **네이티브로**, 그리고 **예쁘게** ES6을 돌릴 수 있게 되었다.

## 엿 넷

CommonJs의 `exports`와 ES module의 `import`는 잘 맞지 않는다.

되기는 되나 매끄럽게 되지는 않는다.

내 소스의 sequelize 모듈에서 `sequelize`를 import 하는데 `const Sequelize = require('sequelize')`처럼 쓰던 코드를

`import Sequelize from 'sequelize'`로 바꾸니 예상한 결과가 나오지 않아 `import {Sequelize} from 'sequelize'`로 바꾸니,

무슨 요상한(지금은 기억이 안난다) 에러가 튀어나왔다.

찾아보니 CommonJS에서 exports에 할당한 모듈은 ES6에서 import로 가져올 때에 저런 destructor를 사용하지 못하는 것 같다.

## 방황 넷

`sequelize`는 `require`로 가져와야겠다고 마음먹고 코드를 다음과 같이 바꾸었다.

~~~
import {createRequire} from 'module'; // module은 ES 모듈인지 잘 된다.
const require = createRequire(import.meta.url);
const Sequelize = require('sequelize');
~~~

일단은 계획한 대로 잘 작동했다.

## 엿 다섯

소스 파일의 확장자를 모두 `.mjs`로 변경했다.

그리고 Jest 테스트를 돌려보는데... 이 친구는 Node와 별개라 ES6을 못 돌린다...

## 방황 다섯

처음 시도는 `babel`이었다.

Jest에게 babel로 트랜스파일된 소스를 넘겨주면 되지 않을까 하여 Jest의 `transform`에 `babel-jest`를 설치, 설정하였다.

기대하고 실행해 보았는데 난데없이 `Cannot use 'import.meta' outside a module`이 날아온다.

문제가 발생한 지점은 sequelize를 가져오기 위해 `createRequire`를 사용한 부분이었다.

해당 함수는 현재 디렉토리 위치를 인자로 받는데(ES module에는 `__dirname`이 없다!!), `import.meta.url`이 그 정보를 가지고 있어서 넘겨준 것이었다.

그런데 `babel-jest` 환경에서는 `import.meta`에 접근할 수 없다니....

한참을 삽질하다가, babel이 필요 없음을 발견했다.

`transform` 중에 `jest-transform-esm`이 있었으니, [아주 긴 이슈와 토론](https://github.com/standard-things/esm/issues/706)을 거쳐 만들어진 패키지였다.

`babel-jest`를 저 `jest-transform-esm`로 대체하고 `babel`을 싹-다 날려버렸다. ~~(어우 시원해 ><)~~

그런데 그래도 같은 오류가 반복되었다.

결국은 `import.meta`에 접근하지 않기로 하였다.

당시 소스 코드에서 해당 개체에 접근하는 부분은 두 군데가 있었으니, 하나는 위 sequelize 부분이고, 다른 하나는 서버의 public 호스팅 디렉토리를 설정하는 부분에서 현재 디렉토리 이름을 가져오기 위해 사용한 부분이었다.

전자는 import 부분 코드를 다음과 같이 수정하여 해결되었다.

~~~
import seq from 'sequelize';
const {Sequelize} = seq; // 이게 되네
~~~

안 되는 줄 알았는데 알고 보니 잘 되었다.

남은 부분은 현재 디렉토리를 가져오는 부분이었는데, [이 글](https://stackoverflow.com/questions/46745014/alternative-for-dirname-in-node-when-using-the-experimental-modules-flag)의 답변 중에 아주 인상적인 것이 있었다.

ES module은 `__dirname`에 접근할 수 없지만 CommonJS 모듈은 할 수 있다.

또한 ES module 내에서 CommonJS 모듈을 사용할 수 있다.

따라서 CommonJS의 `__dirname`을 노출시키는 `module.exports = {__dirname};` 이런 내용의 파일을 만드는 것이다.

여기서 중요한 것은 이것을 같은 디렉토리에 만드는 것이다.

그렇게 되면 ES module은 같은 디렉토리에 있는 CommonJS 모듈의 `__dirname`에 접근할 수 있게 된다.

이 방법으로 문제를 해결하였다.

## 엿 여섯

실행을 해보는데 `Must use import to load es module`이라고 또 거부한다.

삽질하다가 해가 뜨고 너무 지쳐 반 즈음 포기하고 Node 문서를 보다가, **package.json 내 type이 module로 되어 있으면 모든 파일을 ES module로 간주** 한다는 것을 알았다.

`__dirname`을 노출시키는 `expose.js`(이름을 그렇게 지었다)는 ES module이 아니며, 그래서도 안된다!

따라서 **Node에서 CommonJS 와 ES module을 같이 사용하려면, type은 기본값(commonjs)으로 두어야 한다.**

대신 ES module로 인식되었으면 하는 모듈은 확장자를 `.mjs`로 설정한다. 이 부분은 이미 적용되었다.

# 결론

자바스크립트는 너무 빠르게 변화하고 있다. 그런데 Node는 너무 소심하게 지원하고 있다.

그나마 다행인 것은 Node가 CommonJS와 ECAM6의 상호 운용을 허락한다는 것이다.

현재 이 프로젝트는 신 문물과 과거의 찌꺼기(?)가 섞인 과도기적 형태이다. 따라서 시간이 지남에 따라 수정이 불가피할 것으로 보인다.
