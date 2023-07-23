---
date: '2022-10-19 23:36:00 +0900'
title: 'C#의 암시적 형 변환'
summary: 암시적 형 변환 연산자의 오버라이드
tags:
  - dev
---

## 들어가며

C#에는 암시적 형 변환이 있습니다. 아래와 같은 상황에서 암시적 형 변환이 일어납니다.

```csharp

public class Container {
    public int Value { get; set; }
}

public class MyApp {
    public static void Main() {
        Container data = new Container { Value = 10 };
        if (data) { // <- 여기입니다. 물론 컴파일 에러가 발생합니다.
	        Console.WriteLine("Non zero value.");
        }
    }
}

```

`Container` 타입의 `data` 인스턴스가 `if` 조건으로 evaluate되기 위해 `bool` 형식으로 취급되는 것인데, 이 때 `(bool)data`와 같이 명시적으로 타입을 지정해준 것이 아니기 때문에 암시적 형 변환으로 불립니다.

위의 코드는 컴파일되지 않습니다. `MyApp` 타입을 암시적으로 `bool`로  바꿀 수 없다며 [CS0029](https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/compiler-messages/cs0029?f1url=%3FappId%3Droslyn%26k%3Dk(CS0029)) 에러를 터뜨릴 겁니다.

## 암시적 형 변환 연산자

위와 같은 상황에서, `Container` 타입이 `bool`로 암시적 형 변환될 때 어떤 값이 되어야 하는지를 직접 지정해줄 수 있습니다.

```csharp

public class Container {
    public int Value { get; set; }

	public static implicit operator bool(Container c) {
		return c.Value != 0; // true on non-zero
	}
}

public class MyApp {
    public static void Main() {
        Container data = new Container { Value = 10 };
        if (data) { // <- 이제 컴파일이 됩니다.
	        Console.WriteLine("Non zero value.");
        }
    }
}

```

`implicit operator bool`가 바로 이 암시적 형 변환 연산자입니다. `Container` 타입이 `bool` 타입으로 암시적 변환될 때에 호출됩니다. 여기에서는 값이 0이 아니면 true인 것으로 구현하였습니다.

## Bonus: 명시적 형 변환 연산자

암시적 형 변환이 있으니 물론 명시적 형 변환 연산자도 있습니다. `implicit`이 아닌 `explicit`으로 정의합니다. 명시적 형 변환은 변수 앞에 타입 변환을 명시하는 경우에 일어납니다.

```csharp

public class Container {
    public int Value { get; set; }

	public static explicit operator bool(Container c) {
		return c.Value != 0; // true on non-zero
	}
}

public class MyApp {
    public static void Main() {
        Container data = new Container { Value = 10 };
        bool nonZero = (bool)data; // 명시적 형 변환!
        if (nonZero) {
	        Console.WriteLine("Non zero value.");
        }
    }
}

```

## 함정

암시적 형 변환을 코드 여기저기에 박아 두면 나중에 큰 함정에 빠질 수 있습니다.

```csharp

public class Container {
    public object Value { get; set; }
    
	// int 타입 암시적 변환 연산자...
	// long 타입 암시적 변환 연산자...
	// float 타입 암시적 변환 연산자...
	// 너무 많아서 생략...

	public static implicit operator object[](Container c) {
		return null; // object[] 타입으로 형 변환할 수 없기 때문에 null을 반환하는 것이 의도였는데...
	}
}

public class ProcedureCallBuilder : IQueryBuilder {

	// 생략..
	
	public ProcedureCallBuilder WithArgs(params object[] args)
	{
		Arguments.AddRange(args);
		
		return this;
	}
}

```

위와 같이 어떤 형식이든 담을 수 있는 `Container` 타입이 있다고 가정하겠습니다. 아래의 클래스는 DB에 보낼 프로시저 호출 query를 만드는 `ProcedureCallBuilder`입니다.

아래와 같이 query를 만들어 호출하고 싶습니다.

```csharp

Container data = repository.GetData();

DB.Execute(
	new ProcedureCallBuilder("MyProcedure").WithArgs(data)
);

```

그런데 이 코드는 실행하면 문제가 생깁니다. `WithArgs` 메소드는 여러 개의 아무 타입(`object`) 인자를 받아 그것들을 `args`라는 `object` 배열로 다루고자 하는데, 호출자 쪽에서 그걸 보고는 *어? 받는 쪽 인자가 `object[]` 타입이네? 그럼 `Container`의 암시적 `object[]`형 변환 연산을 실행하자!* 가 되어서 결국 인자로 가변 배열이 아닌 `null`이 날아와 버리는 것입니다.

이를 막기 위해서는 더 실제 타입에 가까운 오버로드를 추가해주면 됩니다.

```csharp

public class ProcedureCallBuilder : IQueryBuilder {

	// 생략..
	
	// 오버로드 1
	public ProcedureCallBuilder WithArgs(params object[] args)
	{
		Arguments.AddRange(args);
		
		return this;
	}
	
    // 오버로드 2
	public ProcedureCallBuilder WithArgs(Container arg)
	{
		Arguments.AddRange(new[] { arg });
		
		return this;
	}
}

```

이렇게 하면 인자로 `Container` 하나만 달랑 넘어오는 상황에서 `오버로드 1`보다는 정확한 타입 매치가 이루어지는 `오버로드 2`가 호출됩니다. 따라서 `Container`를 `object[]`로 맞추기 위한 암시적 (눈물겨운) 타입 변환도 일어나지 않습니다.

## 마치며

뭐든지 암시적인 것은 조금 위험 부담이 있는 것 같습니다. 저 문제도 알아내느라 한참 걸렸습니다. 흑흑