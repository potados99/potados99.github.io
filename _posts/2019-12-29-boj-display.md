---
title: "[BOJ] 백준 16159번 전광판"
excerpt: "다음 순열 구하기"
date: 2019-12-29 21:19:51 +0900
category: ps
tags:
   - ps
   - boj
   - display
   - python
---

## 들어가며

[문제 링크](https://www.acmicpc.net/problem/16159)

문제 설명은 빠르게 이해된다. 간단하다.

주어진 숫자들로 만들 수 있는 순열들 중에서 주어진 순열 바로 다음 순열을 가져오면 된다.

예를 들어 이런 거다.

`2, 1, 4`가 주어지면 `2, 4, 1`,

`1, 2, 3`이 주어지면 `1, 3, 2`

`5, 2, 4, 6, 3`이 주어지면 `5, 2, 6, 3, 4`

풀어보자.

## 접근

입출력 부분과 처리 부분으로 나누어서 접근한다.

### 입출력

귀찮게도 입출력을 그냥 숫자가 아니라 전광판 픽셀 matrix로 준다.

`1, 4, 2`는 아래처럼 나온다.

~~~
000000000000000000
000100000100011110
001100001100000010
000100010100011110
000100111110010000
000100000100011110
000000000000000000
~~~

우리에게 필요한 것은 저런 전광판 표현과 숫자로 된 리스트를 자유롭게 오갈 수 있게 해주는 모듈이다.

저 끔찍한 0101을 Python 리스트 객체로 바꿔주거나, 리스트를 다시 저 끔찍한 0101로 바꿔주는 역할을 한다.

~~~
000000000000000000
000100000100011110
001100001100000010      -- parse -->
000100010100011110                      [1, 4, 2]
000100111110010000      <-- print --
000100000100011110
000000000000000000
~~~

이름은 `Display`로 하자. 전광판을 나타내는 적절한 단어가 저것밖에 생각이 안난다(ㅋㅋㅋ).

~~~python
class Display:
    char_width = 6
    char_height = 7
    ...
    def parse(self, row_strings: list):
        ...

    def print(self, nums: list):
        ...
~~~

이렇게 생겼다.

### 처리

다음 순열 구하는 함수도 하나 만들자.

~~~python
def next_permutation(sequence):
    ...
~~~

### 메인 루틴

그럼 이제 이렇게 쓰면 된다.

~~~python
if __name__ == "__main__":
    # 입출력용 전광판 인스턴스를 만든다.
    display = Display()

    # 입력은 7줄
    lines = [input() for _ in range(Display.char_height)]

    # 입력을 해석해서 숫자 리스트를 얻는다.
    parsed = display.parse(lines)

    # 얻은 숫자 리스트의 다음 순열을 구한다.
    next = next_permutation(parsed)

    if next is None:
        # 다음 순열이 없으면 "The End" 출력
        print("The End")
    else:
        # 있으면 전광판으로 출력
        display.print(next)
~~~

## 구현

이제 만들어보자.

### Display

전광판 폰트는 이렇게 생겼다.

![display](/assets/images/yLX3OKP.png)

그렇다. 노가다를 해야 한다.

숫자당 `6*7=42`비트, 10개의 숫자, `420`개 비트를 코드에 박아놓아야 한다.

~~~python
class Display:
    ...
    font = [
        ...여기에 노가다의 산물 투입...
    ]
    ...
~~~

일단 작성을 할 때에는 각 픽셀을 0 또는 1로 구분하여 이진 상수로 쓴다.

~~~python
font = [
    0b000000_001100_010010_010010_010010_001100_000000, # 0
    0b000000_000100_001100_000100_000100_000100_000000, # 1
    ...
]
~~~

다 작성했으면 이제 이걸 Python 인터프리터에 넣고 돌려서 아래와 같은 리스트를 얻어낸다.

~~~python
font = [
    0x312492300, 0x10c104100, 0x782790780, 0x702102700, 0x10c53e100,
    0x79070248c, 0x410792780, 0x782104100, 0x792792780, 0x1e492782082
]
~~~

그리고 아래 함수를 써서 저 비트들로부터 0101로 이루어진 전광판 각 숫자의 리스트를 얻어낸다.

~~~python
def bit_matrix(num: int):
     if not (0 <= num <= 9):
         return None

     on_bits = font[num]
     rows = []
     for i in range(7):
         row = []
         for j in range(6):
             row.insert(0, on_bits & 1)
             on_bits >>= 1

          rows.insert(0, row)

      return rows
~~~

저것 또한 Python 인터프리터에 넣고 돌리면 아래와 같은 리스트가 나온다.

~~~python
bitmaps = [
    [[0, 0, 0, 0, 0, 0], [0, 0, 1, 1, 0, 0], [0, 1, 0, 0, 1, 0], [0, 1, 0, 0, 1, 0], [0, 1, 0, 0, 1, 0], [0, 0, 1, 1, 0, 0], [0, 0, 0, 0, 0, 0]],
    [[0, 0, 0, 0, 0, 0], [0, 0, 0, 1, 0, 0], [0, 0, 1, 1, 0, 0], [0, 0, 0, 1, 0, 0], [0, 0, 0, 1, 0, 0], [0, 0, 0, 1, 0, 0], [0, 0, 0, 0, 0, 0]],
    [[0, 0, 0, 0, 0, 0], [0, 1, 1, 1, 1, 0], [0, 0, 0, 0, 1, 0], [0, 1, 1, 1, 1, 0], [0, 1, 0, 0, 0, 0], [0, 1, 1, 1, 1, 0], [0, 0, 0, 0, 0, 0]],
    [[0, 0, 0, 0, 0, 0], [0, 1, 1, 1, 0, 0], [0, 0, 0, 0, 1, 0], [0, 0, 0, 1, 0, 0], [0, 0, 0, 0, 1, 0], [0, 1, 1, 1, 0, 0], [0, 0, 0, 0, 0, 0]],
    [[0, 0, 0, 0, 0, 0], [0, 0, 0, 1, 0, 0], [0, 0, 1, 1, 0, 0], [0, 1, 0, 1, 0, 0], [1, 1, 1, 1, 1, 0], [0, 0, 0, 1, 0, 0], [0, 0, 0, 0, 0, 0]],
    [[0, 0, 0, 0, 0, 0], [0, 1, 1, 1, 1, 0], [0, 1, 0, 0, 0, 0], [0, 1, 1, 1, 0, 0], [0, 0, 0, 0, 1, 0], [0, 1, 0, 0, 1, 0], [0, 0, 1, 1, 0, 0]],
    [[0, 0, 0, 0, 0, 0], [0, 1, 0, 0, 0, 0], [0, 1, 0, 0, 0, 0], [0, 1, 1, 1, 1, 0], [0, 1, 0, 0, 1, 0], [0, 1, 1, 1, 1, 0], [0, 0, 0, 0, 0, 0]],
    [[0, 0, 0, 0, 0, 0], [0, 1, 1, 1, 1, 0], [0, 0, 0, 0, 1, 0], [0, 0, 0, 1, 0, 0], [0, 0, 0, 1, 0, 0], [0, 0, 0, 1, 0, 0], [0, 0, 0, 0, 0, 0]],
    [[0, 0, 0, 0, 0, 0], [0, 1, 1, 1, 1, 0], [0, 1, 0, 0, 1, 0], [0, 1, 1, 1, 1, 0], [0, 1, 0, 0, 1, 0], [0, 1, 1, 1, 1, 0], [0, 0, 0, 0, 0, 0]],
    [[0, 1, 1, 1, 1, 0], [0, 1, 0, 0, 1, 0], [0, 1, 0, 0, 1, 0], [0, 1, 1, 1, 1, 0], [0, 0, 0, 0, 1, 0], [0, 0, 0, 0, 1, 0], [0, 0, 0, 0, 1, 0]]
]
~~~

이걸 런타임에 안하고 지금 하는 이유는 실행 시간을 조금이라도 줄이기 위함이다.

인터프리터가 저 리터럴을 읽어 `bitmaps`을 메모리에 올리는 시간이 `bit_matrix`를 10번 호출해 비트맵을 만드는 것보다 훠어어어어얼씬 적게 걸린다.

자 이제 `parse`와 `print`를 만들어보자.

#### parse

파싱이 조금 귀찮은데, 숫자가 하나 이상인 경우 이를 모두 분리해내야 하기 때문이다.

먼저 숫자 하나짜리 전용 `_parse_single` 메소드를 만들어보자.

~~~python
def _parse_single(self, row_strings: list):
    bin_string = ''.join(row_strings)
    bits = int(bin_string, base=2)

    if bits not in self.font:
        return -1

    return self.font.index(bits)
~~~

스트링으로 이루어진 `['000000', '011100', ...]` 이런 리스트를 인자로 받는다.

아주 다행이게도 저 각 줄들을 이어붙이면 `000000011100...` 이런 식으로 위에서 만든 `font`와 똑같은 모습이 나온다.

저렇게 이어붙인 스트링을 그대로 숫자로 바꾸기만 하면, `font` 리스트 내에서 해당 숫자의 위치를 찾아 반환할 수 있다.

만약 입력이 어떤 숫자와도 일치하지 않으면 -1을 반환한다. 물론 이런 경우가 생길 일은 없지만 개발 과정에서 유용하므로 추가했다.

이제 여러 숫자가 붙어있는 스트링을 파싱해보자.

핵심 아이디어는 스트링 덩어리를 N개로 쪼개어 `_parse_single`을 N번 부르는 것이다.

~~~python
def parse(self, row_strings: list):
    # 첫 줄로부터 숫자의 개수를 유추.
    n_digits = len(row_strings[0]) // self.char_width

    # 각 숫자를 나타내는 스트링을 저장할 리스트를 n_digits개 생성.
    digits = [[] for _ in range(n_digits)]


    for long_line in row_strings:
        # 각 줄을 6글자씩 n_digits개로 쪼갬.
        splited_lines = [long_line[i:i+self.char_width] for i in range(0, len(long_line), self.char_width)]

        for i in range(n_digits):
            # n_digits조각 난 스트링을 digits에 차례대로 담아줌.
            digits[i].append(splited_lines[i])

    # digits의 각 원소(각 숫자를 나타내는 스트링들)를 가지고 _parse_single을 호출한 결과를 모아 반환.
    return [self._parse_single(digit) for digit in digits]
~~~

#### print

`print`는 `parse`와 반대로 스트링들을 가로로 붙여서 출력해야 한다. 이때는 아까 구해놓은 `bitmaps`를 활용한다. `bitmaps`는 3차원 리스트로, 각 숫자는 2차원 리스트(row-major)로 이루어져 있다.

루프를 적당히 중첩하여 구현한다. 아, 캐시 고려하지 않았고 효율은 극악이다(ㅋㅋㅋ).

~~~python
def print(self, nums: list):
    matrix = [self.bitmaps[num] for num in nums]
    for line in range(self.char_height):
        for digit in range(len(matrix)):
            for column in range(self.char_width):
                print(matrix[digit][line][column], end='')
        print("")
~~~

### next_permutation

주어진 순열의 다음 순열을 구한다.

처음에는 모든 순열의 경우를 구한 다음 정렬해서 주어진 순열의 다음 것을 찾으려고 했다.

![wow...](/assets/images/nKwiOj4.png)

그런데 그건 **O(n!)** 아니던가...

![wtf...](/assets/images/CkXJPe1.jpg)
> 사실 새벽이라 정신없었다..

아무튼 다음 순열은 주어진 순열만 가지고도 구할 수 있다. 인간이 쓰는 방법을 그대로 모방해보자.

먼저 일반화된 규칙을 찾기 위해 예시를 몇 개 보자.

12345 -> 12354

54321 -> 없음

82374 -> 82437

19283 -> 19328

15432 -> 21345

숫자가 변한 자리들만 표시해보자.

123**45** -> 123**54**

82**374** -> 82**437**

19**283** -> 19**328**

**15432** -> **21345**

찾았다!

맨 오른쪽에서부터 왼쪽으로 볼 때, **상승세가 멈추는 곳 다음 수까지** 바뀐다.

자세히 들여다보자.

`[8, 2, 3, 7, 4]`를 예시로 보자.

오른쪽부터 볼 때, 4 -> 7까지는 상승세가 이어진다.

그러나 7 -> 3에서 꺾인다.

이때 **3의 인덱스** 를 `x`라고 하자.

`x`부터 마지막 인덱스까지(3, 7, 4 구간)의 숫자를 바꾸면 된다.

그럼 숫자를 어떻게 바꾸면 될까?

82**374** 에서 **374** 만 떼어놓고 보자.

374보다 바로 한 단계 큰 수를 만들어야 한다.

먼저 MSB를 **3을 제외하고 3보다 큰 가장 작은 수** 로 선정한다.

3을 제외하면 7과 4가 남는데, 3보다 큰 수 중 가장 작은 수는 4이다.

4를 가장 앞에 배치하면 이제 남은 수는 오름차순으로 정렬하면 된다.

그러면 437이 된다.

이를 82와 다시 합치면 82437이 된다.

구현은 이걸 그대로 가져다 옮기면 된다.

~~~python
def next_permutation(sequence):
    index_digit_to_swap = -1
    last_digit_value = -1
    for i in range(len(sequence)-1, -1, -1):
        if sequence[i] < last_digit_value:
            index_digit_to_swap = i
            break
        last_digit_value = sequence[i]
    else:
        return None

    min_index = -1
    last_min = 99999
    for i in range(index_digit_to_swap+1, len(sequence)):
        if sequence[index_digit_to_swap] < sequence[i] < last_min:
            min_index = i
            last_min = sequence[i]

    sequence[index_digit_to_swap], sequence[min_index] = sequence[min_index], sequence[index_digit_to_swap]

    return sequence[:index_digit_to_swap+1] + sorted(sequence[index_digit_to_swap+1:])
~~~

## 마치며

새벽에 갑자기 머리를 써서 당이 뚝 떨어졌다. 너무 정신없게 풀어서 코드가 좀 못생겼다.

나중에 다시 뜯어고쳐야겠다.

## Reference

- [PEP 515](https://www.python.org/dev/peps/pep-0515/)
