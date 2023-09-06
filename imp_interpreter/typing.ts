import { AssertionError } from 'assert'
import {Statement, SequentialStatement, Interpreter, AssignStatement, IfStatement, 
        WhileStatement, Expression, VariableExpression, ValueExpression, MathExpression,
        ComparisonExpression, AndExpression, OrExpression, NotExpression, FunctionDefExpression,
        FunctionCallExpression} from './intepreter'


function assert(condition, message) {
    if (condition == false)
        throw new AssertionError({"message": message})
}

function zip(l1: Array<any>, l2: Array<any>) {
    let min_length: number = Math.min(l1.length, l2.length)
    let r: Array<[any, any]> = new Array<[any, any]>()
    for (let i = 0; i < min_length; i++) {
        r.push([l1[i], l2[i]])
    }
    return r
}

abstract class TypeTerm {
    name: string

    abstract toString()
    abstract equals(other: TypeTerm)
    abstract contains(v: TypeVariable)
    abstract replace(v: TypeVariable, term: TypeTerm)
    abstract copy()
}

export class TypeVariable extends TypeTerm {
    constructor(name: string) {
        super()
        this.name = name
    }

    public toString() {
        return this.name
    }

    public equals(other: TypeTerm) {
        return other instanceof TypeVariable && this.toString() == other.toString()
    }

    public contains(v: TypeVariable) {
        return this.equals(v)
    }

    public replace(v: TypeVariable, term: TypeTerm) {
        if (this.equals(v))
            return term
        return this
    }

    public copy() {
        return new TypeVariable(this.name)
    }
}

export class TypeArrow extends TypeTerm {
    left: TypeTerm
    right: TypeTerm

    constructor(left: TypeTerm, right: TypeTerm) {
        super()
        this.left = left
        this.right = right
    }

    public toString() {
        return "(" + this.left.toString() + " -> " + this.right.toString() + ")"
    }

    public equals(other: TypeTerm) {
        return other instanceof TypeArrow && this.toString() == other.toString()
    }

    public contains(v: TypeVariable) {
        return this.left.contains(v) || this.right.contains(v)
    }

    public replace(v: TypeVariable, term: TypeTerm) {
        this.left = this.left.replace(v, term)
        this.right = this.right.replace(v, term)
        return this.copy()
    }

    public copy() {
        return new TypeArrow(this.left, this.right)
    }
}

export class TypeConstructor extends TypeTerm {
    con_name: string

    constructor(con_name: string) {
        super()
        this.con_name = con_name
    }

    public toString() {
        return this.con_name
    }

    public equals(other: TypeTerm) {
        return other instanceof TypeConstructor && this.toString() == other.toString()
    }

    public contains(v: TypeVariable) {
        return false
    }

    public replace(v: TypeVariable, term: TypeTerm) {
        return this
    }

    public copy() {
        return new TypeConstructor(this.con_name)
    }
}

abstract class HMExpression {
    type_var: TypeVariable
    type_return: TypeArrow | TypeConstructor | null

    public abstract toString()
    public abstract equals(other: HMExpression)
}

export class HMVariableExpression extends HMExpression {
    name: string
    scope: string

    constructor(name: string, scope: string) {
        super()
        this.name = name
        this.scope = scope
    }

    public toString() {
        return this.name + "::" + this.scope
    }

    public equals(other: HMExpression) {
        return other instanceof HMVariableExpression && this.toString() == other.toString()
    }
}

export class HMIntegerExpression extends HMExpression {
    val: number

    constructor(val: number) {
        super()
        this.val = val
    }

    public toString() {
        return +this.val
    }

    public equals(other: HMExpression) {
        return other instanceof HMIntegerExpression && this.toString() == other.toString()
    }
}

export class HMBooleanExpression extends HMExpression {
    val: boolean

    constructor(val: boolean) {
        super()
        this.val = val
    }

    public toString() {
        return +this.val
    }

    public equals(other: HMExpression) {
        return other instanceof HMBooleanExpression && this.toString() == other.toString()
    }
}

export class HMApplicationExpression extends HMExpression {
    exp1: HMExpression
    exp2: HMExpression

    constructor(exp1: HMExpression, exp2: HMExpression) {
        super()
        this.exp1 = exp1
        this.exp2 = exp2
    }

    public toString() {
        return "(" + this.exp1.toString() + " " + this.exp2.toString() + ")"
    }

