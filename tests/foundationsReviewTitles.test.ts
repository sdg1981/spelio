import foundationsExport from '../data-exports/spelio_welsh_foundations_content.json';
import type { WordList } from '../src/data/wordLists';
import { getFoundationPatternLabel, getListDisplayName } from '../src/lib/practice/wordListDisplay';

declare function require(name: string): { readFileSync(path: string, encoding: string): string };

const { readFileSync } = require('fs');

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function assertEqual<T>(actual: T, expected: T, message: string) {
  if (actual !== expected) {
    throw new Error(`${message}\nExpected: ${String(expected)}\nActual: ${String(actual)}`);
  }
}

const expectedReviews = [
  {
    id: 'foundation_patterns_mixed_confidence_1_revised', slug: 'mixed-confidence-foundations-1', order: 41, nextListId: 'foundation_patterns_ch',
    titleEn: 'Review — D/DD, Y, F/FF, W, SI', titleCy: 'Adolygiad — D/DD, Y, F/FF, W, SI',
    words: 'foundation_patterns_mixed_confidence_1_revised_001:good:da:1|foundation_patterns_mixed_confidence_1_revised_002:peace:hedd:2|foundation_patterns_mixed_confidence_1_revised_003:house:tŷ:3|foundation_patterns_mixed_confidence_1_revised_004:here:yma:4|foundation_patterns_mixed_confidence_1_revised_005:apple:afal:5|foundation_patterns_mixed_confidence_1_revised_006:coffee:coffi:6|foundation_patterns_mixed_confidence_1_revised_007:water:dŵr:7|foundation_patterns_mixed_confidence_1_revised_008:value / worth:gwerth:8|foundation_patterns_mixed_confidence_1_revised_009:shop:siop:9|foundation_patterns_mixed_confidence_1_revised_010:jacket:siaced:10'
  },
  {
    id: 'foundation_patterns_mixed_confidence_2_revised', slug: 'mixed-confidence-foundations-2', order: 46, nextListId: 'foundation_patterns_wy',
    titleEn: 'Review — CH, LL, RH, AE/AI', titleCy: 'Adolygiad — CH, LL, RH, AE/AI',
    words: 'foundation_patterns_mixed_confidence_2_revised_001:small:bach:1|foundation_patterns_mixed_confidence_2_revised_002:thanks:diolch:2|foundation_patterns_mixed_confidence_2_revised_003:hand:llaw:3|foundation_patterns_mixed_confidence_2_revised_004:place:lle:4|foundation_patterns_mixed_confidence_2_revised_005:number:rhif:5|foundation_patterns_mixed_confidence_2_revised_006:to run:rhedeg:6|foundation_patterns_mixed_confidence_2_revised_007:work:gwaith:7|foundation_patterns_mixed_confidence_2_revised_008:field:cae:8'
  },
  {
    id: 'foundation_patterns_mixed_confidence_3_revised', slug: 'mixed-confidence-foundations-3', order: 52, nextListId: 'foundation_patterns_u',
    titleEn: 'Review — WY, YW, OE, AU, AW', titleCy: 'Adolygiad — WY, YW, OE, AU, AW',
    words: 'foundation_patterns_mixed_confidence_3_revised_001:who:pwy:1|foundation_patterns_mixed_confidence_3_revised_002:gentle / mild:mwyn:2|foundation_patterns_mixed_confidence_3_revised_003:alive / living:byw:3|foundation_patterns_mixed_confidence_3_revised_004:hearing / sense of hearing:clyw:4|foundation_patterns_mixed_confidence_3_revised_005:trees / wood:coed:5|foundation_patterns_mixed_confidence_3_revised_006:two:dau:6|foundation_patterns_mixed_confidence_3_revised_007:big / large:mawr:7|foundation_patterns_mixed_confidence_3_revised_008:down:lawr:8'
  },
  {
    id: 'foundation_patterns_mixed_confidence_4_revised', slug: 'mixed-confidence-foundations-4', order: 57, nextListId: 'foundation_patterns_mixed_confidence_5',
    titleEn: 'Review — U, C, G, TH/DD', titleCy: 'Adolygiad — U, C, G, TH/DD',
    words: 'foundation_patterns_mixed_confidence_4_revised_001:black:du:1|foundation_patterns_mixed_confidence_4_revised_002:one:un:2|foundation_patterns_mixed_confidence_4_revised_003:dog:ci:3|foundation_patterns_mixed_confidence_4_revised_004:smile:gwên:4|foundation_patterns_mixed_confidence_4_revised_005:cat:cath:5|foundation_patterns_mixed_confidence_4_revised_006:poet:bardd:6'
  },
  {
    id: 'foundation_patterns_mixed_confidence_5', slug: 'mixed-confidence-foundations-5', order: 58, nextListId: 'foundations_first_words',
    titleEn: 'Final Foundations Review', titleCy: 'Adolygiad Terfynol y Sylfeini',
    words: 'foundation_patterns_mixed_confidence_5_001:yesterday:ddoe:1|foundation_patterns_mixed_confidence_5_002:today:heddiw:2|foundation_patterns_mixed_confidence_5_003:Welsh:Cymraeg:3|foundation_patterns_mixed_confidence_5_004:Wales:Cymru:4|foundation_patterns_mixed_confidence_5_005:easy:hawdd:5|foundation_patterns_mixed_confidence_5_006:weather:tywydd:6|foundation_patterns_mixed_confidence_5_007:here is / this is:dyma:7|foundation_patterns_mixed_confidence_5_008:tomorrow:yfory:8|foundation_patterns_mixed_confidence_5_009:new:newydd:9|foundation_patterns_mixed_confidence_5_010:sister:chwaer:10'
  }
] as const;

