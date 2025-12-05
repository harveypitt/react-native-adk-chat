# Documentation

Welcome to the React Native ADK Chat documentation! This guide will help you find the right documentation for your needs.

## 📚 Available Guides

### 🎯 [Agent Engine Integration Guide](./AGENT_ENGINE_INTEGRATION.md)
**→ Start here if you have an Agent Engine deployment**

The complete, in-depth guide for developers who already have an ADK agent deployed to Google Cloud Agent Engine and want to connect it to a React Native mobile app.

**Includes:**
- Prerequisites and architecture overview
- Step-by-step proxy server setup
- Mobile app configuration
- Production deployment instructions
- Comprehensive troubleshooting
- Advanced customization options

**Time to complete:** 30-60 minutes

---

### ⚡ [Quick Reference](./QUICK_REFERENCE.md)
**→ Use this for quick lookups and commands**

A concise reference guide with everything you need at your fingertips.

**Includes:**
- Architecture diagrams
- Command reference (proxy, mobile, gcloud)
- Common issues & solutions
- API quick reference
- Environment variables table
- Component usage examples
- Performance tips

**Perfect for:** Developers who have already completed setup and need quick answers.

---

### ✅ [Setup Checklist](./SETUP_CHECKLIST.md)
**→ Track your integration progress**

A print-friendly checklist to ensure you don't miss any steps during integration.

**Includes:**
- Prerequisites checklist
- Step-by-step setup tasks
- Testing verification steps
- Production deployment checklist
- Troubleshooting verification
- Quick command reference
- Space for notes

**Perfect for:** First-time setup, onboarding new team members, or ensuring nothing is missed.

---

### 🚀 [Quick Start Guide](./QUICKSTART.md)
**→ For local development and testing**

Get the demo app running quickly with a local ADK agent (not Agent Engine).

**Perfect for:** Trying out the package before deploying to Agent Engine.

---

### 🛠️ [ADK Setup Guide](./adk-setup.md)
**→ Detailed ADK configuration**

In-depth guide for configuring your ADK agent and understanding the ADK architecture.

**Perfect for:** Understanding ADK concepts and local development.

---

### 📋 [MVP PRD](./prd-mvp.md)
**→ Product requirements and design decisions**

The original product requirements document outlining the vision, features, and technical decisions.

**Perfect for:** Understanding the project goals and design philosophy.

---

## 🗺️ Navigation Flow

```
Start Here
    │
    ├─ Already have Agent Engine deployment?
    │  └─► Agent Engine Integration Guide
    │      └─► Use Quick Reference for commands
    │      └─► Use Setup Checklist to track progress
    │
    ├─ Want to try locally first?
    │  └─► Quick Start Guide
    │      └─► ADK Setup Guide (for details)
    │
    └─ Want to understand the project?
       └─► MVP PRD
```

## 🎯 By Use Case

### "I want to connect my Agent Engine deployment to a mobile app"
1. Start: [Agent Engine Integration Guide](./AGENT_ENGINE_INTEGRATION.md)
2. Reference: [Quick Reference](./QUICK_REFERENCE.md)
3. Track: [Setup Checklist](./SETUP_CHECKLIST.md)

### "I'm evaluating this package and want to test locally"
1. Start: [Quick Start Guide](./QUICKSTART.md)
2. Details: [ADK Setup Guide](./adk-setup.md)

### "I need help with a specific issue"
1. Check: [Quick Reference - Common Issues](./QUICK_REFERENCE.md#common-issues--solutions)
2. Deep dive: [Integration Guide - Troubleshooting](./AGENT_ENGINE_INTEGRATION.md#troubleshooting)

### "I want to integrate into my existing React Native app"
1. Setup proxy: [Integration Guide - Step 2](./AGENT_ENGINE_INTEGRATION.md#step-2-configure-proxy-server)
2. Install package: [Integration Guide - Step 4](./AGENT_ENGINE_INTEGRATION.md#step-4-integrate-into-your-app)
3. API Reference: [Quick Reference - API](./QUICK_REFERENCE.md#-api-quick-reference)

### "I'm deploying to production"
1. Guide: [Integration Guide - Step 5](./AGENT_ENGINE_INTEGRATION.md#step-5-deploy-to-production)
2. Checklist: [Setup Checklist - Production](./SETUP_CHECKLIST.md#-production-preparation)

## 📖 Reading Order

### For First-Time Users
1. [Agent Engine Integration Guide](./AGENT_ENGINE_INTEGRATION.md) - Read through completely
2. [Setup Checklist](./SETUP_CHECKLIST.md) - Print and follow along
3. [Quick Reference](./QUICK_REFERENCE.md) - Bookmark for later

### For Experienced Developers
1. [Quick Reference](./QUICK_REFERENCE.md) - Skim for architecture and commands
2. [Integration Guide](./AGENT_ENGINE_INTEGRATION.md) - Jump to specific sections as needed
3. [Setup Checklist](./SETUP_CHECKLIST.md) - Verify nothing is missed

## 🔗 External Resources

- **[Google ADK Documentation](https://google.github.io/adk-docs/)** - Official ADK docs
- **[Agent Engine Deployment](https://google.github.io/adk-docs/deploy/agent-engine/)** - How to deploy your agent
- **[Expo Documentation](https://docs.expo.dev/)** - React Native with Expo
- **[Google Cloud Console](https://console.cloud.google.com/)** - Manage your GCP project

## 💡 Tips

- **Start with prerequisites**: Make sure you have everything before starting
- **Follow in order**: The guides are designed to be followed sequentially
- **Test as you go**: Don't skip the testing steps
- **Keep notes**: Use the Setup Checklist to track your configuration details
- **Bookmark Quick Reference**: You'll use it often after initial setup

## 🆘 Need Help?

1. **Check documentation first**: Most questions are answered in the guides
2. **Review troubleshooting**: Common issues have documented solutions
3. **Test components**: Use curl to isolate issues
4. **Check logs**: Proxy server and Cloud Run logs are helpful
5. **Open an issue**: [GitHub Issues](https://github.com/your-username/react-native-adk-chat/issues)

## 📝 Contributing

Found an error or want to improve the documentation? We welcome contributions!

1. Fork the repository
2. Make your changes
3. Submit a pull request

---

**Ready to get started?** → [Agent Engine Integration Guide](./AGENT_ENGINE_INTEGRATION.md)