---
title: "[C] 정수 다루기"
date: 2019-09-16 23:00:57 +0900
excerpt: "부호 있는 정수의 사칙연산에서 주의할 것들"
categories:
    - study
tags:
    - C
    - system-programming
    - integer
    - overflow
    - arithmetic
---

> 개념을 배우면서 쓰는 글이기 때문에 잘못된 이해에서 비롯된 틀린 서술이 존재할 여지가 다분합니다. 따라서 이 글은 학습 참고 용도로는 부적합합니다. 혹시나 이 비루한 글을 읽으시던 도중 잘못된 정보를 발견하셨다면 <potados99@gmail.com>로 연락 주신다면 정말로 감사하겠습니다 :)

 2학기 개강 후 시스템 프로그래밍 강의를 매주 듣고 있다.    
내용은 기초적이면서 매우 중요한 것들로, 모르면 프로그래밍에 큰 지장을 초래할 수 있다.
따라서 배운 내용을 잊어버리지 않기 위해 핵심 개념과 함께 예제를 글로 남겨보려고 한다.

## 보수 표기법

> **보수?**    
 보수는 보충해주는 수이다. 어느 숫자에 그 숫자에 해당하는 보수를 더한 결과는 일정하다. 이때 그 일정한 결과가 무엇인지는 그 보수가 어떤 수에 대한 보수인지에 의해 결정된다.    
 예를 들어 1에 대한 10의 보수는 9이다. 3에 대한 10의 보수는 7이다. 35에 대한 10의 보수는 65이다.

 2의 보수도 10의 보수와 마찬가지이다.    
어느 숫자에 그 숫자에 대한 2의 보수를 더하면 자연수 k에 대해 2^k의 값이 나오게 된다.
2진수로 나타내면 두 수를 더했을 때에 한 자리가 올라가는 것이다.

 10의 보수 표기법은 10진수에, 2의 보수 표기법은 2진수에 적용하는게 편하다.
진법과 보수를 맞추면 유용한 특징들을 얻을 수 있다.

 예를 들어 10진수, 10의 보수 표기법을 사용하여 빼기 연산을 하려고 할 때에 보수를 사용하면 덧셈만으로도 이를 수행할 수 있다.

 ~~~
 어떤 수 x의 자리수를 w라고 할 때,
 x에 대한 10의 보수를 구하는 함수 f(x)를 다음과 같이 정의할 수 있다.
 f(x) = 10^w - x

 아래 뺄셈은 보수함수를 이용해 나타낼 수 있다.
 74 - 26
 = (74 + f(26)) - 10^w
 = -f(74 + f(26))
 = 48
 ~~~

74에서 26을 빼는 간단한 연산이다.    
26을 보수 f(26)으로 치환하고 부호를 더하기로 바꾼 뒤, 그 결과에 다시 보수를 취해준 뒤 음수를 취하면 원하는 결과를 얻을 수 있다.

결과가 음수로 나오는 경우에는 마지막 결과 부호만 반전시키면 된다.

~~~
25 - 79
= 10^w - (25 + f(79))
= f(25 + f(79))
= - 54
~~~

이는 2진수 2의 보수 표기법에도 그대로 적용된다.

~~~
어떤 수 x의 자리수를 w라고 할 때,
x에 대한 2의 보수를 구하는 함수 f(x)를 다음과 같이 정의할 수 있다.
g(x) = 2^w - x

0011 - 0101
= g(0011 + g(0101))
= -0010
~~~

계산 과정을 잘 들여다보면, 먼저 -0101을 +1101로 바꾼다.    
그런 뒤 0011 + 1101을 수행하고(= 01110) 그 결과에 2의 보수를 취한다(= -0010).


