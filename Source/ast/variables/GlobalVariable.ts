import type { DeoptimizableEntity } from "../DeoptimizableEntity";
import type { HasEffectsContext } from "../ExecutionContext";
import {
	INTERACTION_ACCESSED,
	INTERACTION_ASSIGNED,
	INTERACTION_CALLED,
	type NodeInteraction,
} from "../NodeInteractions";
import {
	UnknownValue,
	type LiteralValueOrUnknown,
} from "../nodes/shared/Expression";
import { getGlobalAtPath } from "../nodes/shared/knownGlobals";
import type { ObjectPath, PathTracker } from "../utils/PathTracker";
import Variable from "./Variable";

export default class GlobalVariable extends Variable {
	// Ensure we use live-bindings for globals as we do not know if they have
	// been reassigned
	isReassigned = true;

	deoptimizeArgumentsOnInteractionAtPath(
		interaction: NodeInteraction,
		path: ObjectPath,
		recursionTracker: PathTracker,
	) {
		switch (interaction.type) {
			// While there is no point in testing these cases as at the moment, they
			// are also covered via other means, we keep them for completeness
			case INTERACTION_ACCESSED:
			case INTERACTION_ASSIGNED: {
				if (!getGlobalAtPath([this.name, ...path].slice(0, -1))) {
					super.deoptimizeArgumentsOnInteractionAtPath(
						interaction,
						path,
						recursionTracker,
					);
				}
				return;
			}
			case INTERACTION_CALLED: {
				const globalAtPath = getGlobalAtPath([this.name, ...path]);
				if (globalAtPath) {
					globalAtPath.deoptimizeArgumentsOnCall(interaction);
				} else {
					super.deoptimizeArgumentsOnInteractionAtPath(
						interaction,
						path,
						recursionTracker,
					);
				}
				return;
			}
		}
	}

	getLiteralValueAtPath(
		path: ObjectPath,
		_recursionTracker: PathTracker,
		_origin: DeoptimizableEntity,
	): LiteralValueOrUnknown {
		const globalAtPath = getGlobalAtPath([this.name, ...path]);
		return globalAtPath ? globalAtPath.getLiteralValue() : UnknownValue;
	}

	hasEffectsOnInteractionAtPath(
		path: ObjectPath,
		interaction: NodeInteraction,
		context: HasEffectsContext,
	): boolean {
		switch (interaction.type) {
			case INTERACTION_ACCESSED: {
				if (path.length === 0) {
					// Technically, "undefined" is a global variable of sorts
					return (
						this.name !== "undefined" &&
						!getGlobalAtPath([this.name])
					);
				}
				return !getGlobalAtPath([this.name, ...path].slice(0, -1));
			}
			case INTERACTION_ASSIGNED: {
				return true;
			}
			case INTERACTION_CALLED: {
				const globalAtPath = getGlobalAtPath([this.name, ...path]);
				return (
					!globalAtPath ||
					globalAtPath.hasEffectsWhenCalled(interaction, context)
				);
			}
		}
	}
}
