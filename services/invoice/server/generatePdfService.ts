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
		// 计算缺失的金额字段
		if (!body.details.subTotal || isNaN(Number(body.details.subTotal))) {
			body.details.subTotal = body.details.items.reduce((sum, item) => sum + (item.total || 0), 0);
		}
		
		if (!body.details.totalAmount || isNaN(Number(body.details.totalAmount))) {
			let total = Number(body.details.subTotal);
			
			// 应用税收
			if (body.details.taxDetails?.amount) {
				if (body.details.taxDetails.amountType === 'percentage') {
					total += (total * Number(body.details.taxDetails.amount)) / 100;
				} else {
					total += Number(body.details.taxDetails.amount);
				}
			}
			
			// 应用折扣
			if (body.details.discountDetails?.amount) {
				if (body.details.discountDetails.amountType === 'percentage') {
					total -= (total * Number(body.details.discountDetails.amount)) / 100;
				} else {
					total -= Number(body.details.discountDetails.amount);
				}
			}
			
			// 应用运费
			if (body.details.shippingDetails?.cost) {
				if (body.details.shippingDetails.costType === 'percentage') {
					total += (total * Number(body.details.shippingDetails.cost)) / 100;
				} else {
					total += Number(body.details.shippingDetails.cost);
				}
			}
			
			body.details.totalAmount = Math.max(0, total); // 确保不为负数
		}

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
				// 针对中国大陆网络环境的优化 - 彻底断网模式
				"--disable-sync", // 禁用 Google 同步
				"--disable-translate", // 禁用翻译服务
				"--disable-background-networking", // 禁用后台网络
				"--disable-background-mode", // 禁用后台模式
				"--disable-client-side-phishing-detection", // 禁用钓鱼检测
				"--disable-component-update", // 禁用组件更新
				"--disable-domain-reliability", // 禁用域名可靠性监测
				"--disable-features=TranslateUI,BlinkGenPropertyTrees", // 禁用更多功能
				"--disable-ipc-flooding-protection", // 禁用IPC洪水保护
				"--disable-renderer-accessibility", // 禁用渲染器可访问性
				"--disable-speech-api", // 禁用语音API
				"--hide-scrollbars", // 隐藏滚动条
				"--mute-audio", // 静音
				"--no-pings", // 禁用ping
				"--disable-remote-playback-api", // 禁用远程播放API
				"--disable-features=VizDisplayCompositor,AudioServiceOutOfProcess", // 禁用更多服务
				"--aggressive-cache-discard", // 积极丢弃缓存
				"--disable-blink-features=AutomationControlled", // 禁用自动化控制检测
				// 新增：彻底禁用网络相关功能
				"--disable-network-service", // 禁用网络服务
				"--disable-features=NetworkService", // 禁用网络服务特性
				"--disable-web-bluetooth", // 禁用Web蓝牙
				"--disable-web-usb", // 禁用Web USB
				"--disable-webgl", // 禁用WebGL
				"--disable-webrtc", // 禁用WebRTC
				"--disable-logging", // 禁用日志
				"--disable-breakpad", // 禁用Breakpad崩溃报告
				"--disable-dev-tools", // 禁用开发者工具
				"--disable-hang-monitor", // 禁用挂起监控
				"--disable-prompt-on-repost", // 禁用重新提交提示
				"--disable-component-extensions-with-background-pages", // 禁用后台扩展
				"--disable-software-rasterizer", // 禁用软件光栅化
				"--no-service-autorun", // 禁用服务自动运行
				"--password-store=basic", // 使用基本密码存储
				"--use-mock-keychain", // 使用模拟钥匙串
				"--disable-accelerated-2d-canvas", // 禁用2D画布加速
				"--disable-accelerated-jpeg-decoding", // 禁用JPEG解码加速
				"--disable-accelerated-mjpeg-decode", // 禁用MJPEG解码加速
				"--disable-accelerated-video-decode", // 禁用视频解码加速
				"--disable-extensions-file-access-check", // 禁用扩展文件访问检查
				"--disable-gl-drawing-for-tests", // 禁用GL绘图测试
				"--disable-infobars", // 禁用信息栏
				"--disable-notifications", // 禁用通知
				"--disable-popup-blocking", // 禁用弹窗阻止
				"--force-color-profile=srgb", // 强制颜色配置
				"--metrics-recording-only", // 仅记录指标
				"--no-crash-upload", // 禁用崩溃上传
				"--offline", // 离线模式
				"--disable-background-downloads", // 禁用后台下载
				"--disable-add-to-shelf", // 禁用添加到架子
				"--disable-datasaver-prompt", // 禁用数据保护提示
				"--disable-device-discovery-notifications", // 禁用设备发现通知
			],
			defaultViewport: { width: 1280, height: 800 },
			protocolTimeout: 120000, // 增加协议超时到120秒，适应慢网络
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

		// 设置页面字符编码
		await page.setExtraHTTPHeaders({
			'Accept-Charset': 'utf-8'
		});

		// 确保页面使用UTF-8编码
		await page.evaluate(() => {
			const meta = document.createElement('meta');
			meta.setAttribute('charset', 'utf-8');
			document.head.insertBefore(meta, document.head.firstChild);
		});

		// 使用内联CSS而不是外部CDN来避免网络问题，特别优化中文显示
		const tailwindCSS = `
		/* Tailwind CSS 基础样式 - 针对发票模板和中文显示优化 */
		*,::before,::after{box-sizing:border-box;border-width:0;border-style:solid;border-color:#e5e7eb}
		::before,::after{--tw-content:''}
		
		/* 中文字体优化 */
		html, body, *, h1, h2, h3, h4, h5, h6, p, th, td {
			font-family: "Outfit", "Noto Sans SC", sans-serif;
		}

		html{
			line-height:1.5;
			-webkit-text-size-adjust:100%;
			-moz-tab-size:4;
			tab-size:4;
			font-size:14px;
			-webkit-font-smoothing:antialiased;
			-moz-osx-font-smoothing:grayscale;
		}
		
		body{
			margin:0;
			line-height:inherit;
			color:#1f2937;
		}
		
		h1,h2,h3,h4,h5,h6{
			font-size:inherit;
			font-weight:inherit;
			margin:0;
		}
		
		p{margin:0}
		a{color:inherit;text-decoration:inherit}
		button,input,optgroup,select,textarea{font-family:inherit;font-size:100%;font-weight:inherit;line-height:inherit;color:inherit;margin:0;padding:0}
		table{border-collapse:collapse;border-spacing:0}
		th,td{padding:0}
		
		/* 文本样式 */
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
		.not-italic{font-style:normal}
		
		/* 间距 - 更紧凑的设置 */
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
		.mt-1{margin-top:.25rem}
		.mt-2{margin-top:.5rem}
		.mt-3{margin-top:.75rem}
		.mt-4{margin-top:1rem}
		.mt-6{margin-top:1.5rem}
		.mt-8{margin-top:2rem}
		.mr-2{margin-right:.5rem}
		.mr-4{margin-right:1rem}
		.ml-2{margin-left:.5rem}
		.ml-4{margin-left:1rem}
		.my-1{margin-top:.25rem;margin-bottom:.25rem}
		.my-2{margin-top:.5rem;margin-bottom:.5rem}
		.my-4{margin-top:1rem;margin-bottom:1rem}
		
		/* 超紧凑间距 - 专为发票优化 */
		.space-y-0-5>:not([hidden])~:not([hidden]){margin-top:.125rem}
		.space-y-0>:not([hidden])~:not([hidden]){margin-top:0}
		.gap-0{gap:0}
		.gap-0-5{gap:.125rem}
		.gap-1-5{gap:.375rem}
		
		/* 发票专用超小间距 */
		.invoice-compact-spacing>:not([hidden])~:not([hidden]){margin-top:.0625rem}
		.invoice-mini-gap{gap:.0625rem}
		
		/* 边框 */
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
		
		/* 背景和颜色 */
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
		.text-blue-600{color:#2563eb}
		
		/* 布局 */
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
		.grid{display:grid}
		
		/* Grid 系统 */
		.grid-cols-1{grid-template-columns:repeat(1,minmax(0,1fr))}
		.grid-cols-2{grid-template-columns:repeat(2,minmax(0,1fr))}
		.grid-cols-3{grid-template-columns:repeat(3,minmax(0,1fr))}
		.grid-cols-5{grid-template-columns:repeat(5,minmax(0,1fr))}
		.col-span-2{grid-column:span 2/span 2}
		.col-span-3{grid-column:span 3/span 3}
		.col-span-full{grid-column:1/-1}
		.gap-x-3{column-gap:.75rem}
		.gap-y-1{row-gap:.25rem}
		.gap-3{gap:.75rem}
		.gap-2{gap:.5rem}
		
		/* Flex 布局 */
		.flex-col{flex-direction:column}
		.flex-wrap{flex-wrap:wrap}
		.items-center{align-items:center}
		.items-start{align-items:flex-start}
		.items-end{align-items:flex-end}
		.justify-center{justify-content:center}
		.justify-between{justify-content:space-between}
		.justify-end{justify-content:flex-end}
		
		/* 响应式 */
		@media (min-width:640px){
			.sm\\:grid{display:grid}
			.sm\\:hidden{display:none}
			.sm\\:block{display:block}
			.sm\\:grid-cols-1{grid-template-columns:repeat(1,minmax(0,1fr))}
			.sm\\:grid-cols-2{grid-template-columns:repeat(2,minmax(0,1fr))}
			.sm\\:grid-cols-5{grid-template-columns:repeat(5,minmax(0,1fr))}
			.sm\\:grid-cols-6{grid-template-columns:repeat(6,minmax(0,1fr))}
			.sm\\:col-span-2{grid-column:span 2/span 2}
			.sm\\:text-right{text-align:right}
			.sm\\:justify-end{justify-content:flex-end}
			.sm\\:gap-2{gap:.5rem}
		}
		
		@media (min-width:768px){
			.md\\:text-xl{font-size:1.25rem;line-height:1.75rem}
			.md\\:text-3xl{font-size:1.875rem;line-height:2.25rem}
		}
		
		/* 其他工具类 */
		.space-y-1>:not([hidden])~:not([hidden]){margin-top:.25rem}
		.space-y-2>:not([hidden])~:not([hidden]){margin-top:.5rem}
		.rounded{border-radius:.25rem}
		.rounded-lg{border-radius:.5rem}
		.shadow{box-shadow:0 1px 3px 0 rgba(0,0,0,.1),0 1px 2px 0 rgba(0,0,0,.06)}
		.overflow-hidden{overflow:hidden}
		.whitespace-pre-line{white-space:pre-line}
		
		/* 打印样式 */
		@media print{
			*{
				color-adjust:exact !important;
				-webkit-print-color-adjust:exact !important;
			}
			.print\\:hidden{display:none}
		}
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
			message: error instanceof Error ? error.message : String(error),
			stack: error instanceof Error ? error.stack : undefined,
			name: error instanceof Error ? error.name : 'UnknownError',
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
			details: process.env.NODE_ENV === 'development' ? errorDetails : (error instanceof Error ? error.message : String(error))
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
