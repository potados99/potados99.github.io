---
title: "[Java] 객체지향으로 아프리카 사바나 초원의 생태계 모델링하기"
date: 2019-10-02 15:52:42 +0900
excerpt: "기본적인 객체지향 예시 Java로 만들어보기"
categories:
    - fun
tags:
    - java
    - object-oriented
    - OOP
    - example
    - tutorial
---

> 이 글은 클래스 기반 객체지향의 아주 기초적인 부분들을 설명하는 글입니다. 혹시나 글에서 틀린 부분을 발견하신다면 이메일<potados99@gmail.com>로 연락주시면 매우 감사하겠습니다.

## 객체지향

 영어로는 Object-Oriented이다. 일본어를 거쳐 번역되는 과정에서 `객체`라는 단어가 사용되었다. 원어의 의미를 따지면 '물체 지향' 또는 '사물 지향'이다. 객체지향은 세상의 모든 것을 사물로 보고 프로그래밍을 함에 있어 어떤 사물에 상태와 행동을 부여하는 패러다임이다.

 객체지향이 있기 전에는 절차지향이 있었다. 절차지향은 프로그램을 단지 명령과 데이터의 집합으로 보는 패러다임이다. 객체지향은 이와 다르게 프로그램을 클래스와 객체의 집합으로 본다. 자신만의 상태와 행동을 지니는 객체들이 서로 의사소통하며 프로그램을 진행시키는 것이다.


## 클래스
 객체지향을 언급할 때에 항상 따라다니는 단어이다. 흔히 '급'이라는 뜻으로 쓰이는데, 여기서는 '종류' 또는 '분류'라는 뜻으로 쓰인다. 클래스는 어떠한 객체를 정의하는 설계도면이다.

 예를 들어 '사람'을 객체지향으로 모델링한다고 한다. 사람은 '나이'라는 속성과 '생존유무'라는 상태를 가진다. 또한 '숨쉬기'와 '나이먹기'라는 행동을 가진다. 이를 클래스로 표현한다면 이러할 것이다.

 ~~~
 클래스 사람 {
     // 상태
     int 나이
     bool 생존유무

     // 행동
     숨쉬기() {}
     나이먹기() {}
 }
 ~~~

 정리하면 다음과 같다:    
 **어떤 존재가 사람일 때, 그 존재는 나이가 n살이며, 죽었거나 살아있으며, 숨쉬거나 나이를 먹을 수 있다.**


## 객체

 클래스는 어떠한 존재의 상태와 행동을 정의하는 설계도이다. 객체는 해당 설계도를 따라 만들어진 `실체`이다. 여기서 `실체`라는 것이 중요하다. 우리가 어떤 존재를 클래스로 정의해놓기만 하면 거기서 그칠 뿐 아무 일도 일어나지 않는다. 위에서 '사람'을 정의했지만 그랬다고 해서 사람 여럿이 생겨나서 프로그램이 굴러가는 것은 아니다.

 클래스를 실체화하는 과정을 `객체화`라고 한다. 정의된 클래스는 이 객체화 과정을 통해 실존하는 `인스턴스`가 된다. 왜 `인스턴스(instance)`인가 하면, `객체화(instantiate)`했기 때문에 `instance`이다. 해당 클래스가 묘사하는 존재를 일반적으로 가리킬 때에는 `객체`라는 용어를 사용한다.

> 객체와 인스턴스는 비슷한 의미로 쓰이지만 지칭하는 맥락이 조금 다르다. 인스턴스는 객체화의 결과로 메인 메모리에 적재된 실체라는 뜻이 강한 반면 객체는 '객체지향'의 그 객체로, 현실세계의 객체를 나타낸다.    
예를 들어 사람 클래스를 객체화한 '홍길동'이라는 객체가 있다. 이때 '홍길동'은 객체이다. 또한 '홍길동'은 사람 클래스의 인스턴스이다.


## 필드와 메소드

 클래스는 상태와 행동을 가진다. 실제 코드에서 클래스를 정의할 때에(Java 기준) 상태는 필드(field), 행동은 메소드(method) 지칭한다. 필드는 클래스 내부의 변수이고, 메소드는 클래스 내부의 함수이다. 위의 사람 클래스 예시에서 나이와 생존 유무는 필드이다. 숨쉬기와 나이먹기는 메소드이다.

