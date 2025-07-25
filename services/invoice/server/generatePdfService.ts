import { NextRequest, NextResponse } from "next/server";

// Chromium
import chromium from "@sparticuz/chromium";

// Helpers
import { getInvoiceTemplate } from "@/lib/helpers";

// Variables
import { CHROMIUM_EXECUTABLE_PATH, ENV } from "@/lib/variables";

// Types
import { InvoiceType } from "@/types";

/**
 * Generate a PDF document of an invoice based on the provided data.
 *
 * @async
 * @param {NextRequest} req - The Next.js request object.
 * @throws {Error} If there is an error during the PDF generation process.
 * @returns {Promise<NextResponse>} A promise that resolves to a NextResponse object containing the generated PDF.
 */
export async function generatePdfService(req: NextRequest) {
	const body: InvoiceType = await req.json();
	let browser;
	let page;

	try {
		const ReactDOMServer = (await import("react-dom/server")).default;
		const templateId = body.details.pdfTemplate;
		const InvoiceTemplate = await getInvoiceTemplate(templateId);
		const htmlTemplate = ReactDOMServer.renderToStaticMarkup(InvoiceTemplate(body));

		// Use puppeteer with enhanced Docker-compatible configuration
		const puppeteer = await import("puppeteer");
		console.log("Using Puppeteer with system Chromium");
		
		// 检测环境并设置适当的执行路径
		const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH || 
			(process.platform === 'linux' ? '/usr/bin/chromium-browser' : undefined);
		
		console.log(`Puppeteer executable path: ${executablePath}`);
		
		const launchOptions = {
			executablePath,
			headless: "new" as const,
			args: [
				"--no-sandbox",
				"--disable-setuid-sandbox", 
				"--disable-dev-shm-usage",
				"--disable-gpu",
				"--disable-web-security",
				"--disable-features=VizDisplayCompositor",
				"--no-first-run",
				"--no-default-browser-check",
				"--disable-background-timer-throttling",
				"--disable-backgrounding-occluded-windows",
				"--disable-renderer-backgrounding",
				"--disable-crash-reporter", // 禁用崩溃报告
				"--disable-extensions",
				"--disable-plugins",
				"--disable-default-apps",
				"--no-zygote", // 在 Docker 中有用
				"--single-process", // 在受限环境中有用
			],
			defaultViewport: { width: 1280, height: 800 },
			protocolTimeout: 60000, // 增加协议超时到60秒
			handleSIGINT: false,
			handleSIGTERM: false,
			handleSIGHUP: false,
		};
		
		console.log("Launching browser with options:", JSON.stringify(launchOptions, null, 2));
		
		browser = await puppeteer.launch(launchOptions);

		if (!browser) {
			throw new Error("Failed to launch browser");
		}

		page = await browser.newPage();
		
		// 设置页面超时
		page.setDefaultTimeout(60000);
		page.setDefaultNavigationTimeout(60000);

		await page.setContent(await htmlTemplate, {
			waitUntil: ["load", "domcontentloaded"],
			timeout: 60000,
		});

		// 使用内联CSS而不是外部CDN来避免网络问题
		const tailwindCSS = `
		/* Tailwind CSS 基础样式 - 针对发票模板优化 */
		*,::before,::after{box-sizing:border-box;border-width:0;border-style:solid;border-color:#e5e7eb}
		::before,::after{--tw-content:''}
		html{line-height:1.5;-webkit-text-size-adjust:100%;-moz-tab-size:4;tab-size:4;font-family:ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,"Noto Sans",sans-serif,"Apple Color Emoji","Segoe UI Emoji","Segoe UI Symbol","Noto Color Emoji";font-size:14px}
		body{margin:0;line-height:inherit;color:#1f2937}
		h1,h2,h3,h4,h5,h6{font-size:inherit;font-weight:inherit;margin:0}
		p{margin:0}
		a{color:inherit;text-decoration:inherit}
		button,input,optgroup,select,textarea{font-family:inherit;font-size:100%;font-weight:inherit;line-height:inherit;color:inherit;margin:0;padding:0}
		table{border-collapse:collapse;border-spacing:0}
		th,td{padding:0}
		.text-xs{font-size:.75rem;line-height:1rem}
		.text-sm{font-size:.875rem;line-height:1.25rem}
		.text-base{font-size:1rem;line-height:1.5rem}
		.text-lg{font-size:1.125rem;line-height:1.75rem}
		.text-xl{font-size:1.25rem;line-height:1.75rem}
		.text-2xl{font-size:1.5rem;line-height:2rem}
		.text-3xl{font-size:1.875rem;line-height:2.25rem}
		.font-normal{font-weight:400}
		.font-medium{font-weight:500}
		.font-semibold{font-weight:600}
		.font-bold{font-weight:700}
		.text-center{text-align:center}
		.text-right{text-align:right}
		.text-left{text-align:left}
		.text-justify{text-align:justify}
		.uppercase{text-transform:uppercase}
		.p-0{padding:0}
		.p-1{padding:.25rem}
		.p-2{padding:.5rem}
		.p-3{padding:.75rem}
		.p-4{padding:1rem}
		.p-6{padding:1.5rem}
		.p-8{padding:2rem}
		.px-2{padding-left:.5rem;padding-right:.5rem}
		.px-3{padding-left:.75rem;padding-right:.75rem}
		.px-4{padding-left:1rem;padding-right:1rem}
		.px-6{padding-left:1.5rem;padding-right:1.5rem}
		.py-1{padding-top:.25rem;padding-bottom:.25rem}
		.py-2{padding-top:.5rem;padding-bottom:.5rem}
		.py-3{padding-top:.75rem;padding-bottom:.75rem}
		.py-4{padding-top:1rem;padding-bottom:1rem}
		.py-6{padding-top:1.5rem;padding-bottom:1.5rem}
		.pt-4{padding-top:1rem}
		.pb-4{padding-bottom:1rem}
		.pl-4{padding-left:1rem}
		.pr-4{padding-right:1rem}
		.m-0{margin:0}
		.m-2{margin:.5rem}
		.m-4{margin:1rem}
		.mx-auto{margin-left:auto;margin-right:auto}
		.mb-1{margin-bottom:.25rem}
		.mb-2{margin-bottom:.5rem}
		.mb-3{margin-bottom:.75rem}
		.mb-4{margin-bottom:1rem}
		.mb-6{margin-bottom:1.5rem}
		.mb-8{margin-bottom:2rem}
		.mt-2{margin-top:.5rem}
		.mt-4{margin-top:1rem}
		.mt-6{margin-top:1.5rem}
		.mt-8{margin-top:2rem}
		.mr-2{margin-right:.5rem}
		.mr-4{margin-right:1rem}
		.ml-2{margin-left:.5rem}
		.ml-4{margin-left:1rem}
		.border{border-width:1px}
		.border-0{border-width:0}
		.border-t{border-top-width:1px}
		.border-b{border-bottom-width:1px}
		.border-l{border-left-width:1px}
		.border-r{border-right-width:1px}
		.border-gray-200{border-color:#e5e7eb}
		.border-gray-300{border-color:#d1d5db}
		.border-gray-400{border-color:#9ca3af}
		.border-black{border-color:#000}
		.bg-white{background-color:#fff}
		.bg-gray-50{background-color:#f9fafb}
		.bg-gray-100{background-color:#f3f4f6}
		.bg-gray-200{background-color:#e5e7eb}
		.text-black{color:#000}
		.text-gray-500{color:#6b7280}
		.text-gray-600{color:#4b5563}
		.text-gray-700{color:#374151}
		.text-gray-800{color:#1f2937}
		.text-gray-900{color:#111827}
		.w-full{width:100%}
		.w-1\/2{width:50%}
		.w-1\/3{width:33.333333%}
		.w-2\/3{width:66.666667%}
		.w-1\/4{width:25%}
		.w-3\/4{width:75%}
		.h-full{height:100%}
		.min-h-screen{min-height:100vh}
		.block{display:block}
		.inline{display:inline}
		.inline-block{display:inline-block}
		.flex{display:flex}
		.table{display:table}
		.table-auto{table-layout:auto}
		.table-fixed{table-layout:fixed}
		.hidden{display:none}
		.flex-col{flex-direction:column}
		.flex-wrap{flex-wrap:wrap}
		.items-center{align-items:center}
		.items-start{align-items:flex-start}
		.items-end{align-items:flex-end}
		.justify-center{justify-content:center}
		.justify-between{justify-content:space-between}
		.justify-end{justify-content:flex-end}
		.space-y-1>:not([hidden])~:not([hidden]){--tw-space-y-reverse:0;margin-top:calc(.25rem * calc(1 - var(--tw-space-y-reverse)));margin-bottom:calc(.25rem * var(--tw-space-y-reverse))}
		.space-y-2>:not([hidden])~:not([hidden]){--tw-space-y-reverse:0;margin-top:calc(.5rem * calc(1 - var(--tw-space-y-reverse)));margin-bottom:calc(.5rem * var(--tw-space-y-reverse))}
		.space-y-4>:not([hidden])~:not([hidden]){--tw-space-y-reverse:0;margin-top:calc(1rem * calc(1 - var(--tw-space-y-reverse)));margin-bottom:calc(1rem * var(--tw-space-y-reverse))}
		.rounded{border-radius:.25rem}
		.rounded-lg{border-radius:.5rem}
		.shadow{box-shadow:0 1px 3px 0 rgba(0,0,0,.1),0 1px 2px 0 rgba(0,0,0,.06)}
		.shadow-lg{box-shadow:0 10px 15px -3px rgba(0,0,0,.1),0 4px 6px -2px rgba(0,0,0,.05)}
		.overflow-hidden{overflow:hidden}
		.max-w-4xl{max-width:56rem}
		.container{width:100%}
		@media (min-width:640px){.container{max-width:640px}}
		@media (min-width:768px){.container{max-width:768px}}
		@media (min-width:1024px){.container{max-width:1024px}}
		@media (min-width:1280px){.container{max-width:1280px}}
		@media (min-width:1536px){.container{max-width:1536px}}
		@media print{.print\\:hidden{display:none}}
		`;

		// 更稳健的样式注入
		let styleInjected = false;
		try {
			// 尝试注入内联样式
			await page.addStyleTag({
				content: tailwindCSS,
			});
			console.log("Successfully added inline Tailwind styles");
			styleInjected = true;
		} catch (styleError) {
			console.warn("Failed to inject inline styles:", styleError);
			
			// 备用方案：通过evaluate直接添加到DOM
			try {
				await page.evaluate((css) => {
					const style = document.createElement('style');
					style.type = 'text/css';
					style.innerHTML = css;
					document.head.appendChild(style);
				}, tailwindCSS);
				console.log("Successfully added styles via DOM manipulation");
				styleInjected = true;
			} catch (domError) {
				console.warn("DOM style injection also failed:", domError);
			}
		}
		
		if (!styleInjected) {
			console.warn("All style injection methods failed, proceeding with default browser styles");
		}

		// 等待页面完全渲染
		await page.waitForTimeout(2000);

		const pdf: Buffer = await page.pdf({
			format: "a4",
			printBackground: true,
			preferCSSPageSize: true,
			timeout: 60000, // PDF生成超时
		});

		return new NextResponse(new Blob([new Uint8Array(pdf)], { type: "application/pdf" }), {
			headers: {
				"Content-Type": "application/pdf",
				"Content-Disposition": "attachment; filename=invoice.pdf",
				"Cache-Control": "no-cache",
				Pragma: "no-cache",
			},
			status: 200,
		});
	} catch (error) {
		console.error("PDF Generation Error:", error);
		
		// 提供更详细的错误信息以便调试
		const errorDetails = {
			message: error.message,
			stack: error.stack,
			name: error.name,
			timestamp: new Date().toISOString(),
			environment: {
				platform: process.platform,
				nodeVersion: process.version,
				executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
			}
		};
		
		console.error("Detailed error information:", JSON.stringify(errorDetails, null, 2));
		
		return new NextResponse(JSON.stringify({ 
			error: "Failed to generate PDF", 
			details: process.env.NODE_ENV === 'development' ? errorDetails : error.message 
		}), {
			status: 500,
			headers: {
				"Content-Type": "application/json",
			},
		});
	} finally {
		if (page) {
			try {
				await page.close();
			} catch (e) {
				console.error("Error closing page:", e);
			}
		}
		if (browser) {
			try {
				const pages = await browser.pages();
				await Promise.all(pages.map((p) => p.close()));
				await browser.close();
			} catch (e) {
				console.error("Error closing browser:", e);
			}
		}
	}
}
