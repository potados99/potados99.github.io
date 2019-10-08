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

## 시작하며

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

 먼저 잘 짜여진 파이썬 프로그램을 참고해서 best practice를 알아본다.

 GitHub에 algorithm-python 키워드를 넣어 검색하다 [훌륭한 프로젝트](https://github.com/TheAlgorithms/Python)를 발견했다. 모든 알고리즘을 다 Python으로 구현했다고 하는데, 상당히 양이 방대하다. 그중 정렬 알고리즘에 속하는 `insertion_sort.py`를 살펴보았다.

~~~python
"""
This is a pure python implementation of the insertion sort algorithm
For doctests run following command:
python -m doctest -v insertion_sort.py
or
python3 -m doctest -v insertion_sort.py
For manual testing run:
python insertion_sort.py
"""


def insertion_sort(collection):
    """Pure implementation of the insertion sort algorithm in Python
    :param collection: some mutable ordered collection with heterogeneous
    comparable items inside
    :return: the same collection ordered by ascending
    Examples:
    >>> insertion_sort([0, 5, 3, 2, 2])
    [0, 2, 2, 3, 5]
    >>> insertion_sort([])
    []
    >>> insertion_sort([-2, -5, -45])
    [-45, -5, -2]
    """

    for loop_index in range(1, len(collection)):
        insertion_index = loop_index
        while (
            insertion_index > 0
            and collection[insertion_index - 1] > collection[insertion_index]
        ):
            collection[insertion_index], collection[insertion_index - 1] = (
                collection[insertion_index - 1],
                collection[insertion_index],
            )
            insertion_index -= 1

    return collection


if __name__ == "__main__":
    user_input = input("Enter numbers separated by a comma:\n").strip()
    unsorted = [int(item) for item in user_input.split(",")]
    print(insertion_sort(unsorted))
~~~

 주석문 속에 인터프리터 입출력 같은 것을 써놓고는 `python3 -m doctest -v insertion_sort.py` 명령어로 테스트가 가능하다고 한다. `-v`는 모든 메시지를 출력하라는 뜻이고 `-m [module]`은 특정 모듈을 사용하라는 뜻이다. 여기서 `doctest`라는 모듈이 등장한다.


### doctest

[Python 공식 한글 문서 중 대화형 예제 테스트 페이지](https://docs.python.org/ko/3.8/library/doctest.html)에서는 doctest를 다음과 같이 안내한다.

> doctest 모듈은 대화형 파이썬 세션처럼 보이는 텍스트를 검색한 다음, 해당 세션을 실행하여 표시된 대로 정확하게 작동하는지 검증합니다. doctest를 사용하는 몇 가지 일반적인 방법이 있습니다:    
- 모든 대화식 예제가 설명된 대로 작동하는지 확인하여 모듈의 독스트링이 최신인지 확인합니다.
- 테스트 파일이나 테스트 객체의 대화형 예제가 예상대로 작동하는지 확인하여 회귀 테스트를 수행합니다.
- 입/출력 예제를 그대로 보여줌으로써 패키지에 대한 자습서를 작성합니다. 예제나 설명문 중 어느 것이 강조되는지에 따라, "문학적 테스트(literate testing)"나 "실행 가능한 설명서(executable documentation)"의 느낌을 줍니다.

 doctest는 소스코드 내에서 Python 인터프리터 세션처럼 보이는 텍스트를 검색해서 실제로 그렇게 작동하는지 테스트해주는 모듈이다. 다시 말해서 모듈이나 함수 테스트를 주석 몇 줄만으로 간단하게 끝낼 수가 있다는거다.

 ![wow](/assets/images/gotta_buy_it.jpg)

> 이건 써야 한다. 테스트를 이렇게 간편하게 해주다니...


### doctest 응용

작은 예시를 작성해보았다.

~~~python
# add.py
def add(a, b):
    ''' return sum of a and b.
    >>> add(3, 5)
    8
    >>> add(4, -2)
    2
    '''

    return a + b
~~~

~~~
$ python3 -m doctest -v add.py
Trying:
    add(3, 5)
Expecting:
    8
ok
Trying:
    add(4, -2)
Expecting:
    2
ok
1 items had no tests:
    add
1 items passed all tests:
   2 tests in add.add
2 tests in 2 items.
2 passed and 0 failed.
Test passed.
~~~


### 기존 코드에 적용하기




## Reference

- []()
