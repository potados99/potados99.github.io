---
title: "Sequelize의 hasMany vs belongsTo vs belongsToMany는 무엇이 다를까"
summary: "문서는 답을 알고 있다."
date: 2020-12-17 18:13:04 +0900
categories:
   - rdb
---

늘 `belongsTo`만 쓰다가 `hasMany`는 뭘까 궁금해져 알아보았다. [Sequelize 문서](https://sequelize.org/master/class/lib/associations/base.js~Association.html)를 구경해보자.

## belongsTo

> **One-to-one association**    
In the API reference below, add the name of the association to the method, e.g. for User.belongsTo(Project) the getter will be user.getProject().    
출처: [BlongsTo | Sequelize](https://sequelize.org/master/class/lib/associations/belongs-to.js~BelongsTo.html)

**One To One** 또는 **One To Many** 관계를 표현할 때에 사용한다.

*Sequelize*에서 `City.belongsTo(Country)`처럼 쓰면 된다.

그러면 `City` 테이블에는 `Country`를 가리키는 foregin key `countryId`가 생긴다.

## hasMany

> **One-to-many association**    
In the API reference below, add the name of the association to the method, e.g. for User.hasMany(Project) the getter will be user.getProjects(). If the association is aliased, use the alias instead, e.g. User.hasMany(Project, { as: 'jobs' }) will be user.getJobs().    
출처: [HasMany | Sequelize](https://sequelize.org/master/class/lib/associations/has-many.js~HasMany.html)

**One to Many** 관계를 표현할 때에 사용한다.

`City.belongsTo(Country)`와 `Country.hasMany(City)` 모두 `City` 테이블에 `Country`를 가리키는 foreign key를 추가한다.

### belongsTo와의 차이

그럼 `belongsTo`와 같은가? 코드 레벨에서 사용상의 차이가 있다.

`City.belongsTo(Country)`는 `city.getCountry()`를 가능하게 해준다.    
`Country.hasMany(City)`는 `country.getCities()`를 가능하게 해준다.

### 필요한가?

`Country` 인스턴스가 있고, 이에 딸린 `City`를 가져오는 상황이다.

만약 `City.belongsTo(Country)`만 존재했다면, `City` 테이블에 `where: { countryId === theCountryId }` 조건을 달아 질의해야 한다.

~~~js
const citiesOfCountry = await City.findAll({
  where: {
    countryId: theCountry.id
  }
});
~~~

하지만 `Country.hasMany(City)`가 있으면 그 수고를 조금 덜 수 있다.

~~~js
const citiesOfCountry = await theCountry.getCities();
~~~

### 요약

`belongsTo`와 `hasMany` 모두 두 테이블 사이에 일대다 연관관계를 만든다. 둘 중 하나만 써도 상관없다. 둘 중 필요한 메소드를 제공하는 쪽을 사용하면 된다.

## belongsToMany

> **Many-to-many** association with a join table.    
출처: [BelongsToMany | Sequelize](https://sequelize.org/master/class/lib/associations/belongs-to-many.js~BelongsToMany.html)

**Many To Many** 관계에는 이것을 사용한다.

그냥 관계형 DB는 n:n 관계를 표현하지 못한다. 따라서 두 테이블의 관계를 나타내는 **join table** 테이블이 필요하다.

가령 아래와 같은 식이다:

~~~
User:
id | first  | last
=====================
1  | John   | Lee
2  | Jane   | Wilson
3  | Daniel | Gomez

Project:
id | name
=============
1  | AMADDA
2  | Cafeteria
3  | INUClub

UserProject:
userId | projectId
======================
  1    |  2   # John은 Cafeteria에 참여
  1    |  3   # John은 INUClub에 참여
  2    |  2   # Jane은 Cafeteria에 참여
  3    |  1   # Daniel은 AMADDA에 참여
~~~

*Sequelize* 이 부분을 처리해준다.

~~~js
UserProject = sequelize.define('user_project', {});
~~~

이렇게 적절한 join table을 만들고

~~~js
User.belongsToMany(Project, { through: UserProject });
Project.belongsToMany(User, { through: UserProject });
~~~

위에서 만든 `UserProject`을 명시하여 주면 된다.

그럼 이제 `user.getProjects()` 또는 `user.addProjects()`로 쉽게 가져다 쓸 수 있다.

## Reference

- https://sequelize.org/master/class/lib/associations/base.js~Association.html
- https://gist.github.com/anonymous/79c2eed2a634777b16ff
- https://stackoverflow.com/questions/36208460/hasmany-vs-belongstomany-in-laravel-5-x
- https://wooooooak.github.io/node.js/2018/11/22/sequelize-1-대-다/
- https://stackoverflow.com/questions/20290815/belongsto-vs-hasmany-in-sequelize-js
