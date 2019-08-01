---
title: "[Kotlin Android] Clean Architecture 도입하기"
date: 2019-08-01 18:31:38 +0900
excerpt: "이제 콩가루 코드는 그만 짜자... 안드로이드에 클린 아키텍처 도입한 후기"
header:
    overlay_image: /assets/images/source-codes.jpg
categories:
    - dev
tags:
    - kotlin
    - android
    - architecture
---

모바일 환경은 기기 특성상 뷰를 구성하고 프로그램을 짜는 것에 많은 제약이 따른다.

> 데스크톱 앱에는 대부분 데스크톱 또는 프로그램 런처로부터의 단일 진입점이 있으며 하나의 모놀리식 프로세스로 실행됩니다.
반면에 Android 앱의 구조는 훨씬 복잡합니다. 일반적인 Android 앱은 activity, fragment, 서비스, 콘텐츠 제공업체, broadcast receiver를 비롯하여 여러 앱 구성요소를 포함합니다.    
*구글 앱 아키텍처 가이드*

구글도 인정했다. 엄청 복잡하다.

안드로이드를 예시로 들자면 서버에서 목록을 하나 받아와서 표시하는 작업을 할 때에 다음을 생각해야 한다:
- 액티비티와 프래그먼트, 뷰모델의 생명주기에 따라 어떤 처리를 해야 하나
- 데이터는 어디에서 가공해서 어떻게 가져올 것인가
- UI 로직은 어디에 배치할까
- 데이터 바인딩은 어떻게 할까

되는 대로 짜다가는 자칫 액티비티 또는 프래그먼트가 매우 비대해지고 메소드들도 알아볼 수 없게 되어 분석이나 최적화는 물론 디버그마저 불가능해지는 상황이 올 수 있다.

위는 안드로이드 앱 개발을 시작하면서 느낀 어려움들이다. 이를 해결하기 위해 안드로이드 best practice와 적절한 아키텍처를 주욱 찾아봤다.


## Clean Architecture

