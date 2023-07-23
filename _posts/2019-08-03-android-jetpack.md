---
title: "[Android Jetpack] DataBinding과 Navigation 둘러보기"
date: 2019-08-03 04:41:45 +0900
excerpt: "구글 샘플 앱 구경하다가 발견한 것들. 나온지 1년 넘은 시점에서 쓰는 뒷북"
header:
    overlay_image: /assets/images/header-jetpack.png
categories:
    - dev
tags:
    - kotlin
    - android
    - jetpack
---

> *정리되지 않은 상태로 작성한 글이라 틀린 점이 많을 수 있습니다! 발견하는 대로 수정하겠습니다.*

[클린 아키텍처]()를 적용하고 나서 다른 적절한 예시가 있는지 찾아보던 도중 구글의 [샘플 앱](https://github.com/googlesamples/android-architecture/tree/usecases)을 발견했다.

README에 따르면 아래와 같은 Architecture Component를 사용했다고 한다.
- ViewModel
- LiveData
- Data Binding
- Navigation
- Room

저기서 ViewModel과 LiveData는 이미 잘 사용중이다.

Data Binding은 예전에 한번 예제를 만들어 보았는데 딱히 필요를 못 느껴서 사용하지 않고 있었다.

Navigation은 들어만 보았는데 이게 무엇인지는 방금 알았다.

## Android Jetpack

사실 나온지는 한참 되었다.

2018년에 Google I/O에서 발표되었다.

![jetpack-hero](/assets/images/jetpack-hero.png)

[Android Jetpack](https://developer.android.com/jetpack?hl=ko)이 뭐냐면,

> Jetpack은 개발자가 고품질 앱을 손쉽게 개발할 수 있게 돕는 라이브러리, 도구, 가이드 모음입니다.

라고 한다.

> Jetpack은 플랫폼 API 번들에서 해제된 androidx.* 패키지 라이브러리로 구성됩니다.

라고도 하는데, androidx라고 하니까 무언가 익숙하다.

~~~xml
<androidx.constraintlayout.widget.ConstraintLayout
        xmlns:android="http://schemas.android.com/apk/res/android"
        ...
~~~

항상 쓰던 androidx가 여기서 나온거였다.

아무튼, 구글이 자랑하기로는 `백그라운드 작업, 탐색, 수명 주기 관리 등 지루한 작업을 관리해줍니다.`란다.

점점 편리한 것에 대한 의존성이 높아지는 느낌이지만 어차피 지금도 안드로이드라는 플랫폼에 크게 의지하는 모양새이니 개발만 더 편해지고 좋다. 야호

그래서 Data Binding은 무엇이고 Navigation은 무엇이냐 하면은..


## Data Binding

~~~kotlin
findViewById<TextView>(R.id.sample_text).apply {
       text = viewModel.userName
   }
~~~

데이터 바인딩 라이브러리는 위같은 코드로부터 우리를 해방시켜준다.

모양새가 .Net쪽의 xaml을 닮기도 했다.

사용법은 조금 복잡하지만 이로 인해 xml과 뷰모델간의 양방향 바인딩이 이루어지면서 참된 MVVM을 구성할 수 있다.

![mvvm](https://i.imgur.com/hGnEKvv.png)
> 안드로이드에서 true-MVVM이라니...ㅠ

위의 샘플 앱 예제에서 몇 가지 예시를 가져왔다.

~~~xml
    <data>
        ...
        <variable
            name="task"
            type="com.example.android.architecture.blueprints.todoapp.data.Task" />

        <variable
            name="viewmodel"
            type="com.example.android.architecture.blueprints.todoapp.tasks.TasksViewModel" />
    </data>
      ...
      <LinearLayout
          ...
          android:onClick="@{() -> viewmodel.openTask(task.id)}">
      ...
~~~

외부에서 뷰모델에 접근해 뷰를 간접적으로 조작하는 코드이다.

이렇게 xml에 귀찮은 UI 것들을 덜어낼 수 있다. 더이상 프래그먼트에 원시적인 UI 조작문을 안 써도 된다.

사용법은 다음과 같다.

1. xml을 잘 만들어준다. 주입받을 변수를 `<data>` 아래에 선언해준다.

2. 해당 xml의 이름으로 데이터 바인딩 클래스가 만들어진다. 만약 xml 이름이 tasks_frag.xml이면 TasksFragBinding이 된다.

3. xml이 필요한 프래그먼트의 onCreateView에서 해당 바인딩 클래스의 inflate를 호출하며, 이때 위에서 선언한 변수를 대입해준다.

이렇게 하면 런타입 양방향 데이터 바인딩이 완성된다.


## Navigation

iOS에는 스토리보드가 있다.

![storyboard](https://i.imgur.com/uu0j6rg.png)

안드로이드에도 비슷한 것이 있는데, Jetpack의 Navigation이다.

![navigation](https://i.imgur.com/teYViGj.png)

설명이 더 필요하지 않을 것 같다..

다음과 같이 쓰인다.

1. 네비게이션 그래프를 작성한다.

~~~xml
<fragment
    android:id="@+id/task_detail_fragment_dest"
    android:name="com.example.android.architecture.blueprints.todoapp.taskdetail.TaskDetailFragment"
    android:label="Task Details">
    <action
        android:id="@+id/action_taskDetailFragment_to_addEditTaskFragment"
        app:destination="@id/add_edit_task_fragment_dest" />
    <argument
        android:name="taskId"
        app:argType="string" />
    <action
        android:id="@+id/action_taskDetailFragment_to_tasksFragment"
        app:destination="@id/tasks_fragment_dest" />
~~~

예시는 하나의 목적지에 대한 정의이다.

해당 목적지에 진입할 때에 넘겨줄 인자와 다른 목적지로 넘어가는 action 등을 포함한다.

위의 인자는 해당 프래그먼트에서
~~~kotlin
private val args: TaskDetailFragmentArgs by navArgs()
~~~
이렇게 가져올 수 있다.

2. 베이스가 될 액티비티의 레이아웃에 호스트 프래그먼트를 추가해준다. 이때 위에서 정의한 네비게이션 그래프를 사용한다.

~~~xml
<fragment
    android:id="@+id/nav_host_fragment"
    android:name="androidx.navigation.fragment.NavHostFragment"
    ...
    app:defaultNavHost="true"
    app:navGraph="@navigation/nav_graph" />
~~~

3. 베이스 액티비티에서 네비게이션 설정을 마무리해준다.

~~~kotlin
val navController: NavController = findNavController(R.id.nav_host_fragment)

appBarConfiguration = AppBarConfiguration
        .Builder(R.id.tasks_fragment_dest, R.id.statistics_fragment_dest)
        .setDrawerLayout(drawerLayout)
        .build()

setupActionBarWithNavController(navController, appBarConfiguration)

findViewById<NavigationView>(R.id.nav_view).setupWithNavController(navController)
~~~

호스트 프래그먼트와 연관된 네비게이션 컨트롤러를 찾은 뒤 이를 각각 액션바, 네비게이션 뷰와 이어준다.

그럼 끝이다. 프래그먼트 생성, 전환, 관리 알아서 다 해준다 :)


## 결론

이렇게 좋은걸 모르고 있었다니 아쉽다.

## 참고한 글

- [android-architecture](https://github.com/googlesamples/android-architecture/tree/usecases)
- [Android Jetpack](https://developer.android.com/jetpack?hl=ko)
- [Data Binding](https://developer.android.com/topic/libraries/data-binding/?hl=ko)
- [Navigation](https://developer.android.com/guide/navigation/?hl=ko)
