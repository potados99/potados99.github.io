---
title: "[BOJ] 백준 5373번 큐빙"
excerpt: "루빅스큐브 시뮬레이션"
date: 2019-12-26 23:08:33 +0900
categories:
   - ps
tags:
   - ps
   - boj
   - cube
   - python
---

## 들어가며

올해가 끝나가는 요즈음, 나도 [백준](https://www.acmicpc.net/)을 시작했다.

시작은 학교에서 열린 [송년 코드 페스티벌](https://www.acmicpc.net/contest/view/496)이었다.

야매 프로그래머인 나는 한 번도 겪어보지 못한 유형의 문제에 탈탈 털려버렸고 두 개 밖에 맞추지 못했다.

그런데 이것이 은근히 재미있는 것이, 초록색으로 `맞았습니다!!!`가 뜰 때 기분이 정말 째지는 것이다.

그래서 앞으로 심심할 때마다 문제를 풀어보려 한다.

## 5373번 큐빙

[큐브 돌리는 문제](https://www.acmicpc.net/problem/5373)다. 모두 아는 그 3x3x3 루빅스 큐브다.

처음에 큐브는 모두 맞춰진 상태이고, instruction이 입력되면 그에 따라 각 면을 회전한다. 끝이다.

### 구상

기본적으로 큐브도 [상태 머신](https://ko.wikipedia.org/wiki/유한_상태_기계)이다.

큐브가 가질 수 있는 상태의 갯수는 `(7! × 3^6) × 24 × (12! × 2^10 )`개로, **엄청 많다.**

다만 다행히도 큐브에 가할 수 있는 행동의 갯수는 `6개의 면` x `2개의 방향`으로 12개밖에 되지 않는다.

가장 먼저 떠올릴 수 있는 접근은 회전 함수 12개를 만드는 것이다. 그런데 이거 경우가 엄청 많아서 벌써부터 무섭다.

만약 큐브의 시점을 이동해 모든 회전(U, D, L, R, F, B)을 하나의 회전(F)으로 대체할 수 있다면 어떨까.

큐브를 돌려 시점을 이동하면 돌려야 할 면이 맨 앞에 위치하게 된다. 돌리는 방향은 변하지 않는다.

예를 들어 `R 우회전`이 주어지면 **큐브를 오른쪽으로 돌린 뒤** `F 우회전`을 하는 것이다.

그리고 다시 시점을 복귀하면 된다.

사실 다른 방법도 많지만(블럭 중심으로 모델링한다든가, 아예 좌표계를 사용한다든가) 여기에 꽂혀서 이렇게 했다.

### 모델링

큐브의 현재 상태는 이렇게 모델링한다:
- 면의 식별자 정수를 key로, 해당 면의 색상 정보(9)개 리스트를 value로 하는 dictionary

이때 각 면의 색상 정보를 담을 때에 순서가 참 중요한데, 아래 그림과 같이 번호를 매겼다. 빨간색이 F, 흰색이 U이다.

![cube](/assets/images/WyDGxxh.png)
> [이미지 출처](https://www.wikiwand.com/en/Rubik%27s_Cube)

인덱스가 뒤집어져 있다. 전면(F)에 맞닿아 있는 부분이 인덱스 6, 7, 8이 되도록 하려고 그렇게 만들었다. 왜냐! 전면을 돌릴 때 전면을 통째로 회전하고, 맞닿은 U, D, L, R의 인덱스 6, 7, 8끼리만 바꾸면 되기 때문이다.

### 컨셉

상세 구현 컨셉은 다음과 같다:

1. 먼저 주어진 회전면이 맨 앞으로 위치하도록 하기 위해 어떤 축(X, Y, Z)으로, 어떤 방향으로 큐브의 시점을 바꿔야 할 지 정한다.

2. 전면을 회전하고, 전면에 인접해 영향 받는 각 면의 일부분(위에서 본 U, D, L, R의 인덱스 6, 7, 8 부분)도 회전한다.

3. 1에서 구한 정보를 역으로 실행해 다시 시점을 복귀한다.

이때 좌표축은 아래 그림처럼 정한다.

![coordinate](/assets/images/rTuHFCi.png)

> 너무 대충 그렸나..ㅋㅋㅋ

### 상세 전략

구현물을 보면 1번이 제일 비대하다.

1을 달성하기 위해 어떻게 했냐 하면...

- 특정 면이 앞으로 오도록 하기 위해 거쳐가야 하는 지침들을 `path`라 한다. 예를 들어 뒷면(B)을 앞으로 가져오기 위한 path는 `[(Z, CW), (Z, CW)]`일 것이다. Z축으로 시계방향 회전 + Z축으로 시계방향 회전(한번 더)이라는 뜻이다. 이 경우 `[(Y, CW), (Y, CW)]`도 물론 가능하다. 가장 짧기만 하면 된다.

- 각 `path`에서의 시점 변경 지침을 수행할 때에는 두 가지 작업을 수행해야 한다: 하나는 시점 이동에 따라 면들을 바꿔주는 것이고, 다른 하나는 시점 이동에 의해 인덱스가 다르게 해석되어 생기는 문제를 보정해주는 것이다. 이 작업들을 `instruction`이라 한다.

> 인덱스 해석의 문제란? 위 첫 번째 그림을 참고하면 좋다. 만약 큐브를 Z축 시계방향으로 돌렸다면, R이었던 면은 F가 될 것이다. 그런데 이 때 R과 F는 다른 방향으로 순서가 매겨진다. 사람이 보기에 오른쪽 면의 왼쪽 위 블럭이 주황색이었다면, 이 면을 F로 가져왔을 때에 이 주황색 블럭은 전면의 왼쪽 아래에 보일 것이다. 왜냐 하면 R에서 왼쪽 위 블럭의 인덱스는 6이었지만 F에서 인덱스 6은 왼쪽 아래이기 때문이다. 따라서 이를 보정하기 위해 앞으로 온 오른쪽 면을 우회전해주어야 한다.

- 주어진 면을 앞으로 가져오기 위한 `path`를 구하고, 이 `path`를 기반으로 `instruction`을 구한다. 이렇게 구해진 `instruction`을 수행하면 시점 이동이 완료된다.

복잡해 보이지만 일반화하여 쓰려니 그런 것이다.

예시를 들어보자.

> 앞에 초록색, 위에 흰색이 오게 큐브를 잡는다. 윗면이 앞으로 오도록 큐브를 바꿔 잡고자 한다. 바꿔잡은 뒤에는 흰색이 앞에, 그 뒤에 있던 파란색이 위에 보일 것이고, 앞에 있던 초록색은 바닥으로 갈 것이다. 이를 달성하기 위해서는 큐브를 Y축으로 우회전해야 한다.

여기까지가 인간적인 설명이다.

여기서부터는 컴퓨터용 설명이다.

> 그렇게 하기 위해서는 우선 축과 평행한 U, D, F, B를 이동해야 한다. 먼저 U와 F를 swap하고, D와 B를 swap한다. 그리고 U와 D를 swap한다. 이렇게 하면 네 면이 적절한 위치에 있게 된다.

![rotate-right](/assets/images/QKmRnzu.png)

> 이제 축과 직교하는 L과 R을 회전해 주어야 한다. L은 우회전, R은 좌회전 해준다.

> 마지막으로 뒷면과 윗면의 순서 방향이 다르기 때문에 윗면 180도 회전, 앞면과 아랫면의 순서 방향이 다르기 때문에 아랫면 180도 회전해준다.

시점 이동 끝.

이것만 끝나면 다른 것들은 설명이 필요 없다 :)


## 구현

아, 다 쓰고 보니 코드가 407줄이다. 모두 설명하기는 너무 방대하고, 중요한 것만 짚어야겠다. 코드 전문은 [여기](https://github.com/potados99/problem-solving/blob/master/boj/5373.py)에 있다.

### Path를 구하는 부분

~~~python
def _get_path_to_dest_face(self, destination: int):
    """
    Get list of instructions of how we can bring the destination face at front.
    """
    to_go = []

    if destination == self.U:
        to_go.append((self.Y, self.CW))
    elif destination == self.D:
        to_go.append((self.Y, self.CCW))
    elif destination == self.L:
        to_go.append((self.Z, self.CCW))
    elif destination == self.R:
        to_go.append((self.Z, self.CW))
    elif destination == self.B:
        to_go.append((self.Z, self.CW))
        to_go.append((self.Z, self.CW))

    to_return = list(map(lambda pair: (pair[0], pair[1] * -1), to_go))
    to_return.reverse()

    return (to_go, to_return)
~~~

딱히 별 것 없다. 주어진 면(`destination`)이 앞에 오도록 하기 위해서는 2번 이하의 시점 이동만이 필요하다.

`to_go`의 각 원소는 튜플이다. 각 튜플은 (`회전축`, `방향`)이다.

`to_return`은 원래 시점으로 다시 돌아가기 위해 구한 것이다. 회전 방향을 반대로 한 뒤 역으로 정렬하면 된다.

### Path로부터 instruction을 구하는 부분

이 부분은 어떻게든 줄이려 해보았으나, 어떻게 일반화시키기가 어려워 결국 if로 도배됐다. 그래서 조금 길다.

~~~python
def _get_instructions(self, path: list):
    """
    Type of instructions:
        - swap: (INST_SWAP, face_a, face_b)
        - rotate: (INST_ROT, face, direction)

    These are about moving view, not rotating a face!
    """
    instructions = []

    SWAP = lambda a, b: instructions.append((self.INST_SWAP, a, b))
    ROT = lambda a, b: instructions.append((self.INST_ROT, a, b))

    for step in path:
        axis = step[0]
        direction = step[1]

        if axis == self.X:
            if direction > 0:
                # CW
                SWAP(self.U, self.R)
                SWAP(self.U, self.R)
                SWAP(self.U, self.D)

                ROT(self.F, self.CW)
                ROT(self.B, self.CCW)
            else:
                # CCW
                SWAP(self.U, self.L)
                SWAP(self.D, self.R)
                SWAP(self.U, self.D)

                ROT(self.F, self.CCW)
                ROT(self.B, self.CW)

        if axis == self.Y:
            if direction > 0:
                # CW
                SWAP(self.U, self.F)
                SWAP(self.D, self.B)
                SWAP(self.U, self.D)

                ROT(self.L, self.CW)
                ROT(self.R, self.CCW)

                # Compensate indexing orientation.
                ROT(self.D, self.CW)
                ROT(self.D, self.CW)
                ROT(self.U, self.CW)
                ROT(self.U, self.CW)
            else:
                # CCW
                SWAP(self.U, self.B)
                SWAP(self.D, self.F)
                SWAP(self.U, self.D)

                ROT(self.L, self.CCW)
                ROT(self.R, self.CW)

                # Compensate indexing orientation.
                ROT(self.F, self.CW)
                ROT(self.F, self.CW)
                ROT(self.B, self.CW)
                ROT(self.B, self.CW)

        if axis == self.Z:
            if direction > 0:
                # CW
                SWAP(self.B, self.R)
                SWAP(self.F, self.L)
                SWAP(self.B, self.F)

                ROT(self.U, self.CW)
                ROT(self.D, self.CCW)

                # Compensate indexing orientation.
                ROT(self.L, self.CW)
                ROT(self.R, self.CCW)
                ROT(self.F, self.CW)
                ROT(self.B, self.CCW)
            else:
                # CCW
                SWAP(self.B, self.L)
                SWAP(self.F, self.R)
                SWAP(self.B, self.F)

                ROT(self.U, self.CCW)
                ROT(self.D, self.CW)

                # Compensate indexing orientation.
                ROT(self.L, self.CW)
                ROT(self.R, self.CCW)
                ROT(self.F, self.CCW)
                ROT(self.B, self.CW)

    return instructions
~~~

`path`로부터 만들어지는 `instrunction`은 `INST_SWAP`과 `INST_ROT`(ATION)으로 두 가지이다.

코드 초안은 생각만으로 짰으나 위의 경우들을 검증하는 것은 테스트가 다 했다. 역시 돌려보면서 짜는게 제맛. 인터프리터(또는 컴파일러)와 코드는 함께 성장한다. ><

### Instruction 실행하는 부분

저걸 다 구해서 어디에 쓰냐면, 여기 시점 이동 메소드에서 쓴다.

~~~python
def _move_view(self, path: list):
    """
    Rotate view (not the face!) so that the destination face be at front.
    """
    instructions = self._get_instructions(path)

    for step in instructions:
        if step[0] == self.INST_SWAP:
            face_a = step[1]
            face_b = step[2]
            self._swap_face(face_a, face_b)
        elif step[0] == self.INST_ROT:
            face = step[1]
            direction = step[2]
            self._rotate_face(face, direction)
~~~

### 종합 rotate_face

위에 나온 것들을 다 사용하여서, 문자로 된 면 이름과 방향을 받아 회전을 수행하는 메소드이다.

~~~python
def rotate_face(self, face: chr, direction: chr, verbose=False):
    """
    Rotate the given face of the cube with given direction.
    """
    face = self._parse_face(face)
    if face is None: return

    direction = self._parse_direction(direction)
    if direction is None: return

    # Move the view so the face is at front.
    way_to_go, way_to_return = self._get_path_to_dest_face(face)

    self._move_view(way_to_go)

    # Now the face is at front.

    # Not only the front face, 6~8 blocks of [U, D, L, R] faces are affected.
    affected = (self.width**2 - self.width, self.width**2 - 1)
    swap_part = lambda a, b: self._swap_part_of_face(a, affected, b, affected)

    if direction > 0:
        # CW
        self._rotate_face(self.F, self.CW)
        swap_part(self.U, self.R)
        swap_part(self.D, self.L)
    else:
        # CCW
        self._rotate_face(self.F, self.CCW)
        swap_part(self.U, self.L)
        swap_part(self.D, self.R)

    swap_part(self.U, self.D)

    self._move_view(way_to_return)
~~~

`path` 구하고, 시점 변경하고, 전면(F) 돌리고, 다시 반대 `path`로 시점 복귀한다.

### 디버그용

덤프 메소드를 만들었다. 호출하면 전개도를 보여준다.

~~~python
def dump_figure(self, padding=1, border=True):
    if border:
        print("{space} Dump started {space}".format(space='='*(self.width*2)))

    rotated = lambda m, d, r: self._square_rotated(matrix=self.faces[m], width=self.width, direction=d, repeat=r)
    print_color = lambda m, i, j: print("{color}".format(color=self._color_to_string(m[i*self.width + j])), end='')

    up = rotated(self.U, 0, 0)
    left = rotated(self.L, self.CCW, 1)
    front = rotated(self.F, 0, 0)
    back = rotated(self.B, 0, 0)
    right = rotated(self.R, self.CW, 1)
    down = rotated(self.D, self.CW, 2)

    # Up
    for i in range(self.width):
        print(' '*(self.width+padding), end='')
        for j in range(self.width):
            print_color(up, i, j)
        print('')

    print('\n'*padding, end='')

    # Left, front, right, back
    mid_faces = [left, front, right, back]
    for i in range(self.width):
        for j in range(len(mid_faces)):
            for k in range(self.width):
                print_color(mid_faces[j], i, k)
            print(' '*padding, end='')
        print('')

    print('\n'*padding, end='')

    # Down
    for i in range(self.width):
        print(' '*(self.width+padding), end='')
        for j in range(self.width):
            print_color(down, i, j)
        print('')

    if border:
        print("{space} Dump finished {space}".format(space='='*(self.width*2)))
~~~

역시 코드는 인터프리터와 함께 성장하는 것이라(손코딩 쥐약임) 예쁜 디버그 함수가 있어야 개발할 맛이 난다.

파라미터로 전/후 border나 면 사이 간격을 조절할 수 있게 해놓았다. 요긴하게 써먹었다.

### 나머지

나머지는 메소드 이름만 보고 구현할 수 있을 정도로 간단하다. 코드 전문은 [여기](https://github.com/potados99/problem-solving/blob/master/boj/5373.py)에.

## 마치며

재미있었다. 마침 책장 옆에 큐브가 있어서 다행이다. 없었으면 화날뻔했다.

## Reference

- [유한 상태 기계](https://ko.wikipedia.org/wiki/유한_상태_기계)
- [큐브 경우의 수](https://jjycjnmath.tistory.com/9)
- [Rubik's Cube](https://www.wikiwand.com/en/Rubik%27s_Cube)
