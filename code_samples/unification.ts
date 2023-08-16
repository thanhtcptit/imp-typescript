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
    abstract contains(v: Var);
    abstract replace(v: Var, term: Term);
    abstract copy();
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

    public contains(v: Var) {
        return this.equals(v)
    }

    public replace(v: Var, term: Term) {
        if (this.equals(v))
            return term
        return this
    }

    public copy() {
        return new Var(this.name)
    }
}

class Fun extends Term {
    name: string
    params: Array<Term>

    constructor(name: string, params: Array<Term>) {
        super()
        this.name = name
        this.params = params
    }

    public repr() {
        let params_str: string = ""
        for (let i = 0; i < this.params.length; i++) {
            params_str += this.params[i].repr()
            if (i != this.params.length - 1)
            params_str += ", "
        }
        if (this.params.length > 0)
        params_str = "(" + params_str + ")"
        return this.name + params_str
    }

    public equals(other: Term) {
        return other instanceof Fun && this.repr() == other.repr()
    }

    public contains(v: Var) {
        for (let i = 0; i < this.params.length; i++)
            if (this.params[i].contains(v))
                return true
        return false
    }

    public replace(v: Var, term: Term) {
        for (let i = 0; i < this.params.length; i++) {
            if (this.params[i].contains(v))
                this.params[i] = this.params[i].replace(v, term)
        }
        return this.copy()
    }

    public copy() {
        let params_clone: Array<Term> = new Array<Term>()
        for (let i = 0; i < this.params.length; i++)
            params_clone.push(this.params[i].copy())
        return new Fun(this.name, params_clone)
    }
}

type Substitution = Map<Var, Term>

function merge(sub: Substitution) {
    let sub_vars: Array<Var> = Array.from(sub.keys())
    for (let v of sub_vars) {
        for (let v1 of sub_vars) {
            if (v.equals(v1))
                continue
            let t1: Term = sub.get(v1)
            if (t1.contains(v))
                sub.set(v1, t1.replace(v, sub.get(v)))
        }
    }
}

function unification(term_pairs: Array<[Term, Term]>, sub: Substitution) {
    // console.log(term_pairs)
    // console.log(sub)
    if (term_pairs.length == 0) return sub

    let pair: [Term, Term] = term_pairs[0]
    if (pair[0] instanceof Fun) {
        if (pair[1] instanceof Fun && pair[0].name == pair[1].name) {
            term_pairs = zip(pair[0].params, pair[1].params).concat(term_pairs.slice(1))
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
            if (pair[0].equals(pair[1]))
                return unification(term_pairs.slice(1), sub)

            if (pair[1] instanceof Fun && pair[1].contains(pair[0]))
                return undefined

            for (let i = 1; i < term_pairs.length; i++) {
                term_pairs[i] = [term_pairs[i][0].replace(pair[0], pair[1]),
                                 term_pairs[i][1].replace(pair[0], pair[1])]
            }
            sub.set(pair[0], pair[1])
            return unification(term_pairs.slice(1), sub)
        }
    }
    return undefined
}

function unify(t1: Term, t2: Term) {
    let sub: Substitution = new Map<Var, Term>()
    let res: Substitution | undefined = unification([[t1.copy(), t2.copy()]], sub)
    if (res == undefined)
        console.log("Unification failed for " + t1.repr() + " & " + t2.repr())
    else {
        merge(sub)
        let sub_str: string = ""
        sub.forEach((v: Term, k: Var) => {
            sub_str += k.repr() + " -> " + v.repr() + ", "
        })
        console.log("Unification for " + t1.repr() + " & " + t2.repr() + ": { " + sub_str + "}")
    }
}

let t1: Term = new Fun("add", [new Fun("0", []), new Var("x")]) // add(0, x)
let t2: Term = new Fun("add", [new Fun("0", []), new Fun("s", [new Var("x")])]) // add(0, s(x))
let t3: Term = new Fun("add", [new Var("x"), new Fun("s", [new Var("y")])]) // add(x + s(y))
let t4: Term = new Fun("add", [new Fun("s", [new Var("y")]), new Fun("s", [new Var("z")])]) // add(s(y) + s(z))
let t5: Term = new Fun("add", [new Var("z"), new Fun("s", [new Fun("s", [new Var("t")])])]) // add(z + s(s(t)))

unify(t1, t2)
unify(t1, t3)
unify(t3, t4)
unify(t3, t5)
unify(t4, t5)