# 🚀 Deploy FireGEO to Coolify

This guide will help you deploy your **FireGEO** brand monitoring application to Coolify.

## Prerequisites

- ✅ Coolify instance set up (self-hosted or hosted)
- ✅ VPS with sufficient resources (2GB RAM minimum recommended)
- ✅ GitHub repository with your FireGEO code
- ✅ All required API keys (see environment variables section)

## 🌟 Why Coolify for FireGEO?

- **Cost Effective**: Host multiple projects on one VPS
- **Full Control**: Own your infrastructure and data
- **No Vendor Lock-in**: Self-hosted alternative to Vercel
- **SSL Included**: Automatic Let's Encrypt certificates
- **Perfect for Internal Tools**: Like your brand monitoring app

## 📋 Step-by-Step Deployment

### 1. Prepare Your Repository

Your FireGEO repository should already be on GitHub at:
`https://github.com/ignitabull18/firegeo`

### 2. Create New Project in Coolify

1. **Log into your Coolify dashboard**
2. **Click "Projects"** in the sidebar
3. **Click "Add"** to create a new project
4. **Name it**: `firegeo-brand-monitor` (or your preference)
5. **Add description**: `Brand monitoring tool with AI-powered analysis`
6. **Click "Continue"**

### 3. Add New Resource

1. **Select your project** → **Production environment**
2. **Click "Add a new resource"**
3. **Choose "Private Repository (with Github App)"**
4. **Connect your GitHub** (if not already connected):
   - Click "Register Github App"
   - Follow GitHub authentication flow
   - Install on your `firegeo` repository

### 4. Configure Application

1. **Select your GitHub connection**
2. **Choose repository**: `ignitabull18/firegeo`
3. **Select branch**: `main`
4. **Click "Load Repository"**

#### Build Configuration:
- **Build Pack**: `Nixpacks` (recommended)
- **Port**: `3000` (default Next.js port)
- **Install Command**: `npm install`
- **Build Command**: `npm run build`
- **Start Command**: `npm run start`

### 5. Environment Variables

⚠️ **CRITICAL**: Add these environment variables in the **Environment Variables** tab:

#### Required Variables:
```env
# Database - Your Supabase PostgreSQL
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.YOUR_PROJECT_REF.supabase.co:5432/postgres

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# App Configuration - UPDATE THIS TO YOUR DOMAIN
NEXT_PUBLIC_APP_URL=https://your-firegeo-domain.com

# AI Providers (REQUIRED for brand monitoring)
OPENAI_API_KEY=sk-proj-your_openai_key_here
ANTHROPIC_API_KEY=sk-ant-api03-your_anthropic_key_here
GOOGLE_GENERATIVE_AI_API_KEY=your_google_ai_key_here
PERPLEXITY_API_KEY=pplx-your_perplexity_key_here

# Firecrawl (REQUIRED for web scraping)
FIRECRAWL_API_KEY=fc-your_firecrawl_key_here

# Environment
NODE_ENV=production
```

#### How to Get Your API Keys:

1. **Supabase**: 
   - Go to your Supabase dashboard
   - Project Settings → API
   - Copy the URL and anon key

2. **OpenAI**: https://platform.openai.com/api-keys
3. **Anthropic**: https://console.anthropic.com/
4. **Google AI**: https://makersuite.google.com/app/apikey
5. **Perplexity**: https://www.perplexity.ai/settings/api
6. **Firecrawl**: https://www.firecrawl.dev/

### 6. Deploy!

1. **Review all settings**
2. **Click "Deploy"** 🚀
3. **Watch the build logs** in real-time
4. **Wait for deployment** to complete (usually 2-5 minutes)

### 7. Set Up Domain

1. **In your Coolify app dashboard**, go to **Domains** section
2. **Add your custom domain**: `yourdomain.com`
3. **Point your domain's DNS** to your server's IP:
   ```
   A record: @ → YOUR_SERVER_IP
   A record: www → YOUR_SERVER_IP
   ```
4. **Update environment variable**:
   - Change `NEXT_PUBLIC_APP_URL` to your domain
   - Click "Redeploy" to apply changes

## 🎯 Post-Deployment Checklist

### ✅ Test Core Functionality:
- [ ] App loads at your domain
- [ ] User registration/login works
- [ ] Brand monitor accepts URLs
- [ ] AI analysis completes successfully
- [ ] Company data displays correctly

### ✅ Security & Performance:
- [ ] SSL certificate is active (automatically by Coolify)
- [ ] Environment variables are secure
- [ ] Database connection works
- [ ] All API endpoints respond correctly

## 🔧 Configuration Tips

### Recommended VPS Specs:
- **2GB RAM minimum** (4GB recommended for better performance)
- **2 vCPU minimum**
- **40GB storage minimum**

### Performance Optimization:
```typescript
// next.config.ts - already optimized in your app
const nextConfig = {
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  images: {
    remotePatterns: [{ protocol: 'https', hostname: '**' }]
  }
}
```

### Monitoring:
- Use Coolify's built-in resource monitoring
- Check logs via Coolify dashboard
- Monitor Supabase usage in Supabase dashboard

## 🚨 Troubleshooting

### Build Fails:
1. **Check environment variables** are all set
2. **Verify API keys** are valid and not expired  
3. **Check build logs** for specific errors
4. **Ensure Node.js version** compatibility (18+ recommended)

### App Won't Start:
1. **Verify port 3000** is configured
2. **Check start command**: `npm run start`
3. **Verify database connection** string
4. **Check Supabase credentials**

### Brand Monitor Not Working:
1. **Verify all AI provider API keys** are set and valid
2. **Check Firecrawl API key** is working
3. **Test API endpoints** individually
4. **Check browser console** for JavaScript errors

## 🎉 Success!

Your **FireGEO brand monitoring tool** is now:
- ✅ **Live and accessible** at your custom domain
- ✅ **Automatically SSL secured** 
- ✅ **Self-hosted on your infrastructure**
- ✅ **Ready for internal team usage**
- ✅ **Scalable and maintainable**

## 📞 Need Help?

- **Coolify Documentation**: https://coolify.io/docs
- **FireGEO Repository**: https://github.com/ignitabull18/firegeo
- **Check Coolify Logs**: For deployment issues
- **Verify Environment Variables**: Most issues are env-related

---

**🔥 Your brand monitoring tool is now live and ready to analyze competitors!** 

Share the URL with your team and start monitoring your industry! 🎯 