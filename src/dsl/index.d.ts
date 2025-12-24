import { CstNode } from 'chevrotain';

declare abstract class ChatwoAstNode {
    execute(context: ChatwoAstContext): Promise<any>;
}

declare class ChatwoAstPosition extends ChatwoAstNode {
    positions: string[];
    constructor(positions: string[]);
    execute(): Promise<void>;
    setState(context: any, value: any): any;
}

declare enum WhereOperator {
    EQUALS = "=",
    NOT_EQUALS = "!=",
    GREATER_THAN = ">",
    LESS_THAN = "<",
    GREATER_THAN_OR_EQUAL = ">=",
    LESS_THAN_OR_EQUAL = "<=",
    LIKE = "LIKE",
    ILIKE = "ILIKE",
    IN = "IN",
    CONTAINS = "@>",
    CONTAINED_BY = "<@",
    ISNULL = "ISNULL",
    BETWEEN = "BETWEEN",
    ANY = "ANY"
}
declare class ChatwoAstWhereState extends ChatwoAstNode {
    state: {
        position: ChatwoAstPosition;
        operator: WhereOperator;
        value: ChatwoAstNode | string | number | boolean;
    }[];
    constructor(state: {
        position: ChatwoAstPosition;
        operator: WhereOperator;
        value: ChatwoAstNode | string | number | boolean;
    }[]);
    execute(context: ChatwoAstContext): Promise<{}>;
}

interface ChatwoAstContext {
    queryWhere: (operator: WhereOperator, value?: any) => any;
    query: (from: string, select: any, where?: any, join?: any, orderBy?: any, limit?: any, offset?: any) => Promise<any[]>;
    [key: string]: any;
}

declare class ChatwoAstArray extends ChatwoAstNode {
    elements: (ChatwoAstNode | string | number | boolean)[];
    constructor(elements: (ChatwoAstNode | string | number | boolean)[]);
    execute(context: ChatwoAstContext): Promise<any[]>;
}

declare enum BinaryOperator {
    Add = "+",
    Subtract = "-",
    Multiply = "*",
    Divide = "/",
    Modulus = "%",
    Power = "**",
    BitwiseAnd = "&",
    BitwiseOr = "|",
    BitwiseXor = "^",
    Or = "||",
    And = "&&",
    GreaterThan = ">",
    LessThan = "<",
    GreaterThanEquals = ">=",
    LessThanEquals = "<=",
    EqualsEquals = "==",
    NotEquals = "!=",
    LeftShift = "<<",
    RightShift = ">>"
}
declare class ChatwoAstBinaryOperation extends ChatwoAstNode {
    left: ChatwoAstNode | string | number | boolean;
    operator: BinaryOperator;
    right: ChatwoAstNode | string | number | boolean;
    constructor(left: ChatwoAstNode | string | number | boolean, operator: BinaryOperator, right: ChatwoAstNode | string | number | boolean);
    execute(context: ChatwoAstContext): Promise<any>;
}

declare class ChatwoAstIdentifier extends ChatwoAstNode {
    name: string;
    constructor(name: string);
    execute(context: ChatwoAstContext): Promise<any>;
}

declare enum PostfixOperator {
    call = "(",
    index = "[",
    member = ".",
    increment = "++",
    decrement = "--"
}
declare class ChatwoAstPostfixOperation extends ChatwoAstNode {
    operand: ChatwoAstNode | string | number | boolean;
    operator: PostfixOperator;
    index?: (ChatwoAstNode | string | number | boolean) | undefined;
    args?: (ChatwoAstNode | string | number | boolean)[] | undefined;
    member?: string | undefined;
    constructor(operand: ChatwoAstNode | string | number | boolean, operator: PostfixOperator, index?: (ChatwoAstNode | string | number | boolean) | undefined, args?: (ChatwoAstNode | string | number | boolean)[] | undefined, member?: string | undefined);
    execute(context: ChatwoAstContext): Promise<any>;
}

declare class ChatwoAstState extends ChatwoAstNode {
    state: {
        position: ChatwoAstPosition;
        value: ChatwoAstNode | string | number | boolean;
    }[];
    readonly root: {};
    constructor(state: {
        position: ChatwoAstPosition;
        value: ChatwoAstNode | string | number | boolean;
    }[]);
    execute(): Promise<{}>;
}

declare class ChatwoAstQuery extends ChatwoAstNode {
    from: string;
    select?: ChatwoAstState | undefined;
    where?: ChatwoAstWhereState[] | undefined;
    join?: ChatwoAstState | undefined;
    orderBy?: ChatwoAstState | undefined;
    limit?: (ChatwoAstNode | number) | undefined;
    offset?: (ChatwoAstNode | number) | undefined;
    constructor(from: string, select?: ChatwoAstState | undefined, where?: ChatwoAstWhereState[] | undefined, join?: ChatwoAstState | undefined, orderBy?: ChatwoAstState | undefined, limit?: (ChatwoAstNode | number) | undefined, offset?: (ChatwoAstNode | number) | undefined);
    execute(context: ChatwoAstContext): Promise<any>;
}

declare enum UnaryOperator {
    Positive = "+",
    Negate = "-",
    Not = "!",
    Increment = "++",
    Decrement = "--"
}
declare class ChatwoAstUnaryOperation extends ChatwoAstNode {
    operand: ChatwoAstNode | string | number | boolean;
    operator: UnaryOperator;
    constructor(operand: ChatwoAstNode | string | number | boolean, operator: UnaryOperator);
    execute(context: ChatwoAstContext): Promise<any>;
}

declare function parserToCST(expression: string): CstNode;
declare function parseToAST(cst: CstNode): ChatwoAstNode;
declare function exec(ast: ChatwoAstNode, context: ChatwoAstContext): Promise<any>;

export { BinaryOperator, ChatwoAstArray, ChatwoAstBinaryOperation, type ChatwoAstContext, ChatwoAstIdentifier, ChatwoAstNode, ChatwoAstPosition, ChatwoAstPostfixOperation, ChatwoAstQuery, ChatwoAstState, ChatwoAstUnaryOperation, ChatwoAstWhereState, PostfixOperator, UnaryOperator, WhereOperator, exec, parseToAST, parserToCST };
