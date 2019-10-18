---
title: "[Python] Python 3의 상대경로 패키지 import 제한 피해가기"
excerpt: "여러 실행 환경에 대응하기"
date: 2019-10-18 23:40:08 +0900
categories:
    - dev
tags:
    - python3
    - import
    - module
    - script
---

> 이 글에서 잘 썼다 싶은 부분은 stack overflow의 [어느 답변](https://stackoverflow.com/questions/4209641/absolute-vs-explicit-relative-import-of-python-module)과 [python 공식 문서](https://www.python.org/dev/)에서 발췌한 것이며, 그렇지 않은 부분은 직접 작성한 것입니다.

## 서론

 프로그램을 짜다 보면 feature와 무관한 것들을 하나로 묶어 common이나 util로 정리하고 싶은 충동을 자주 느끼게 된다. python을 포함하여 쓸만한 프로그래밍 언어는 다른 프로그램 조각 또는 바이너리를 사용할 수 있게 설계되어 있다.

 Python은 특이하다. 인터프리터 언어이기 때문에 사용자와 상호작용하는 스크립트처럼 사용할 수 있을 뿐만 아니라, 패키지 형태를 띠도록 설계하여 부분 모듈을 컴파일하여 실행하는 식으로 조금 정적으로 사용할 수도 있다.

 프로젝트 구조가 복잡해지면 이 특징이 굉장히 혼란스럽게 다가올 수 있다.


## 간단한 프로젝트에서

 프로젝트 디렉토리 구조가 다음처럼 생겼다고 하자.

 ~~~
 pyproject
 ├── util.pyc
 └── runner.py
 ~~~

 각 파일은 이렇게 생겼다.

 ~~~python
 # util.py

 def add(a, b):
     return a + b
 ~~~

 ~~~ python
 # runner.py

 import util

 print(util.add(1, 2))
 ~~~

 실행하면 3이 출력될 것이다.
 ~~~
 $ python3 runner.py
 3
 ~~~

 이대로라면 문제가 없다.


## 조금 복잡한 프로젝트에서

 Python에서는 하나의 `.py` 파일이 모듈로 취급된다. 이러한 모듈이 모여서 패키지를 이룬다.

 패키지의 구조는 파일 시스템의 디렉토리와 대응되는데, 이때 디렉토리 아래에 `__init__.py`라는 파일이 있어야 python 패키지로 인식된다.

 아래는 python 패키지의 예시이다.

 ~~~
 arithmetic
 ├── __init__.py
 ├── decimal.py
 ├── integer.py
 └── util.py
 ~~~

 `decimal.py`와 `integer.py`는 각각 `util.py`를 import하여 사용한다.

 이 `arithmetic` 패키지를 사용하는 프로젝트를 만든다고 가정해보자.

 ~~~
myproject
├── arithmetic
│   ├── __init__.py
│   ├── decimal.py
│   ├── integer.py
│   └── util.py
└── runner.py
 ~~~

 `runner.py`는 이렇게 생겼다.

 ~~~python
 # runner.py

 from arithmetic import decimal

 print("3 / 2 is " + str(decimal.div(3, 2)))
 ~~~

 `arithmetic` 패키지 내의 모듈들은 이렇게 생겼다.

 ~~~python
 # decimal.py

 import util

 def div(a, b):
     """
     >>> div(3, 2)
	 1.5
	 """

	 result = a / b
	 util.log("dividing...")

	 return result
 ~~~

 ~~~python
 # integer.py

 import util

 def div(a, b):
 	"""
 	>>> div(3, 2)
 	1
 	"""

 	result = a // b
 	util.log("dividing...")

 	return result
 ~~~

 ~~~python
 # util.py

 def log(message):
	pass
 ~~~

 각 모듈에는 `doctest`를 위해 test docstring을 달아놓았다.

 실행해보자.

 ~~~
 $ python runner.py
 3 / 2 is 1
 ~~~

 잘 실행된다.

 python3으로도 실행해보자.

 ~~~
 $ python3 runner.py
 Traceback (most recent call last):
  File "runner.py", line 1, in <module>
    from arithmetic import decimal
  File "/Users/potados/Temp/pyimport/arithmetic/decimal.py", line 1, in <module>
    import util
ModuleNotFoundError: No module named 'util'
 ~~~

 ![bullshit](/assets/images/bullshit.gif)
> 개소리 집어치워

 에러가 뜬다.

 찾아보니 [PEP8]( https://www.python.org/dev/peps/pep-0008/)에 이런게 있더라.

> Explicit relative imports are an acceptable alternative to absolute imports.    
Implicit relative imports should never be used and have been removed in Python3.    

 Python 3에서는 암묵적인 상대경로 import가 안된다는 것이다.

 Python 2는 주어진 import 경로가 상대경로일 것이라고 암묵적으로 해석하고 같은 디렉토리에서 이를 찾는다.

 반면에 python 3는 import 경로가 `.`으로 시작하지 않았기 때문에 절대경로라고 생각하고 엉뚱한 곳에서 찾은 것이다.

 그렇다면 상대경로를 넣어주면 되지 않을까.

 ~~~python
 # decimal.py

 from . import util
 ~~~

 ~~~
 $ python3 runner.py
 3 / 2 is 1.5
 ~~~

 잘 된다.

 그런데 어쩌다 `decimal.py`의 구현을 바꿀 일이 생겨 `doctest`를 진행해야 하는 상황이 왔다.

 ~~~
 $ python3 -m doctest decimal.py   
 Traceback (most recent call last):
   File "/Library/Frameworks/Python.framework/Versions/3.7/lib/python3.7/runpy.py", line 193, in _run_module_as_main
    "__main__", mod_spec)
   File "/Library/Frameworks/Python.framework/Versions/3.7/lib/python3.7/runpy.py", line 85, in _run_code
    exec(code, run_globals)
   File "/Library/Frameworks/Python.framework/Versions/3.7/lib/python3.7/doctest.py", line 2786, in <module>
    sys.exit(_test())
   File "/Library/Frameworks/Python.framework/Versions/3.7/lib/python3.7/doctest.py", line 2774, in _test
    m = __import__(filename[:-3])
   File "/Users/potados/Temp/pyimport/arithmetic/decimal.py", line 1, in <module>
    from . import util
 ImportError: attempted relative import with no known parent package
 ~~~

 요약하자면 *부모 패키지도 모르는데(=스크립트로 직접 실행하는데) 감히 상대경로 import를 시도했다* 라는 뜻이다.

 [PEP 338](https://www.python.org/dev/peps/pep-0338/)과 [PEP 366](https://www.python.org/dev/peps/pep-0366/)에 의하면 상대경로 import를 하려면 해당 python 파일을 모듈로써 import해야 한다고 한다.

 즉, **relative import를 포함한 python 모듈은 스크립트로 직접 실행할 수 없다.**

 Python의 창시자, Guido가 이렇게 말했다.
 > The only use case seems to be running scripts that happen to be living inside a module's directory, which I've always seen as an antipattern. To make me change my mind you'd have to convince me that it isn't.

 패키지 안에 있는 모듈을 스크립트로 실행하는 것은 안티패턴이라고 한다.

## 둘다 포기 못해

 정리하면 다음과 같다.

 - 상대경로 import를 포함한 python 모듈은 단독 실행이 불가능하다.
 - 절대경로 import를 포함한 python 모듈은 패키지 내에서 import가 어렵다.


 패키지 안에 들어있는 모듈을 단독으로 실행하는 것이 python 철학에는 맞지 않는 모양인 것 같은데, 모듈만 실행하고 싶을 때가 종종 있다. 당장 위처럼 `doctest`를 모듈 단위로 돌리고 싶을 때가 있다.

 방법이 있다.

 Python에는 `__name__`이라는 특별한 변수가 있다. 이는 최상위 스코프의 이름을 나타내는데, 현재 모듈의 실행 상태를 판단하는 데에 사용할 수 있다.

 예를 들어서, 스크립트로 직접 실행할 때에만 어떤 작업을 수행하고 싶다면 이렇게 하면 된다.

 ~~~python
 def blahblah():
     ...

 if __name__ == "__main__":
     # Do something only when directly executed as a script.
 ~~~

 직접 실행할 때에는 `__name__`이 `__main__`이 된다. 다른 경우에는 어떨까.

 잠시 `decimal.py`의 코드를 수정해보자.

 ~~~python
 # from . import util

 print(__name__)

 def div(a, b):
 	"""
 	>>> div(3, 2)
 	1.5
 	"""

 	result = a / b
    # util.log("dividing...")

 	return result
 ~~~

 해당 모듈이 실행되거나 import되는 즉시 `__name__`이 출력될 것이다.

 결과는 다음과 같다.


 | 실행 방법 | 명령 | `__name__` 값 |
 |:-:|:-:|:-:|
 | 직접 실행 | `python3 arithmetic/decimal.py` | `__main__` |
 | doctest로 실행 | `python3 -m doctest arithmetic/decimal.py` | `decimal` |
 | 패키지 내부에서 import | `python3 runner.py` | `arithmetic.decimal` |

 이 중 직접 실행하는 경우와 doctest로 실행하는 경우에는 절대경로 import를, 그렇지 않은 경우(=패키지 내부 import)의 경우에는 상대경로 import를 해주면 된다.

 ~~~python
 if __name__ == "__main__" or __name__ == "decimal":
 	import util
 else:
 	from . import util
 ~~~


## Reference

- https://stackoverflow.com/questions/16981921/relative-imports-in-python-3
