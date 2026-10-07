// Phase 0 · Foundations: how data products and the internet work. Plan: docs/roadmap-v2/01-concepts.md.
import dataProduct from './foundations/foundations-data-product.js';
import oltpOlap from './foundations/foundations-oltp-olap-batch-stream.js';
import architecture from './foundations/foundations-architecture-patterns.js';
import governance from './foundations/foundations-governance-quality-lineage.js';
import ipPorts from './foundations/foundations-ip-ports-nat.js';
import dns from './foundations/foundations-dns.js';
import http from './foundations/foundations-http-in-depth.js';
import tls from './foundations/foundations-tls-certificates.js';
import proxies from './foundations/foundations-proxies-load-balancing.js';
import netSec from './foundations/foundations-network-security.js';
import authn from './foundations/foundations-authentication.js';
import oauth from './foundations/foundations-oauth2-oidc.js';
import jwt from './foundations/foundations-jwt-sso-saml.js';
import authz from './foundations/foundations-authorization-secrets.js';
import acid from './foundations/foundations-acid-cap.js';
import idem from './foundations/foundations-idempotency-retries-queues.js';
import caching from './foundations/foundations-caching-scaling.js';
import observability from './foundations/foundations-observability-slo.js';
import formats from './foundations/foundations-file-formats.js';
import dbLandscape from './foundations/foundations-database-landscape.js';
import winSetup from './foundations/foundations-windows-dev-setup.js';
import designDoc from './foundations/foundations-design-doc.js';

export default {
  modules: [
    { id: 'foundations-mod-big-picture', title: 'The big picture', lessons: [dataProduct, oltpOlap, architecture, governance] },
    { id: 'foundations-mod-network', title: 'How computers talk to each other', lessons: [ipPorts, dns, http, tls, proxies, netSec] },
    { id: 'foundations-mod-identity', title: 'Identity and access: how auth really works', lessons: [authn, oauth, jwt, authz] },
    { id: 'foundations-mod-reliability', title: 'Reliability and scale', lessons: [acid, idem, caching, observability] },
    { id: 'foundations-mod-storage', title: 'Where data lives', lessons: [formats, dbLandscape] },
    { id: 'foundations-mod-your-machine', title: 'Your machine and your first design', lessons: [winSetup, designDoc] },
  ],
};
