import type { Service } from '../types/cloud'

export const awsServices: Service[] = [
  {
    id: 'ec2',
    name: 'EC2',
    fullName: 'Elastic Compute Cloud',
    category: 'Compute',
    description: 'Instancias virtuales en la nube para ejecutar cargas de trabajo generales.',
    mainFunction: 'Proveer capacidad de cómputo elástica y configurable.',
    status: 'active',
    quotas: '20 instancias on-demand por región por defecto; límite ampliable bajo solicitud.',
    alternatives: ['Azure Virtual Machines', 'Google Compute Engine', 'DigitalOcean Droplets'],
    docsUrl: 'https://docs.aws.amazon.com/ec2/',
    related: ['vpc', 'rds', 'iam', 's3']
  },
  {
    id: 's3',
    name: 'S3',
    fullName: 'Simple Storage Service',
    category: 'Storage',
    description: 'Almacenamiento de objetos duradero, altamente escalable.',
    mainFunction: 'Almacenar y servir objetos (backups, assets, logs).',
    status: 'active',
    quotas: 'Sin límite de objetos ni de capacidad; máximo de 5 TB por objeto único.',
    alternatives: ['Azure Blob Storage', 'Google Cloud Storage'],
    docsUrl: 'https://docs.aws.amazon.com/s3/',
    related: ['route53', 'cloudfront', 'iam']
  },
  {
    id: 'rds',
    name: 'RDS',
    fullName: 'Relational Database Service',
    category: 'Database',
    description: 'Servicio administrado de bases de datos relacionales.',
    mainFunction: 'Proveer bases de datos relacionales gestionadas (MySQL, PostgreSQL, etc.).',
    status: 'active',
    quotas: '40 instancias de base de datos por cuenta y región; hasta 3 réplicas de lectura.',
    alternatives: ['Azure Database for MySQL', 'Google Cloud SQL'],
    docsUrl: 'https://docs.aws.amazon.com/rds/',
    related: ['ec2', 'iam', 'vpc', 's3']
  },
  {
    id: 'iam',
    name: 'IAM',
    fullName: 'Identity and Access Management',
    category: 'Security',
    description: 'Gestión de identidades y accesos para recursos AWS.',
    mainFunction: 'Control de acceso y permisos para usuarios y servicios.',
    status: 'active',
    quotas: '5000 usuarios por cuenta; 10 políticas administradas por usuario por defecto.',
    alternatives: ['Microsoft Entra ID (RBAC)', 'Google Cloud IAM'],
    docsUrl: 'https://docs.aws.amazon.com/iam/',
    related: ['ec2', 'rds', 's3', 'vpc', 'route53']
  },
  {
    id: 'vpc',
    name: 'VPC',
    fullName: 'Virtual Private Cloud',
    category: 'Networking',
    description: 'Red virtual aislada para desplegar recursos en la nube.',
    mainFunction: 'Proveer subredes, ruteo y seguridad de red a recursos.',
    status: 'active',
    quotas: '5 VPCs por región por defecto; 5 Internet Gateways; 200 subredes por VPC.',
    alternatives: ['Azure Virtual Network', 'Google Cloud VPC'],
    docsUrl: 'https://docs.aws.amazon.com/vpc/',
    related: ['ec2', 'iam', 'route53', 'cloudfront']
  },
  {
    id: 'route53',
    name: 'Route 53',
    fullName: 'Servicio DNS y enrutamiento global',
    category: 'DNS',
    description: 'Servicio DNS y balanceo de tráfico global.',
    mainFunction: 'Resolver nombres, health checks y enrutamiento global.',
    status: 'active',
    quotas: '1000 hosted zones por cuenta; 500 registros por zona por defecto.',
    alternatives: ['Azure DNS', 'Google Cloud DNS'],
    docsUrl: 'https://docs.aws.amazon.com/route53/',
    related: ['cloudfront', 'vpc', 'ec2']
  },
  {
    id: 'cloudfront',
    name: 'CloudFront',
    fullName: 'Red de entrega de contenido (CDN)',
    category: 'CDN',
    description: 'Red de entrega de contenido para acelerar distribución de assets.',
    mainFunction: 'Cachear y distribuir contenido globalmente con baja latencia.',
    status: 'warning',
    quotas: '1000 distribuciones por cuenta por defecto; 25 GB de transferencia incluidos en el nivel gratuito.',
    alternatives: ['Azure Front Door', 'Google Cloud CDN'],
    docsUrl: 'https://docs.aws.amazon.com/cloudfront/',
    related: ['route53', 's3', 'vpc']
  }
]

export default awsServices