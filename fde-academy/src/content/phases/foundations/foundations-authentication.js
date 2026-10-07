export default {
  id: 'foundations-authentication',
  title: 'Authentication: proving who you are',
  goal: 'You can explain how passwords must be stored (salted, slow hashes), the three kinds of login factors and what MFA adds, how sessions, API keys and Basic auth work, and why you never build login yourself.',
  roadmap: ['Authentication vs authorization', 'Password hashing, salts, MFA', 'Sessions vs tokens, API keys, Basic auth'],
  blocks: [
    `## The problem
Your team shares one login for the bank portal. The password lives in an Excel sheet on SharePoint. Someone leaves the company. Nobody knows who approved last Tuesday's payment, because the audit log says "finance_user" for all of you.

Everything in security rests on two separate questions:
- **Authentication (authn):** *Who are you?* Proving an identity.
- **Authorization (authz):** *What are you allowed to do?* Deciding access after identity is known.

They are often confused, and mixing them up causes real bugs (the 401 vs 403 difference you saw in the HTTP lesson). This lesson is authentication. Authorization comes at the end of this module.

## Three kinds of proof
You can prove who you are with:
1. **Something you know**: a password, a PIN.
2. **Something you have**: your phone with an authenticator app, a hardware security key, a smart card.
3. **Something you are**: a fingerprint, a face.

**Multi-factor authentication (MFA)** means using **two or more different kinds**. A password plus a second password is not MFA. A password plus a code from your phone is. MFA stops most account takeovers, because a stolen password alone is no longer enough. The weakest common second factor is an **SMS code** (SIM-swap attacks exist); an **authenticator app** is better; a **FIDO2 security key or passkey** is the strongest because it cannot be tricked by a fake login page. These are phishing-resistant because the key only answers to the real website.

## How passwords must be stored
A server must **never store your password**. It stores a **hash**: a one-way fingerprint. When you log in, it hashes what you typed and compares fingerprints. Anyone who steals the database gets fingerprints, not passwords.

But two details decide whether the hashes are safe:
- **Salt.** A random value, different for every user, mixed into the hash. Without salt, everyone whose password is \`Welcome@123\` has the same hash, and attackers use giant precomputed lists (*rainbow tables*). With a salt, the same password gives a different hash for each user, so the attacker has to attack each account separately.
- **Slow on purpose.** Ordinary hashes like SHA-256 are built to be fast: a graphics card can try billions per second. Password hashes must be **deliberately slow and memory-hungry**: **Argon2**, **bcrypt**, **scrypt** or **PBKDF2** with a high iteration count. A "cost" setting lets you make it slower as computers get faster.`,
    { sketch: { w: 760, h: 330, caption: 'Three kinds of proof, and why a salt gives two users different stored hashes for the same password', items: [
      { t: 'circle', x: 120, y: 78, r: 54, label: 'know\npassword', fill: 'yellow' },
      { t: 'circle', x: 290, y: 78, r: 54, label: 'have\nphone, key', fill: 'blue' },
      { t: 'circle', x: 460, y: 78, r: 54, label: 'are\nfingerprint', fill: 'green' },
      { t: 'text', x: 205, y: 78, text: '+', size: 28, bold: true },
      { t: 'arrow', x1: 520, y1: 78, x2: 596, y2: 78 },
      { t: 'note', x: 600, y: 48, w: 150, h: 60, text: 'MFA = two or more\nDIFFERENT kinds', fill: 'pink' },
      { t: 'table', x: 30, y: 192, title: 'users table (what the server stores)', cols: ['user', 'salt', 'stored hash'], colW: [90, 150, 270], rows: [['asha', '7f3a91c0…', 'b81e04d2a9f6…'], ['kabir', 'c42d7e18…', '5a09fe73c1b8…']], fill: 'orange' },
      { t: 'note', x: 580, y: 196, w: 170, h: 84, text: 'Both chose\n"Welcome@123".\nDifferent salts give\ndifferent hashes.', fill: 'yellow', size: 14 },
      { t: 'text', x: 280, y: 306, text: 'login = hash(typed password + salt) → compare with the stored hash', size: 15, color: '#5c6478' },
    ] } },
    `## See it work
The program below hashes a password with **PBKDF2**, a standard slow hash in Python's library. Run it twice and compare: the same password gives different results because the salt is random, yet \`verify\` still works.`,
    { py: {
      title: 'Salted, slow password hashing',
      starter: `import hashlib, hmac, os, time

def pbkdf2(password, salt, iterations):
    if hasattr(hashlib, "pbkdf2_hmac"):                  # normal Python: the fast, native version
        return hashlib.pbkdf2_hmac("sha256", password, salt, iterations)
    # The browser's Python has no native PBKDF2, so here is the same algorithm in plain Python (slower).
    prf = lambda msg: hmac.new(password, msg, hashlib.sha256).digest()
    u = prf(salt + (1).to_bytes(4, "big"))
    t = int.from_bytes(u, "big")
    for _ in range(iterations - 1):
        u = prf(u)
        t ^= int.from_bytes(u, "big")
    return t.to_bytes(32, "big")

def hash_password(password, salt=None, iterations=100_000):
    salt = salt or os.urandom(16)                       # random per user
    digest = pbkdf2(password.encode(), salt, iterations)
    return salt.hex(), iterations, digest.hex()

def verify(password, salt_hex, iterations, digest_hex):
    test = pbkdf2(password.encode(), bytes.fromhex(salt_hex), iterations)
    return hmac.compare_digest(test.hex(), digest_hex)    # constant-time compare

a = hash_password("Welcome@123")
b = hash_password("Welcome@123")
print("user A hash:", a[2][:24], "...")
print("user B hash:", b[2][:24], "...  <- same password, different hash")
print("right password :", verify("Welcome@123", *a))
print("wrong password :", verify("welcome@123", *a))

t = time.perf_counter()
for _ in range(10000):                                  # one hash is too quick to time, so time 10,000 and average
    hashlib.sha256(b"Welcome@123").digest()
fast = (time.perf_counter() - t) / 10000
t = time.perf_counter(); hash_password("Welcome@123"); slow = time.perf_counter() - t
print(f"plain SHA-256 : {fast*1e6:8.1f} microseconds per guess")
print(f"PBKDF2 100k   : {slow*1e3:8.1f} milliseconds per guess  (about {slow/max(fast,1e-9):,.0f}x slower for an attacker too)")`,
      note: 'The slowdown is a feature. 20 ms is invisible to one real user logging in, but it makes billions of guesses per second impossible for an attacker.',
    } },
    `## Staying logged in: sessions and tokens
HTTP is stateless, so after you log in the server needs a way to recognise you on the next request. Two common designs:
- **Server-side session.** The server creates a random **session ID**, stores your details in its memory or database, and sends the ID in a **cookie**. Each request carries the cookie; the server looks you up. Easy to end a session (delete the row). Needs shared storage once you have several servers.
- **Token (for example a JWT).** The server (or an identity provider) gives you a **signed token** that contains your identity and permissions. You send it in the \`Authorization: Bearer\` header; any server can verify the signature without looking anything up. Scales easily; harder to revoke before it expires, so keep lifetimes short. We study tokens in the next lessons.

## API keys and Basic auth
- An **API key** is a long random string that identifies an *application*, not a person. Simple and common (many SaaS APIs), but a key is a static secret: it is easy to leak, has no expiry unless you add one, and cannot say *which user* acted. Send it in a header, never in the URL, store only its hash on the server, and rotate it.
- **HTTP Basic auth** sends \`Authorization: Basic <base64(user:password)>\`. Base64 is an **encoding, not encryption**: anyone can decode it in a second, as the exercise below shows. It is acceptable only inside TLS, and better avoided.`,
    { pychallenge: {
      id: 'foundations-pych-basic-auth',
      prompt: 'Write `decode_basic(header)` that takes an `Authorization` header value such as `"Basic YXNoYTpzM2NyZXQ="` and returns the tuple `(username, password)`. The part after `Basic ` is base64 of `username:password`. The password may itself contain a colon, so split only at the **first** colon. Raise `ValueError` if the header does not start with `Basic `.',
      starter: `import base64

def decode_basic(header):
    return ("", "")`,
      tests: `assert decode_basic("Basic YXNoYTpzM2NyZXQ=") == ("asha", "s3cret")
assert decode_basic("Basic dXBsb2FkZXI6UGF5QDIwMjY=") == ("uploader", "Pay@2026")
import base64 as b
assert decode_basic("Basic " + b.b64encode(b"kabir:pa:ss").decode()) == ("kabir", "pa:ss")
try:
    decode_basic("Bearer abc")
    raise AssertionError("should reject non-Basic headers")
except ValueError:
    pass`,
      solution: `import base64

def decode_basic(header):
    scheme, _, encoded = header.partition(" ")
    if scheme != "Basic" or not encoded:
        raise ValueError("not a Basic auth header")
    user, _, password = base64.b64decode(encoded).decode().partition(":")
    return user, password`,
      hint: 'header.partition(" ") splits off the scheme. base64.b64decode(...).decode() gives "user:password". Use partition(":") to split at the first colon only.',
    } },
    `## Credential attacks you should plan for
- **Brute force:** guessing passwords for one account. Defence: slow hashing, lockout or exponential delay, rate limiting.
- **Credential stuffing:** trying leaked email/password pairs from other breaches on your site, because people reuse passwords. Defence: MFA, breached-password checks, rate limits and monitoring.
- **Phishing:** a fake page collects the password and the one-time code. Defence: phishing-resistant factors (passkeys, security keys).
- **Session theft:** stealing the cookie or token. Defence: TLS, \`HttpOnly\`/\`Secure\`/\`SameSite\` cookies, short lifetimes.

## Do not build login yourself
Writing registration, password reset, MFA, lockout and session handling is easy to get subtly wrong, and a mistake is a breach. In real projects you **delegate sign-in to an identity provider** such as Microsoft Entra ID, using OAuth 2.0 and OpenID Connect. Your app then never sees or stores a password at all. That is the next lesson.`,
    { warn: 'Never store passwords in plain text, never use a fast hash (MD5, SHA-1, plain SHA-256) for passwords, never invent your own scheme, and never log passwords or tokens, even "temporarily for debugging". Logs are copied, shipped and kept for years.' },
    { interview: '**"How would you store user passwords?"** Model answer: "I would not store them. I would use a managed identity provider. If I truly had to, I would store only a salted hash made with a deliberately slow algorithm like Argon2id or bcrypt, with a per-user random salt and a tuned cost, verify with a constant-time comparison, and add MFA, rate limiting and breached-password checks." The last sentence shows you think beyond the hash.' },
    { real: 'Shared logins are an audit finding waiting to happen. When you set up Power Automate connections or Azure resources, use **named identities** or a **service principal or managed identity** per automation, so that logs say who or what did each action. Change "finance_user" to "svc-payroll-validator" and your audit trail suddenly means something.' },
    `## Recap
- **Authentication** proves identity; **authorization** decides access. Keep them separate in your head and your code.
- Factors: **know, have, are**. **MFA** = two or more *different* kinds; passkeys and security keys resist phishing.
- Store only **salted, slow hashes** (Argon2, bcrypt, scrypt, PBKDF2) and compare in constant time.
- **Sessions** keep state on the server; **tokens** carry signed identity. **API keys** identify apps, not people. **Basic auth** is base64, not encryption.
- Plan for brute force, credential stuffing, phishing and session theft. Delegate login to an identity provider instead of building it.`,
  ],
  quiz: [
    { q: 'Which pair counts as multi-factor authentication?', o: ['A PIN and a password', 'Password and a security question', 'Password and a code from an authenticator app', 'Two different passwords'], a: 2, why: 'MFA needs two different kinds of proof: something you know plus something you have.' },
    { q: 'Why is a unique random salt added before hashing a password?', o: ['So identical passwords produce different hashes and precomputed tables fail', 'To encrypt the password so it can be decrypted later', 'To speed up login', 'To make the hash shorter'], a: 0, why: 'Per-user salts force an attacker to crack each hash separately and defeat rainbow tables.' },
    { q: 'Why is plain SHA-256 a poor choice for storing passwords?', o: ['It cannot be verified', 'It is too slow', 'It is too fast, so attackers can test billions of guesses per second', 'It produces a very long output'], a: 3, why: 'Password hashing must be deliberately slow and costly. General-purpose hashes are built for speed.' },
    { q: 'What does the string after "Basic " in an Authorization header contain?', o: ['An encrypted password', 'Base64 of username:password, which anyone can decode', 'A signed token', 'A hash of the password'], a: 1, why: 'Base64 is a reversible encoding. Basic auth is only safe inside TLS.' },
    { q: 'You find a leaked API key in a public Git repository. What is the correct first action?', o: ['Revoke or rotate the key immediately, then clean up the history', 'Tell nobody', 'Change the repo name', 'Delete the commit and carry on'], a: 0, why: 'Assume it is already copied. Rotation neutralises the key; cleaning history alone does not.' },
    { q: 'What is the best answer to "should we build our own login system?"', o: ['Yes, but without MFA', 'Only for internal tools', 'Yes, it gives full control', 'No, delegate to an identity provider using OAuth 2.0 / OpenID Connect'], a: 3, why: 'Identity is easy to get subtly wrong. A mature provider handles MFA, resets, lockout and monitoring for you.' },
  ],
  task: {
    title: 'Audit your own logins',
    steps: [
      'List five systems you log into at work. For each, write which factors it uses (know/have/are), and whether the login is personal or shared.',
      'Run the hashing playground. Change `iterations` to 10 and then to 300,000 and note the time per hash (in the browser the slow version of the algorithm runs, so for bigger numbers use VS Code on your laptop). Decide what number would feel acceptable for a real login page (under about 100 ms on your hardware) and why.',
      'Pick one shared login or API key in your job. Write the plan to replace it: who gets a named identity, where the secret will live, and how it will be rotated.',
    ],
    deliverable: 'A table of five systems with their factors, a note of the iteration count you would choose, and a one-paragraph plan to retire one shared credential.',
  },
};
