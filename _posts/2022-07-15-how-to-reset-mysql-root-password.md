---
published: true
title: MySQL 루트 비밀번호 초기화
excerpt: 또 잊어버리기 전에 정리합니다.
date: '2022-07-15 22:52:00 +0900'
category: dev
---
서버마다 시스템 사용자 비밀번호에 이어 데이터베이스 사용자 비밀번호까지 기억해야 하다 보니 가끔은 뇌가 파업을 선언합니다. MySQL 루트 비밀번호를 자주 잊어버려서, 초기화하는 방법을 정리해봅니다.

## mysqld_safe를 사용하는 방법

### 1. 서비스 중지

데이터베이스 데몬을 멈춥니다.

~~~bash
$ sudo systemctl stop mysql
~~~

### 2. 무방비 상태로 실행

--skip-grant-tables 옵션을 주어 데몬을 실행합니다. [이렇게 하면 모두가 루트 권한](https://dev.mysql.com/doc/refman/5.6/en/server-options.html#option_mysqld_skip-grant-tables)을 얻습니다.

~~~bash
$ mysqld_safe --skip-grant-tables &
~~~

### 3. 비밀번호 초기화

mysql 쉘을 띄우고 다음 query를 실행해줍니다.

~~~sql
ALTER USER root IDENTIFIED BY '새 암호';
FLUSH PRIVILEGES;
~~~

### 4. 서비스 돌려놓기

이제 아까 mysqld_safe로 띄웠던 프로세스를 종료하고, 다시 데이터베이스 데몬을 띄웁니다.

~~~bash
$ mysqladmin -u root -p shutdown
$ sudo systemctl start mysql
~~~

## 참고

- https://www.a2hosting.com/kb/developer-corner/mysql/reset-mysql-root-password
- https://dev.mysql.com/doc/refman/8.0/en/set-password.html
- https://dev.mysql.com/doc/refman/5.6/en/server-options.html#option_mysqld_skip-grant-tables
