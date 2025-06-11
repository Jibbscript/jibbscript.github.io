---
title: Just-In-Time Privileged Access Manager (Secure Break-Glass Service) 
description: Just-In-Time Privileged Access Manager - Vault, Go 
---

# Just-In-Time Privileged Access Manager (Secure Break-Glass Service)
Goal: Create a secure system for just-in-time (JIT) privileged access to critical systems (servers, network devices, admin accounts) that eliminates always-on administrator credentials. The idea is to use Vault’s ability to generate one-time secrets (like SSH one-time passwords or signed SSH certificates)
developer.hashicorp.com
, combined with an approval workflow if needed, so that when an engineer needs to perform a critical task, they request access through this system and get a temporary credential that expires after a short window. This embodies Zero Trust for privileged accounts: no one has standing access; it’s granted only when needed and tightly scoped
hashicorp.com
. This project aligns with protecting privileged accounts (mentioned as a focus for security architecture) and integrating with corporate SSO and Vault. 

JIT Privileged Access flow. An Admin User requests access to a target server or system via the Privileged Access Service. The service authenticates the user (ensuring they are an admin with a valid reason) and uses Vault’s SSH secrets engine to generate a one-time credential (e.g., an OTP or an SSH signed certificate)
developer.hashicorp.com
. The service delivers this one-time credential to the user (e.g., display OTP or provide a certificate file). The user then logs into the target server using that credential within the allowed time window. Vault (or the target’s PAM integration) validates the credential (for OTP, Vault's backend checks the password; for certs, the server trusts the CA that signed it). The access is thereby granted without any permanent password, and the credential becomes invalid after use or expiry. All access requests are logged for audit.
Architecture & Implementation Plan:
Vault SSH Secrets Engine: Vault has an SSH secrets engine that supports two modes:
SSH One-Time Password (OTP): Vault generates a unique SSH password that is valid for one login attempt to a specific target. This requires a helper on the SSH server side: typically you configure the SSH server’s PAM or AuthorizedKeysCommand to call Vault to verify the OTP
developer.hashicorp.com
. Vault OTP mode essentially checks if a given OTP is valid for that server (Vault keeps track when issuing).
SSH Certificate Authority: Vault can act as an SSH CA, signing SSH client certificates. The target servers are configured to trust the Vault CA’s public key for user login. When a user requests access, Vault signs a certificate for that user (with a short TTL, say 30 minutes), and the user uses their private key + this certificate to log in. This approach doesn’t require Vault online verification at login; it relies on the certificate trust.
We can choose one; the cert approach is modern and doesn’t require server-side Vault calls after setup, but OTP might be simpler to demo if we can skip heavy server config by just simulating the check. However, certificate approach might actually be easier to implement client-side for a demo (client uses OpenSSH with a cert).
Privileged Access Service (Go): Provide a front-end for admins to request access:
Likely an internal web UI or CLI that an admin uses. For MVP, a CLI or simple web form is fine.
The service authenticates the admin (e.g., via SSO OAuth or simply ensure they come from corporate network and provide AD credentials – possibly integrate Azure AD OAuth similarly to Project 2).
Possibly integrate an approval step: For truly sensitive access, require a second person to approve. This could be done by notifying an approver who then clicks approve in the UI. For MVP, we might skip or simulate immediate self-approval.
Once approved, the service calls Vault to generate the credential:
For OTP: vault write ssh/creds/otp-role ip=<target_ip> yields a one-time password valid for that IP and some TTL (Vault will store it and allow one validation).
For SSH Cert: vault write ssh/sign/admin-role public_key="ssh-rsa AAA... user@host" ttl=30m yields a signed certificate that the user can use.
Provide the credential to the user securely. For OTP, display it on screen (and maybe simultaneously email or send through a secure channel). For SSH cert, provide the signed cert file (maybe user downloads it via the UI or the CLI writes it to a file).
Target Configuration:
For OTP mode: Each target server’s SSHD is configured with authzion via Vault. Specifically, you install the Vault SSH helper or use PAM module. For demonstration, this is complex to set up on real servers, but we can simulate by having our own “SSH login checker” call Vault to validate the OTP. However, since we likely cannot integrate a full SSH server in MVP easily, might lean to cert mode.
For Certificate mode: Each server’s sshd_config has TrustedUserCAKeys /etc/ssh/trusted_ca.pem which contains Vault’s SSH CA public key. And you allow user login via certs (OpenSSH supports this out of the box). For demo, if we run our own SSH server (on a VM or container), we can configure this. Alternatively, simulate by using the cert to authenticate to an OpenSSH server we set up on a VM.
Workflow Example: An admin needs root on a specific Linux server:
They go to our service UI, select the server from a dropdown (the service knows hostnames or IPs), maybe select account (root).
Provide reason (for audit record).
Click request; service authenticates them with SSO (ensures they are who they say).
Service either auto-approves (if policy allows self-service for this scenario) or sends to another admin for approval.
Once approved, service generates credential (Vault SSH): e.g., one-time password "Ax4Z-7YlQ" valid for host X.
The admin is shown "Use the following one-time password to SSH into host X as user root, within 15 minutes: Ax4Z-7YlQ".
Admin SSH’s: ssh root@host and when prompted, uses that OTP. The SSH server’s PAM checks Vault (or our service could provide a one-time mechanism for demo).
Access granted; Vault marks OTP as used, cannot be reused.
Auditing & Revocation: Vault will log the OTP issuance or cert issuance (with user identity if we pass it along as metadata). The service should log the request (who, what system, when, and if approved by who). If needed, an admin could manually revoke an issued cert (Vault can revoke SSH certs by serial or all certs from that role).
Integrations: Could integrate with chat/ITSM: e.g., user requests via a Slack bot or ServiceNow, and an approval can be given in Slack – but that's beyond MVP scope.
Security Considerations: The one-time secret must be delivered securely: showing on a web page that is TLS protected is okay (assuming the user is already authenticated). Avoid sending OTP via email in plaintext (could be intercepted), perhaps send via a secondary channel (text message) if needed. But for internal, web UI might suffice. The service itself should have high security (only accessible by privileged users).
MVP Design & Requirements:
MVP Choice: Use Vault’s SSH OTP mode for simplicity (less infra to config for demo). We won't actually integrate PAM on a real SSH server, but we can simulate verifying the OTP through Vault.
Setup Vault SSH OTP: Enable SSH secrets: vault secrets enable ssh. Configure OTP mode: need to give Vault an SSH key to use for some verification, but OTP mode mostly needs a role mapping IP or CIDR to label:
e.g., vault write ssh/roles/otp-role key_type=otp default_ttl=5m (Vault now will generate OTPs for any IP, default TTL 5 minutes).
Vault also needs the SSH Vault helper running on target normally, but since we cannot easily do that, we'll fudge the login step by calling Vault’s verify ourselves.
Actually, Vault provides an endpoint to verify OTP: vault write ssh/verify otp=<otp> with the OTP to see if valid (provided the OTP hasn’t been used and not expired). The idea is normally the target uses this.
Privileged Access Service (MVP):
Auth: For MVP, assume the user of the service is trusted (we won't implement SSO). Possibly restrict by IP or simple password to simulate.
Request endpoint: e.g., POST /request-otp with JSON { "host": "192.168.1.100", "user": "root" }. The service would (optionally check "is user allowed to access this host?"; for MVP maybe yes).
It calls: vault write ssh/creds/otp-role ip=192.168.1.100 (Vault doesn't strictly require the IP if not enforcing, but we pass it for context). Vault returns an otp and a username. Actually in OTP mode, Vault might require a ssh-key parameter if not providing IP. Let's check: Vault OTP by default uses an internal one-time password algorithm and doesn’t need existing key.
The returned data likely includes ip and key (the OTP). For example, vault write ssh/creds/otp-role ip=... returns something like vault_otp = "NKPX-ABCD-EFGH-IJKL"
developer.hashicorp.com
 and maybe a username if needed.
The service then outputs or returns that OTP to the requester.
Additionally, provide an endpoint for verification simulation (since we don't have actual SSHD hooking in): e.g., POST /verify-otp with {"otp": "NKPX-..."} which internally does vault write ssh/verify otp=NKPX-.... Vault will respond valid or not and mark used. In real world, this is done by SSH server, but in demo, we do it to simulate login.
Test/Demo Steps:
Vault SSH OTP Setup: As above, enable and configure. Possibly Vault needs to have an SSH key if it were doing key signing mode, but OTP might not require it. (Vault docs example for OTP suggests just enabling and adding role.)
Run Access Service: Start the service with Vault connection configured. Perhaps maintain a simple in-memory list of “allowed hosts” with their IP for demo. Or just allow whatever.
Request OTP: Simulate admin doing a request. Use curl: curl -X POST -d '{"host":"127.0.0.1","user":"root"}' http://localhost:8080/request-otp. The service authenticates (if we put a basic auth or token, include that header). It calls Vault and returns something like {"otp": "NKPX-....", "ttl": 300}.
Simulate SSH Login: Now normally the user would take that OTP and input it to the SSH prompt. We simulate by directly calling our verify endpoint to mimic the server checking it:
curl -X POST -d '{"otp": "NKPX-...."}' http://localhost:8080/verify-otp.
The service will call Vault's verify. If OTP is valid and unused, Vault returns success (and likely invalidates it so it can't be reused). The service can return {"valid": true}. If called again, Vault should say invalid (since already used).
Double-check OTP invalidation: Try verify again with same OTP (simulate someone trying to reuse). It should now report invalid. If possible, check Vault logs or output to see that verify was called and OTP is now spent.
Expiry test: Generate an OTP but don’t verify until after TTL passes (for demo, maybe set TTL=1m to test). After waiting >1m, attempt verify via service – should fail (expired).
Audit logs: Show Vault’s audit (if enabled) entry for ssh/creds and ssh/verify indicating which OTP (though Vault doesn’t log OTP content, it logs request) and that ties to user identity (Vault dev might just show token id).
Optional UI demonstration: If we had more time, we could create a quick CLI or UI to streamline it. But the above curl sequence suffices to show the flow.
Integration to actual SSH (if possible): If we wanted, we could set up an actual SSH server on another container configured to call our verify API (or Vault directly) for authentication. That is more complex, but could be noted rather than done.
Expected Outcome: The MVP demonstrates that we can dispense with permanent admin passwords by issuing single-use credentials on demand. It shows Vault’s capability to produce one-time SSH passwords
developer.hashicorp.com
 and how a service can orchestrate the request/approval and distribution process. The security improvement is clear: even if an OTP is intercepted, it’s valid only once and for a brief time (and tied to a specific target), greatly limiting damage. This system also provides an audit trail for privileged access – every use of admin rights goes through the broker and is logged, which is invaluable for compliance (no more shared admin passwords, no more untracked access). This project highlights the engineer’s proficiency with integrating identity (Azure AD for auth in a real scenario), Vault, and automation to protect highly sensitive assets, fulfilling a key responsibility of designing secure privileged access solutions in the cloud and on-prem
linkedin.com
.