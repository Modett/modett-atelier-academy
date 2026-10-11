import { RegionService } from './region.service';

describe('RegionService', () => {
  it('returns the resolved region for the request', () => {
    const service = new RegionService();
    expect(service.getRegion({ country: 'LK', region: 'LK', currency: 'LKR' })).toEqual({
      country: 'LK',
      region: 'LK',
      currency: 'LKR',
    });
  });
});
