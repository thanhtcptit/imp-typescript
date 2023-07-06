interface INumber {
    x: number
    y: number
}

interface IString {
    n: string
}

interface M1 {
    val: INumber
}

interface M2 {
    val: IString
}

type M_int = M1 & M2
type M_uni = M1 | M2

let s1: M_int = {
    val: {
        x: 1,
        y: 2,
        n: "s1"
    }
}

let s2: M_uni = {
    val: {
        x: 1,
        y: 2
    }
}

console.log(s1)
console.log(s2)
