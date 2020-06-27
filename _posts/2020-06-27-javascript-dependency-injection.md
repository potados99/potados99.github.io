---
title: "[JS] 의존성 주입 라이브러리(?) 만들어보기"
date: 2020-06-27 21:33:15 +0900
categories:
   - dev
---

## 들어가며

의존성 주입은 소프트웨어에서 사용될, 즉 소프트웨어가 의존하는 컴포넌트를 소프트웨어 밖에서 제공하는 개념을 나타낸다.

> 소프트웨어 엔지니어링에서 의존성 주입은 하나의 객체가 다른 객체의 의존성을 제공하는 테크닉이다. "의존성"은 예를 들어 서비스로 사용할 수 있는 객체이다. 클라이언트가 어떤 서비스를 사용할 것인지 지정하는 대신, 클라이언트에게 무슨 서비스를 사용할 것인지를 말해주는 것이다. "주입"은 의존성(서비스)을 사용하려는 객체(클라이언트)로 전달하는 것을 의미한다. 서비스는 클라이언트 상태의 일부이다. 클라이언트가 서비스를 구축하거나 찾는 것을 허용하는 대신 클라이언트에게 서비스를 전달하는 것이 패턴의 기본 요건이다.    
위키백과

내가 쓰려고 하는 객체가 어떻게 구현되었는지, 어떻게 작동하는지도 모르는 채로 일단 가져다 쓰는 것이다. 객체지향 패러다임에서는 인터페이스를 정의하고 이에 대한 구현을 나중에 제공하는 방식으로 적용한다.

## 자바스크립트 의존성 주입 라이브러리

> 자바스크립트라 하였지만 사실 ECMAScript 5이다.

올해 초에 자바스크립트로 서버 앱을 몇 개 만들었다. 늘 하던 대로 의존성 주입 기법을 사용해보고자 npm에서 라이브러리를 찾아 보았는데, 딱히 원하는 것이 없었다. 기능이 너무 복잡하거나 목적이 조금씩 달랐다.

사실 자바스크립트에서는 별도의 코드 없이도 싱글턴을 활용할 수 있다. 다만 하나의 인터페이스에 대한 여러 구현(목업, 실제 구현)을 외부 파일에서 다루고 싶었다.

