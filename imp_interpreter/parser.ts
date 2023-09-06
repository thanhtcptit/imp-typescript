import { readFileSync } from 'fs'

export const SPACING = "NONE"
export const SYNTAX_TAG = "SYNTAX"
export const NUMBER_TAG = "NUMBER"
export const BOOLEAN_TAG = "BOOLEAN"
export const VARIABLE_TAG = "VARIABLE"

const token_regex = [
    ["^[ \\n\\t\\r]+", SPACING],
    ["^\:=", SYNTAX_TAG],
    ["^\\(", SYNTAX_TAG],
    ["^\\)", SYNTAX_TAG],
    ["^{", SYNTAX_TAG],
    ["^}", SYNTAX_TAG],
    ["^;", SYNTAX_TAG],
    ["^,", SYNTAX_TAG],
    ["^>=", SYNTAX_TAG],
    ["^>", SYNTAX_TAG],
    ["^<=", SYNTAX_TAG],
    ["^<", SYNTAX_TAG],
    ["^==", SYNTAX_TAG],
    ["^!=", SYNTAX_TAG],
    ["^&&", SYNTAX_TAG],
    ["^\\|\\|", SYNTAX_TAG],
    ["^!", SYNTAX_TAG],
    ["^func", SYNTAX_TAG],
    ["^return", SYNTAX_TAG],
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


function readFile(filePath: string) {
    const text: string = readFileSync(filePath, "ascii")
    return text
}

export function parseFile(filePath: string) {
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

export class Result {
    value: any
    pos: number

    constructor(value: any, pos: number) {
        this.value = value
        this.pos = pos
    }
}

export abstract class Parser {
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

export class Tag extends Parser {
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

export class Syntax extends Parser {
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

export class Process extends Parser {
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

export class Combination extends Parser {
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

export class Repeat extends Parser {
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

export class Alternate extends Parser {
    left_parser: Parser
    right_parser: Parser

    constructor(left_parser: Parser, right_parser: Parser) {
        super()
        this.left_parser = left_parser
        this.right_parser = right_parser
    }

    public parse(tokens: Array<Array<string>>, pos: number) {
        let left_res = this.left_parser.parse(tokens, pos)
        let right_res = this.right_parser.parse(tokens, pos)
        if (right_res == null)
            return left_res
        else if (left_res != null && left_res.pos > right_res.pos)
            return left_res
        return right_res
    }
}

export class Optional extends Parser {
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

export class Lazy extends Parser {
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

export class Program extends Parser {
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
