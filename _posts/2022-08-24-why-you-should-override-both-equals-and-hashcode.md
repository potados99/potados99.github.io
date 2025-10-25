---
published: true
summary: 에 대한 짧은 이야기
date: '2022-08-24 22:51:00 +0900'
category: dev
title: equals와 hashCode를 둘 다 신경써야 하는 이유
---
## 들어가며

Java 또는 Kotlin으로 개발하다 보면 equals와 hashCode 메소드를 오버라이드하라는 압박(?)을 받을 때가 종종 있습니다. equals까지는 이해가 됩니다. 주어진 인스턴스와 자신이 같은지 판단하는 기준은 개발자가 정해주어야 하니까요. 그런데 hashcCode는 왜?

## 동일성

두 객체의 동일성은 equals 메소드가 판단합니다. 만약 a와 b가 같은지 판단하려면 a.equals(b) 또는 b.equals(a)를 호출해보면 됩니다. [기본적으로 equals는 두 레퍼런스가 같은 인스턴스를 가리키는지 여부를 확인](https://stackoverflow.com/a/4179011)합니다.

클래스마다 동일성 판단의 기준을 달리 두고 싶을 수 있습니다. 예를 들어 값 객체(Value Object)는 필드 또는 속성의 값으로 동일성을 판단하지만, [엔티티는 식별자로 동일성을 판단](Entity vs Value Object: the ultimate list of differences · Enterprise Craftsmanship)합니다. 이럴 때에 equals 메소드를 오버라이드하면 됩니다. 

## hashCode가 필요할 때

hashCode는 객체의 동일성과 직접적인 관련이 있지는 않습니다. 그렇지만 equals와 함께 오버라이드하라고 여기저기서 반강제로(?) 떠밀곤 합니다. 그 이유는 두 객체가 같으면 해시값도 같아야 하고, 두 객체가 다르면 해시값도 달라야 탈이 없기 때문입니다.

애플리케이션을 작성하다 보면 의식하지 못한 사이에도 객체의 해시 값이 필요할 때가 있습니다. HashMap과 같은 해시 기반 자료구조를 사용하는 경우입니다. HashMap은 key로 객체의 해시값을 사용합니다. HashMap은 해시값을 구하기 위해 객체의 hashCode 메소드를 사용합니다. 만약 hashCode의 결과가 같은 두 인스턴스가 있다면, HashMap은 두 인스턴스를 같은 key로 취급합니다.

해시 기반 자료구조를 사용하지 않는다면 hashCode를 오버라이드할 필요가 없습니다. 그렇지만 그냥 놔 둔다면 잠재적인 폭탄을 만드는 것입니다. 이런 상황이 생길 수가 있습니다.

- a.equals(b)는 false이다. 즉, 두 객체는 다르다.
- 그런데 a.hashCode()와 b.hashCode()는 둘 다 999로 동일하다.
- HashMap에 a를 key로, "hi"를 value로 넣는다.
- HashMap에 b를 key로, "bye"를 value로 넣는다.
- HashMap에서 a를 key로 조회해보니 "bye"가 나온다.
- 
두 객체는 equals로 보면 다르지만 hashCode로 보면 똑같습니다. 이런 불일치를 막기 위해 equals와 hashCode가 일관되게 작동하도록 신경써야 합니다.
