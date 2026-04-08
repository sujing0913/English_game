# -*- coding: utf-8 -*-
"""
修复脚本 - 重新获取无效 GIF 链接的汉字
"""

import time
import random
import re
from selenium import webdriver
from selenium.webdriver.chrome.options import Options

# 需要修复的汉字列表
CHARS_TO_FIX = ['毕', '巩', '芍', '冉', '肠']

# 搜索关键词模板列表（按优先级排序）
SEARCH_TEMPLATES = [
    "{0}的笔顺",
    "{0}字笔顺",
    "{0}的笔画顺序",
    "汉字{0}的笔顺动画",
    "{0}字笔顺动画演示",
]

def setup_driver():
    """配置 Chrome 浏览器驱动"""
    chrome_options = Options()
    chrome_options.add_argument("--disable-gpu")
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    chrome_options.add_argument("--disable-blink-features=AutomationControlled")
    chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
    chrome_options.add_experimental_option('useAutomationExtension', False)
    chrome_options.add_argument("user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")

    driver = webdriver.Chrome(options=chrome_options)

    # 执行 CDP 命令隐藏 webdriver 特征
    driver.execute_cdp_cmd("Page.addScriptToEvaluateOnNewDocument", {
        "source": """
        Object.defineProperty(navigator, 'webdriver', {
            get: () => undefined
        })
        """
    })

    return driver


def get_gif_url(driver, char, templates):
    """
    获取指定汉字的笔顺 GIF 链接

    Returns:
        (GIF 链接，使用的模板索引) 或 (None, -1)
    """
    try:
        # 按优先级尝试每个搜索模板
        for template_idx, template in enumerate(templates):
            search_word = template.format(char)
            search_url = "https://www.baidu.com/s?wd={0}&ie=utf-8".format(search_word)
            driver.get(search_url)

            time.sleep(2)
            page_source = driver.page_source

            # 使用多个正则表达式查找 GIF 链接
            gif_patterns = [
                r'https://hanyu-word-gif\.cdn\.bcebos\.com/[a-zA-Z0-9_-]+\.gif',
                r'https://[a-zA-Z0-9.-]+/[^"\s]+\.gif',
                r'data-src="(https://[^"]+\.gif)"',
                r'src="(https://[^"]+\.gif)"',
            ]

            for pattern in gif_patterns:
                matches = re.findall(pattern, page_source)
                if matches:
                    # 过滤掉广告和无关 GIF
                    for match in matches:
                        if 'bcebos' in match or 'hanyu' in match.lower():
                            return (match, template_idx)
                    return (matches[0], template_idx)

            # 尝试查找百度汉语页面的笔顺动画链接
            try:
                bishun_links = re.findall(r'href="(https://hanyu\.baidu\.com/[^"]*笔顺[^"]*)"', page_source)
                if bishun_links:
                    driver.get(bishun_links[0])
                    time.sleep(2)
                    new_page_source = driver.page_source

                    for pattern in gif_patterns:
                        matches = re.findall(pattern, new_page_source)
                        if matches:
                            return (matches[0], template_idx)
            except:
                pass

        return (None, -1)

    except Exception as e:
        print("获取 '{0}' 的 GIF 链接失败：{1}".format(char, e))
        return (None, -1)


def fix_file(filename="chinese_char_gifs.txt"):
    """修复文件中的无效链接"""

    # 读取文件内容
    with open(filename, 'r', encoding='utf-8') as f:
        content = f.read()

    # 读取已有结果
    results = {}
    pattern = r"'([^']+)':\s*'([^']+)'"
    for match in re.finditer(pattern, content):
        char = match.group(1)
        gif_url = match.group(2)
        # 跳过无效链接
        if 'icons' in gif_url:
            print("发现无效链接：{0} -> {1}".format(char, gif_url[:50]))
        else:
            results[char] = gif_url

    print("\n开始修复 {0} 个汉字...".format(len(CHARS_TO_FIX)))

    driver = setup_driver()
    fixed_count = 0

    for char in CHARS_TO_FIX:
        print("\n正在修复：{0}".format(char))

        gif_url, template_idx = get_gif_url(driver, char, SEARCH_TEMPLATES)

        if gif_url:
            # 确保是有效的 bcebos 链接
            if 'bcebos.com' in gif_url and '.gif' in gif_url:
                results[char] = gif_url
                print("  [OK] 找到：{0}".format(gif_url))
                print("  使用模板：{0}".format(SEARCH_TEMPLATES[template_idx]))
                fixed_count += 1
            else:
                print("  [WARN] 找到的链接可能无效：{0}".format(gif_url[:60]))
        else:
            print("  [FAIL] 未找到 GIF 链接")

        # 延迟
        if CHARS_TO_FIX.index(char) < len(CHARS_TO_FIX) - 1:
            delay = random.uniform(15, 30)
            time.sleep(delay)

    driver.quit()

    # 保存结果
    print("\n保存修复结果...")
    with open(filename, 'w', encoding='utf-8') as f:
        for char, gif_url in results.items():
            f.write("'{0}': '{1}',\n".format(char, gif_url))

    print("修复完成！成功修复：{0}/{1}".format(fixed_count, len(CHARS_TO_FIX)))
    print("结果已保存到 {0}".format(filename))


if __name__ == "__main__":
    fix_file()
