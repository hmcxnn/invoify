import { NextRequest, NextResponse } from "next/server";

/**
 * Health check endpoint for Puppeteer configuration
 * 
 * This endpoint tests if Puppeteer can launch successfully in the current environment
 * and provides diagnostic information about the browser configuration.
 */
export async function GET(req: NextRequest) {
	try {
		const puppeteer = await import("puppeteer");
		
		// 检测环境并设置适当的执行路径
		const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH || 
			(process.platform === 'linux' ? '/usr/bin/chromium-browser' : undefined);
		
		console.log(`Health check - Puppeteer executable path: ${executablePath}`);
		
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
				"--disable-crash-reporter",
				"--disable-extensions",
				"--disable-plugins",
				"--disable-default-apps",
				"--no-zygote",
				"--single-process",
			],
			defaultViewport: { width: 1280, height: 800 },
			protocolTimeout: 30000, // 较短的超时用于健康检查
			handleSIGINT: false,
			handleSIGTERM: false,
			handleSIGHUP: false,
		};
		
		const startTime = Date.now();
		
		// 尝试启动浏览器
		const browser = await puppeteer.launch(launchOptions);
		const launchTime = Date.now() - startTime;
		
		// 创建页面并测试基本功能
		const page = await browser.newPage();
		const pageStartTime = Date.now();
		
		// 设置简单的HTML内容
		await page.setContent('<html><body><h1>Puppeteer Health Check</h1></body></html>');
		const pageTime = Date.now() - pageStartTime;
		
		// 获取浏览器版本信息
		const version = await browser.version();
		const userAgent = await browser.userAgent();
		
		// 清理
		await page.close();
		await browser.close();
		
		const totalTime = Date.now() - startTime;
		
		return NextResponse.json({
			status: "healthy",
			timestamp: new Date().toISOString(),
			browser: {
				version,
				userAgent,
				executablePath,
			},
			performance: {
				launchTime: `${launchTime}ms`,
				pageCreationTime: `${pageTime}ms`,
				totalTime: `${totalTime}ms`,
			},
			environment: {
				platform: process.platform,
				nodeVersion: process.version,
				env: process.env.NODE_ENV,
			},
			puppeteerConfig: {
				skipDownload: process.env.PUPPETEER_SKIP_CHROMIUM_DOWNLOAD,
				executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
			}
		}, {
			status: 200,
			headers: {
				"Content-Type": "application/json",
				"Cache-Control": "no-cache",
			},
		});
		
	} catch (error) {
		console.error("Puppeteer health check failed:", error);
		
		const errorDetails = {
			message: error instanceof Error ? error.message : String(error),
			name: error instanceof Error ? error.name : 'UnknownError',
			stack: process.env.NODE_ENV === 'development' && error instanceof Error ? error.stack : undefined,
			timestamp: new Date().toISOString(),
			environment: {
				platform: process.platform,
				nodeVersion: process.version,
				executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
			}
		};
		
		return NextResponse.json({
			status: "unhealthy",
			error: errorDetails,
		}, {
			status: 500,
			headers: {
				"Content-Type": "application/json",
			},
		});
	}
}