    public equals(other: HMExpression) {
        return other instanceof HMApplicationExpression && this.toString() == other.toString()
    }
}

export class HMAbstractionExpression extends HMExpression {
    x: HMVariableExpression
    exp: HMExpression

    constructor(x: HMVariableExpression, exp: HMExpression) {
        super()
        this.x = x
        this.exp = exp
    }

    public toString() {
        return "\\" + this.x.toString() + ". " + this.exp.toString()
    }

    public equals(other: HMExpression) {
        return other instanceof HMAbstractionExpression && this.toString() == other.toString()
    }
}

export class HMLetExpression extends HMExpression {
    x: HMVariableExpression
    exp1: HMExpression
    exp2: HMExpression

    constructor(x: HMVariableExpression, exp1: HMExpression, exp2: HMExpression) {
        super()
        this.x = x
        this.exp1 = exp1
        this.exp2 = exp2
    }

    public toString() {
        return "let " + this.x.toString() + " = " + this.exp1.toString() + 
            " in " + this.exp2.toString()
    }

    public equals(other: HMExpression) {
        return other instanceof HMLetExpression && this.toString() == other.toString()
    }
}

function translateExpression(exp, func_name: string) {
    if (exp instanceof ValueExpression) {
        if (typeof exp.val == "number")
            return new HMIntegerExpression(exp.val)
        if (typeof exp.val == "boolean")
            return new HMBooleanExpression(exp.val)
        assert(false, exp.val)
    }

    if (exp instanceof VariableExpression)
        return new HMVariableExpression(exp.var_name, func_name)

    if (exp instanceof NotExpression)
        return new HMApplicationExpression(
            new HMVariableExpression("!", func_name),
            translateExpression(exp.exp, func_name)
        )
    
    if (exp instanceof FunctionCallExpression) {
        let func_call_hm: HMExpression = new HMVariableExpression(exp.name, func_name)
        for (let i = 0; i < exp.args.length; i++)
            func_call_hm = new HMApplicationExpression(
                func_call_hm, translateExpression(exp.args[i], func_name))
        return func_call_hm
    }

    let op: string = ""
    if (exp instanceof AndExpression)
        op = "&&"
    else if (exp instanceof OrExpression)
        op = "||"
    else {
        assert(exp instanceof MathExpression || exp instanceof ComparisonExpression, exp)
        op = exp.op
    }

    return new HMApplicationExpression(
        new HMApplicationExpression(
            new HMVariableExpression(op, func_name),
            translateExpression(exp.left_exp, func_name)),
        translateExpression(exp.right_exp, func_name)
    )
}

function translateStatement(stm: Statement, func_name: string) {
    if (stm instanceof SequentialStatement)
        return new HMApplicationExpression(
            new HMApplicationExpression(
                new HMVariableExpression(";", func_name),
                translateStatement(stm.first_stm, func_name)
            ),
            translateStatement(stm.second_stm, func_name)
        )

    if (stm instanceof AssignStatement)
        return new HMApplicationExpression(
            new HMApplicationExpression(
                new HMVariableExpression(":=", func_name),
                new HMVariableExpression(stm.var_name, func_name)
            ),
            translateExpression(stm.exp, func_name)
        )

    if (stm instanceof IfStatement) {
        if (stm.false_stm == null)
            return new HMApplicationExpression(
                new HMApplicationExpression(
                    new HMVariableExpression("if", func_name),
                    translateExpression(stm.condition_stm, func_name)
                ),
                translateStatement(stm.true_stm, func_name)
            )

        return new HMApplicationExpression(
            new HMApplicationExpression(
                new HMApplicationExpression(
                    new HMVariableExpression("if-else", func_name),
                    translateExpression(stm.condition_stm, func_name)
                ),
                translateStatement(stm.true_stm, func_name)
            ),
            translateStatement(stm.false_stm, func_name)
        )
    }

    if (stm instanceof WhileStatement) {
        return new HMApplicationExpression(
            new HMApplicationExpression(
                new HMVariableExpression("while", func_name),
                translateExpression(stm.condition_stm, func_name)
            ),
            translateStatement(stm.body_stm, func_name)
        )
    }
}

