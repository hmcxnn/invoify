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
				"--disable-remote-fonts", // 禁用远程字体
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
			protocolTimeout: 60000, // 健康检查用较短超时
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