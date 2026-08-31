# Vendor Management Policy

**Company:** VOID  
**Effective Date:** August 27, 2026  
**Last Reviewed:** August 27, 2026  
**Owner:** Engineering Lead  
**Classification:** Internal  

---

## 1. Purpose

This policy establishes requirements for evaluating, selecting, and monitoring third-party vendors who have access to VOID systems or customer data. Proper vendor management reduces supply chain risk and ensures vendor security practices align with VOID's standards.

---

## 2. Scope

This policy applies to:
- All third-party services integrated with VOID
- All vendors with access to company or customer data
- All SaaS tools used in production
- All infrastructure providers

---

## 3. Vendor Risk Classification

| Risk Level | Criteria | Examples |
|------------|----------|----------|
| **Critical** | Access to customer PII or payment data, core infrastructure | MongoDB Atlas, Stripe, Clerk, Groq |
| **High** | Access to company data, production systems | Vercel, GitHub, Resend |
| **Medium** | Internal tools, no customer data access | Slack, Notion, analytics tools |
| **Low** | No data access, public services | CDN, status page, monitoring |

---

## 4. Vendor Evaluation Requirements

### 4.1 Before Onboarding a Critical/High-Risk Vendor

| Requirement | Description |
|-------------|-------------|
| Security questionnaire | Complete vendor security assessment |
| SOC 2 report | Request SOC 2 Type 2 report (or equivalent) |
| Data processing agreement | Sign DPA if handling customer data |
| Encryption verification | Confirm data encryption in transit and at rest |
| Access controls | Verify role-based access and MFA support |
| Incident notification | Confirm 24-72 hour breach notification commitment |
| Data location | Confirm data residency requirements are met |

### 4.2 Vendor Assessment Scorecard

Evaluate vendors on:
| Criteria | Weight | Score (1-5) |
|----------|--------|-------------|
| Security certifications (SOC 2, ISO 27001) | 25% | |
| Data encryption practices | 20% | |
| Access control mechanisms | 20% | |
| Incident response capabilities | 15% | |
| Data residency options | 10% | |
| Track record / reputation | 10% | |

**Minimum score for approval:** 3.5/5.0

---

## 5. VOID Vendor Registry

### 5.1 Critical Vendors

| Vendor | Service | Data Access | SOC 2 | DPA |
|--------|---------|-------------|-------|-----|
| **MongoDB Atlas** | Database | Customer data, conversations, leads | ✅ | ✅ |
| **Stripe** | Payments | Payment data, invoices | ✅ | ✅ |
| **Clerk** | Authentication | User accounts, sessions | ✅ | ✅ |
| **Groq** | AI inference | Conversation content (processed, not stored) | ✅ | ✅ |

### 5.2 High-Risk Vendors

| Vendor | Service | Data Access | SOC 2 | DPA |
|--------|---------|-------------|-------|-----|
| **Vercel** | Hosting | Application code, logs | ✅ | ✅ |
| **GitHub** | Source code | Code, CI/CD | ✅ | ✅ |
| **Resend** | Email | Email content, recipient addresses | ✅ | ✅ |

### 5.3 Medium-Risk Vendors

| Vendor | Service | Data Access |
|--------|---------|-------------|
| **Slack** | Communication | Internal messages |
| **Notion** | Documentation | Internal docs |
| **Figma** | Design | UI designs |

### 5.4 Low-Risk Vendors

| Vendor | Service | Data Access |
|--------|---------|-------------|
| **Cloudflare** | CDN/DNS | None (public) |
| **Vercel Analytics** | Analytics | Anonymous usage data |

---

## 6. Vendor Monitoring

### 6.1 Continuous Monitoring

| Activity | Frequency | Responsible |
|----------|-----------|-------------|
| Review vendor security advisories | Monthly | Engineering Lead |
| Verify vendor SOC 2 status | Annually | Engineering Lead |
| Review vendor access logs | Quarterly | Engineering Lead |
| Update vendor registry | As needed | Engineering Lead |
| Re-evaluate critical vendors | Annually | Engineering Lead |

### 6.2 Vendor Incident Response

When a vendor reports a security incident:
1. Assess impact on VOID systems and data
2. Determine if customer notification is required
3. Rotate any credentials the vendor had access to
4. Document the incident in VOID's incident log
5. Evaluate vendor relationship if breach is severe

---

## 7. Vendor Offboarding

When ending a vendor relationship:
1. Revoke all API keys and access credentials
2. Export and delete company data from vendor systems
3. Verify data deletion with vendor confirmation
4. Update vendor registry to reflect termination
5. Retain contractual records for 7 years

---

## 8. Vendor Data Processing Agreements (DPA)

All vendors handling customer data must have a DPA that includes:
- Purpose limitation (data used only for contracted service)
- Data encryption requirements (at rest and in transit)
- Breach notification timeline (within 72 hours)
- Data deletion upon termination
- Sub-processor disclosure
- Audit rights

---

## 9. Prohibited Vendors

VOID will not use vendors that:
- Store data in countries under US/EU sanctions
- Lack basic security controls (encryption, access logging)
- Have a history of major unaddressed security breaches
- Refuse to sign a Data Processing Agreement
- Cannot provide a SOC 2 report or equivalent certification

---

## 10. Compliance

| Requirement | Frequency |
|-------------|-----------|
| Vendor registry accuracy | Quarterly review |
| DPA coverage for critical vendors | Continuous |
| SOC 2 report collection | Annually |
| Vendor risk re-assessment | Annually |

---

## 11. Revision History

| Date | Author | Changes |
|------|--------|---------|
| 2026-08-27 | VOID Engineering | Initial policy creation |
