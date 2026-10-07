export default {
  id: 'foundations-dns',
  title: 'DNS: how names become addresses',
  goal: 'You can trace a DNS lookup from your browser to the authoritative server, read A, CNAME, MX and TXT records, explain TTL and caching, and diagnose a name that points to the wrong place.',
  roadmap: ['DNS records and resolution', 'TTL and caching', 'Private DNS'],
  blocks: [
    `## The problem
You deploy your API. It works at \`198.51.100.20\`. But nobody types numbers: they type \`api.kollana-tech.in\`. You change the server, update the name, and half your users still hit the old machine for another hour.

That is **DNS**, the *Domain Name System*. It is the phone book of the internet: it turns a name into an IP address. It is also the cause of so many outages that engineers joke "it's always DNS". By the end of this lesson you will know why.

## Records: what a DNS zone contains
A **zone** is the set of records for a domain, kept on its **authoritative name servers**. Each record has a **name**, a **type**, a **value** and a **TTL** (time to live, in seconds).

| Type | Meaning | Example |
|---|---|---|
| **A** | Name → IPv4 address | \`kollana-tech.in. A 203.0.113.10\` |
| **AAAA** | Name → IPv6 address | \`kollana-tech.in. AAAA 2001:db8::10\` |
| **CNAME** | Name is an *alias* of another name | \`www CNAME kollana-tech.in\` |
| **MX** | Where to deliver email for the domain | \`10 mail.kollana-tech.in\` (lower number = tried first) |
| **TXT** | Free text, used for email policy and for proving you own a domain | \`"v=spf1 include:spf.protection.outlook.com -all"\` |
| **NS** | Which servers are authoritative for the zone | \`ns1.dns-host.example\` |
| **PTR** | Reverse: address → name | used by mail servers and logs |

Two rules that surprise people: a **CNAME cannot sit at the root of a domain** (\`kollana-tech.in\` itself) because a CNAME may not coexist with other records, and the root always has NS and SOA records. Cloud DNS services offer "alias" records to get around this. And a name with a CNAME must not have any other record type.

When you add a custom domain to an Azure web app or a Microsoft 365 tenant, the portal asks you to add a **TXT** or **CNAME** record. That is the platform checking you really control the domain.`,
    { sketch: { w: 760, h: 300, caption: 'A lookup that nothing has cached: the resolver walks down from the root', items: [
      { t: 'box', x: 12, y: 100, w: 112, h: 62, label: 'your\nlaptop', fill: 'yellow' },
      { t: 'box', x: 196, y: 100, w: 134, h: 62, label: 'recursive\nresolver', sub: 'ISP or 8.8.8.8', fill: 'blue' },
      { t: 'box', x: 470, y: 14, w: 180, h: 54, label: 'root server  (.)', fill: 'grey', size: 16 },
      { t: 'box', x: 470, y: 100, w: 180, h: 54, label: '.in TLD server', fill: 'grey', size: 16 },
      { t: 'box', x: 470, y: 188, w: 180, h: 62, label: 'authoritative', sub: 'ns1.dns-host', fill: 'green', size: 16 },
      { t: 'arrow', x1: 124, y1: 120, x2: 196, y2: 120, label: '1 ask', ly: -10 },
      { t: 'arrow', x1: 196, y1: 148, x2: 124, y2: 148, label: '6 answer', ly: 16 },
      { t: 'arrow', x1: 330, y1: 108, x2: 470, y2: 42, label: '2 ask: where is .in?', ly: -6 },
      { t: 'arrow', x1: 330, y1: 128, x2: 470, y2: 128, label: '3 ask: who runs the zone?', ly: -8 },
      { t: 'arrow', x1: 330, y1: 150, x2: 470, y2: 214, label: '4 ask: app.kollana-tech.in?', ly: 18 },
      { t: 'note', x: 666, y: 188, w: 90, h: 62, text: '5 A record\nTTL 300 s', fill: 'yellow' },
      { t: 'text', x: 380, y: 280, text: 'the resolver remembers every answer until its TTL runs out', size: 15, color: '#5c6478' },
    ] } },
    `## Resolution, step by step
Your laptop asks a **recursive resolver** (run by your ISP, your company, or a public one such as 8.8.8.8) "what is \`app.kollana-tech.in\`?" The resolver does the legwork:
1. It asks a **root server**: "who handles \`.in\`?" The root points to the \`.in\` servers.
2. It asks the **\`.in\` (TLD) servers**: "who handles \`kollana-tech.in\`?" They point to the zone's authoritative servers.
3. It asks the **authoritative server**: "what is \`app.kollana-tech.in\`?" That server finally gives the answer, such as a CNAME to \`kollana-app.azurewebsites.net\`, and the resolver repeats the process for that name (another zone, another authoritative server).
4. It returns the final IP to your laptop and remembers every answer.

## TTL and caching
Every answer carries a **TTL**. Each layer (your browser, your operating system, the resolver) keeps the answer until the TTL runs out and does not ask again. This is why DNS is fast: most lookups never leave your machine.

It is also why changes are slow. If a record has TTL 3600 and you change it now, some users will keep the old address for up to an hour. Professionals therefore **lower the TTL a day before a migration**, make the change, then raise it again.

Use the simulator below. Resolve \`app.kollana-tech.in\` and read each hop. Resolve again and watch the cache answer in 0 ms. Move the site, resolve straight away, and see the **stale** answer. Then wait 60 seconds and resolve again.`,
    { widget: 'DnsResolver' },
    `## The same idea in code
Here is a tiny resolver with a cache and a clock you control. It makes the "stale for a while" behaviour impossible to miss.`,
    { py: {
      title: 'A cache that serves a stale answer until the TTL expires',
      starter: `class Resolver:
    def __init__(self, zone):
        self.zone = zone          # name -> (ip, ttl_seconds)
        self.cache = {}           # name -> (ip, expires_at)
        self.upstream_lookups = 0

    def resolve(self, name, now):
        hit = self.cache.get(name)
        if hit and hit[1] > now:
            return hit[0], "from cache"
        ip, ttl = self.zone[name]
        self.upstream_lookups += 1
        self.cache[name] = (ip, now + ttl)
        return ip, "asked authoritative server"

zone = {"app.kollana-tech.in": ("198.51.100.20", 60)}
r = Resolver(zone)

print("t=0  ", r.resolve("app.kollana-tech.in", 0))
print("t=30 ", r.resolve("app.kollana-tech.in", 30))
zone["app.kollana-tech.in"] = ("198.51.100.99", 60)      # the owner moves the site at t=40
print("t=45 ", r.resolve("app.kollana-tech.in", 45), " <- STALE: the cache does not know yet")
print("t=61 ", r.resolve("app.kollana-tech.in", 61))
print("authoritative lookups:", r.upstream_lookups)`,
      note: 'Lower the TTL to 10 and run again: fewer stale seconds, but more upstream lookups. That is the trade-off every DNS owner makes.',
    } },
    { pychallenge: {
      id: 'foundations-pych-cname-chain',
      prompt: 'Write `follow_cname(zone, name, max_hops=8)`. `zone` maps a name to either `("A", ip)` or `("CNAME", other_name)`. Follow CNAMEs until you reach an `A` record and **return the IP**. Return `None` if a name is not in the zone. Raise `ValueError` if you detect a **loop** (a name you have already visited) or exceed `max_hops`.',
      starter: `def follow_cname(zone, name, max_hops=8):
    return None`,
      tests: `zone = {
    "www.kollana-tech.in": ("CNAME", "kollana-tech.in"),
    "kollana-tech.in": ("A", "203.0.113.10"),
    "app.kollana-tech.in": ("CNAME", "kollana-app.azurewebsites.net"),
    "kollana-app.azurewebsites.net": ("A", "198.51.100.20"),
    "a.x": ("CNAME", "b.x"),
    "b.x": ("CNAME", "a.x"),
}
assert follow_cname(zone, "www.kollana-tech.in") == "203.0.113.10"
assert follow_cname(zone, "app.kollana-tech.in") == "198.51.100.20"
assert follow_cname(zone, "kollana-tech.in") == "203.0.113.10"
assert follow_cname(zone, "ghost.kollana-tech.in") is None
try:
    follow_cname(zone, "a.x")
    raise AssertionError("a CNAME loop should raise ValueError")
except ValueError:
    pass`,
      solution: `def follow_cname(zone, name, max_hops=8):
    seen = set()
    for _ in range(max_hops):
        if name in seen:
            raise ValueError("CNAME loop at " + name)
        seen.add(name)
        record = zone.get(name)
        if record is None:
            return None
        kind, value = record
        if kind == "A":
            return value
        name = value
    raise ValueError("too many CNAME hops")`,
      hint: 'Keep a set of names you have visited. Each time round the loop, either return an IP, return None, or move to the next name.',
    } },
    { local: '**Look at DNS from your own laptop (PowerShell).**\n```powershell\nResolve-DnsName example.com -Type A            # the A record(s) and their TTL\nResolve-DnsName example.com -Type MX\nnslookup -type=TXT example.com                 # older tool, still everywhere\nipconfig /displaydns | Select-String "Record Name" | Select-Object -First 5   # your OS cache\nipconfig /flushdns                             # clear the OS cache after a DNS change\ntype C:\\Windows\\System32\\drivers\\etc\\hosts      # a local override file that wins over DNS\n```\nExpected: `Resolve-DnsName` prints a table with `Name`, `Type`, `TTL` and `IPAddress`. The **TTL counts down** if you run it twice, which is the cache at work. If a name works in one place but not another, compare their results and check the `hosts` file.' },
    `## Private DNS
Inside a company or a cloud network you often want names that **only resolve internally**: \`db.internal.kollana-tech.in\` pointing to a private IP such as \`10.50.3.4\`. A **private DNS zone** does that. In Azure, when you give a storage account a *private endpoint*, you also link a private zone such as \`privatelink.blob.core.windows.net\`, so that the same public name \`kollanastore.blob.core.windows.net\` resolves to a **private IP from inside your network** and to the public IP from outside. When "private endpoint works for the VM but not for my laptop", the answer is almost always DNS.

The same name giving different answers to different askers is called **split-horizon DNS**. It is useful and a rich source of confusion; always test with the resolver that the failing machine actually uses.`,
    { warn: 'DNS outages are rarely "DNS is down". They are **a record that is wrong, expired, missing, or cached for too long**, or **two systems using different resolvers**. When something cannot connect, run \`Resolve-DnsName\` for the name *before* you blame the firewall, the app or the cloud.' },
    { interview: '**"What happens when you type a URL and press Enter?"** DNS is the first step of the answer. Say: "The browser checks its cache, then the OS, then asks the recursive resolver. The resolver walks root, TLD and authoritative servers, following CNAMEs, caches every answer for its TTL, and returns an IP. Only then does the browser open a TCP connection, do the TLS handshake and send the HTTP request." Mentioning TTL and caching unprompted shows depth.' },
    { real: 'You will attach a custom domain to a Power Apps portal, an Azure Function or a Container App. Each time you will add a CNAME or TXT record and wait. If it does not verify, you now know to check three things: the exact record type, the record name (including trailing dots and the `www` label), and the TTL of any older record that is still cached.' },
    `## Recap
- DNS maps **names to addresses**. A **zone** holds records (A, AAAA, CNAME, MX, TXT, NS) on **authoritative servers**.
- A **recursive resolver** walks root → TLD → authoritative, follows CNAMEs and caches answers.
- **TTL** controls how long each cache keeps an answer. Changes take up to one TTL to spread; lower it before migrations.
- A CNAME cannot sit at the zone root, and a CNAME name cannot have other records.
- **Private DNS** makes names resolve to private IPs inside a network; most private-endpoint problems are DNS.`,
  ],
  quiz: [
    { q: 'Which record type tells the world where to deliver email for kollana-tech.in?', o: ['PTR', 'A', 'CNAME', 'MX'], a: 3, why: 'MX records list the mail servers, with a priority number.' },
    { q: 'You change an A record that had TTL 3600. What should you expect?', o: ['Everyone sees it instantly', 'Some users may keep the old address for up to an hour', 'The old address is deleted from the internet', 'Only your browser is affected'], a: 1, why: 'Resolvers and operating systems keep the old answer until its TTL expires.' },
    { q: 'What is the usual first step to take before migrating a site to a new IP?', o: ['Disable DNS', 'Raise the TTL to a week', 'Lower the TTL a day ahead so the change spreads fast', 'Delete the old record first'], a: 2, why: 'A short TTL limits how long clients hold the old address after the switch.' },
    { q: 'Which statement about CNAME is true?', o: ['It makes a name an alias of another name', 'It can sit at the zone root along with an MX record', 'It stores email policy', 'It points a name to an IP address'], a: 0, why: 'A CNAME aliases one name to another. It cannot sit at the apex because the apex must have NS and SOA records.' },
    { q: 'A VM can reach a storage account through a private endpoint but your laptop cannot. The most likely cause?', o: ['The storage account is broken', 'The name resolves to a private IP only inside the network (private DNS)', 'Your laptop has no IP address', 'Blob storage does not support HTTPS'], a: 1, why: 'The private DNS zone is linked to the VNet, so only machines using that DNS see the private address.' },
    { q: 'Which command shows the A record and TTL for a name in PowerShell?', o: ['Test-Path example.com', 'ipconfig /all', 'Resolve-DnsName example.com -Type A', 'Get-Process'], a: 2, why: 'Resolve-DnsName performs a lookup and prints type, TTL and value.' },
  ],
  task: {
    title: 'Trace three real lookups',
    steps: [
      'Run `Resolve-DnsName` for the A, MX and TXT records of a domain you own or a public one like `example.com`. Copy the output and underline each TTL.',
      'Run the same A lookup twice, a few seconds apart, and note how the TTL changes. Explain why in one sentence.',
      'Run `ipconfig /flushdns`, then the lookup again. What changed?',
      'In the simulator, resolve `app.kollana-tech.in`, move the site, resolve again, wait 60 s, resolve again. Write down the three IPs you saw and why.',
    ],
    deliverable: 'A short note with your three lookup outputs and one paragraph on how you would plan a zero-surprise DNS migration (TTL change, switch, verify, raise TTL).',
  },
};
