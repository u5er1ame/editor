import Projection from 'ol/proj/Projection';
import { addProjection } from 'ol/proj';

/**
 * Local coordinate reference for indoor mall floor plans.
 *
 * Floor-plan coordinates are already planar x/y values, so geographic
 * projections such as EPSG:4326 or EPSG:3857 would introduce incorrect
 * latitude/longitude or Web Mercator semantics. Identity transforms keep
 * coordinates in the same units as the source data.
 */
export const MALL_LOCAL_PROJECTION = new Projection({
	code: 'MALL_LOCAL',
	units: 'm',
	extent: [-1_000_000, -1_000_000, 1_000_000, 1_000_000]
});

addProjection(MALL_LOCAL_PROJECTION);