## 상속

 객체지향에서 아주 중요한 핵심 기능 중 하나이자 코드의 재활용을 가능하게 하고 다형성(아래에서 언급)을 실현시켜 주는 요소이다.

 사람은 부모의 특징을 물려받듯 클래스도 부모 클래스의 특징을 물려받는다. `Child` 클래스가 `Parent` 클래스를 상속받는다고 하면, `Child`는 모든 부모의 상태와 동작을 가지며, 이에 더해 자신만의 상태와 동작을 가지게 된다.

  예를 들어 `Cloth` 클래스와 이를 상속한 `Pants` 클래스가 있다. 옷은 입을 수 있다. 당연히 바지도 입을 수 있다.

  상속에서 중요한 특징이 하나 더 있다. 자식 클래스와 부모 클래스 사이에 *`Child` is `Parent`* 관계가 성립한다. 위의 예시에서 바지는 옷이다. 하지만 옷이 바지인 것은 아니다.

 > 위에서 다형성을 언급하였다. 다형성은 여러가지 형태를 지닐 수 있는 특성을 말한다. `Pants` 클래스의 인스턴스는 `Pants`이기도 하지만 동시에 `Cloth`이기도 하다. 만약 더 많은 부모 클래스가 존재할 경우 그 모든 부모 클래스의 형태로도 표현할 수 있다. 자바의 경우 모든 클래스의 조상은 `Object`이기 때문에 모든 객체가 `Object`로 표현 가능하다.


## 인터페이스

 인터페이스는 어떤 클래스가 구현해야 할 속성과 행동을 모아놓은 것이다. 인터페이스라는 단어는 소통의 창구 또는 방법을 뜻한다. 사실 잘 와닿지 않는다. 이 이름이 가장 잘 납득이 가는 예시는 다음과 같다.

 ~~~java
 // '날 수 있다' 라는 행동을 정의하도록 명시하는 인터페이스.
 Interface Flyable {
     void fly();
 }

 // 새는 날 수 있다.
 public class Bird implements Flyable {
     @Override
     void fly() {
         System.out.println("새 날다");
     }
 }

 // 비행기도 날 수 있다.
 public class AirPlain implements Flyable {
     @Override
     void fly() {
         System.out.println("비행기 날다");
     }
 }

 // thing이 무엇이든 간에, Flyable 인터페이스를 구현한 클래스의 인스턴스이면 된다.
 private void flyAway(Flyable thing) {
     thing.fly();
 }
 ~~~

 자바로 작성한 예제이다. 먼저 `Flyable`이라는 인터페이스를 만들어준다. 그리고 이를 구현하는 `Bird`와 `AirPlain` 클래스를 만들어준다.

 인터페이스는 클래스에 가져다 붙일 수 있다. 이렇게 인터페이스를 추가하면 해당 클래스가 적어도 그 인터페이스의 기능은 가지고 있다고 확신할 수 있다. 따라서 `Flyable`을 구현한 `Bird`와 `AirPlain` 모두 `fly`라는 메소드를 가지고 있다는 것을 알 수 있다.

 이때 `flyAway` 메소드는 인자로 '날 수 있는 것'이면 어떤 것이든 받을 수 있다. 인자 `thing`이 새일지 비행기일지는 모른다. 하지만 그것이 날 수 있다는 것은 확실하다. 넘어오는 객체가 어떤 것인지는 몰라도 인터페이스(소통 방법)만 준수한다면 이에 맞는 일을 할 수 있는 것이다.


