# -*- coding: utf-8 -*-
"""
汉字笔顺 GIF 链接抓取工具
使用 Selenium 模拟浏览器访问百度汉语，获取汉字笔顺动态图链接
"""

import time
import random
import re
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

# 导入 3500 个常用汉字
from chinese_3500_chars import ALL_CHARS_3500

# 汉字列表（使用 3500 个常用汉字，去重后约 1200+ 个）
CHARS_TO_SCRAP = ALL_CHARS_3500

# 搜索关键词模板列表（按优先级排序，越靠前越容易找到 GIF）
# 百度汉语笔顺动画 URL 格式：https://hanyu.baidu.com/shici/detail?pid=xxx
SEARCH_TEMPLATES = [
    "{0}的笔顺",
    "{0}字笔顺",
    "{0}的笔画顺序",
    "汉字{0}的笔顺动画",
    "{0}字笔顺动画演示",
    "{0}的笔顺动态图",
    "汉字{0}笔画顺序动画",
    "{0}的笔顺 gif",
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

    Args:
        driver: Selenium WebDriver
        char: 要查询的汉字
        templates: 搜索关键词模板列表（按优先级排序）

    Returns:
        (GIF 链接，使用的模板索引) 或 (None, -1)
    """
    try:
        # 按优先级尝试每个搜索模板
        for template_idx, template in enumerate(templates):
            # 构建搜索 URL
            search_word = template.format(char)
            search_url = "https://www.baidu.com/s?wd={0}&ie=utf-8".format(search_word)
            driver.get(search_url)

            # 等待页面加载
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
                    # 如果没有百度资源，返回第一个匹配
                    return (matches[0], template_idx)

            # 尝试查找百度汉语页面的笔顺动画链接
            # 百度汉语笔顺页面通常包含 shici/detail 或笔顺相关 div
            try:
                # 查找包含"笔顺"的链接
                bishun_links = re.findall(r'href="(https://hanyu\.baidu\.com/[^"]*笔顺[^"]*)"', page_source)
                if bishun_links:
                    # 访问笔顺页面
                    driver.get(bishun_links[0])
                    time.sleep(2)
                    new_page_source = driver.page_source

                    for pattern in gif_patterns:
                        matches = re.findall(pattern, new_page_source)
                        if matches:
                            return (matches[0], template_idx)
            except:
                pass

        # 所有模板都尝试过了，仍未找到
        return (None, -1)

    except Exception as e:
        print("获取 '{0}' 的 GIF 链接失败：{1}".format(char, e))
        return (None, -1)


def append_result(char, gif_url, filename="chinese_char_gifs.txt"):
    """
    追加单个结果到文件

    Args:
        char: 汉字
        gif_url: GIF 链接
        filename: 输出文件名
    """
    with open(filename, 'a', encoding='utf-8') as f:
        f.write("'{0}': '{1}',\n".format(char, gif_url))


def save_results(results, filename="chinese_char_gifs.txt"):
    """
    保存结果到文件

    Args:
        results: 字典，{汉字：GIF 链接}
        filename: 输出文件名
    """
    with open(filename, 'w', encoding='utf-8') as f:
        for char, gif_url in results.items():
            f.write("'{0}': '{1}',\n".format(char, gif_url))
    print("结果已保存到 {0}".format(filename))


def main():
    """主函数"""
    print("正在启动浏览器...")
    driver = setup_driver()

    # 要查询的汉字列表
    chars_to_query = CHARS_TO_SCRAP

    print("共加载 {0} 个汉字".format(len(chars_to_query)))

    # 存储结果
    results = {}
    failed_chars = []

    # 尝试读取已有的结果文件，避免重复抓取
    try:
        with open("chinese_char_gifs.txt", 'r', encoding='utf-8') as f:
            content = f.read()
            # 解析已有结果
            pattern = r"'([^'])+':\s*'([^']+\.gif)'"
            for match in re.finditer(pattern, content):
                char = match.group(1)
                gif_url = match.group(2)
                results[char] = gif_url
            if results:
                print("从已有文件加载了 {0} 个结果".format(len(results)))
    except FileNotFoundError:
        pass

    print("开始抓取 {0} 个汉字的笔顺 GIF 链接...".format(len(chars_to_query)))
    print("结果将边查边写入到 chinese_char_gifs.txt 文件中")
    print("按模板优先级顺序尝试，找到 GIF 即停止\n")

    for i, char in enumerate(chars_to_query):
        # 跳过已抓取的汉字
        if char in results:
            print("[{0}/{1}] '{2}' 已存在，跳过".format(i+1, len(chars_to_query), char))
            continue

        print("[{0}/{1}] 正在查询汉字：{2}".format(i+1, len(chars_to_query), char))

        # 使用所有模板尝试获取 GIF，直到找到为止
        gif_url, used_template_idx = get_gif_url(driver, char, SEARCH_TEMPLATES)

        if gif_url:
            results[char] = gif_url
            # 立即写入文件
            append_result(char, gif_url)
            print("  [OK] 找到：{0}...".format(gif_url[:50]))
            print("  使用模板：{0}".format(SEARCH_TEMPLATES[used_template_idx]))
        else:
            failed_chars.append(char)
            print("  [FAIL] 所有模板都未找到 GIF 链接")

        # 随机延迟 15-60 秒，避免被发现
        if i < len(chars_to_query) - 1:  # 最后一个不需要延迟
            delay = random.uniform(15, 60)
            print("  等待 {0:.1f} 秒...".format(delay))
            time.sleep(delay)

    # 保存结果
    save_results(results)

    # 输出失败统计
    if failed_chars:
        print("\n共 {0} 个汉字未找到 GIF 链接:".format(len(failed_chars)))
        print(failed_chars)

    print("\n抓取完成！成功：{0}, 失败：{1}".format(len(results), len(failed_chars)))

    driver.quit()


if __name__ == "__main__":
    main()