많고 많은 아키텍처([Hexagonal Architecture](http://alistair.cockburn.us/Hexagonal+architecture), [Onion Architecture](http://jeffreypalermo.com/blog/the-onion-architecture-part-1/), [Screaming Architecture](https://8thlight.com/blog/uncle-bob/2011/09/30/Screaming-Architecture.html), etc...) 중에서도 Clean Architecture를 선택한 이유는 아주 간단하다.

- 관련 글이 많다.
- 예제도 많다.

이 Clean Architecture는 2012년에 [Robert C. Martin](https://twitter.com/unclebobmartin)(엉클 밥)이 공개했다.

![clean-architecture](/assets/images/clean-architecture.png)

이 아키텍처의 목적은 다음을 달성하는 것이다:
- 프레임워크 독립성: 프레임워크가 라이브러리에 의존하지 않는다.
- 테스트 용이성 (Testability): 비즈니스 규칙은 UI, DB, 서버 등 외부와 무관하게 테스트 가능하다.
- UI 독립성: UI 변경이 시스템의 나머지 부분에 영향을 미치지 않는다.
- 데이터베이스 독립성: 데이터베이스를 다른 시스템으로 변경할 수 있다.
- 외부 기능 독립성: 비즈니스 규칙은 외부 세계에 대해 모른다.

보기만 해도 기분이 좋아지는 말들이다 :)

이 아키텍처를 안드로이드에 아주 멋지게 적용한 예시가 있다.


## Architecting android

[Fernando Cejas](https://fernandocejas.com)라는 사람이 작성한 Architecting Android라는 글 3부작이 있다.

각각 [2014년](https://fernandocejas.com/2014/09/03/architecting-android-the-clean-way/), [2015년](https://fernandocejas.com/2015/07/18/architecting-android-the-evolution/), [2018년](https://fernandocejas.com/2018/05/07/architecting-android-reloaded/)에 작성된 글로, 안드로이드에 Clean Architecture를 최초로 도입한 시점부터 피드백을 받아 개선된 현재까지의 기록을 예제와 함께 남겨놓으셨다.

![cejas-clean-architecture](/assets/images/cejas-clean-architecture.png)

> 안드로이드 클린 아키텍처 in Cejas way...

맨 밑의 Data 레이어는 Repository 패턴을 사용하며, 신뢰할 수 있는 단 하나의 데이터 소스 역할을 수행한다.

그 위의 Domain 레이어는 Data 레이어와 UI를 이어주는 역할을 수행한다. 애플리케이션 내에서 일어나는 모든 동작은 이 계층의 UseCase로 나타낼 수 있다. 예를 들어 목록을 새로고침하거나, 아이템을 지우는 것 등이 포함된다. UseCase는 사용자의 의도(UI 조작)에 따라 실행되어 Date 레이어와 소통하여 어떤 일을 하고 그 결과를 가져온다.

맨 위에 있는 UI 레이어는 MVVM 패턴을 사용한다. ViewModel은 UseCase를 호출하고 그 결과를 받아와 UI를 업데이트한다.

예제는 모두 코틀린으로 작성되었다. 코틀린의 기능들, 예를 들어 불변성, 간결함, 함수지향 등을 아주 제대로 활용하였다.

이에 깊게 감명을 받았는데 그중 몇 가지만 살펴보자면,

~~~kotlin
abstract class UseCase<out Type, in Params> where Type : Any {

    abstract suspend fun run(params: Params): Either<Failure, Type>

    fun execute(onResult: (Either<Failure, Type>) -> Unit, params: Params) {
        val job = async(CommonPool) { run(params) }
        launch(UI) { onResult.invoke(job.await()) }
    }
}
~~~

UseCase의 정의이다. Params 타입의 파라미터를 입력으로 받고 Type 타입의 결과물을 반환한다.

이때 그냥 반환하는 것이 아니라 백그라운드 스레드에서 run()을 수행한 뒤 그 결과를 가지고 onResult 콜백을 메인 스레드에서 실행한다.

자그마치 Monad, Coroutine, Function Parameter를 담고 있지만 매우 간결하게 표현되었다.


## 내 앱에 적용하기

현재 개발중인 앱에 (거의) 그대로 가져와 도입하였다. 혹시 보고계신다면 Thank you Fernando!

아래는 뷰모델 중 하나이다.

~~~kotlin
class ConversationListViewModel : BaseViewModel(), KoinComponent {

    /***********************************************************
     * UseCase
     ***********************************************************/
    private val getConversations: GetConversations by inject()


    val conversations = MutableLiveData<List<SmsThread>>()

    fun loadConversations() = getConversations(UseCase.None()) {
        it.either(::handleFailure, ::handleConversationList)
    }

    private fun handleConversationList(conversations: List<SmsThread>) {
        this.conversations.value = conversations
    }
}
~~~

사실 뷰모델에서 UseCase를 인자로 받고 적절한 ViewModelFactory를 사용해 객체화하는 것이 맞지만 Dagger를 사용하기는 부담스럽고 해서 Koin으로 가져다 박아버렸다.

UseCase 객체 대부분이 애플리케이션 생명주기 내내 떠있고 성격이 static하기 때문에 저렇게 했다.

해당 UseCase인 GetConversations은 아래처럼 생겼다.

~~~kotlin
class GetConversations(
    private val messageRepository: MessageRepository
) : UseCase<List<SmsThread>, None>() {

    override suspend fun run(params: None): Either<Failure, List<SmsThread>> =
        messageRepository.getSmsThreads()
}
~~~

메시지 저장소로부터 sms thread 목록을 가져와서 메인 스레드에서 onResult를 실행한다.

데이터를 가져오는 것 이상의 작업이 필요할 때에는 UseCase 아래의 Repository 아래에 또다른 Service 객체를 두었다.

가령 어떤 일을 수행해야 할 때에 이를 위한 UseCase를 실행하면 해당 call은 Repository를 거쳐 Service까지 이어진다.

해당 Service는 반환값으로 Either를 고집할 필요가 없으며 문제가 생기면 그냥 Throw 해버리면 된다. 아주 자유롭게 짤 수 있다.


## 결론

모든 상황에 적합한 아키텍처는 없지만 적어도 지금 개발중인 앱에는 적절한 듯 하다.

여러 사람이 언급하고 이미 널리 쓰이는 데에는 이유가 있다. 이미 검증된 아키텍처이니(적어도 기본적인 설계 원칙은 준수) 안심하고 가져다가 써도 된다.

다만 초반에 학습하기가 조금 어렵다. 친절하게 설명도 해주고 예제도 올려주신 Fernando Cejas님 다시한번 감사..


## 참고한 글

- [Robert C. Martin - The Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [The Clean Architecture (번역)](https://blog.coderifleman.com/2017/12/18/the-clean-architecture/)
- [Fernando Cejas - Architecting Android...The clean way?](https://fernandocejas.com/2014/09/03/architecting-android-the-clean-way/)
- [Fernando Cejas - Architecting Android...The evolution](https://fernandocejas.com/2015/07/18/architecting-android-the-evolution/)
- [Fernando Cejas - Architecting Android...Reloaded](https://fernandocejas.com/2018/05/07/architecting-android-reloaded/)
- [Movie sample app](https://github.com/android10/Android-CleanArchitecture-Kotlin)
- [Android Best Practices](https://github.com/futurice/android-best-practices)
- [앱 아키텍처 가이드](https://developer.android.com/jetpack/docs/guide)
