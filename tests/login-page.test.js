import fs from 'node:fs';
import assert from 'node:assert/strict';
import test from 'node:test';

const page = fs.readFileSync(new URL('../dist/index.html', import.meta.url), 'utf8');
const styles = fs.readFileSync(new URL('../dist/styles.css', import.meta.url), 'utf8');

test('医院ログイン画面に必要な入力と初期パスワード案内がある', () => {
  assert.match(page, /name="clinicId"/);
  assert.match(page, /name="password"/);
  assert.match(page, /初期パスワード/);
  assert.match(page, /maxlength="64"/);
  assert.match(page, /4時間/);
  assert.match(page, /自院予約/);
  assert.match(page, /患者.*ログイン.*不要|患者ログイン.*なし/);
});

test('病院サイトの印象を反映した配色トークンがある', () => {
  assert.match(styles, /--navy:\s*#123b5d/i);
  assert.match(styles, /--blue-soft:\s*#eaf5f8/i);
});
