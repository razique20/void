# Access Review Policy

**Company:** VOID  
**Effective Date:** August 27, 2026  
**Last Reviewed:** August 27, 2026  
**Owner:** Engineering / Security  
**Classification:** Internal  

---

## 1. Purpose

This policy establishes a formal process for reviewing user access to VOID's systems, data, and infrastructure on a quarterly basis. The goal is to ensure that only authorized personnel have access to resources necessary for their role, and that access is revoked promptly when no longer needed.

---

## 2. Scope

This policy applies to:
- All VOID employees, contractors, and consultants
- All production systems, databases, and cloud infrastructure
- All third-party services with access to company data
- Administrative and privileged access accounts

---

## 3. Access Review Schedule

| Review Type | Frequency | Responsible Party |
|-------------|-----------|-------------------|
| Full access review | Quarterly (Jan, Apr, Jul, Oct) | Engineering Lead |
| Privileged access review | Monthly | Engineering Lead |
| New hire access verification | Within 30 days of hire | Engineering Lead |
| Termination access revocation | Within 24 hours of termination | Engineering Lead |

---

## 4. Quarterly Access Review Process

### 4.1 Preparation
1. Export user lists from all production systems
2. Compile a list of all users with access to:
   - MongoDB Atlas (database)
   - Vercel (deployment)
   - GitHub (source code)
   - Clerk (authentication)
   - Stripe (payment data)
   - SMTP/Email services
   - Admin dashboards

### 4.2 Review Criteria
For each user, verify:
- [ ] User is still an active employee/contractor
- [ ] User's role requires the level of access they have
- [ ] No shared accounts exist
- [ ] No dormant accounts (no login in 90+ days)
- [ ] Privileged access is justified and documented

### 4.3 Actions
- **Revoke** access for terminated employees/contractors
- **Downgrade** access for role changes
- **Remove** dormant accounts (no activity in 90+ days)
- **Document** any exceptions with business justification

### 4.4 Documentation
All reviews must be documented in the quarterly access review log:
- Date of review
- Systems reviewed
- Users reviewed
- Actions taken
- Exceptions approved
- Reviewer signature

---

## 5. Privileged Access Management

### 5.1 Definition
Privileged access includes:
- Database admin access (MongoDB Atlas)
- Production deployment access (Vercel)
- API key management
- Admin dashboard access
- User impersonation capabilities

### 5.2 Requirements
- Privileged access must be justified in writing
- Multi-factor authentication (MFA) is required for all privileged accounts
- Privileged access reviews occur monthly
- No shared privileged accounts allowed

---

## 6. Access Revocation

### 6.1 Upon Termination
1. Immediate notification from HR/management
2. Revoke all system access within 24 hours
3. Rotate any shared credentials the user had access to
4. Document revocation in termination checklist

### 6.2 Upon Role Change
1. Review new role requirements
2. Remove access no longer needed
3. Grant access required for new role
4. Document changes in access review log

---

## 7. Exceptions

Any exceptions to this policy must be:
- Documented with business justification
- Approved by the Engineering Lead
- Time-limited (maximum 90 days)
- Reviewed at the next quarterly review

---

## 8. Audit Trail

All access changes are logged in the VOID system audit log (`SystemLog` model) with:
- User who made the change
- What access was modified
- Timestamp
- Reason for change

Logs are retained for 90 days via MongoDB TTL index.

---

## 9. Compliance

Violations of this policy may result in:
- Immediate access revocation
- Disciplinary action
- Termination of employment/contract

---

## 10. Revision History

| Date | Author | Changes |
|------|--------|---------|
| 2026-08-27 | VOID Engineering | Initial policy creation |
