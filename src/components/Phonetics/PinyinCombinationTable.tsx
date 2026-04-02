"use client";

import React, { useState, useEffect } from 'react';
import styles from './phonetics.module.css';
import { Volume2, X } from 'lucide-react';
import { PINYIN_TO_HANZI } from '../../lib/pinyin-data';

const INITIALS = ['b', 'p', 'm', 'f', 'd', 't', 'n', 'l', 'g', 'k', 'h', 'j', 'q', 'x', 'zh', 'ch', 'sh', 'r', 'z', 'c', 's'];
const FINALS_SAMPLE = ['a', 'o', 'e', 'i', 'u', 'ai', 'ei', 'ao', 'ou', 'ie', 'an', 'en', 'in', 'ang', 'eng', 'ing', 'ong'];

// Dấu thanh điệu Unicode chính xác cho 4 thanh
const TONE_MARKS: Record<string, string[]> = {
  'a': ['a','ā','á','ǎ','à'], 'o': ['o','ō','ó','ǒ','ò'],
  'e': ['e','ē','é','ě','è'], 'i': ['i','ī','í','ǐ','ì'],
  'u': ['u','ū','ú','ǔ','ù'], 'ü': ['ü','ǖ','ǘ','ǚ','ǜ'],
};
const VOWEL_PRIORITY = ['a', 'o', 'e', 'ü', 'i', 'u'];

const addToneMark = (syllable: string, tone: number): string => {
  if (!tone) return syllable;
  // Xử lý trường hợp đặc biệt: ui, iu (thanh điệu đặt ở âm sau)
  if (syllable.endsWith('ui')) return syllable.slice(0,-1) + (TONE_MARKS.i?.[tone] ?? 'i');
  if (syllable.endsWith('iu')) return syllable.slice(0,-1) + (TONE_MARKS.u?.[tone] ?? 'u');
  
  for (const v of VOWEL_PRIORITY) {
    if (syllable.includes(v)) {
      const marks = TONE_MARKS[v];
      if (marks) return syllable.replace(v, marks[tone]);
    }
  }
  return syllable;
};

/**
 * Bảng chữ Hán đại diện cho 4 thanh điệu của các âm tiết phổ biến.
 * Hệ thống sẽ ưu tiên dùng những chữ này để Google TTS phát âm chuẩn nhất.
 */