function translateFunction(func_name: string, func_def: FunctionDefExpression, args_index: number) {
    if (args_index == func_def.args_name.length) {
        let return_exp: HMApplicationExpression = new HMApplicationExpression(
            new HMVariableExpression("return", func_name),
            translateExpression(func_def.return_exp, func_name)
        )
        if (func_def.body == null)
            return return_exp
        else
            return new HMApplicationExpression(
                new HMApplicationExpression(
                    new HMVariableExpression(";", func_name),
                    translateStatement(func_def.body, func_name)
                ),
                return_exp
            )
    }

    return new HMAbstractionExpression(
        new HMVariableExpression(func_def.args_name[args_index], func_name),
        translateFunction(func_name, func_def, args_index + 1)
    )
}

function translate(file: string) {
    let intepreter: Interpreter = new Interpreter()
    intepreter.parseProgram(file)

    let func_def: FunctionDefExpression = intepreter.getFunctionDef("main")
    if (func_def.body == null)
        return null

    let program_hm_exp: HMExpression = translateStatement(func_def.body, "main")
    for (let func of intepreter.getFunctionNames()) {
        if (func == "main")
            continue
        program_hm_exp = new HMLetExpression(
            new HMVariableExpression(func, "main"),
            translateFunction(func, intepreter.getFunctionDef(func), 0),
            program_hm_exp
        )
    }
    // console.dir(program_hm_exp, {depth: null})
    return program_hm_exp
}

type Constraint = [TypeTerm, TypeTerm]
type Substitution = Map<TypeVariable, TypeTerm>

class TypeEnviroment {
    context: Map<string, TypeTerm>
    constraints: Array<Constraint>
    exp_type_map: Array<[HMExpression, TypeTerm]>
    type_var_list: Array<TypeVariable>

    constructor() {
        this.constraints = new Array<Constraint>()
        this.type_var_list = new Array<TypeVariable>()
        this.exp_type_map = Array<[HMExpression, TypeTerm]>()
        this.context = new Map(
            [
                ["+", new TypeArrow(new TypeConstructor("Int"), new TypeArrow(
                    new TypeConstructor("Int"), new TypeConstructor("Int")))],
                ["-", new TypeArrow(new TypeConstructor("Int"), new TypeArrow(
                    new TypeConstructor("Int"), new TypeConstructor("Int")))],
                [">", new TypeArrow(new TypeConstructor("Int"), new TypeArrow(
                    new TypeConstructor("Int"), new TypeConstructor("Bool")))],
                [">=", new TypeArrow(new TypeConstructor("Int"), new TypeArrow(
                    new TypeConstructor("Int"), new TypeConstructor("Bool")))],
                ["<", new TypeArrow(new TypeConstructor("Int"), new TypeArrow(
                    new TypeConstructor("Int"), new TypeConstructor("Bool")))],
                ["<=", new TypeArrow(new TypeConstructor("Int"), new TypeArrow(
                    new TypeConstructor("Int"), new TypeConstructor("Bool")))],
                ["==", new TypeArrow(new TypeConstructor("Int"), new TypeArrow(
                    new TypeConstructor("Int"), new TypeConstructor("Bool")))],
                ["!=", new TypeArrow(new TypeConstructor("Int"), new TypeArrow(
                    new TypeConstructor("Int"), new TypeConstructor("Bool")))],
                ["&&", new TypeArrow(new TypeConstructor("Bool"), new TypeArrow(
                    new TypeConstructor("Bool"), new TypeConstructor("Bool")))],
                ["||", new TypeArrow(new TypeConstructor("Bool"), new TypeArrow(
                    new TypeConstructor("Bool"), new TypeConstructor("Bool")))],
                ["!", new TypeArrow(new TypeConstructor("Bool"), new TypeConstructor("Bool"))],
                ["if", new TypeArrow(new TypeConstructor("Bool"), new TypeArrow(
                    new TypeConstructor("Unit"), new TypeConstructor("Unit")))],
                ["if-else", new TypeArrow(new TypeConstructor("Bool"), new TypeArrow(
                    new TypeConstructor("Unit"), new TypeArrow(
                            new TypeConstructor("Unit"), new TypeConstructor("Unit"))))],
                ["while", new TypeArrow(new TypeConstructor("Bool"),
                    new TypeArrow(new TypeConstructor("Unit"), new TypeConstructor("Unit")))],
            ]
        )
    }

