export default {
  id: 'foundations-network-security',
  title: 'Network security: firewalls, segmentation and private access',
  goal: 'You can design a three-subnet network with firewall rules, explain default deny and rule priority, choose between public access, service endpoints and private endpoints, and describe zero trust in plain words.',
  roadmap: ['Firewalls and security groups', 'Segmentation and private endpoints', 'VPN and bastion', 'Zero trust'],
  blocks: [
    `## The problem
A developer opens the database to the internet "just for the demo": port 5432 allowed from \`0.0.0.0/0\`. Within hours, automated scanners find it and start guessing passwords. Months later nobody remembers the rule exists.

Real breaches are rarely clever. They are an open port, a storage container set to public, an admin password reused, or a database with a public address. Network security is the discipline of making the *default* answer "no" and opening only what is needed, on purpose, for named callers.

## Defence in depth
No single control is enough, so you stack them. If one fails, the next still protects you.
1. **Edge**: a WAF and DDoS protection in front of public sites.
2. **Network**: firewalls and subnets that decide who may reach which machine and port.
3. **Identity**: every caller must authenticate and be authorised (next module).
4. **Data**: encryption and masking, so stolen data is useless.
5. **Monitoring**: logs and alerts so you notice.

## Firewalls and security groups
A **firewall** allows or blocks traffic by rule. A rule looks at: **source** (who), **destination** (where), **port**, **protocol** (TCP/UDP) and says **allow** or **deny**.
- Rules have a **priority**. The engine reads them in order and the **first match wins**. In Azure a **Network Security Group (NSG)** uses priority numbers from 100 to 4096, **lower number = checked first**.
- **Default deny**: if no rule allows it, it is blocked. Azure adds default rules at the end (priority 65000 and above) that allow traffic inside the virtual network and from the load balancer, and deny everything else inbound. Check the current Azure documentation for the exact defaults.
- **Stateful**: when a connection is allowed in one direction, the replies are allowed back automatically. You do not write a rule for the response.
- Host firewalls (Windows Defender Firewall) do the same job on a single machine. Use both.

The most common serious mistake is a rule like \`allow, source *, port 22/3389/5432\`: administration or database ports open to the whole internet.`,
    { sketch: { w: 760, h: 320, caption: 'Three subnets: only the layer in front may talk to the layer behind. The database has no public address.', items: [
      { t: 'cloud', x: 8, y: 16, w: 112, h: 64, label: 'internet' },
      { t: 'box', x: 170, y: 14, w: 170, h: 58, label: 'App Gateway + WAF', fill: 'orange', size: 15 },
      { t: 'arrow', x1: 120, y1: 46, x2: 170, y2: 44, label: '443', ly: -10 },
      { t: 'box', x: 150, y: 100, w: 600, h: 200 },
      { t: 'text', x: 450, y: 118, text: 'virtual network 10.50.0.0/16   (one NSG per subnet)', size: 15, color: '#5c6478' },
      { t: 'box', x: 170, y: 140, w: 150, h: 84, label: 'web subnet', sub: '10.50.1.0/24', fill: 'yellow', size: 16 },
      { t: 'box', x: 370, y: 140, w: 150, h: 84, label: 'app subnet', sub: '10.50.2.0/24', fill: 'blue', size: 16 },
      { t: 'box', x: 570, y: 140, w: 160, h: 84, label: 'data subnet', sub: '10.50.3.0/24', fill: 'green', size: 16 },
      { t: 'arrow', x1: 255, y1: 72, x2: 245, y2: 140, label: 'gateway only', lx: 52, ly: 10 },
      { t: 'arrow', x1: 320, y1: 182, x2: 370, y2: 182, label: '8000', ly: -10 },
      { t: 'arrow', x1: 520, y1: 182, x2: 570, y2: 182, label: '5432', ly: -10 },
      { t: 'note', x: 170, y: 242, w: 560, h: 46, text: 'No public IP on app or data. Admin access only through a bastion host or VPN.\nStorage and databases are reached through private endpoints, not the public internet.', fill: 'pink', size: 14 },
    ] } },
    `## Segmentation: layers with walls between them
**Segmentation** splits a network into zones (subnets) with firewall rules between them, so that a break-in at one point cannot freely roam. The classic three tiers:
- **Web/edge subnet**: the only part that talks to the outside, through a gateway or load balancer.
- **App subnet**: your API and workers. Accepts traffic only from the web subnet, on one port.
- **Data subnet**: databases and storage. Accepts traffic only from the app subnet, on the database port.

If an attacker takes over the web tier, the rules still stop them from reaching the database directly. The old term **DMZ** (demilitarised zone) means the same idea: a small exposed zone kept apart from the inner network.

## Reaching cloud services privately
Platform services such as storage accounts, SQL databases and Key Vault have **public endpoints** by default. You have three ways to reach them:
1. **Public endpoint**, protected only by credentials and an IP allow-list. Simplest, most exposed.
2. **Service endpoint**: traffic from your subnet to the service travels over the cloud backbone and the service can be told to accept only your subnet. The service still has a public address.
3. **Private endpoint**: the service gets a **private IP address inside your subnet**, and you can switch off its public access completely. This is the strongest option. It relies on **private DNS** (previous lesson) so the usual service name resolves to that private IP.

## Getting in as an administrator
Do not open RDP (3389) or SSH (22) to the internet. Use one of:
- A **VPN**: a **point-to-site** VPN for one laptop, a **site-to-site** VPN to join your office network to the cloud network (this is why address ranges must not overlap), or a private circuit like Azure ExpressRoute.
- A **bastion host** (Azure Bastion): you reach a VM's console through the browser over TLS, and the VM needs no public IP.
- **Just-in-time access**: the port opens for your IP for an hour on request.

## Zero trust
The old model trusted anything inside the office network ("the castle and moat"). Once an attacker or a stolen laptop was inside, everything was open. **Zero trust** says: *never trust, always verify.* It is a way of thinking, not a product:
- **Verify explicitly**: every request is authenticated and authorised using identity, device health and context, even from inside.
- **Least privilege**: give only the access needed, for only the time needed.
- **Assume breach**: segment, log everything, limit the blast radius.

Notice that identity (who is calling) replaces location (which network). That is why the next module is about authentication.

Below is a small firewall engine that behaves like an NSG. Read the rules, then try your own packets.`,
    { py: {
      title: 'A firewall that evaluates rules in priority order',
      starter: `import ipaddress as ip

RULES = [
    {"priority": 100, "source": "10.50.2.0/24", "port": 5432, "action": "Allow"},   # app subnet -> database
    {"priority": 110, "source": "203.0.113.0/24", "port": 443, "action": "Allow"},  # our office -> https
    {"priority": 4000, "source": "*", "port": "*", "action": "Deny"},               # everything else
]

def evaluate(rules, src, port):
    for r in sorted(rules, key=lambda r: r["priority"]):        # lowest number first
        src_ok = r["source"] == "*" or ip.ip_address(src) in ip.ip_network(r["source"])
        port_ok = r["port"] == "*" or r["port"] == port
        if src_ok and port_ok:
            return r["action"] + f" (rule {r['priority']})"
    return "Deny (default)"

for src, port in [("10.50.2.9", 5432), ("10.50.1.5", 5432), ("203.0.113.40", 443), ("8.8.8.8", 22), ("203.0.113.40", 22)]:
    print(f"{src:>14}:{port:<5} -> {evaluate(RULES, src, port)}")`,
      note: 'Add a rule {"priority": 50, "source": "10.50.2.9/32", "port": "*", "action": "Deny"} and see how a lower number overrides the Allow at 100.',
    } },
    { pychallenge: {
      id: 'foundations-pych-nsg',
      prompt: 'Write `evaluate(rules, src, port)` that returns `"Allow"` or `"Deny"`. Each rule is a dict with `priority` (int), `source` (a CIDR string or `"*"`), `port` (an int or `"*"`) and `action`. Check rules in **ascending priority** (the input may be unsorted); the **first matching rule decides**. If no rule matches, return `"Deny"`. Use the `ipaddress` module for CIDR matching.',
      starter: `import ipaddress

def evaluate(rules, src, port):
    return "Allow"`,
      tests: `rules = [
    {"priority": 100, "source": "10.50.0.0/16", "port": 5432, "action": "Allow"},
    {"priority": 110, "source": "203.0.113.0/24", "port": 443, "action": "Allow"},
    {"priority": 200, "source": "*", "port": "*", "action": "Deny"},
]
assert evaluate(rules, "10.50.2.7", 5432) == "Allow"
assert evaluate(rules, "8.8.8.8", 5432) == "Deny"
assert evaluate(rules, "203.0.113.55", 443) == "Allow"
assert evaluate(rules, "203.0.113.55", 22) == "Deny"
rules2 = [{"priority": 50, "source": "10.50.9.0/24", "port": "*", "action": "Deny"}] + rules
assert evaluate(rules2, "10.50.9.4", 5432) == "Deny"
assert evaluate(rules2, "10.50.2.7", 5432) == "Allow"
assert evaluate(list(reversed(rules2)), "10.50.9.4", 5432) == "Deny"
assert evaluate([], "10.0.0.1", 80) == "Deny"`,
      solution: `import ipaddress

def evaluate(rules, src, port):
    addr = ipaddress.ip_address(src)
    for r in sorted(rules, key=lambda r: r["priority"]):
        src_ok = r["source"] == "*" or addr in ipaddress.ip_network(r["source"])
        port_ok = r["port"] == "*" or r["port"] == port
        if src_ok and port_ok:
            return r["action"]
    return "Deny"`,
      hint: 'Sort by priority, test source and port separately, return the action of the first rule where both match, and fall back to "Deny".',
    } },
    { local: '**Check what your own PC exposes (PowerShell, run as normal user).**\n```powershell\nGet-NetFirewallProfile | Select-Object Name, Enabled, DefaultInboundAction   # Windows Defender Firewall status\nGet-NetTCPConnection -State Listen | Where-Object { $_.LocalAddress -eq "0.0.0.0" } | Select-Object LocalPort, OwningProcess | Sort-Object LocalPort\nGet-Process -Id (Get-NetTCPConnection -LocalPort 5432 -State Listen).OwningProcess   # who owns PostgreSQL\'s port?\n```\nExpected: three profiles (Domain, Private, Public) with `DefaultInboundAction : Block`. The second command lists ports reachable from the network. If PostgreSQL shows `0.0.0.0:5432`, your local database accepts connections from other machines on your network; that is fine at home behind a router, but not on public Wi-Fi.' },
    { warn: 'Rule order bites. Putting a broad **Allow** at a lower number than a narrow **Deny** makes the Deny useless. Review rules from the lowest priority number up, remove rules you cannot explain, and treat any rule with source `*` (any) on a port other than 80/443 as a finding to fix.' },
    { interview: '**"How would you secure a database in the cloud?"** Model answer: "No public address. It sits in a private data subnet; the NSG allows only the app subnet on the database port, default deny otherwise. Platform databases are reached through a private endpoint with public network access disabled, and the private DNS zone is linked to the VNet. Admins connect through a bastion or VPN with just-in-time access. Credentials come from a managed identity or Key Vault, traffic uses TLS, and every access is logged and alerted." Notice that the answer climbs through network, identity, encryption and monitoring: defence in depth.' },
    { real: 'On your first cloud project someone will say "just open the storage account to everyone so Power Automate can write to it". Now you can answer: let the flow call an Azure Function using a managed identity, keep the storage on a private endpoint, and tell them why an open container is the headline in the next breach report.' },
    `## Recap
- Make **deny the default** and open only named paths. A **firewall/NSG rule** has source, destination, port, protocol, action and **priority (lower number first, first match wins)**; rules are **stateful**.
- **Segment** into web, app and data subnets; each layer accepts traffic only from the layer in front of it.
- Reach platform services with **private endpoints** (plus private DNS) and disable public access; service endpoints are a middle option.
- Administer through a **VPN, bastion or just-in-time access**, never by exposing RDP/SSH to the internet.
- **Zero trust** = verify every request by identity, give least privilege, assume breach. It leads straight to authentication and authorisation.`,
  ],
  quiz: [
    { q: 'Two NSG rules both match a packet: priority 100 Deny and priority 200 Allow. What happens?', o: ['Allow wins because it is later', 'Both are applied', 'Deny wins because the lower number is checked first', 'The packet is logged but passes'], a: 2, why: 'Rules are evaluated in ascending priority and the first match decides.' },
    { q: 'What makes a private endpoint stronger than a service endpoint?', o: ['It is cheaper', 'The service gets a private IP in your subnet and public access can be switched off', 'It uses UDP', 'It removes the need for authentication'], a: 1, why: 'With a private endpoint the service is not reachable from the internet at all, if you disable public network access.' },
    { q: 'Which design best protects a database?', o: ['Private data subnet, NSG allowing only the app subnet on 5432, default deny', 'Public IP with a strong password', 'A public IP with no firewall but TLS', 'Putting it in the web subnet'], a: 0, why: 'Network isolation plus least-privilege rules limits who can even attempt a connection.' },
    { q: 'Why should you avoid opening RDP (3389) or SSH (22) to the internet?', o: ['They are slow', 'They do not support TLS', 'Cloud providers forbid them', 'Scanners attack them within minutes; use a VPN, bastion or just-in-time access instead'], a: 3, why: 'Exposed admin ports are among the most attacked services on the internet.' },
    { q: 'Zero trust means…', o: ['Nobody can log in', 'Trust is not granted because of network location; each request is verified and given least privilege', 'Firewalls are no longer needed', 'All traffic is public'], a: 1, why: 'It replaces "inside the network = trusted" with continuous verification and a limited blast radius.' },
    { q: 'Your corporate network (10.0.0.0/16) must join an Azure VNet by site-to-site VPN. What must be true?', o: ['They use the same address range', 'Both use IPv6 only', 'Their address ranges do not overlap', 'Both have public IPs on every host'], a: 2, why: 'Overlapping ranges make routing ambiguous, which is why you plan CIDRs up front.' },
  ],
  task: {
    title: 'Design the rules for the payroll API network',
    steps: [
      'Use the 10.50.0.0/16 plan from the IP lesson. Write the NSG rules (priority, source, port, action) for the web, app and data subnets so only the path internet → gateway → web → app → data works.',
      'Paste your rules into the Python playground as `RULES` for the data subnet and test five packets: the app subnet on 5432, the web subnet on 5432, the internet on 5432, your office on 22, and the app subnet on 22. Check each result is what you intended.',
      'Write three sentences explaining why the database has no public IP and how an administrator would reach it.',
    ],
    deliverable: 'A table of NSG rules for each subnet and the output of your five test packets.',
  },
};
