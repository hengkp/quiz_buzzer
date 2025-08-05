# GitHub Actions Deployment Guide

This guide explains how to deploy your Quiz Buzzer using GitHub Actions while keeping files organized in the `/pages` folder.

## 🚀 How It Works

The GitHub Actions workflow automatically:
1. **Copies files** from `/pages` to the root directory
2. **Deploys** to the `gh-pages` branch
3. **Triggers** on every push to the `main` branch

## 📋 Setup Steps

### 1. Repository Structure

Your repository should look like this:
```
quiz_buzzer/
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Actions workflow
├── pages/                      # Your website files
│   ├── among_us.html
│   ├── console.html
│   ├── firebase-config.js
│   ├── setup.js
│   ├── index.html              # Redirect to main game
│   ├── .nojekyll               # Disable Jekyll processing
│   ├── js/
│   ├── css/
│   ├── assets/
│   └── README.md
├── web/                        # Original Flask version
├── arduino/                    # Arduino code
└── README.md                   # Main project README
```

### 2. Configure GitHub Pages

1. **Go to your repository on GitHub**
2. **Navigate to Settings → Pages**
3. **Configure the source:**
   - **Source:** "Deploy from a branch"
   - **Branch:** `gh-pages`
   - **Folder:** `/ (root)`
   - Click **"Save"**

### 3. Push Your Changes

```bash
git add .
git commit -m "Add GitHub Actions deployment"
git push origin main
```

### 4. Monitor Deployment

1. **Check the Actions tab** on GitHub
2. **Look for the "Deploy Quiz Buzzer to GitHub Pages" workflow**
3. **Wait for it to complete** (usually 1-2 minutes)
4. **Your site will be available** at the URL shown in the workflow output

## 🔧 Workflow Details

### What the GitHub Action Does

```yaml
name: Deploy Quiz Buzzer to GitHub Pages

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout repository
      uses: actions/checkout@v4
      
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        
    - name: Copy pages to root for deployment
      run: |
        cp -r pages/* .
        
    - name: Deploy to GitHub Pages
      uses: peaceiris/actions-gh-pages@v3
      with:
        github_token: ${{ secrets.GITHUB_TOKEN }}
        publish_dir: ./
```

### Key Features

- **Automatic deployment** on every push to main
- **Node.js support** for any dependencies in `/pages`
- **File copying** from `/pages` to root
- **Clean deployment** to `gh-pages` branch
- **Status reporting** with deployment URL

## 🎯 Benefits of This Approach

### ✅ Advantages

1. **Organized Structure**: Keep website files in `/pages` folder
2. **Automatic Deployment**: No manual steps required
3. **Version Control**: Track changes in the main branch
4. **Clean Separation**: Website files separate from development files
5. **Easy Updates**: Just push to main to update the site

### 🔄 Workflow

1. **Make changes** to files in `/pages/`
2. **Commit and push** to main branch
3. **GitHub Actions** automatically deploys
4. **Site updates** within 1-2 minutes

## 🛠️ Customization

### Modify the Workflow

Edit `.github/workflows/deploy.yml` to customize:

```yaml
# Change trigger conditions
on:
  push:
    branches: [ main, develop ]  # Deploy from multiple branches

# Add build steps
- name: Build assets
  run: |
    cd pages
    npm run build

# Custom deployment settings
- name: Deploy to GitHub Pages
  uses: peaceiris/actions-gh-pages@v3
  with:
    github_token: ${{ secrets.GITHUB_TOKEN }}
    publish_dir: ./
    force_orphan: true          # Clean deployment
    user_name: 'Your Name'      # Custom commit author
```

### Environment Variables

Add secrets in GitHub repository settings:

1. **Go to Settings → Secrets and variables → Actions**
2. **Add repository secrets** if needed
3. **Reference them** in the workflow:

```yaml
- name: Use secret
  run: echo ${{ secrets.MY_SECRET }}
```

## 🐛 Troubleshooting

### Common Issues

**1. Workflow Not Triggering**
- Check that you're pushing to the `main` branch
- Verify the workflow file is in `.github/workflows/`
- Check the Actions tab for errors

**2. Files Not Copying**
- Ensure files exist in the `/pages` directory
- Check workflow logs for copy errors
- Verify file permissions

**3. Deployment Failing**
- Check GitHub Pages settings (gh-pages branch)
- Verify repository permissions
- Look for error messages in workflow logs

**4. Site Not Updating**
- Wait 1-2 minutes for deployment
- Check the gh-pages branch for new commits
- Clear browser cache

### Debug Commands

Add these to the workflow for debugging:

```yaml
- name: Debug information
  run: |
    echo "Current directory: $(pwd)"
    echo "Files in pages/:"
    ls -la pages/
    echo "Files in root:"
    ls -la
```

## 📊 Monitoring

### GitHub Actions

- **Check Actions tab** for workflow status
- **View logs** for detailed information
- **Monitor deployment time** and success rate

### GitHub Pages

- **Settings → Pages** shows deployment status
- **View site** button to test the deployment
- **Custom domain** configuration if needed

## 🔄 Updating Your Site

### Regular Updates

1. **Edit files** in the `/pages` folder
2. **Test locally** if needed
3. **Commit changes**:
   ```bash
   git add pages/
   git commit -m "Update website content"
   git push origin main
   ```
4. **Wait for deployment** (1-2 minutes)
5. **Check the site** for updates

### Major Changes

1. **Update workflow** if needed
2. **Test locally** thoroughly
3. **Push changes** and monitor deployment
4. **Verify functionality** on the live site

## 🎉 Success!

Once configured, your workflow will:

- ✅ **Automatically deploy** on every push
- ✅ **Keep files organized** in `/pages`
- ✅ **Provide clean URLs** for your site
- ✅ **Enable easy updates** and maintenance

Your Quiz Buzzer will be available at:
`https://username.github.io/repository-name/`

## 📞 Support

If you encounter issues:

1. **Check workflow logs** in the Actions tab
2. **Verify GitHub Pages settings**
3. **Review this documentation**
4. **Check GitHub Actions documentation**
5. **Open an issue** on GitHub for help 