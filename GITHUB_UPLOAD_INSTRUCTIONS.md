# How to Upload PropertyFlows to GitHub

## Step 1: Download Your Code from Replit

1. In the Replit workspace, go to the **Files** panel on the left
2. Click the three dots menu (⋮) at the top
3. Select **Download as zip**
4. Save the zip file to your computer
5. Extract the zip file to a folder (e.g., `propertyflows`)

## Step 2: Create a New GitHub Repository

1. Go to [GitHub](https://github.com) and log in
2. Click the **+** icon in the top right corner
3. Select **New repository**
4. Fill in the details:
   - **Repository name**: `propertyflows` (or your preferred name)
   - **Description**: "Property Management SaaS Platform with AI-powered operations"
   - **Visibility**: Choose Private or Public
   - **DO NOT** initialize with README (we already have one)
5. Click **Create repository**

## Step 3: Upload Code to GitHub

### Option A: Using GitHub Web Interface (Easiest)

1. On your new repository page, click **uploading an existing file**
2. Drag and drop all the files from your extracted folder
3. Scroll down and click **Commit changes**

### Option B: Using Git Command Line (Recommended)

Open a terminal in your extracted `propertyflows` folder and run:

```bash
# Initialize git repository
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: PropertyFlows subscription system complete"

# Add your GitHub repository as remote (replace with your repo URL)
git remote add origin https://github.com/YOUR_USERNAME/propertyflows.git

# Push to GitHub
git branch -M main
git push -u origin main
```

**Note**: Replace `YOUR_USERNAME` with your actual GitHub username.

## Step 4: Verify Upload

1. Refresh your GitHub repository page
2. You should see all your files, including:
   - `README.md` with full documentation
   - `client/` folder with React frontend
   - `server/` folder with Express backend
   - `shared/` folder with schema
   - `.gitignore` file

## Step 5: Configure Repository Settings (Optional)

### Add Topics
1. Go to your repository on GitHub
2. Click the **⚙️ gear icon** next to "About"
3. Add topics: `property-management`, `saas`, `typescript`, `react`, `stripe`, `ai`

### Set Up Branch Protection
1. Go to **Settings** → **Branches**
2. Click **Add rule**
3. Branch name pattern: `main`
4. Check: "Require pull request reviews before merging"

### Add Secrets (for CI/CD)
1. Go to **Settings** → **Secrets and variables** → **Actions**
2. Add repository secrets for environment variables:
   - `DATABASE_URL`
   - `STRIPE_SECRET_KEY`
   - `RESEND_API_KEY`
   - etc.

## Step 6: Clone Repository (For Development)

To work on your code from another computer:

```bash
git clone https://github.com/YOUR_USERNAME/propertyflows.git
cd propertyflows
npm install
npm run db:push
npm run dev
```

## Need Help?

- [GitHub Docs](https://docs.github.com)
- [Git Basics](https://git-scm.com/book/en/v2/Getting-Started-Git-Basics)
- [GitHub Desktop](https://desktop.github.com) - GUI alternative to command line

---

**Your code is now safely backed up on GitHub!** 🎉
