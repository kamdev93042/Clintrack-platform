# How to Upload clintrackapp to GitHub

## Step-by-Step Instructions

### Step 1: Create a GitHub Repository

1. Go to [GitHub.com](https://github.com) and sign in
2. Click the **"+"** icon in the top right corner
3. Select **"New repository"**
4. Fill in the details:
   - **Repository name**: `clintrackapp` (or any name you prefer)
   - **Description**: "Clintrack Mobile App - React Native/Expo Frontend"
   - **Visibility**: Choose **Public** or **Private**
   - **DO NOT** initialize with README, .gitignore, or license (we already have these)
5. Click **"Create repository"**

### Step 2: Add All Files to Git

Open PowerShell/Terminal in the `clintrackapp` folder and run:

```powershell
# Add all files (including new files and changes)
git add .

# Or if you want to be selective, add specific files:
git add app/
git add services/
git add config/
git add components/
git add package.json
git add package-lock.json
```

### Step 3: Commit Your Changes

```powershell
# Commit with a descriptive message
git commit -m "Initial commit: Clintrack mobile app frontend"
```

### Step 4: Connect to GitHub Repository

After creating the repository on GitHub, you'll see a page with setup instructions. Copy the repository URL (it will look like: `https://github.com/yourusername/clintrackapp.git`)

Then run:

```powershell
# Add the remote repository (replace with your actual repository URL)
git remote add origin https://github.com/yourusername/clintrackapp.git

# Verify it was added
git remote -v
```

### Step 5: Push to GitHub

```powershell
# Push to GitHub (first time)
git push -u origin master

# Or if your default branch is 'main':
git push -u origin main
```

**Note**: If GitHub created a `main` branch but your local branch is `master`, you can either:
- Rename your local branch: `git branch -M main` then `git push -u origin main`
- Or push to master: `git push -u origin master`

### Step 6: Verify Upload

1. Go to your GitHub repository page
2. Refresh the page
3. You should see all your files uploaded!

---

## Troubleshooting

### If you get authentication errors:

**Option 1: Use Personal Access Token**
1. Go to GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate new token with `repo` permissions
3. Use the token as password when pushing

**Option 2: Use GitHub CLI**
```powershell
# Install GitHub CLI, then:
gh auth login
```

### If you need to update files later:

```powershell
# After making changes:
git add .
git commit -m "Description of changes"
git push
```

### If you want to exclude certain files:

Make sure they're in `.gitignore` (already configured for node_modules, etc.)

---

## Quick Command Summary

```powershell
# Navigate to clintrackapp folder
cd clintrackapp

# Add all files
git add .

# Commit
git commit -m "Initial commit"

# Add remote (replace URL with yours)
git remote add origin https://github.com/yourusername/clintrackapp.git

# Push to GitHub
git push -u origin master
```

---

## Next: Upload Backend

After successfully uploading `clintrackapp`, you can follow the same steps for the `backend` folder:
1. Navigate to `backend` folder
2. Initialize git (if not already): `git init`
3. Create a new GitHub repository for backend
4. Follow the same steps above

