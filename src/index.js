import puppeteer from "@cloudflare/puppeteer";

async function checkForSales(request, env) {
	// If request is undefined (scheduled run), use default URL
	const url = request ? 
		new URL(request.url).searchParams.get("url") : 
		"https://www.dwr.com";  // Your default URL

	if (!url) {
		return new Response("Please add an ?url=https://example.com/ parameter");
	}
	try {
		// 1. Take screenshot
		const browser = await puppeteer.launch(env.BROWSER);
		const page = await browser.newPage();

		// Set viewport
		await page.setViewport({ width: 800, height: 1000 });
		// Navigate with just 'load' condition
		await page.goto(url, {
			waitUntil: ['domcontentloaded', 'networkidle0', 'load'],
		});

		const screenshot = await page.screenshot({
			type: 'jpeg',
			quality: 80,
			fullPage: false
		});

		const base64Screenshot = Buffer.from(screenshot).toString('base64');
		console.log('Base64 length:', base64Screenshot.length);

		await browser.close();

		// 2. Analyze with AI

		const prompt = `Look at the text in this screenshot and tell me if there are any sales, 
		discounts, or special offers on the page. If yes, describe the details 
		of the sale. If no, just say "None found"`;

		const result = await env.AI.run('@cf/llava-hf/llava-1.5-7b-hf', {
			image: [...new Uint8Array(screenshot)],
			prompt: prompt,
			max_tokens: 1000,
		});

		// 3. Send email with screenshot
		const hasSale = !result.description.includes('None found');
		const emailSubject = hasSale ?
			'🔥 Sale Alert: Discounts Found!' :
			'Sale Monitor: No Sales Today';

		const emailPayload = {
			from: 'onboarding@resend.dev',
			to: env.MY_EMAIL_ADDRESS,
			subject: emailSubject,
			text: `
Website: ${url}
Analysis: ${result.description}
Timestamp: ${new Date().toISOString()}
				`.trim(),
			attachments: [{
				filename: 'screenshot.jpg',
				content: base64Screenshot,
				type: 'image/jpeg'  // Add MIME type
			}]
		};


		const sentEmail = await fetch('https://api.resend.com/emails', {
			method: 'POST',
			headers: {
				'Authorization': `Bearer ${env.RESEND_API_KEY}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(emailPayload)
		});

		// Different responses for HTTP vs scheduled
		if (request) {
			// For HTTP requests, return the screenshot
			return new Response(screenshot, {
			  headers: {
				"content-type": "image/jpeg",
			  },
			});
		  } else {
			// For scheduled runs, return a status report
			return new Response(JSON.stringify({
			  success: true,
			  timestamp: new Date().toISOString(),
			  url: url,
			  hasSale: hasSale,
			  analysisResult: result.description,
			  emailSent: sentEmail.ok
			}), {
			  headers: {
				"content-type": "application/json"
			  }
			});
		  }

	} catch (error) {
		console.error('Monitoring failed:', error)
		return new Response(JSON.stringify({
			success: false,
			error: error.message
		}), {
			status: 500,
			headers: { 'Content-Type': 'application/json' }
		})
	}
}

export default {
	async scheduled(event, env, ctx) {
		return await checkForSales(env);
	},

	async fetch(request, env, ctx) {
		const url = new URL(request.url);

		// Only allow POST to /check-sales for security
		if (request.method === 'POST' && url.pathname === '/check-sales') {
			return await checkForSales(request, env);
		}

		return new Response('Method not allowed', { status: 405 });
	}
}