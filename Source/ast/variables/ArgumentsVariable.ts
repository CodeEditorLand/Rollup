import type { AstContext } from "../../Module";
import {
	INTERACTION_ACCESSED,
	type NodeInteraction,
} from "../NodeInteractions";
import {
	UNKNOWN_EXPRESSION,
	type ExpressionEntity,
} from "../nodes/shared/Expression";
import { UNKNOWN_PATH, type ObjectPath } from "../utils/PathTracker";
import LocalVariable from "./LocalVariable";

export default class ArgumentsVariable extends LocalVariable {
	private deoptimizedArguments: ExpressionEntity[] = [];

	constructor(context: AstContext) {
		super("arguments", null, UNKNOWN_EXPRESSION, context);
	}

	addArgumentToBeDeoptimized(argument: ExpressionEntity): void {
		if (this.included) {
			argument.deoptimizePath(UNKNOWN_PATH);
		} else {
			this.deoptimizedArguments.push(argument);
		}
	}

	hasEffectsOnInteractionAtPath(
		path: ObjectPath,
		{ type }: NodeInteraction,
	): boolean {
		return type !== INTERACTION_ACCESSED || path.length > 1;
	}

	include() {
		super.include();
		for (const argument of this.deoptimizedArguments) {
			argument.deoptimizePath(UNKNOWN_PATH);
		}
		this.deoptimizedArguments.length = 0;
	}
}
