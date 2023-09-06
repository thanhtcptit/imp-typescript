import { AssertionError } from 'assert'
import {Result, Parser, Tag, Syntax, Optional, Lazy, Repeat, Program,
    parseFile, NUMBER_TAG, BOOLEAN_TAG, VARIABLE_TAG} from './parser'


function unroll(tuples: any) {
    if (tuples == null)
        return []
    let unrolled_array: Array<any> = new Array<any>()
    while (tuples instanceof Array) {
        unrolled_array.push(tuples[1])
        tuples = tuples[0]
    }
    unrolled_array.push(tuples)
    return unrolled_array.reverse()
}

type imp_type = number | boolean

export abstract class Statement {
    public abstract eval(intepreter: Interpreter);
}

export abstract class Expression {
    public abstract eval(intepreter: Interpreter);
}

export class ValueExpression extends Expression {
    val: imp_type

    constructor(val: imp_type) {
        super()
        this.val = val
    }

    public eval(intepreter: Interpreter) {
        return this.val
    }
}

export class VariableExpression extends Expression {
    var_name: string

    constructor(var_name: string) {
        super()
        this.var_name = var_name
    }

    public eval(intepreter: Interpreter) {
        if (intepreter.getValue(this.var_name) != undefined)
            return intepreter.getValue(this.var_name)
        return 0
    }
}

export class MathExpression extends Expression {
    op: string
    left_exp: Expression
    right_exp: Expression

    constructor(op: string, left_exp: Expression, right_exp: Expression) {
        super()
        this.op = op
        this.left_exp = left_exp
        this.right_exp = right_exp
    }

    public eval(intepreter: Interpreter) {
        let left_val = this.left_exp.eval(intepreter)
        let right_val = this.right_exp.eval(intepreter)
        if (this.op == "+")
            return left_val + right_val
        else
            return left_val - right_val
    }
}

export class ComparisonExpression extends Expression {
    op: string
    left_exp: Expression
    right_exp: Expression

    constructor(op: string, left_exp: Expression, right_exp: Expression) {
        super()
        this.op = op
        this.left_exp = left_exp
        this.right_exp = right_exp
    }

    public eval(intepreter: Interpreter) {
        let left_val = this.left_exp.eval(intepreter)
        let right_val = this.right_exp.eval(intepreter)
        if (this.op == "<")
            return left_val < right_val
        else if (this.op == "<=")
            return left_val <= right_val
        else if (this.op == ">")
            return left_val > right_val
        else if (this.op == ">=")
            return left_val >= right_val
        else if (this.op == "==")
            return left_val == right_val
        else
            return left_val != right_val
    }
}

export class AndExpression extends Expression {
    left_exp: Expression
    right_exp: Expression

    constructor(left_exp: Expression, right_exp: Expression) {
        super()
        this.left_exp = left_exp
        this.right_exp = right_exp
    }

    public eval(intepreter: Interpreter) {
        let left_val = this.left_exp.eval(intepreter)
        let right_val = this.right_exp.eval(intepreter)
        return left_val && right_val
    }
}

export class OrExpression extends Expression {
    left_exp: Expression
    right_exp: Expression

    constructor(left_exp: Expression, right_exp: Expression) {
        super()
        this.left_exp = left_exp
        this.right_exp = right_exp
    }

    public eval(intepreter: Interpreter) {
        let left_val = this.left_exp.eval(intepreter)
        let right_val = this.right_exp.eval(intepreter)
        return left_val || right_val
    }
}

export class NotExpression extends Expression {
    exp: Expression

    constructor(exp: Expression) {
        super()
        this.exp = exp
    }

    public eval(intepreter: Interpreter) {
        let val = this.exp.eval(intepreter)
        return !val
    }
}

export class FunctionDefExpression extends Expression {
    name: string
    args_name: Array<string>
    body: Statement | null
    return_exp: Expression

    constructor(name: string, args_name: Array<string>, body: Statement | null,
                return_exp: Expression) {
        super()
        this.name = name
        this.args_name = args_name
        this.body = body
        this.return_exp = return_exp
    }

