import P from 'parsimmon'

//----------------------------------------------------------------------------
// Data

class Namespace {
    private array : Array<string>
    private map : Map<string, number>
    constructor() {
        this.array = new Array<string>()
        this.map = new Map<string, number>()
    }
    public ref(s : string) : number {
        let key = this.map.get(s)
        console.log(s, key)
        if (key === undefined) {
            key = this.array.length
            this.array.push(s)
            this.map.set(s, key)
        }
        return key
    }
    public deref(n : number) : string {
        return this.array[n]
    }
}

interface Term {}

class Variable implements Term {
    readonly variable : number
    constructor(a : number) {
        this.variable = a
    }
}

class Struct implements Term {
    readonly atom : number
    readonly args : Term[]
    constructor(a : number, l : Term[]) {
        this.atom = a
        this.args = l
    }
}

class Clause {
    readonly head : Struct
    readonly body : Struct[]
    constructor(h : Struct, b : Struct[]) {
        this.head = h
        this.body = b
    }
}

class Query {
    readonly goal : Struct
    constructor(g : Struct) {
        this.goal = g
    }
}

class Env {
    readonly atoms : Namespace
    readonly vars : Namespace
    constructor() {
        this.atoms = new Namespace()
        this.vars = new Namespace()
    }
}

class Program {
    readonly env : Env
    readonly clauses : Map<[number, number], Clause[]>
    readonly queries : Query[]
    constructor(env : Env) {
        this.env = env
        this.clauses = new Map<[number, number], Clause[]>()
        this.queries = []
    }
    public add_clause(c : Clause) {
        const head = c.head
        const key : [number, number] = [head.atom, head.args.length]
        let clauses = this.clauses.get(key)
        if (clauses === undefined) {
            clauses = new Array<Clause>()
            this.clauses.set(key, clauses)
        }
        clauses.push(c);
    }
}

//----------------------------------------------------------------------------
// Parser 

function tokenise<T>(p : P.Parser<T>) : P.Parser<T> {
    return P.optWhitespace.then(p).skip(P.optWhitespace)
}

const tok_struct = tokenise(P.regexp(/[a-z][_a-zA-Z0-9]*/))
const tok_variable = tokenise(P.regexp(/[A-Z][_a-zA-Z0-9]*/))
const tok_listSep = tokenise(P.string(','))
const tok_listStart = tokenise(P.string('('))
const tok_listEnd = tokenise(P.string(')'))
const tok_rule = tokenise(P.string(':-'))
const tok_clauseEnd = tokenise(P.string('.'))

function name_struct(env : Env) : P.Parser<number> {
    return tok_struct.map((s) => env.atoms.ref(s))
}

function name_variable(env : Env) : P.Parser<number> {
    return tok_variable.map((v) => env.vars.ref(v))
}

function variable(env : Env) : P.Parser<Variable> {
    return name_variable(env).map((v) => new Variable(v))
}

function struct(env : Env) : P.Parser<Struct> {
    const atomList = (tok_listStart.then(P.sepBy(P.lazy(() => term(env)), tok_listSep)).skip(tok_listEnd)).or(P.succeed([]))
    return P.seqMap(name_struct(env), atomList, (a, l) => new Struct(a, l))
}

function term(env : Env) : P.Parser<Term> {
    return variable(env).or(struct(env))
}

function clause(env : Env) : P.Parser<Clause> {
    const body = tok_rule.then(P.sepBy(struct(env), tok_listSep)).or(P.succeed([]))
    return P.seqMap(struct(env), body, (h, b) => new Clause(h, b)).skip(tok_clauseEnd)
}

function query(env : Env) : P.Parser<Query> {
    return tok_rule.then(struct(env)).skip(tok_clauseEnd).map((s) => new Query(s))
}

function program(env : Env) : P.Parser<Program> {
    const program = new Program(env)
    return clause(env).map((c) => program.add_clause(c)).or(
        query(env).map((q) => program.queries.push(q))
    ).many().map(() => program)
}

export function parse(code : string) : P.Result<Program> {
    return program(new Env()).parse(code)
}


//----------------------------------------------------------------------------
// Showable

function map<T, U>(i : Iterator<T>, f : (v:T) => U) : U[] {
    let l = []
    while (true) {
        let x = i.next()
        if (x.done) {
            break;
        }
        l.push(f(x.value))
    }
    return l
}

interface Showable {
    show(env : Env) : string
}

interface Term extends Showable {}

interface Variable extends Showable {}

Variable.prototype.show = function(env) {
    return env.vars.deref(this.variable)
}

interface Struct extends Showable {}

Struct.prototype.show = function(env) {
    return env.atoms.deref(this.atom) + 
        ((this.args.length > 0) ? ('(' + this.args.map((arg : Term) => arg.show(env)).join(', ') + ')') : '')
}

interface Clause extends Showable {}

Clause.prototype.show = function(env) {
    return this.head.show(env) +
        ((this.body.length > 0) ? (' :- ' + this.body.map((v : Struct) => v.show(env)).join(', ')) : '') + '.'
}

interface Program extends Showable {}

Program.prototype.show = function(env) {
    return map(this.clauses.values(), (a : Array<Clause>) => a.map((c) => c.show(env)).join('\n')).join('\n')
}

export function show(p : Program) : string {
    return p.show(p.env)
}
