---
title: "[Python] 알고리즘 구현체를 위한 테스트 환경 만들기"
excerpt: "doctest 활용하기"
date: 2019-10-09 16:31:00 +0900
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

 ![wow](https://i.imgur.com/ee9uHgZ.jpg)

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

 `sort.py`에 박혀있던 함수들을 모두 밖으로 끄집어내어 모듈화시키고, 각 함수에 docstring과 doctest를 추가해주었다.

 다음은 doctest를 적용한 insertion_sort.py이다.

~~~python
def insertion_sort(collection, verbose=False):
    """Implementation of insertion sort in Python.

    Args:
        collection (list): Input to sort.
        verbose (bool): Print every rotation if true.

    Returns:
        list: The same as the collection, with sort ascending applied.

    Example:
        >>> insertion_sort([3, 1, 7, 0, 4, 8, 2])
        [0, 1, 2, 3, 4, 7, 8]

        >>> insertion_sort([-91, -123, -1])
        [-123, -91, -1]
    """

    for i in range(1, len(collection)):
        if verbose: print("Rotation " + str(i))

        n = collection[i]

        # j from i - 1 to 0.
        for j in range(i - 1, -2, -1):
            if collection[j] <= n: break

            collection[j + 1] = collection[j]
            if verbose: print(collection)

        collection[j + 1] = n

        if verbose: print(collection)

    return collection


if __name__ == "__main__":
    from common import invoker
    invoker.from_input(insertion_sort)
~~~

 주석 스타일은 [구글의 Python docstring 스타일](https://sphinxcontrib-napoleon.readthedocs.io/en/latest/example_google.html)을 따랐다.

 각 정렬 함수는 verbose를 두 번째 인자로 받아 각 rotation마다 정렬 진행 과정을 볼 수 있게 했다. 만약 모듈을 직접 실행하면 `invoker` 모듈의 `from_input`함수가 실행되는데, 내용은 다음과 같다.

 ~~~python
 import argparse

 def from_input(verbosable_sort_function):
     parser = argparse.ArgumentParser()
     parser.add_argument("--verbose", help="print every rotation", action="store_true")
     parsed = parser.parse_args()

     user_input = input("Enter numbers separated by a comma: ").strip()
     unsorted = [int(item) for item in user_input.split(",")]
     print(verbosable_sort_function(unsorted, parsed.verbose))
 ~~~

 사용자로부터 입력받은 데이터로 정렬을 수행하여 결과를 출력한다. 이때 `--verbose`를 함께 넘기면 정렬 과정이 모두 출력된다.

 삽입정렬을 하는 `insertion_sort.py`의 예시를 보자. 그냥 실행하면 이렇게 입력 과정이 있고 결과만 출력된다.

 ~~~
 $ python3 insertion_sort.py
 Enter numbers separated by a comma: 3, 2, 1
 [1, 2, 3]
 ~~~

 `--verbose` 옵션을 넘기면 중간 과정이 모두 보인다.

 ~~~
 $ python3 insertion_sort.py --verbose
 Enter numbers separated by a comma: 3, 2, 1
 Rotation 1
 [3, 3, 1]
 [2, 3, 1]
 Rotation 2
 [2, 3, 3]
 [2, 2, 3]
 [3, 2, 3]
 [1, 2, 3]
 [1, 2, 3]
 ~~~

 2번째 회전에서 3이 0 인덱스로 가는건 중간에 -1 인덱스에 접근했기 때문에 그렇다. -1 인덱스는 컬렉션의 맨 끝을 가리킨다. 따라서 가장 마지막 원소인 3이 잠시 0 인덱스에 머무르게 된다.

 doctest 결과는 다음과 같다.

 ~~~
 $ python3 -m doctest insertion_sort.py -v
 Trying:
     insertion_sort([3, 1, 7, 0, 4, 8, 2])
 Expecting:
     [0, 1, 2, 3, 4, 7, 8]
 ok
 Trying:
    insertion_sort([-91, -123, -1])
 Expecting:
     [-123, -91, -1]
 ok
 1 items had no tests:
     insertion_sort
 1 items passed all tests:
    2 tests in insertion_sort.insertion_sort
 2 tests in 2 items.
 2 passed and 0 failed.
 Test passed.
 ~~~

잘 돌아간다. `1 items had no tests`라고 뜨는건 모듈 테스트가 없어서 그런 것이다. 여기에서는 무시해도 된다.

### 후기

 정렬 알고리즘을 하나 추가할 때마다 복사-붙여넣기를 반복해야 했다. 강의 때 새로 배운 것을 빠르게 구현하고 정리하기에는 번거롭다는 단점이 있다. 템플릿을 만들어서 필요할 때에 이름만 바꾸어 복사해주는 스크립트를 하나 작성해야 할 것 같다.


## Reference

- [Python 공식 웹사이트](https://www.python.org)
- [doctest 참고 1](https://www.google.com/url?sa=t&rct=j&q=&esrc=s&source=web&cd=1&ved=2ahUKEwjH8Luh047lAhWnyIsBHRxcC5oQFjAAegQIABAB&url=https%3A%2F%2Fdocs.python.org%2Fko%2F3.8%2Flibrary%2Fdoctest.html&usg=AOvVaw3S0gpZBoM960DhrIXM28OB)
- [doctest 참고 2](https://m.blog.naver.com/PostView.nhn?blogId=dudwo567890&logNo=130166401598&proxyReferer=https%3A%2F%2Fwww.google.com%2F)
- [PEP 257](https://www.python.org/dev/peps/pep-0257/)
