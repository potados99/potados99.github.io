---
title: "TypeORM 마개조했습니다."
summary: "BaseEntity는 자식의 자식 세대를 거쳐 더욱 강해졌습니다..."
date: 2022-02-25 09:03:54 +0900
categories:
   - dev
---

제목 써놓고 보니 마개조라기에는 조금 부끄럽습니다.

## 발단

Node + Typescript로 API 서버를 짜다 보면은 ORM으로 TypeORM만한 것이 없습니다. 편하고, 예쁘고, 사용자 많고, 무엇보다 타입스크립트와 찰떡입니다.

그치만 JVM 위에서 JPA 구현체인 Hibernate을 사용하다 온 입장에서 조오금 불편한 점이 있습니다. 타입 애너테이션을 매번 붙여주어야 한다는건 차치하고서라도, 일단 lazy loading이 없어요.

![난그렇게살아왔는데](https://dispatch.cdnser.be/cms-content/uploads/2021/11/30/1827c44f-59b5-4f0f-bef8-c8b4834c9c64.png)

> 하지만 실망하지는 말아요. 자바스크립트는 그저 다른 방법으로 살아왔을 뿐..

예를 들어 회사 `Company`가 있고 직원 `Employee`가 있다고 해보겠습니다. `Employee`에는 해당 직원이 속한 회사를 나타내는 relation 필드 `company`가 있을겁니다.

보통 `Employee` 인스턴스를 가지고 있으면 바로 점을 찍고 `.company`를 참조하고 싶어집니다. 그런데 될까요?

```typescript
const employee = await Employee.findOne(userId);

console.log(employee.company.name); // cannot read property 'name' of undefined
```

뻗습니다. 제대로 작동하게 하려면 `findOne`을 호출할 시점에 `relations` 옵션을 넘겨 주어야 합니다.

```typescript
const employee = await Employee.findOne(userId, {relations: ['company']});

console.log(employee.company.name);
```

Fetch 시점에 eager 로딩할 필드를 지정할 수 있는 것은 좋습니다. 그런데 이게 매번 반복되면 조금 귀찮습니다. 그냥 엔티티별로 쿼리 시점에 다같이 가져올 필드를 정해 놓고 계속 돌려 쓸 수는 없을까요?

## 희망회로

이렇게 쓰면 어떨까 싶었습니다.

```typescript
@Entity()
class Employee extends BaseEntity {
    static relations = ['company'];

    // ... 생략

    @ManyToOne(() => Company)
    @JoinColumn()
    company: Company;

    // ...생략
}

const employee = await Employee.findOne(userId);

console.log(employee.company.name); // 잘 작동
```

상상만 해도 행복합니다. `find`나 `fineOne`을 부를 때마다 `relations` 때문에 인자 하나를 추가하고 중괄호를 열어야 하는 부담은... 생각보다 큽니다. 이 귀찮음에서 해방될 수 있다면 당장이라도 타입스크립트 교본을 펼쳐들고 베이스 클래스 설계를 시작할 수 있을 것 같습니다.

## 빌드업

기존의 엔티티 클래스들은 TypeORM이 제공하는 `BaseEntity`를 상속받아 쓰고 있습니다. 이제 이 엔티티 클래스와 `BaseEntity` 사이에 새로 만들 클래스를 끼워넣을겁니다. 이름은 `BaseBetterEntity` 정도로 하겠습니다.

```diff
- export default class User extends BaseEntity {
+ export default class User extends BaseBetterEntity {
```

하나씩 다 바꿔줍니다.

```diff
- export default class Event extends BaseEntity {
+ export default class Event extends BaseBetterEntity {
```

아, `BaseBetterEntity`를 정의해야죠!

```typescript
export default class BaseBetterEntity extends BaseEntity {
    static relations: string[] = [];

    // TODO 곧 채울 것
}
```

이제 구현을 시작해봅시다.

## 뚱땅뚱땅

기존 클래스가 지원하는 메소드를 오버라이드해서 자식 클래스에게 슈퍼파워를(?) 물려주고 싶습니다.

우리가 손댈 메소드는 `BaseEntity`에 있는 static 메소드인 `find`, `findOne`, `findOneOrFail`, 요렇게 세 개입니다.

그런데 잠깐! 여기서 골때림 포인트가 발생합니다.

![typeorm-find-overloads.png](/assets/images/typeorm-find-overloads.png)

오버로드가 기본 두세개씩은 있습니다. 이게 왜냐면 사용을 편하게 하기 위함입니다. TypeORM으로 엔티티를 찾을 때 정말 다양한 방법으로 인자를 구성할 수 있습니다.

```typescript
await Employee.find({name: '그사람'});
await Employee.find({where: {name: '그사람'}, {relations: ['company']}});

await Employee.findOne(36);
await Employee.findOne(36, {relations: ['company']});
await Employee.findOne({name: '그사람'}, {relations: ['company']});
await Employee.findOne({where: {name: '그사람'}, relations: ['company']});
```

![이마탁](https://opgg-com-image.akamaized.net/attach/images/20190711130352.369554.jpeg)

이걸 유연하다 해야 할 지, 아니면 흐물흐물하다 해야 할 지 모르겠습니다만, 최소한 쓸 때에는 편했던 것 같습니다. 아무튼 대대로 엄숙히 내려오던 `BaseEntity`의 족보에 끼어들어 메소드 호출을 잘 가로채려면 오버로드를 모두 지원해야 합니다.

일단 오버로드 선언을 모두 써준 다음에 구현체를 작성하기 시작합니다.

```typescript
export default class BaseBetterEntity extends BaseEntity {
    static relations: string[] = [];

    static find<T extends BaseBetterEntity>(this: ObjectType<T>, options?: FindManyOptions<T>): Promise<T[]>;
    static find<T extends BaseBetterEntity>(this: ObjectType<T>, conditions?: FindConditions<T>): Promise<T[]>;
    static find<T extends BaseBetterEntity>(this: ObjectType<T>, optionsOrConditions?: FindManyOptions<T> | FindConditions<T>): Promise<T[]> {
        // 어..이제 어떡하지..?
    }
}
```

### 으악: 문제를 마주함

그런데 다시 고뇌의 시간이 찾아옵니다. 문제가 두 개가 있는데요, 일단 `find` 메소드 내에서 `this.relations`와 같은 접근이 안 됩니다. 왜냐하면 `this`라는 이름의 파라미터가 있기 때문입니다. 자식 클래스가 오버라이드한 `relations`에 접근할 수 있어야 이 모든게 작동하는지라, 꼭 해결해야 합니다.

또 다른 문제는 `relations` 필드를 어디에 끼워야 하는지 판별해야 하는 것입니다. 두 오버로드를 모두 수용할 수 있도록 마지막에 정의된 `find` 메소드는 인자로 `{name: '그사람'}`과 같은 `FindConditions`를 받을 수도 있고 `{where: {name: '그사람'}}`과 같은 `FindManyOptions`를 받을 수도 있습니다.

만약 인자가 알고봤더니 `FindConditions` 타입이었다면 `FindManyOptions`을 만들 때에 해당 인자를 `{where: optionsOrConditions, relations: [...]}`과 같이 감싸야 할 것입니다. 반대로 `FindManyOptions` 타입이었다면 `{...optionsOrConditions, relations: [...]}`와 같이 써야 할 것입니다.

### 휴: 해결책이 떠오름

![](https://blog.kakaocdn.net/dn/b3RVUi/btq1V2btZff/qNXR8mYYkZKg7Pku1zFYhk/img.jpg)

> 글과 무관합니다. 그냥 이 짤이 써보고 싶었어요 ㅎㅎ

차근차근 생각을 거듭하면서 답을 찾았습니다. 일단 `this`에 접근하지 못하는 문제는 `super`에 접근하는 것으로 해결할 수 있습니다. `BaseBatterEntity`와 `BaseEntity` 사이에 클래스를 하나 더 두어 거기에 `findInternal` 같은 것을 갖다 둔 다음에 `super.findInternal(optionsOrConditions)`의 결과를 반환하도록 만드는 것이지요! 이렇게요:

```typescript
// BaseBetterEntity.ts
export default class BaseBetterEntity extends BaseInternalFindExtendedEntity {
    static find<T extends BaseBetterEntity>(this: ObjectType<T>, options?: FindManyOptions<T>): Promise<T[]>;
    static find<T extends BaseBetterEntity>(this: ObjectType<T>, conditions?: FindConditions<T>): Promise<T[]>;
    static find<T extends BaseBetterEntity>(this: ObjectType<T>, optionsOrConditions?: FindManyOptions<T> | FindConditions<T>): Promise<T[]> {
        return super.findInternal(optionsOrConditions);
    }

    static findOne<T extends BaseBetterEntity>(this: ObjectType<T>, id?: EntityId, options?: FindOneOptions<T>): Promise<T | undefined>;
    static findOne<T extends BaseBetterEntity>(this: ObjectType<T>, options?: FindOneOptions<T>): Promise<T | undefined>;
    static findOne<T extends BaseBetterEntity>(this: ObjectType<T>, conditions?: FindConditions<T>, options?: FindOneOptions<T>): Promise<T | undefined>;
    static findOne<T extends BaseBetterEntity>(this: ObjectType<T>, idOrOptionsOrConditions?: EntityId | FindOneOptions<T> | FindConditions<T>, maybeOptions?: FindOneOptions<T>): Promise<T | undefined> {
      return super.findOneInternal(idOrOptionsOrConditions, maybeOptions);
    }

    static findOneOrFail<T extends BaseBetterEntity>(this: ObjectType<T>, id?: EntityId, options?: FindOneOptions<T>): Promise<T>;
    static findOneOrFail<T extends BaseBetterEntity>(this: ObjectType<T>, options?: FindOneOptions<T>): Promise<T>;
    static findOneOrFail<T extends BaseBetterEntity>(this: ObjectType<T>, conditions?: FindConditions<T>, options?: FindOneOptions<T>): Promise<T>;
    static findOneOrFail<T extends BaseBetterEntity>(this: ObjectType<T>, idOrOptionsOrConditions?: EntityId | FindOneOptions<T> | FindConditions<T>, maybeOptions?: FindOneOptions<T>): Promise<T> {
      return super.findOneOrFailInternal(idOrOptionsOrConditions, maybeOptions);
    }
}

// BaseInternalFindExtendedEntity.ts
export default class BaseInternalFindExtendedEntity extends BaseEntity {
    static relations: string[] = [];

    protected static async findInternal<T extends BaseEntity>(optionsOrConditions?: FindManyOptions<T> | FindConditions<T>): Promise<T[]> {
        // 접근 가능! 최종 상속받은 클래스의 relations 정의가 사용될 것입니다.
        this.relations;

        // TODO: 적당한 구현체
    }

    protected static async findOneInternal<T extends BaseEntity>(first?: EntityId | FindOneOptions<T> | FindConditions<T>, second?: FindOneOptions<T>): Promise<T | undefined> {
        // TODO: 적당한 구현체
    }

    protected static async findOneOrFailInternal<T extends BaseEntity>(first?: EntityId | FindOneOptions<T> | FindConditions<T>, second?: FindOneOptions<T>): Promise<T> {
        // TODO: 적당한 구현체
    }
}
```

그리고 오버로드의 각기 다른 인자를 어떻게 처리할지는 TypeORM 구현체 코드를 보고 답을 얻었습니다.

```typescript
/**
 * Finds entities that match given find options or conditions.
 */
async find<Entity>(entityClass: EntityTarget<Entity>, optionsOrConditions?: FindManyOptions<Entity>|FindConditions<Entity>): Promise<Entity[]> {
    const metadata = this.connection.getMetadata(entityClass);
    const qb = this.createQueryBuilder<Entity>(entityClass as any, FindOptionsUtils.extractFindManyOptionsAlias(optionsOrConditions) || metadata.name);


    if (!FindOptionsUtils.isFindManyOptions(optionsOrConditions) || optionsOrConditions.loadEagerRelations !== false)
        FindOptionsUtils.joinEagerRelations(qb, qb.alias, metadata);


    return FindOptionsUtils.applyFindManyOptionsOrConditionsToQueryBuilder(qb, optionsOrConditions).getMany();
}
```

`FindOptionsUtils`라는 친구의 도움을 얻어 주어진 인자가 어떤 녀석인지 판단하는 모습입니다.

이제 코드는 이런 모양일 겁니다:

```typescript
protected static async findInternal<T extends BaseEntity>(optionsOrConditions?: FindManyOptions<T> | FindConditions<T>): Promise<T[]> {
  if (isFindManyOptions(optionsOrConditions)) {
    /** 첫번째 오버로드. */
    return await super.find<T>(this.generateOptionsFromExisting(optionsOrConditions));
  } else {
    /** 두번째 오버로드. */
    return await super.find<T>({where: optionsOrConditions, ...this.generateOptionsFromExisting()});
  }
}

private static generateOptionsFromExisting(optionsLike?: any) {
  return {...(optionsLike || {}), relations: this.relations};
}
```

이렇게 `findInternal` 구현을 작성한 다음에 `findOneInternal` 구현을 시작했습니다. 지금까지 나열한 것의 두 배 정도 되는 삽질을 겪었으나 자세히 쓰지는 않겠습니다...🥲

아무튼 코드는 이렇게 생겼어요:

```typescript
protected static async findOneInternal<T extends BaseEntity>(first?: EntityId | FindOneOptions<T> | FindConditions<T>, second?: FindOneOptions<T>): Promise<T | undefined> {
    const firstParamIsUndefined = first == null;
    const firstParamIsId = isId(first);
    const firstParamIsFindOptions = isFindOneOptions(first);
    const firstParamIsFindConditions = isFindConditions(first);

    const secondParamsIsUndefined = second == null;
    const secondParamsIsFindOptions = isFindOneOptions(second);

    if ((firstParamIsUndefined || firstParamIsId) && (secondParamsIsUndefined || secondParamsIsFindOptions)) {
      /** 첫번째 오버로드. */
      return await super.findOne<T>(first, this.generateOptionsFromExisting());
    }

    if (firstParamIsFindOptions && secondParamsIsUndefined) {
      /** 두번째 오버로드. */
      return await super.findOne<T>(this.generateOptionsFromExisting(first));
    }

    if ((firstParamIsUndefined || firstParamIsFindConditions) && (secondParamsIsUndefined || secondParamsIsFindOptions)) {
      /** 세번째 오버로드. */
      return await super.findOne<T>(first, this.generateOptionsFromExisting(first));
    }

    throw Error('No matching overload found.');
  }
```

네... 결국 타입 서포팅 약한 자바스크립트에서 눈물겨운 노력으로 만들어낸,,, 인자 타입을 보고 적절한 오버로드를 런타임에서 찾아서 수동으로 매칭해주는 작업입니다...

## 결론

그래서 과연 평화가 찾아왔는가?

네 그렇습니다. 이제 엔티티를 찾으러 갈 때에 `relations: ['user', 'event', 'event.user', 'event.comments', 'event.likes', 'event.notifications']`와 같은 무거운 것들을 달고 다니지 않아도 됩니다.

그저 엔티티 클래스 안에 `static relations = [...];`와 같이 딱 한번만 적어 주면 됩니다. 덤으로 타입스크립트에서 오버로드 처리하는 방법도 이번에 제대로 익혔네요.

## 원모어띵

조상이 하는 일은 모두 자식에게 영향을 미칩니다. 이제 모든 엔티티가 `BaseBetterEntity`를 상속받으니, `toString`같은 것을 만들기 딱 좋은 상태가 되었습니다.

```typescript
toString() {
  // @ts-ignore
  return `[id가 ${this.constructor.getId(this)}인 ${this.constructor.name}]`;
}
```

`BaseBatterEntity` 안에 이런 메소드를 하나 만들어 줍니다. 이제 모든 엔티티는 `toString` 메소드를 가지게 될 겁니다. 매번 밖에서 `id`를 참조할 필요 없이 스스로가 자기를 잘 설명하겠지요!

## TMI

[TypeORM의 EntityManager 속 findOne 구현 787줄](https://github.com/typeorm/typeorm/blob/e78957fb3da6c7c91f134f21f089a732802f55c3/src/entity-manager/EntityManager.ts#L787)을 보면 첫 번째 인자가 id인지 판단하기 위해 다음과 같은 식을 쓰는 부분이 있습니다:

```typescript
const passedId =
    typeof idOrOptionsOrConditions === "string" ||
    typeof idOrOptionsOrConditions === "number" ||
    (idOrOptionsOrConditions as any) instanceof Date;
```

해당 메소드의 인자를 보니, id로 인식되는 인자가 가질 수 있는 타입은 `string|string[]|number|number[]|Date|Date[]|ObjectID|ObjectID[]`입니다.

그런데 저 `passedId`를 구할 때에 `string`, `number`, `Date`은 체크하는데 `ObjectID` 타입에 대한 체크가 빠져있는 것 같아 조금 의아했습니다. `ObjectID`가 `FindOneOptions`이나 `FindConditions`는 분명히 아니니 처리가 필요할 것 같아 보였거든요. 어떻게 동작할지 테스트는 안해봤지만 궁금하네요.

긴 글 읽어주셔서 감사합니다.

끝!

## References

- [TypeScript function overloading](https://stackoverflow.com/questions/13212625/typescript-function-overloading)
