// Using any type - should trigger type safety warning
let unsafeValue: any = 'test';

// Empty interface - should trigger architecture warning
interface EmptyInterface {}

// Function with boolean parameter and no return type - multiple issues
function processData(isValid: boolean, _unusedParam: string) {
  // Non-null assertion - should trigger type safety warning
  const value = unsafeValue!.toString();

  // Nested ternary - should trigger readability warning
  const result = isValid ? (value.length > 5 ? 'long' : 'short') : 'invalid';

  // Type assertion - should trigger type safety warning
  return (result as any).toUpperCase();
}

// Complex union type - should trigger architecture warning
type ComplexType = string | number | boolean | null | undefined | object;

// Type alias instead of interface - should trigger suggestion
type UserType = {
  id: number;
  name: string;
};

// Function with implicit any return
function getData() {
  return fetch('/api/data');
}

// Nested ternary with type assertion
const processValue = (val: unknown) => {
  return val// Using any type - should trigger type safety warning
let unsafeValue: any = 'test';

// Empty interface - should trigger architecture warning
interface EmptyInterface {}

// Function with boolean parameter and no return type - multiple issues
function processData(isValid: boolean, _unusedParam: string) {
  // Non-null assertion - should trigger type safety warning
  const value = unsafeValue!.toString();

  // Nested ternary - should trigger readability warning
  const result = isValid ? (value.length > 5 ? 'long' : 'short') : 'invalid';

  // Type assertion - should trigger type safety warning
  return (result as any).toUpperCase();
}

// Complex union type - should trigger architecture warning
type ComplexType = string | number | boolean | null | undefined | object;

// Type alias instead of interface - should trigger suggestion
type UserType = {
  id: number;
  name: string;
};

// Function with implicit any return
function getData() {
  return fetch('/api/data');
}

// Nested ternary with type assertion
const processValue = (val: unknown) => {
  return val
    ? (val as any).value
      ? ((val as any).value as string).toUpperCase()
      : 'no value'
    : 'invalid';
};

// Security issue - eval usage
function runCode(code: string) {
  return eval(code);
}

// Performance issue - inefficient loop
function processArray(items: number[]) {
  items.forEach((_, i) => {
    items.forEach((_, j) => {
      console.log(i + j);
    });
  });
}
    ? (val as any).value
      ? ((val as any).value as string).toUpperCase()
      : 'no value'
    : 'invalid';
};

// Security issue - eval usage
function runCode(code: string) {
  return eval(code);
}

// Performance issue - inefficient loop
function processArray(items: number[]) {
  items.forEach((_, i) => {
    items.forEach((_, j) => {
      console.log(i + j);
    });
  });
}