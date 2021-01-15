---
title: "업데이트 없이 앱 조물조물하기"
date: 2021-01-15 09:39:41 +0900
categories:
   - dev
---

모바일 앱을 만들어 스토어에 올려놓으면 참 뿌듯하고 좋습니다. 그런데 갑자기 API 서버 url을 변경해야 한다거나(이건 좀 극단적인 예시지만..) 특정 사용자에게만 무언가를 보여주고 싶다거나 하면 고민이 시작됩니다.

변경 사항이 생기면 바로 업데이트를 만들고 빌드한 다음 배포를 해야 하죠. 귀찮습니다. 귀찮을 뿐만 아니라, 이렇게 모든 변화에 업데이트로 대응하기만 하면 서비스를 섬세하게 운영할 수가 없게 됩니다.

![곤-란](https://cloudfront-ap-northeast-1.images.arcpublishing.com/chosun/6O5QHOBUZRRO7OE5HNVHBZA5A4.png)

> 몹시 곤란합니다.

버전에 따라 특정 기능을 숨기거나 공개하고 싶을 수도, 특정 사용자에게만 컨텐츠를 보여주고 싶을 수도 있습니다. 그럴 때마다 `v4.2.0-feature-not-activated-until-feb`같이 복잡한 버전 이름으로 업데이트를 만들어 심사를 요청할 수는 없는 노릇이죠. 이 즈음 되면 외부의 지시(?)로 앱의 동작을 변경하고 싶어집니다.

지금까지는 앱 내 설정을 로컬에서 구할 수 있는 값들로만(예를 들어 정적으로 초기화된 스트링 리터럴이나 `BuildConfig` 등) 구성해 놓았습니다. 이제 이 설정을 어딘가에 있는 서버로부터 받아오고 싶습니다. 그럼 이제 또다른 고민이 시작됩니다. *설정을 주는 API는 어떻게 만들까... 인증은... 콘솔도 수정해야겠네...*

**그런 고민 안 해도 됩니다.**

## Firebase RemoteConfig

Firebase는 구글이 굴리고 있는 모바일 앱 운영 플랫폼입니다. `Crashlytics`를 써보셨다면 익숙하실 겁니다. 여기에 `RemoteConfig`라는 서비스가 있습니다.

![remote config](https://firebase.google.com/docs/remote-config/images/param-precedence.png)

> 조건부 설정도 지원한대요.

앱에서 설정을 가져올 때에, 가장 먼저 서버(Firebase)로부터 주어진 `key`에 해당하는 값을 가져옵니다. 값이 없거나 **아직 가져오지 않았다면** 로컬에서 설정된 기본값을 사용합니다. 기본값도 아직 설정되지 않았다면, 정적으로 초기화된 값을 가져다 쓸 수 있습니다.

이걸 쓰기 위해 우리가 해야 할 일은 두 가지입니다. 하나는 [Firebase 콘솔](https://console.firebase.google.com)을 열고 작업중인 프로젝트에 들어가 `RemoteConfig`에다가 적절한 값을 넣어주는 것, 또 다른 하나는 모바일 앱 쪽에서 API를 잘 써주는 것입니다.

![remote-config-console.png](/assets/images/remote-config-console.png)

> Firebase 콘솔은 이렇게 생겼습니다.

콘솔에서 이것저것 잘 추가해주셨다면 Android쪽 설정만 남았습니다. [공식 문서](https://firebase.google.com/docs/remote-config/use-config-android?hl=ko)를 읽어 봅시다.

1. 앱에 Firebase 및 원격 구성 SDK 추가
2. 원격 구성 싱글톤 객체 가져오기
3. 인앱 매개변수 기본값 설정
4. 앱에서 사용할 매개변수 값 가져오기
5. 원격 구성 백엔드에 매개변수 값을 설정합니다.
6. 값 가져오기 및 활성화

총 여섯 단계로 구성되어 있습니다. 뭔가 되게 많네요. 한번 따라해봅시다.

~~~groovy
dependencies {
    // Import the BoM for the Firebase platform
    implementation platform('com.google.firebase:firebase-bom:26.1.1')

    // Declare the dependencies for the Remote Config and Analytics libraries
    // When using the BoM, you don't specify versions in Firebase library dependencies
    implementation 'com.google.firebase:firebase-config-ktx'
    implementation 'com.google.firebase:firebase-analytics-ktx'
}
~~~

앱 수준 Gradle 파일에 위 내용을 추가해 줍니다. ~~Firebase는 이미 추가되어 있는걸로 합시다~~

그러면 이제 호출만 쭉 하면 됩니다.

~~~kotlin
const remoteConfig = Firebase.remoteConfig
val configSettings = remoteConfigSettings {
    // 아, 나는 한 시간에 한 번씩 원격 서버에서 설정을 가져오겠다!
    minimumFetchIntervalInSeconds = 3600
}
remoteConfig.setConfigSettingsAsync(configSettings)
~~~

한 시간에 한번으로 `fetch` 간격을 조정한 뒤 이를 적용합니다.

그리고는 config 기본값을 지정해 줍니다.

~~~kotlin
remoteConfig.setDefaultsAsync(R.xml.remote_config_defaults)
~~~

기본값은 XML 리소스를 사용해도 되고, `Map<String, Object>` 타입의 `키-값` 쌍을 넘겨 주어도 됩니다. XML 파일은 아래처럼 생겼습니다.

~~~XML
<?xml version="1.0" encoding="utf-8"?>
<defaultsMap>
    <entry>
        <key>loading_phrase</key>
        <value>Fetching config…</value>
    </entry>
    <entry>
        <key>welcome_message_caps</key>
        <value>false</value>
    </entry>
    <entry>
        <key>welcome_message</key>
        <value>Welcome to my awesome app!</value>
    </entry>
</defaultsMap>
~~~

> 역시 저는 XML보다는 JSON을 좋아하나봅니다.

자, 기본값도 지정해 주었으면 이제 `fetch`를 유발하면 됩니다!

~~~kotlin
remoteConfig.fetchAndActivate()
~~~

이제 `remoteConfig.getBoolean()`으로 설정을 가져다 쓰...

시면 과연 될까요?


　

　

　

　

　

　

　

![후후](https://lh3.googleusercontent.com/proxy/QvpgNf3pHge2i3JGTGRaQ18trKhvpeG1hrdEX1rtg4tsPoeAtnlafln6IijPkNRY6rX2WIniLHKHj4QOyNtfpfjHZrj4PwQk1nfN23aLwGJ8cYXq6iUSO2khEYweVZZFwChZMaPrUby8l1-Dd5C94XxzBYsYejtopea38GCXj3phel8j)

## Async의 함정

`fetchAndActivate`는 당연히 비동기로 실행될겁니다. 서버에서 무언가를 가져와야 할 것이니까요. 그래도 우리는 기본값을 설정해 주었으므로 fetch가 끝날 때까지는 기본값을 가져다 쓸 수 있겠죠..?

**이런 기대를 하면 안 됩니다!**

방금 우리는 기본값을 설정하기 위해 `setDefaultsAsync`라는 메소드를 불러 주었습니다. 이름 끝에 **async**가 붙어있네요 **async**가!

`setDefaultsAsync` 호출 직후 `remoteConfig.getBoolean()`을 호출하면 그저 `false`를 반환할 뿐입니다. 왜 그런지 한번 소스를 볼까요.

~~~java
public boolean getBoolean(String key) {
  String activatedString = getStringFromCache(activatedConfigsCache, key);
  if (activatedString != null) {
    if (TRUE_REGEX.matcher(activatedString).matches()) {
      callListeners(key, getConfigsFromCache(activatedConfigsCache));
      return true;
    } else if (FALSE_REGEX.matcher(activatedString).matches()) {
      callListeners(key, getConfigsFromCache(activatedConfigsCache));
      return false;
    }
  }

  String defaultsString = getStringFromCache(defaultConfigsCache, key);
  if (defaultsString != null) {
    if (TRUE_REGEX.matcher(defaultsString).matches()) {
      return true;
    } else if (FALSE_REGEX.matcher(defaultsString).matches()) {
      return false;
    }
  }

  logParameterValueDoesNotExist(key, "Boolean");
  return DEFAULT_VALUE_FOR_BOOLEAN;
}
~~~

아... 마지막 줄 `return DEFAULT_VALUE_FOR_BOOLEAN;`에 걸리는군요. 서버에서 가져온 데이터는 물론 로컬의 기본값도 준비되지 않았으니 당연한 일입니다만, `SharedPreference`처럼 기본값이라도 지정할 수 있게 해주면 좋았는데 말이죠.

> remoteConfig.getBoolean(KEY_MY_CONFIG, true)    
이러면 얼마나 좋냐구요 ㅠ

그럼 이제 우리는 단지 로컬 기본값을 읽고 싶은 것 뿐인데 **기본값이 준비될 때 까지 앱의 실행을 지연시켜야 하는 불합리한 상황에 놓이게 됩니다.** 도대체 왜? XML 읽는게 그렇게 느린가? 소스를 뜯어봅시다.

~~~java
@NonNull
public Task<Void> setDefaultsAsync(@XmlRes int resourceId) {
  Map<String, String> xmlDefaults = DefaultsXmlParser.getDefaultsFromXml(context, resourceId);
  return setDefaultsWithStringsMapAsync(xmlDefaults);
}
~~~

XML을 읽어 `Map`으로 만드는 일은 동기적으로 빠르게 일어납니다. 중요한 것은 `setDefaultsWithStringsMapAsync`이군요.

~~~java
private Task<Void> setDefaultsWithStringsMapAsync(Map<String, String> defaultsStringMap) {
  ConfigContainer defaultConfigs = null;
  try {
    defaultConfigs = ConfigContainer.newBuilder().replaceConfigsWith(defaultsStringMap).build();
  } catch (JSONException e) {
    Log.e(TAG, "The provided defaults map could not be processed.", e);
    return Tasks.forResult(null);
  }

  Task<ConfigContainer> putTask = defaultConfigsCache.put(defaultConfigs);
  // Convert Task type to Void.
  return putTask.onSuccessTask((unusedContainer) -> Tasks.forResult(null));
}
~~~

`defaultConfigsCache.put`의 반환값이 `Task` 타입입니다. 저 메소드가 핵심인 것 같습니다.

~~~java
public Task<ConfigContainer> put(ConfigContainer configContainer) {
  return put(configContainer, /*shouldUpdateInMemoryContainer=*/ true);
}
~~~

계속 내려가 봅시다.

~~~java
public Task<ConfigContainer> put(
    ConfigContainer configContainer, boolean shouldUpdateInMemoryContainer) {
  return Tasks.call(executorService, () -> storageClient.write(configContainer))
      .onSuccessTask(
          executorService,
          (unusedVoid) -> {
            if (shouldUpdateInMemoryContainer) {
              updateInMemoryConfigContainer(configContainer);
            }
            return Tasks.forResult(configContainer);
          });
}
~~~

결국 `storageClient.write`이 오래 걸릴 것 같으니 비동기로 만들어버린 것입니다.

`write`은 파일 시스템에 접근하는 메소드입니다.

~~~java
public synchronized Void write(ConfigContainer container) throws IOException {
  // TODO(issues/262): Consider using the AtomicFile class instead.
  FileOutputStream outputStream = context.openFileOutput(fileName, Context.MODE_PRIVATE);
  try {
    outputStream.write(container.toString().getBytes(JSON_STRING_ENCODING));
  } finally {
    outputStream.close();
  }
  return null;
}
~~~

결론: **`RemoteConfig`는 서버에서 온 설정이든 로컬에서 온 설정이든 일단 파일에다가 담아놓고 봅니다.**

~~~java
// RemoteConfigComponent.java 149번째 줄
ConfigCacheClient fetchedCacheClient = getCacheClient(namespace, FETCH_FILE_NAME);
ConfigCacheClient activatedCacheClient = getCacheClient(namespace, ACTIVATE_FILE_NAME);
ConfigCacheClient defaultsCacheClient = getCacheClient(namespace, DEFAULTS_FILE_NAME);
~~~

이렇게 파일 캐시를 만들어서 말이죠. 그렇기 때문에 기본값 초기화에도 파일시스템 쓰기 작업이 들어 비동기 작업으로 구현되었던 것입니다.

그런데 우리는 저걸 기다릴 틈이 없습니다. 어서 메인 액티비티를 띄워야 한다구요! 스플래시 액티비티에서 한가하게 설정 초기화되는걸 기다리고 있을 수는 없는 노릇입니다!

위에서 잠깐 지나갔는데, 기본값이 담긴 XML 리소스를 읽는 것 자체는 아주 빠르게 수행됩니다. 즉, 우리도 `RemoteConfig`와 독립적으로 저걸 읽어 사용할 수 있습니다.

한 번 짜볼까요.

## RemoteConfigWrapper

~~~kotlin
object RemoteConfigWrapper {

    private val remoteConfig = Firebase.remoteConfig

    private val fallback: Map<String, String> = DefaultsXmlParser.getDefaultsFromXml(context/*어디선가 구해오기!*/, R.xml.config_defaults)

    private var configReady = false

    init {
        remoteConfig.setDefaultsAsync(fallback).addOnCompleteListener {
            configReady = true
        }

        remoteConfig.fetchAndActivate()
    }

    ...
    fun getBoolean(key: String) = if (configReady) remoteConfig.getBoolean(key) else fallback[key].toBoolean()
    ...
}
~~~

대충 이런 모습입니다. 객체 초기화 시점에 *XML로부터 빠르게 읽어온 Map 객체*를 가지고 `remoteConfig.setDefaultsAsync`를 호출해놓고, 작업이 끝나면 `configReady`가 `true`가 되도록 지시합니다.

저 밑의 `getBoolean`은 객체 생성 직후부터 아무 때나 접근 가능해야 합니다. 따라서 기본값이 준비되지 않았을 때(`configReady == false`)에는 `fallback`으로부터, 그 외에는 `remoteConfig`로부터 값을 가져옵니다.

이렇게 하면 앱 라이프 사이클 중 언제든 **최소한 기본값에는 접근**할 수 있습니다.

![히히](https://cdn.clien.net/web/api/file/F01/5686362/17f7f580ec711.jpg?thumb=true)

축하합니다.

## 또 다른 이슈

현재 상황에서, 서버에서 지정한 값은 처음 실행에는 영향을 미치지 않습니다. 설정이 적용되는 **순서**(우선순위가 아닙니다!)는 다음과 같습니다:

1. XML에서 읽어온 fallback값
2. `RemoteConfig`의 `default`파일 캐시에 저장된 기본값(1과 내용은 같습니다)
3. 서버에서 날아와서 `activate` 파일 캐시에 저장된 값

**1**은 앱 실행 직후, **2**는 앱 실행 몇백 밀리초 후, 그리고 **3**은 **다음번 앱 실행**에 적용됩니다.

이번에 앱의 새로운 버전을 출시하면서, 아직 백엔드가 준비되지 않은 기능은 비활성화하였습니다. 메인 액티비티가 초기화될 때에 `RemoteConfig`을 참고하여 해당 기능이 위치한 탭을 숨겨버리는 방식으로 구현하였습니다(~~임시 땜빵~~).

후에 백엔드가 준비되면 해당 기능 활성화 여부를 `true`로 전환하고 *쨘~ 새 기능이 나왔어요* 하고 공지를 띄울 생각이었습니다. 그런데 서버측 설정 적용이 한 박자 늦는다면 문제가 조금 생기게 되었습니다.

로컬 기본값에서는 그 기능을 켜 놓고 서버 설정에서는 꺼 놓으면, 처음 업데이트를 실행한 사용자는 **지원되지도 않는 기능을 처음 실행에서 마주하게 됩니다.** 처음 실행에서는 서버쪽 설정이 아닌 로컬 설정이 적용되기 때문입니다.

만약 로컬 기본값에서 그 기능을 꺼 놓으면 괜찮을까요? 이렇게 한다면 훗날 해당 기능을 서버에서 활성화한 뒤에 업데이트를 설치한 사용자는 **첫 번째 실행에서 그 기능을 볼 수 없을 것입니다.**

이렇게 대충 훑어 보아도 문제가 되는 경우가 많아 보입니다.

모든 경우의 수를 정리해 볼까요. 이런 것들을 고려해 보고자 합니다.

- 로컬 기본값
- 서버 설정
- 이제 막 설치 또는 업데이트하였는지 여부

총 8가지 경우가 나옵니다.

| 로컬 기본값 | 서버 설정 | 앱 버전 | 결과 |
|:--------:|:-------:|:--------:|:--------:|
| `true` | `false` | 최신 버전의 앱 사용 중 | 업데이트/설치 후 처음 실행에는 서버 설정이 반영되지 않습니다. |
| `true` | `false` | 이 시점에서 최신으로 업데이트 또는 신규 설치 | 업데이트/설치 후 처음 실행에는 서버 설정이 반영되지 않습니다. |
| `true` | `true`로 변경 | 최신 버전의 앱 사용 중 | 서버 설정 변경 후 처음 실행에는 서버 설정이 반영되지 않습니다. |
| `true` | `true`로 변경 | 이 시점에서 최신으로 업데이트 또는 신규 설치 | 서버 설정이 잘 반영됩니다. |
| `false` | `false` | 최신 버전의 앱 사용 중 | 서버 설정이 잘 반영됩니다. |
| `false` | `false` | 이 시점에서 최신으로 업데이트 또는 신규 설치 | 서버 설정이 잘 반영됩니다. |
| `false` | `true`로 변경 | 최신 버전의 앱 사용 중 | 서버 설정 변경 후 처음 실행에는 서버 설정이 반영되지 않습니다. |
| `false` | `true`로 변경 | 이 시점에서 최신으로 업데이트 또는 신규 설치 | 업데이트/설치 후 처음 실행에는 서버 설정이 반영되지 않습니다. |

무려 8가지 중 5가지 경우에서 바람직하지 않은 동작이 발생합니다.

![안돼 ㅜ](https://lh3.googleusercontent.com/proxy/LVFiysRLf1DFKdHgesuQ6ByoDzoMq4LULy_Qk182ZI7XdFqCmsXAPyngpIuDeq3OE9DyhmkFr-M0ZpVD-hOodrCH6u5AqBkPf3vf5WC4D_dIxOx-uVHoZD1xwO8MMSuEE755GbqPhwTuAuuTWcaqFbCkByIFjoJb2DamPJDe_AEmrZ7JBo3BQxKSNCSa9VAFb8rkeZErX12_FbmsjwafioMnUroHiD1n_4B-H2AGCi8srQvUD0B5T2CBWQc9UWmAnPzD4PV4R0gtcZlGBPskNP_rzuuwiIv_bXB5qkFbbh02)

> 있을 수가 없는 일이라구요!

이렇게 놔둘 수는 없죠. 서버 설정을 실시간으로 반영하기 위해 눈물을 머금고 **스플래시 화면에서 설정 로딩을 기다리도록 합니다.**

## RemoteConfigWrapper 개선하기

`RemoteConfig`가 준비되는 시점은 두 가지가 있습니다. 하나는 로컬 기본값이 준비되는 시점이고, 또 다른 하나는 네트워크를 타고 온 서버의 설정이 준비되는 시점입니다. 우리는 메인 액티비티 시작 이전에 서버의 설정이 필요한 것이므로, 후자의 시점까지 기다려야 합니다.

이런 코드 흐름을 기대해볼 수 있습니다. 먼저 `Application` 객체 속에서 초기화를 시작합니다(스플래시에 도달하기도 전에 시작합니다).

~~~kotlin
// MyApplication

override fun onCreate() {
  ...
  RemoteConfig.initialize()
  ...
}
~~~

그리고 스플래시 액티비티에서 `RemoteConfig`를 기다립니다. 준비가 끝나면 메인 액티비티를 시작합니다.

~~~kotlin
// SplashActivity

override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)

    RemoteConfig.onRemoteConfigReady {
        navigator.showMain()
        finish()
    }
}
~~~

한번 짜볼까요?

~~~kotlin
object RemoteConfigWrapper {

      private val fallback: Map<String, String> = DefaultsXmlParser.getDefaultsFromXml(context/*어디선가 챙겨옵니다!*/, R.xml.config_defaults)

      private lateinit var remoteConfig: FirebaseRemoteConfig

      private var initialized = false
      private var localConfigReady = false
      private var remoteConfigReady = false

      private var localConfigReadyAction: () -> Unit = {}
      private var remoteConfigReadyAction: () -> Unit = {}

      fun initialize() {
          if (initialized) {
              return
          }

          remoteConfig = Firebase.remoteConfig

          remoteConfig.run {
              setDefaultsAsync(fallback).addOnCompleteListener {
                  // 여기가 먼저 실행되고
                  localConfigReady = true
                  localConfigReadyAction()
              }

              remoteConfig.fetchAndActivate().addOnCompleteListener {
                  // 여기가 그 다음에 실행될 겁니다.
                  remoteConfigReady = true
                  remoteConfigReadyAction()
              }
          }

          initialized = true
      }

      fun onLocalConfigReady(action: () -> Unit = {}) {
          if (localConfigReady) {
              action()
              return
          }

          localConfigReadyAction = action
      }

      fun onRemoteConfigReady(action: () -> Unit = {}) {
          if (remoteConfigReady) {
              action()
              return
          }

          remoteConfigReadyAction = action
      }

    ...
    fun getBoolean(key: String) = if (localConfigReady || remoteConfigReady) remoteConfig.getBoolean(key) else fallback[key].toBoolean()
    ...
}
~~~

조금 길어졌네요. `initialize`를 호출하면 `로컬 기본값을 설정하는 작업`과 `서버로부터의 설정을 가져와 활성화하는 작업`이 거의 동시에 시작됩니다. 그 둘은 완료되었을 때에 이를 알리는 플래그를 설정하고 등록된 콜백을 호출합니다.

콜백의 등록은 작업이 끝난 후일 수도, 아니면 작업이 시작되기 전일 수도 있습니다. 코드를 볼까요.

~~~kotlin
fun onRemoteConfigReady(action: () -> Unit = {}) {
    if (remoteConfigReady) {
        action()
        return
    }

    remoteConfigReadyAction = action
}
~~~

콜백 등록 시점에 이미 준비가 되어 있었다면 즉시 해당 콜백을 호출하고 끝냅니다. 아니면 `remoteConfigReadyAction`에 이를 등록하여 아래와 같이 작업이 끝날 때에 호출될 수 있도록 합니다.

~~~kotlin
remoteConfig.fetchAndActivate().addOnCompleteListener {
     remoteConfigReady = true
     remoteConfigReadyAction()
}
~~~

이 파일의 전체 소스는 [여기](https://github.com/inu-appcenter/cafeteria-android/blob/4369715b3511ddbbb3d879865525dccdc0b77c71/common/src/main/java/com/inu/cafeteria/config/RemoteConfig.kt)에 있습니다.

**끝!**

![끝](https://lh3.googleusercontent.com/proxy/UvO7-2phxiaM-F5Kghy19KnFwoCa8MiIpl2-dxh_b9HMe0lu461RH_t_pJmf22bwn8xqMU1H75fDoFQ3azgZPYCfpTsLzeVWMrKiKdiOTNHCFugLTRUpsMIjtv0Zqy87glJbXjJOQL-_4cve4lWYRcItWDky3e0ocvGnKTrMFPpwRsxZAs-DD-Xm6gBiRR16tHitrHmqbzL14EnJemG4qt2P9Kx2L67QzHNf23iWn4sYVdbnRO0BPXn0XUk_4mhCND1PuiMwtYr6AHXE6nBklRci3cCS2KOn55-1JBTgwvZFqmnzKIHpu5d7z3kh)

## 마치며

쓰다 보니 글이 너무 길어졌네요. 에디터가 버벅이기 시작합니다.

읽어주셔서 감사합니다.

## 참고

- [Firebase Remote Config](https://firebase.google.com/docs/remote-config)

- [Android에서 Firebase 원격 구성 시작하기](https://firebase.google.com/docs/remote-config/use-config-android?hl=ko)

- [quickstart-android/config/app/src/main/res/xml/remote_config_defaults.xml](https://github.com/firebase/quickstart-android/blob/master/config/app/src/main/res/xml/remote_config_defaults.xml)
