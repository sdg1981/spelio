import { useEffect, useMemo, useState } from 'react';
import type { ComponentType, ReactNode } from 'react';
import { BookOpen, ChevronLeft, ChevronRight, Ear, Lightbulb, Volume2 } from 'lucide-react';
import { PublicPageShell } from './PublicInfoPages';
import {
  spellingBasicsCategories,
  spellingBasicsTopics,
  type LocalizedString,
  type SpellingBasicsIconKey,
  type SpellingBasicsPhoneticOrientation,
  type SpellingBasicsTopic,
  type SpellingBasicsTopicCard,
  type SpellingBasicsTopicSlug
} from '../content/spellingBasics';
import type { InterfaceLanguage, Translate } from '../i18n';
import type { WordList } from '../data/wordLists';
import {
  createSupportPracticeRoute,
  handleSpellingBasicsExampleAudioClick,
  resolveSpellingBasicsExampleAudio,
  type SpellingBasicsAudioResolution
} from '../lib/spellingBasicsAudio';

type WelshSpellingBasicsPageProps = {
  interfaceLanguage: InterfaceLanguage;
  onBack: () => void;
  onHome: () => void;
  onInterfaceLanguageChange: (language: InterfaceLanguage) => void;
  onOpenTopic: (slug: SpellingBasicsTopicSlug) => void;
  onStartPractice?: (practiceListId: string, topicSlug: SpellingBasicsTopicSlug) => void;
  isPracticeListAvailable?: (practiceListId: string) => boolean;
  wordLists?: WordList[];
  t: Translate;
};

type IconComponent = ComponentType<{ size?: number; strokeWidth?: number; 'aria-hidden'?: boolean }>;

const iconMap: Record<SpellingBasicsIconKey, IconComponent> = {
  ear: Ear,
  book: BookOpen,
  lightbulb: Lightbulb
};

function localize(value: LocalizedString, language: InterfaceLanguage) {
  return value[language] ?? value.en;
}

const englishReferenceWords = [
  'Scottish loch',
  'church',
  'this',
  'food',
  'cat',
  'bed',
  'see',
  'hot',
  'van',
  'fish'
];

