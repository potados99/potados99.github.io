---
title: "구멍 뚫린 뷰 만들기"
excerpt: "썼다 지운다...널 PorterDuff.Mode.CLEAR해"
date: 2020-12-28 10:41:15 +0900
category: dev
---

![hole-in-a-view.png](/assets/images/VDBwlUO.png)

> 완성된 모습

## 들어가며

QR코드 스캔 앱들을 보면 가운데만 화면 중앙부를 제외한 곳은 어둡게 처리된 것을 볼 수 있다. 스캐닝 앱의 필수요소 같은 것이다.

지금 작업중인 프로젝트에서 대기표를 스캔하는 기능을 추가하게 되었는데, 저 구멍뚫힌 뷰(앞으로는 프레임이라 할게요)가 없으니 영 허전하였다.

그래서 만들기로 마음은 먹었는데, 가운데만 뚫힌 경우라 평소에 자주 볼 수 있는 모습은 아니었다.

## 어떻게 구현할까

궁극적으로는 `View`의 `onDraw` 메소드를 override하면 뷰에 관해서는 거의 모든 일을 할 수 있다. 다만 뷰를 직접 그리는 것에 거부감이 있어 더 간단한 방법이 없나 하고 찾아 보았는데... 없었다.

아무튼 그래서 `onDraw`에다가 구멍 뚫는 코드를 집어넣게 됐다.

## 아이디어

안드로이드에서 화면에 무언가를 그리는 행위는 `Canvas`에 `Paint`로 그리는 행위라고 할 수 있다. `Paint`에는 사각형이 들어갈 수도, 직선이 들어갈 수도 있다.

