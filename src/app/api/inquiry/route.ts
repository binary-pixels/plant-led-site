import { NextResponse } from 'next/server';
import { products } from '@/lib/products';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, company, product: productId, message } = body;

    if (!name || !email || !productId || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const product = products.find((p) => p.id === productId);
    const productName = product?.name?.en ?? productId;

    // Send email via Resend if configured
    const apiKey = process.env.RESEND_API_KEY;
    const inquiryEmail = process.env.INQUIRY_EMAIL;

    if (apiKey && inquiryEmail) {
      const { Resend } = await import('resend');
      const resend = new Resend(apiKey);

      await resend.emails.send({
        from: 'Inquiry <inquiry@greenledtech.com>',
        to: inquiryEmail,
        subject: `New Inquiry from ${name}`,
        html: `
          <h2>New Product Inquiry</h2>
          <table style="border-collapse:collapse;width:100%">
            <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Name</td><td style="padding:8px;border:1px solid #ddd">${name}</td></tr>
            <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Email</td><td style="padding:8px;border:1px solid #ddd">${email}</td></tr>
            <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Company</td><td style="padding:8px;border:1px solid #ddd">${company || 'N/A'}</td></tr>
            <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Product</td><td style="padding:8px;border:1px solid #ddd">${productName}</td></tr>
            <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Message</td><td style="padding:8px;border:1px solid #ddd">${message}</td></tr>
          </table>
        `,
      });
    } else {
      // Fallback: log to console
      console.log('=== New Inquiry ===');
      console.log('Name:', name);
      console.log('Email:', email);
      console.log('Company:', company || 'N/A');
      console.log('Product:', productName);
      console.log('Message:', message);
      console.log('===================');
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