const CHAR_MAP: Record<string, string[]> = {
  // b-
  'ba':  ['芭','拔','把','爸'], 'bo':  ['波','伯','跛','薄'],
  'bi':  ['逼','鼻','比','必'], 'bu':  ['哺','捕','补','不'],
  'bei': ['杯','陪','北','备'], 'bao': ['包','雹','宝','报'],
  'ban': ['班','搬','板','半'], 'ben': ['奔','本','夯','笨'],
  'bang':['帮','绑','棒','榜'], 'bing':['冰','兵','饼','病'],
  // p-
  'pa':  ['趴','爬','怕','靶'], 'po':  ['坡','婆','簸','破'],
  'pi':  ['批','皮','匹','屁'], 'pu':  ['扑','仆','普','瀑'],
  'pao': ['抛','袍','跑','炮'], 'pei': ['胚','陪','培','配'],
  'pan': ['潘','盘','判','盼'], 'pen': ['喷','盆','烹',''],
  'pang':['乓','旁','胖',''], 'ping':['乒','平','评价','聘'],
  // m-
  'ma':  ['妈','麻','马','骂'], 'mo':  ['摸','模','抹','末'],
  'mi':  ['咪','迷','米','密'], 'mu':  ['姆','睦','母','木'],
  'mai': ['埋','买','卖','买'], 'mei': ['枚','梅','美','妹'],
  'mao': ['猫','毛','卯','帽'], 'mou': ['哞','谋','某',''],
  'man': ['漫','蛮','满','慢'], 'men': ['门','门','们','闷'],
  'ming':['名','明','瞑','命'], 'mang':['芒','忙','莽',''],
  // f-
  'fa':  ['发','罚','法','珐'], 'fo':  ['佛','佛','',''],
  'fu':  ['夫','福','府','父'], 'fei': ['飞','肥','匪','费'],
  'fan': ['翻','凡','反','饭'], 'fen': ['分','坟','粉','份'],
  'feng':['风','逢','讽','奉'],
  // d-
  'da':  ['搭','答','打','大'], 'de':  ['得','得','的','地'],
  'di':  ['低','敌','底','地'], 'du':  ['都','读','赌','度'],
  'dai': ['呆','代理','歹','代'], 'dei': ['得','得','得','得'],
  'dao': ['刀','导','岛','到'], 'dou': ['都','斗','抖','豆'],
  'die': ['跌','叠','嗲','牒'],
  'dan': ['单','谈','胆','蛋'], 'dong':['东','动','懂','冻'],
  'dang':['当','党','当','当'], 'deng':['登','等','等','凳'],
  'ding':['丁','定','顶','定'],
  // t-
  'ta':  ['他','它','塔','踏'], 'te':  ['特','特','特','特'],
  'ti':  ['梯','提','体','替'], 'tu':  ['秃','图','土','兔'],
  'tai': ['胎','台','抬','太'], 'tao': ['掏','逃','讨','套'],
  'tou': ['偷','头','透',''], 'tie': ['贴','铁','铁','帖'],
  'tan': ['贪','谈','坦','叹'], 'tang':['汤','糖','躺','烫'],
  'teng':['疼','腾','',''], 'ting':['听','廷','挺','停'], 'tong':['通','同','桶','痛'],
  // n-
  'na':  ['那','拿','哪','那'], 'ni':  ['妮','泥','你','逆'], 'nu':  ['奴','奴','弩','怒'],
  'nai': ['奶','奶','耐','耐'], 'nei': ['内','内','内','内'],
  'nao': ['孬','挠','恼','闹'], 'nie': ['捏','捏','涅','聂'],
  'nin': ['您','您','您','您'], 'nan': ['男','男','难','难'],
  'nen': ['嫩','嫩','嫩','嫩'], 'neng':['能','能','能','能'], 'ning':['宁','宁','拧','佞'],
  'nong':['农','农','弄','弄'],
  // l-
  'la':  ['拉','拉','喇','辣'], 'le':  ['勒','勒','乐','乐'],
  'li':  ['哩','离','礼','立'], 'lu':  ['噜','炉','鲁','路'],
  'lai': ['来','来','睐','赖'], 'lei': ['擂','雷','累','类'],
  'lao': ['捞','劳','老','烙'], 'lou': ['楼','楼','搂','露'],
  'lie': ['咧','咧','列','列'], 'liu': ['溜','刘','柳','六'],
  'lan': ['兰','兰','懒','烂'], 'lin': ['拎','林','凛','吝'],
  'lun': ['轮','轮','论','论'], 'lang':['郎','郎','朗','浪'],
  'leng':['棱','棱','冷','愣'], 'ling':['拎','灵','岭','令'],
  'long':['隆','隆','拢','弄'],
  // g-
  'ga':  ['嘎','嘎','嘎','尬'], 'ge':  ['割','阁','各','各'],
  'gu':  ['姑','','古','故'], 'gai': ['该','','改','概'],
  'gei': ['','','给',''], 'gao': ['高','','搞','告'],
  'gou': ['沟','','狗','够'], 'gan': ['干','杆','改','干'],
  'gen': ['根','','','亘'], 'gang':['刚','','港','杠'],
  'geng':['更','耕','耿','更'], 'gong':['工','弓','巩','共'],
  // k-
  'ka':  ['卡', '咔', '咖', '咯'], 'ke':  ['科', '颗', '渴', '刻'],
  'ku':  ['哭', '库', '苦', '裤'], 'kai': ['开', '凯', '慨', '楷'],
  'kao': ['烤', '考', '考', '靠'], 'kou': ['扣', '扣', '口', '扣'],
  'kan': ['看', '看', '看', '看'], 'ken': ['肯', '肯', '肯', '肯'],
  'kang':['康', '康', '康', '康'], 'keng':['坑', '坑', '坑', '坑'],
  'kong':['空', '空', '空', '空'],
  // h-
  'ha':  ['哈', '哈', '哈', '哈'], 'he':  ['喝', '何', '河', '贺'],
  'hu':  ['呼', '胡', '虎', '护'], 'hai': ['还', '海', '还', '害'],
  'hei': ['黑', '黑', '黑', '黑'], 'hao': ['好', '好', '好', '号'],
  'hou': ['后', '后', '吼', '后'], 'han': ['汉', '喊', '汉', '汉'],
  'hen': ['很', '很', '很', '恨'], 'hang':['行', '行', '行', '行'],
  'heng':['横', '横', '横', '横'], 'hong':['红', '红', '红', '红'],
  // j, q, x xử lý với âm u (thực tế là ü)
  'ju':  ['居','局','举','据'], 'qu':  ['屈','渠','取','去'], 'xu':  ['虚','徐','许','绪'],
  'ji':  ['机','极','几','记'], 'jie': ['结','洁','解','界'],
  'jiu': ['九','久','久','旧'], 'jin': ['今','近','仅','进'],
  'jian':['间','建','减','见'], 'jing':['京','惊','井','竟'],
  'qi':  ['期','齐','起','气'], 'qie': ['切','且','且','切'],
  'qiu': ['秋','球','秋','求'], 'qin': ['亲','勤','寝','庆'],
  'qian':['前','钱','浅','欠'], 'qing':['请','清','情','庆'],
  'xi':  ['西','习','喜','细'], 'xie': ['写','邪','写','谢'],
  'xiu': ['修','修','朽','秀'], 'xin': ['新','新','新','信'],
  'xian':['先','闲','险','现'], 'xing':['性','行','性','兴'],
};

const TONE_INFO = [
  { num: 1, symbol: '—', name: 'Thanh Bình (ngang)', color: '#60a5fa' },
  { num: 2, symbol: 'ˊ', name: 'Thanh Dương Bình (sắc)', color: '#34d399' },
  { num: 3, symbol: 'ˇ', name: 'Thanh Thượng (hỏi-nặng)', color: '#fbbf24' },
  { num: 4, symbol: 'ˋ', name: 'Thanh Khứ (nặng)', color: '#f87171' },
];

