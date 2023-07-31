import { readFileSync } from 'fs'

const SPACING = "NONE"
const SYNTAX_TAG = "SYNTAX"
const NUMBER_TAG = "NUMBER"
const BOOLEAN_TAG = "BOOLEAN"
const VARIABLE_TAG = "VARIABLE"

const token_regex = [
    ["^[ \\n\\t\\r]+", SPACING],
    ["^\:=", SYNTAX_TAG],
    ["^\\(", SYNTAX_TAG],
    ["^\\)", SYNTAX_TAG],
    ["^;", SYNTAX_TAG],
    ["^>=", SYNTAX_TAG],
    ["^>", SYNTAX_TAG],
    ["^<=", SYNTAX_TAG],
    ["^<", SYNTAX_TAG],
    ["^==", SYNTAX_TAG],
    ["^!=", SYNTAX_TAG],
    ["^&&", SYNTAX_TAG],
    ["^\\|\\|", SYNTAX_TAG],
    ["^!", SYNTAX_TAG],
    ["^if", SYNTAX_TAG],
    ["^else", SYNTAX_TAG],
    ["^end", SYNTAX_TAG],
    ["^while", SYNTAX_TAG],
    ["^true", BOOLEAN_TAG],
    ["^false", BOOLEAN_TAG],
    ["^-?[0-9]+", NUMBER_TAG],
    ["^[A-Za-z][A-Za-z0-9_]*", VARIABLE_TAG],
    ["^\\+", SYNTAX_TAG],
    ["^-", SYNTAX_TAG],
]

const arithmetic_operators: Array<string> = ["+", "-"]
const logic_operators: Array<string> = ["&&", "||"]
const comparison_operators: Array<string> = ["<", "<=", ">", ">=", "==", "!="]

function readFile(filePath: string) {
    const text: string = readFileSync(filePath, "ascii")
    return text
}

function parseFile(filePath: string) {
    var text: string = readFile(filePath)
    var tokens: Array<Array<string>> = []
    while (text.length != 0) {
        let match_flag: boolean = false
        for (let v of token_regex) {
            let match = text.match(v[0])
            if (match) {
                match_flag = true
                text = text.slice(match[0].length)
                if (v[1] != SPACING)
                    tokens.push([match[0], v[1]])
                break
            }
        }
        if (!match_flag) {
            console.log("Parsing error: " + text)
            console.log(" - Parsed tokens: ", tokens)
            return []
        }
    }
    return tokens
}

type imp_type = number | boolean

abstract class Statement {
    public abstract eval(env: Map<string, imp_type>);
}

abstract class Expression {
    public abstract eval(env: Map<string, imp_type>);
}

class ValueExpression extends Expression {
    val: imp_type

    constructor(val: imp_type) {
        super()
        this.val = val
    }

    public eval(env: Map<string, imp_type>) {
        return this.val
    }
}

class VariableExpression extends Expression {
    var_name: string

    constructor(var_name: string) {
        super()
        this.var_name = var_name
    }

    public eval(env: Map<string, imp_type>) {
        if (env.get(this.var_name) != undefined)
            return env.get(this.var_name)
        return 0
    }
}

class MathExpression extends Expression {
    op: string
    left_exp: Expression
    right_exp: Expression

    constructor(op: string, left_exp: Expression, right_exp: Expression) {
        super()
        this.op = op
        this.left_exp = left_exp
        this.right_exp = right_exp
    }

    public eval(env: Map<string, imp_type>) {
        let left_val = this.left_exp.eval(env)
        let right_val = this.right_exp.eval(env)
        if (this.op == "+")
            return left_val + right_val
        else
            return left_val - right_val
    }
}

class ComparisonExpression extends Expression {
    op: string
    left_exp: Expression
    right_exp: Expression

    constructor(op: string, left_exp: Expression, right_exp: Expression) {
        super()
        this.op = op
        this.left_exp = left_exp
        this.right_exp = right_exp
    }

