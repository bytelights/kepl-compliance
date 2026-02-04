# Integration Configuration Email Template

---

**Subject:** SharePoint & Microsoft Teams Configuration Details Required for Compliance Management System

---

Hi Team,

To complete the integrations setup for the Compliance Management System, we need configuration details from your Microsoft 365 environment for both **SharePoint** (document storage) and **Microsoft Teams** (notifications).

---

## Part 1: SharePoint Configuration

### Required Information:
1. **Tenant ID** - Your Microsoft 365 tenant identifier
2. **Site ID** - SharePoint site where compliance documents will be stored
3. **Drive ID** - Document library within the site
4. **Base Folder Name** - Root folder for organizing documents (default: "Compliance-Documents")

### How to Obtain SharePoint Details:

#### **Option 1: Microsoft Graph Explorer** (Recommended - No Installation Required)

**Step 1: Get Tenant ID**
1. Go to Azure Portal: https://portal.azure.com
2. Navigate to: **Azure Active Directory → Properties**
3. Copy the **Tenant ID** (also called Directory ID)
   - Example: `abc12345-def6-7890-ghij-klmnopqrstuv`

**Step 2: Get Site ID**
1. Open Microsoft Graph Explorer: https://developer.microsoft.com/en-us/graph/graph-explorer
2. Sign in with your Microsoft 365 admin account
3. Grant permissions when prompted (`Sites.Read.All`)
4. Run this query (replace with your values):
   ```
   GET https://graph.microsoft.com/v1.0/sites/{your-domain}.sharepoint.com:/sites/{your-site-name}
   ```
   **Example:**
   ```
   GET https://graph.microsoft.com/v1.0/sites/contoso.sharepoint.com:/sites/ComplianceHub
   ```
5. From the response, copy the entire **"id"** value
   - It will look like: `contoso.sharepoint.com,abc123...,def456...`

**Step 3: Get Drive ID**
1. In Graph Explorer, run this query (use the Site ID from Step 2):
   ```
   GET https://graph.microsoft.com/v1.0/sites/{SITE_ID_FROM_STEP_2}/drives
   ```
   **Example:**
   ```
   GET https://graph.microsoft.com/v1.0/sites/contoso.sharepoint.com,abc123...,def456.../drives
   ```
2. From the response, find your document library (usually named "Documents")
3. Copy the **"id"** value of that drive
   - Example: `b!xyz789...`

#### **Option 2: PowerShell** (For Advanced Users)

```powershell
# Install PnP PowerShell module (one-time setup)
Install-Module -Name PnP.PowerShell -Force

# Connect to your SharePoint site
Connect-PnPOnline -Url "https://your-domain.sharepoint.com/sites/your-site-name" -Interactive

# Get Site ID
$site = Get-PnPSite -Includes Id
$site.Id

# Get Drive ID (Document Library ID)
$list = Get-PnPList -Identity "Documents"
$list.Id
```

---

## Part 2: Microsoft Teams Configuration

### Required Information:
1. **Webhook URL** - Incoming webhook for your Teams channel
2. **Channel Name** - Name of the Teams channel (for reference only)

### How to Obtain Teams Webhook URL:

**Step 1: Create an Incoming Webhook in Teams**
1. Open **Microsoft Teams** desktop or web app
2. Navigate to the **channel** where you want to receive compliance notifications
3. Click the **three dots (•••)** next to the channel name
4. Select **Connectors** (or **Workflows** in newer Teams versions)

**Step 2a: For Classic Teams (Connectors)**
1. Search for **"Incoming Webhook"**
2. Click **Configure** (or **Add** if not already added)
3. Provide a **name** for the webhook (e.g., "Compliance System Notifications")
4. Optionally upload an **icon/image**
5. Click **Create**
6. **Copy the webhook URL** that appears
   - It will look like: `https://outlook.office.com/webhook/abc123.../IncomingWebhook/def456.../ghi789...`
7. Click **Done**

**Step 2b: For New Teams (Workflows)**
1. Click **Workflows**
2. Search for **"Post to a channel when a webhook request is received"**
3. Click **Add workflow**
4. Select the **Team** and **Channel**
5. Click **Add workflow**
6. **Copy the webhook URL** provided
   - Format: `https://prod-XX.xxx.logic.azure.com:443/workflows/...`
7. Click **Done**

**Step 3: Test the Webhook (Optional)**
You can test the webhook using PowerShell or curl:

```powershell
# PowerShell
$webhookUrl = "YOUR_WEBHOOK_URL_HERE"
$body = @{
    text = "Test message from Compliance Management System"
} | ConvertTo-Json

Invoke-RestMethod -Uri $webhookUrl -Method Post -Body $body -ContentType 'application/json'
```

```bash
# Bash/curl
curl -H "Content-Type: application/json" -d '{"text":"Test message from Compliance Management System"}' YOUR_WEBHOOK_URL_HERE
```

---

## Part 3: Notification Settings

Once configured, the system will support the following Teams notifications:

### Available Notification Types:
- **Daily Summary** - Overview of pending tasks (sent daily at configured time)
- **Overdue Task Alerts** - Immediate notifications for overdue compliance tasks
- **Task Completion Notifications** - Updates when tasks are completed
- **Weekly Reports** - Comprehensive weekly compliance status (sent on configured day)

You can configure which notifications to enable after the initial setup.

---

## What to Send Back

Please reply with the following information:

### SharePoint Configuration:
```
Tenant ID: [Your Tenant ID]
Site ID: [Your Site ID]
Drive ID: [Your Drive ID]
Base Folder Name: Compliance-Documents (or your preferred name)
```

### Teams Configuration:
```
Webhook URL: [Your Webhook URL]
Channel Name: [Your Channel Name]
```

### Notification Preferences (Optional):
```
Daily Summary: [Yes/No] at [Time, e.g., 9:00 AM]
Overdue Alerts: [Yes/No]
Completion Notifications: [Yes/No]
Weekly Reports: [Yes/No] on [Day, e.g., Monday]
Timezone: [e.g., Asia/Kolkata, America/New_York]
```

---

## Security Notes

- All credentials and IDs will be **encrypted** in our system
- The webhook URL should be treated as **confidential** (anyone with it can post to your channel)
- We recommend creating a **dedicated channel** for compliance notifications
- SharePoint permissions should follow your organization's **data governance policies**
- The system uses **Microsoft Graph API** with proper authentication and authorization

---

## Need Help?

If you encounter any issues obtaining these details or have questions about the setup process, please let us know. We can schedule a brief screen-sharing session to assist you.

Best regards,  
[Your Name]  
[Your Title]  
Compliance Management System Team

---

## Troubleshooting

### Common Issues:

**SharePoint:**
- **"Access Denied"** in Graph Explorer → Ensure you have `Sites.Read.All` permission
- **Site not found** → Verify the site URL is correct and accessible
- **Multiple drives returned** → Choose the one named "Documents" or your main document library

**Teams:**
- **Can't find Connectors/Workflows** → Ensure you have permissions to manage the channel
- **Webhook not working** → Check that the webhook wasn't deleted or disabled
- **No notifications received** → Verify the webhook URL is correct and the channel is active

---

*This document can be updated as needed. Last updated: January 2026*
