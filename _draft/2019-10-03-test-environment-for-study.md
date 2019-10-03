---
title: "[Python] 알고리즘 구현체를 위한 테스트 환경 만들기"
excerpt: "yeah"
date: 2019-10-03 14:44:01 +0900
categories:
    - study
tags:
    - python
    - test
    - algorithm
---

> 아주 간단한 프로젝트 리팩토링을 다룬 글입니다. 이토록 간단한데도 불구하고 이 글을 쓴 것은 이것을 생각하느라 보낸 시간이 아까워 기록을 남겨두고 싶기 때문입니다.


## 도입

 알고리즘 강의를 들으면서 매주 실습을 하고 있다. 한 주에 알고리즘을 3~4개씩 배운다. 그 주에 집에 가서 이를 직접 구현해보곤 하는데, 문제는 함수가 늘어날수록 프로그램이 점점 난장판이 되는 것이다.

 `Algorithm` 디렉토리를 보면 실습 과제를 위해 제출용으로 작성한 함수, 알고리즘 성능 비교를 위해 작성한 함수, 다른 알고리즘에서 사용하기 위해 작성한 함수가 다 따로 존재한다.

> 언어는 Python3.7을 사용하는데, 다름이 아니라 너무 편해서다. C는 잠시 안녕 ㅎㅎ

~~~
Algorithm
├── README.md
├── documents
│   ├── algorithm-practice-02.pdf
│   └── algorithm-practice-03.pdf
├── practices
│   └── 190924
│       ├── algorithm.py
│       └── main.py
├── search
│   ├── binary-search
│   │   └── main.py
│   └── sieve
│       └── main.py
└── sort
    ├── QuickSort.py
    ├── dump.py
    ├── main.py
    ├── sort.py
    ├── test.py
    └── util.py
~~~

이렇게 생겼다. 마음에 안든다. `sort` 내부를 보면 이름을 보면 무슨 파일인지도 모르겠고 이름이 *Pythonic* 하지도 않다. 사실 시간에 쫓겨 저렇게 만들었다. 물론 핑계다.


## 뜯어고치기

 먼저 잘 짜여진 파이썬 프로그램을 몇 개 참고해서 best practice를 알아본다.


## Reference

- []()