    public eval(env: Map<string, imp_type>) {
        let left_val = this.left_exp.eval(env)
        let right_val = this.right_exp.eval(env)
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

class AndExpression extends Expression {
    left_exp: Expression
    right_exp: Expression

    constructor(left_exp: Expression, right_exp: Expression) {
        super()
        this.left_exp = left_exp
        this.right_exp = right_exp
    }

    public eval(env: Map<string, imp_type>) {
        let left_val = this.left_exp.eval(env)
        let right_val = this.right_exp.eval(env)
        return left_val && right_val
    }
}

class OrExpression extends Expression {
    left_exp: Expression
    right_exp: Expression

    constructor(left_exp: Expression, right_exp: Expression) {
        super()
        this.left_exp = left_exp
        this.right_exp = right_exp
    }

    public eval(env: Map<string, imp_type>) {
        let left_val = this.left_exp.eval(env)
        let right_val = this.right_exp.eval(env)
        return left_val || right_val
    }
}

class NotExpression extends Expression {
    exp: Expression

    constructor(exp: Expression) {
        super()
        this.exp = exp
    }

    public eval(env: Map<string, imp_type>) {
        let val = this.exp.eval(env)
        return !val
    }
}

class AssignStatement extends Statement{
    var_name: string
    exp: Expression

    constructor(var_name: string, exp: Expression) {
        super()
        this.var_name = var_name
        this.exp = exp
    }

    public eval(env: Map<string, imp_type>) {
        env.set(this.var_name, this.exp.eval(env))
    }
}

class SequentialStatement extends Statement {
    first_stm: Statement
    second_stm: Statement

    constructor(first_stm: Statement, second_stm: Statement) {
        super()
        this.first_stm = first_stm
        this.second_stm = second_stm
    }

    public eval(env: Map<string, imp_type>) {
        this.first_stm.eval(env)
        this.second_stm.eval(env)
    }
}

class IfStatement extends Statement {
    condition_stm: Statement
    true_stm: Statement
    false_stm: Statement | null

    constructor(condition_stm: Statement, true_stm: Statement, false_stm: Statement | null) {
        super()
        this.condition_stm = condition_stm
        this.true_stm = true_stm
        this.false_stm = false_stm
    }

    public eval(env: Map<string, imp_type>) {
        if (this.condition_stm.eval(env))
            this.true_stm.eval(env)
        else if (this.false_stm != null)
            this.false_stm.eval(env)
    }
}

class WhileStatement extends Statement {
    condition_stm: Statement
    body_stm: Statement

    constructor(condition_stm: Statement, body_stm: Statement) {
        super()
        this.condition_stm = condition_stm
        this.body_stm = body_stm
    }

    public eval(env: Map<string, imp_type>) {
        while (this.condition_stm.eval(env)) {
            this.body_stm.eval(env)
        }
    }
}

class Result {
    value: any
    pos: number

    constructor(value: any, pos: number) {
        this.value = value
        this.pos = pos
    }
}

abstract class Parser {
    public combine(other: Parser) {
        return new Combination(this, other)
    }

    public repeat(other: Parser) {
        return new Repeat(this, other)
    }

    public process(func: Function) {
        return new Process(this, func)
    }

    public alternate(other: Parser) {
        return new Alternate(this, other)
    }

    public abstract parse(tokens: Array<Array<string>>, pos: number)
}

class Tag extends Parser {
    tag: string

    constructor(tag: string) {
        super()
        this.tag = tag
    }

    public parse(tokens: Array<Array<string>>, pos: number) {
        if (pos < tokens.length && tokens[pos][1] == this.tag) 
            return new Result(tokens[pos][0], pos + 1)
        return null
    }
}

class BooleanVariable extends Parser {
    tag: string = VARIABLE_TAG

    constructor() {
        super()
    }

    public parse(tokens: Array<Array<string>>, pos: number) {
        if (pos < tokens.length && tokens[pos][1] == this.tag) {
            if (pos + 1 < tokens.length && arithmetic_operators.indexOf(
                    tokens[pos + 1][0]) > -1)
                return null
            return new Result(tokens[pos][0], pos + 1)
        }
        return null
    }
}

class Syntax extends Parser {
    value: string

    constructor(value: string) {
        super()
        this.value = value
    }

    public parse(tokens: Array<Array<string>>, pos: number) {
        if (pos < tokens.length && tokens[pos][0] == this.value && 
                tokens[pos][1] == SYNTAX_TAG) 
            return new Result(tokens[pos][0], pos + 1)
        return null
    }
}

class Process extends Parser {
    parser: Parser
    func: Function

    constructor(parser: Parser, func: Function) {
        super()
        this.parser = parser
        this.func = func
    }

    public parse(tokens: Array<Array<string>>, pos: number) {
        let res = this.parser.parse(tokens, pos)
        if (res != null)
            res.value = this.func(res.value)
        return res
    }
}

class Combination extends Parser {
    left_parser: Parser
    right_parser: Parser

    constructor(left_parser: Parser, right_parser: Parser) {
        super()
        this.left_parser = left_parser
        this.right_parser = right_parser
    }

    public parse(tokens: Array<Array<string>>, pos: number) {
        let left_res = this.left_parser.parse(tokens, pos)
        if (left_res != null) {
            let right_res = this.right_parser.parse(tokens, left_res.pos)
            if (right_res != null) {
                return new Result([left_res.value, right_res.value], right_res.pos)
            }
        }
        return null
    }
}

class Repeat extends Parser {
    parser: Parser
    op_parser: Parser

    constructor(parser: Parser, op_parser: Parser) {
        super()
        this.parser = parser
        this.op_parser = op_parser
    }

    public parse(tokens: Array<Array<string>>, pos: number) {
        let res = this.parser.parse(tokens, pos)

        let next_parser = this.op_parser.combine(this.parser).process(
            (parsed) => {return parsed[0](res.value, parsed[1])})
        let next_res = res
        while (next_res != null) {
            next_res = next_parser.parse(tokens, res.pos)
            if (next_res != null)
                res = next_res
        }
        return res
    }
}

class Alternate extends Parser {
    left_parser: Parser
    right_parser: Parser

    constructor(left_parser: Parser, right_parser: Parser) {
        super()
        this.left_parser = left_parser
        this.right_parser = right_parser
    }

    public parse(tokens: Array<Array<string>>, pos: number) {
        let res = this.left_parser.parse(tokens, pos)
        if (res != null)
            return res
        else
            return this.right_parser.parse(tokens, pos)
    }
}

class Optional extends Parser {
    parser: Parser

    constructor(parser: Parser) {
        super()
        this.parser = parser
    }

    public parse(tokens: Array<Array<string>>, pos: number) {
        let res = this.parser.parse(tokens, pos)
        if (res != null)
            return res
        return new Result(null, pos)
    }
}

class Lazy extends Parser {
    parser: Parser | null
    parser_factory: Function

    constructor(parser_factory: Function) {
        super()
        this.parser_factory = parser_factory
        this.parser = null
    }

    public parse(tokens: Array<Array<string>>, pos: number) {
        if (this.parser == null)
            this.parser = this.parser_factory()
        return this.parser.parse(tokens, pos)
    }
}

class Program extends Parser {
    parser: Parser

    constructor(parser: Parser) {
        super()
        this.parser = parser
    }

    public parse(tokens: Array<Array<string>>, pos: number) {
        let res = this.parser.parse(tokens, pos)
        if (res != null && res.pos == tokens.length)
            return res
        return null
    }
}

const number_parser: Parser = new Tag(NUMBER_TAG).process(
    (x: string) => {return +x})
const boolean_parser: Parser = new Tag(BOOLEAN_TAG).process(
    (x: string) => {return x == "true"})
const boolean_var_parser: Parser = new BooleanVariable()
const var_parser: Parser = new Tag(VARIABLE_TAG)

const extract_group = (x: Array<Array<string | number>>) => {return x[0][1]}

function buildOperatorParser(ops: Array<string>) {
    let ops_parser: Parser;
    for (let i = 0; i < ops.length; i++) {
        if (i == 0)
            ops_parser = new Syntax(ops[i])
        else
            ops_parser = ops_parser.alternate(new Syntax(ops[i]))
    }
    return ops_parser
}

function buildArithmeticTermParser() {
    let number_exp_parser: Parser = number_parser.process(
        (x: number) => {return new ValueExpression(x)})
    let var_exp_parser: Parser = var_parser.process(
        (x: string) => {return new VariableExpression(x)})
    let group_exp_parser: Parser = new Syntax("(").combine(
        new Lazy(buildArithmeticExpressionParser)).combine(
        new Syntax(")")).process(extract_group)
    
    return number_exp_parser.alternate(var_exp_parser).alternate(group_exp_parser)
}

function buildArithmeticExpressionParser() {
    return buildArithmeticTermParser().repeat(
        buildOperatorParser(arithmetic_operators).process(
            (op: string) => {
                return (x: Expression, y: Expression) => {
                    return new MathExpression(op, x, y)
            }}))
}

function buildLogicTermParser() {
    let boolean_exp_parser: Parser = boolean_parser.process(
        (x: boolean) => {return new ValueExpression(x)})
    let var_exp_parser: Parser = boolean_var_parser.process(
        (x: string) => {return new VariableExpression(x)})
    let negative_exp_parser: Parser = new Syntax("!").combine(
        new Lazy(buildLogicExpressionParser)).process(
            (parsed) => {
                return new NotExpression(parsed[1])
            })
    let arith_comp_exp_parser: Parser = buildArithmeticExpressionParser().combine(
        buildOperatorParser(comparison_operators)).combine(
            buildArithmeticExpressionParser()).process(
                (parsed) => {
                    return new ComparisonExpression(parsed[0][1], parsed[0][0], parsed[1])
                })
    let group_exp_parser: Parser = new Syntax("(").combine(
        new Lazy(buildLogicExpressionParser)).combine(
        new Syntax(")")).process(extract_group)
    return boolean_exp_parser.alternate(arith_comp_exp_parser).alternate(
        negative_exp_parser).alternate(var_exp_parser).alternate(group_exp_parser)
}

function buildLogicExpressionParser() {
    return buildLogicTermParser().repeat(
        buildOperatorParser(logic_operators).process(
            (op: string) => {
                return (x: Expression, y: Expression) => {
                    if (op == "&&")
                        return new AndExpression(x, y)
                    else
                        return new OrExpression(x, y)
                }}))
}

function buildAssignStatementParser() {
    return var_parser.combine(
        new Syntax(":=")).combine(
            buildLogicExpressionParser().alternate(
                buildArithmeticExpressionParser())).process(
                    (parsed) => {
                        return new AssignStatement(parsed[0][0], parsed[1])
                    })
}

function buildIfStatementParser() {
    return new Syntax("if").combine(
        buildLogicExpressionParser()).combine(
            new Lazy(buildBlockParser)).combine(
                new Optional(new Syntax("else").combine(new Lazy(buildBlockParser)))).combine(
                    new Syntax("end")).process(
                        (parsed) => {
                            let condition_stm: Statement = parsed[0][0][0][1]
                            let true_stm: Statement = parsed[0][0][1]
                            let false_parsed = parsed[0][1]
                            let false_stm = null
                            if (false_parsed != null)
                                false_stm = false_parsed[1]
                            return new IfStatement(condition_stm, true_stm, false_stm)
                        })
}

function buildWhileStatementParser() {
    return new Syntax("while").combine(
        buildLogicExpressionParser()).combine(
            new Lazy(buildBlockParser)).combine(
                new Syntax("end")).process(
                    (parsed) => {
                        let condition_stm: Statement = parsed[0][0][1]
                        let body_stm: Statement = parsed[0][1]
                        return new WhileStatement(condition_stm, body_stm)
                    })
}

function buildBlockParser() {
    let semicolon_parser = new Syntax(";").process(
        (x: any) => {
            return (l: Statement, r: Statement) => {
                return new SequentialStatement(l, r)
            }})

    return new Repeat(
        buildAssignStatementParser().alternate(
            buildIfStatementParser().alternate(
                buildWhileStatementParser()
            )), semicolon_parser)
}

function intepret(file: string) {
    let tokens: Array<Array<string>> = parseFile(file)

    let parsed_program: Result = new Program(buildBlockParser()).parse(tokens, 0)
    if (parsed_program == null) {
        console.log("Intepreting error with parsed tokens: ")
        console.log(tokens)
    }
    else {
        let env: Map<string, imp_type> = new Map<string, imp_type>()
        let program = parsed_program.value
        program.eval(env)
        env.forEach((value: imp_type, key: string) => {
            console.log(key + ": " + value)
        })
    }
}

var args = process.argv

var file: string = args[2]
intepret(file)
