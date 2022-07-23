---
title: "가난한 자의 MariaDB 프로시저 로깅"
summary: "Stored procedure 디버깅을 위한 눈물겨운 노력"
date: 2022-07-23 20:12:28 +0900
categories:
   - dev
---

## 들어가며

엔터프라이즈 애플리케이션에서 데이터베이스는 보통 시스템의 중심에 위치합니다. 이 점 때문인지, 소형 시스템에서는 도메인 로직의 구현이나 타 시스템과의 연계 또한 데이터베이스만으로 처리하는 경우가 있습니다.

이 경우, 로직의 구현을 위해 stored procedure(이하 '프로시저')나 stored function(이하 '함수')를 사용하게 됩니다. 이러한 프로시저는 절차형 SQL을 사용하여 작성합니다.

```sql
create procedure sp_insert_something(in something varchar(255))
begin
    -- ...생략...

    if something = 'hello' then
        insert into things set body = something;
    end if;

    -- ...생략...
end;
```

보통 프로그래밍 언어로 할 수 있는 것은 절차형 SQL로도 구현할 수 있습니다. 프로시저 안에 담아야 할 코드가 방대해지면 하위 프로시저/함수로 분리하여 작성할 수도 있습니다. `information_schema`를 통해 나름 reflection 같은 것도 지원하고(?) 스트링 값으로 임의의 루틴을 실행하도록 할 수도 있습니다.

## 프로시저 디버깅이 어려움

그러나 딱 거기까지입니다. 우리의 삶을 윤택하게 해주는 실시간 디버거와 풍부한 로깅이 MariaDB 루틴 안에는 없습니다.

디버거를 못 쓰니, 버그를 찾아 해결하려면 `printf("1");`같은 고전 스타일을 사용해야 합니다. 그나마 `print`같은 것이라도 있으면 좋을 텐데, result set을 반환하는 것 말고는 stdout에 텍스트 메시지를 출력할 방법이 없습니다.

## 해결책

비슷한 고민을 가진 질문을 [Stack overflow](https://stackoverflow.com/questions/3314771/print-debugging-info-from-stored-procedure-in-mysql)에서 찾았습니다. 가장 추천 수가 많은 답변은 대략 3가지 방법을 제시하는데, 그 중 바로 적용할 수 있는 것 두 개만 대략 요약하면 다음과 같습니다:

**1. 남길 내용을 result set으로 내보내기**
```sql
select '** 할 말' as log;
```

**2. 로그 테이블에 쌓기**
```sql
insert into logs set message = '할 말';
```

1번 방법의 경우는 개발할 때에 DB 콘솔에서 바로 로그가 보인다는 장점이 있지만, 프로시저가 반환하는 result set의 수가 늘어난다는 치명적인 단점이 있습니다.

이렇게 되면 해당 프로시저를 호출하는 애플리케이션은 진짜 실행 결과가 담긴 테이블이 몇 번째 result set에 있는지 모르게 될 것입니다.

따라서 선택의 여지가 없이 2번 방법으로 갑니다.

## 로그를 쌓아봅시다

적당한 이름의 로그 테이블을 하나 만들어 줍니다.

```sql
create table routine_logs
(
    id            int auto_increment comment '식별자입니다.'
        primary key,
    timestamp     datetime                             not null comment '로그의 발생 시각입니다.',
    level         varchar(16)                          null comment '로그의 레벨입니다. DEBUG, INFO, WARN, ERROR, FATAL 있습니다.',
    tag           varchar(255)                         null comment '로그의 태그입니다. 주로 로그 발생 위치입니다.',
    message       longtext                             null comment '로그의 메시지입니다.',
    session_user  varchar(255) default user()          null comment '로그를 발생시킨 사용자입니다.',
    connection_id int          default connection_id() null comment '로그가 발생한 연결의 식별자입니다.'
)
    comment '함수나 저장 프로시저에서 발생한 로그를 저장하는 테이블입니다.';
```

로그를 찍는 구문은 매우 짧고 명확하여 개발자의 정신적 부담을 덜어주어야 하므로, 로그 테이블에 새 줄을 추가하는 일은 별도의 프로시저에서 진행하도록 합니다.

```sql
create procedure log(IN $level varchar(255), IN $tag varchar(255), IN $message longtext)
main:
begin
    # 로그가 비활성화되어 있으면 건너뜁니다.
    if @log_enabled is not null and @log_enabled = false then
        leave main;
    end if;

    # 로그 테이블에 로그를 쌓습니다.
    insert into routine_logs
    set timestamp = current_timestamp,
        level     = $level,
        tag       = $tag,
        message   = $message;
end;
```

그리고 로그 레벨별로 alias 프로시저를 만들어 줍니다.

```sql
create procedure log_debug(IN $tag varchar(255), IN $message longtext)
main:
begin
    call log('DEBUG', $tag, $message);
end;
```

이제 특정 루틴 안에서 debug 로그를 남기려면 다음과 같이 쓰면 됩니다:

```sql
call log_debug(v_tag, concat('할 말...'));
```

끝!

## 마치며

역시 비싼 게 좋습니다. 후... MariaDB는 진짜...

## References

- [Print debugging info from stored procedure in MySQL](https://stackoverflow.com/questions/3314771/print-debugging-info-from-stored-procedure-in-mysql)
