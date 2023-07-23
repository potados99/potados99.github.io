---
title: "[BOJ] 백준 17825번 주사위 윷놀이: 삽질 기록"
excerpt: "문제 잘못 이해해서 한참 삽질한 후기"
date: 2020-01-31 17:04:44 +0900
categories:
   - ps
tags:
   - boj
   - ps
   - digging
   - c++
---

[백준 문제 페이지](https://www.acmicpc.net/problem/17825)

[풀이 소스코드](https://github.com/potados99/ps-study/blob/master/17825.cpp)

## 들어가며

푸는 데에 3일 걸렸다. 문제가 불친절한건지 아니면 내가 잘못 이해한건지, 시키는대로 만들지 않아서 푸는 데에 꽤나 오래 걸렸다. 한참 삽질했다.

## 문제 파악

문제를 열자 마자 뜬금없이 이상한 주사위판 같은게 튀어나온다.
![wtf is this](https://i.imgur.com/6flZ6kH.png)

말이 있고, 주사위를 던져 나온 수 만큼 말을 이동시킨다. 말은 총 네 개가 있고, 주사위를 던져서 나온 수 10개가 미리 주어진다.

이때 이동시킬 말들을 적절히 선택해서 네 개 말이 얻은 점수의 합이 최대가 되도록 해야 한다.

요약하자면:

- [깊이 우선 탐색(DFS)](https://en.wikipedia.org/wiki/Depth-first_search)을 활용하는
- 시뮬레이션 문제다.

## 1차 시도

### 큰 틀

일단 게임의 정보를 가지는 객체를 둔다. 그 객체는 맵 정보와 현재 플레이어의 정보를 가지고 있다.

### 맵 만들기

어떻게 풀어야 할 지보다 어떤 자료 구조를 사용할까가 먼저 떠올랐다. 그래서 맵을 먼저 만들었다.

일단 기본적으로 맵은 여러 개의 노드로 이루어진다. 각 노드는 정수로 된 값을 가지며, 최대 두 개의 다음 노드를 가리킬 수 있다. 연결 리스트의 그것과 매우 유사한 구조이다.

처음에는 모든 노드를 만들고(힙에 할당) 그 포인터를 변수에 넣어둔 뒤, 그것들끼리 이어 맵을 완성하려 했다. 그런데 이렇게 되면 몇 가지 문제가 생긴다:

- 맵 변경에 유연하지 않음(사실 여기서는 크게 문제되지 않음).
- 변수 이름 짓는 데에 문제가 생김(중복되는 숫자가 존재함).
- 코드의 양이 폭발적으로 증가.
- 못생김.

그래서 생각해낸 방법은 다음과 같다:

> **먼저 시작 노드를 만들고, 그 노드에 같은 성질을 가지는 노드들을 주욱 이어 붙여준다.**

~~~c
// 노드를 하나 만들고,
node *start_node = create(0);

// 그 노드를 시작으로 주우욱 붙여준다.
node *node10 = attach(start_node, 5, new int[5] {2, 4, 6, 8, 10});
~~~

이런 식으로 만들어주는 것이다.

기본 발상은 위와 같다. 이제 디테일을 더해보자.

노드는 **검은 노드**와 **파란 노드** 로 나뉘어지며 파란 노드의 다음 길은 **빨간 길**과 **파란 길** 로 나뉘어진다.

맵에 등장하는 색상은 `enum color`를 사용하여 정의했다:
~~~c
enum color {
    black = 1,
    blue = 2,
    red = 3
};
~~~

노드는 `값`, `색상`, `다음노드(일반)`, `다음노드(특별)` 속성을 가진다:
~~~c
struct node {
    int             num;
    enum color      color;
    struct node     *next;
    struct node     *special;
};
~~~

`다음 노드(일반)`은 검은 노드에서 다음 노드로 이어지는 **빨간 길** 에 있는 노드를 뜻하며, `다음 노드(특별)`은 파란 노드에서 다음 노드로 이어지는 두 길 중 **파란 길** 에 있는 노드를 뜻한다.

맵의 시작과 끝을 담은 맵 정보는 다음과 같이 정의했다:
~~~c
struct map {
    struct node    *start;
    struct node    *last;
}
~~~

아무런 정보가 없는 시작 노드는 존재하지만 **별도의 끝 노드는 만들지 않았다.** 현재 노드가 `null`이 아니라면 끝에 도달하지 않은 것이다.

### 플레이어 만들기

![트로이 목마](https://i.imgur.com/5OjlVpX.jpg)

문제에서는 말이라 써있지만 **플레이어** 라는 단어가 더 편했다.

이 게임에는 플레이어가 넷 존재한다. 각 플레이어는 `현재 위치`와 `총점`, `종료 여부` 속성을 가진다:
~~~c
struct player {
    struct node     *current;
    int             score;
    bool            finished;
}
~~~

### 게임 정보 만들기

이 모든 정보를 전역변수로 두기는 좀 그렇고, `context` 구조체로 정리했다.

~~~c
struct _context {
    struct map     *map;
    struct player  *players[]; // 이 부분은 틀렸다. 아래에서 다루겠음.
}
~~~

### 스코어링

1차 시도까지만 해도 문제를 잘못 이해해서 점수 집계 방식 자체를 오해했다. 무려 이동하는 매 칸마다 점수를 더해주었다. 그러니까, 2부터 4, 6을 거쳐 10까지 3칸을 이동하면, 4 + 6 + 10점을 총계에 더한 것이다.    
> -> 이동을 마쳤을 때에 그 도착지 숫자만 더해야 했다.

또다른 큰 실수는 점수의 최댓값을 구하라는 것이 가장 점수 높은 플레이어의 점수를 구하라는 것인 줄 알고 플레이어 점수의 최댓값만 구한 것이다.
> -> 모든 플레이어의 총합을 더해야 했다.

### DFS

제일 중요한 부분 중 하나인데, 주사위판은 사실 부차적인 부분이다. 이 문제의 핵심은, **10** 개의 수를 플레이어들에게 분배하는 모든 경우의 수에 대해 실험을 해보는 것이다.

그러니까, 다음 경우들이 있을 수 있다.

~~~
0 0 0 0 0 0 0 0 0 0 -> 10번의 이동 모두 0번이 함.
0 0 0 0 0 0 0 0 0 1 -> 9번의 이동을 0번이, 1번의 이동을 1번이 함.
~~~

0부터 3 사이에서(총 네 명의 플레이어) 중복을 허용해 10 번을 뽑는 모든 경우의 수를 찾아야 한다.

코드는 이렇게 작성했다:

~~~c
typedef void (*callback)(context *, int *);

...

// 이게 본체
void dfs(int count, int *selected, callback on_pick, context *c) {
    if (count == 10) {
        // 각 경우에 대해 이 함수가 호출됨.
        on_pick(c, selected);
        return;
    }

    for (int i = 0; i < 4; ++i) {
        selected[count] = i;
        dfs(count + 1, selected, on_pick, c);
    }
}

// 이게 wrapper
void for_each_permutation(callback on_pick, context *c) {
    dfs(0, new int[10] {0, }, on_pick, c);
}
~~~

`dfs` 함수가 비대해지는 것이 싫어 함수 포인터를 사용해 람다식을 흉내내었다.

## 망했다!

1차 시도는 거하게 망했다. 테스트 케이스조차 절반도 못 맞았다. 이게 다 문제를 잘 안 읽어서 그렇다.

## 문제 제대로 파악하기

문제를 보면 일단 이렇게 써있다.
> 말이 이동을 마칠때마다 칸에 적혀있는 수가 점수에 추가된다.

말이 칸을 밟을 때가 아니라, 이동을 마쳤을 때에만 점수가 올라간다..!

그리고
> 이동하려고 하는 칸에 말이 이미 있는 경우에는 그 칸으로 이동할 수 없다.

도착지에 말이 있으면 그냥 이동 자체를 하면 안된다!

또..
> 주사위에서 나올 수 10개를 미리 알고있을때, 얻을 수 있는 점수의 최댓값을 구해보자.

점수의 최댓값이라는 것이, 네 플레이어 점수의 합이었다.

## 2차 시도(삽질)

맵은 아무리 봐도 완성이어서 그냥 놓아 두었다.

### 스코어링

이동 함수를 이렇게 짰다!

~~~c
void move(context *c, int player_index, int how_many) {
    // 당연히 걸러야 할 케이스들.
    if (how_many < 1) return;
    if (c->players[player_index]->finished) return;
    if (c->players[player_index]->current == NULL) return;

    // 플레이어는 player_index에 의해 확정됨.
    player *p = c->players[player_index];

    // 커서가 혼자 미리 가서 판단하고,
    node *cursor = p->current;

    // 처음 이동은 루프 진입 전에 한다.
    // 노드 색상에 따라 처음 이동 방향이 갈리기 때문에 다르게 처리해준다.
    cursor = (cursor->color == blue) ? cursor->special : cursor->next;

    // 한 칸 왔으니 1 빼준다.
    how_many--;

    // 커서 혼자서 다음으로 이동
    for (int i = 0; i < how_many; ++i) {
        if (cursor == NULL) break;
        cursor = cursor->next;
    }

    // 만약 끝까지 왔으면
    if (cursor == NULL) {
        // 표시해주고
        p->current = NULL;
        p->finished = true;

        // 이동을 종료!
        return;
    }

    // 커서가 미리 간 그곳에 아무도 없으면 valid가 true이다.
    bool valid = (how_many_are_there(c, cursor) < 1);

    // valid 여부에 따라 점수와 이동 처리를 해준다.
    p->score += valid ? cursor->num : 0;
    p->current = valid ? cursor : p->current;
}
~~~

## 또 망했다!

### 런타임 에러? 세그먼트 오류?

자신있게 제출했는데 채점하다가 30%대 즈음에서 **틀렸습니다** 가 뜨는 것이다.

틀림없이 잘 구현했고, 맵도 원하는대로 완성되었고 완벽한데 왜 안되나 싶었다.

그래서 다른 곳에서 정답 소스코드를 구해서 **테스트 케이스 무작위 대입** 을 통해 틀린 케이스를 찾아내기로 했다.

쉘을 켜고, 테스트 스크립트를 작성하고, 구현물을 컴파일해서 실행을 하는데...

~~~
Segmentation fault (core dumped)
~~~

![wtf](https://i.imgur.com/eLfysXy.jpg)
> WTF

Xcode에서는 잘만 실행되던 것이 쉘에서 직접 실행하니까 바로 뻗는 것이다. 혹시나 싶어 Xcode에서 컴파일한 바이너리를 직접 `./바이너리`로 실행해보니 역시나 뻗는 것이다.

이게 무슨 일인가 싶어 `gdb a.out`으로 살펴보려 했는데...
~~~
not in executable format: File format not recognized
~~~

![bullshit](https://i.imgur.com/steO0kN.gif)
> gdb가 개소리를 한다...

이것 가지고 씨름하기 싫어서 코드를 유심히 살펴보다가 문제를 찾았다.

~~~c
struct _context {
    struct map     *map;
    struct player  *players[]; // 요거요거
}
~~~

포인터의 배열을 만든다고 저렇게 선언해놓았는데, 크기를 안 써주니 사실상 아래와 똑같았던 것이다.

~~~c
struct _context {
    struct map     *map;
    struct player  **players; // *players[]랑 똑같음.
}
~~~

그렇다... 할당도 안 된 공간에 무턱대고 대입을 한 것이다.

~~~c
context *c = new context;

...

for (int i = 0; i < 4; ++i) {
    player *p = new player;
    ...
    c->players[i] = p; // 거긴 네가 들어갈 곳이 아니라구!
}
~~~

`c->players`의 크기는 내가 원하던 `8*4`바이트가 아니라 그냥 `8`바이트인데, `8*i` 영역에 접근해서 값을 써버리니, `map`의 다른 노드에 그 값이 덮어씌워진 것이다!  

심지어 메모리 할당은 운영체제가 알아서 관리하기 때문에 그 겹치는 영역이 어디인지도 모른다. 그래서 Xcode로 실행할 때에 랜덤하게 에러가 발생했던 것이다.

그래서, 이렇게 고쳐서 해결했다.
~~~c
struct _context {
    struct map     *map;
    struct player  *players[4];
}
~~~

### 문제를 잘못 이해했다

간신히 구동에 성공해서 테스트를 시작할 수 있었다. 밤새 실행해서 틀린 테스트 케이스를 186개 구했다.

틀린 경우를 보면, 모두 정답보다 조금 숫자가 크게 나오는 경우였다.

일단 테스트 케이스 **1 2 1 4 1 4 3 2 2 1** 을 가지고 분석을 시작했다.

정답 판정받은 코드에서는 이동한 플레이어를 표시해보면 아래와 같이 나온다:
~~~
0 0 0 0 0 0 0 0 0 1
~~~

그런데 내가 짠 코드에서는 이렇게 나온다

~~~
0 1 0 1 1 1 1 1 1 1
~~~

내가 짠 코드가 정답보다 2 큰 답을 낸다.

다른 케이스도 분석해보니 한 가지 공통점이 있었다.

**최댓값이 나오는 케이스에서, 플레이어가 이동을 시도했으나 그 자리에 이미 다른 플레이어가 있어서 이동하지 못하는 경우가 있었다.**

문제를 다시 보니
~~~
이동하려고 하는 칸에 말이 이미 있는 경우에는 그 칸으로 이동할 수 없다.
~~~

이렇게 써있는데, 분명히 잘 지켜서 코딩했는데 틀렸단다.

도저히 안되겠어서 스승님께 여쭈어 보니,

**'"이동하려고 하는 칸에 말이 이미 있는 경우에는 그 칸으로 이동할 수 없"는 케이스는 한 턴으로 인정하지 말고 넘기'** 라 하셨다.

~~아니 그런게 어딨어 문제 설명 왜 저렇게밖에 안돼있는데~~

## 3차 시도 (마지막 삽질)

### 무효한 케이스 버리기

일단 틀린 케이스가 감지되면 이동을 멈추고 다음 이동도 멈출 것을 `on_pick`(10개짜리 순열에 대해 적절히 이동을 실시하는 함수) 함수에 알려야 한다.

반환값을 사용해 전달하기로 했다.

`move`함수에서 바뀐 부분은 다음과 같다:

~~~c
/**
 * return: keep of not
 */
bool move(context *c, int player_index, int how_many) {
    ...

    // 이 부분이 달라졌다. valid하지 않으면 그냥 끝낸다.
    if (how_many_are_there(c, cursor) > 0) return false;

    p->score += cursor->num;
    p->current = cursor;

    return true;
}
~~~

저 함수를 호출하는 쪽에서는 아래처럼 처리했다:

~~~c
void do_on_pick(context *c, int *selected) {
    for (int i = 0; i < 10; ++i)
        // 하나라도 false가 뜨면 즉시 해당 케이스를 종료하고 반환한다.
        if (!move(c, selected[i], nums[i])) {
            reset(c);
            return;
        }

    int local_max = get_score_sum(c);
    if (local_max > max)
        max = local_max;

    reset(c);
}
~~~

### 해결

결국 해결했다.

![정답](https://i.imgur.com/GmpA5SS.png)

## 후기

무척이나 고통스러웠다...

정말이지 갈 길이 멀었다. 문제를 보자 마자 시간 안에 푸는 것은 아직은 많이 힘든 것 같다.

오랜만에 메모리와 포인터에 대해 생각해 볼 만한 기회였다.

## 스페셜 땡스 투

[스승님](https://github.com/ryuspace) 도움 주셔서 감사합니다 ~~이렇게 쓰는거 맞죠..?~~

## Reference

- [Depth-first search](https://en.wikipedia.org/wiki/Depth-first_search)
