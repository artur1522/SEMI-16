import type { RegionReference } from '../types/cloud'

export const regionReferences: RegionReference[] = [
  {
    id: 'us-west-2',
    name: 'US West (Oregon)',
    location: 'Oregon, USA',
    latencyMs: 78,
    availabilityZones: [
      { name: 'us-west-2a', status: 'active' },
      { name: 'us-west-2b', status: 'active' },
      { name: 'us-west-2c', status: 'active' }
    ]
  },
  {
    id: 'us-east-1',
    name: 'US East (N. Virginia)',
    location: 'Virginia, USA',
    latencyMs: 80,
    availabilityZones: [
      { name: 'us-east-1a', status: 'active' },
      { name: 'us-east-1b', status: 'active' },
      { name: 'us-east-1c', status: 'warning' }
    ]
  },
  {
    id: 'sa-east-1',
    name: 'South America (São Paulo)',
    location: 'São Paulo, Brazil',
    latencyMs: 25,
    availabilityZones: [
      { name: 'sa-east-1a', status: 'active' },
      { name: 'sa-east-1b', status: 'warning' },
      { name: 'sa-east-1c', status: 'active' }
    ]
  },
  {
    id: 'eu-west-1',
    name: 'EU (Ireland)',
    location: 'Dublin, Ireland',
    latencyMs: 145,
    availabilityZones: [
      { name: 'eu-west-1a', status: 'active' },
      { name: 'eu-west-1b', status: 'active' },
      { name: 'eu-west-1c', status: 'active' }
    ]
  },
  {
    id: 'eu-central-1',
    name: 'EU (Frankfurt)',
    location: 'Frankfurt, Germany',
    latencyMs: 152,
    availabilityZones: [
      { name: 'eu-central-1a', status: 'active' },
      { name: 'eu-central-1b', status: 'inactive' },
      { name: 'eu-central-1c', status: 'active' }
    ]
  },
  {
    id: 'ap-south-1',
    name: 'Asia Pacific (Mumbai)',
    location: 'Mumbai, India',
    latencyMs: 192,
    availabilityZones: [
      { name: 'ap-south-1a', status: 'active' },
      { name: 'ap-south-1b', status: 'warning' },
      { name: 'ap-south-1c', status: 'active' }
    ]
  },
  {
    id: 'ap-southeast-1',
    name: 'Asia Pacific (Singapore)',
    location: 'Singapore',
    latencyMs: 225,
    availabilityZones: [
      { name: 'ap-southeast-1a', status: 'active' },
      { name: 'ap-southeast-1b', status: 'warning' },
      { name: 'ap-southeast-1c', status: 'active' }
    ]
  },
  {
    id: 'ap-northeast-1',
    name: 'Asia Pacific (Tokyo)',
    location: 'Tokyo, Japan',
    latencyMs: 188,
    availabilityZones: [
      { name: 'ap-northeast-1a', status: 'active' },
      { name: 'ap-northeast-1c', status: 'active' },
      { name: 'ap-northeast-1d', status: 'active' }
    ]
  }
]

export default regionReferences