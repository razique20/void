# Data Retention Policy

**Company:** VOID  
**Effective Date:** August 27, 2026  
**Last Reviewed:** August 27, 2026  
**Owner:** Engineering Lead  
**Classification:** Internal  

---

## 1. Purpose

This policy defines how long VOID retains different categories of data and how data is securely deleted when no longer needed. Proper data retention minimizes legal risk, reduces storage costs, and complies with privacy regulations.

---

## 2. Scope

This policy applies to all data stored by VOID, including:
- Customer data
- User account data
- Conversation data
- Lead information
- System logs
- Financial records
- Employee/contractor data

---

## 3. Data Categories & Retention Periods

| Data Category | Retention Period | Deletion Method | Legal Basis |
|---------------|------------------|-----------------|-------------|
| **User Account Data** | Account lifetime + 30 days | Hard delete from MongoDB | Contractual necessity |
| **Conversation Data** | 90 days from last activity | Auto-delete via TTL index | Legitimate interest |
| **Lead Information** | 1 year from creation | Scheduled deletion | Legitimate interest |
| **System/Audit Logs** | 90 days | Auto-delete via TTL index | Legitimate interest |
| **Invoice/Financial Records** | 7 years | Secure deletion after period | Tax/legal requirement |
| **Support Tickets** | 2 years | Archive then delete | Contractual necessity |
| **Marketing Consent Records** | 3 years | Secure deletion | GDPR compliance |
| **Employee/Contractor Data** | Employment + 7 years | Secure deletion | Labor law compliance |
| **Analytics Data** | 2 years (aggregated) | Anonymization | Legitimate interest |
| **Backup Data** | 30 days rolling | Overwrite cycle | Disaster recovery |

---

## 4. Implementation Details

### 4.1 Conversation Data (90 days)
```javascript
// MongoDB TTL index on Conversation collection
// Auto-deletes documents 90 days after updatedAt
db.conversations.createIndex(
  { "updatedAt": 1 },
  { expireAfterSeconds: 7776000 } // 90 days in seconds
)
```

### 4.2 System/Audit Logs (90 days)
```javascript
// MongoDB TTL index on SystemLog collection
// Auto-deletes documents 90 days after createdAt
db.systemlogs.createIndex(
  { "createdAt": 1 },
  { expireAfterSeconds: 7776000 } // 90 days in seconds
)
```

### 4.3 Lead Data (1 year)
```javascript
// Scheduled job runs monthly
// Deletes leads older than 1 year
await Lead.deleteMany({
  createdAt: { $lt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) }
});
```

### 4.4 User Account Deletion
Upon account deletion request:
1. Soft delete immediately (mark as deleted)
2. Anonymize personal data after 30 days
3. Hard delete all data after 30 days
4. Retain financial records for 7 years (as required by tax law)

---

## 5. Data Deletion Procedures

### 5.1 Automated Deletion
- TTL indexes handle conversation and log data automatically
- Monthly cron job cleans up expired leads
- Backup rotation overwrites old backups after 30 days

### 5.2 Manual Deletion
For special cases (customer request, legal hold removal):
1. Verify deletion request is authorized
2. Document the request in the deletion log
3. Delete data from primary database
4. Delete from all backups within 30 days
5. Confirm deletion to requester

### 5.3 Deletion Verification
After deletion:
- Verify data no longer appears in queries
- Check that backups will not restore deleted data
- Document deletion completion with timestamp

---

## 6. Customer Data Rights

### 6.1 Right to Deletion (GDPR/CCPA)
Customers can request deletion of their data:
1. Submit request via email to privacy@void.ai
2. Verify identity
3. Process deletion within 30 days
4. Confirm completion to customer

### 6.2 Data Export
Customers can request a copy of their data:
1. Submit request via email
2. Export data in JSON format within 30 days
3. Deliver via secure download link

---

## 7. Exceptions

| Exception | Retention Extension | Approval Required |
|-----------|---------------------|-------------------|
| Legal hold | Indefinite until released | Legal counsel |
| Active investigation | Until investigation closes | Engineering Lead |
| Regulatory requirement | As required by law | Legal counsel |
| Financial records | 7 years (tax law) | None |

---

## 8. Compliance Verification

| Check | Frequency | Responsible |
|-------|-----------|-------------|
| TTL index functionality | Monthly | Engineering |
| Deletion job execution | Monthly | Engineering |
| Customer deletion requests | As received | Engineering |
| Policy review | Semi-annually | Engineering Lead |

---

## 9. Revision History

| Date | Author | Changes |
|------|--------|---------|
| 2026-08-27 | VOID Engineering | Initial policy creation |
