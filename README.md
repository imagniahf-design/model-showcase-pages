# 🎯 3D Model Showcase

A modern, professional 3D model showcase website with AR support, folder organization, and multiple storage options.

## ✨ Features

### 🎨 **Modern Design**
- Professional dark theme with glassmorphism effects
- Responsive design for desktop and mobile
- Smooth animations and futuristic typography
- Clean, minimal interface

### 📁 **Advanced Folder System**
- **Model Folders**: Organize your 3D models into custom folders
- **Model Page Folders**: Create separate folders for individual model pages
- **Favorites System**: Star/unstar your favorite models
- **Folder Management**: Create, delete, and move folders easily

### 🚀 **Multiple Storage Options**
- **GitHub Pages** (Recommended): Store models directly in your GitHub repository
- **Cloudflare R2**: Use Cloudflare's object storage for high performance
- **Local Storage**: Keep everything in your browser for offline use

### 🎯 **3D Model Features**
- **Interactive 3D Viewer**: Rotate, zoom, and explore models
- **AR Support**: 
  - **iOS**: Quick Look AR with proper scaling
  - **Android**: Scene Viewer with stable placement
- **Model Pages**: Generate individual pages for each model
- **Share Links**: Create shareable URLs for your models

### 🔧 **Admin Panel**
- **Password Protected**: Secure access with multiple password options
- **Drag & Drop Upload**: Easy file upload for .glb and .usdz files
- **Batch Operations**: Publish all models at once
- **Real-time Status**: See upload and publishing status

## 🚀 Quick Start

### 1. **Fork this Repository**
Click the "Fork" button in the top right corner of this page.

### 2. **Enable GitHub Pages**
1. Go to your repository settings
2. Scroll down to "Pages" section
3. Select "GitHub Actions" as the source
4. The site will be available at `https://yourusername.github.io/3d-model-showcase`

### 3. **Configure Storage**
1. Visit your deployed website
2. Login with any password: `My birthday1.`, `admin`, `password`, `123`, or leave empty
3. Go to "Storage Settings"
4. Choose your preferred storage method:
   - **GitHub Pages**: Enter your GitHub token, username, and repository name
   - **Cloudflare R2**: Enter your Cloudflare credentials
   - **Local Storage**: No configuration needed

### 4. **Upload Your First Model**
1. Drag and drop your .glb and .usdz files
2. The system will automatically create a preview
3. Click "Publish" to upload to your chosen storage

## 📁 Folder Organization

### **Creating Folders**
- **Model Folders**: Click "📁 Create Folder" to organize your 3D models
- **Model Page Folders**: Click "📄 Create Model Page Folder" for individual pages
- **Custom Colors**: Each folder can have its own color theme

### **Managing Models**
- **Move Models**: Use the "📁" button to move models between folders
- **Star Models**: Click "💛" to add to favorites
- **Generate Pages**: Click "📄 Generate Model Pages" to create individual HTML pages

## 🔧 Configuration

### **GitHub Pages Setup**
1. Create a Personal Access Token:
   - Go to GitHub Settings → Developer settings → Personal access tokens
   - Generate new token with `repo` and `workflow` permissions
2. Enter your credentials in the admin panel
3. Models will be stored in your GitHub repository

### **Cloudflare R2 Setup**
1. Create a Cloudflare R2 bucket
2. Configure CORS policy (see admin panel for details)
3. Enter your credentials in the admin panel

## 🎯 Usage

### **For Model Creators**
1. Upload your .glb and .usdz files
2. Organize into folders
3. Publish to your chosen storage
4. Share the generated links

### **For Viewers**
1. Visit the shared model link
2. Interact with the 3D model
3. Use AR on mobile devices
4. Share with others

## 🛠️ Technical Details

### **File Structure**
```
├── index.html          # Main admin panel
├── model.html          # Model viewer template
├── script.js           # All functionality
├── styles.css          # Modern styling
├── .github/workflows/  # GitHub Pages deployment
└── README.md          # This file
```

### **Supported Formats**
- **GLB**: 3D model files (recommended)
- **USDZ**: iOS AR files
- **Images**: Preview posters (auto-generated)

### **Browser Support**
- Chrome, Firefox, Safari, Edge
- Mobile browsers with AR support
- iOS Safari (Quick Look AR)
- Android Chrome (Scene Viewer)

## 🔒 Security

- **Password Protection**: Multiple password options for easy access
- **Local Storage**: All data stored in your browser
- **No Server Required**: Fully client-side application
- **Secure Tokens**: GitHub tokens stored locally only

## 🎨 Customization

### **Themes**
- Dark theme with glassmorphism effects
- Customizable folder colors
- Responsive design for all devices

### **Model Pages**
- Individual HTML pages for each model
- Custom styling and branding
- Shareable URLs

## 📱 Mobile Support

- **Responsive Design**: Works on all screen sizes
- **AR Integration**: Native AR support on iOS and Android
- **Touch Controls**: Optimized for touch interaction
- **Fast Loading**: Optimized for mobile networks

## 🚀 Deployment Options

1. **GitHub Pages** (Recommended)
   - Free hosting
   - Automatic deployments
   - Custom domain support

2. **Vercel**
   - Fast global CDN
   - Automatic deployments
   - Serverless functions

3. **Netlify**
   - Easy deployment
   - Form handling
   - Edge functions

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

This project is open source and available under the MIT License.

## 🆘 Support

If you encounter any issues:
1. Check the browser console for errors
2. Verify your storage credentials
3. Ensure your files are in the correct format (.glb and .usdz)

## 🎯 Features Roadmap

- [ ] Model editing capabilities
- [ ] Advanced AR features
- [ ] Model analytics
- [ ] Custom themes
- [ ] API integration
- [ ] Batch model processing

---

**Made with ❤️ for 3D model enthusiasts**

*Your 3D models deserve a professional showcase!*