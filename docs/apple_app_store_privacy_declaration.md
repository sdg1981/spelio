# Apple App Store Privacy Declaration

This document records the Apple App Privacy declaration published for Spelio iOS Version 1.0 in June 2026.

The declaration is based on the current production implementation and deployed bundle at the time of publication. It does not describe future roadmap plans, proposed features, or speculative data collection.

## First App Privacy Answer

Apple App Store Connect asked whether Spelio collects data from this app.

Published answer:

> Yes, we collect data from this app.

## Published Data Categories

### Data Linked to You

| Apple category | Declared data type | Why it was declared | Purpose | Linked to user | Used for tracking |
| --- | --- | --- | --- | --- | --- |
| Contact Info | Email Address | The optional feedback form allows users to provide an email address. | App Functionality | Yes | No |
| User Content | Customer Support | Feedback/support messages are submitted through the app and sent via backend/email handling. | App Functionality | Yes | No |

### Data Not Linked to You

| Apple category | Declared data type | Why it was declared | Purpose | Linked to user | Used for tracking |
| --- | --- | --- | --- | --- | --- |
| Identifiers | User ID | An app-generated client ID is used for custom-list rate limiting and abuse prevention. | App Functionality | No | No |
| User Content | Other User Content | Custom word list titles and Welsh/English entries are stored remotely. | App Functionality | No | No |
| Usage Data | Other Usage Data | Operational rate-limit counters are used for custom-list creation and audio generation. | App Functionality | No | No |
| Other Data | Other Data | IP/request metadata is used for backend rate limiting and abuse prevention. | App Functionality | No | No |

## Categories Not Currently Declared

The following Apple App Privacy categories are not currently declared for Spelio iOS Version 1.0:

- Name
- Phone Number
- Physical Address
- Other Contact Info
- Health
- Fitness
- Payment Info
- Credit Info
- Other Financial Info
- Precise Location
- Coarse Location
- Sensitive Info
- Contacts
- Emails or Text Messages
- Photos or Videos
- Audio Data
- Gameplay Content
- Browsing History
- Search History
- Device ID
- Purchases
- Product Interaction
- Advertising Data
- Crash Data
- Performance Data
- Other Diagnostic Data
- Environment Scanning
- Hands
- Head

## Future Changes Requiring Privacy Review

The App Store privacy declaration must be reviewed before release if Spelio adds or enables any of the following:

- user accounts
- email/password login
- social login
- cloud-synced learner progress
- analytics such as Google Analytics, PostHog, Plausible, or similar tools
- crash reporting such as Sentry
- performance monitoring
- marketing emails
- push notifications
- subscriptions or purchases
- teacher dashboards
- school/classroom accounts
- storing learner progress remotely
- linking custom lists to users
- collecting device identifiers
- any advertising or tracking SDK

Future Codex/AI changes that introduce new data collection must update this document and may require updating App Store Connect privacy declarations before release.
