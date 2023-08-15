function zip(l1: Array<any>, l2: Array<any>) {
    let min_length: number = Math.min(l1.length, l2.length)
    let r: Array<[any, any]> = new Array<[any, any]>()
    for (let i = 0; i < min_length; i++) {
        r.push([l1[i], l2[i]])
    }
    return r
}


abstract class Term {
    name: string

    abstract repr();
    abstract equals(other: Term);
}

class Var extends Term {
    name: string

    constructor(name: string) {
        super()
        this.name = name
    }

    public repr() {
        return this.name
    }

    public equals(other: Term) {
        return other instanceof Var && this.repr() == other.repr()
    }
}

class Fun extends Term {
    name: string
    vars: Array<Term>

    constructor(name: string, vars: Array<Var>) {
        super()
        this.name = name
        this.vars = vars
    }

    public repr() {
        let vars_str: string = ""
        for (let i = 0; i < this.vars.length; i++) {
            vars_str += this.vars[i].repr()
            if (i != this.vars.length - 1)
                vars_str += ", "
        }
        if (this.vars.length > 0)
            vars_str = "(" + vars_str + ")"
        return this.name + vars_str
    }

    public equals(other: Term) {
        return other instanceof Fun && this.repr() == other.repr()
    }
}

type Substitution = Map<Var, Term>

function unification(term_pairs: Array<[Term, Term]>, sub: Substitution) {
    if (term_pairs.length == 0) return sub

    let pair: [Term, Term] = term_pairs[0]
    if (pair[0] instanceof Fun) {
        if (pair[1] instanceof Fun && pair[0].name == pair[1].name) {
            term_pairs = zip(pair[0].vars, pair[1].vars).concat(term_pairs.slice(1))
            return unification(term_pairs, sub)
        } else
            return undefined
    }
    if (pair[0] instanceof Var) {
        let v: Term | undefined = sub.get(pair[0])
        if (v != undefined) {
            if (v.equals(pair[1]))
                return unification(term_pairs.slice(1), sub)
            return undefined
        } else {
            sub.set(pair[0], pair[1])
            return unification(term_pairs.slice(1), sub)
        }
    }
    return undefined
}

function unify(t1: Term, t2: Term) {
    let sub: Substitution = new Map<Var, Term>()
    let res: Substitution | undefined = unification([[t1, t2]], sub)
    if (res == undefined)
        console.log("Unification failed for " + t1.repr() + " and " + t2.repr())
    else {
        console.log("Unification for " + t1.repr() + " and " + t2.repr() + ": ")
        sub.forEach((v: Term, k: Var) => {
            console.log(k.repr() + " -> " + v.repr())
    })}
}

let t1: Term = new Fun("add", [new Fun("0", []), new Var("x")]) // add(0, x)
let t2: Term = new Fun("add", [new Fun("0", []), new Fun("s", [new Var("x")])]) // add(0, s(x))
let t3: Term = new Fun("add", [new Var("x"), new Fun("s", [new Var("y")])]) // add(x + s(y))
let t4: Term = new Fun("add", [new Fun("s", [new Var("y")]), new Fun("s", [new Var("z")])]) // add(s(y) + s(z))

unify(t1, t2)
unify(t1, t3)
unify(t3, t4)