## 2의 보수 표기법의 활용

 보수를 사용하여 뺄셈을 수행한 뒤 마지막에 다시 보수를 취하는 것은 자리수를 넘어간 MSB를 제거하기 위함이다. 그런데 컴퓨터 시스템에 정수 계산을 도입할 때에는 이를 고려하지 않아도 된다. 레지스터 크기를 넘어가는 비트는 자동으로 잘려 마치 보수 연산을 취한 것과 같게 되기 때문이다.

 위와 같은 특징 덕분에 컴퓨터 시스템에서는 어떤 숫자 x에 대한 음수 짝 -x를 x에 대한 2의 보수로 표기할 수 있다. 아래 표는 3비트 정수를 2의 보수 표기법으로 다루는 예시이다.

 | 비트 표현 | 컴퓨터가 생각하는 값 |
 |:-:|:-:|
 | 000 | 0 |
 | 001 | 1 |
 | 010 | 2 |  
 | 011 | 3 |
 | 100 | -4 |
 | 101 | -3 |
 | 110 | -2 |
 | 111 | -1 |

101과 011을 더하면 0이 된다.    
실제 연산에는 1000이 되는데 맨 앞 1은 버려지기 때문에 0이 된다.

2의 보수 표기법에서 표현할 수 있는 수의 범위는 비트 폭이 w일 때 -2^(w-1)부터 2^(w-1) - 1 까지이다.    
8비트에서는 -128 ~ 127, 16비트에서는 -32768 ~ 32767, 32비트에서는 -2147483648 ~ 2147483647이다.


## 부호 없는 정수 표기법

2의 보수 표기법은 음수를 표현하기 위한 방법이다. 만약 음수 표현을 포기한다면 더 많은 양의 정수를 표현할 수 있다. 부호 없는 정수 표현에서는 비트 표현이 그대로 그 값으로 해석된다.

| 비트 표현 | 컴퓨터가 생각하는 값(부호 없는 정수형) |
|:-:|:-:|
| 000 | 0 |
| 001 | 1 |
| 010 | 2 |  
| 011 | 3 |
| 100 | 4 |
| 101 | 5 |
| 110 | 6 |
| 111 | 7 |

이때 정수의 표현 범위는 비트 폭을 w라고 할 때, 0부터 2^w - 1까지이다.    
8비트에서는 0 ~ 255, 16비트에서는 0 ~ 65535, 32비트에서는 0 ~ 4294967295이다.