    public eval(intepreter: Interpreter) {
        if (this.body != null)
            this.body.eval(intepreter)

        if (this.name == "main") {
            intepreter.call_stack.getCurrentFrame().memory.forEach(
                (value: imp_type, key: string) => {
                    console.log(key + ": " + value)
            })
        }

        let return_val: imp_type = this.return_exp.eval(intepreter)
        return return_val
    }
}

export class FunctionCallExpression extends Expression {
    name: string
    args: Array<Expression>

    constructor(name: string, args: Array<Expression>) {
        super()
        this.name = name
        this.args = args
    }

    public eval(intepreter: Interpreter) {
        let args_value: Array<imp_type> = new Array<imp_type>()
        this.args.forEach(exp => {
            args_value.push(exp.eval(intepreter))
        })
        intepreter.createFrame()
        let func_def = intepreter.getFunctionDef(this.name)
        for (let i = 0; i < args_value.length; i++) {
            intepreter.setValue(func_def.args_name[i], args_value[i])
        }
        let return_val: imp_type = func_def.eval(intepreter)

        intepreter.popFrame()
        return return_val
    }
}

export class AssignStatement extends Statement {
    var_name: string
    exp: Expression

    constructor(var_name: string, exp: Expression) {
        super()
        this.var_name = var_name
        this.exp = exp
    }

    public eval(intepreter: Interpreter) {
        intepreter.setValue(this.var_name, this.exp.eval(intepreter))
    }
}

export class SequentialStatement extends Statement {
    first_stm: Statement
    second_stm: Statement

    constructor(first_stm: Statement, second_stm: Statement) {
        super()
        this.first_stm = first_stm
        this.second_stm = second_stm
    }

    public eval(intepreter: Interpreter) {
        this.first_stm.eval(intepreter)
        this.second_stm.eval(intepreter)
    }
}

export class IfStatement extends Statement {
    condition_stm: Expression
    true_stm: Statement
    false_stm: Statement | null

    constructor(condition_stm: Expression, true_stm: Statement, false_stm: Statement | null) {
        super()
        this.condition_stm = condition_stm
        this.true_stm = true_stm
        this.false_stm = false_stm
    }

    public eval(intepreter: Interpreter) {
        if (this.condition_stm.eval(intepreter))
            this.true_stm.eval(intepreter)
        else if (this.false_stm != null)
            this.false_stm.eval(intepreter)
    }
}

export class WhileStatement extends Statement {
    condition_stm: Statement
    body_stm: Statement

    constructor(condition_stm: Statement, body_stm: Statement) {
        super()
        this.condition_stm = condition_stm
        this.body_stm = body_stm
    }

    public eval(intepreter: Interpreter) {
        while (this.condition_stm.eval(intepreter)) {
            this.body_stm.eval(intepreter)
        }
    }
}

const arithmetic_operators: Array<string> = ["+", "-"]
const logic_operators: Array<string> = ["&&", "||"]
const comparison_operators: Array<string> = ["<", "<=", ">", ">=", "==", "!="]

const number_parser: Parser = new Tag(NUMBER_TAG).process(
    (x: string) => {return +x})
const boolean_parser: Parser = new Tag(BOOLEAN_TAG).process(
    (x: string) => {return x == "true"})
const var_parser: Parser = new Tag(VARIABLE_TAG)

const extract_group = (x: Array<Array<string | number>>) => {return x[0][1]}

function getOperatorParser(ops: Array<string>) {
    let ops_parser: Parser;
    for (let i = 0; i < ops.length; i++) {
        if (i == 0)
            ops_parser = new Syntax(ops[i])
        else
            ops_parser = ops_parser.alternate(new Syntax(ops[i]))
    }
    return ops_parser
}

