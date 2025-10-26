---
title: "그냥 함수와 화살표 함수의 결정적 차이"
excerpt: "자바스크립트는 자아(this) 정체성을 가졌습니다..."
date: 2020-04-18 22:01:13 +0900
category: dev
---

~~~js
const foo = function() {
  ...
}
~~~

~~~js
const foo = () => {
  ...
}
~~~

둘의 차이는?

## 화살표 함수

자바스크립트에는 함수의 단축 표현으로 사용할 수 있는 화살표 함수(Arrow function)라는 것이 있다. 아래와 같이 생겼다.

~~~js
() => {}
~~~

`()` 안에 인자가 들어가고, `=>` 오른쪽에는 무언가를 반환하는 코드 블럭이나 expression(식)이 있다.

화살표 함수를 사용하면 콜백을 몇 글자 더 짧게 작성할 수 있다.

~~~js
setTimeout(function() {
  doSome();
}, 500);

setTimeout(() => {
  doSome();
}, 500);
~~~

5글자를 절약했다. 그런데, 표현이 간단해진 것 말고 다른 차이는 없을까?

## 스코프

`function`으로 선언된 함수는 자신만의 스코프를 가진다. 반면 화살표 함수는 그렇지 않다. [MDN](https://developer.mozilla.org/ko/docs/Web/JavaScript/Reference/Functions/애로우_펑션)에 좋은 자료가 있어 가져와 보았다.

~~~js
function Person() {
  // Person() 생성자는 `this`를 자신의 인스턴스로 정의.
  this.age = 0;

  setInterval(function growUp() {
    // 비엄격 모드에서, growUp() 함수는 `this`를
    // 전역 객체로 정의하고, 이는 Person() 생성자에
    // 정의된 `this`와 다름.
    this.age++;
  }, 1000);
}

var p = new Person();
~~~

`setInterval`의 콜백 함수 `growUp`은 자신만의 `this`를 가진다. 즉, 해당 콜백 내에서 `this`는 `Person` 함수가 아니라 `growUp` 함수를 가리킨다. 코틀린 같았으면 `this@Person` 같은 것이 있겠으나 여기에는 없다.

~~~js
function Person() {
  var that = this;  
  that.age = 0;

  setInterval(function growUp() {
    // 콜백은  `that` 변수를 참조하고 이것은 값이 기대한 객체이다.
    that.age++;
  }, 1000);
}
~~~

위 문제를 해결하기 위해 `this`를 다른 변수에 담아 처리할 수도 있다. 하지만 화살표 함수를 사용하면 더 간단하게 해결된다.

~~~js
function Person(){
  this.age = 0;

  setInterval(() => {
    this.age++; // |this|는 Person 객체를 참조
  }, 1000);
}

var p = new Person();
~~~

헤헤 해결.

## 화살표 함수를 사용하면 안 될 때

객체 프로토타입으로 메소드를 선언할 때에는 화살표 함수를 사용하면 안된다!

~~~js
// Good
String.prototype.toInt = function() {
    return Number(this);
};

// Not good
String.prototype.toInt = () {
    return Number(this); // this를 찾을 수 없음.
};
~~~

문서에 이렇게 써 있다.

> 이  함수 표현은 메소드 함수가 아닌 곳에 가장 적합합니다.    
[MDN](https://developer.mozilla.org/ko/docs/Web/JavaScript/Reference/Functions/애로우_펑션)

## Reference

- [애로우 펑션](https://developer.mozilla.org/ko/docs/Web/JavaScript/Reference/Functions/애로우_펑션)