const lists = (foundationsExport.lists ?? []) as unknown as WordList[];

for (const expected of expectedReviews) {
  const list = lists.find(candidate => candidate.id === expected.id);
  assert(list, `Foundations export should include ${expected.id}.`);
  assertEqual(list.slug, expected.slug, `${expected.id} should preserve its slug.`);
  assertEqual(list.order, expected.order, `${expected.id} should preserve its journey order.`);
  assertEqual(list.nextListId, expected.nextListId, `${expected.id} should preserve its progression link.`);
  assertEqual(list.name, expected.titleEn, `${expected.id} should store its verified English review title.`);
  assertEqual(list.nameCy, expected.titleCy, `${expected.id} should store its verified Welsh review title.`);
  assertEqual(list.primerContent?.titleEn, expected.titleEn, `${expected.id} primer should match its English title.`);
  assertEqual(list.primerContent?.titleCy, expected.titleCy, `${expected.id} primer should match its Welsh title.`);
  assertEqual(getListDisplayName(list, 'en'), expected.titleEn, `${expected.id} should resolve its English title.`);
  assertEqual(getListDisplayName(list, 'cy'), expected.titleCy, `${expected.id} should resolve its Welsh title.`);
  assertEqual(getFoundationPatternLabel(list, 'en'), expected.titleEn, `${expected.id} English lesson chip should show its full review title.`);
  assertEqual(getFoundationPatternLabel(list, 'cy'), expected.titleCy, `${expected.id} Welsh lesson chip should show its full review title.`);
  assert(!getFoundationPatternLabel(list, 'en').includes('Combined Review'), `${expected.id} learner chip must not display “Combined Review”.`);

  const wordFingerprint = list.words.map(word => `${word.id}:${word.englishPrompt}:${word.welshAnswer}:${word.order}`).join('|');
  assertEqual(wordFingerprint, expected.words, `${expected.id} should preserve its exact word IDs, contents, and order.`);
}

const styles = readFileSync('src/styles.css', 'utf8');
assert(/\.learning-journey-chip\{[\s\S]*?max-width:100%;[\s\S]*?overflow-wrap:break-word;[\s\S]*?white-space:normal;/.test(styles), 'Foundation preview chips should wrap within their available width.');
assert(/\.foundations-pattern-item\{[\s\S]*?max-width:100%;[\s\S]*?flex-wrap:wrap;/.test(styles), 'Expanded Foundation lesson chips should contain long labels and status text.');
assert(styles.includes('.foundations-pattern-item.selected{'), 'Selected Foundation lesson styling should remain present.');
assert(styles.includes('.foundations-pattern-item.completed{'), 'Completed Foundation lesson styling should remain present.');

console.log('Foundations review title tests passed.');
