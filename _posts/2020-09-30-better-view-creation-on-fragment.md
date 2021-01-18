---
title: "매일 반복되는 onCreateView, 어떻게 안 될까요"
summary: "onCreateView 코드 간단하게 만들어보기."
date: 2020-09-30 10:19:25 +0900
categories:
   - dev
---

## 들어가며

~~~kotlin
override fun onCreateView(
    inflater: LayoutInflater,
    container: ViewGroup?,
    savedInstanceState: Bundle?
): View? {
    return inflater.inflate(R.layout.info_fragment, container, false).apply {
        initializeView(this)
    }
}
~~~

Fragment에서 뷰를 생성하고 초기화하는 코드이다.

[데이터 바인딩](https://developer.android.com/topic/libraries/data-binding?hl=ko)과 함께하면 아래와 같다.

~~~kotlin
override fun onCreateView(
     inflater: LayoutInflater,
     container: ViewGroup?,
     savedInstanceState: Bundle?
 ): View? {
     return MyFragmentBinding
         .inflate(inflater, container, false)
         .apply { vm = myViewModel }
         .apply { lifecycleOwner = this@MyFragment }
         .apply { initializeView(root) }
         .root
 }
~~~

코드가 길다. 이렇게 바꿔 보자:

~~~kotlin
override fun onCreateView(viewCreator: ViewCreator) =
    viewCreator<MyFragmentBinding> {
        initializeView(root)
        vm = myViewModel
    }
~~~

## 부모에게 떠넘기기

안드로이드는 자바의 상속 기능을 제대로 활용한다. 어떠한 클래스에서 반복적으로 일어나는 일이 있다면, 이를 해당 클래스의 부모 클래스가 처리하도록 하면 모든 자식 클래스는 일을 덜게 된다.

위의 코드에서, 뷰모델을 설정하는 부분과 `initializeView()`를 호출하는 부분을 제외하면 오직 `MyFragmentBinding` 부분, 즉 바인딩 클래스만 달라진다.

예시를 들어 보자면, `FirstFragment`의 `onCreateView`는 다음과 같다.

~~~kotlin
override fun onCreateView(
     inflater: LayoutInflater,
     container: ViewGroup?,
     savedInstanceState: Bundle?
 ): View? {
     return FirstFragmentBinding
         .inflate(inflater, container, false)
         .apply { vm = firstViewModel }
         .apply { lifecycleOwner = this@FirstFragment }
         .apply { initializeView(root) }
         .root
 }
~~~

`SecondFragment`의 `onCreateView`는 다음과 같다.

~~~kotlin
override fun onCreateView(
     inflater: LayoutInflater,
     container: ViewGroup?,
     savedInstanceState: Bundle?
 ): View? {
     return SecondFragmentBinding
         .inflate(inflater, container, false)
         .apply { vm = secondViewModel }
         .apply { lifecycleOwner = this@SecondFragment }
         .apply { initializeView(root) }
         .root
 }
~~~

거의 똑같이 생겼다. 겹치는 부분은 다음과 같다:

~~~kotlin
override fun onCreateView(
     inflater: LayoutInflater,
     container: ViewGroup?,
     savedInstanceState: Bundle?
 ): View? {
     return TheFragmentBinding
         .inflate(inflater, container, false)
         .apply { lifecycleOwner = this@TheFragment }
         .root
 }
~~~

해당 부분을 부모 클래스에게 맡길 것이다.

## 부모 덕 보기

부모 클래스에게 뷰 생성 작업을 맡기는 이유는, 10줄이나 되는 의미없는 코드를 자식 클래스에서 제거하기 위함이다.

부모 클래스가 뷰를 생성하기 위해 자식으로부터 알아야 하는 것은 바인딩 클래스(위의 코드에서 `TheFragmentBinding`으로 나타난)이다. 해당 클래스만 알면 자식 대신 `inflate()` 호출하고 작업을 이어나갈 수 있다.

`onCreateView`에서 자식에게 딱히 인자를 통해 정보를 넘겨줄 필요도 없다.

따라서 부모 클래스는 자식 클래스에게 인자를 세 개나 던져주고는 뷰를 생성하라고 하지 말고, 단지 자식에게 바인딩 클래스만 알려달라고 하는 것이 바람직하다.

이를 종합하면 대략 이런 모양이 나온다:

~~~kotlin
override fun onCreateView(viewCreator: ViewCreator) =
    viewCreator<TheFragmentBinding> {
        initializeView(root)
        vm = viewModel
    }
~~~

부모는 (바인딩 타입을 제외하고) 뷰 생성에 필요한 모든 정보가 들어 있는 `viewCreator`를 넘겨주고, 자식은 이를 받아 바인딩 클래스를 명시하여 줌으로서 뷰 생성에 필요한 모든 정보가 모이게 된다.

또한 함께 넘겨주는 함수형 인자로 뷰 생성 직후에 특정 작업을 수행할 수 있다.

## 구현

`BaseClass`에서 새로운 원형의 `onCreateView`를 정의한다.

~~~kotlin
protected open fun onCreateView(viewCreator: ViewCreator): View? = null
~~~

자식 클래스가 이를 오버라이드하지 않는 경우에는 호출시 기본으로 `null`을 반환한다.

그리고 원래의 `onCreateView`를 오버라이드한다.

~~~kotlin
override fun onCreateView(
    inflater: LayoutInflater,
    container: ViewGroup?,
    savedInstanceState: Bundle?
) = onCreateView(ViewCreator(this, inflater, container))
    ?: super.onCreateView(inflater, container, savedInstanceState)
~~~

먼저 위에서 새로 정의한 `onCreateView`를 호출해본 뒤, 자식이 이를 오버라이드하지 않은 것으로 판단되면(= `null`이 반환되면) `super.onCreateView`를 호출한다.

가장 중요한 `ViewCreator`는 다음과 같다.

~~~kotlin
class ViewCreator(
    val fragment: BaseFragment,
    val inflater: LayoutInflater,
    val container: ViewGroup?
) {

    inline operator fun <reified T: ViewDataBinding> invoke(also: T.() -> Unit = {}) =
        createView(also)

    inline fun <reified T: ViewDataBinding> createView(also: T.() -> Unit = {}): View {
        val inflateMethod = T::class.java.getMethod(
            "inflate",
            LayoutInflater::class.java,
            ViewGroup::class.java,
            Boolean::class.java
        )

        return (inflateMethod.invoke(null, inflater, container, false) as T)
            .apply { lifecycleOwner = fragment }
            .apply { also(this) }
            .root
    }
}
~~~

`ViewCreator`는 객체 생성 시점이 아닌 자식에게 호출되는 시점에서 `T: ViewDataBinding`의 정체를 알게 된다.

`()`를 통해 객체를 직접 호출하면 이는 아래 메소드 호출로 이어진다:

~~~kotlin
inline fun <reified T: ViewDataBinding> createView(also: T.() -> Unit = {}): View
~~~

타입 파라미터로부터 클래스를 추출해내기 위해 `reified` qualifier를 사용하였다. 그렇게 추출된 클래스로부터 reflection을 사용해 `"inflate"` 메소드를 얻어내어 뷰를 생성하였다.

뷰 생성이 끝나면 `also` 인자로 넘어온 함수를 실행한 다음 만들어진 뷰를 반환한다.

## 마치며

줄일 수 있는 코드는 줄이자. 물론 줄이지 않고 직접 만들어 호출하는 것이 직관적일 경우도 있다. 상황에 따라 적절한 판단을 내리도록 하자.

## Reference

- https://developer.android.com/topic/libraries/data-binding?hl=ko
- https://sungjk.github.io/2019/09/07/kotlin-reified.html
