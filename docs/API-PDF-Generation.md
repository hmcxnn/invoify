# Invoify PDF 生成 API 说明文档

## 概述

Invoify 提供了 RESTful API 来生成 PDF 格式的发票。该 API 支持多种发票模板，并可以自定义发票内容。

## API 端点

```
POST /api/invoice/generate
```

## 请求格式

### Headers
```
Content-Type: application/json
```

### 请求体结构

API 接受符合以下数据结构的 JSON 请求：

```json
{
  "sender": {
    "name": "string",           // 发送方公司名称 (2-50字符)
    "address": "string",        // 地址 (2-70字符)
    "zipCode": "string",        // 邮编 (2-20字符)
    "city": "string",           // 城市 (1-50字符)
    "country": "string",        // 国家 (1-70字符)
    "email": "string",          // 邮箱 (5-30字符，有效格式)
    "phone": "string",          // 电话 (1-50字符)
    "customInputs": [           // 可选：自定义字段
      {
        "key": "string",
        "value": "string"
      }
    ]
  },
  "receiver": {
    "name": "string",           // 接收方公司名称
    "address": "string",        // 地址
    "zipCode": "string",        // 邮编
    "city": "string",           // 城市
    "country": "string",        // 国家
    "email": "string",          // 邮箱
    "phone": "string",          // 电话
    "customInputs": [           // 可选：自定义字段
      {
        "key": "string",
        "value": "string"
      }
    ]
  },
  "details": {
    "invoiceLogo": "string",                    // 可选：发票logo (base64或URL)
    "invoiceNumber": "string",                  // 发票号码 (必填)
    "invoiceDate": "2024-01-15T00:00:00.000Z", // 发票日期 (ISO格式)
    "dueDate": "2024-02-15T00:00:00.000Z",     // 到期日期 (ISO格式)
    "purchaseOrderNumber": "string",            // 可选：采购订单号
    "currency": "string",                       // 货币代码 (如: USD, EUR, CNY)
    "language": "string",                       // 语言代码 (如: en, zh, fr)
    "items": [                                  // 发票项目列表
      {
        "name": "string",                       // 项目名称 (必填)
        "description": "string",                // 可选：项目描述
        "quantity": 1,                          // 数量 (≥1)
        "unitPrice": 100.00,                    // 单价 (>0)
        "total": 100.00                         // 总价
      }
    ],
    "paymentInformation": {                     // 可选：付款信息
      "bankName": "string",                     // 银行名称
      "accountName": "string",                  // 账户名称
      "accountNumber": "string"                 // 账户号码
    },
    "taxDetails": {                             // 可选：税务信息
      "amount": 10.00,                          // 税额 (≤1000000)
      "taxID": "string",                        // 税务ID
      "amountType": "percentage"                // 金额类型
    },
    "discountDetails": {                        // 可选：折扣信息
      "amount": 5.00,                           // 折扣金额 (≤1000000)
      "amountType": "fixed"                     // 金额类型
    },
    "shippingDetails": {                        // 可选：运费信息
      "cost": 15.00,                            // 运费 (≤1000000)
      "costType": "fixed"                       // 费用类型
    },
    "subTotal": 100.00,                         // 小计 (≥0)
    "totalAmount": 100.00,                      // 总金额 (≥0)
    "totalAmountInWords": "string",             // 总金额大写
    "additionalNotes": "string",                // 可选：附加说明
    "paymentTerms": "string",                   // 付款条款 (必填)
    "signature": {                              // 可选：签名信息
      "data": "string",                         // 签名数据
      "fontFamily": "string"                    // 可选：字体
    },
    "updatedAt": "string",                      // 可选：更新时间
    "pdfTemplate": 1                            // PDF模板ID (1或2)
  }
}
```

## 可用模板

目前支持以下 PDF 模板：

- **模板 1** (`pdfTemplate: 1`): 标准商务模板
- **模板 2** (`pdfTemplate: 2`): 现代简约模板

## 响应格式

