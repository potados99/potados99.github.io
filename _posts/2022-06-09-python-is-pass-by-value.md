---
title: "Python은 pass-by-value입니다"
summary: "함수를 호출할 때, 객체의 레퍼런스를 값으로 넘겨줍니다."
date: 2022-06-09 23:02:25 +0900
category: dev
---

C나 Java의 경우 calling convention이 비교적 쉽게 설명됩니다. C에서는 모든 대입과 전달이 복사를 동반하는 pass-by-value입니다. Java 또한 pass-by-value입니다.

> Java는 종종 pass-by-reference로 오인받기도 합니다. Java에서 객체는 '레퍼런스'라고 불리는 오브젝트 핸들을 통해 다루어집니다. 그리고 메소드를 호출할 때에는 이 *레퍼런스*를 *값*으로 넘겨주게 됩니다. 객체가 아닌 원시 타입은 그 값을 바로 넘겨줍니다.

Python도 pass-by-value입니다. 조금 풀어서 쓰자면 pass-object-reference-by-value입니다. Java와 비슷하게, 객체의 레퍼런스를 값으로 넘겨줍니다. 그렇다면 *primitive*해 보이는 `int`같은 타입의 변수들은 어떻게 넘겨줄까요?

```python
def reset_int(arg_n):
    arg_n = 0

my_num = 23
reset_int(my_num)

print(my_num) # 23
# 변화가 없다!
```

숫자(`int`) 타입의 변수는 C나 Java의 원시 타입처럼 pass-by-value로 전달되는 듯 보입니다. 하지만 Python에서는 모든 것이 객체이며, `int` 객체 또한 pass-object-reference-by-value로 전달됩니다.

> 이 부분에서 웹상에 "*mutable 타입에 대해서는 pass-by-reference, immutable 타입에 대해서는 pass-by-value*"라고 잘못 설명하는 글이 많습니다. 다 틀렸습니다. 가변성과 관계 없이 Python에서는 모두 pass-object-reference-by-value(오브젝트의 레퍼런스를 값으로 전달)입니다.

아니 그러면 레퍼런스로 전달되는데 왜 밖에서 정의한 값이 안 바뀌냐구요?

## `reset_int` 함수에서 일어나는 일

바깥에서 선언된 `my_num`을 `arg_n`이라는 이름의 인자로 받았을 때, `arg_n`은 복사된 값이 아닌, `my_num`과 같은 객체를 가리키는 레퍼런스입니다. 여기까지는 `my_num`과 `arg_n`이 같은 `23` 객체를 바라보고 있습니다.

그런데 `arg_n`에 `0`을 대입하는 순간 이 둘은 서로 다른 곳을 바라보게 됩니다. `my_num`은 여전히 `23` 객체를 바라보고 있지만, `arg_n`은 새로 만들어진 `0` 객체를 바라보게 됩니다.

이처럼 인자에 **무언가를 대입하는 순간 기존 객체를 바라보던 레퍼런스는 깨지게 됩니다.** 따라서 원본 객체에는 아무 영향도 줄 수 없게 됩니다.

## 덧: 변경을 전파하려면 mutable 객체를

위의 예시에서는 대입으로 인해 레퍼런스가 더이상 원본 객체를 나타내지 못하게 되었습니다.

레퍼런스가 기존의 원본 객체를 바라보도록 유지하면서도 값을 변경하려면 mutable 객체를 사용하면 됩니다.

Mutable 객체는 내부의 값을 바꾸는 방법을 제공합니다. `list`의 경우는 `append` 메소드나 인덱스 연산자를 사용해 레퍼런스가 가리키는 객체를 *편집*할 수 있습니다.

반면 `int`는 그런 것 없습니다. 한 `int` 객체를 다른 `int` 객체로 바꾸지 않고서는 내부의 값을 바꿀 방법이 없습니다.

## References

- [Is Java "pass-by-reference" or "pass-by-value"?](https://stackoverflow.com/questions/40480/is-java-pass-by-reference-or-pass-by-value)

- [Python Parameters - Pass-By-Value or Pass-By-Reference?](https://web.archive.org/web/20120615042202/http://testingreflections.com/node/view/5126)