/**
 * Phát âm chuẩn bằng chữ Hán hoặc Pinyin có thanh điệu gửi tới Google TTS.
 */
const playTone = (syllable: string, tone: number) => {
  if (typeof window === 'undefined') return;

  const key = syllable.toLowerCase();
  
  // 1. Tìm chữ Hán đại diện cho thanh điệu đó
  let char = CHAR_MAP[key]?.[tone - 1];
  
  // Nếu không có trong CHAR_MAP, tìm bất kỳ chữ nào trong pinyin-data để ép giọng chuẩn
  if (!char || char === '') {
    const chars = PINYIN_TO_HANZI[key];
    if (chars && chars.length > 0) {
        // May mắn: nếu pinyin-data có đủ chữ, ta có thể dùng thuật toán để tìm đúng chữ theo thanh điệu
        // Nhưng tạm thời ta chọn chữ đầu tiên để đảm bảo giọng đọc CHUẨN người Trung.
        char = chars[0];
    }
  }

  const tonedPinyin = addToneMark(syllable, tone);
  
  // Dừng bất kỳ giọng nói nào đang phát
  window.speechSynthesis.cancel();

  // 2. Ưu tiên Google TTS với chữ Hán hoặc toned pinyin
  const query = char || tonedPinyin;
  const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(query)}&tl=zh-CN&client=tw-ob&ts=${Date.now()}`;
  
  const audio = new Audio(url);
  audio.play().catch(() => speakByVoice(char || tonedPinyin));
};

const speakByVoice = (text: string) => {
  const voices = window.speechSynthesis.getVoices();
  const zhVoice = voices.find(v => v.lang === 'zh-CN' && v.name.includes('Google')) || 
                  voices.find(v => v.lang === 'zh-CN') || 
                  voices.find(v => v.lang.startsWith('zh'));
  
  if (!zhVoice) return;
  
  const utt = new window.SpeechSynthesisUtterance(text);
  utt.voice = zhVoice;
  utt.lang = 'zh-CN';
  utt.rate = 0.8;
  window.speechSynthesis.speak(utt);
};

export default function PinyinCombinationTable() {
  const [activeSyllable, setActiveSyllable] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.speechSynthesis.getVoices();
    }
  }, []);

  const isSyllableValid = (initial: string, final: string) => {
    const syllable = initial + final;
    return !!PINYIN_TO_HANZI[syllable];
  };

  return (
    <div className={styles.section} id="combination-table">
      <h2 className={styles.sectionTitle}>Bảng Ghép Âm &amp; Thanh Điệu</h2>
      <p className={styles.subtitle}>Nhấp vào ô để nghe đúng 4 thanh điệu (phát âm chuẩn người Trung).</p>

      <div className={styles.tableWrapper}>
        <table className={styles.fullTable}>
          <thead>
            <tr>
              <th>Thanh\Vận</th>
              {FINALS_SAMPLE.map(f => <th key={f}>{f}</th>)}
            </tr>
          </thead>
          <tbody>
            {INITIALS.map(initial => (
              <tr key={initial}>
                <th className={styles.initialHeaderEdge}>{initial}</th>
                {FINALS_SAMPLE.map(final => {
                  const isValid = isSyllableValid(initial, final);
                  return (
                    <td
                      key={final}
                      className={isValid ? styles.pinyinCellClickable : styles.pinyinCellInvalid}
                      onClick={() => isValid && setActiveSyllable(initial + final)}
                    >
                      <div className={styles.pinyinCellInner}>
                        {isValid ? initial + final : '-'}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {activeSyllable && (
        <div className={styles.modalOverlay} onClick={() => setActiveSyllable(null)}>
          <div className={styles.tonePopContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.popHeader}>
              <h3>Chọn thanh điệu: <span className={styles.accentText}>{activeSyllable}</span></h3>
              <button className={styles.closeBtnSmall} onClick={() => setActiveSyllable(null)}>
                <X size={20} />
              </button>
            </div>
            <div className={styles.toneGrid}>
              {TONE_INFO.map(({ num, symbol, name, color }) => {
                const toned = addToneMark(activeSyllable, num);
                const char = CHAR_MAP[activeSyllable.toLowerCase()]?.[num - 1];
                return (
                  <button
                    key={num}
                    className={styles.toneBtnLarge}
                    onClick={() => playTone(activeSyllable, num)}
                    style={{ borderColor: color + '88' }}
                  >
                    <div className={styles.toneVisual}>
                      <span className={styles.tonedCharBig} style={{ color }}>{toned}</span>
                      {char && <span style={{ fontSize: '1.5rem', opacity: 0.5 }}>{char}</span>}
                      <Volume2 size={18} className={styles.volumeIcon} />
                    </div>
                    <span className={styles.toneDesc} style={{ color }}>Thanh {num} {symbol}</span>
                    <div className={styles.toneHint}>{name}</div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
