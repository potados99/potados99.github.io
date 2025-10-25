---
title: "[Kotlin Android] Fragment 전환할 때에 replace()를 대체할 방법"
date: 2019-07-12 04:24:57 +0900
excerpt: "프래그먼트 매니저를 사용해서 프래그먼트를 교체할 수 있는 간단한 방법이 두 가지 있다. replace()와, show() + hide()이다."
categories:
    - dev
tags:
    - kotlin
    - android
    - fragment
---

안드로이드에서 많이 쓰이는 디자인 중 하나는 tab based, 즉 탭 기반 방식이다.

![탭 기반 앱](/assets/images/M8YU8jh.jpg)

> 대표적인 탭 기반 애플리케이션인 유튜브. 사진은 4년 전 것이긴 하지만 지금도 탭 기반인 건 변함이 없다.
카카오톡의 경우도 탭 기반 앱이다.

거의 대부분의 앱이 이렇게 디자인되었으며, RecyclerView와 같은 목록 형태의 컨텐츠와 탭의 조합은 최고이다.

안드로이드에서 tab을 구현하는 방법 중 하나는 BottomNavigationView를 이용하는 것이다.
이는 구글이 요즘 밀어주는 [Material](https://material.io/design/)의 컴포넌트 중 하나이다.

![material](/assets/images/RqcHxcB.png)
> 이렇게 생겼다. 그냥 탭이다.

## 탭 전환하기

서론이 길었는데, 아무튼 탭이 있어야 하고, 탭 사이의 전환도 있어야 한다.

안드로이드에는 Fragment라는 좋은게 있으니까, 하나의 프래그먼트가 하나의 탭을 대표하도록 만들면 된다.

그리고 탭이 눌리면 그에 맞는 프래그먼트를 띄워주면 된다.

이 프래그먼트가 위치할 곳은 메인 액티비티에 있는 FrameLayout이다.

~~~xml
<FrameLayout
        android:layout_width="0dp"
        android:layout_height="0dp"
        ...constraints...
        android:id="@+id/fragment_container">
</FrameLayout>
~~~

그리고 어떤 탭이 눌렸을 때에 프래그먼트를 바꾸도록 리스너를 등록해주면 된다.

문제는 여기서 일어난다.

다음은 프래그먼트를 바꾸는 코드이다.

~~~kotlin
val fragment = ...

supportFragmentManager
.beginTransaction()
.replace(R.id.fragment_container, fragment)
.commit()
~~~

바뀌기는 잘 바뀌는데 두 가지 문제가 있었다.

하나는 BottomSheet의 상태가 보존되지 않는 것이었고, 다른 하나는 AppBarLayout과 RecyclerView, 그리고 BottomNavigationView를 사용하는 프래그먼트에서 리사이클러뷰가 끝까지 스크롤이 안되는 문제였다.

![스크롤이 안돼..](/assets/images/POLVrQy.png)
> 더이상 스크롤이 안된다. 아직 끝이 아닌데..

## 삽질

맨 처음 앱을 띄우고 아무것도 안한 상태, 즉 프래그먼트를 처음 올린 상태에서는 스크를이 끝까지 잘 된다.

그런데 다른 프래그먼트로 교체 -> 다시 첫번쨰 프래그먼트로 교체의 과정을 지나면 레이아웃이 살짝 버벅이면서 저렇게 스크롤이 안되는 상태가 되었다.

### 분석

프래그먼트의 `onResume`에 리사이클러뷰 어댑터의 데이터 소스(LiveData)를 업데이트하는 코드를 넣으면 생명주기의 다른 콜백이 아닌 `onResume`만 실행될 때에(예를 들어 새로운 액티비티를 띄웠다가 닫을 때) 문제가 해결되는 것을 발견했다.

특이한 점이 하나 있었다.

프래그먼트를 완전히 교체하여 `onPause` -> ... -> `onDetach`를 거쳐 다시 액티비티에 붙으면서 `onAttach` -> ... -> `onResume`로 진행하는 과정에서는 `onResume`이 분명히 실행되는데도 불구하고 그렇지 않은 것처럼 동작했다.

### 시도 1

원인은 알아내지 못했다. 이것저것 실험해보면 알 수도 있을테지만 사실 귀찮다.

일단 프래그먼트를 교체하기 전에는 문제가 발생하지 않는다.
~~~kotlin
.replace(R.id.fragment_container, fragment)
~~~

저 `replace`가 일어나기 전까지는 괜찮은 것이다.

그래서 [스택 오버플로우](https://stackoverflow.com/a/45301078)를 잘 뒤져서 프래그먼트를 바꾸는 다른 방법을 찾아냈다.

~~~java
FragmentTransaction fragmentTransaction = mFragmentManager.beginTransaction();

Fragment curFrag = mFragmentManager.getPrimaryNavigationFragment();
if (curFrag != null) {
    fragmentTransaction.detach(curFrag);
}

Fragment fragment = mFragmentManager.findFragmentByTag(tag);
if (fragment == null) {
    fragment = new YourFragment();
    fragmentTransaction.add(container.getId(), fragment, tag);
} else {
    fragmentTransaction.attach(fragment);
}

fragmentTransaction.setPrimaryNavigationFragment(fragment);
fragmentTransaction.setReorderingAllowed(true);
fragmentTransaction.commitNowAllowingStateLoss();
~~~

현재 떠있는 프래그먼트를 가져와서 `detach`한다. 그리고 새로 집어넣을 프래그먼트의 레퍼런스를 잡아서 `attach`한다.

사실 replace와 별반 다르지 않다. 프래그먼트를 지우지 않고 잠깐 떼어낸다는 점이 다를 뿐이다.

> using show hide instead of attach detach works better. It won't restart fragment's lifecycle – [osrl](https://stackoverflow.com/users/1120126/osrl)

스택 오버플로우에 이런 댓글이 있었다.

생명주기를 보존하고 빠른 전환을 하기 위해 `show`와 `hide`를 사용할 수 있다.
프래그먼트에 손대지 않고 잠깐 숨겨주는 방법으로 넘어가기로 했다.

### 시도 2

`replace`의 기본 동작 다음과 같다.
> 해당 컨테이너의 id로 등록된 모든 fragment를 지우고 새 fragment를 추가한다.

`remove`와 `add`를 거치는 동안에는 프래그먼트의 생명주기가 새로 시작되므로 모든 초기화가 새로 일어난다. 이는 원하는 동작이 아니다.

프래그먼트가 전환되는 동안에도 메모리에 보존되어야 하며, 전환이 일어나도 초기화가 다시 일어나지 않아야 한다.

`FragmentTransaction.show()`와 `FragmentTransaction.hide()`를 사용하면 된다.

먼저 사용할 프래그먼트들을 모두 추가해준다.

~~~kotlin
val transaction = supportFragmentManager.beginTransaction()
transaction.add(fragment)
...
~~~

그리고 사용할 프래그먼트만 `show`하고 나머지는 `hide`한다.

~~~kotlin
transaction.show(fragmentToUse)
transaction.hide(fragmentNotForUse)
...
transaction.commit()
~~~

프래그먼트가 숨겨져도 마치 최상단에 있는 것과 같이 행동한다.
UI만 사라졌을 뿐이지 생명주기상으로는 `onPause`도 실행되지 않은 상태이다.
따라서 프래그먼트의 정보가 그대로 보존됨은 물론이고, 탭 사이에서 아주 빠른 전환이 가능해진다.

## 목표 달성

처음부터 목표를 세우고 한 건 아니지만, 어쩌다 보니 마음에 안 들었던 부분이 해결되었다.

프래그먼트를 잠시 숨기는게 만능은 아니다. 하지만 이 상황에서는 적절한 해법인 것 같다.

> 모든 상황에 적절한 해답은 없지만 특정 상황에 맞는 해답은 있다.