## 오버플로

 3비트 시스템에서 표현 가능한 가장 큰 양수는 3이다. 만약 3에 1을 더한다면 CPU의 adder는 011에 1을 더할 것이고 결과는 100이 되어 -4로 해석된다. 4를 기대했으나 의도에 어긋나는 동작인 것이다.

  이렇게 연산 결과가 최대 수 표현 범위를 넘어서는 경우를 [오버플로](https://en.wikipedia.org/wiki/Integer_overflow)라고 한다.

 이와 비슷하게 -1로 해석되는 111에서 1을 더하면 실제로는 1000이지만 carry는 버려져 000, 즉 0이 된다.


## C언어에서의 정수 연산

 이 글의 목적은 C언어를 포함하여 프로그래밍을 함에 있어 컴퓨터의 동작 원리를 잘 이해하고 의도에 정확히 부합하는 소스코드를 작성할 수 있도록 하는 것이다.     
 이제부터 C언어에서 정수 연산을 할 때에 빠지기 쉬운 함정에 대해 알아보고자 한다.

### 뒤섞인 부호

정수 연산을 수행할 때에 서로 다른 부호끼리 비교하거나 더할 수 있다. 이럴 때에 어떤 방향으로 암시적인 형변환이 일어나는지는 C언어 표준에 명시되어 있다.

C 표준에는 정수 연산에서의 rank를 정해놓는다.

> C Standard, subclause 6.3.1.1        
2. The rank of a signed integer type shall be greater than the rank of any signed integer type with less precision.     
-> 부호가 있는 정수에서 정확도가 더 높은 것이 rank가 높다.
3. The rank of long long int shall be greater than the rank of long int, which shall be greater than the rank of int, which shall be greater than the rank of short int, which shall be greater than the rank of signed char.    
-> rank는 long long int > long int > int > short int > signed char 순이다.
4. The rank of any unsigned integer type shall equal the rank of the corresponding signed integer type, if any.    
-> 부호 없는 정수의 rank는 이에 상응하는 부호 있는 정수의 rank가 같다.

또한 산술 연산시 conversion 규칙도 정해놓는다.

> 2. If both operands are of the same integer type (signed or unsigned), the operand with the type of lesser integer conversion rank is converted to the type of the operand with greater rank.     
-> 만약 부호가 같은데 정수 형이 다르다면 둘 중 높은 rank를 가진 type으로 변환된다.

> 3. If the operand that has unsigned integer type has rank greater than or equal to the rank of the type of the other operand, the operand with signed integer type is converted to the type of the operand with unsigned integer type.    
-> unsigned 정수형의 피연산자가 signed 정수형의 피연산자보다 rank가 높거나 같다면 unsigned로 변환된다.

> 4. If the type of the operand with signed integer type can represent all of the values of the type of the operand with unsigned integer type, the operand with unsigned integer type is converted to the type of the operand with signed integer type.    
-> 만약 singed 정수가 다른 unsigned 정수형인 피연산자의 값을 모두 표현할 수 있다면 그 피연산자는 signed type으로 변환된다.

> 5. Otherwise, both operands are converted to the unsigned integer type corresponding to the type of the operand with signed integer type.    
-> 이 외의 경우에는 unsigned로 변환된다.

요약하면, 같은 정수형이지만 부호가 다른 경우에는 unsigned 우선으로 변환되며, 그러한 상황임에도 부호형 정수가 비부호형 정수의 표현 가능 범위의 모든 수를 표현할 수 있다면 signed 형으로 변환된다.

~~~
-1 < 0      // eval 1
-1 < 0U     // eval 0. same int, same rank, converted to unsigned.
-1L < 0U    // eval 1. long type can represent all numbers unsigned int type can.
~~~

나타내는 값이 같더라도 type에 따라 다른 결과가 나타나니 주의해야 한다.

### 연산 후 오버플로

signed int에 2147483647(2^31 - 1)을 담은 뒤 1을 더한다면 오버플로가 발생하여 결과는 -2147483648이 된다.    
연산 전에 미리 해당 연산이 오버플로를 일으킬 것인지 알아야 프로그램을 의도한 대로 작동시킬 수 있다.    

더하고자 하는 두 숫자의 부호가 다른 경우에는 결과의 절댓값이 작아지므로 오버플로가 발생할 여지가 없다.
같은 부호 덧셈에서의 오버플로의 검출은 덧셈 전과 후의 MSB를 비교하는 것으로 가능하다.

만약 음수 중 가장 큰 값인 -1에서 1을 더한 경우 MSB는 1에서 0이 된다.    
양수 중 가장 큰 값인 2^31 - 1에서 1을 더한 경우 MSB는 0에서 1이 된다.

따라서 다음 함수를 통해 판단이 가능하다.

~~~c
bool tadd_ok(int x, int y) {
	return (MSB(x) != MSB(y) || MSB(x + y) == MSB(x));
}
~~~

 뺄셈의 경우는 y에 unary minus 연산을 취해 `tadd_ok`를 호출하는 방법으로 오버플로 검출이 가능하지만 한 가지 예외가 존재한다.    
 만약 y가 가장 작은 음수라면 여기에 음수를 취했을 때에 대응되는 양수로 변환되지 못하고 다시 가장 작은 음수가 된다.

 두 가지로 설명할 수 있다.

 1. 가장 작은 음수는 0b1000...0000으로 표현된다. 이 수와, 이 수에 2의 보수를 취한 결과가 같다.
 2. 부호 있는 정수 표현 범위는 -2^(w-1) ~ 2^(w-1) - 1인데, 가장 작은 수인 -2^(w-1)에서 부호를 반전시키면
2^(w-1)이 되고 이는 양수 최대 표현 범위를 1 벗어난 값으로, 오버플로가 발생해 다시 -2^(w-1)로 돌아가게 된다.


 따라서 `y`가 가장 작은 음수인 경우를 처리한 뺄셈 오버플로 감지 함수는 다음과 같다.

 ~~~c
 bool tsub_ok(int x, int y) {
	return (y != (1 << 31) && tadd_ok(x, -y));
}
 ~~~

## 참고

- [2의 보수](https://ko.wikipedia.org/wiki/2의_보수)
- [오버플로](https://ko.wikipedia.org/wiki/오버플로)
- [INT02-C. Understand integer conversion rules](https://wiki.sei.cmu.edu/confluence/display/c/INT02-C.%2BUnderstand%2Binteger%2Bconversion%2Brules)
