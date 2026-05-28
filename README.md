The left panel is width: '46%', height: '100vh'. So the ideal image size for the carousel is: Recommended image size: 920 × 1080px (portrait) Here's the breakdown: The panel is 46% of viewport width — on a typical 1920px screen that's ~883px wide Height is 100vh — typically 1080px on a standard monitor Aspect ratio is roughly 9:11 (portrait/tall) For best results: Minimum: 800 × 900px Ideal: 920 × 1080px or 1000 × 1200px Format: JPG or WebP for photos, PNG for graphics Orientation: Portrait (taller than wide) The images fill the full panel with objectFit: cover behavior, so the center of the image is what shows — keep the main subject centered 




6527 6589 0000 1005
Here's exactly how to create a super admin account:
Step 1 — Create the Auth account
Go to console.firebase.google.com → your project
Left sidebar → Authentication → Users tab
Click "Add user"
Enter email + password → Add user
Copy the UID shown in the users list
Step 2 — Create the Firestore document
Left sidebar → Firestore Database → Data tab
Click "+ Start collection"
Collection ID: superAdmins → Next
Document ID: paste the UID you copied
Add these fields:
Field	Type	Value
email	string	your email
dashboardRole	string	superadmin
createdAt	timestamp	(click the timestamp option, pick today)
- `email`: your email (string)
   - `role`: "superadmin" (string)
   - `createdAt`: current timestamp
   - `permissions`: (map)
     - `readAllWorkspaces`: true (boolean)
     - `readAllUsers`: true (boolean)
     - `manageFeedback`: true (boolean)
     - `manageOrganizations`: true (boolean)