    public getType(v: HMExpression) {
        if (v instanceof HMIntegerExpression)
            return new TypeConstructor("Int")

        if (v instanceof HMBooleanExpression)
            return new TypeConstructor("Bool")

        if (v instanceof HMVariableExpression) {
            if (v.name == ":=") {
                let tvar: TypeVariable = this.createFreshTypeVariable()
                return new TypeArrow(tvar, new TypeArrow(tvar, new TypeConstructor("Unit")))
            }

            if (v.name == ";") {
                let tvar: TypeVariable = this.createFreshTypeVariable()
                return new TypeArrow(new TypeConstructor("Unit"), new TypeArrow(tvar, tvar))
            }

            if (v.name == "return") {
                let tvar: TypeVariable = this.createFreshTypeVariable()
                return new TypeArrow(tvar, tvar)
            }
            let r = this.context.get(v.name)
            if (r != null)
                return r

            for (let ele of this.exp_type_map)
                if (ele[0].equals(v))
                    return ele[1]

            return r
        }
        assert(false, JSON.stringify(v))
    }

    public createFreshTypeVariable() {
        let tvar: TypeVariable = new TypeVariable("a" + this.type_var_list.length)
        this.type_var_list.push(tvar)
        return tvar
    }

    public addExpressionTypeVariablePair(v: HMExpression, tv: TypeVariable) {
        this.exp_type_map.push([v, tv])
    }

    public createConcreteTypeVariable(v: HMExpression) {
        let tvar: TypeVariable = new TypeVariable("d" + v.toString())
        this.exp_type_map.push([v, tvar])
        return tvar
    }

    public addTypeConstraint(v: TypeVariable, tt: TypeTerm) {
        this.constraints.push([v, tt])
    }
}

function inferType(exp: HMExpression, type_env: TypeEnviroment) {
    let exp_type_var: TypeVariable = type_env.createFreshTypeVariable()

    if (exp instanceof HMAbstractionExpression) {
        let x_type_var: TypeVariable = inferType(exp.x, type_env)
        let e_type_var: TypeVariable = inferType(exp.exp, type_env)
        type_env.addTypeConstraint(exp_type_var, new TypeArrow(x_type_var, e_type_var))
    } else if (exp instanceof HMApplicationExpression) {
        let e1_type_var: TypeVariable = inferType(exp.exp1, type_env)
        let e2_type_var: TypeVariable = inferType(exp.exp2, type_env)
        type_env.addTypeConstraint(e1_type_var, new TypeArrow(e2_type_var, exp_type_var))
    } else if (exp instanceof HMLetExpression) {
        let e1_type_var: TypeVariable = inferType(exp.exp1, type_env)
        type_env.addExpressionTypeVariablePair(exp.x, e1_type_var)
        let e2_type_var: TypeVariable = inferType(exp.exp2, type_env)
        type_env.addTypeConstraint(exp_type_var, e2_type_var)
    } else {
        let tvar = type_env.getType(exp)
        if (tvar == null)
            tvar = type_env.createConcreteTypeVariable(exp)
        type_env.addTypeConstraint(exp_type_var, tvar)
    }

    type_env.addExpressionTypeVariablePair(exp, exp_type_var)
    return exp_type_var
}

function merge_substitution(sub: Substitution) {
    let sub_vars: Array<TypeVariable> = Array.from(sub.keys())
    for (let v of sub.keys()) {
        for (let v1 of sub_vars) {
            if (v.equals(v1))
                continue
            let t1: TypeTerm = sub.get(v1)
            if (t1.contains(v))
                sub.set(v1, t1.replace(v, sub.get(v)))
        }
    }
}

function substitute(term: TypeTerm, sub: Substitution) {
    for (let e of Array.from(sub.entries()))
        term = term.replace(e[0], e[1])
    return term
}

