export default {
  id: 'foundations-ip-ports-nat',
  title: 'IP addresses, subnets, ports and NAT',
  goal: 'You can read an address like 10.20.5.0/24, work out how many hosts fit, explain what a port and a socket are, and say why your laptop cannot be reached from the internet.',
  roadmap: ['IP addresses (IPv4/IPv6), private ranges', 'CIDR and subnets', 'Ports and sockets', 'NAT'],
  blocks: [
    `## The problem
Your Python script runs fine on your laptop. You move it to a cloud virtual machine and it cannot reach the database: *"connection timed out"*. Your colleague says "check the subnet and the port".

Every network problem you will debug in this course (a function that cannot see storage, a container that cannot reach Postgres, a Power Automate flow that cannot call your API) comes down to four things: **which address, which port, which network, and who is allowed through**. This lesson gives you the first three.

## IP addresses
An **IP address** is the number that identifies a device on a network, like a postal address for a computer.
- **IPv4** has four numbers from 0 to 255, such as \`203.0.113.7\`. That is 32 bits, about 4.3 billion addresses. They ran short.
- **IPv6** has 128 bits and is written in hexadecimal, such as \`2001:db8::1\`. It has far more addresses. You will meet it, but most company networks you work in still run mostly on IPv4.

Some ranges are **private**: they work only inside a network and are never routed on the public internet. Memorise these three:

| Private range | Typical use |
|---|---|
| \`10.0.0.0/8\` | Large company and cloud networks |
| \`172.16.0.0/12\` | Medium networks, Docker's default bridge |
| \`192.168.0.0/16\` | Home and office Wi-Fi |

Other special ones: \`127.0.0.1\` is **loopback** ("this computer", also called *localhost*); \`169.254.x.x\` means "I asked for an address and nobody answered"; \`0.0.0.0\` means "all addresses on this machine".

## CIDR: the slash notation
A network is written as an address plus a **prefix length**: \`10.20.5.0/24\`. The number after the slash says how many of the 32 bits are fixed (the *network part*). The rest are free for hosts.
- \`/24\` fixes 24 bits, leaving 8 → 2⁸ = **256** addresses.
- \`/16\` leaves 16 bits → 65,536 addresses.
- \`/28\` leaves 4 bits → 16 addresses.

A **subnet** is a smaller network cut from a bigger one. A \`10.20.0.0/16\` network can be split into 256 subnets of \`/24\`. Cloud networks (Azure VNets, AWS VPCs) work exactly like this: you pick one big range, then carve subnets for web servers, app servers and databases. In Azure, **5 addresses in every subnet are reserved** for the platform, so a /24 gives you 251 usable addresses, not 256.`,
    { sketch: { w: 760, h: 330, caption: 'NAT: many private devices share one public address. Outsiders cannot start a connection inwards.', items: [
      { t: 'box', x: 14, y: 40, w: 132, h: 50, label: 'laptop', sub: '192.168.1.6', fill: 'yellow' },
      { t: 'box', x: 14, y: 110, w: 132, h: 50, label: 'phone', sub: '192.168.1.9', fill: 'yellow' },
      { t: 'text', x: 80, y: 190, text: 'private network\n192.168.1.0/24', size: 14, color: '#5c6478' },
      { t: 'box', x: 226, y: 52, w: 160, h: 96, label: 'router + NAT', sub: 'inside 192.168.1.1', fill: 'orange' },
      { t: 'text', x: 306, y: 168, text: 'public 203.0.113.7', size: 14, color: '#c2410c' },
      { t: 'cloud', x: 450, y: 52, w: 130, h: 80, label: 'internet' },
      { t: 'box', x: 614, y: 52, w: 134, h: 80, label: 'web server', sub: '198.51.100.20:443', fill: 'green' },
      { t: 'arrow', x1: 146, y1: 65, x2: 226, y2: 85, label: 'from :50712', ly: -12 },
      { t: 'arrow', x1: 146, y1: 135, x2: 226, y2: 118 },
      { t: 'arrow', x1: 386, y1: 100, x2: 450, y2: 92, label: 'from :61000', ly: -14 },
      { t: 'arrow', x1: 580, y1: 92, x2: 614, y2: 92 },
      { t: 'table', x: 226, y: 226, title: 'NAT table inside the router', cols: ['inside (private)', 'outside (public)'], colW: [190, 190], rows: [['192.168.1.6:50712', '203.0.113.7:61000'], ['192.168.1.9:40100', '203.0.113.7:61001']], fill: 'orange' },
      { t: 'note', x: 640, y: 190, w: 112, h: 110, text: 'no row in the\ntable = no way\nin from outside', fill: 'pink' },
    ] } },
    `## Ports and sockets
An IP address finds the machine. A **port** (a number from 0 to 65535) finds the **program** on that machine. One server can run a web server, a database and an SSH daemon at once; the port says which one you want.

A **socket** is the pair *address:port*, such as \`198.51.100.20:443\`. A connection is two sockets talking: your side \`192.168.1.6:50712\` and the server side \`198.51.100.20:443\`. Your side's port is a random high number the operating system picks for the duration of the conversation.

Ports you will see every week:

| Port | Service | | Port | Service |
|---|---|---|---|---|
| 22 | SSH | | 5432 | PostgreSQL |
| 80 | HTTP | | 1433 | SQL Server |
| 443 | HTTPS | | 6379 | Redis |
| 3389 | Remote Desktop | | 9092 | Kafka |
| 8000 | FastAPI / Python dev servers | | 5173 | Vite dev server (this app) |

**One bind rule saves hours.** A program *listens* on an address. If it listens on \`127.0.0.1\` it accepts connections only from the same machine. If it listens on \`0.0.0.0\` it accepts them from the network. A web API inside a Docker container **must** listen on \`0.0.0.0\`, otherwise "localhost" inside the container is the container itself and nothing outside can reach it.

## NAT: why your laptop is invisible
Your laptop has a private address, \`192.168.1.6\`. The internet cannot route private addresses. So your router performs **NAT** (*Network Address Translation*): when your laptop opens a connection, the router rewrites the source address to its own **public** address and a spare port, and remembers the pairing in a table. When the reply comes back, it looks up the table and forwards it inside.

Two consequences matter for your work:
1. **Outbound is easy, inbound is blocked by default.** There is no table row for a connection nobody inside started. That is a built-in basic firewall. To let the world reach a server, you give it a public IP or set up **port forwarding**.
2. **Many devices share one public address**, so a website sees only the router's address. Cloud has the same idea: a **NAT gateway** lets private servers reach the internet (to download packages) without being reachable from it.`,
    { py: {
      title: 'Explore CIDR with Python',
      starter: `import ipaddress as ip

net = ip.ip_network("10.20.0.0/16")
print(net, "has", net.num_addresses, "addresses")

# Carve three /24 subnets out of it
for sub in list(net.subnets(new_prefix=24))[:3]:
    print("  subnet", sub, "->", sub.num_addresses, "addresses")

host = ip.ip_address("10.20.5.77")
print("77 is inside the /16:", host in net)
print("77 is inside 10.20.5.0/24:", host in ip.ip_network("10.20.5.0/24"))
print("is_private:", host.is_private, "| 8.8.8.8 private?", ip.ip_address("8.8.8.8").is_private)
print("loopback:", ip.ip_address("127.0.0.1").is_loopback)

# Two networks that overlap cannot be joined by peering or a VPN
a = ip.ip_network("10.20.0.0/16")
b = ip.ip_network("10.20.8.0/24")
print("overlap:", a.overlaps(b))`,
      note: 'Try \`ip.ip_network("192.168.1.0/28").num_addresses\`, and change \`new_prefix\` to 20 to see how many subnets you get.',
    } },
    { pychallenge: {
      id: 'foundations-pych-azure-usable',
      prompt: 'Write `azure_usable(cidr)` that returns how many addresses you can actually assign in an **Azure subnet** with that CIDR. Azure reserves **5** addresses in every subnet. For example `"10.0.1.0/24"` has 256 addresses, so 251 are usable.',
      starter: `import ipaddress

def azure_usable(cidr):
    return 0`,
      tests: `assert azure_usable("10.0.1.0/24") == 251
assert azure_usable("10.0.0.0/16") == 65531
assert azure_usable("10.0.2.0/28") == 11
assert azure_usable("192.168.5.0/29") == 3`,
      solution: `import ipaddress

def azure_usable(cidr):
    return ipaddress.ip_network(cidr).num_addresses - 5`,
      hint: 'ipaddress.ip_network(cidr).num_addresses gives the total. Subtract the reserved ones.',
    } },
    { local: '**See your own network (PowerShell).**\n```powershell\nipconfig                                   # your private IPv4 address, subnet mask and gateway\nGet-NetTCPConnection -State Listen | Select-Object LocalAddress,LocalPort,OwningProcess | Sort-Object LocalPort | Select-Object -First 15\nTest-NetConnection localhost -Port 5432      # is PostgreSQL listening on this machine?\n```\nWith PostgreSQL installed you should see `TcpTestSucceeded : True`. If you see `False`, the service is not running, or it listens on a different port. Notice `LocalAddress` values: `127.0.0.1` (this machine only) versus `0.0.0.0` (everyone).' },
    { warn: 'Plan address ranges **before** you build. If your office network and your cloud network both use `10.0.0.0/16`, you cannot connect them with a VPN or peering because the same addresses would exist on both sides. Choose non-overlapping ranges for every network you may ever join, and write them down in one place.' },
    { interview: '**"How many hosts fit in a /22, and what does the slash mean?"** Model answer: "The slash is the number of fixed network bits. A /22 leaves 32 − 22 = 10 bits for hosts, so 2¹⁰ = 1,024 addresses, minus a few reserved ones that depend on the platform. In Azure, minus five." Then add: "I avoid overlapping ranges so networks can be peered later." Interviewers love that last line.' },
    { real: 'The next time a script works on your laptop but not on a server, ask four questions in order: *Is the name resolving to the right address? Is the port open and the program listening on it? Is there a route between the two subnets? Is something (a firewall rule) blocking it?* You will use this checklist in the Azure phases.' },
    `## Recap
- An **IP address** identifies a device; **private ranges** (10/8, 172.16/12, 192.168/16) are not routable on the internet; \`127.0.0.1\` is "this machine".
- **CIDR** \`/N\` fixes N bits; hosts = 2^(32−N). A **subnet** is a smaller slice of a bigger network. Azure reserves 5 addresses per subnet.
- A **port** finds the program; a **socket** is address + port. Listen on \`0.0.0.0\` inside containers.
- **NAT** lets many private devices share one public address and blocks unsolicited inbound traffic by default.
- Never reuse overlapping ranges across networks you might connect.`,
  ],
  quiz: [
    { q: 'How many addresses are in 10.20.5.0/24?', o: ['24', '128', '256', '1,024'], a: 2, why: '32 − 24 = 8 host bits, and 2⁸ = 256.' },
    { q: 'Which of these is a private address?', o: ['8.8.8.8', '203.0.113.7', '192.168.1.6', '198.51.100.20'], a: 2, why: '192.168.0.0/16 is private. The others are public (or documentation) addresses.' },
    { q: 'A FastAPI app inside a Docker container listens on 127.0.0.1:8000. From your browser on the host, http://localhost:8000 fails. Why?', o: ['Port 8000 is reserved', 'Inside the container 127.0.0.1 means the container itself; it should listen on 0.0.0.0', 'Docker blocks all ports', 'FastAPI needs port 80'], a: 1, why: 'Loopback inside the container is not reachable from outside. Bind to 0.0.0.0 and publish the port.' },
    { q: 'Why can a stranger on the internet not connect directly to 192.168.1.6?', o: ['It is a private address and NAT has no table entry for connections started from outside', 'Laptops cannot accept connections', 'IPv4 does not support inbound traffic', 'The ISP encrypts it'], a: 0, why: 'Private addresses are not routed on the internet, and the router only forwards replies to connections started from inside.' },
    { q: 'In Azure, how many usable addresses does a /28 subnet give?', o: ['16', '14', '11', '5'], a: 2, why: 'A /28 has 16 addresses; Azure reserves 5, leaving 11.' },
    { q: 'Two networks both use 10.0.0.0/16. What is the problem?', o: ['None, they are private', 'They overlap, so you cannot peer or VPN them together', 'They are IPv6', 'Ports clash'], a: 1, why: 'Routing needs unique addresses. Overlapping ranges make it impossible to tell which network a packet belongs to.' },
  ],
  task: {
    title: 'Map your network and plan a VNet',
    steps: [
      'Run `ipconfig` and write down your private IPv4 address, subnet mask (convert it to a /N) and default gateway.',
      'Run the PowerShell commands in the callout. Identify two programs listening on your machine and say whether each is reachable only locally or from the network.',
      'On paper, plan an Azure address space `10.50.0.0/16` for Kollana Tech with three subnets: web, app and data. Give each a CIDR that does not overlap, and write how many usable Azure addresses each has.',
    ],
    deliverable: 'A one-page table: network, CIDR, number of usable addresses, purpose; plus a list of two listening ports on your laptop with their bind address.',
  },
};
