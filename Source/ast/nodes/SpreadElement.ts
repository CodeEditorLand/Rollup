import type { NormalizedTreeshakingOptions } from "../../rollup/types";
import type { HasEffectsContext } from "../ExecutionContext";
import {
	NODE_INTERACTION_UNKNOWN_ACCESS,
	type NodeInteraction,
} from "../NodeInteractions";
import {
	UNKNOWN_PATH,
	UnknownKey,
	type ObjectPath,
	type PathTracker,
} from "../utils/PathTracker";
import type * as NodeType from "./NodeType";
import { NodeBase, type ExpressionNode } from "./shared/Node";

export default class SpreadElement extends NodeBase {
	declare argument: ExpressionNode;
	declare type: NodeType.tSpreadElement;

	deoptimizeArgumentsOnInteractionAtPath(
		interaction: NodeInteraction,
		path: ObjectPath,
		recursionTracker: PathTracker,
	): void {
		if (path.length > 0) {
			this.argument.deoptimizeArgumentsOnInteractionAtPath(
				interaction,
				[UnknownKey, ...path],
				recursionTracker,
			);
		}
	}

	hasEffects(context: HasEffectsContext): boolean {
		if (!this.deoptimized) this.applyDeoptimizations();
		const { propertyReadSideEffects } = this.scope.context.options
			.treeshake as NormalizedTreeshakingOptions;
		return (
			this.argument.hasEffects(context) ||
			(propertyReadSideEffects &&
				(propertyReadSideEffects === "always" ||
					this.argument.hasEffectsOnInteractionAtPath(
						UNKNOWN_PATH,
						NODE_INTERACTION_UNKNOWN_ACCESS,
						context,
					)))
		);
	}

	protected applyDeoptimizations(): void {
		this.deoptimized = true;
		// Only properties of properties of the argument could become subject to reassignment
		// This will also reassign the return values of iterators
		this.argument.deoptimizePath([UnknownKey, UnknownKey]);
		this.scope.context.requestTreeshakingPass();
	}
}
