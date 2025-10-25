---
title: "ViewPager2 좋다."
summary: "ViewPager2 간단하게 둘러보았습니다."
date: 2020-09-14 22:01:51 +0900
category: dev
---

> ViewPager2에 대한 설명은 생략하고, 사용하면서 느낀 점만 써 보았습니다.

## 들어가며

컨텐츠를 세로만으로 표시하기 벅찰 때, 또는 카드 형식으로 평행하게 컨텐츠를 배치하고 싶을 때, `ViewPager`를 쓰면 좋다.

## ViewPager vs ViewPager2

`ViewPager`는 스와이프 할 수 있도록 뷰나 프래그먼트를 띄운다.

비교적 최근인 올해 4월에 `ViewPager2` 1.0.0 버전이 출시되었다.

[문서](https://developer.android.com/training/animation/vp2-migration?hl=ko)에 의하면 `ViewPager`에 비해 달라진 점은 다음과 같다.

#### 세로 방향 지원

`RecyclerView`와 `SnapHelper` 없이도 세로로 넘기는 스와이프(스크롤 아님)뷰를 만들 수 있다.

#### RTL 페이징 지원

RTL 페이징은 아직 써본 적이 없어 잘 모르겠다.

#### 프래그먼트 컬렉션 런타임에 동적으로 수정

프래그먼트 컬렉션을 동적으로 수정할 수 있다는 부분은 솔깃했다. 이전에 `ViewPager`를 쓰려면 프래그먼트를 스폰하는 코드를 관리하며 생명주기와 인자, 퍼포먼스까지 신경써야 했는데, 어떻게 개선되었을 지 궁금하다(아직 안 써봤다).

#### DiffUtil 지원

`RecyclerView`가 지원하는을 `DiffUtil`을 제공한다. `RecyclerView` 기반으로 빌드되었기 때문이다.

## `RecyclerView` 기반

`ViewPager2`는 `RecyclerView`를 토대로 만들었다고 한다. 덕분에 가장 좋은 점이라 하면, 느낀 바 중에는 **`ViewPager2`를 `RecyclerView`로 바꿀 때에 편했다는 것이다.**

`ViewPager2`는 `RecyclerView.Adapter`를 사용할 수 있다. 물론 `PagerAdapter`도 사용할 수 있다.

`RecyclerView.Adapter`를 사용하는 경우, 특정 뷰에 한정되는 코드 몇 줄(Page Transformer 같은)을 제외하면 `<androidx.viewpager2.widget.ViewPager2>`와 `<androidx.recyclerview.widget.RecyclerView>` 사이의 전환이 자유로웠다.

## 마치며

안드로이드가 점점 발전하고 있다. 공부하자.

## Reference

- https://developer.android.com/jetpack/androidx/releases/viewpager2?hl=ko
