---
title: "[Python] 파이썬 코드 스타일"
summary: "효율적이고 읽기 편한 코드 스타일"
date: 2018-3-23 15:14:40 +0900
categories:
    - guide
tags:
    - Python
    - PEP8
    - style
---

파이썬 코드는 읽기 쉽다. 대체로 코드가 간결하며, 엄격한 들여쓰기로 코드 블럭을 구분하기 쉽다.  
이는 파이썬이 가독성을 염두에 두고 설계되었기 때문이다.

또한 파이썬이 읽기 쉬운 또 다른 이유는 "파이썬스러운" 이디엄(idiom)이다.  
파이썬 가이드라인이 제안하는 가장 좋은 방법(가독성이 가장 좋은)을 따를 때 이를 "파이썬스럽다"고 표현한다.

## 일반적 개념

### 간단하고 명쾌하게
파이썬을 이용해서 복잡하고 긴 코드를 짤 수 있다. 하지만 같은 일을 하는 코드라면 짧고 간결하게 짜는 것이 낫다.

**나쁜 예**
{% highlight python %}
def make_complex(*args):
    x, y = args
    return dict(**locals())
{% endhighlight %}

**좋은 예**
{% highlight python %}
def make_complex(x, y):
    return {'x': x, 'y': y}
{% endhighlight %}

###### <The Hichhiker's Guide to Python>에서 인용  

좋은 예시 코드에서는 단 두 줄만 읽고 함수가 어떤 일을 할 수 있는 지 알 수 있지만 나쁜 예시 코드에서는 그렇지 않다.  

### 한 줄에는 한 구문만

한 줄의 코드로 여러 명령을 수행할 수 있지만 이는 가독성을 해친다.  

**나쁜 예**
{% highlight python %}
if a == 0: a = 1
print a; print b;
{% endhighlight %}

**좋은 예**
{% highlight python %}
if a == 0:
	a = 0

print a
print b
{% endhighlight %}

## 이디엄

이디엄(idiom)이란 코드를 작성하는 방법이다.  
자연스럽고 간결한 파이썬 코드를 *파이썬스럽*다고 한다.

대부분의 경우에는 이를 위한 유일하고 명백한 방법이 있다.

다음은 몇 가지 일반적인 파이썬 이디엄들이다.

### 언패킹

리스트나 튜플을 쪼개어 각각의 원소에 이름을 붙여줄 수 있다.  

예를 들어, 내장함수 `enumerate()`는 리스트의 각각의 원소를 (index, element)로 쪼개서 튜플을 만들어 반환한다.
{% highlight python %}
for index, element in enumerate(list):
	# do something
{% endhighlight %}

리스트의 원소들을 각각의 변수에 할당할 수 있다.
{% highlight python %}
a, b, c, d = [1, 2, 3, 4]

>>> a
1
>>> b
2
{% endhighlight %}

물론 튜플도 된다.
{% highlight python %}
a, b, c, d = (1, 2, 3, 4)

>>> a
1
>>> b
2
{% endhighlight %}

변수를 서로 맞바꿀 수도 있다.
{% highlight python %}
a, b = b, a
{% endhighlight %}

중첩 언패킹도 된다.
{% highlight python %}
1, (2, 3) = a, (b, c)
{% endhighlight %}

### 사용하지 않을 변수 만들기

언패킹을 할 때, 튜플이나 리스트의 원소들에 대응되는 변수가 필요하다.  
그런데 굳이 그 변수를 사용하지 않을 것이라면 `__`(언더스코어 두개)를 사용하면 된다.
{% highlight python %}
first, __, third = [*first element*, *second element*, *third element*]
{% endhighlight %}

*second element*는 어딘가에 할당되기는 하지만 그 변수가 사용되지는 않는다.

파이썬3에서는 언패킹을 하는 새로운 방법이 추가되었다.

{% highlight python %}
a, *rest = [1, 2, 3]

>>> a
1
>>> rest
[2, 3]
{% endhighlight %}

{% highlight python %}
a, *middle, c = [1, 2, 3, 4]

>>> a
1
>>> middle
[2, 3]
>>> c
4
{% endhighlight %}

### 동일한 원소 N개 리스트 만들기

리스트에 `*` 연산자를 사용하면 된다.
{% highlight python %}
list = [None] * 4
{% endhighlight %}

### 리스트로 문자열 만들기

굳이 반복문을 사용할 필요 없다.
{% highlight python %}
letters = ['h', 'e', 'l', 'l', 'o', ',', ' ', 'w', 'o' ,'r' ,'l' ,'d', '!']
string = ''.join(letters)

>>> string
"hello, world!"
{% endhighlight %}

### 컬렉션 안에서 아이템 찾기

{% highlight python %}
list = ['f', 'i', 'n', 'd', 'm', 'e']

is_there = 'i' in list

>>> is_there
True
{% endhighlight %}

*element* in *collection*으로 검색하는 것은 모두 같지만 다음과 같은 경우에는  
해시테이블을 이용하는 셋(set)이나 딕셔너리(dictionary)가  리스트보다 검색 속도가 훨씬 빠르다.

- 컬렉션의 크기가 클 때
- 컬렉션을 반복적으로 검색할 때
- 컬렉션 안에 중복이 없을 때


## 파이썬 디자인 기본 원칙

PEP20으로도 알려진 파이썬 디자인의 기본 원칙이다.

{% highlight python %}
import this
#=> try it
{% endhighlight %}