내가 사용해본 유일한, 그리고 가장 탁월한 의존성 주입 라이브러리는 안드로이드 + Kotlin 환경에서 동작하는 [koin](https://github.com/InsertKoinIO/koin)이었다. 정말 많은 기능이 있었으나, 싱글턴을 정의하고 주입받는 용도로만 사용하였다.

Koin에서 영감을 받아, 같은 기능을 자바스크립트로 만들어 보기로 했다.

## API

만들기 전에 사용하는 것 부터 상상해보자.

### 사용하기

~~~js
// UserController.mjs
...
const userRepo = await resolve(UserRepository);

userRepo.saveUser(user);
...
~~~

`resolve` 함수를 사용하여 `UserRepository` 타입의 싱글턴 인스턴스를 가져온다. 그리고 사용한다. 아주 간단하다.

### 사용하기 위해 준비하기

#### 싱글턴 정의하기

~~~js
// modules.mjs

export default [
    {
        create: async (r) => new UserRepositoryImpl({
            dataSource: await r(UserDataSource),
        }),
        as: UserRepository,
    },
    {
        create: async (r) => new UserDataSourceImpl(),
        as: UserDataSource,
    },
]
~~~

> **키워드**    
- `create`: 주어진 정의대로 실제 객체를 만들 때에 호출될 함수이다. 이 함수는 비동기 함수이며, 실행이 완료되었을 때에 주어진 타입의 인스턴스를 반환해야 한다.    
- `as`: 생성된 인스턴스에 부여할 타입이다. 예를 들어 `UserRepositoryImpl`의 인스턴스를 `UserRepository` 타입으로 다루고 싶다면, `as: UserRepository`와 같이 명시한다.    
- `r`: resolve의 준말로, 주어진 타입(`as`로 명시한)의 인스턴스를 반환하는 비동기 함수이다.

정의하고자 하는 모듈은 구현 객체를 생성하는 데에 사용할 `create` 함수, 그리고 그 모듈의 타입인 `as`를 명시해야 한다.

`create` 함수는 비동기 함수로, 인자로 비동기 함수 `r`을 제공하여 객체 생성에 필요한 의존성을 가져올 수 있게 한다. 위 코드에서 `create`은 `r`을 인자로 받아 `UserRepositoryImpl` 객체를 반환하도록 정의되었다.

이때 객체화 과정에서 `UserRepositoryImpl`의 생성자에 넘겨줄 `dataSource`가 필요한데, 이는 `create`의 인자로 넘겨받은 `r`을 호출함으로써 얻는다.

위 코드를 요약하면 다음과 같다: **UserRepository 타입의 UserRepositoryImpl 인스턴스를 등록하는데, 이때 인스턴스를 만드는 과정에서 생성자에 넘겨줄 dataSource가 필요하다. 이는 UserDataSource 타입의 인스턴스인데, 등록된 싱글턴 정의 중에서 찾도록 한다.**

#### 라이브러리 초기화(싱글턴 객체화)하기

~~~js
// index.mjs
...
await init(modules);
...
~~~

애플리케이션을 시작하기 전에 객체화(instantiation)가 완료되어야 한다. 그래야 객체를 `resolve`로 가져올 수 있다.

위에서 `create`와 `as`로 나타낸 싱글턴 정의의 배열을 인자로 받아 객체화를 실행하는 `init` 함수를 사용한다.

## 구현

구현은 크게

- 싱글턴 정의 등록과 인스턴스 resolution을 담당하는 `Injector` 클래스와
- `Injector`를 편하게 사용할 수 있도록 전역 함수를 export하는 `resolve` 모듈

로 이루어진다.

### Injector

[소스 전문](https://github.com/univuc/IAB/blob/master/lib/di/Injector.mjs)

`Injector`에서는 객체화를 담당하는 `init` 메소드가 핵심이다.

`init`은 주어진 싱글턴 정의 각각(`singleDeclaration`)에 대해 아래 코드를 실행한다.

~~~js
...
this._createFunctions.set(
  singleDeclaration.as,
  singleDeclaration.create,
);
~~~

`_createFunctions`은 `as` to `create` map이다. 싱글턴 정의에서 주어진 타입에 대한 객체 생성 함수를 담아두는 map이다.

그 다음으로는 `_instantiateAll` 함수가 실행된다.

`_instantiateAll`은 `_createFunctions`에 담긴 싱글턴 정의들을 순회하면서 아직 객체화되지 않은 정의들에 대해 생성 함수를 호출하여 인스턴스를 만든다.

인스턴스를 실제로 생성하는 부분은 아래와 같다:

~~~js
async _instantiateAll() {
    ...
    const instance = await createFunc((type) => this._requireInstance(type));
    ...
}
~~~

> **키워드**    
`createFunc`: 싱글턴 정의를 실제로 객체화할 때에 사용하는 함수. 위에서 본 싱글턴 정의의 `create` 함수와 같음.    
`_requireInstance`: 주어진 타입의 인스턴스가 있으면 가져오고, 없으면 만들어서 가져오는 메소드.
`_resolveDependency`: 주어진 타입의 인스턴스를 만드는 메소드.

`createFunc`을 호출하는데, 이때 넘겨준 람다함수 `(type) => this._requireInstance(type)`이 바로 위에서 본 `r`의 실체다. `_requireInstance`는 주어진 타입에 해당하는 인스턴스를 반환한 책임을 가진다.

`_requireInstance`는 별다른 일을 하지 않고 바로 `_resolveDependency`를 호출한다. `_resolveDependency`는 위의 `_instantiateAll`과 상당히 유사하게 움직인다.

~~~js
async _resolveDependency(type) {
  ...
  const instance = await createFunc((type) => this._requireInstance(type));
  ...
}
~~~

결국 `_resolveDependency`는 다시 `_requireInstance`를 호출하고, 이는 다시 `_resolveDependency` 호출로 이어진다. 이는 싱글턴 정의의 의존 관계가 해소될 때까지, 즉 이미 인스턴스가 확보되어 새로 인스턴스를 만들 필요가 없을 때까지 계속된다.

위의 코드 예시로 보면 다음과 같이 움직인다.

1. `UserRepositoryImpl`을 만들기 위해 `UserDataSource` 타입 인스턴스를 탐색함.
2. `UserDataSource`에 대한 싱글턴 정의가 발견되었으나 아직 객체화되지 않음.
3. `UserDataSourceImpl` 인스턴스를 생성하는 함수를 호출하여 인스턴스를 확보함.
4. 의존 인스턴스를 확보하였으므로 `UserRepositoryImpl` 인스턴스를 생성함.

### resolve

`Injector` 객체를 만들고 전역적으로 관리하는 부담을 덜어주기 위한 모듈이 `resolve`이다.

해당 모듈은 `init`과 `resolve` 함수를 지원하는데, 모듈(파일) 내부에서 `Injector` 클래스의 인스턴스를 가지고 있다. 자바스크립트에서 하나의 파일은 최초 사용시 단 한 번 evaluate되고 그 상태가 유지되기 때문에 인스턴스를 파일 내에 숨겨 전역적으로 그리고 간접적으로 접근할 수 있다.

## 마치며

저 `Injector`와 `resolve`는 여러 개인 프로젝트에서 잘 돌려쓰고 있다. 라이브러리의 동작을 모방하여 보는 게 생각보다 큰 도움이 된다.

## Reference

- https://ko.wikipedia.org/wiki/의존성_주입
- https://github.com/InsertKoinIO/koin
