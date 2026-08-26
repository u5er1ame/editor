import TileLayer from 'ol/layer/Tile';
import XYZ from 'ol/source/XYZ';
import { MALL_LOCAL_PROJECTION } from './projection';

export interface BackgroundColors {
	bg: string;
	grid: string;
}

/** Read CSS variable values from the document root. */
function cssVar(name: string): string {
	return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

/** Derive background colors from the current CSS theme. */
export function readThemeColors(isDark: boolean): BackgroundColors {
	const bg = cssVar('--background');
	const grid = cssVar('--border');
	return { bg, grid };
}

/** Map extent constraint — keeps the camera within a 2D workspace. */
export const CONSTRAINT_EXTENT = [-100, -100, 500, 500] as [number, number, number, number];

export interface BackgroundLayer {
	layer: TileLayer<XYZ>;
	setColors: (colors: BackgroundColors) => void;
}

/**
 * Creates a TileLayer with canvas-generated tiles for an infinite
 * background with grid lines. Does not interfere with fitView/zoom
 * like vector-based backgrounds do.
 */
export function createBackgroundLayer(initial: BackgroundColors): BackgroundLayer {
	const tileSize = 1280;
	const gridSize = 16;
	const current = { ...initial };

	const source = new XYZ({
		projection: MALL_LOCAL_PROJECTION,
		tileSize,
		wrapX: false,
		tileUrlFunction: (coordinate) => {
			const canvas = document.createElement('canvas');
			canvas.width = tileSize;
			canvas.height = tileSize;
			const ctx = canvas.getContext('2d')!;

			ctx.fillStyle = current.bg;
			ctx.fillRect(0, 0, tileSize, tileSize);

			ctx.strokeStyle = current.grid;
			ctx.lineWidth = 0.2;
			ctx.beginPath();
			for (let i = 0; i <= tileSize; i += gridSize) {
				ctx.moveTo(i + 0.5, 0);
				ctx.lineTo(i + 0.5, tileSize);
				ctx.moveTo(0, i + 0.5);
				ctx.lineTo(tileSize, i + 0.5);
			}
			ctx.stroke();

			return 'data:image/png;base64,' + canvas.toDataURL().split(',')[1];
		},
		maxZoom: 22
	});

	const layer = new TileLayer({ source, zIndex: -10 });

	return {
		layer,
		setColors: (colors: BackgroundColors) => {
			Object.assign(current, colors);
			source.refresh();
		}
	};
}
