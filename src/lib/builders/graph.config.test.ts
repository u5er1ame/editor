import { describe, it, expect } from 'vitest';
import { GraphConfigBuilder } from './graph.config';

describe('GraphConfigBuilder', () => {
	const FakeComponent = (() => {}) as any;

	it('builds a node config with required fields', () => {
		const config = GraphConfigBuilder.node()
			.labelKey('name')
			.component('room', FakeComponent)
			.build();

		expect(config.type).toBe('node');
		expect(config.labelKey).toBe('name');
		expect(config.component).toBe(FakeComponent);
	});

	it('builds an edge config without component', () => {
		const config = GraphConfigBuilder.edge().labelKey('name').build();

		expect(config.type).toBe('edge');
		expect(config.labelKey).toBe('name');
		expect(config.component).toBeUndefined();
	});

	it('sets parentIDKey', () => {
		const config = GraphConfigBuilder.node()
			.labelKey('name')
			.component('board', FakeComponent)
			.parentIDKey('room')
			.build();

		expect(config.parentIdKey).toBe('room');
	});

	it('merges flowConfig with defaults', () => {
		const config = GraphConfigBuilder.node()
			.labelKey('name')
			.component('breaker', FakeComponent)
			.flowConfig({ connectable: true })
			.build();

		expect(config.flowConfig.connectable).toBe(true);
		expect(config.flowConfig.draggable).toBe(true); // from default
		expect(config.flowConfig.extent).toBe('parent'); // from default
	});

	it('sets elkConfig', () => {
		const elkOpts = { 'elk.algorithm': 'layered' as const, 'elk.direction': 'DOWN' as const };
		const config = GraphConfigBuilder.node()
			.labelKey('name')
			.component('room', FakeComponent)
			.elkConfig(elkOpts)
			.build();

		expect(config.elkConfig).toBe(elkOpts);
	});

	it('uses default elkConfig when none provided', () => {
		const config = GraphConfigBuilder.node()
			.labelKey('name')
			.component('room', FakeComponent)
			.elkConfig()
			.build();

		expect(config.elkConfig['elk.algorithm']).toBe('layered');
	});

	it('static node() and edge() create correct types', () => {
		const node = GraphConfigBuilder.node();
		expect(node.config.type).toBe('node');

		const edge = GraphConfigBuilder.edge();
		expect(edge.config.type).toBe('edge');
	});

	it('flowConfig merges multiple calls', () => {
		const config = GraphConfigBuilder.node()
			.labelKey('name')
			.component('room', FakeComponent)
			.flowConfig({ connectable: true })
			.flowConfig({ draggable: false })
			.build();

		expect(config.flowConfig.connectable).toBe(true);
		expect(config.flowConfig.draggable).toBe(false);
	});
});
