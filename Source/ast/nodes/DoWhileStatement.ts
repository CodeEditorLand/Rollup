import type { HasEffectsContext, InclusionContext } from "../ExecutionContext";
import type * as NodeType from "./NodeType";
import { hasLoopBodyEffects, includeLoopBody } from "./shared/loops";
import {
	StatementBase,
	type ExpressionNode,
	type IncludeChildren,
	type StatementNode,
} from "./shared/Node";

export default class DoWhileStatement extends StatementBase {
	declare body: StatementNode;
	declare test: ExpressionNode;
	declare type: NodeType.tDoWhileStatement;

	hasEffects(context: HasEffectsContext): boolean {
		if (this.test.hasEffects(context)) return true;
		return hasLoopBodyEffects(context, this.body);
	}

	include(
		context: InclusionContext,
		includeChildrenRecursively: IncludeChildren,
	): void {
		this.included = true;
		this.test.include(context, includeChildrenRecursively);
		includeLoopBody(context, this.body, includeChildrenRecursively);
	}
}
