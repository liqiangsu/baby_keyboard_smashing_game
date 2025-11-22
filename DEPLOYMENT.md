# 🎮 Baby Keyboard Smashing Game - Deployment Guide

A fun, safe, and engaging keyboard and mouse game designed specifically for babies and toddlers (ages 6 months to 3 years).

## 🚀 Quick Deploy

### Deploy to GitHub Pages (Recommended)
**Free hosting with your GitHub account!**

1. Push code to GitHub repository
2. Go to Settings > Pages > Source: "GitHub Actions" 
3. Your game will be live at: `https://YOUR_USERNAME.github.io/baby_keyboard_smaing_game/`

[📖 **Detailed GitHub Pages Setup Guide →**](./GITHUB_PAGES.md)

### Deploy to Netlify
[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/YOUR_USERNAME/baby-keyboard-game)

### Deploy to Vercel
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/baby-keyboard-game)

## 📋 Prerequisites

- **Node.js**: v18.0.0 or higher
- **npm**: v8.0.0 or higher (comes with Node.js)
- Modern web browser with ES2015 support

## 🛠️ Local Development

1. **Clone and Install**
   ```bash
   git clone https://github.com/YOUR_USERNAME/baby-keyboard-game.git
   cd baby-keyboard-game
   npm install
   ```

2. **Start Development Server**
   ```bash
   npm run dev
   ```
   Opens automatically at `http://localhost:3000`
   
   Access from mobile devices on same network: `http://YOUR_IP:3000`

3. **Build for Production**
   ```bash
   npm run build
   ```
   Output generated in `/dist` directory

4. **Preview Production Build**
   ```bash
   npm run preview
   ```

## 🌐 Deployment Options

### 1. Netlify (Recommended)

**Automatic Deployment:**
1. Fork this repository
2. Connect to Netlify
3. Build settings are pre-configured in `netlify.toml`

**Manual Deployment:**
```bash
npm run build
npm run deploy:netlify
```

**Features:**
- ✅ Automatic builds on git push
- ✅ Branch previews
- ✅ CDN with global edge locations
- ✅ Security headers configured
- ✅ Asset optimization

### 2. Vercel

**Automatic Deployment:**
1. Import project to Vercel
2. Configuration in `vercel.json` handles the rest

**Manual Deployment:**
```bash
npm run build
npm run deploy:vercel
```

**Features:**
- ✅ Global CDN
- ✅ Automatic SSL
- ✅ Edge functions support
- ✅ Analytics included

### 3. GitHub Pages

1. **Enable GitHub Actions:**
   - Go to repository Settings > Actions > General
   - Enable "Allow all actions and reusable workflows"

2. **Configure GitHub Pages:**
   - Settings > Pages
   - Source: "GitHub Actions"

3. **Deploy:**
   Push to `main` branch triggers automatic deployment

### 4. Firebase Hosting

```bash
npm install -g firebase-tools
firebase login
firebase init hosting
npm run build
firebase deploy
```

### 5. AWS S3 + CloudFront

```bash
npm run build
aws s3 sync dist/ s3://your-bucket-name --delete
aws cloudfront create-invalidation --distribution-id YOUR_DIST_ID --paths "/*"
```

## 🔧 Environment Configuration

### Build Environment Variables

```bash
# .env.production
NODE_ENV=production
GENERATE_SOURCEMAP=false
VITE_APP_VERSION=1.0.0
```

### Netlify Environment Variables
Set in Netlify dashboard under Site settings > Environment variables:
- `NODE_VERSION`: `18`
- `NODE_ENV`: `production`

### Vercel Environment Variables
Configure in Vercel dashboard under Settings > Environment Variables:
- `NODE_ENV`: `production`
- `GENERATE_SOURCEMAP`: `false`

## 📊 Performance Optimization

### Build Analysis
```bash
npm run build:analyze
```

### Lighthouse Audit
```bash
npm install -g @lhci/cli
npm run build
lhci autorun
```

Performance targets:
- **Performance Score**: ≥ 80
- **Accessibility Score**: ≥ 90
- **Best Practices**: ≥ 85
- **SEO**: ≥ 80

## 🔐 Security Features

### Content Security Policy
```
default-src 'self'; 
script-src 'self' 'unsafe-inline'; 
style-src 'self' 'unsafe-inline'; 
img-src 'self' data: https:;
```

### Security Headers
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`

## 📱 Progressive Web App (PWA)

The game is PWA-ready with:
- ✅ Web App Manifest (`manifest.json`)
- ✅ Offline capabilities
- ✅ Add to Home Screen support
- ✅ Fullscreen mode for immersive experience
- ✅ Responsive design for all devices

### Install as PWA
1. Visit the deployed site
2. Browser will show "Add to Home Screen" option
3. Install for offline access

## 🧪 Testing

### Manual Testing Checklist
- [ ] Keyboard input creates shapes and sounds
- [ ] Mouse/touch creates particle trails
- [ ] Click effects work on mobile
- [ ] Parent controls accessible (Ctrl+Shift+P)
- [ ] Fullscreen mode works
- [ ] Audio plays after first interaction
- [ ] Accessibility features functional
- [ ] No browser shortcuts interfere

### Cross-Browser Testing
- ✅ Chrome (recommended)
- ✅ Firefox
- ✅ Safari
- ✅ Edge
- ✅ Mobile browsers (iOS Safari, Android Chrome)

## 📈 Analytics & Monitoring

### Performance Monitoring
```bash
# Lighthouse CI integration
npm run build
npx lhci autorun --upload.target=temporary-public-storage
```

### Error Tracking
Consider integrating:
- Sentry for error tracking
- Google Analytics for usage metrics
- Hotjar for user behavior analysis

## 🎯 SEO Optimization

### Meta Tags Included
- Open Graph for social sharing
- Twitter Cards
- Mobile viewport optimization
- Theme color for browser UI

### Sitemap Generation
```xml
<!-- Auto-generated sitemap.xml -->
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://yourdomain.com/</loc>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>
```

## 🐛 Troubleshooting

### Common Issues

**Build fails with Node.js errors:**
- Ensure Node.js v18+ is installed
- Clear npm cache: `npm cache clean --force`
- Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`

**Audio not working on mobile:**
- Audio requires user interaction on mobile browsers
- Game handles this automatically on first touch/click

**Canvas performance issues:**
- Device pixel ratio is limited to max 2x for performance
- Particle count auto-adjusts based on device capabilities

**Fullscreen not working:**
- Some browsers restrict fullscreen to user gestures
- Use the fullscreen button provided in the UI

### Debug Mode
Press `D` key during gameplay to enable debug information display.

## 📞 Support

- **Issues**: Create GitHub issue with detailed description
- **Features**: Submit feature request with use case
- **Security**: Email security concerns directly

## 📄 License

MIT License - See LICENSE file for details

## 🙏 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

---

**Built with ❤️ for babies and toddlers everywhere! 👶🎮**