그런데, 그리는 것 말고 지우는 것도 할 수 있다! [PorterDuff](https://sodocumentation.net/ko/android/topic/377/porterduff-모드) 모드를 `clear`로 설정해주면 된다. 요렇게:

~~~kotlin
private val eraser = Paint().apply {
    isAntiAlias = true
    xfermode = PorterDuffXfermode(PorterDuff.Mode.CLEAR)
}
~~~

> "Porter Duff"자체는 토마스 포터 (Thomas Porter)와 톰 더프 (Tom Duff)가 쓴 종이의 이름을 딴 알파 합성 기술 입니다.    
- [SO Documentation](https://sodocumentation.net/ko/android/topic/377/porterduff-모드)

PorterDuff는 이미지 두 개를 겹쳐 블렌딩하는 기술이다. `src`와 `dst` 두 개의 이미지에 대한 이런저런 합성을 할 수 있는데, `PorterDuff.Mode.CLEAR`는 그냥 지워버리는 옵션이다(*Destination pixels covered by the source are cleared to 0*).

## onDraw

자 그럼 구현을 해보자. 뷰에 구멍도 뚫고, border도 그릴 것이다.

시작은 간단하게 만들었다.

~~~kotlin
override fun onDraw(canvas: Canvas) {
    super.onDraw(canvas)

    drawBorder(canvas)
    drawHole(canvas)
}
~~~

`drawBorder`와 `drawHole`에게 할 일을 떠맡겼다. `drawBorder`부터 보자.

~~~kotlin
private fun drawBorder(canvas: Canvas) {
    path.rewind()
    path.addRoundRect(
        rect.apply {
            setRect(4f/*border width*/)
        },
        holeBorderRadius,
        holeBorderRadius,
        Path.Direction.CW
    )

    canvas.drawPath(path, stroke)
}
~~~

이 메소드는 `path를 준비`한 뒤, `canvas에 path를 슥삭`한다. path는 속성으로 선언해 놓았다:

~~~kotlin
private val path = Path()
~~~

> onDraw 안에서 객체 생성 하지 말라고 warning이 뜬다. 그래서 속성으로 두고 재활용했다.

`path.rewind()`로 내용을 비우고, `path.addRoundRect()`로 사각 border를 추가한다. 뭔가 인자가 많다. 원형을 보자.

~~~kotlin
public void addRoundRect(@NonNull RectF rect, float rx, float ry, @NonNull Direction dir)
~~~

첫째 인자는 추가할 사각형, 다음 두개는 각각  x-radius와 y-radius, 마지막은 path를 그릴 방향이다. 방향이라는게 뭔가 해서 찾아보니 주석에 이렇게 써 있다.

~~~kotlin
/**
 * Specifies how closed shapes (e.g. rects, ovals) are oriented when they
 * are added to a path.
 */
~~~

딱히 중요하지 않은 듯 싶으니 `CW`(시계방향)으로 주기로 했다.

다시 돌아와서, 첫 번째 인자부터 보자.

~~~kotlin
rect.apply {
    setRect(4f/*border width*/)
},
~~~

`rect`가 등장한다. 이 녀석도 위의 `path`와 같이 속성으로 두었다.

~~~kotlin
private val rect = RectF()
~~~

`addRoundRect`를 호출하기 전에, `rect`에 대해 `setRect()`를 호출한다. 이 메소드는 `rect` 의 위치와 크기를 적절하게 맞춰 준다.

~~~kotlin
private fun setRect(offset: Float = 0f) {
    rect.set(
        ((width - holeWidth)/2) - offset,
        ((height - holeHeight)/2) - offset,
        ((width - holeWidth)/2 + holeWidth) + offset,
        ((height - holeHeight)/2 + holeHeight) + offset
    )
}
~~~

이렇게 생겼다. `rect.set()`에 인자를 4개 넘겨주는데, 각각 `left`, `top`, `right`, `bottom`이다. `rect`를 화면 중앙에 위치한 `holeWidth` X `holeHeight` 사각형으로 설정한다. `holeWidth`와 `holeHeight`는 `AttributeSet`으로부터 넘겨받은 속성이다.

인자로 `offset`을 넘겨줄 수 있는데, 양수이면 사각형이 커지고 음수이면 작아진다. `offset`은 각 변에 적용된다.

두번째와 세번째 인자로 들어가는 `holeBorderRadius` 또한 xml에 지정한 `AttributeSet`을 통해 받아 속성으로 가져다 놓은 값이다.

네번째 인자는 아까 언급한대로 `CW`로 지정했다.

여기까지 `path`를 준비하는 과정이 끝났다. 이제 이걸 가지고 `canvas`에 그린다.

~~~kotlin
canvas.drawPath(path, stroke)
~~~

`stoke`은 이렇게 생겼다:

~~~kotlin
private val stroke = Paint().apply {
    isAntiAlias = true
    strokeWidth = 4f
    color = Color.WHITE
    style = Paint.Style.STROKE
}
~~~

두께 4.0짜리 하얀 붓(?)이다.

`drawPath`까지 끝나면 화면 중앙에 두께 4, `holeBorderRadius` 둥글기와 `holeWidth`, `holeHeight` 크기를 가지는 네모 윤곽선이 그려진다.

다음은 `drawHole` 호출이다. 구현은 아래와 같다:

~~~kotlin
private fun drawHole(canvas: Canvas) {
    canvas.drawRoundRect(
        rect.apply {
            setRect()
        },
        holeBorderRadius, holeBorderRadius, eraser
    )
}
~~~

여기서는 위에서 border를 그릴 때와는 다르게, `canvas.drawPath`가 아닌 `canvas.drawRoundRect`를 호출한다. 인자는 `path`에다가 사각형을 추가할 때와 거의 비슷하다. 다만 여기에서는 `setRect()`에 아무 인자도 넘겨주지 않았다.

사각형 `path`를 설정할 때에는 `setRect()`의 `offset` 인자로 `4f`를 넘겨 주었다. 이는 border의 크기를 border 두께만큼 크게 만듦으로써(border의 두께는 안쪽으로 자란다) 구멍 뚫린 영역을 침범하지 않게 하기 위함이었다.

## 마치며

`Canvas`를 직접 다루게 될 줄이야...

## References

- https://sodocumentation.net/ko/android/topic/377/porterduff-모드