function unification(cons: Array<Constraint>, sub: Substitution) {
    if (cons.length == 0) return true
    let pair: [TypeTerm, TypeTerm] = cons[0]
    // console.dir(pair, {depth: null})

    if (pair[0] instanceof TypeVariable) {
        let v: TypeTerm | undefined = sub.get(pair[0])
        if (v != undefined) {
            assert(v.equals(pair[1]),
                "Failed: " + pair[0].toString() + " has multiple substitutions: "
                + pair[1].toString() + ", " + v.toString())
            return unification(cons.slice(1), sub)
        }

        if (pair[0].equals(pair[1]))
            return unification(cons.slice(1), sub)

        if (pair[1] instanceof TypeArrow)
            assert(!pair[1].contains(pair[0]),
                "Failed: " + pair[1].toString() + " contains " + pair[0].toString() + " as variable")

        for (let i = 1; i < cons.length; i++) {
            let con_sub: Constraint = [cons[i][0].replace(pair[0], pair[1]), cons[i][1].replace(pair[0], pair[1])]
            cons[i] = con_sub
        }
        sub.set(pair[0], pair[1])
        return unification(cons.slice(1), sub)
    } else if (pair[0] instanceof TypeArrow) {
        if (pair[1] instanceof TypeVariable) {
            let v: TypeTerm | undefined = sub.get(pair[1])
            if (v != undefined) {
                assert(v.equals(pair[0]),
                    "Failed: " + pair[1].toString() + " has multiple substitutions: "
                    + pair[0].toString() + ", " + v.toString())
                return unification(cons.slice(1), sub)
            }

            assert(!pair[0].contains(pair[1]),
                "Failed: " + pair[0].toString() + " contains "
                + pair[1].toString() + " as variable")
            for (let i = 1; i < cons.length; i++) {
                cons[i] = [cons[i][0].replace(pair[1], pair[0]), cons[i][1].replace(pair[1], pair[0])]
            }
            sub.set(pair[1], pair[0])
            return unification(cons.slice(1), sub)
        } else if (pair[1] instanceof TypeArrow) {
            let new_pairs: Array<Constraint> = [[pair[0].left, pair[1].left], [pair[0].right, pair[1].right]]
            cons = new_pairs.concat(cons.slice(1))
            return unification(cons, sub)
        } else {
            assert(false, pair[0].toString() + " can't be unified with " + pair[1].toString())
        }
    } else {
        if (pair[1] instanceof TypeVariable) {
            let v: TypeTerm | undefined = sub.get(pair[1])
            if (v != undefined) {
                assert(v.equals(pair[0]),
                    "Failed: " + pair[1].toString() + " has multiple substitutions: "
                    + pair[0].toString() + ", " + v.toString())
                return unification(cons.slice(1), sub)
            }

            for (let i = 1; i < cons.length; i++) {
                cons[i] = [cons[i][0].replace(pair[1], pair[0]), cons[i][1].replace(pair[1], pair[0])]
            }
            sub.set(pair[1], pair[0])
            return unification(cons.slice(1), sub)
        } else if(pair[1] instanceof TypeArrow)
            assert(false, pair[0].toString() + " can't be unified with " + pair[1].toString())
        else {
            assert(pair[0].equals(pair[1]), pair[0].toString() + " can't be unified with " + pair[1].toString())
            return unification(cons.slice(1), sub)
        }
    }
    return false
}

function unify(cons: Array<Constraint>) {
    let sub: Substitution = new Map<TypeVariable, TypeTerm>()
    let res: boolean = unification(cons, sub)

    merge_substitution(sub)
    sub.forEach((v: TypeTerm, k: TypeVariable) => {
        console.log(k.toString() + " => " + v.toString())
    })
    for (let con of cons) {
        let sub_check: boolean = substitute(con[0], sub).equals(substitute(con[1], sub))
        assert(sub_check, "Result of unification is not valid")
    }
}

function inferProgram(file: string, type_env: TypeEnviroment) {
    let main_exp: HMExpression | null = translate(file)
    if (main_exp == null)
        return -1

    inferType(main_exp, type_env)

    // let sorted_arr = type_env.exp_type_map.sort((a, b) => {
    //     if (!a[1].name.startsWith("a")) return -1e3
    //     if (!b[1].name.startsWith("a")) return 1e3

    //     return +b[1].name.split("a")[1] - +a[1].name.split("a")[1]
    // }) 
    // for (let ele of sorted_arr) {
    //     let c_list = new Array<TypeTerm>()
    //     for (let c of type_env.constraints) {
    //         if (c[0].equals(ele[1]))
    //             c_list.push(c[1].toString())
    //     }
    //     console.dir({"exp": ele[0].toString(), "tvar": ele[1].toString(), "c": c_list}, {depth: null})
    //     console.log("-------------------------------------------------------")
    // }

    unify(type_env.constraints)
}

var args = process.argv

var file: string = args[2]
inferProgram(file, new TypeEnviroment())