import { NextRequest, NextResponse } from 'next/server'
import { mockDb } from '@/lib/mock-data'

function generateWebsiteHTML(businessName: string, category: string, description: string, theme: string): string {
  const themes: Record<string, { primary: string; secondary: string; accent: string; gradient: string }> = {
    modern: { primary: '#0f3460', secondary: '#16213e', accent: '#e94560', gradient: 'linear-gradient(135deg, #0f3460 0%, #16213e 100%)' },
    vibrant: { primary: '#6c5ce7', secondary: '#a29bfe', accent: '#fd79a8', gradient: 'linear-gradient(135deg, #6c5ce7 0%, #a29bfe 100%)' },
    nature: { primary: '#00b894', secondary: '#00cec9', accent: '#fdcb6e', gradient: 'linear-gradient(135deg, #00b894 0%, #00cec9 100%)' },
    bold: { primary: '#2d3436', secondary: '#636e72', accent: '#d63031', gradient: 'linear-gradient(135deg, #2d3436 0%, #636e72 100%)' },
  }

  const t = themes[theme] || themes.modern

  const services = [
    { title: 'Professional Service', desc: `Expert ${category.toLowerCase()} solutions tailored to your needs` },
    { title: 'Quality Assurance', desc: 'Committed to delivering the highest quality results' },
    { title: 'Customer Support', desc: '24/7 dedicated support for all your requirements' },
  ]

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${businessName}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1a1a2e; line-height: 1.6; }
    .hero { background: ${t.gradient}; color: white; padding: 100px 20px; text-align: center; min-height: 60vh; display: flex; flex-direction: column; justify-content: center; align-items: center; }
    .hero h1 { font-size: 3rem; margin-bottom: 20px; font-weight: 800; letter-spacing: -1px; }
    .hero .tagline { font-size: 1.3rem; opacity: 0.9; max-width: 600px; margin-bottom: 32px; }
    .hero .badge { display: inline-block; background: ${t.accent}; color: white; padding: 6px 16px; border-radius: 20px; font-size: 0.85rem; font-weight: 600; margin-bottom: 20px; text-transform: uppercase; letter-spacing: 1px; }
    .hero .cta { display: inline-block; background: white; color: ${t.primary}; padding: 14px 32px; border-radius: 8px; font-weight: 700; text-decoration: none; font-size: 1.05rem; transition: transform 0.2s; }
    .hero .cta:hover { transform: translateY(-2px); }
    .section { padding: 80px 20px; max-width: 1100px; margin: 0 auto; }
    .section:nth-child(even) { background: #f8f9fa; }
    .section h2 { font-size: 2rem; margin-bottom: 40px; color: ${t.primary}; text-align: center; }
    .services-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 30px; }
    .service-card { background: white; padding: 40px 30px; border-radius: 16px; text-align: center; box-shadow: 0 4px 20px rgba(0,0,0,0.06); transition: transform 0.2s, box-shadow 0.2s; }
    .service-card:hover { transform: translateY(-4px); box-shadow: 0 8px 30px rgba(0,0,0,0.1); }
    .service-card .icon { width: 60px; height: 60px; background: ${t.gradient}; border-radius: 16px; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; }
    .service-card h3 { font-size: 1.2rem; margin-bottom: 12px; color: ${t.secondary}; }
    .service-card p { color: #666; font-size: 0.95rem; }
    .about { text-align: center; }
    .about p { font-size: 1.1rem; color: #555; max-width: 700px; margin: 0 auto; }
    .contact { background: ${t.primary}; color: white; text-align: center; padding: 80px 20px; }
    .contact h2 { color: white; }
    .contact p { opacity: 0.9; margin-bottom: 24px; font-size: 1.1rem; }
    .contact .btn { display: inline-block; background: ${t.accent}; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 700; }
    .footer { background: ${t.secondary}; color: white; text-align: center; padding: 30px 20px; font-size: 0.9rem; opacity: 0.8; }
  </style>
</head>
<body>
  <section class="hero">
    <span class="badge">${category}</span>
    <h1>${businessName}</h1>
    <p class="tagline">${description}</p>
    <a href="#contact" class="cta">Get in Touch</a>
  </section>
  <section class="section">
    <h2>What We Offer</h2>
    <div class="services-grid">
      ${services.map(s => `
      <div class="service-card">
        <div class="icon">✦</div>
        <h3>${s.title}</h3>
        <p>${s.desc}</p>
      </div>`).join('')}
    </div>
  </section>
  <section class="section about">
    <h2>About Us</h2>
    <p>${description}. We are passionate about delivering exceptional value and building lasting relationships with our clients across Tanzania and beyond.</p>
  </section>
  <section class="contact" id="contact">
    <h2>Ready to Get Started?</h2>
    <p>Contact us today and let's bring your vision to life.</p>
    <a href="mailto:info@${businessName.toLowerCase().replace(/\s+/g, '')}.com" class="btn">Contact Us</a>
  </section>
  <div class="footer">
    <p>&copy; ${new Date().getFullYear()} ${businessName}. All rights reserved. Powered by DomainHub.</p>
  </div>
</body>
</html>`
}

// POST /api/builder/generate - Generate AI website
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { businessName, category, description, theme, userId } = body

    if (!businessName || !category || !description) {
      return NextResponse.json({ error: 'Business name, category, and description are required' }, { status: 400 })
    }

    const html = generateWebsiteHTML(businessName, category, description, theme || 'modern')

    // Save to mock store
    const website = await mockDb.website.create({
      userId: userId || 'demo',
      businessName,
      category,
      description,
      htmlContent: html,
      theme: theme || 'modern',
      status: 'draft',
    })

    return NextResponse.json({
      website: { id: website.id, ...website },
      html,
    })
  } catch (error) {
    console.error('Website generation error:', error)
    return NextResponse.json({ error: 'Failed to generate website' }, { status: 500 })
  }
}

// GET /api/builder - List user websites
export async function GET() {
  try {
    const websites = await mockDb.website.findMany()

    return NextResponse.json({ websites })
  } catch (error) {
    console.error('Websites fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch websites' }, { status: 500 })
  }
}

// PATCH /api/builder - Update website
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { websiteId, htmlContent, status, businessName, category, description } = body

    const website = await mockDb.website.update({
      where: { id: websiteId },
      data: {
        ...(htmlContent && { htmlContent }),
        ...(status && { status }),
        ...(businessName && { businessName }),
        ...(category && { category }),
        ...(description && { description }),
      },
    })

    return NextResponse.json({ website })
  } catch (error) {
    console.error('Website update error:', error)
    return NextResponse.json({ error: 'Failed to update website' }, { status: 500 })
  }
}
