# -*- coding: utf-8 -*-
"""
修复脚本 v2 - 使用更多搜索模板尝试获取无效 GIF 链接的汉字
"""

import time
import random
import re
from selenium import webdriver
from selenium.webdriver.chrome.options import Options

# 需要修复的汉字列表
CHARS_TO_FIX = ['肠', '筹', '盖', '滚', '禁']

# 更多搜索关键词模板
SEARCH_TEMPLATES = [
    "{0}的笔顺",
    "{0}字笔顺",
    "{0}的笔画顺序",
    "汉字{0}笔顺",
    "{0}的笔顺动画",
    "{0}字笔顺动画",
    "笔顺 {0}",
    "{0} 笔画",
    "{0}的笔顺怎么写",
    "{0}字怎么写",
    "汉字{0}的笔画",
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
    driver.execute_cdp_cmd("Page.addScriptToEvaluateOnNewDocument", {
        "source": """
        Object.defineProperty(navigator, 'webdriver', {
            get: () => undefined
        })
        """
    })

    return driver


def get_gif_url(driver, char, templates):
    """获取指定汉字的笔顺 GIF 链接"""
    try:
        for template_idx, template in enumerate(templates):
            search_word = template.format(char)
            search_url = "https://www.baidu.com/s?wd={0}&ie=utf-8".format(search_word)
            driver.get(search_url)
            time.sleep(2)
            page_source = driver.page_source

            # 只匹配 bcebos.com 的 gif 链接
            gif_pattern = r'https://hanyu-word-gif\.cdn\.bcebos\.com/[a-zA-Z0-9_-]+\.gif'
            matches = re.findall(gif_pattern, page_source)

            if matches:
                # 确保不是 icons.png
                for match in matches:
                    if 'icons' not in match and match.endswith('.gif'):
                        return (match, template_idx)

            # 尝试查找百度汉语页面
            try:
                bishun_links = re.findall(r'href="(https://hanyu\.baidu\.com/[^"]*笔顺[^"]*)"', page_source)
                if bishun_links:
                    driver.get(bishun_links[0])
                    time.sleep(2)
                    new_page_source = driver.page_source
                    matches = re.findall(gif_pattern, new_page_source)
                    if matches:
                        for match in matches:
                            if 'icons' not in match and match.endswith('.gif'):
                                return (match, template_idx)
            except:
                pass

        return (None, -1)

    except Exception as e:
        print("获取 '{0}' 的 GIF 链接失败：{1}".format(char, e))
        return (None, -1)


def fix_file(filename="chinese_char_gifs.txt"):
    """修复文件中的无效链接"""
    with open(filename, 'r', encoding='utf-8') as f:
        content = f.read()

    results = {}
    pattern = r"'([^']+)':\s*'([^']+)'"
    for match in re.finditer(pattern, content):
        char = match.group(1)
        gif_url = match.group(2)
        if 'icons' in gif_url or 'png' in gif_url:
            print("需要修复：{0}".format(char))
        else:
            results[char] = gif_url

    print("\n开始修复 {0} 个汉字...".format(len(CHARS_TO_FIX)))
    driver = setup_driver()
    fixed_count = 0

    for char in CHARS_TO_FIX:
        print("\n正在修复：{0}".format(char))
        gif_url, template_idx = get_gif_url(driver, char, SEARCH_TEMPLATES)

        if gif_url:
            results[char] = gif_url
            print("  [OK] 找到：{0}".format(gif_url))
            print("  使用模板：{0}".format(SEARCH_TEMPLATES[template_idx]))
            fixed_count += 1
        else:
            print("  [FAIL] 未找到有效 GIF 链接")

        if CHARS_TO_FIX.index(char) < len(CHARS_TO_FIX) - 1:
            delay = random.uniform(15, 30)
            time.sleep(delay)

    driver.quit()

    print("\n保存修复结果...")
    with open(filename, 'w', encoding='utf-8') as f:
        for char, gif_url in results.items():
            f.write("'{0}': '{1}',\n".format(char, gif_url))

    print("修复完成！成功修复：{0}/{1}".format(fixed_count, len(CHARS_TO_FIX)))


if __name__ == "__main__":
    fix_file()
