---
title: "[Android] 중첩된 RecyclerView 퍼포먼스 개선하기"
date: 2020-09-17 08:30:58 +0900
categories:
   - dev
---

> 이 글은 [원문](https://qiita.com/chibatching/items/19ec43c62db2e38ce673)([@chibatching](https://twitter.com/chibatching))의 [번역본](https://medium.com/@thagikura/reduce-the-number-of-inflation-of-viewholders-drastically-by-sharing-a-viewpool-across-multiple-249d5fc6d28)([@Takeshi Hagikura](https://medium.com/@thagikura))을 상당수 참고하여 쓴 글입니다.

## 들어가며

개발중인 앱에 적용할 레이아웃을 익히기 위해 샘플 앱을 만들고 있다.

세로 방향으로 스크롤하는 `RecyclerView` 속에 가로로 넘어가는 `ViewPager2`가 있고, 그 속에 다시 `RecyclerView`가 존재하는 구조를 가지고 있다.

구현은 성공적으로 마쳤으나 퍼포먼스에 심각한 저하가 생겼다.

## 중첩된 RecyclerView

![slow-scroll.gif](/assets/images/slow-scroll.gif)

> 앱을 실행하자 마자 아래로 빠르게 스크롤한 모습. 심하게 거슬리진 않지만 텍스트밖에 없는데 이렇게 버벅이는 것은 말이 안된다.

`RecyclerView`는 원래 빠르고 가볍다. 이름처럼 각 아이템을 재활용하기 때문이다. 목록에 50개의 요소가 있어도 실제로는 약 12개 정도의 뷰만 만들고는 화면을 벗어나는 순간 재활용하는 것이다.

`RecyclerView`는 `ViewHolder`를 딱 필요한 만큼만 만든다. 만약 화면에 꽉 차는 `RecyclerView` 하나가 있다면 `ViewHolder` 몇 개 만으로도 모든 데이터를 표시할 수 있을 것이다.

하지만 화면에 여러 개의 `RecyclerView`(이하 view)가 등장한다면 이야기가 달라진다. 각 view는 자신의 요소들을 원활하게 표시하기 위해 `ViewHolder`를 최소 몇 개 씩은 가지고 있어야 할 것이고, 모든 view들이 이렇게 할 것이므로 더 많은 `ViewHolder`가 생성되게 된다.

대표적인 예시가 `ViewPager` 속에 `RecyclerView`를 넣는 것이다. 가로로 넘길 수 있는 여러 개의 `RecyclerView`가 생기지만 그들은 서로 `ViewHolder`를 공유하지 않는다. 사용자의 눈에서 벗어난 페이지의 `ViewHolder`를 재활용하지 않는다. 화면을 넘길 때마다 만들고, 또 만든다. 결국 퍼포먼스의 저하로 이어진다.

## 해결책

서로 떨어져있는(별개의) `RecyclerView`라도 같은 뷰 타입의 `ViewHolder`를 사용한다면, 이를 공유할 수 있다.

구글의 [RecyclerView#setRecycledViewPool](https://developer.android.com/reference/android/support/v7/widget/RecyclerView.html#setRecycledViewPool(android.support.v7.widget.RecyclerView.RecycledViewPool)) 문서에 따르면 다음과 같다:

> Recycled view pools allow multiple RecyclerViews to share a common pool of scrap views. This can be useful if you have multiple RecyclerViews with adapters that use the same view types, for example if you have several data sets with the same kinds of item views displayed by a **ViewPager**.

**똑같이 생긴 `RecyclerView`가 여러 개 있는 경우**에 사용하면 적절하다는 것이다.

## 적용

> 이 샘플에서 사용하는 용어 몇 개를 정리하면 다음과 같다:
- Section: "One", "Two", ...로 구분되는 가장 큰 단위
- Page 또는 PropPage: 가로로 넘길 수 있는, prop이 세로로 세 줄씩 쌓인 페이지
- Prop: Property. 사용자에게 전달할 컨텐츠.

샘플 앱의 레이아웃 구조상 가장 많이 생성되는 `ViewHolder`는 최종 컨텐츠인 `Prop`이다. 만약 10개의 `Section`이 있고, 5개의 `Prop`이 3개씩 뭉쳐 두 페이지로 표시된다고 하면 최대 50개의 `Prop`을 담을 `ViewHolder`가 필요해진다.

이렇게 흩어진 `ViewHolder`들을 하나의 pool 안에 담아 보자.

## 구현

같은 풀을 많이 공유할수록 성능이 나아진다. 그러므로 Pool은 앱 안에서 유일해야 한다.

따라서 최상위 Adapter(`Section`을 다룸)에서 pool을 생성해 주었다.

~~~kotlin
private val propPool = RecyclerView.RecycledViewPool()
~~~

이는 `SectionViewHolder`를 생성할 때에 그 하위의 `PropPageAdapter`에게 인자를 통해 전달된다. 그리고 최종적으로 `Prop`을 다루는 `RecyclerView`를 설정할 때에 사용된다.

~~~kotlin
with(itemView.the_prop_recycler) {
    adapter = propAdapter

    setRecycledViewPool(propPool)
    (layoutManager as LinearLayoutManager).recycleChildrenOnDetach = true
}
~~~

> `RecyclerView.RecycledPool`을 사용하기 위해 `recycleChildrenOnDetach`을 `true`로 설정해 주었다. [LinearLayoutManager#setRecycleChildrenOnDetach](https://developer.android.com/reference/android/support/v7/widget/LinearLayoutManager.html#setRecycleChildrenOnDetach(boolean)) 참고.

레이아웃은 총 3중이다. 가장 깊은 곳의 `Prop`을 공유하는 `propPool`과 같이 그 바로 윗단계인 `PropPage`를 공유하는 `propPagePool` 또한 만들었다.

그런데 구현 과정에서 기존의 `PropPage`를 구성하던 `ViewPager2`는 공유 pool을 사용할 수가 없어서 `RecyclerView`와 `PageSnapHelper`로 전환하였다.

## 결과

`ViewHolder`가 생성될 때에 `onCreateViewHolder`가 호출된다. 해당 메소드가 호출되는 횟수를 세어 보니 다음과 같았다.

||Pool 공유 전| Pool 공유 후|
|:-:|:-:|:-:|
|`PropPage` 생성|18|12|
|`Prop` 생성|45|30|

불필요한 `ViewHolder` 생성 및 레이아웃 inflation을 33.3% 억제하였다.

![fast-scroll.gif](/assets/images/fast-scroll.gif)

> 처음 스크롤할 때에 보이던 버벅임이 사라졌다.

## 결론

안드로이드는 뷰가 너무 어렵다.

가로 스크롤 뷰와 세로 스크롤 뷰가 중첩된 레이아웃에서 터치 방향 때문에 조작에 답답함을 겪는 경우가 있다(안쪽 컨텐츠를 가로 스크롤하려고 넘겼는데 자꾸 세로 스크롤로 인식된다든가). 이 또한 해결하였으나 너무 졸려서 다음 포스팅으로 미룬다...