### 成功响应

**状态码**: `200 OK`

**Headers**:
```
Content-Type: application/pdf
Content-Disposition: attachment; filename=invoice.pdf
Cache-Control: no-cache
Pragma: no-cache
```

**Body**: PDF 二进制数据流

### 错误响应

**状态码**: `500 Internal Server Error`

**Headers**:
```
Content-Type: application/json
```

**Body**:
```json
{
  "error": "Failed to generate PDF",
  "details": "错误详细信息"
}
```

## 使用示例

### cURL 示例

```bash
# 生成模板1的PDF
curl -X POST http://localhost:3000/api/invoice/generate \
  -H "Content-Type: application/json" \
  -d '{
    "sender": {
      "name": "ABC科技有限公司",
      "address": "北京市朝阳区建国路88号",
      "zipCode": "100020",
      "city": "北京",
      "country": "中国",
      "email": "billing@abc-tech.com",
      "phone": "010-12345678"
    },
    "receiver": {
      "name": "XYZ企业集团",
      "address": "上海市浦东新区陆家嘴环路1000号",
      "zipCode": "200120",
      "city": "上海",
      "country": "中国",
      "email": "finance@xyz-group.com",
      "phone": "021-87654321"
    },
    "details": {
      "invoiceNumber": "INV-2024-001",
      "invoiceDate": "2024-01-15T00:00:00.000Z",
      "dueDate": "2024-02-15T00:00:00.000Z",
      "currency": "CNY",
      "language": "zh",
      "items": [
        {
          "name": "软件开发服务",
          "description": "企业级应用开发",
          "quantity": 1,
          "unitPrice": 50000.00,
          "total": 50000.00
        },
        {
          "name": "技术支持服务",
          "description": "12个月技术支持",
          "quantity": 12,
          "unitPrice": 2000.00,
          "total": 24000.00
        }
      ],
      "taxDetails": {
        "amount": 13,
        "taxID": "91110000000000000X",
        "amountType": "percentage"
      },
      "subTotal": 74000.00,
      "totalAmount": 83620.00,
      "totalAmountInWords": "捌万叁仟陆佰贰拾元整",
      "paymentTerms": "收到发票后30天内付款",
      "additionalNotes": "请在付款时注明发票号码",
      "pdfTemplate": 1
    }
  }' \
  -o invoice.pdf
```

### JavaScript/Node.js 示例

```javascript
const generateInvoicePDF = async (invoiceData) => {
  try {
    const response = await fetch('http://localhost:3000/api/invoice/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(invoiceData)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const pdfBlob = await response.blob();
    
    // 下载PDF
    const url = window.URL.createObjectURL(pdfBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'invoice.pdf';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
  } catch (error) {
    console.error('PDF生成失败:', error);
  }
};

// 使用示例
const invoiceData = {
  sender: {
    name: "测试公司",
    address: "测试地址123号",
    zipCode: "12345",
    city: "测试城市",
    country: "中国",
    email: "test@company.com",
    phone: "123-456-7890"
  },
  receiver: {
    name: "客户公司",
    address: "客户地址456号",
    zipCode: "67890",
    city: "客户城市",
    country: "中国",
    email: "client@company.com",
    phone: "098-765-4321"
  },
  details: {
    invoiceNumber: "INV-2024-001",
    invoiceDate: "2024-01-15T00:00:00.000Z",
    dueDate: "2024-02-15T00:00:00.000Z",
    currency: "CNY",
    language: "zh",
    items: [
      {
        name: "测试服务",
        description: "专业测试服务",
        quantity: 2,
        unitPrice: 500.00,
        total: 1000.00
      }
    ],
    subTotal: 1000.00,
    totalAmount: 1000.00,
    totalAmountInWords: "壹仟元整",
    paymentTerms: "净30天",
    pdfTemplate: 1
  }
};

generateInvoicePDF(invoiceData);
```

### Python 示例

