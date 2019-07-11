---
title: "[Kotlin Android] Fragment 전환할 때에 replace()를 대체할 방법"
date: 2019-07-12 04:24:57 +0900
excerpt: >프래그먼트 매니저를 사용해서 프래그먼트를 교체할 수 있는 간단한 방법이 두 가지 있다.
replace()와, show() + hide()이다.
categories:
    - dev
tags:
    - kotlin
    - android
    - fragment
---

안드로이드에서 많이 쓰이는 디자인 중 하나는 tab based, 즉 탭 기반 방식이다.

![탭 기반 앱](/assets/images/tab-based-app.jpg)

> 대표적인 탭 기반 애플리케이션인 유튜브. 사진은 4년 전 것이긴 하지만 지금도 탭 기반인 건 변함이 없다.
카카오톡의 경우도 탭 기반 앱이다.

거의 대부분의 앱이 이렇게 디자인되었으며, RecyclerView와 같은 목록 형태의 컨텐츠와 탭의 조합은 최고이다.

안드로이드에서 tab을 구현하는 방법 중 하나는 BottomNavigationView를 이용하는 것이다.
이는 구글이 요즘 밀어주는 [Material](https://material.io/design/)의 컴포넌트 중 하나이다.

![material](https://storage.googleapis.com/spec-host-backup/mio-design%2Fassets%2F1h5m0BGM_LfXii-6hO4JisEM0bcWvG0Gl%2Fbottomnav-usage-1.png)
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
