const value$2 = 'value 1';
console.log(value$2);

const value$1 = 'value 2';
console.log(value$1);

const value = 'value 3';
console.log(value);

const Foo = () => {};
const result = <Foo bar baz="string" quux-nix={value$1} />;

export { result };
