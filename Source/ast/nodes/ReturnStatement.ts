import type MagicString from "magic-string";

import type { RenderOptions } from "../../utils/renderHelpers";
import {
	type HasEffectsContext,
	type InclusionContext,
} from "../ExecutionContext";
import type * as NodeType from "./NodeType";
import { UNKNOWN_EXPRESSION } from "./shared/Expression";
import {
	StatementBase,
	type ExpressionNode,
	type IncludeChildren,
} from "./shared/Node";

export default class ReturnStatement extends StatementBase {
	declare argument: ExpressionNode | null;
	declare type: NodeType.tReturnStatement;

	hasEffects(context: HasEffectsContext): boolean {
		if (!context.ignore.returnYield || this.argument?.hasEffects(context))
			return true;
		context.brokenFlow = true;
		return false;
	}

	include(
		context: InclusionContext,
		includeChildrenRecursively: IncludeChildren,
	): void {
		this.included = true;
		this.argument?.include(context, includeChildrenRecursively);
		context.brokenFlow = true;
	}

	initialise(): void {
		this.scope.addReturnExpression(this.argument || UNKNOWN_EXPRESSION);
	}

	render(code: MagicString, options: RenderOptions): void {
		if (this.argument) {
			this.argument.render(code, options, { preventASI: true });
			if (this.argument.start === this.start + 6 /* 'return'.length */) {
				code.prependLeft(this.start + 6, " ");
			}
		}
	}
}