function getArithmeticTermParser() {
    let number_exp_parser: Parser = number_parser.process(
        (x: number) => {return new ValueExpression(x)})
    let var_exp_parser: Parser = var_parser.process(
        (x: string) => {return new VariableExpression(x)})
    let group_exp_parser: Parser = new Syntax("(").combine(
        new Lazy(getArithmeticExpressionParser)).combine(
        new Syntax(")")).process(extract_group)
    
    return number_exp_parser.alternate(var_exp_parser).alternate(group_exp_parser)
}

function getArithmeticExpressionParser() {
    return getFunctionCallParser().alternate(getArithmeticTermParser()).repeat(
        getOperatorParser(arithmetic_operators).process(
            (op: string) => {
                return (x: Expression, y: Expression) => {
                    return new MathExpression(op, x, y)
            }}))
}

function getLogicTermParser() {
    let boolean_exp_parser: Parser = boolean_parser.process(
        (x: boolean) => {return new ValueExpression(x)})
    let var_exp_parser: Parser = var_parser.process(
        (x: string) => {return new VariableExpression(x)})
    let negative_exp_parser: Parser = new Syntax("!").combine(
        new Lazy(getLogicExpressionParser)).process(
            (parsed) => {
                return new NotExpression(parsed[1])
            })
    let arith_comp_exp_parser: Parser = getArithmeticExpressionParser().combine(
        getOperatorParser(comparison_operators)).combine(
            getArithmeticExpressionParser()).process(
                (parsed) => {
                    return new ComparisonExpression(parsed[0][1], parsed[0][0], parsed[1])
                })
    let group_exp_parser: Parser = new Syntax("(").combine(
        new Lazy(getLogicExpressionParser)).combine(
        new Syntax(")")).process(extract_group)
    return boolean_exp_parser.alternate(arith_comp_exp_parser).alternate(
        negative_exp_parser).alternate(var_exp_parser).alternate(group_exp_parser)
}

function getLogicExpressionParser() {
    return getFunctionCallParser().alternate(getLogicTermParser()).repeat(
        getOperatorParser(logic_operators).process(
            (op: string) => {
                return (x: Expression, y: Expression) => {
                    if (op == "&&")
                        return new AndExpression(x, y)
                    else
                        return new OrExpression(x, y)
                }}))
}

function getFunctionCallParser() {
    let colon_parser: Parser = new Syntax(",").process(
        (x: any) => {
            return (l: Expression, r: Expression) => {
                return [l, r]
            }})

    return var_parser.combine(
        new Syntax("(")).combine(
        new Repeat(new Lazy(getLogicExpressionParser).alternate(
            new Lazy(getArithmeticExpressionParser)), colon_parser)).combine(
        new Syntax(")")).process(
            (parsed) => {
                let func_name: string = parsed[0][0][0]
                let args: Array<Expression> = unroll(parsed[0][1])
                return new FunctionCallExpression(func_name, args)
            }
        )
}

function getAssignStatementParser() {
    return var_parser.combine(
        new Syntax(":=")).combine(
            getLogicExpressionParser().alternate(
            getArithmeticExpressionParser())).process(
                (parsed) => {
                    return new AssignStatement(parsed[0][0], parsed[1])
                })
}

function getIfStatementParser() {
    return new Syntax("if").combine(
        getFunctionCallParser().alternate(getLogicExpressionParser())).combine(
        new Lazy(getBlockParser)).combine(
        new Optional(new Syntax("else").combine(new Lazy(getBlockParser)))).combine(
        new Syntax("end")).process(
            (parsed) => {
                let condition_stm: Expression = parsed[0][0][0][1]
                let true_stm: Statement = parsed[0][0][1]
                let false_parsed = parsed[0][1]
                let false_stm = null
                if (false_parsed != null)
                    false_stm = false_parsed[1]
                return new IfStatement(condition_stm, true_stm, false_stm)
            })
}

function getWhileStatementParser() {
    return new Syntax("while").combine(
        getFunctionCallParser().alternate(getLogicExpressionParser())).combine(
        new Lazy(getBlockParser)).combine(
        new Syntax("end")).process(
            (parsed) => {
                let condition_stm: Statement = parsed[0][0][1]
                let body_stm: Statement = parsed[0][1]
                return new WhileStatement(condition_stm, body_stm)
            })
}

