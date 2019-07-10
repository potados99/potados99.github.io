---
title: "[Kotlin Android] Content Resolver의 query 결과를 Collection으로 바로 받아오기"
date: 2019-07-10 22:00:17 +0900
excerpt: 귀찮음을 피해서 더 귀찮음을 택하고 오래도록 편해지기
image: assets/images/kotlin-android-logo.jpg
categories:
    - dev
tags:
    - kotlin
    - android
---

### 안드로이드에서 데이터에 접근하기

안드로이드에서의 데이터 공유는 4대 컴포넌트 중 하나인 Content Provider, 즉 컨텐츠 제공자를 통해서만 이루어진다.

컨텐츠 제공자는 데이터베이스와 기타 파일들을 비롯한 데이터 계층과 응용 계층을 이어주는 역할을 수행한다.
애플리케이션 코드에서 이 제공자를 사용하기 위해서 [ContentResolver](https://developer.android.com/reference/android/content/ContentResolver) 클래스를 사용할 수 있다.

이 resolver는 사용자와 Content Provider 사이에 존재하며, 둘을 이어주는 역할을 한다.

### Content resolver로 데이터 가져오기

Content reolver를 통해 내부 db에 쿼리를 보내 결과를 전달받을 수 있다.
예를 들어서 사용자 기기의 연락처를 조회하거나, 메시지 대화방 목록을 읽어올 수 있다.

이런 식이다.
~~~kotlin
val resolver = contentResolver
val cursor = resolver.query(Uri.parse("content://mms-sms/conversations?simple=true", null, null, null, null))
~~~

메시지 대화방을 전부 가져오는 예시이다.

ContentResolver의 query 메소드는 결과를 [Cursor](https://developer.android.com/reference/android/database/Cursor)에 담아 반환한다. 이 cursor는 Map 또는 Dictionary를 순회하는 iterator같이 생겼다.

이를 가지고 모든 column을 돌아가며 해당 column의 데이터를 타입에 맞게 가져올 수 있다.

하지만 매번 루프를 돌릴 수는 없다. 이런 그림이 나오기를 원했다.

~~~
val resultsInList: List<DataType> = myQuery(resolver, uri, ...)
~~~

### 데이터 객체화

만능 쿼리 함수를 만들어야 한다.
여기서 가장 중요한 것은 데이터 타입에 관계없이 쿼리의 결과를 저장하는 것이다.

Cursor를 얻어온 뒤 이를 데이터 클래스에 집어넣기 위한 몇 가지 방법이 있다.

#### 1. 팩토리 클래스 만들기

Cursor를 먹고 데이터 클래스 인스턴스를 뱉는 factory 클래스를 만들 수 있다.

아주 이상적이고 쉽고 빠르지만, 범용성이 0이다. 범용적인 것을 추구하기 때문에 이 방법은 건너뛴다.

#### 2. Reflection (반영)

Kotlin이나 Java는 [reflection](https://kotlinlang.org/docs/reference/reflection.html)을 지원한다.

덕분에 동적으로 객체의 구성 요소에 접근할 수 있다.

이런 식의 응용이 가능하다. ([stack overflow](https://stackoverflow.com/a/35539628) 일부 발췌)

~~~
// some data class
data class MyData(val name: String, val age: Int)
val sample = MyData("Fred", 33)

// and reading property "name" from an instance...
val name: String = readInstanceProperty(sample, "name")

// and reading property "age" placing the type on the function call...
val age = readInstanceProperty<Int>(sample, "age")

println(name) // Fred
println(age)  // 33
~~~

String을 이용해서 객체의 구성 요소에 접근하는 시나리오인데, cursor의 column에 해당하는 속성에 접근하여 대입하는 것이 가능하다.

이 방법에는 두 가지 단점이 있다.
첫째로, cursor의 column 이름(사실은 DB의 column 이름)이 데이터 클래스의 속성 이름과 동일해야 한다. 안그러면 못찾는다.
그리고, 형변환을 포함한 변환-대입 로직을 모두 작성해야 한다. 이 단점이 너무 치명적이라 다음에 시도해보기로 했다.

#### 3. Cursor를 JSON으로 변환한 뒤 POJO로 변환하기.

Cursor가 담는 정보는 모두 key와 value로 이루어져있다는 점에서 JSON과 유사하다.
따라서 둘의 상호 변환도 아주 쉽다.

다음과 같은 코드로 간단하게 JSON 객체를 얻어낼 수 있다.

~~~
fun cursorToJson(cursor: Cursor): JsonArray {
            // record 여럿이 담길 배열.
            val resultSet = JsonArray()
            if (!cursor.moveToFirst()) return resultSet

            do {
                // record 하나가 JsonObjecta 하나에 대응됨.
                val rowObject = JsonObject()

                // 각 column과 이에 해당하는 value 추가.
                for (i in 0 until cursor.columnCount) {
                    cursor.getColumnName(i)?.let {
                        try {
                            rowObject.addProperty (
                                cursor.getColumnName(i),
                                cursor.getString(i)
                            )
                        } catch (e: Exception) {
                            Log.d("JsonHelper:cursorToJson", e.message)
                        }
                    }
                }

                resultSet.add(rowObject)

            } while (cursor.moveToNext())

            return resultSet
        }
~~~

 > Json은 JavaScript Object Notation의 준말이기도 하지만, 구글이 제공하는 클래스 이름이기도 하다. J만 대문자인게 포인트.


##### 데이터 직렬화

 JSON 객체를 얻어냈으면, 이를 데이터 클래스 객체로 변환해야 한다. 구글의 [Gson](https://github.com/google/gson) 라이브러리가 이를 도와준다.

 Gson은 자바 객체 직렬화/역직렬화 라이브러리다. 자바 객체와 JSON간의 변환을 도와준다.

 단순히 변환만 해주는 것이 아니라, 타입만 잘 넘겨주면 적당한 컨테이너에 잘 담아주기까지 한다.

 먼저 Gradle 빌드 스크립트를 열고 다음을 추가해준다.

 ~~~
dependencies {
  implementation 'com.google.code.gson:gson:2.8.5'
}
 ~~~

사용법은 다음과 같다.

 ~~~
 val gson = Gson() // 먼저 인스턴스를 가져오고
 val json = cursorToJson(...) // json 객체도 가져오고

 val listType = object: TypeToken<List<MyData>>() {}.type // 결과를 담을 컬렉션에 대한 타입 객체를 가져오고

 val resultInCollection: List<MyData> = gson.fromJson(json, listType) // fromJson()을 호출한다.
 ~~~


 >여기서 잠깐, 타입 객체는 아무것도 override하지 않는 익명 객체이다. C#의 `typeOf()` 같은 것이 없어서 번거로웠다. 그래서 하나 만들었다.
 ~~~
 inline fun <reified T> typeOf(): Type = object: TypeToken<T>() {}.type
 val t = typeOf<String>() // String에 대한 타입 객체
 ~~~

 데이터 클래스를 잘 정의해놓아야 변환이 간편하다.

 위의 MyData를 예제로 들자면, 해당 클래스에 `name: String`과 `id: Int`라는 속성이 있다고 한다.
 그리고 Json에도 name과 id가 있다. 이런 경우에는 아무런 추가적 작업 없이도 Gson을 통한 변환이 이루어진다.

 하지만 속성 이름이 다를 경우에는 notation을 통해 표기해주어야 한다.

 ~~~
 data class MyData(
     @SerializedName("name")    val theName: String,
                                val id: Int
 ) {}
 ~~~

 물론 해당 notation을 모든 속성에 써주어도 된다.

 데이터 타입의 경우 문자열 -> 숫자나 숫자 -> 문자열과 같은 변환은 자동으로 일어난다.
 만약에 직렬화 중 타입이 안 맞는데 변환까지 불가능한 상태이면 예외가 발생한다.

 ##### 컬렉션의 타입

 Gson을 사용하는 경우, 내보낼 컬렉션의 타입도 지정해줄 수 있었다. 속에 들은 알맹이가 MyData라면,
 껍데기는 List가 될 수도 있고, Array가 될 수도 있다. Collection을 구현하는 클래스이면 가능한 것으로 보인다.(추정)


### 쿼리 결과 컬렉션으로 받아보기

JSON을 거치는 방법으로 `ContentResolver.query()`부터 `Gson.fromJson()`까지 다리가 완성되었다.

이제 query할 정보와 적절한 컬렉션 타입을 받아서 결과가 들은 컬렉션을 반환하는 함수를 만들 수 있다.

함수의 원형은 다음과 같이 만든다.

~~~
inline fun <reified T> queryToCollection(
    resolver: ContentResolver,
    uri: Uri,
    projection: Array<String>?,
    selection: String? = null,
    selectionArgs: Array<String>? = null,
    order: String? = null): T
~~~

`resolver`를 제외한 다섯 인자는 쿼리에 필요한 인자들을 그대로 가져온 것이다.

뒤의 세 인자는 사용하지 않는 경우 편리성을 위해 기본값으로 null을 지정해주었다.

반환 타입인 T는 `Collection<*>` 타입이어야 한다. 그렇지 않은 경우는 걸러준다.
~~~
if (Types.typeOf<T>() is Collection<*>) {
    throw IllegalThreadStateException("Wrong generic type: not a collection.")
}
~~~

그런 다음 인자를 가지고 `resolver`의 `query()`를 실행하여 cursor를 얻고, JSON으로 변환해준다.
~~~
val cursor = resolver.query(
    uri,
    projection,
    selection,
    selectionArgs,
    order)

val parsedJson = JsonHelper.cursorToJson(cursor).also { cursor.close() }
~~~

마지막으로 이를 Gson으로 직렬화시켜 반환한다.
~~~
return Gson().fromJson(
    parsedJson,
    Types.typeOf<T>()
)
~~~

### 결론

퍼포먼스는 딱히 생각하지 않고 만들었다. 아마 느릴 것이다. 대규모 데이터를 가지고 실험해본 적은 없다.
다만 범용성을 추구해서 어디에다 갖다붙여도 잘 작동하는 라이브러리 스타일 코드를 짜려고 했고, 어느정도 목표를 이룬 것 같다.

오늘 야식은 라면이다.
