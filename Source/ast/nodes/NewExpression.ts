import type MagicString from "magic-string";

import { renderCallArguments } from "../../utils/renderCallArguments";
import type { RenderOptions } from "../../utils/renderHelpers";
import type { HasEffectsContext, InclusionContext } from "../ExecutionContext";
import {
	INTERACTION_ACCESSED,
	INTERACTION_CALLED,
	type NodeInteraction,
	type NodeInteractionCalled,
} from "../NodeInteractions";
import {
	EMPTY_PATH,
	SHARED_RECURSION_TRACKER,
	type ObjectPath,
} from "../utils/PathTracker";
import type * as NodeType from "./NodeType";
import {
	NodeBase,
	type ExpressionNode,
	type IncludeChildren,
} from "./shared/Node";

export default class NewExpression extends NodeBase {
	declare arguments: ExpressionNode[];
	declare callee: ExpressionNode;
	declare type: NodeType.tNewExpression;
	private declare interaction: NodeInteractionCalled;

	hasEffects(context: HasEffectsContext): boolean {
		try {
			for (const argument of this.arguments) {
				if (argument.hasEffects(context)) return true;
			}
			if (this.annotationPure) {
				return false;
			}
			return (
				this.callee.hasEffects(context) ||
				this.callee.hasEffectsOnInteractionAtPath(
					EMPTY_PATH,
					this.interaction,
					context,
				)
			);
		} finally {
			if (!this.deoptimized) this.applyDeoptimizations();
		}
	}

	hasEffectsOnInteractionAtPath(
		path: ObjectPath,
		{ type }: NodeInteraction,
	): boolean {
		return path.length > 0 || type !== INTERACTION_ACCESSED;
	}

	include(
		context: InclusionContext,
		includeChildrenRecursively: IncludeChildren,
	): void {
		if (!this.deoptimized) this.applyDeoptimizations();
		if (includeChildrenRecursively) {
			super.include(context, includeChildrenRecursively);
		} else {
			this.included = true;
			this.callee.include(context, false);
		}
		this.callee.includeCallArguments(context, this.arguments);
	}

	initialise(): void {
		this.interaction = {
			args: [null, ...this.arguments],
			type: INTERACTION_CALLED,
			withNew: true,
		};
	}

	render(code: MagicString, options: RenderOptions) {
		this.callee.render(code, options);
		renderCallArguments(code, options, this);
	}

	protected applyDeoptimizations(): void {
		this.deoptimized = true;
		this.callee.deoptimizeArgumentsOnInteractionAtPath(
			this.interaction,
			EMPTY_PATH,
			SHARED_RECURSION_TRACKER,
		);
		this.scope.context.requestTreeshakingPass();
	}
}