```python
import requests
import json

def generate_invoice_pdf(invoice_data, output_file='invoice.pdf'):
    """
    生成PDF发票
    
    Args:
        invoice_data (dict): 发票数据
        output_file (str): 输出文件名
    """
    url = 'http://localhost:3000/api/invoice/generate'
    headers = {'Content-Type': 'application/json'}
    
    try:
        response = requests.post(url, headers=headers, json=invoice_data)
        response.raise_for_status()
        
        with open(output_file, 'wb') as f:
            f.write(response.content)
            
        print(f'PDF生成成功: {output_file}')
        
    except requests.exceptions.RequestException as e:
        print(f'PDF生成失败: {e}')

# 使用示例
invoice_data = {
    "sender": {
        "name": "测试公司",
        "address": "测试地址123号",
        "zipCode": "12345",
        "city": "测试城市",
        "country": "中国",
        "email": "test@company.com",
        "phone": "123-456-7890"
    },
    "receiver": {
        "name": "客户公司", 
        "address": "客户地址456号",
        "zipCode": "67890",
        "city": "客户城市",
        "country": "中国",
        "email": "client@company.com",
        "phone": "098-765-4321"
    },
    "details": {
        "invoiceNumber": "INV-2024-001",
        "invoiceDate": "2024-01-15T00:00:00.000Z",
        "dueDate": "2024-02-15T00:00:00.000Z",
        "currency": "CNY",
        "language": "zh",
        "items": [
            {
                "name": "测试服务",
                "description": "专业测试服务",
                "quantity": 2,
                "unitPrice": 500.00,
                "total": 1000.00
            }
        ],
        "subTotal": 1000.00,
        "totalAmount": 1000.00,
        "totalAmountInWords": "壹仟元整",
        "paymentTerms": "净30天",
        "pdfTemplate": 1
    }
}

generate_invoice_pdf(invoice_data)
```

## 字段验证规则

### 通用验证
- **name**: 2-50字符
- **address**: 2-70字符
- **zipCode**: 2-20字符
- **city**: 1-50字符
- **country**: 1-70字符
- **email**: 5-30字符，必须是有效邮箱格式
- **phone**: 1-50字符

### 数值验证
- **quantity**: 必须 ≥ 1
- **unitPrice**: 必须 > 0，≤ Number.MAX_SAFE_INTEGER
- **amount fields**: 必须 ≤ 1,000,000

### 日期格式
- 使用 ISO 8601 格式: `2024-01-15T00:00:00.000Z`
- 日期会自动转换为本地化显示格式

## 支持的货币

API 支持多种国际货币，包括但不限于：
- USD (美元)
- EUR (欧元)
- CNY (人民币)
- GBP (英镑)
- JPY (日元)

## 错误处理

### 常见错误

1. **400 Bad Request**: 请求数据格式错误或缺少必填字段
2. **500 Internal Server Error**: 服务器内部错误，通常是PDF生成失败

### 调试建议

1. 确保所有必填字段都已提供
2. 检查数据类型是否正确（数字、字符串、日期等）
3. 验证字段长度和格式限制
4. 确保模板ID有效（1或2）

## 性能建议

1. **批量生成**: 避免短时间内大量并发请求
2. **数据优化**: 减少不必要的可选字段以提高响应速度
3. **缓存**: 对于相同数据的重复请求，考虑客户端缓存

## 安全注意事项

1. **数据验证**: 始终验证输入数据
2. **敏感信息**: 避免在日志中记录敏感的财务信息
3. **访问控制**: 在生产环境中实施适当的访问控制

## 技术架构

- **后端**: Next.js API Routes
- **PDF生成**: Puppeteer + Chromium
- **容器化**: Docker (Alpine Linux)
- **模板引擎**: React Server Components

## 更新日志

### v1.0.0 (2024-01-15)
- 初始版本发布
- 支持基础PDF生成功能
- 提供2个预设模板

---

**注意**: 该 API 仍在积极开发中，某些功能可能会在未来版本中发生变化。请关注更新日志以获取最新信息。