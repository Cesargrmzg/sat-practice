#!/usr/bin/env python3
"""Generate a Spanish question bank from the English source data."""

from __future__ import annotations

import json
import re
import time
from pathlib import Path

import requests
from lxml import html

SRC = Path('public/data/questions.json')
OUT = Path('public/data/questions.es.json')
CACHE = Path('public/data/questions.es.cache.json')
URL = 'https://translate.googleapis.com/translate_a/single'

session = requests.Session()


def normalize_math_markup(fragment: str) -> str:
    if not fragment:
        return fragment
    root = html.fragment_fromstring(fragment, create_parent='div')
    for node in list(root.xpath('.//*[local-name()="mfenced"]')):
        parent = node.getparent()
        if parent is None:
            continue
        open_char = node.get('open') or '('
        close_char = node.get('close') or ')'
        open_mo = html.Element('mo')
        open_mo.text = open_char
        parent.insert(parent.index(node), open_mo)
        insert_at = parent.index(node)
        for child in list(node):
            node.remove(child)
            parent.insert(insert_at, child)
            insert_at += 1
        close_mo = html.Element('mo')
        close_mo.text = close_char
        parent.insert(insert_at, close_mo)
        parent.remove(node)
    return serialize_fragment(root)


def serialize_fragment(root) -> str:
    parts = [root.text or '']
    for child in root:
        parts.append(html.tostring(child, encoding='unicode', method='html'))
        if child.tail:
            parts.append(child.tail)
    return ''.join(parts)


def make_placeholders(fragment: str) -> tuple[str, dict[str, str]]:
    if not fragment:
        return fragment, {}

    root = html.fragment_fromstring(fragment, create_parent='div')
    placeholders: dict[str, str] = {}
    counter = 0

    def replace_node(node, placeholder: str) -> None:
        parent = node.getparent()
        if parent is None:
            return
        idx = parent.index(node)
        marker = html.Element('span')
        marker.set('class', 'notranslate')
        marker.text = placeholder
        parent.insert(idx, marker)
        parent.remove(node)

    for selector in ['math', 'svg', 'figure.table', 'figure.image', 'table', 'noscript']:
        for node in list(root.xpath(f'.//*[local-name()="{selector.split(".")[0]}"]')):
            if selector == 'figure.table' and not ('table' in ''.join(node.get('class', '').split())):
                continue
            if selector == 'figure.image' and not ('image' in ''.join(node.get('class', '').split())):
                continue
            placeholder = f'[[[{selector.upper().replace(".", "_")}_{counter}]]]' 
            placeholders[placeholder] = html.tostring(node, encoding='unicode', method='html')
            replace_node(node, placeholder)
            counter += 1

    return serialize_fragment(root), placeholders


def restore_placeholders(fragment: str, placeholders: dict[str, str]) -> str:
    for placeholder, original in placeholders.items():
        fragment = fragment.replace(f'<span class="notranslate">{placeholder}</span>', original)
        fragment = fragment.replace(placeholder, original)
    return fragment


def translate_html(fragment: str) -> str:
    protected, placeholders = make_placeholders(normalize_math_markup(fragment))
    params = [
        ('client', 'gtx'),
        ('sl', 'en'),
        ('tl', 'es'),
        ('dt', 't'),
        ('q', protected),
    ]
    for attempt in range(4):
        try:
            res = session.get(URL, params=params, timeout=30)
            res.raise_for_status()
            translated = res.json()[0][0][0]
            return restore_placeholders(translated, placeholders)
        except Exception:
            if attempt == 3:
                raise
            time.sleep(1 + attempt)


def load_cache() -> dict[str, dict]:
    if not CACHE.exists():
        return {}
    try:
        return json.loads(CACHE.read_text())
    except Exception:
        return {}


def save_cache(cache: dict[str, dict]) -> None:
    CACHE.write_text(json.dumps(cache, ensure_ascii=False, separators=(',', ':')))


def translate_question(question: dict) -> dict:
    out = dict(question)
    out['stem'] = translate_html(question.get('stem', ''))
    out['rationale'] = translate_html(question.get('rationale', ''))
    if question.get('skill_desc'):
        out['skill_desc'] = translate_html(question['skill_desc'])
    if question.get('answer_options'):
        out['answer_options'] = [
            {**opt, 'content': translate_html(opt.get('content', ''))}
            for opt in question['answer_options']
        ]
    return out


def main() -> None:
    questions = json.loads(SRC.read_text())
    cache = load_cache()
    out = []

    for idx, question in enumerate(questions, start=1):
        qid = question['external_id']
        if qid in cache:
            out.append(cache[qid])
            continue

        translated = translate_question(question)
        cache[qid] = translated
        out.append(translated)

        if idx % 10 == 0:
            save_cache(cache)
            OUT.write_text(json.dumps(out, ensure_ascii=False, separators=(',', ':')))
            print(f'Processed {idx}/{len(questions)}', flush=True)

    save_cache(cache)
    OUT.write_text(json.dumps(out, ensure_ascii=False, separators=(',', ':')))
    print(f'Wrote {OUT}')


if __name__ == '__main__':
    main()
