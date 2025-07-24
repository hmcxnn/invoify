import { NextRequest, NextResponse } from "next/server";

// Chromium
import chromium from "@sparticuz/chromium";

// Helpers
import { getInvoiceTemplate } from "@/lib/helpers";

// Variables
import { CHROMIUM_EXECUTABLE_PATH, ENV, TAILWIND_CDN } from "@/lib/variables";

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

		// Use puppeteer with simplified Docker-compatible configuration
		const puppeteer = await import("puppeteer");
		console.log("Using Puppeteer with system Chromium");
		
		browser = await puppeteer.launch({
			executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
			headless: "new",
		          // 指定用户数据目录，与 Dockerfile 中创建的目录一致
		          userDataDir: '/home/nextjs/chromium-data',
			args: [
				"--no-sandbox",
				"--disable-setuid-sandbox",
				"--disable-dev-shm-usage",
				"--disable-gpu",
		              // 禁用崩溃报告以避免 Crashpad 错误
		              "--disable-crash-reporter",
		              // 在 Docker 中优化性能的常用参数
		              "--no-zygote",
		              "--single-process"
			],
			defaultViewport: { width: 1280, height: 800 },
		});

		if (!browser) {
			throw new Error("Failed to launch browser");
		}

		page = await browser.newPage();
		await page.setContent(await htmlTemplate, {
			waitUntil: ["networkidle0", "load", "domcontentloaded"],
			timeout: 30000,
		});

		await page.addStyleTag({
			url: TAILWIND_CDN,
		});

		const pdf: Buffer = await page.pdf({
			format: "a4",
			printBackground: true,
			preferCSSPageSize: true,
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
		return new NextResponse(JSON.stringify({ error: "Failed to generate PDF", details: error }), {
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
