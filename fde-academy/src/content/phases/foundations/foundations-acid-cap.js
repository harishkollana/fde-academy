// A small bank for the SQL playgrounds. The CHECK rule is what makes the "consistency" demo possible.
const ACCOUNTS_SETUP = `CREATE TABLE accounts (
  id      int PRIMARY KEY,
  owner   text NOT NULL,
  balance numeric(12,2) NOT NULL CHECK (balance >= 0)
);
INSERT INTO accounts VALUES
  (1, 'Kollana Tech (IN01)', 50000),
  (2, 'Ravi Traders (supplier)', 10000);
CREATE TABLE attempt_log (
  id   serial PRIMARY KEY,
  note text NOT NULL
);`;

export default {
  id: 'foundations-acid-cap',
  title: 'ACID, CAP and consistency',
  goal: 'You can explain the four ACID promises with a ₹ transfer, name the three read problems that isolation prevents, explain CAP and PACELC with two replicas and a broken network link, and decide when a stale read is acceptable and when it is not.',
  roadmap: ['ACID transactions', 'Isolation levels in one page', 'CAP theorem and PACELC', 'Strong vs eventual consistency'],
  blocks: [
    `## The problem
It is month-end. Your finance system must move ₹20,000 from Kollana Tech's bank account to a supplier's account. In the database that is two steps: subtract ₹20,000 from one row, then add it to another.

The server crashes between the two steps. The debit happened and the credit did not. ₹20,000 has vanished, and the books do not balance, though nobody typed a wrong number.

A second problem looks different. The payment is done, but your colleague's dashboard still shows the old balance. The data is right on one machine and out of date on another.

The first problem is solved by **transactions** and the four **ACID** promises. The second appears as soon as data is **copied to more than one machine**. It is explained by **replication lag** and the **CAP** theorem. Every database makes choices on these two topics, so you need the vocabulary.

## Transactions and ACID
A **transaction** is a group of changes that the database treats as one unit. You open it with \`BEGIN\`, make your changes, and end it with \`COMMIT\` (keep everything) or \`ROLLBACK\` (throw everything away). **ACID** is what a good transaction system promises:

| Letter | Promise | In the ₹20,000 transfer |
|---|---|---|
| **A**tomicity | All the steps happen, or none of them do | A crash after the debit undoes the debit |
| **C**onsistency | Data moves from one *valid* state to another; your declared rules are enforced | A \`CHECK (balance >= 0)\` rule refuses a transfer that would overdraw the account |
| **I**solation | Transactions running at the same time do not see each other's half-finished work | A report never sees the debit without the credit |
| **D**urability | After \`COMMIT\` returns, the change survives a crash or power cut | The database wrote the change to a log on disk first (the *write-ahead log*) |

The database enforces only the rules **you wrote down** as constraints (\`NOT NULL\`, \`CHECK\`, \`UNIQUE\`, \`FOREIGN KEY\`). It cannot guess that a supplier payment needs an approved invoice.`,
    { sketch: { w: 760, h: 346, caption: 'The same transfer twice. Amounts are in ₹. Atomicity means the crash lane ends with nothing changed.', items: [
      { t: 'text', x: 12, y: 22, text: 'Success: both steps, then COMMIT', anchor: 'start', bold: true, size: 17, color: '#2f9e44' },
      { t: 'box', x: 12, y: 36, w: 128, h: 60, label: 'BEGIN', fill: 'yellow' },
      { t: 'box', x: 160, y: 36, w: 128, h: 60, label: 'debit', sub: 'Kollana -20,000', fill: 'yellow' },
      { t: 'box', x: 308, y: 36, w: 128, h: 60, label: 'credit', sub: 'Ravi +20,000', fill: 'yellow' },
      { t: 'box', x: 456, y: 36, w: 128, h: 60, label: 'COMMIT', sub: 'saved for good', fill: 'green' },
      { t: 'arrow', x1: 140, y1: 66, x2: 160, y2: 66 },
      { t: 'arrow', x1: 288, y1: 66, x2: 308, y2: 66 },
      { t: 'arrow', x1: 436, y1: 66, x2: 456, y2: 66 },
      { t: 'arrow', x1: 584, y1: 66, x2: 600, y2: 66 },
      { t: 'table', x: 600, y: 52, title: 'after COMMIT', cols: ['account', 'balance'], colW: [80, 70], rows: [['Kollana', '30,000'], ['Ravi', '30,000']], fill: 'green' },
      { t: 'text', x: 12, y: 190, text: 'Failure: the server crashes after the first step', anchor: 'start', bold: true, size: 17, color: '#e03131' },
      { t: 'box', x: 12, y: 204, w: 128, h: 60, label: 'BEGIN', fill: 'yellow' },
      { t: 'box', x: 160, y: 204, w: 128, h: 60, label: 'debit', sub: 'Kollana -20,000', fill: 'yellow' },
      { t: 'box', x: 308, y: 204, w: 128, h: 60, label: 'CRASH', sub: 'power cut', fill: 'red' },
      { t: 'box', x: 456, y: 204, w: 128, h: 60, label: 'ROLLBACK', sub: 'automatic', fill: 'orange' },
      { t: 'arrow', x1: 140, y1: 234, x2: 160, y2: 234 },
      { t: 'arrow', x1: 288, y1: 234, x2: 308, y2: 234 },
      { t: 'arrow', x1: 436, y1: 234, x2: 456, y2: 234, dashed: true, label: 'restart', ly: -12 },
      { t: 'arrow', x1: 584, y1: 234, x2: 600, y2: 234 },
      { t: 'table', x: 600, y: 220, title: 'after recovery', cols: ['account', 'balance'], colW: [80, 70], rows: [['Kollana', '50,000'], ['Ravi', '10,000']], fill: 'blue' },
      { t: 'text', x: 372, y: 288, text: 'credit never runs', size: 13, color: '#e03131' },
      { t: 'text', x: 12, y: 330, text: 'The half-done debit is undone, so money is never lost or created.', anchor: 'start', size: 15, color: '#5c6478' },
    ] } },
    `## Isolation in one page
**Isolation** decides what one transaction may see of the others running at the same time. When it is weak, three things go wrong:

- **Dirty read.** You read a change that another transaction has *not committed yet*. Your report sees the ₹20,000 already gone. Then that transfer is rolled back. Your report showed a number that never officially existed.
- **Non-repeatable read.** You read the same row twice inside one transaction and get two values, because someone committed a change in between. Your report starts with ₹50,000 and moments later the same row says ₹30,000.
- **Phantom read.** You run the same query twice ("all payments above ₹1,00,000") and the second time extra rows appear or vanish, because someone inserted or deleted matching rows in between.

The SQL standard defines four **isolation levels**. Stronger levels prevent more problems and cost more waiting or retrying:

| Level | Dirty read | Non-repeatable read | Phantom read |
|---|---|---|---|
| Read Uncommitted | possible | possible | possible |
| Read Committed | prevented | possible | possible |
| Repeatable Read | prevented | prevented | possible |
| Serializable | prevented | prevented | prevented |

PostgreSQL's default is **Read Committed**. (Its Read Uncommitted behaves like Read Committed, and its Repeatable Read also stops phantoms.) Other databases choose other defaults, so look it up. For a "read the balance, decide, then update" step, use a stronger level or lock the row with \`SELECT ... FOR UPDATE\`. The SQL phase goes deep on this. Remember three names and one idea: **isolation is a dial, not a switch**.

## Try it: commit, rollback and a rule that says no
Run the playground below and read its three result tables: *before*, *inside the transaction* and *after ROLLBACK*. After \`ROLLBACK\` it is as if the transfer never happened.`,
    { sql: {
      title: 'BEGIN, change, look, ROLLBACK',
      setup: ACCOUNTS_SETUP,
      starter: `SELECT 'before' AS step, id, owner, balance FROM accounts ORDER BY id;

BEGIN;
UPDATE accounts SET balance = balance - 20000 WHERE id = 1;   -- debit Kollana
UPDATE accounts SET balance = balance + 20000 WHERE id = 2;   -- credit the supplier
SELECT 'inside the transaction' AS step, id, owner, balance FROM accounts ORDER BY id;
ROLLBACK;                                                     -- change your mind: both updates vanish

SELECT 'after ROLLBACK' AS step, id, owner, balance FROM accounts ORDER BY id;`,
      note: 'Now change ROLLBACK to COMMIT and run once: the new balances stay (press "reset data" to start over). Careful: if a run stops with an error after BEGIN, the transaction stays open and the next run says "current transaction is aborted". Run ROLLBACK; or press "reset data".',
    } },
    `The table has the rule \`CHECK (balance >= 0)\`. That is **consistency** at work. Next we try to move ₹80,000 out of an account that holds ₹50,000: first credit the supplier (this works), then debit Kollana (this breaks the rule). The \`DO\` block catches the failure and logs it, so the run does not stop. Look at the final balances: **the supplier's credit was undone as well**. That is atomicity.`,
    { sql: {
      title: 'A CHECK failure undoes the whole block',
      setup: ACCOUNTS_SETUP,
      starter: `DO $$
BEGIN
  UPDATE accounts SET balance = balance + 80000 WHERE id = 2;   -- step 1 works
  UPDATE accounts SET balance = balance - 80000 WHERE id = 1;   -- step 2 breaks CHECK (balance >= 0)
EXCEPTION WHEN check_violation THEN
  -- everything done inside this block is rolled back before we get here
  INSERT INTO attempt_log (note) VALUES ('transfer of 80000 refused: ' || SQLERRM);
END $$;

SELECT note FROM attempt_log;
SELECT id, owner, balance FROM accounts ORDER BY id;`,
      note: 'To see the raw error instead, run only the second UPDATE on its own. The message names the rule: violates check constraint "accounts_balance_check".',
    } },
    { warn: 'A failed statement **poisons the open transaction**. After an error inside `BEGIN`, PostgreSQL answers every command with "current transaction is aborted, commands ignored until end of transaction block" until you run `ROLLBACK`. Application code must roll back (or use a savepoint) and then decide whether to retry. Also remember: the **C in ACID** (your rules hold) is a different idea from the **C in CAP** (all copies agree). The same letter, two meanings.' },
    `## Atomic in code: check first, change last
A database gives you atomicity through its log. In plain code you need one rule: **validate everything first, change state last**. The starter below debits before checking that the credit account exists, so a failure leaves a half-done transfer.`,
    { pychallenge: {
      id: 'foundations-pych-atomic-transfer',
      prompt: 'Write `transfer(accounts, src, dst, amount)` for an `accounts` dict of name to balance (whole rupees). Move `amount` from `src` to `dst`. Raise `ValueError` if either account is unknown, if `amount` is not positive, or if `src` has less than `amount`. The transfer must be **atomic**: when it raises, `accounts` must be exactly as it was before the call.',
      starter: `def transfer(accounts, src, dst, amount):
    # Dangerous: this changes the balance before checking anything.
    accounts[src] -= amount
    accounts[dst] += amount`,
      tests: `a = {"Kollana": 50000, "Ravi": 10000}
transfer(a, "Kollana", "Ravi", 20000)
assert a == {"Kollana": 30000, "Ravi": 30000}

def must_fail(accts, src, dst, amount):
    before = dict(accts)
    try:
        transfer(accts, src, dst, amount)
        raise AssertionError("expected ValueError")
    except ValueError:
        pass
    assert accts == before, "accounts changed even though the transfer failed"

b = {"Kollana": 50000, "Ravi": 10000}
must_fail(b, "Kollana", "Ghost", 5000)      # unknown destination: do NOT debit Kollana first
must_fail(b, "Ghost", "Ravi", 5000)         # unknown source
must_fail(b, "Kollana", "Ravi", 80000)      # insufficient funds
must_fail(b, "Kollana", "Ravi", 0)          # not a positive amount
must_fail(b, "Kollana", "Ravi", -100)
transfer(b, "Ravi", "Kollana", 10000)       # exactly all the money is allowed
assert b == {"Kollana": 60000, "Ravi": 0}`,
      solution: `def transfer(accounts, src, dst, amount):
    if src not in accounts or dst not in accounts:
        raise ValueError("unknown account")
    if amount <= 0:
        raise ValueError("amount must be positive")
    if accounts[src] < amount:
        raise ValueError("insufficient funds")
    accounts[src] -= amount
    accounts[dst] += amount`,
      hint: 'Do three checks at the top, each raising ValueError. Only after all of them pass, change the two balances.',
    } },
    `## Why data gets copied
One database server is a risk. If it dies you are down, and if everyone reads from it, it slows down. So teams keep **copies**. A **primary** (leader) accepts all the writes. **Replicas** (followers) receive the primary's changes as a stream, the *replication log*, and apply them. Reads and reports can use replicas, and a replica can take over if the primary dies.

There are two ways to ship the log:
- **Synchronous**: the primary waits for the replica to confirm before it says "committed". The copies agree, but every write is slower, and writes may stall if the replica is unreachable.
- **Asynchronous**: the primary says "committed" at once and ships the change afterwards. Writes are fast, but the replica runs a little **behind**, and changes not yet shipped can be lost if the primary dies.

The delay between a commit on the primary and its appearance on the replica is **replication lag**. Often it is milliseconds; under heavy load it can grow to seconds or minutes. A read from a lagging replica is **stale**: true a moment ago, false now.

Below, a replica has a 3-second lag and a ₹20,000 transfer commits at t = 10. Find the stale rows.`,
    { py: {
      title: 'A primary, a lagging replica and a stale read',
      starter: `class Primary:
    def __init__(self):
        self.data = {}
        self.log = []                       # the replication log: (commit_time, key, value)

    def write(self, key, value, now):
        self.data[key] = value
        self.log.append((now, key, value))

    def read(self, key, now):               # the latest value committed at or before 'now'
        value = None
        for t, k, v in self.log:
            if k == key and t <= now:
                value = v
        return value


class Replica:
    def __init__(self, primary, lag):
        self.primary = primary
        self.lag = lag                      # seconds between a commit and the replica applying it
        self.data = dict(primary.data)      # starts as a full copy
        self.applied = len(primary.log)     # how many log entries it has already applied

    def read(self, key, now):
        log = self.primary.log
        while self.applied < len(log) and log[self.applied][0] + self.lag <= now:
            _, k, v = log[self.applied]
            self.data[k] = v
            self.applied += 1
        return self.data.get(key)


primary = Primary()
primary.write("balance:kollana", 50000, now=0)
replica = Replica(primary, lag=3)                # try lag=0 and lag=10 afterwards
primary.write("balance:kollana", 30000, now=10)  # the Rs 20,000 transfer commits at t = 10

print(" t | primary | replica | verdict")
stale = 0
for t in range(9, 15):
    p = primary.read("balance:kollana", t)
    r = replica.read("balance:kollana", t)
    stale += p != r
    print(f"{t:2d} | {p:7d} | {r:7d} | {'STALE read' if p != r else 'in sync'}")
print("stale reads:", stale)

# Read-your-writes: right after YOU write, read from the primary for a little while.
def read_my_writes(key, now, my_last_write):
    if now - my_last_write <= replica.lag:
        return primary.read(key, now), "primary"
    return replica.read(key, now), "replica"

print()
for t in (10, 12, 14):
    print(f"t={t}: the user who just paid sees", read_my_writes("balance:kollana", t, 10))`,
      note: 'With lag=3 you should see 3 stale reads (t = 10, 11, 12). With lag=0 you see none, which is what synchronous replication buys, at the price of slower writes. With lag=10 five of the six rows are stale.',
    } },
    `## Strong and eventual consistency
These two words describe what a reader can expect from the copies:
- **Strong consistency**: once a write is confirmed, every later read from any copy returns it, as if there were one copy. Easy to reason about, but slower, and it may refuse to answer when the copies cannot talk.
- **Eventual consistency**: if writes stop, all copies will *eventually* agree. Meanwhile reads may be stale. Fast and always answering, but your code must cope with old values.
- In the middle: **read-your-writes** (you see your own change, as in the code above) and **bounded staleness** ("never more than 5 seconds old").

Choose by the cost of a wrong read:

| Situation | What it needs | Why |
|---|---|---|
| Posting a journal, approving a payment | Strong: use the primary, inside a transaction | A stale read leads to a double payment or an overdraft |
| "Payment received" page right after paying | Read-your-writes | People must see what they just did |
| Overnight MIS dashboard | Eventual is fine | Nobody acts on the last second |

## CAP: what happens when the network breaks
Put the copies in two cities: the primary in Mumbai, a replica in Singapore, joined by a network link. Networks do fail, as the DNS and load balancer lessons showed. When the link breaks, the copies cannot talk. That is a **network partition**.

CAP names three properties of a system that stores data on several machines:
- **C, consistency**: every read returns the latest write, or an error.
- **A, availability**: every request to a working node gets a real answer. The answer may be old.
- **P, partition tolerance**: the system keeps working when messages between nodes are lost.

In the picture Asha pays and Mumbai commits, but the link is down, so Singapore has not heard. The CFO asks Singapore for the balance. Singapore has exactly two honest options.`,
    { sketch: { w: 760, h: 320, caption: 'A partition forces a choice: refuse (consistent, not available) or answer with an old value (available, not consistent)', items: [
      { t: 'person', x: 56, y: 36, label: 'Asha pays' },
      { t: 'box', x: 130, y: 30, w: 180, h: 76, label: 'Mumbai', sub: 'primary: 30,000', fill: 'blue' },
      { t: 'box', x: 450, y: 30, w: 180, h: 76, label: 'Singapore', sub: 'replica: still 50,000', fill: 'green' },
      { t: 'person', x: 704, y: 36, label: 'CFO reads' },
      { t: 'arrow', x1: 92, y1: 66, x2: 130, y2: 66 },
      { t: 'arrow', x1: 310, y1: 68, x2: 450, y2: 68, dashed: true, color: '#e03131', label: 'replication', ly: -14 },
      { t: 'mark', x: 380, y: 68, ok: false },
      { t: 'text', x: 380, y: 126, text: 'network partition', color: '#e03131', size: 15 },
      { t: 'arrow', x1: 672, y1: 66, x2: 630, y2: 66 },
      { t: 'note', x: 24, y: 160, w: 350, h: 104, text: 'CP: stay consistent\nSingapore replies: "I cannot confirm\nthe latest balance, try later."\nConsistent, but not available.', fill: 'blue', size: 14 },
      { t: 'note', x: 386, y: 160, w: 350, h: 104, text: 'AP: stay available\nSingapore replies: 50,000\n(an old value). The copies re-sync\nafter the network heals.', fill: 'orange', size: 14 },
      { t: 'text', x: 380, y: 296, text: 'while the link is down you can have consistency OR availability, not both', size: 15, color: '#5c6478' },
    ] } },
    `Option one is **CP** (consistency over availability): Singapore says "I cannot confirm, try later". Option two is **AP** (availability over consistency): Singapore answers with the old balance and the copies re-sync later. Run both.`,
    { py: {
      title: 'The same partition, two different choices',
      starter: `class Node:
    def __init__(self, name):
        self.name, self.balance, self.version = name, 50000, 0


class Pair:
    """Two copies of one balance: Mumbai (where writes land) and Singapore (a copy that serves reads)."""
    def __init__(self, choice):
        self.mumbai, self.singapore = Node("mumbai"), Node("singapore")
        self.link_up = True
        self.choice = choice                          # "CP" or "AP": what to do during a partition

    def write_in_mumbai(self, balance):
        self.mumbai.balance = balance
        self.mumbai.version += 1
        if self.link_up:                              # replication works only while the link is up
            self.singapore.balance = balance
            self.singapore.version = self.mumbai.version

    def read_in_singapore(self):
        if not self.link_up and self.choice == "CP":
            raise TimeoutError("cannot confirm the latest value: refusing to answer")
        return self.singapore.balance

    def heal(self):                                   # the network comes back: copies reconcile
        self.link_up = True
        self.singapore.balance = self.mumbai.balance
        self.singapore.version = self.mumbai.version


for choice in ("AP", "CP"):
    print(f"--- {choice} ---")
    c = Pair(choice)
    print("link up           -> Singapore reads", c.read_in_singapore())
    c.link_up = False
    c.write_in_mumbai(30000)
    print("link DOWN, Mumbai commits 30000")
    try:
        print("Singapore reads   ->", c.read_in_singapore(), "(answered, but it is not the latest value)")
    except TimeoutError as e:
        print("Singapore reads   -> ERROR:", e)
    c.heal()
    print("link healed       -> Singapore reads", c.read_in_singapore())`,
      note: 'Both runs end with the same value once the link heals. The difference is what the CFO experienced during the partition: an old number or an error message.',
    } },
    `You will hear "pick two of C, A and P". That is misleading. Partitions **will** happen on a real network, so you cannot decline P. The real choice is: **during a partition, consistency or availability?** On a healthy network a well-built system can offer both.

- Choose **CP** when a wrong answer costs more than a refusal: ledgers, payments, stock counts that must not oversell.
- Choose **AP** when an old answer beats none: product catalogues, "likes", a read-only dashboard.

## PACELC: the trade-off when nothing is broken
CAP speaks only about the rare partition, yet you pay all the time. **PACELC** completes it: if there is a **P**artition, choose **A**vailability or **C**onsistency; **E**lse (normal running), choose **L**atency or **C**onsistency. Keeping a far copy perfectly in sync means every write waits for a round trip to it. Answering from a nearby copy is fast but may be stale. That is the synchronous versus asynchronous choice again.`,
    { interview: '**"Explain ACID versus BASE, and explain the CAP theorem."** Model answer: "ACID is what a relational database promises for a transaction: atomicity (all steps or none), consistency (declared rules always hold), isolation (concurrent transactions do not see each other\'s half-done work) and durability (committed data survives a crash). BASE is the looser style of many distributed stores: basically available, soft state, eventually consistent. They accept stale reads to stay up and to scale. CAP says that when a network partition splits the copies, a system must choose between consistency, by refusing or waiting, and availability, by answering possibly with old data. Partitions cannot be avoided, so I do not say pick two. PACELC adds that even with no partition there is a latency versus consistency trade-off. For a ledger I choose consistency; for a page-view counter I choose availability." End with that one-line finance example. It proves you can apply the idea.' },
    { real: 'It is the 31st and the close is running. A controller posts a late accrual at 6:02 pm. At 6:05 the BI report, which reads from a **read replica**, does not show it, and someone says "the report is wrong". The report was only **behind**. Good habits: put a "data as of" time on every report, check the replica lag before sign-off, and take the **final close figures from the primary** (or after lag is zero). On a PostgreSQL replica, `SELECT now() - pg_last_xact_replay_timestamp();` gives a rough lag, though it keeps growing when nothing is being written.' },
    `## Recap
- A **transaction** groups changes. **ACID**: atomicity (all or nothing), consistency (declared rules hold), isolation (no peeking at half-done work), durability (committed means saved).
- Weak isolation causes **dirty**, **non-repeatable** and **phantom** reads. Stronger levels prevent more at the cost of waiting. PostgreSQL defaults to Read Committed.
- A failed statement in an open transaction must be rolled back. In code: **validate first, change last**.
- **Replication** copies data to replicas. Asynchronous replication is fast but has **lag**, so reads can be stale. Use read-your-writes or the primary when staleness is unacceptable.
- **CAP**: during a partition choose consistency (CP: refuse) or availability (AP: answer, maybe old). **PACELC**: otherwise, latency versus consistency.`,
  ],
  quiz: [
    { q: 'The server crashes after the debit but before the credit. Which ACID property brings the debit back?', o: ['Atomicity', 'Consistency', 'Isolation', 'Durability'], a: 0, why: 'Atomicity means all the steps of a transaction happen or none do, so the half-done debit is rolled back.' },
    { q: 'What does the "C" in ACID guarantee?', o: ['All copies of the data are identical', 'Every query is fast', 'Declared rules such as CHECK and FOREIGN KEY always hold after a commit', 'Two users can never read the same row'], a: 2, why: 'ACID consistency is about your constraints. Agreement between copies is the different "C" of CAP.' },
    { q: 'Your report reads a balance, and a few seconds later reads the same row again inside the same transaction and gets a different value, because another transaction committed in between. What is this?', o: ['A dirty read', 'A phantom read', 'A deadlock', 'A non-repeatable read'], a: 3, why: 'The same row changed between two reads of one transaction. A phantom is about extra or missing rows in a repeated query, and a dirty read sees uncommitted data.' },
    { q: 'During a network partition, the Singapore replica returns an error instead of a possibly old balance. Which CAP choice is this?', o: ['AP: available but not consistent', 'CP: consistent but not available', 'CA: both at once', 'Neither; it is a bug'], a: 1, why: 'Refusing to answer when it cannot confirm the latest value is the consistency-over-availability choice.' },
    { q: 'A user pays an invoice, reloads the page and still sees the old balance because the page reads from a lagging replica. What is the standard fix?', o: ['Read-your-writes: send that user\'s reads to the primary for a short time', 'Turn off the database transaction', 'Make the replica asynchronous', 'Ask the user to wait a day'], a: 0, why: 'Read-your-writes lets people see their own change while other readers may still get slightly older data.' },
    { q: 'In PACELC, what does the "ELC" part describe?', o: ['What the system does during a partition', 'How encryption and logging are combined', 'The trade-off between latency and consistency when there is no partition', 'How many replicas you need'], a: 2, why: 'ELC reads "Else, Latency or Consistency": even on a healthy network, waiting for far copies costs time.' },
  ],
  task: {
    title: 'Break a transfer on purpose, then watch a copy fall behind',
    steps: [
      'Run the first SQL playground. Then change ROLLBACK to COMMIT, run once, and write down the two balances. Press "reset data".',
      'Inside a BEGIN block, run `UPDATE accounts SET balance = balance - 90000 WHERE id = 1;`. Copy the error text. Then run `SELECT * FROM accounts;` and copy that error too. Recover with ROLLBACK; and explain in one sentence why the second error appears.',
      'In the replica simulation set lag to 0, 3 and 10. Write down how many stale reads you get each time and what you would pay for lag 0 in a real system.',
      'In the CAP simulation, write one sentence for each choice (CP, AP) saying what the CFO sees during the partition.',
      'For three Kollana flows (posting a month-end journal, the nightly MIS dashboard, the balance shown right after a payment), choose strong consistency, eventual consistency or read-your-writes, and give a one-line reason for each.',
    ],
    deliverable: 'A one-page note with the balances from step 1, the two error messages from step 2, a small table of lag versus stale reads, the CP/AP sentences, and your three consistency choices with reasons.',
  },
};
