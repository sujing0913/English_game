# ========================
#       常量定义
# ========================
$SCRIPT_NAME = $MyInvocation.MyCommand.Name
$NODE_MIN_VERSION = 18
$NODE_INSTALL_VERSION = 22
$NVM_VERSION = "v0.40.3"
$CLAUDE_PACKAGE = "@anthropic-ai/claude-code"
$CONFIG_DIR = "$env:USERPROFILE\.claude"
$CONFIG_FILE = "$CONFIG_DIR\settings.json"
$API_BASE_URL = "https://open.bigmodel.cn/api/anthropic"
$API_KEY_URL = "https://open.bigmodel.cn/usercenter/proj-mgmt/apikeys"
$API_TIMEOUT_MS = 3000000

# ========================
#       工具函数
# ========================

# 设置控制台编码为UTF-8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

function Log-Info {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Cyan
}

function Log-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

function Log-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
    exit 1
}

function Ensure-DirExists {
    param([string]$Dir)
    if (-not (Test-Path $Dir)) {
        try {
            New-Item -ItemType Directory -Path $Dir -Force | Out-Null
        }
        catch {
            Log-Error "Failed to create directory: $Dir"
        }
    }
}

# ========================
#     Node.js 安装函数
# ========================

function Install-NodeJS {
    $platform = $env:OS
    
    if ($platform -like "*Windows*") {
        Log-Info "Installing Node.js on Windows..."
        
        # 检查是否已安装 Chocolatey
        if (-not (Get-Command choco -ErrorAction SilentlyContinue)) {
            Log-Info "Installing Chocolatey package manager..."
            Set-ExecutionPolicy Bypass -Scope Process -Force
            [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
            Invoke-Expression ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
        }
        
        # 安装 Node.js
        Log-Info "Installing Node.js $NODE_INSTALL_VERSION..."
        choco install nodejs --version=$NODE_INSTALL_VERSION -y
        
        # 验证安装
        if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
            Log-Error "Node.js installation failed"
        }
        
        $nodeVersion = node -v
        $npmVersion = npm -v
        Log-Success "Node.js installed: $nodeVersion"
        Log-Success "npm version: $npmVersion"
    }
    else {
        Log-Error "Unsupported platform: $platform"
    }
}

# ========================
#     Node.js 检查函数
# ========================

function Check-NodeJS {
    $nodeCommand = Get-Command node -ErrorAction SilentlyContinue
    if ($nodeCommand) {
        $currentVersion = (node -v).TrimStart('v')
        $majorVersion = [int]$currentVersion.Split('.')[0]
        
        if ($majorVersion -ge $NODE_MIN_VERSION) {
            Log-Success "Node.js is already installed: v$currentVersion"
            return $true
        }
        else {
            Log-Info "Node.js v$currentVersion is installed but version < $NODE_MIN_VERSION. Upgrading..."
            Install-NodeJS
        }
    }
    else {
        Log-Info "Node.js not found. Installing..."
        Install-NodeJS
    }
}

# ========================
#     Claude Code 安装
# ========================

function Install-ClaudeCode {
    $claudeCommand = Get-Command claude -ErrorAction SilentlyContinue
    if ($claudeCommand) {
        $version = claude --version
        Log-Success "Claude Code is already installed: $version"
    }
    else {
        Log-Info "Installing Claude Code..."
        npm install -g $CLAUDE_PACKAGE
        if (-not $?) {
            Log-Error "Failed to install claude-code"
        }
        Log-Success "Claude Code installed successfully"
    }
}

function Configure-ClaudeJson {
    $tempScript = [System.IO.Path]::GetTempFileName() + ".js"
    $nodeScript = @"
const os = require("os");
const fs = require("fs");
const path = require("path");

const homeDir = os.homedir();
const filePath = path.join(homeDir, ".claude.json");
if (fs.existsSync(filePath)) {
    const content = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    fs.writeFileSync(filePath, JSON.stringify({ ...content, hasCompletedOnboarding: true }, null, 2), "utf-8");
} else {
    fs.writeFileSync(filePath, JSON.stringify({ hasCompletedOnboarding: true }, null, 2), "utf-8");
}
"@
    
    try {
        $nodeScript | Out-File -FilePath $tempScript -Encoding UTF8
        node $tempScript
    }
    finally {
        if (Test-Path $tempScript) {
            Remove-Item $tempScript -Force
        }
    }
}

# ========================
#     API Key 配置
# ========================

function Configure-Claude {
    Log-Info "Configuring Claude Code..."
    Write-Host "   You can get your API key from: $API_KEY_URL"
    
    $apiKey = Read-Host "[INPUT] Please enter your ZHIPU API key" -AsSecureString
    $apiKeyPlain = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto(
        [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($apiKey)
    )
    
    if ([string]::IsNullOrEmpty($apiKeyPlain)) {
        Log-Error "API key cannot be empty. Please run the script again."
    }
    
    Ensure-DirExists $CONFIG_DIR
    
    # 写入配置文件
    $tempScript = [System.IO.Path]::GetTempFileName() + ".js"
    $nodeScript = @"
const os = require("os");
const fs = require("fs");
const path = require("path");

const homeDir = os.homedir();
const filePath = path.join(homeDir, ".claude", "settings.json");
const apiKey = "$apiKeyPlain";

const content = fs.existsSync(filePath)
    ? JSON.parse(fs.readFileSync(filePath, "utf-8"))
    : {};

fs.writeFileSync(filePath, JSON.stringify({
    ...content,
    env: {
        ANTHROPIC_AUTH_TOKEN: apiKey,
        ANTHROPIC_BASE_URL: "$API_BASE_URL",
        API_TIMEOUT_MS: "$API_TIMEOUT_MS",
    }
}, null, 2), "utf-8");
"@
    
    try {
        $nodeScript | Out-File -FilePath $tempScript -Encoding UTF8
        node $tempScript
    }
    finally {
        if (Test-Path $tempScript) {
            Remove-Item $tempScript -Force
        }
    }
    if (-not $?) {
        Log-Error "Failed to write settings.json"
    }
    
    Log-Success "Claude Code configured successfully"
}

# ========================
#        主流程
# ========================

function Main {
    Write-Host "[START] Starting $SCRIPT_NAME" -ForegroundColor Yellow
    
    Check-NodeJS
    Install-ClaudeCode
    Configure-ClaudeJson
    Configure-Claude
    
    Write-Host ""
    Log-Success "Installation completed successfully!"
    Write-Host ""
    Write-Host "You can now start using Claude Code with:" -ForegroundColor Yellow
    Write-Host "claude" -ForegroundColor White
}

# 执行主函数
Main
