/**
 * Zenith CMS — Query AST Parser
 * ─────────────────────────────
 * Translates incoming URL query objects or Mongo-style queries into a structured
 * Abstract Syntax Tree (AST) that can be reliably executed by both MongoDB and PostgreSQL adapters.
 */
export type Operator = 'equals' | 'not_equals' | 'contains' | 'in' | 'not_in' | 'gt' | 'gte' | 'lt' | 'lte';
export interface QueryNode {
    type: 'field' | 'logical';
}
export interface FieldNode extends QueryNode {
    type: 'field';
    field: string;
    operator: Operator;
    value: any;
}
export interface LogicalNode extends QueryNode {
    type: 'logical';
    operator: 'and' | 'or';
    children: QueryNode[];
}
export declare class QueryASTParser {
    /**
     * Parses a raw query object (e.g., from req.query or a Mongo-style filter) into an AST.
     */
    static parse(rawQuery: any): QueryNode;
    private static mapOperator;
}