function getFunctionDefParser() {
    let colon_parser: Parser = new Syntax(",").process(
        (x: any) => {
            return (l: string, r: string) => {
                return [l, r]
            }})

    return new Syntax("func").combine(
        var_parser).combine(
        new Syntax("(")).combine(
        new Optional(new Repeat(var_parser, colon_parser))).combine(
        new Syntax(")")).combine(
        new Syntax("{")).combine(
        new Optional(getBlockParser())).combine(
        new Optional(new Syntax(";"))).combine(
        new Syntax("return")).combine(
        getLogicExpressionParser().alternate(
            getArithmeticExpressionParser())).combine(
        new Syntax("}")).process(
            (parsed) => {
                let func_name: string = parsed[0][0][0][0][0][0][0][0][0][1]
                let args: Array<string> = unroll(parsed[0][0][0][0][0][0][0][1])
                let body_stm: Statement | null = parsed[0][0][0][0][1]
                let return_exp: Expression = parsed[0][1]
                return new FunctionDefExpression(func_name, args, body_stm, return_exp)
            }
        )
}

function getBlockParser() {
    let semicolon_parser: Parser = new Syntax(";").process(
        (x: any) => {
            return (l: Statement, r: Statement) => {
                return new SequentialStatement(l, r)
            }})

    return new Repeat(
        getAssignStatementParser().alternate(
        getIfStatementParser().alternate(
        getWhileStatementParser())), semicolon_parser)
}

function getProgramParser() {
    let semicolon_parser: Parser = new Syntax(";").process(
        (x: any) => {
            return (l: FunctionDefExpression, r: FunctionDefExpression) => {
                return [l, r]
            }})
    return new Repeat(getFunctionDefParser(), semicolon_parser)
}

class Frame {
    memory: Map<string, imp_type>

    constructor() {
        this.memory = new Map<string, imp_type>()
    }
}

class CallStack {
    stack: Array<Frame>

    constructor() {
        this.stack = new Array<Frame>()
    }

    public createFrame() {
        this.stack.push(new Frame())
    }

    public pop() {
        this.stack.pop()
    }

    public getCurrentFrame() {
        return this.stack[this.stack.length - 1]
    }
}

export class Interpreter {
    call_stack: CallStack
    functions: Map<string, FunctionDefExpression>

    constructor() {
        this.call_stack = new CallStack()
        this.functions = new Map<string, FunctionDefExpression>()
    }

    public setValue(var_name: string, value: imp_type) {
        this.call_stack.getCurrentFrame().memory.set(var_name, value)
    }

    public getValue(var_name: string) {
        return this.call_stack.getCurrentFrame().memory.get(var_name)
    }

    public createFrame() {
        this.call_stack.createFrame()
    }

    public popFrame() {
        this.call_stack.pop()
    }

    public getFunctionDef(func_name: string) {
        let r = this.functions.get(func_name)
        if (r == undefined)
            throw new AssertionError({"message": func_name})
        return r
    }

    public getFunctionNames() {
        return Array.from(this.functions.keys())
    }

    public parseProgram(file: string) {
        let tokens: Array<Array<string>> = parseFile(file)
        let parsed_program: Result = new Program(getProgramParser()).parse(tokens, 0)
        if (parsed_program == null) {
            console.log("Intepreting error with parsed tokens: ")
            console.log(tokens)
            return -1
        }

        let function_list = unroll(parsed_program.value)
        for (let i = 0; i < function_list.length; i++)
            this.functions.set(function_list[i].name, function_list[i])
    }

    public interpret(file: string) {
        this.parseProgram(file)

        let main_func = new FunctionCallExpression("main", [])
        main_func.eval(this)
    }
}

function interpret(file: string) {
    let intepreter: Interpreter = new Interpreter()
    intepreter.interpret(file)
}

var args = process.argv

var file: string = args[2]
interpret(file)
