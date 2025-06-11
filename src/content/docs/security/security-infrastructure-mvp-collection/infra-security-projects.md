---
title: Security Infrastructure MVP Collection 
description: Security Infrastructure Production Solution MVPs 
---

# production‑grade cloud security projects  

## project 1 – multi‑tenant secrets management platform

**goal:** build an internal **“vault‑as‑a‑service”** platform to securely store and manage secrets (tokens, passwords, keys) for many teams and applications across nvidia. the service will provide **self‑service secret management** for multiple tenants (business units, teams, projects) in a single unified system. each tenant’s secrets are isolated and governed by strict policies, while the platform is highly available (ha) and low‑latency to serve high‑volume requests enterprise‑wide. this directly addresses the role’s mandate to **lead a multi‑tenant cloud and on‑premise security service used across all of nvidia**.

<details>
<summary>architecture & implementation plan</summary>

* use **hashicorp vault** (ha, raft) with namespace or path‑prefix isolation.  
* go api/gRPC front‑end handles tenant onboarding + secret crud.  
* sso via **azure ad oidc**, rbac via vault policies.  
* tls everywhere, audit logs, docs, helm deploy on k3s.  

</details>

<details>
<summary>mvp (2–3 days)</summary>

* single‑node vault dev, go proxy, two demo tenants.  
* endpoints: `POST /tenants`, `PUT/GET /tenant/{t}/secret/{k}`.  
* auth via static vault tokens.  
* curl demo shows tenant isolation.  

</details>

---

## project 2 – zero trust cloud access gateway (identity‑aware proxy)

**goal:** build a go reverse‑proxy that authenticates users via **azure ad oidc**, exchanges tokens with vault, and enforces fine‑grained policy before forwarding to internal services. delivers per‑request authn/authz, supports mtls to backends, embraces zero‑trust.

<details>
<summary>architecture & implementation plan</summary>

* go reverse proxy + jwt validation + vault token exchange.  
* policies based on ad groups.  
* optional client cert issuance via vault pki.  
* stateless replicas behind lb.  

</details>

<details>
<summary>mvp</summary>

* dummy backend service on :8081.  
* gateway on :8080, mock oidc (keycloak or hard‑coded jwk).  
* allow `engineering` group, reject others.  
* curl/browser demo.  

</details>

---

## project 3 – unified key management & encryption‑as‑a‑service

**goal:** expose vault **transit** engine via a thin go api (`/encrypt`, `/decrypt`, `/sign`). apps offload crypto, never handle keys.

<details>
<summary>architecture & implementation</summary>

* rest/grpc, multi‑tenant key names.  
* cache connections, ha vault replicas.  

</details>

<details>
<summary>mvp</summary>

* vault dev, transit key `demo‑key`.  
* endpoints above + api‑key auth.  
* encrypt/decrypt “hello world” round‑trip.  

</details>

---

## project 4 – ci/cd pipeline secrets orchestrator

**goal:** inject vault‑stored secrets into gitlab ci / jenkins jobs just‑in‑time, eliminating plaintext creds in yaml.

<details><summary>arch & impl</summary>

* go service validates `ci_job_jwt` (or api key) -> maps to vault path.  
* returns kv pairs as json or `export VAR=...` script.  
* optional dynamic cloud creds via vault engines.  

</details>

<details><summary>mvp</summary>

* secret at `ci/data/demoapp`.  
* curl with headers `x‑project` + token fetches json.  
* show failure on bad token.  

</details>

---

## project 5 – dynamic multi‑cloud credential broker

**goal:** issue short‑lived aws/gcp/azure creds via vault secrets engines, killing long‑lived iam keys.

<details><summary>arch & impl</summary>

* endpoints `/aws/creds/{role}` etc.  
* broker auth + vault read `aws/creds/role`.  
* logs + ttl expiry.  

</details>

<details><summary>mvp</summary>

* configure vault aws engine role `myrole`.  
* curl `x‑auth‑token` → returns sts creds json.  
* optional aws cli test.  

</details>

---

## project 6 – automated certificate management (vault pki‑as‑a‑service)

**goal:** on‑demand short‑lived tls certs for microservices, enabling mtls and service identity.

<details><summary>arch & impl</summary>

* vault pki root/intermediate, role `microservice`.  
* go api: `POST /sign` (csr) or `/issue` (auto key).  
* distribute ca cert across clusters.  

</details>

<details><summary>mvp</summary>

* vault dev pki, role `testrole`.  
* generate csr with openssl, call `/sign`, verify cert.  

</details>

---

## project 7 – secrets rotation & compliance auditor

**goal:** scheduled service scans vault kv & leases, rotates old secrets (or triggers change in db, ad, etc.), and reports non‑compliance.

<details><summary>arch & impl</summary>

* rules config: rotate db pwd 30d, api key 60d…  
* for static db pwd: connect as admin, change pwd, update vault.  
* produce html/json report.  

</details>

<details><summary>mvp</summary>

* rotate mysql `appuser` pwd stored in vault.  
* verify new pwd works, old fails.  

</details>

---

## project 8 – just‑in‑time privileged access manager

**goal:** broker one‑time ssh otps (or certs) from vault for break‑glass admin sessions; no standing root passwords.

<details><summary>arch & impl</summary>

* go ui/cli -> vault ssh engine `otp‑role`.  
* optional manager approval flow.  
* audit logs tie otp to user & host.  

</details>

<details><summary>mvp</summary>

* enable vault ssh otp, role `otp‑role`.  
* request otp via `/request‑otp`, verify via `/verify‑otp`.  
* demonstrate single‑use + ttl expiry.  

</details>

---

### references

* hashicorp docs – namespaces, transit, pki, ssh otp, dynamic secrets.  
* best practices – zero trust, rotate secrets.  
