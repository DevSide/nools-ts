import Context, {Match} from '../context';
import Rule from '../rule';
import intersection from 'lodash-ts/intersection';
import ObjectPattern from '../pattern/object-pattern';

let count = 0;
export default class Node {
	protected nodes = new Map<Node, ObjectPattern[]>();
	protected rules: Rule[] = [];
	protected parentNodes: Node[] = [];
	protected __count = count++;
	protected __rule__: Rule;
	set_rule(rule: Rule) {
		this.__rule__ = rule;
	}

	get_rule() {
		return this.__rule__;
	}

	addRule(rule: Rule) {
		if (this.rules.indexOf(rule) === -1) {
			this.rules.push(rule);
		}
		return this;
	}

	merge(that: Node) {
		for (const [node, patterns] of that.nodes.entries()) {
			for (let i = 0, l = patterns.length; i < l; i++) {
				this.addOutNode(node, patterns[i]);
			}
			that.nodes.delete(node);
		}
		const thatParentNodes = that.parentNodes;
		for (let i = 0, l = that.parentNodes.length; i < l; i++) {
			const parentNode = thatParentNodes[i];
			this.addParentNode(parentNode);
			parentNode.nodes.delete(that);
		}
		return this;
	}

	resolve(mr1: Match, mr2: Match) {
		return mr1.hashCode === mr2.hashCode;
	}

	print(tab: string) {
		console.log(tab + this.toString());
		this.parentNodes.forEach(function (n) {
			n.print("    " + tab);
		});
	}

	addOutNode(outNode: Node, pattern: ObjectPattern) {
		if (!this.nodes.has(outNode)) {
			this.nodes.set(outNode, []);
		}
		this.nodes.get(outNode).push(pattern);
		// this.__entrySet = this.nodes.entries();
	}

	addParentNode(n: Node) {
		if (this.parentNodes.indexOf(n) === -1) {
			this.parentNodes.push(n);
		}
	}

	shareable() {
		return false;
	}

	// __propagate(method: "assert" | "retract" | "modify", context: Context) {
	// 	let continuingPaths: T[];
	// 	for (const [outNode, paths] of this.nodes.entries()) {
	// 		if ((continuingPaths = intersection(paths, context.paths)).length) {
	// 			outNode[method](new Context(context.fact, continuingPaths, context.match));
	// 		}
	// 	}
	// }

	dispose(assertable: any) {
		this.propagateDispose(assertable);
	}

	retract(assertable: any) {
		this.propagateRetract(assertable);
	}

	propagateDispose(assertable: any) {
		for (const [outNode, value] of this.nodes.entries()) {
			outNode.dispose(assertable);
		}
	}

	propagateAssert(assertable: any) {
		for (const [outNode, paths] of this.nodes.entries()) {
			const continuingPaths = intersection(paths, assertable.paths);
			if (continuingPaths.length) {
				outNode.assert(new Context(assertable.fact, continuingPaths, assertable.match));
			}
		}
	}

	propagateRetract(assertable: any) {
		for (const [outNode, paths] of this.nodes.entries()) {
			const continuingPaths = intersection(paths, assertable.paths);
			if (continuingPaths.length) {
				outNode.retract(new Context(assertable.fact, continuingPaths, assertable.match));
			}
		}
	}

	propagateModify(assertable: any) {
		for (const [outNode, paths] of this.nodes.entries()) {
			const continuingPaths = intersection(paths, assertable.paths);
			if (continuingPaths.length) {
				outNode.modify(new Context(assertable.fact, continuingPaths, assertable.match));
			}
		}
	}

	assert(assertable: any) {
		this.propagateAssert(assertable);
	}

	modify(assertable: any) {
		this.propagateModify(assertable);
	}
}