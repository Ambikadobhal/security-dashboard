### TanStack Table  - 
a popular, headless utility for building powerful tables and data grids in web applications

### Zustand
a small, fast, and scalable state management library for React

### install trivy scanning tool

### TypeScript

there one topic called Interfaces in TypeScript, which is a powerful feature that allows you to define the shape of objects and enforce type safety in your code. Interfaces can be used to define the structure of objects, classes, and functions, making it easier to work with complex data structures and ensuring that your code adheres to a specific contract.



there is a keyword called **implements** when i write class myClass impplements myInterface it means that myClass must adhere to the structure defined by myInterface. This ensures that the class has all the required properties and methods specified in the interface, providing a clear contract for how the class should behave.

## this is for class 

```typescript

    interface Employee {
    name: string;
    age: number;
    position: string;
}

class Manager implements Employee {
    name: string;
    age: number;
    position: string;
    
    constructor(name: string, age: number, position: string) {
        this.name = name;
        this.age = age;
        this.position = position;
    }
}
const manager1 = new Manager("John Doe", 35, "Project Manager");
console.log(manager1); 
```

## this for object how we use interface in object

``` typescript
interface User {
    username: string;
    role: string;
}

// You apply the interface directly here using a colon ( : )
const user1: User = {
    username: "Alex99",
    role: "Admin"
};
```

## Interface for Function Parameters

``` typescript
function printUserProfile(user: User) {
    console.log(`${user.username} is an ${user.role}`);
}

// This works perfectly because user1 matches the User interface
printUserProfile(user1);

```

### Type Aliases

type aliases in TypeScript allow you to create a new name for a type. This can be useful for simplifying complex types, making your code more readable, and reusing types across your application. Type aliases can represent primitive types, union types, intersection types, and even function signatures.

``` typescript
type CarYear = number  // we define carYear as a type alias for number
type CarType = string
type Car = {
  year: CarYear,
  type: CarType,
}
const carYear: CarYear = 2001
const carType: CarType = "Toyota"
const car: Car = {
  year: carYear,
  type: carType,
};
```
## Intersection Types (&)

An intersection type combines multiple types into one.

``` typescript

type animal = {name : string }; // this is base type  it must be an object with a name property of type string

type bear = animal & {honey : boolean}; // here  & act as a intersection operator " a bear is animal and it has a honey property of type boolean"

 // behine the secene
type Bear = {
  name: string;
  honey: boolean;
};

const bear: Bear = { name: "Winnie", honey: true };

```

##  Union Types (|)

``` typescript
type Status = "success" | "error";
```

### Optional Properties

optional properties are object properties that do not require a value when you create an object

``` typescript      
type User = {
  id: number;
  username: string;
  bio?: string; // 👈 Notice the question mark
};

//we can create a user object without the bio property, and TypeScript will not throw an error.
```
### Record

"Record<Keys, Type>"

``` typescript

type UserRole = "admin" | "editor" | "guest";  // 1. Define the allowed keys (the roles)

// 2. Define the shape of the value
type Permissions = {
  canEdit: boolean;
  canDelete: boolean;
};

// 3. Combine them using Record
const rolePermissions: Record<UserRole, Permissions> = {
  admin: { canEdit: true, canDelete: true },
  editor: { canEdit: true, canDelete: false },
  guest: { canEdit: false, canDelete: false },
};

```

### Generics

genercis allow to create reusable components and function that can work with a variety of types rather than a single one, without losing the benefits of static type-checking.

    ```typescript
function copy<T>(arg: T): T {
  return arg;
}
    ```


### Discriminated Unions

Discriminated Union (also known as a Tagged Union or Algebraic Data Type) is a powerful pattern used to combine multiple closely related types into a single union, using a shared, literal property to differentiate between them.

``` typescript
interface LoadingState {
  status: 'loading'; // Discriminator
}

interface SuccessState {
  status: 'success'; // Discriminator
  data: string;      // Only exists on success
}

interface ErrorState {
  status: 'error';   // Discriminator
  error: Error;      // Only exists on error
}

// Combine them into a Discriminated Union
type NetworkState = LoadingState | SuccessState | ErrorState;
```