## 실제 세계 모델링하기

 객체지향이 현실세계를 제대로 반영할 수 있는가에 대해서는 이견이 갈리지만 현존하는 가장 유용한 프로그래밍 패러다임 중 하나라는 사실에는 변함이 없다. 이를 잘 활용하여 아프리카 사바나 초원의 생태계를 모델링해보고자 한다.

 먼저 생물 클래스를 정의한다.

 ~~~java
 public class Life {
     // 모든 생명은 태어난 순간부터 나이를 먹는다.
     int age;

     // 모든 생명은 죽는다.
     public void die() {
         System.out.println("My journey has reached its end.");
     }
 }
 ~~~

 초원에 존재하는 생물을 크게 나누면 동물과 식물일 것이다. 물론 다른 분류도 존재하지만 여기서는 잠시 생략하도록 한다.

 ~~~java
 public class Animal extends Life {
     // 동물은 움직일 수 있다.
     public void move() {
         System.out.println("Moving!");
     }
 }

 public class Plant extends Life {
     // 식물은 광합성을 할 수 있다.
     public void photosynthesis() {
         System.out.println("Creating ATPs!");
     }
 }
 ~~~

 동물 중에서도 날 수 있는 동물과 뛸 수 있는 동물이 있다.

 ~~~java
 Interface Flyable {
     void fly();
 }

 Interface Runnable {
     void run();
 }
 ~~~

 호랑이는 동물(생명)인 동시에 달릴 수 있다는 특징을 가지고 있다.      
 독수리는 동물인 동시에 날 수 있다는 특징을 가지고 있다.

 ~~~java
 public class Tiger extends Animal implements Runnable {
     @Override
     void run() {
         System.out.println("A tiger runs.");
     }
 }

 public class Eagle extends Animal implements Flyable {
     @Override
     void run() {
         System.out.println("An eagle flies.");
     }
 }
 ~~~

 식물은 풀과 나무로 분류해본다. 물론 여기에도 많은 분류가 있지만 이 예시에서는 생략한다.

 ~~~java
 public class Grass extends Plant {
     public boolean overAnYearLife;
 }

 public class Tree extends Plant {
     public int length;
 }
 ~~~

 밀은 풀, 바오밥나무는 나무이다.

 ~~~java
 public class Wheat extends Grass {
     //
 }

 public class Baobab extends Tree {
     //
 }
 ~~~

 동물에 특징을 추가할 때에는 인터페이스를 사용하였다. 식물을 분류할 때에는 상속을 활용하였다.

> 인터페이스는 이럴 때에 사용한다:
- 상속과 관계없이 클래스에 특정 기능을 추가하고 싶을 때.
- 여러 클래스에 퍼져있는 공통된 기능을 하나로 모아 명시하고 싶을 때.    

> 상속은 이럴 때에 사용한다:
- 어떤 클래스를 세분화시켜 기능을 추가하고 싶을 때.
- 부모 클래스의 타입으로도 다뤄지기를 원할 때.

 이제 객체를 만들어보자.

 ~~~java

public class Main {
    static void main(String[] args) {
        Tiger babyTiger = new Tiger();
        Eagle fastEagle = new Eagle();

        Wheat yellowWheat = new Wheat();
        Baobab bigBaobab = new Baobab();

        // 호랑이는 뛸 수 있기 때문에 Runnable로 나타낼 수 있다.
        Runnable runningThing = babyTiger;
        // 독수리는 날 수 있기 때문에 Flyable로 나타낼 수 있다.
        Flyable flyingThing = eagle;

        // 밀은 풀이기 때문에 Grass로 나타낼 수 있다.
        Grass yellowGrass = yellowWheat;
        // 바오밥나무는 나무이기 때문에 Tree로 나타낼 수 있다.
        Tree bigTree = bigBaobab;

        // 이 시점에서 babyTiger와 runningThing이 가리키는 인스턴스는 같다.

        // 모두 생명이기 때문에 나이를 먹는다.
        babyTiger.age ++;
        fastEagle.age ++;
        yellowWheat.age ++;
        bigBaobab.age ++;

        // 그리고 언젠가 죽는다...
        bigTree.die();
    }
}
 ~~~


## 참고한 글

- [자바 인터페이스의 상속](https://m.blog.naver.com/PostView.nhn?blogId=highkrs&logNo=220228151201&proxyReferer=https%3A%2F%2Fwww.google.com%2F)

- [객체와 인스턴스](https://gmlwjd9405.github.io/2018/09/17/class-object-instance.html)
