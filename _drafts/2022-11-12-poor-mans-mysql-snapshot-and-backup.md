---
date: "2022-11-12 00:52:31 +0900"
title: 가난한 자의 MySQL 스냅샷 관리 시스템
summary: 아무도 안 만들어 준 것 같아서 자급자족 할래요...
categories:
  - dev
---

##  들어가며

어째 글 제목에 *가난한 자의 ...* 가 많은 것 같습니다. 하여간 제한된 환경은 무언가를 만들어내게 하는 극한의 동기부여 자극제인 것 같습니다.

MySQL, 혹은 MariaDB는 무료라서 좋습니다. 다만 [기능이 좀 부실](https://blog.potados.com/dev/poor-mans-procedure-logging-in-mariadb/)하고 아직 [버그](https://stackoverflow.com/questions/72905509/mariadb-query-using-exists-function-does-not-work-inside-function-body)가 많습니다.

요즈음 가장 아쉬운 점이, 시도때도 없이 테스트를 위해 DB를 비웠다 채웠다 하는데 요걸 매번 덤프 & 복구하는 것도 귀찮고, 주기적으로 백업을 위해 스크립트를 실행하는 것도 너무 지긋지긋한 것입니다. 그래서 새로운 걸 만들어 보기로 했습니다.

## 태초부터 내려오던 스크립트

## 이제는 웹으로 해보자, 스케줄된 스냅샷 백업 및 복구

## 백업 및 복구중에 실시간으로 상태 확인

## Cron으로 백업 스케줄 설정

## 백업 유효성 검증

## 마치며