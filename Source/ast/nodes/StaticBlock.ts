import type MagicString from "magic-string";

import {
	findFirstOccurrenceOutsideComment,
	renderStatementList,
	type RenderOptions,
} from "../../utils/renderHelpers";
import type { HasEffectsContext, InclusionContext } from "../ExecutionContext";
import BlockScope from "../scopes/BlockScope";
import type ChildScope from "../scopes/ChildScope";
import type * as NodeType from "./NodeType";
import {
	StatementBase,
	type IncludeChildren,
	type StatementNode,
} from "./shared/Node";

export default class StaticBlock extends StatementBase {
	declare body: readonly StatementNode[];
	declare type: NodeType.tStaticBlock;

	createScope(parentScope: ChildScope): void {
		this.scope = new BlockScope(parentScope, this.scope.context);
	}

	hasEffects(context: HasEffectsContext): boolean {
		for (const node of this.body) {
			if (node.hasEffects(context)) return true;
		}
		return false;
	}

	include(
		context: InclusionContext,
		includeChildrenRecursively: IncludeChildren,
	): void {
		this.included = true;
		for (const node of this.body) {
			if (includeChildrenRecursively || node.shouldBeIncluded(context))
				node.include(context, includeChildrenRecursively);
		}
	}

	render(code: MagicString, options: RenderOptions): void {
		if (this.body.length > 0) {
			const bodyStartPos =
				findFirstOccurrenceOutsideComment(
					code.original.slice(this.start, this.end),
					"{",
				) + 1;
			renderStatementList(
				this.body,
				code,
				this.start + bodyStartPos,
				this.end - 1,
				options,
			);
		} else {
			super.render(code, options);
		}
	}
}