function renderLocalizedText(value: LocalizedString, language: InterfaceLanguage): ReactNode {
  const text = localize(value, language);

  if (language !== 'cy') {
    return text;
  }

  const pattern = new RegExp(`(${englishReferenceWords.map(word => word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'g');
  const parts = text.split(pattern);

  return parts.map((part, index) => (
    englishReferenceWords.includes(part)
      ? <span className="spelling-basics-english-reference" lang="en" key={`${part}-${index}`}>{part}</span>
      : part
  ));
}

function getIcon(iconKey: SpellingBasicsIconKey | undefined) {
  return iconKey ? iconMap[iconKey] : Lightbulb;
}

export function WelshSpellingBasicsOverview({
  interfaceLanguage,
  onBack,
  onHome,
  onInterfaceLanguageChange,
  onOpenTopic,
  t
}: WelshSpellingBasicsPageProps) {
  const startCategory = spellingBasicsCategories.find(category => category.id === 'start');
  const soundsCategory = spellingBasicsCategories.find(category => category.id === 'sounds');
  const accentsCategory = spellingBasicsCategories.find(category => category.id === 'accents');
  const startTopics = startCategory ? startCategory.topicSlugs.map(slug => spellingBasicsTopics.find(topic => topic.slug === slug)).filter(Boolean) as SpellingBasicsTopic[] : [];
  const soundTopics = soundsCategory ? soundsCategory.topicSlugs.map(slug => spellingBasicsTopics.find(topic => topic.slug === slug)).filter(Boolean) as SpellingBasicsTopic[] : [];
  const accentTopic = accentsCategory ? spellingBasicsTopics.find(topic => topic.slug === accentsCategory.topicSlugs[0]) ?? null : null;

  return (
    <PublicPageShell
      contentClassName="spelling-basics-public-content"
      interfaceLanguage={interfaceLanguage}
      onBack={onBack}
      onHome={onHome}
      onInterfaceLanguageChange={onInterfaceLanguageChange}
      titleId="spelling-basics-title"
      t={t}
    >
      <div className="spelling-basics-page spelling-basics-overview">
        <header className="spelling-basics-intro">
          <h1 id="spelling-basics-title">{t('spellingBasics.overview.title')}</h1>
          <p>{t('spellingBasics.overview.intro')}</p>
        </header>

        {startCategory && (
          <section className="spelling-basics-section" aria-labelledby="spelling-basics-start">
            <h2 id="spelling-basics-start">{localize(startCategory.title, interfaceLanguage)}</h2>
            <div className="spelling-basics-start-grid">
              {startTopics.map(topic => {
                const Icon = getIcon(topic.iconKey);
                return (
                  <button
                    className="spelling-basics-card spelling-basics-start-card"
                    type="button"
                    onClick={() => onOpenTopic(topic.slug)}
                    key={topic.slug}
                  >
                    <span className="spelling-basics-icon-circle" aria-hidden="true">
                      <Icon size={28} strokeWidth={2} />
                    </span>
                    <span>{localize(topic.overviewTitle, interfaceLanguage)}</span>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {soundsCategory && (
          <section className="spelling-basics-section" aria-labelledby="spelling-basics-sounds">
            <h2 id="spelling-basics-sounds">{localize(soundsCategory.title, interfaceLanguage)}</h2>
            <div className="spelling-basics-sound-grid">
              {soundTopics.map(topic => (
                <button
                  className="spelling-basics-sound-tile"
                  type="button"
                  key={topic.slug}
                  onClick={() => onOpenTopic(topic.slug)}
                  aria-label={localize(topic.overviewTitle, interfaceLanguage)}
                >
                  {topic.symbol ?? localize(topic.overviewTitle, interfaceLanguage)}
                </button>
              ))}
            </div>
          </section>
        )}

        {accentsCategory && accentTopic && (
          <section className="spelling-basics-section" aria-labelledby="spelling-basics-accents">
            <h2 id="spelling-basics-accents">{localize(accentsCategory.title, interfaceLanguage)}</h2>
            <button
              className="spelling-basics-card spelling-basics-accent-card"
              type="button"
              onClick={() => onOpenTopic(accentTopic.slug)}
            >
              <span className="spelling-basics-icon-circle spelling-basics-accent-symbol" aria-hidden="true">{accentTopic.symbol}</span>
              <span className="spelling-basics-accent-copy">
                <strong>{localize(accentTopic.overviewTitle, interfaceLanguage)}</strong>
                {accentTopic.overviewBody && <span>{localize(accentTopic.overviewBody, interfaceLanguage)}</span>}
                {accentTopic.kind === 'series' && <small>{t('spellingBasics.overview.accentsCount')}</small>}
              </span>
              <ChevronRight className="spelling-basics-card-chevron" size={26} strokeWidth={2.2} aria-hidden="true" />
            </button>
          </section>
        )}
      </div>
    </PublicPageShell>
  );
}

export function WelshSpellingBasicsTopicPage({
  interfaceLanguage,
  onBack,
  onHome,
  onInterfaceLanguageChange,
  isPracticeListAvailable,
  onStartPractice,
  wordLists = [],
  topic,
  t
}: Omit<WelshSpellingBasicsPageProps, 'onOpenTopic'> & {
  topic: SpellingBasicsTopic;
}) {
  const [seriesIndex, setSeriesIndex] = useState(0);
  const [selectedSoundIndex, setSelectedSoundIndex] = useState(0);

  useEffect(() => {
    setSeriesIndex(0);
    setSelectedSoundIndex(0);
  }, [topic.slug]);

  const activeCard = topic.kind === 'series' ? topic.cards[seriesIndex] : topic.card;
  const isPhoneticOrientation = topic.slug === 'phonetic' && Boolean(topic.phoneticOrientation);
  const titleId = `spelling-basics-${topic.slug}-title`;
  const isSeries = topic.kind === 'series';
  const hasPrevious = isSeries && seriesIndex > 0;
  const hasNext = isSeries && seriesIndex < topic.cards.length - 1;
  const pageTitle = isSeries
    ? topic.overviewTitle
    : activeCard.subtitle
      ? activeCard.subtitle
      : topic.overviewTitle;
  const canStartPractice = Boolean(
    !isPhoneticOrientation &&
    !(topic.slug === 'accents' && seriesIndex === 0) &&
    topic.practiceListId &&
    onStartPractice &&
    (!isPracticeListAvailable || isPracticeListAvailable(topic.practiceListId))
  );
  const practiceRoute = topic.practiceListId
    ? createSupportPracticeRoute(topic.practiceListId, `/spelling-basics/${topic.slug}`)
    : null;

  return (
    <PublicPageShell
      contentClassName="spelling-basics-public-content spelling-basics-topic-public-content"
      interfaceLanguage={interfaceLanguage}
      onBack={onBack}
      onHome={onHome}
      onInterfaceLanguageChange={onInterfaceLanguageChange}
      titleId={titleId}
      t={t}
    >
      <article className="spelling-basics-page spelling-basics-topic" aria-labelledby={titleId}>
        <header className="spelling-basics-topic-hero">
          <TopicHeroMarker topic={topic} />
          <h1 id={titleId}>{renderLocalizedText(pageTitle, interfaceLanguage)}</h1>
        </header>

        {isSeries && (
          <div className="spelling-basics-series-status" aria-live="polite">
            {t('spellingBasics.topic.seriesStatus')} {seriesIndex + 1} of {topic.cards.length}
          </div>
        )}

        {isPhoneticOrientation && topic.phoneticOrientation ? (
          <PhoneticOrientationContent
            content={topic.phoneticOrientation}
            introCard={activeCard}
            interfaceLanguage={interfaceLanguage}
            wordLists={wordLists}
            selectedSoundIndex={selectedSoundIndex}
            onSelectedSoundIndexChange={setSelectedSoundIndex}
            t={t}
          />
        ) : (
          <TopicCardContent
            card={activeCard}
            interfaceLanguage={interfaceLanguage}
            preferredPracticeListId={topic.practiceListId}
            showTitle={isSeries}
            wordLists={wordLists}
            t={t}
          />
        )}

        {canStartPractice && topic.practiceListId && onStartPractice && (
          <button
            className="spelling-basics-practice-row"
            type="button"
            onClick={() => onStartPractice(topic.practiceListId as string, topic.slug)}
            data-href={practiceRoute ?? undefined}
          >
            <span className="spelling-basics-mini-symbol" aria-hidden="true">{topic.symbol}</span>
            <span>{t('spellingBasics.topic.practicePattern')}</span>
            <ChevronRight size={24} strokeWidth={2.2} aria-hidden="true" />
          </button>
        )}

        {isSeries && (
          <div className="spelling-basics-series-controls">
            <button type="button" onClick={() => setSeriesIndex(index => Math.max(0, index - 1))} disabled={!hasPrevious}>
              <ChevronLeft size={21} strokeWidth={2.2} aria-hidden="true" />
              <span>{t('spellingBasics.topic.previousCard')}</span>
            </button>
            <button type="button" onClick={() => setSeriesIndex(index => Math.min(topic.cards.length - 1, index + 1))} disabled={!hasNext}>
              <span>{t('spellingBasics.topic.nextCard')}</span>
              <ChevronRight size={21} strokeWidth={2.2} aria-hidden="true" />
            </button>
          </div>
        )}
      </article>
    </PublicPageShell>
  );
}

function TopicHeroMarker({ topic }: { topic: SpellingBasicsTopic }) {
  if (topic.symbol) {
    return <span className="spelling-basics-topic-symbol" aria-hidden="true">{topic.symbol}</span>;
  }

  const Icon = getIcon(topic.iconKey);
  return (
    <span className="spelling-basics-topic-symbol spelling-basics-topic-icon" aria-hidden="true">
      <Icon size={44} strokeWidth={1.9} />
    </span>
  );
}

function TopicCardContent({
  card,
  interfaceLanguage,
  preferredPracticeListId,
  showTitle,
  wordLists,
  t
}: {
  card: SpellingBasicsTopicCard;
  interfaceLanguage: InterfaceLanguage;
  preferredPracticeListId?: string;
  showTitle: boolean;
  wordLists: WordList[];
  t: Translate;
}) {
  return (
    <>
      <div className="spelling-basics-topic-body">
        {showTitle && card.title && <h2>{localize(card.title, interfaceLanguage)}</h2>}
        {!showTitle && card.title && <h2 className="spelling-basics-visually-hidden">{localize(card.title, interfaceLanguage)}</h2>}
        {card.body.map((paragraph, index) => (
          <p key={index}>{renderLocalizedText(paragraph, interfaceLanguage)}</p>
        ))}
        {card.observation && (
          <div className="spelling-basics-observation">
            <strong>{renderLocalizedText(card.observation.title, interfaceLanguage)}</strong>
            {card.observation.body.map((paragraph, index) => (
              <p key={index}>{renderLocalizedText(paragraph, interfaceLanguage)}</p>
            ))}
          </div>
        )}
      </div>

      {card.examples && card.examples.length > 0 && (
        <section className="spelling-basics-examples-card" aria-labelledby="spelling-basics-topic-examples">
          <h2 id="spelling-basics-topic-examples">{t('spellingBasics.topic.examplesHeading')}</h2>
          <div className="spelling-basics-example-list">
            {card.examples.map(example => {
              const showMeaning = interfaceLanguage !== 'cy' && Boolean(example.meaning);
              const audio = resolveSpellingBasicsExampleAudio(example.welsh, wordLists, preferredPracticeListId);

              return (
                <div className={`spelling-basics-example-row ${showMeaning ? '' : 'no-meaning'}`} key={example.welsh}>
                  <strong>{example.welsh}</strong>
                  {showMeaning && example.meaning && <span>{localize(example.meaning, interfaceLanguage)}</span>}
                  <SpellingBasicsAudioButton
                    audio={audio}
                    interfaceLanguage={interfaceLanguage}
                    labelWord={example.welsh}
                    size={23}
                    t={t}
                  />
                </div>
              );
            })}
          </div>
        </section>
      )}

      {card.tip && (
        <aside className="spelling-basics-tip-card">
          <Lightbulb size={31} strokeWidth={1.9} aria-hidden="true" />
          <p><strong>{t('spellingBasics.topic.tipLabel')}</strong> {renderLocalizedText(card.tip, interfaceLanguage)}</p>
        </aside>
      )}
    </>
  );
}

function PhoneticOrientationContent({
  content,
  introCard,
  interfaceLanguage,
  wordLists,
  selectedSoundIndex,
  onSelectedSoundIndexChange,
  t
}: {
  content: SpellingBasicsPhoneticOrientation;
  introCard: SpellingBasicsTopicCard;
  interfaceLanguage: InterfaceLanguage;
  wordLists: WordList[];
  selectedSoundIndex: number;
  onSelectedSoundIndexChange: (index: number) => void;
  t: Translate;
}) {
  const selectedSound = content.sounds[selectedSoundIndex] ?? content.sounds[0];
  const selectedSoundAudio = useMemo(
    () => selectedSound ? resolveSpellingBasicsExampleAudio(selectedSound.example, wordLists) : null,
    [selectedSound, wordLists]
  );
  const patternWordAudio = useMemo(
    () => content.patternExample ? resolveSpellingBasicsExampleAudio(content.patternExample.word, wordLists) : null,
    [content.patternExample, wordLists]
  );
  const labels = interfaceLanguage === 'cy'
    ? {
        sound: 'Gall swnio ychydig fel:',
        example: 'Enghraifft:'
      }
    : {
        sound: 'Can sound a little like:',
        example: 'Example:'
      };

  return (
    <>
      <div className="spelling-basics-topic-body spelling-basics-phonetic-intro">
        {introCard.body.map((paragraph, index) => (
          <p key={index}>{renderLocalizedText(paragraph, interfaceLanguage)}</p>
        ))}
      </div>

      <section className="spelling-basics-phonetic-section" aria-labelledby="spelling-basics-phonetic-sounds">
        <div className="spelling-basics-phonetic-section-copy">
          <h2 id="spelling-basics-phonetic-sounds">{localize(content.soundSectionTitle, interfaceLanguage)}</h2>
          <p>{renderLocalizedText(content.soundSectionBody, interfaceLanguage)}</p>
        </div>

        <div className="spelling-basics-phonetic-sound-grid">
          {content.sounds.map((sound, index) => (
            <button
              className={`spelling-basics-phonetic-sound ${index === selectedSoundIndex ? 'selected' : ''}`}
              type="button"
              onClick={() => onSelectedSoundIndexChange(index)}
              aria-pressed={index === selectedSoundIndex}
              key={sound.symbol}
            >
              {sound.symbol}
            </button>
          ))}
        </div>

        {selectedSound && (
          <div className="spelling-basics-sound-detail" aria-live="polite">
            <strong>{selectedSound.symbol}</strong>
            <p><span>{labels.sound}</span> {renderLocalizedText(selectedSound.hint, interfaceLanguage)}</p>
            <p className="spelling-basics-sound-detail-example">
              <span>{labels.example}</span> {selectedSound.example}
              {selectedSoundAudio && (
                <SpellingBasicsAudioButton
                  audio={selectedSoundAudio}
                  interfaceLanguage={interfaceLanguage}
                  labelWord={selectedSound.example}
                  size={19}
                  t={t}
                />
              )}
            </p>
            {selectedSound.symbol === 'll' && (
              <p className="spelling-basics-sound-detail-note">{renderLocalizedText(content.llNote, interfaceLanguage)}</p>
            )}
          </div>
        )}
      </section>

      {content.patternExample && (
        <section className="spelling-basics-pattern-example" aria-labelledby="spelling-basics-pattern-example-title">
          <div className="spelling-basics-pattern-example-copy">
            <h2 id="spelling-basics-pattern-example-title">
              {localize(content.patternExample.title, interfaceLanguage)}
            </h2>
            <p>{renderLocalizedText(content.patternExample.body, interfaceLanguage)}</p>
          </div>

          <div className="spelling-basics-pattern-row" aria-label={content.patternExample.patterns.join(' plus ')}>
            {content.patternExample.patterns.map((pattern, index) => (
              <span className="spelling-basics-pattern-chip" key={pattern}>
                {pattern}
                {index < content.patternExample!.patterns.length - 1 && (
                  <span className="spelling-basics-pattern-plus" aria-hidden="true">·</span>
                )}
              </span>
            ))}
          </div>

          <div className="spelling-basics-pattern-word-card">
            <strong>{content.patternExample.word}</strong>
            {patternWordAudio && (
              <SpellingBasicsAudioButton
                audio={patternWordAudio}
                interfaceLanguage={interfaceLanguage}
                labelWord={content.patternExample.word}
                size={19}
                t={t}
              />
            )}
          </div>

          <p className="spelling-basics-pattern-helper">
            {renderLocalizedText(content.patternExample.helper, interfaceLanguage)}
          </p>
        </section>
      )}

      <div className="spelling-basics-phonetic-closing-wrap">
        <p className="spelling-basics-phonetic-closing">{renderLocalizedText(content.closing, interfaceLanguage)}</p>
      </div>
    </>
  );
}

function createAudioLabel(word: string, interfaceLanguage: InterfaceLanguage) {
  return interfaceLanguage === 'cy'
    ? `Chwarae sain ar gyfer ${word}`
    : `Play audio for ${word}`;
}

function SpellingBasicsAudioButton({
  audio,
  interfaceLanguage,
  labelWord,
  size,
  t
}: {
  audio: SpellingBasicsAudioResolution;
  interfaceLanguage: InterfaceLanguage;
  labelWord: string;
  size: number;
  t: Translate;
}) {
  const [playbackFailed, setPlaybackFailed] = useState(false);
  const unavailable = playbackFailed || !audio.available;
  const unavailableLabel = `${labelWord}: ${t('spellingBasics.topic.audioUnavailable')}`;

  return (
    <button
      type="button"
      disabled={unavailable}
      aria-label={unavailable ? unavailableLabel : createAudioLabel(labelWord, interfaceLanguage)}
      title={unavailable ? t('spellingBasics.topic.audioUnavailable') : createAudioLabel(labelWord, interfaceLanguage)}
      data-audio-status={audio.audioStatus}
      onClick={event => {
        void handleSpellingBasicsExampleAudioClick(event, audio, {
          onUnavailable: () => setPlaybackFailed(true)
        }).then(played => {
          if (!played) setPlaybackFailed(true);
        });
      }}
    >
      <Volume2 size={size} strokeWidth={2.35} aria-hidden="true" />
    </button>
  );
}
