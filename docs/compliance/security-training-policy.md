# Security Training Policy

**Company:** VOID  
**Effective Date:** August 27, 2026  
**Last Reviewed:** August 27, 2026  
**Owner:** Engineering Lead  
**Classification:** Internal  

---

## 1. Purpose

This policy ensures all VOID team members understand their responsibility for protecting company and customer data. Regular security training reduces human error, which is the leading cause of security incidents.

---

## 2. Scope

This policy applies to:
- All full-time employees
- All contractors and consultants
- All temporary workers with system access
- Any third party with access to VOID systems

---

## 3. Training Requirements

### 3.1 Initial Training (Within 30 Days of Hire)

| Topic | Duration | Format |
|-------|----------|--------|
| Security awareness overview | 30 min | Online course |
| Password and authentication | 15 min | Online course |
| Data handling and classification | 15 min | Online course |
| Phishing recognition | 15 min | Interactive exercise |
| Incident reporting | 10 min | Written policy review |

### 3.2 Annual Refresher Training

| Topic | Duration | Format |
|-------|----------|--------|
| Security awareness update | 30 min | Online course |
| New threat landscape | 15 min | Written briefing |
| Policy updates review | 15 min | Document review |
| Phishing simulation | 10 min | Simulated phishing test |

### 3.3 Role-Specific Training

**Engineering Team:**
- Secure coding practices (OWASP Top 10)
- API security best practices
- Cloud security (AWS/Vercel)
- Database security (MongoDB Atlas)

**All Staff:**
- Social engineering awareness
- Physical security
- Clean desk policy
- Remote work security

---

## 4. Training Topics

### 4.1 Password Security
- Use strong, unique passwords (16+ characters)
- Never reuse passwords across services
- Use a password manager (recommended: 1Password)
- Enable MFA on all accounts
- Never share credentials via email or chat

### 4.2 Phishing Awareness
- Verify sender email addresses
- Hover over links before clicking
- Never download unexpected attachments
- Report suspicious emails immediately
- When in doubt, verify through a different channel

### 4.3 Data Handling
- Classify data by sensitivity level
- Never store sensitive data in plain text
- Use encryption for data in transit and at rest
- Share data only through approved channels
- Clean up test data before deployment

### 4.4 Access Control
- Follow principle of least privilege
- Never share accounts or credentials
- Request access through proper channels
- Report unauthorized access attempts
- Log out of systems when not in use

### 4.5 Incident Reporting
- Report suspected incidents immediately
- Document what you observed
- Don't attempt to investigate on your own
- Preserve evidence (don't delete logs)
- Contact Engineering Lead for guidance

---

## 5. Training Records

All training completion must be documented:

| Record | Retention Period |
|--------|------------------|
| Training completion certificates | Duration of employment + 2 years |
| Phishing simulation results | 1 year |
| Training attendance logs | 2 years |

---

## 6. Compliance

### 6.1 Mandatory Participation
- All team members must complete initial training within 30 days
- Annual refresher training must be completed within 30 days of due date
- Failure to complete training may result in restricted system access

### 6.2 Verification
- Training completion is tracked in a training log
- Engineering Lead reviews completion quarterly
- Non-compliance is escalated to leadership

---

## 7. Simulated Phishing

### 7.1 Schedule
- Quarterly simulated phishing tests
- Results are tracked and analyzed

### 7.2 Response Protocol
| Action | Response |
|--------|----------|
| Report phishing (correct) | Positive reinforcement |
| Click link (incorrect) | Immediate training redirect |
| Submit credentials (incorrect) | Additional training + review |

### 7.3 Metrics
Track and improve:
- Click rate (target: <5%)
- Report rate (target: >60%)
- Time to report (target: <5 minutes)

---

## 8. Security Resources

| Resource | Purpose | Link |
|----------|---------|------|
| VOID Security Policy | Company-wide security rules | docs/compliance/ |
| Incident Response Plan | What to do during a security incident | docs/compliance/ |
| Phishing Report | How to report suspicious emails | security@void.ai |
| Password Manager | Secure credential storage | 1Password (recommended) |

---

## 9. Revision History

| Date | Author | Changes |
|------|--------|---------|
| 2026-08-27 | VOID Engineering | Initial policy creation |
