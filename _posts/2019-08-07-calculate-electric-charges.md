---
title: "[C] 누진 적용된 전기요금 계산하기"
date: 2019-08-07 03:23:49 +0900
excerpt: "누진세의 공포 때문에 에어컨도 제대로 못 틀고있다. 누진 요금이 그렇게나 위험할까? 어느정도 써야 전기요금이 폭발하는걸까?"
header:
    overlay_image: /assets/images/math-board.jpg
categories:
    - life
tags:
    - C
    - summer
    - electricity
---
> 이미지 출처: [여기](https://www.rd.com/culture/math-lessons-real-life/)

작년만큼은 아니어도 올해도 아주 덥다. 낮 기온이 30도 아래로 내려가는 것을 보기가 어렵다.

그래서 에어컨을 자주 가동시켜야 집에서 버틸만하다.

하지만 에어컨은 전기를 많이 먹고, 주택 전기는 비싸다...


## 전기요금 누진제

전기를 많이 쓸수록 단위당 요금이 올라가는 구조다.

예전에는 누진 단계가 7단계나 되던 시절도 있었고, 그때에는 요금 차이가 18.7배나 벌어졌다고 한다.

지금은 3단계로 조절되었으며, 1단계와 3단계는 3배 차이가 난다.

하지만 여름과 겨울(7~8월과 12월~2월)에는 한단계 더 추가된 4단계 누진 요금이 적용된다.

![전기요금 그래프](/assets/images/elec-charge.png)

> 쓰면 쓸수록 팍팍 올라가는 구조다. 마지막 단계에서는 처음과 7배 차이가 난다.

![전기요금 그래프 적분](/assets/images/elec-charge-integral.png)
> 적분해보면 실제 요금을 알 수 있다. 400kWh 쓰면 56,052월, 800kWh 쓰면 168,131원.


## 전기 잘 쓰기

아까 어머님과 형이 이런 대화를 나누는 것을 들었다.

> \- "하루에 7kWh 정도 쓰는 것 같아"    
\- "1kWh에 100원이래요. 하루에 700원이면 한달 내내 틀어도 얼마 안 나올 것 같은데요?"    
\- "무슨 소리야 지난번에 살던 집에서 여름에 14만원 나온 적 있어!"    
\- "뭐지..."

누진제도 자체가 뭐지 싶다. 왜 있는건지 모르겠다.

에어컨에는 전력 사용량을 보여주는 기능이 있다. 월 평균 전기 사용량에 이를 합하면 예상 요금을 구할 수 있다.

여기에 도움이 될 만한 작은 C 프로그램을 만들어 보았다.


## Piecewise Function 적분하기

누진제가 없다면 1kWh당 전기 요금은 사용량과 무관하게 고정된 값을 가지는 상수함수로 볼 수 있다.

누진제가 적용된 전기 요금은 사용량 x에 대한 요금 f(x)로 볼 수 있다.

각 단계 안에서는 요금이 같으므로 f(x)는 여러 개의 상수 함수(단계별 요금)가 모여 이루는 연속함수라고 할 수 있다.

이런 함수를 [step function](https://en.wikipedia.org/wiki/Step_function) 또는 [piecewise function](https://en.wikipedia.org/wiki/Piecewise)이라고 부른다.

대표적인 예시로 f(x) = abs(x)가 있다.

![절댓값 x](/assets/images/abs-x.svg)
> 너무 뾰족해서 미분이 안된다.

누진요금도 이와 같이 나타낼 수 있다.

![charge](/assets/images/charge-function.gif)

사용량에 따른 단위 전기요금을 charge(x)라고 할 때, charge(x)의 정적분을 구해보자.

## C

먼저 step function을 담을 수 있는 구조체를 정의한다.

~~~c
// types.h

typedef int 	range_t;
typedef double 	value_t;

...

struct numeric_range {
	range_t 				begin;
	range_t 				end;
};

struct step_piece {
	struct numeric_range	range;
	value_t					value;
};

struct step_function {
	size_t			        n_steps;
	struct step_piece		steps[STEPS_MAX];
};
~~~

그리고 step function의 적분을 계산할 함수를 만든다.

~~~c
// step_function.c

// 범위 추출 도와주는 함수
static inline int select_range(struct numeric_range *restrict result, const struct numeric_range *restrict range, range_t begin, range_t end) {
	if (!(result && range)) {
		return -1;
	}

	result->begin = MAX(range->begin, begin);
	result->end = MIN(range->end, end);

	if (result->end < result->begin) {
		result->begin = result->end = 0;
	}

	return result->end - result->begin;
}

// 얘가 우리가 필요한 계산 함수
value_t integrate_step_function(const struct step_function *restrict function, range_t begin_inclusive, range_t end_inclusive) {
	if (!function) {
		return -1;
	}

	value_t total = 0;
	size_t n_steps = function->n_steps;
	const struct step_piece *steps = function->steps;

	struct numeric_range selection = {0, 0};

	for (size_t i = 0; i < n_steps; ++i) {
		if (select_range(&selection, &steps[i].range, begin_inclusive, end_inclusive) > 0) {
			total += (selection.end - selection.begin) * steps[i].value;
		}
	}

	return total;
}
~~~

그리고 콘솔 인터페이스를 만들어준다.

실행파일 이름은 calculate로 할 것이고, 인자로 전기 사용량을 kWh 단위 정수로 입력받는다.

-h 옵션을 주면 숫자에 정갈하게 쉼표가 찍혀 나와 알아보기 편해진다.

-s 옵션을 주면 동계/하계 추가 누진 요금을 적용한다.

알아보기 편하라고 메인 함수에 일단 다 집어넣었는데, 대략 간추리면 아래와 같다.

~~~c
// main.c

if (argc < 2) {
    goto error_arg_no;
}

...

while (optind < argc) {
    if ((c = getopt(argc, (char *const *)argv, opstring)) != -1) {
        switch (c) {
            case 'h':
                fmt = VFMT_BGN VFMT_COMMA VFMT_INTONLY VFMT_END "\n";
                break;

            case 's':
                func = (struct step_function)ELECTRIC_CHARGES_FUNCTION_SUMMER_WINTER;
                break;

            case '?':
                goto error_option;

            default:
                err(-1, "Impossible case: unhandled option: %c", c);		
                break;
        }
    }
    else {
        ...
    }
}

...

value_t result = integrate_step_function(&func, 0, power_usage);

...

printf(fmt, result);

return 0;
~~~

그리고 제일 중요한 함수 정의는 여기에 있다.

~~~c
// electric_charges.h

#define ELECTRIC_CHARGES_FUNCTION												\
	{																			\
			.n_steps = 3,														\
			.steps = {															\
				{ .range = { 0, 200 }, .value = 93.3 },							\
				{ .range = { 201, 400 }, .value = 187.9 },						\
				{ .range = { 401, RANGE_MAX }, .value = 280.9 }					\
			}																	\
	}

#define ELECTRIC_CHARGES_FUNCTION_SUMMER_WINTER									\
	{																			\
			.n_steps = 4,														\
			.steps = {															\
				{ .range = { 0, 200 }, .value = 93.3 },							\
				{ .range = { 201, 400 }, .value = 187.9 },						\
				{ .range = { 401, 1000 }, .value = 280.9 },						\
				{ .range = { 1001, RANGE_MAX }, .value = 709.5 }				\
			}																	\
	}
~~~

생략을 많이 했다. 원본은 [여기](https://github.com/potados99/c-apps/tree/master/electric-charges-calc)에 있다.

실행해보면 아래와 같다.

![demo](/assets/images/elec-calc-demo.png)

> 450kWh 쓰면 69,816원. 실제 요금과는 다를 수 있다.

## 결론

너무 덥다. 에어컨 있어서 간신히 살 것 같다.

이제 실시간으로 요금 올라가는거 보면서 아껴틀어야겠다. 흑..

## 참고한 글들

- [fplot](https://kr.mathworks.com/help/matlab/ref/fplot.html)
- [Piecewise function - separate ranges in Matlab](http://www.matrixlab-examples.com/piecewise-function.html)
